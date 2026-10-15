import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FileText, Clock, Droplet, Siren,
  Stethoscope, MessageCircle, ShieldCheck, Bot, Globe,
} from 'lucide-react';

const ALL = ['patient', 'doctor', 'admin'];

const LINKS = [
  { to: '/dashboard', key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ALL },
  { to: '/assistant', key: 'careAgent', label: 'Care Agent', icon: Bot, roles: ['patient'] },
  { to: '/kyc', key: 'kycForm', label: 'KYC form', icon: FileText, roles: ['patient'] },
  { to: '/history', key: 'visitHistory', label: 'Visit history', icon: Clock, roles: ['patient'] },
  { to: '/blood-bank', key: 'bloodBank', label: 'Blood bank', icon: Droplet, roles: ['patient'] },
  { to: '/ambulance', key: 'ambulance', label: 'Ambulance', icon: Siren, roles: ['patient'] },
  { to: '/symptom-check', key: 'symptomCheck', label: 'Symptom Check', icon: MessageCircle, roles: ['patient'] },
  { to: '/doctor', key: 'doctorDashboard', label: 'Doctor Dashboard', icon: Stethoscope, roles: ['doctor', 'admin'] },
  { to: '/admin', key: 'admin', label: 'Admin', icon: ShieldCheck, roles: ['admin'] },
];

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const visible = LINKS.filter((l) => l.roles.includes(user?.role));

  const toggleLanguage = () => {
    const next = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

  return (
    <div className="w-60 h-screen p-5 flex flex-col gap-1 sticky top-0" style={{ backgroundColor: '#0B2942' }}>
      <div className="flex items-center gap-2.5 px-1 mb-8 mt-1">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ backgroundColor: '#5EEAD4', color: '#0B2942' }}>
          M
        </div>
        <span className="font-semibold text-white tracking-tight">MedKYC-AI</span>
      </div>

      {visible.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={({ isActive }) =>
              isActive
                ? { backgroundColor: 'rgba(255,255,255,0.10)', color: '#5EEAD4' }
                : { color: 'rgba(255,255,255,0.65)' }
            }
          >
            <Icon className="w-4 h-4" />
            {t(link.key, { defaultValue: link.label })}
          </NavLink>
        );
      })}

      <button
        onClick={toggleLanguage}
        className="mt-auto flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium hover:opacity-80"
        style={{ color: 'rgba(255,255,255,0.65)' }}
      >
        <Globe className="w-4 h-4" />
        {i18n.language === 'en' ? 'हिंदी' : 'English'}
      </button>
    </div>
  );
}