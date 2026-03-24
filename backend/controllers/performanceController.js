const Performance = require('../models/Performance');

exports.getAllPerformanceReviews = async (req, res) => {
  try {
    const reviews = await Performance.find().populate('employee');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPerformanceReviewById = async (req, res) => {
  try {
    const review = await Performance.findById(req.params.id).populate('employee');
    if (!review) return res.status(404).json({ error: 'Performance review not found' });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createPerformanceReview = async (req, res) => {
  try {
    const newReview = new Performance(req.body);
    await newReview.save();
    res.status(201).json(newReview);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updatePerformanceReview = async (req, res) => {
  try {
    const updated = await Performance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Performance review not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deletePerformanceReview = async (req, res) => {
  try {
    const deleted = await Performance.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Performance review not found' });
    res.json({ message: 'Performance review deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
