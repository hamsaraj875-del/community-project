const Complaint = require('../models/Complaint');

// Overall stats (accessible to authenticated users for dashboards)
const getStats = async (req, res) => {
  try {
    const [total, received, inProgress, resolved] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'Received' }),
      Complaint.countDocuments({ status: 'In Progress' }),
      Complaint.countDocuments({ status: 'Resolved' }),
    ]);

    const categoryStats = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const areaStats = await Complaint.aggregate([
      {
        $group: {
          _id: '$area',
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
          received: { $sum: { $cond: [{ $eq: ['$status', 'Received'] }, 1, 0] } },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json({ total, received, inProgress, resolved, categoryStats, areaStats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Area insights
const getAreaInsights = async (req, res) => {
  try {
    const area = decodeURIComponent(req.params.area);
    const complaints = await Complaint.find({ area: new RegExp(`^${area}$`, 'i') })
      .populate('citizen', 'name')
      .sort({ createdAt: -1 });

    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;
    const inProgress = complaints.filter(c => c.status === 'In Progress').length;
    const pending = complaints.filter(c => c.status === 'Received').length;
    const resolutionRate = total ? Math.round((resolved / total) * 100) : 0;

    const categoryCounts = {};
    complaints.forEach(c => { categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1; });
    const mostCommonCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    res.json({ area, total, resolved, inProgress, pending, resolutionRate, mostCommonCategory, complaints });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// All distinct areas
const getAreas = async (req, res) => {
  try {
    const areas = await Complaint.distinct('area');
    res.json(areas.sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getStats,
  getAreaInsights,
  getAreas,
};
