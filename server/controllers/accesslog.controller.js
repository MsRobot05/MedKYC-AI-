const AccessLog = require('../models/AccessLog');

exports.mine = async (req, res) => {
  try {
    const logs = await AccessLog.find({ patient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('viewer', 'name')
      .lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};