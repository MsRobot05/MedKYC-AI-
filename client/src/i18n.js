import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      dashboard: 'Dashboard',
      kycForm: 'KYC form',
      visitHistory: 'Visit history',
      bloodBank: 'Blood bank',
      ambulance: 'Ambulance',
      doctorDashboard: 'Doctor Dashboard',
      symptomCheck: 'Symptom Check',
      admin: 'Admin',
      welcomeBack: 'Welcome back',
      logout: 'Logout',
      signIn: 'Sign in',
      emergencyCallNow: 'In an emergency, call now',
    },
  },
  hi: {
    translation: {
      dashboard: 'डैशबोर्ड',
      kycForm: 'केवाईसी फॉर्म',
      visitHistory: 'विज़िट इतिहास',
      bloodBank: 'ब्लड बैंक',
      ambulance: 'एम्बुलेंस',
      doctorDashboard: 'डॉक्टर डैशबोर्ड',
      symptomCheck: 'लक्षण जांच',
      admin: 'एडमिन',
      welcomeBack: 'वापसी पर स्वागत है',
      logout: 'लॉग आउट',
      signIn: 'साइन इन करें',
      emergencyCallNow: 'आपातकाल में अभी कॉल करें',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('lang') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;