import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/kyc', label: 'KYC form' },
  { to: '/history', label: 'Visit history' },
  { to: '/blood-bank', label: 'Blood bank' },
  { to: '/ambulance', label: 'Ambulance' },
  { to: '/doctor', label: 'Doctor Dashboard' },
];

export default function Sidebar() {
  return (
    <div className="w-48 bg-white border-r h-screen p-4 flex flex-col gap-1">
      <h2 className="font-semibold mb-4 px-2">MedKYC-AI</h2>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => `px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          {link.label}
        </NavLink>
      ))}
    </div>
  );
}