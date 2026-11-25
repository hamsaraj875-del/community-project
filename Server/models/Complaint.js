const mongoose = require('mongoose');

const remarkSchema = new mongoose.Schema({
  text: { type: String, required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  addedAt: { type: Date, default: Date.now },
});

const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['Roads & Infrastructure', 'Water Supply', 'Electricity', 'Garbage & Sanitation', 'Street Lights', 'Parks & Recreation', 'Public Safety', 'Drainage', 'Other'],
  },
  area: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  image: { type: String, default: null },
  status: {
    type: String,
    enum: ['Received', 'In Progress', 'Resolved'],
    default: 'Received',
  },
  citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  remarks: [remarkSchema],

  // AI Verification Fields
  verificationStatus: {
    type: String,
    enum: ['pending', 'matched', 'mismatch_detected', 'needs_review', 'verification_failed'],
    default: 'pending',
  },
  verificationScore: { type: Number, default: null },
  verificationReason: { type: String, default: null },
  verifiedAt: { type: Date, default: null },

  // Manual Authority Review Fields
  manualReviewStatus: {
    type: String,
    enum: ['none', 'approved', 'rejected'],
    default: 'none',
  },
  manualReviewReason: { type: String, default: null },
  manualReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  manualReviewedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
