require('dotenv').config();
const mongoose = require('mongoose');
const BloodBank = require('./models/BloodBank');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  await BloodBank.deleteMany({});
  await BloodBank.insertMany([
    { name: 'City General Blood Bank', address: 'MG Road, Pune', phone: '+912012345678', lat: 18.5204, lng: 73.8567, stock: { 'O+': 12, 'A+': 8, 'B+': 5, 'AB+': 2, 'O-': 3, 'A-': 1, 'B-': 0, 'AB-': 0 } },
    { name: 'Sahyadri Hospital Blood Bank', address: 'Kothrud, Pune', phone: '+912087654321', lat: 18.5074, lng: 73.8077, stock: { 'O+': 5, 'A+': 10, 'B+': 6, 'AB+': 1, 'O-': 0, 'A-': 2, 'B-': 1, 'AB-': 0 } },
    { name: 'Ruby Hall Clinic Blood Bank', address: 'Sassoon Road, Pune', phone: '+912011223344', lat: 18.5314, lng: 73.8770, stock: { 'O+': 20, 'A+': 15, 'B+': 9, 'AB+': 4, 'O-': 6, 'A-': 3, 'B-': 2, 'AB-': 1 } },
  ]);

  console.log('Blood banks seeded');
  const Ambulance = require('./models/Ambulance');
await Ambulance.deleteMany({});
await Ambulance.insertMany([
  { driverName: 'Suresh Patil', vehicleNumber: 'MH12 AB 1234', phone: '+919812345670', lat: 18.5204, lng: 73.8567, available: true },
  { driverName: 'Ramesh Yadav', vehicleNumber: 'MH12 CD 5678', phone: '+919812345671', lat: 18.5104, lng: 73.8467, available: true },
  { driverName: 'Amit Kale', vehicleNumber: 'MH12 EF 9012', phone: '+919812345672', lat: 18.5304, lng: 73.8667, available: false },
]);
console.log('Ambulances seeded');
  process.exit();
}

seed();