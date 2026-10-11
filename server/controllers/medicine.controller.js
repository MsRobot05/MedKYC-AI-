const meds = require('../data/genericMeds.json');

exports.searchMedicine = (req, res) => {
  const { query } = req.query;
  const results = meds.filter((m) => m.brand.toLowerCase().includes((query || '').toLowerCase()));
  res.json(results);
};