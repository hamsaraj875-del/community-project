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
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
