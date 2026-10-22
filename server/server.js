require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1); // needed behind Render's proxy so rate limiting sees real IPs

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB error:', err));

// The Gemini free tier is tiny; this stops one visitor burning the whole quota.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { reply: 'Too many requests. Wait a minute and try again.' },
});

// The emergency page needs no login, so make token-guessing impractical.
const emergencyLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Try again shortly.' },
});

app.get('/', (req, res) => res.send('MedKYC-AI backend is running'));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/patient', require('./routes/patient.routes'));
app.use('/api/bloodbanks', require('./routes/bloodbank.routes'));
app.use('/api/ambulances', require('./routes/ambulance.routes'));
app.use('/api/doctor', require('./routes/doctor.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/appointments', require('./routes/appointment.routes'));
app.use('/api/access-log', require('./routes/accesslog.routes'));
app.use('/api/vitals', require('./routes/vitals.routes'));
app.use('/api/emergency/public', emergencyLimiter);
app.use('/api/emergency', require('./routes/emergency.routes'));
app.use('/api/symptom', aiLimiter, require('./routes/symptom.routes'));
app.use('/api/agent', aiLimiter, require('./routes/agent.routes'));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: allowedOrigins } });
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('joinBooking', (bookingId) => socket.join(String(bookingId)));
  socket.on('updateStatus', ({ bookingId, status, lat, lng }) => {
    io.to(String(bookingId)).emit('statusUpdate', { status, lat, lng });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));