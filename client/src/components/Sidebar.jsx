import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, FileText, Clock, Droplet, Siren, Stethoscope, MessageCircle, ShieldCheck, Globe } from 'lucide-react';

export default function Sidebar() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('lang', newLang);
  };

  const links = [
    { to: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { to: '/kyc', label: t('kycForm'), icon: FileText },
    { to: '/history', label: t('visitHistory'), icon: Clock },
    { to: '/blood-bank', label: t('bloodBank'), icon: Droplet },
    { to: '/ambulance', label: t('ambulance'), icon: Siren },
    { to: '/doctor', label: t('doctorDashboard'), icon: Stethoscope },
    { to: '/symptom-check', label: t('symptomCheck'), icon: MessageCircle },
    { to: '/admin', label: t('admin'), icon: ShieldCheck },
  ];

  return (
    <div className="w-60 bg-[#0B2942] h-screen p-5 flex flex-col gap-1 sticky top-0">
      <div className="flex items-center gap-2.5 px-1 mb-8 mt-1">
        <div className="w-8 h-8 rounded-lg bg-teal-400 text-[#0B2942] flex items-center justify-center font-bold text-sm">M</div>
        <span className="font-semibold text-white tracking-tight">MedKYC-AI</span>
      </div>

      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive ? 'bg-white/10 text-teal-300' : 'text-white/60 hover:bg-white/5 hover:text-white/90'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {link.label}
          </NavLink>
        );
      })}

      {/* Language toggle — NOT a route, just a button at the bottom of the sidebar */}
      <button
        onClick={toggleLanguage}
        className="mt-auto flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white/90 transition"
      >
        <Globe className="w-4 h-4" />
        {i18n.language === 'en' ? 'हिंदी' : 'English'}
      </button>
    </div>
  );
}