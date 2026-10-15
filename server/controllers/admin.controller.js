const User = require('../models/User');
const BloodBank = require('../models/BloodBank');
const BloodRequest = require('../models/BloodRequest');
const Ambulance = require('../models/Ambulance');
const Visit = require('../models/Visit');

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const LOW_STOCK_TOTAL = 10; // a blood group is "low" when all banks together hold fewer units than this
const DAY_MS = 24 * 60 * 60 * 1000;
const pad = (n) => String(n).padStart(2, '0');

function lastDays(n) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: n }, (_, i) => new Date(today.getTime() - (n - 1 - i) * DAY_MS));
}

async function dailyCounts(Model, n) {
  const days = lastDays(n);
  const docs = await Model.find({ createdAt: { $gte: days[0] } }).select('createdAt').lean();
  return days.map((d) => {
    const from = d.getTime();
    const to = from + DAY_MS;
    const count = docs.filter((x) => {
      const t = new Date(x.createdAt).getTime();
      return t >= from && t < to;
    }).length;
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      count,
    };
  });
}

exports.getOverview = async (req, res) => {
  try {
    const [patients, doctors, admins, bloodBanks, ambulances, availableAmbulances, totalVisits, pendingRequests] =
      await Promise.all([
        User.countDocuments({ role: 'patient' }),
        User.countDocuments({ role: 'doctor' }),
        User.countDocuments({ role: 'admin' }),
        BloodBank.countDocuments(),
        Ambulance.countDocuments(),
        Ambulance.countDocuments({ available: true }),
        Visit.countDocuments(),
        BloodRequest.countDocuments({ status: 'pending' }),
      ]);

    const banks = await BloodBank.find().lean();
    const bloodByGroup = GROUPS.map((group) => ({
      group,
      units: banks.reduce((sum, b) => sum + (b.stock?.[group] || 0), 0),
    }));
    const lowStock = bloodByGroup.filter((g) => g.units < LOW_STOCK_TOTAL).map((g) => g.group);

    const [visitsDaily, signupsDaily, recentVisits, recentRequests] = await Promise.all([
      dailyCounts(Visit, 7),
      dailyCounts(User, 7),
      Visit.find().sort({ createdAt: -1 }).limit(6).populate('patient', 'name').populate('doctor', 'name').lean(),
      BloodRequest.find().sort({ createdAt: -1 }).limit(6).populate('patient', 'name').populate('bloodBank', 'name').lean(),
    ]);

    res.json({
      counts: { patients, doctors, admins, bloodBanks, ambulances, availableAmbulances, totalVisits, pendingRequests },
      visitsDaily,
      signupsDaily,
      bloodByGroup,
      lowStock,
      recentVisits,
      recentRequests,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- Users ----------
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('name email role createdAt').sort({ createdAt: -1 }).limit(500).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['patient', 'doctor', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ message: "You can't change your own role" });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('name email role createdAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- Blood banks ----------
exports.listBloodBanks = async (req, res) => {
  try {
    res.json(await BloodBank.find().sort({ name: 1 }).lean());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBloodStock = async (req, res) => {
  try {
    const { group, units } = req.body;
    if (!GROUPS.includes(group)) return res.status(400).json({ message: 'Invalid blood group' });
    if (!Number.isInteger(units) || units < 0 || units > 999) {
      return res.status(400).json({ message: 'Units must be a whole number from 0 to 999' });
    }
    const bank = await BloodBank.findByIdAndUpdate(
      req.params.id,
      { $set: { [`stock.${group}`]: units } },
      { new: true }
    ).lean();
    if (!bank) return res.status(404).json({ message: 'Blood bank not found' });
    res.json(bank);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- Ambulances ----------
exports.listAmbulances = async (req, res) => {
  try {
    res.json(await Ambulance.find().sort({ vehicleNumber: 1 }).lean());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateAmbulance = async (req, res) => {
  try {
    if (typeof req.body.available !== 'boolean') {
      return res.status(400).json({ message: '"available" must be true or false' });
    }
    const amb = await Ambulance.findByIdAndUpdate(req.params.id, { available: req.body.available }, { new: true }).lean();
    if (!amb) return res.status(404).json({ message: 'Ambulance not found' });
    res.json(amb);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- Blood requests ----------
exports.listBloodRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('patient', 'name email')
      .populate('bloodBank', 'name')
      .lean();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBloodRequest = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const request = await BloodRequest.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean();
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};