require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const BloodBank = require('./models/BloodBank');
const Ambulance = require('./models/Ambulance');
const User = require('./models/User');
const Patient = require('./models/Patient');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB — seeding data...');

  // ---------- BLOOD BANKS ----------
  await BloodBank.deleteMany({});
  await BloodBank.insertMany([
    { name: 'City General Blood Bank', address: 'MG Road, Pune', phone: '+912012345678', lat: 18.5204, lng: 73.8567, stock: { 'O+': 12, 'A+': 8, 'B+': 5, 'AB+': 2, 'O-': 3, 'A-': 1, 'B-': 0, 'AB-': 0 } },
    { name: 'Sahyadri Hospital Blood Bank', address: 'Kothrud, Pune', phone: '+912087654321', lat: 18.5074, lng: 73.8077, stock: { 'O+': 5, 'A+': 10, 'B+': 6, 'AB+': 1, 'O-': 0, 'A-': 2, 'B-': 1, 'AB-': 0 } },
    { name: 'Ruby Hall Clinic Blood Bank', address: 'Sassoon Road, Pune', phone: '+912011223344', lat: 18.5314, lng: 73.8770, stock: { 'O+': 20, 'A+': 15, 'B+': 9, 'AB+': 4, 'O-': 6, 'A-': 3, 'B-': 2, 'AB-': 1 } },
    { name: 'Jehangir Hospital Blood Bank', address: 'Sassoon Road, Pune', phone: '+912026058888', lat: 18.5279, lng: 73.8763, stock: { 'O+': 14, 'A+': 6, 'B+': 11, 'AB+': 3, 'O-': 4, 'A-': 2, 'B-': 0, 'AB-': 1 } },
    { name: 'Deenanath Mangeshkar Hospital Blood Bank', address: 'Erandwane, Pune', phone: '+912040151000', lat: 18.5049, lng: 73.8256, stock: { 'O+': 9, 'A+': 7, 'B+': 4, 'AB+': 0, 'O-': 2, 'A-': 1, 'B-': 3, 'AB-': 0 } },
    { name: 'Noble Hospital Blood Bank', address: 'Hadapsar, Pune', phone: '+912066759100', lat: 18.5089, lng: 73.9260, stock: { 'O+': 6, 'A+': 4, 'B+': 8, 'AB+': 2, 'O-': 1, 'A-': 0, 'B-': 1, 'AB-': 0 } },
    { name: 'Sancheti Hospital Blood Bank', address: 'Shivajinagar, Pune', phone: '+912066229999', lat: 18.5309, lng: 73.8474, stock: { 'O+': 11, 'A+': 9, 'B+': 7, 'AB+': 2, 'O-': 5, 'A-': 2, 'B-': 1, 'AB-': 0 } },
    { name: 'Poona Hospital Blood Bank', address: 'Sadashiv Peth, Pune', phone: '+912024331100', lat: 18.5122, lng: 73.8549, stock: { 'O+': 8, 'A+': 5, 'B+': 3, 'AB+': 1, 'O-': 2, 'A-': 1, 'B-': 0, 'AB-': 0 } },
  ]);
  console.log('✔ Blood banks seeded (8 entries)');

  // ---------- AMBULANCES ----------
  await Ambulance.deleteMany({});
  await Ambulance.insertMany([
    { driverName: 'Suresh Patil', vehicleNumber: 'MH12 AB 1234', phone: '+919812345670', lat: 18.5204, lng: 73.8567, available: true },
    { driverName: 'Ramesh Yadav', vehicleNumber: 'MH12 CD 5678', phone: '+919812345671', lat: 18.5104, lng: 73.8467, available: true },
    { driverName: 'Amit Kale', vehicleNumber: 'MH12 EF 9012', phone: '+919812345672', lat: 18.5304, lng: 73.8667, available: false },
    { driverName: 'Vijay Deshmukh', vehicleNumber: 'MH12 GH 3456', phone: '+919812345673', lat: 18.5074, lng: 73.8077, available: true },
    { driverName: 'Sunil Jadhav', vehicleNumber: 'MH12 IJ 7890', phone: '+919812345674', lat: 18.5314, lng: 73.8770, available: true },
    { driverName: 'Prakash More', vehicleNumber: 'MH12 KL 2345', phone: '+919812345675', lat: 18.5089, lng: 73.9260, available: false },
    { driverName: 'Nitin Gaikwad', vehicleNumber: 'MH12 MN 6789', phone: '+919812345676', lat: 18.5309, lng: 73.8474, available: true },
    { driverName: 'Sandeep Bhosale', vehicleNumber: 'MH12 OP 0123', phone: '+919812345677', lat: 18.5122, lng: 73.8549, available: true },
  ]);
  console.log('✔ Ambulances seeded (8 entries)');

  // ---------- USERS (auth only — name, email, password, role, guardianOf) ----------
  const demoUsers = [
    { name: 'Dr. Anjali Rao', email: 'dr.rao@medkyc.com', password: 'demo1234', role: 'doctor' },
    { name: 'Dr. Vikram Shah', email: 'dr.shah@medkyc.com', password: 'demo1234', role: 'doctor' },

    { name: 'Priya Kulkarni', email: 'priya.k@example.com', password: 'demo1234', role: 'patient' },
    { name: 'Arjun Mehta', email: 'arjun.m@example.com', password: 'demo1234', role: 'patient' },
    { name: 'Neha Desai', email: 'neha.desai@example.com', password: 'demo1234', role: 'patient' },
    { name: 'Imran Sheikh', email: 'imran.sheikh@example.com', password: 'demo1234', role: 'patient' },
    { name: 'Meera Iyer', email: 'meera.iyer@example.com', password: 'demo1234', role: 'patient' },

    // ---- Minor patients (linked to a parent below) ----
    { name: 'Aarav Kulkarni', email: 'aarav.k@example.com', password: 'demo1234', role: 'patient' },
    { name: 'Diya Mehta', email: 'diya.m@example.com', password: 'demo1234', role: 'patient' },

    // ---- Parent/guardian accounts ----
    { name: 'Sunita Kulkarni', email: 'sunita.k@example.com', password: 'demo1234', role: 'parent', guardianOfEmails: ['aarav.k@example.com'] },
    { name: 'Rohit Mehta', email: 'rohit.m@example.com', password: 'demo1234', role: 'parent', guardianOfEmails: ['diya.m@example.com'] },
  ];

  const userByEmail = {};

  for (const u of demoUsers) {
    const { guardianOfEmails, ...userData } = u;
    let user = await User.findOne({ email: u.email });
    if (!user) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      user = await User.create({ ...userData, password: hashedPassword });
      console.log(`✔ Created user: ${u.email} (${u.role}) (password: ${u.password})`);
    } else {
      console.log(`— Skipped (already exists): ${u.email}`);
    }
    userByEmail[u.email] = user;
  }

  // ---------- LINK PARENTS TO THEIR CHILDREN ----------
  for (const u of demoUsers) {
    if (u.role === 'parent' && u.guardianOfEmails?.length) {
      const parent = userByEmail[u.email];
      const childIds = u.guardianOfEmails
        .map((childEmail) => userByEmail[childEmail]?._id)
        .filter(Boolean);

      if (childIds.length) {
        await User.findByIdAndUpdate(parent._id, { guardianOf: childIds });
        console.log(`✔ Linked ${u.email} as guardian of ${u.guardianOfEmails.join(', ')}`);
      }
    }
  }

  // ---------- PATIENT MEDICAL PROFILES (linked via user ref) ----------
  const medicalProfiles = [
    {
      email: 'priya.k@example.com',
      dob: new Date('1996-04-18'),
      bloodGroup: 'B+',
      allergies: ['Penicillin', 'Dust'],
      medications: ['Metformin 500mg', 'Vitamin D3 (weekly)'],
      pastSurgeries: ['Appendectomy 2019'],
      emergencyContactName: 'Sunita Kulkarni',
      emergencyContactPhone: '+919812340001',
      consent: { shareAllergies: true, shareHistory: true, shareMedications: true },
    },
    {
      email: 'arjun.m@example.com',
      dob: new Date('1998-11-02'),
      bloodGroup: 'O+',
      allergies: ['Peanuts'],
      medications: [],
      pastSurgeries: [],
      emergencyContactName: 'Rohit Mehta',
      emergencyContactPhone: '+919812340002',
      consent: { shareAllergies: true, shareHistory: false, shareMedications: true },
    },
    {
      email: 'aarav.k@example.com',
      dob: new Date('2016-03-12'),
      bloodGroup: 'A-',
      allergies: ['Penicillin'],
      medications: ['Cetirizine 5mg (as needed)'],
      pastSurgeries: [],
      emergencyContactName: 'Sunita Kulkarni',
      emergencyContactPhone: '+919812340001',
      consent: { shareAllergies: true, shareHistory: true, shareMedications: true },
    },
    {
      email: 'diya.m@example.com',
      dob: new Date('2018-07-25'),
      bloodGroup: 'AB+',
      allergies: [],
      medications: [],
      pastSurgeries: ['Tonsillectomy 2023'],
      emergencyContactName: 'Rohit Mehta',
      emergencyContactPhone: '+919812340002',
      consent: { shareAllergies: false, shareHistory: true, shareMedications: false },
    },
    {
      email: 'neha.desai@example.com',
      dob: new Date('1990-09-14'),
      bloodGroup: 'O-',
      allergies: ['Sulfa drugs', 'Latex'],
      medications: ['Levothyroxine 50mcg'],
      pastSurgeries: ['C-Section 2021'],
      emergencyContactName: 'Karan Desai',
      emergencyContactPhone: '+919812340003',
      consent: { shareAllergies: true, shareHistory: true, shareMedications: true },
    },
    {
      email: 'imran.sheikh@example.com',
      dob: new Date('1985-01-30'),
      bloodGroup: 'B-',
      allergies: [],
      medications: ['Atorvastatin 10mg', 'Amlodipine 5mg'],
      pastSurgeries: ['Angioplasty 2022'],
      emergencyContactName: 'Farha Sheikh',
      emergencyContactPhone: '+919812340004',
      consent: { shareAllergies: true, shareHistory: true, shareMedications: false },
    },
    {
      email: 'meera.iyer@example.com',
      dob: new Date('2001-06-09'),
      bloodGroup: 'AB-',
      allergies: ['Ibuprofen'],
      medications: [],
      pastSurgeries: [],
      emergencyContactName: 'Suresh Iyer',
      emergencyContactPhone: '+919812340005',
      consent: { shareAllergies: true, shareHistory: false, shareMedications: false },
    },
  ];

  for (const profile of medicalProfiles) {
    const { email, ...data } = profile;
    const user = userByEmail[email];
    if (!user) {
      console.log(`— Skipped (user not found): ${email}`);
      continue;
    }

    let patient = await Patient.findOne({ user: user._id });
    if (!patient) {
      patient = await Patient.create({ user: user._id, ...data });
      console.log(`✔ Patient profile created: ${email} → ${patient.patientCode}`);
    } else {
      await Patient.findByIdAndUpdate(patient._id, data);
      console.log(`— Patient profile already existed, updated: ${email} → ${patient.patientCode}`);
    }
  }

  console.log('\nSeeding complete.');
  process.exit();
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});