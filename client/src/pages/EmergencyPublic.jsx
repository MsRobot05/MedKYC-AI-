import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { Phone, TriangleAlert, Pill, HeartPulse } from 'lucide-react';

const card = { backgroundColor: '#FFFFFF', border: '1px solid #EAEBEF', borderRadius: 16 };

export default function EmergencyPublic() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading'); // loading | ok | missing | error

  useEffect(() => {
    api.get(`/emergency/public/${token}`)
      .then((res) => { setData(res.data); setState('ok'); })
      .catch((err) => setState(err.response?.status === 404 ? 'missing' : 'error'));
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F8FA' }}>
      <div style={{ backgroundColor: '#B3261E', color: '#FFFFFF', padding: '14px 20px' }} className="flex items-center gap-2">
        <TriangleAlert className="w-5 h-5" />
        <span className="font-semibold tracking-wide text-sm">EMERGENCY MEDICAL INFORMATION</span>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: 16 }} className="space-y-4">
        {state === 'loading' && <p className="text-sm text-center py-16" style={{ color: '#8A8F98' }}>Loading...</p>}

        {state === 'missing' && (
          <div style={card} className="p-6 text-center">
            <p className="font-semibold" style={{ color: '#111827' }}>This link is not active</p>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>The owner may have turned it off or replaced the QR code.</p>
          </div>
        )}

        {state === 'error' && (
          <div style={card} className="p-6 text-center">
            <p className="font-semibold" style={{ color: '#111827' }}>Could not load</p>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Check the connection and try again. If someone needs urgent help, call 108.</p>
          </div>
        )}

        {state === 'ok' && data && (
          <>
            <div style={card} className="p-5">
              <p className="text-xl font-semibold" style={{ color: '#111827' }}>{data.name}</p>
              {data.age != null && <p className="text-sm" style={{ color: '#6B7280' }}>{data.age} years old</p>}
              <div className="mt-4 rounded-xl p-4 flex items-center gap-4" style={{ backgroundColor: '#FDEEEE' }}>
                <HeartPulse className="w-6 h-6" style={{ color: '#B3261E' }} />
                <div>
                  <p className="text-xs" style={{ color: '#B3261E' }}>BLOOD GROUP</p>
                  <p className="text-3xl font-bold leading-tight" style={{ color: '#B3261E' }}>{data.bloodGroup || 'Not recorded'}</p>
                </div>
              </div>
            </div>

            <div style={card} className="p-5">
              <p className="text-xs font-semibold mb-3" style={{ color: '#B3261E' }}>ALLERGIES</p>
              {data.allergies.length === 0 ? (
                <p className="text-sm" style={{ color: '#6B7280' }}>No allergies recorded</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.allergies.map((a) => (
                    <span key={a} className="px-3 py-1.5 rounded-full text-sm font-semibold" style={{ backgroundColor: '#FDEEEE', color: '#B3261E' }}>{a}</span>
                  ))}
                </div>
              )}
            </div>

            <div style={card} className="p-5">
              <p className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#0F6E64' }}><Pill className="w-3.5 h-3.5" /> CURRENT MEDICATIONS</p>
              {data.medications.length === 0 ? (
                <p className="text-sm" style={{ color: '#6B7280' }}>None recorded</p>
              ) : (
                <ul className="text-sm space-y-1.5" style={{ color: '#111827' }}>
                  {data.medications.map((m) => <li key={m}>{m}</li>)}
                </ul>
              )}
            </div>

            {data.emergencyContact && (
              <div style={card} className="p-5">
                <p className="text-xs font-semibold mb-2" style={{ color: '#6B7280' }}>EMERGENCY CONTACT</p>
                <p className="font-semibold" style={{ color: '#111827' }}>{data.emergencyContact.name}</p>
                {data.emergencyContact.phone && (
                  <a
                    href={`tel:${data.emergencyContact.phone}`}
                    className="mt-3 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
                    style={{ backgroundColor: '#0B2942', color: '#FFFFFF' }}
                  >
                    <Phone className="w-4 h-4" /> Call {data.emergencyContact.phone}
                  </a>
                )}
              </div>
            )}

            <a
              href="tel:108"
              className="flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold"
              style={{ backgroundColor: '#B3261E', color: '#FFFFFF' }}
            >
              <Phone className="w-4 h-4" /> Call ambulance: 108
            </a>

            <p className="text-xs text-center pb-6" style={{ color: '#8A8F98' }}>
              Entered by the patient on MedKYC-AI and not verified by a doctor. This scan has been recorded.
            </p>
          </>
        )}
      </div>
    </div>
  );
}