const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

const SLOT_MS = 30 * 60 * 1000;
const MIN_LEAD_MS = 30 * 60 * 1000;
const MAX_AHEAD_MS = 60 * 24 * 60 * 60 * 1000;

exports.listDoctors = async (req, res) => {
  try {
    res.json(await User.find({ role: 'doctor' }).select('name').sort({ name: 1 }).lean());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.takenSlots = async (req, res) => {
  try {
    const { doctorId } = req.query;
    if (!mongoose.isValidObjectId(doctorId)) return res.status(400).json({ message: 'Invalid doctor' });
    const rows = await Appointment.find({ doctor: doctorId, active: true, date: { $gte: new Date() } })
      .select('date')
      .lean();
    res.json(rows.map((r) => r.date));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { doctorId, date, reason } = req.body;
    if (!mongoose.isValidObjectId(doctorId)) return res.status(400).json({ message: 'Pick a doctor' });

    const when = new Date(date);
    if (Number.isNaN(when.getTime())) return res.status(400).json({ message: 'Pick a valid date and time' });
    if (when.getTime() % SLOT_MS !== 0) return res.status(400).json({ message: 'Appointments start on the hour or half hour' });

    const now = Date.now();
    if (when.getTime() < now + MIN_LEAD_MS) return res.status(400).json({ message: 'Choose a time at least 30 minutes from now' });
    if (when.getTime() > now + MAX_AHEAD_MS) return res.status(400).json({ message: 'You can book up to 60 days ahead' });

    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' }).select('_id');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const appt = await Appointment.create({
      patient: req.user.id,
      doctor: doctor._id,
      date: when,
      reason: String(reason || '').trim().slice(0, 300),
    });
    res.status(201).json(appt);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'That slot was just taken. Pick another time.' });
    res.status(500).json({ message: err.message });
  }
};

exports.mine = async (req, res) => {
  try {
    const filter = req.user.role === 'doctor' ? { doctor: req.user.id } : { patient: req.user.id };
    const list = await Appointment.find(filter)
      .sort({ date: 1 })
      .limit(200)
      .populate('doctor', 'name')
      .populate('patient', 'name')
      .lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.setStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid appointment' });

    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });

    const isTheDoctor = req.user.role === 'doctor' && String(appt.doctor) === String(req.user.id);
    const isThePatient = String(appt.patient) === String(req.user.id);
    if (!isTheDoctor && !isThePatient) return res.status(403).json({ message: 'Not your appointment' });
    if (!isTheDoctor && status !== 'cancelled') return res.status(403).json({ message: 'Patients can only cancel' });
    if (['cancelled', 'completed'].includes(appt.status)) {
      return res.status(400).json({ message: `This appointment is already ${appt.status}` });
    }

    appt.status = status;
    appt.active = status !== 'cancelled';
    await appt.save();
    res.json(appt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};