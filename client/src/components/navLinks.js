import {
  LayoutDashboard, FileText, Clock, Droplet, Siren, Stethoscope, MessageCircle,
  ShieldCheck, Bot, CalendarDays, Eye, HeartPulse, QrCode,
} from 'lucide-react';

const ALL = ['patient', 'doctor', 'admin'];

export const NAV_LINKS = [
  { to: '/dashboard', key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ALL },
  { to: '/assistant', key: 'careAgent', label: 'Care Agent', icon: Bot, roles: ['patient'] },
  { to: '/kyc', key: 'kycForm', label: 'KYC form', icon: FileText, roles: ['patient'] },
  { to: '/vitals', key: 'vitals', label: 'Vitals', icon: HeartPulse, roles: ['patient'] },
  { to: '/emergency', key: 'emergency', label: 'Emergency card', icon: QrCode, roles: ['patient'] },
  { to: '/history', key: 'visitHistory', label: 'Visit history', icon: Clock, roles: ['patient'] },
  { to: '/appointments', key: 'appointments', label: 'Appointments', icon: CalendarDays, roles: ['patient', 'doctor'] },
  { to: '/blood-bank', key: 'bloodBank', label: 'Blood bank', icon: Droplet, roles: ['patient'] },
  { to: '/ambulance', key: 'ambulance', label: 'Ambulance', icon: Siren, roles: ['patient'] },
  { to: '/symptom-check', key: 'symptomCheck', label: 'Symptom Check', icon: MessageCircle, roles: ['patient'] },
  { to: '/access-log', key: 'accessLog', label: 'Who accessed me', icon: Eye, roles: ['patient'] },
  { to: '/doctor', key: 'doctorDashboard', label: 'Doctor Dashboard', icon: Stethoscope, roles: ['doctor', 'admin'] },
  { to: '/admin', key: 'admin', label: 'Admin', icon: ShieldCheck, roles: ['admin'] },
];