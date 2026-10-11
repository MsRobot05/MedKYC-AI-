const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB error:', err));

app.get('/', (req, res) => {
  res.send('MedKYC-AI backend is running');
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/bloodbanks', require('./routes/bloodbank.routes'));
app.use('/api/ambulances', require('./routes/ambulance.routes'));
app.use('/api/patient', require('./routes/patient.routes'));
app.use('/api/doctor', require('./routes/doctor.routes'));
app.use('/api/ai', require('./routes/ai.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/symptom', require('./routes/symptom.routes'));
app.use('/api/medicine', require('./routes/medicine.routes'));
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

// Make Socket.io available inside controllers
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('joinBooking', (bookingId) => {
    console.log(`Socket ${socket.id} joined booking ${bookingId}`);
    socket.join(bookingId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});