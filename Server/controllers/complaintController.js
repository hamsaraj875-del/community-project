const Complaint = require('../models/Complaint');
const cloudinary = require('../config/cloudinary');
const { verifyComplaintImage } = require('../services/aiVerificationService');

// Helper to stream upload buffer to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'civicvision/complaints',
        resource_type: 'image',
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// Submit complaint (citizen) — photo is required and uploaded to Cloudinary
const createComplaint = async (req, res) => {
  try {
    const { title, description, category, area, address } = req.body;

    if (!title || !description || !category || !area || !address) {
      return res.status(400).json({ message: 'All text fields are required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'A photo of the problem is required' });
    }

    // Upload to Cloudinary
    let imageUrl = null;
    try {
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      imageUrl = uploadResult.secure_url;
    } catch (uploadErr) {
      console.error('Cloudinary upload error:', uploadErr);
      return res.status(500).json({ message: 'Failed to upload image to Cloudinary: ' + (uploadErr.message || 'Unknown error') });
    }

    // AI-Powered Verification of Complaint Image
    let aiVerification = {
      verificationStatus: 'pending',
      verificationScore: null,
      verificationReason: null,
      verifiedAt: null,
    };

    try {
      aiVerification = await verifyComplaintImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        category,
        title,
        description
      );
    } catch (aiErr) {
      console.warn('AI Verification failed or timed out:', aiErr.message);
      aiVerification.verificationStatus = 'verification_failed';
      aiVerification.verificationReason = 'AI verification service offline. Queued for manual authority review.';
      aiVerification.verifiedAt = new Date();
    }

    const complaint = await Complaint.create({
      title,
      description,
      category,
      area,
      address,
      image: imageUrl,
      citizen: req.user._id,
      verificationStatus: aiVerification.verificationStatus,
      verificationScore: aiVerification.verificationScore,
      verificationReason: aiVerification.verificationReason,
      verifiedAt: aiVerification.verifiedAt,
    });

    await complaint.populate('citizen', 'name email phone');
    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get own complaints (citizen)
const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ citizen: req.user._id })
      .sort({ createdAt: -1 })
      .populate('citizen', 'name email phone');
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all complaints with filters (authority)
const getAllComplaints = async (req, res) => {
  try {
    const { status, category, area, verificationStatus, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (verificationStatus) filter.verificationStatus = verificationStatus;
    if (area) filter.area = new RegExp(area, 'i');
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { area: new RegExp(search, 'i') },
      ];
    }
    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('citizen', 'name email phone')
      .populate('manualReviewedBy', 'name');
    res.json({ complaints, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update status, manual review and add remark (authority)
const updateComplaint = async (req, res) => {
  try {
    const { status, remark, manualReviewStatus, manualReviewReason } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    
    if (status) complaint.status = status;
    
    // Handle manual review decision override (Approved or Rejected by Authority)
    if (manualReviewStatus) {
      complaint.manualReviewStatus = manualReviewStatus;
      complaint.manualReviewReason = manualReviewReason || null;
      complaint.manualReviewedBy = req.user._id;
      complaint.manualReviewedAt = new Date();
    }

    if (remark && remark.trim()) {
      complaint.remarks.push({ text: remark.trim(), addedBy: req.user._id });
    }
    await complaint.save();
    await complaint.populate('citizen', 'name email phone');
    await complaint.populate('remarks.addedBy', 'name');
    await complaint.populate('manualReviewedBy', 'name');
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single complaint by ID
const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('citizen', 'name email phone')
      .populate('remarks.addedBy', 'name')
      .populate('manualReviewedBy', 'name');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    if (req.user.role === 'citizen' && complaint.citizen._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update complaint details by citizen owner (title, description, address)
const updateCitizenComplaint = async (req, res) => {
  try {
    const { title, description, address } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (complaint.citizen.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this complaint' });
    }

    if (title) complaint.title = title.trim();
    if (description) complaint.description = description.trim();
    if (address) complaint.address = address.trim();

    await complaint.save();
    await complaint.populate('citizen', 'name email phone');
    await complaint.populate('remarks.addedBy', 'name');
    await complaint.populate('manualReviewedBy', 'name');
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete complaint (allowed by citizen owner or authority)
const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const isOwner = complaint.citizen.toString() === req.user._id.toString();
    const isAuthority = req.user.role === 'authority';

    if (!isOwner && !isAuthority) {
      return res.status(403).json({ message: 'Not authorized to delete this complaint' });
    }

    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ message: 'Complaint deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaint,
  getComplaintById,
  updateCitizenComplaint,
  deleteComplaint,
};
