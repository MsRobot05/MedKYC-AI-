const mongoose = require('mongoose');
const Vital = require('../models/Vital');
const { TYPES, validate, classify } = require('../utils/vitals');

const MAX_PER_USER = 3000;
const withStatus = (r) => ({ ...r, status: classify(r.type, r) });

exports.list = async (req, res) => {
  try {
    const filter = { user: req.user.id };
    if (req.query.type) {
      if (!TYPES.includes(req.query.type)) return res.status(400).json({ message: 'Unknown reading type' });
      filter.type = req.query.type;
    }
    const rows = await Vital.find(filter).sort({ measuredAt: -1 }).limit(120).lean();
    res.json(rows.map(withStatus));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.add = async (req, res) => {
  try {
    const type = String(req.body.type || '');
    const { data, error } = validate(type, req.body);
    if (error) return res.status(400).json({ message: error });

    let measuredAt = new Date();
    if (req.body.measuredAt) {
      measuredAt = new Date(req.body.measuredAt);
      if (Number.isNaN(measuredAt.getTime())) return res.status(400).json({ message: 'That date is not valid' });
      const now = Date.now();
      if (measuredAt.getTime() > now + 5 * 60 * 1000) return res.status(400).json({ message: 'That time is in the future' });
      if (measuredAt.getTime() < now - 5 * 365 * 24 * 3600 * 1000) return res.status(400).json({ message: 'That date is too old' });
    }

    if ((await Vital.countDocuments({ user: req.user.id })) >= MAX_PER_USER) {
      return res.status(400).json({ message: 'Reading limit reached. Delete some old readings first.' });
    }

    const doc = await Vital.create({
      user: req.user.id,
      type,
      ...data,
      note: String(req.body.note || '').trim().slice(0, 200),
      measuredAt,
    });
    res.status(201).json(withStatus(doc.toObject()));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid reading' });
    const del = await Vital.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!del) return res.status(404).json({ message: 'Reading not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};