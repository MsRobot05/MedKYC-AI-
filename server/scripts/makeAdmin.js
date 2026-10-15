require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email) {
    console.log('Usage: node scripts/makeAdmin.js <email> [password]');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.role = 'admin';
    await existing.save();
    console.log(`Promoted existing user ${email} to admin`);
  } else {
    if (!password) {
      console.log('No such user. To create one: node scripts/makeAdmin.js <email> <password>');
      process.exit(1);
    }
    await User.create({ name: 'Admin', email, password: await bcrypt.hash(password, 10), role: 'admin' });
    console.log(`Created admin user ${email}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});