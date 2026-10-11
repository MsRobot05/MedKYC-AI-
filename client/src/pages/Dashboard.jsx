import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Droplet, AlertCircle, Clock, Download } from 'lucide-react';

const cardStyles = [
  { bg: '#FDEEEE', fg: '#B3261E' },
  { bg: '#FEF6E7', fg: '#B7791F' },
  { bg: '#EEF7F6', fg: '#0F6E64' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [kyc, setKyc] = useState(null);

  useEffect(() => {
    api.get('/patient/kyc').then((res) => setKyc(res.data)).catch(() => {});
  }, []);

  const downloadHealthCard = () => {
    const doc = new jsPDF({ format: [340, 214], unit: 'pt' });

    doc.setFillColor(11, 41, 66);
    doc.rect(0, 0, 340, 214, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('MedKYC-AI Health ID', 20, 30);
    doc.setFontSize(10);
    doc.setTextColor(180, 220, 215);
    doc.text('Digital Emergency Health Card', 20, 46);

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(20, 58, 300, 138, 8, 8, 'F');
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(10);

    // splitTextToSize wraps long lists so they don't run off the card
    const lines = [
      `Name: ${user?.name || '--'}`,
      `Blood Group: ${kyc?.bloodGroup || 'Not set'}`,
      `Allergies: ${kyc?.allergies?.join(', ') || 'None recorded'}`,
      `Medications: ${kyc?.medications?.join(', ') || 'None'}`,
      `Emergency Contact: ${kyc?.emergencyContactName || '--'} (${kyc?.emergencyContactPhone || '--'})`,
    ];
    let y = 78;
    lines.forEach((line) => {
      const wrapped = doc.splitTextToSize(line, 275);
      doc.text(wrapped, 32, y);
      y += wrapped.length * 13 + 8;
    });

    doc.save('MedKYC-Health-Card.pdf');
  };

  const stats = [
    { label: 'Blood group', value: kyc?.bloodGroup || '--', icon: Droplet },
    { label: 'Allergies logged', value: kyc?.allergies?.length ?? '--', icon: AlertCircle },
    { label: 'Past visits', value: '--', icon: Clock },
  ];

  return (
    <div>
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Your health overview at a glance</p>
        </div>

        {/* The Download button sits here, in the heading row, on the right */}
        <button
          onClick={downloadHealthCard}
          disabled={!kyc}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: '#0B2942' }}
        >
          <Download className="w-4 h-4" /> Download Health Card
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          const style = cardStyles[i];
          return (
            <div
              key={s.label}
              className="bg-white rounded-2xl p-5"
              style={{ border: '1px solid #EAEBEF', boxShadow: '0 1px 2px rgba(16,24,40,0.04)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: style.bg }}
              >
                <Icon className="w-5 h-5" style={{ color: style.fg }} />
              </div>
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-[28px] font-semibold text-gray-900 mt-1 tracking-tight leading-none">
                {s.value}
              </p>
            </div>
          );
        })}
      </div>

      {!kyc && (
        <div
          className="mt-6 rounded-2xl p-5 text-sm"
          style={{ backgroundColor: '#EEF7F6', color: '#0F6E64', border: '1px solid #D5EDE9' }}
        >
          You haven't filled your KYC form yet. Complete it to unlock your full health profile and download your health card.
        </div>
      )}
    </div>
  );
}