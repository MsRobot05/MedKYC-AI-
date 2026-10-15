import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Card, PageHeader, Badge, Button, Notice, Loading, Ring, completeness, C, tone } from '../components/ui';
import { Droplet, AlertCircle, Clock, Download, FileText, Siren, Bot, Stethoscope, ShieldCheck, ArrowRight, Pill } from 'lucide-react';

function Kpi({ label, value, icon: Icon, color }) {
  const t = tone(color);
  return (
    <Card className="p-5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: t.bg }}>
        <Icon className="w-5 h-5" style={{ color: t.fg }} />
      </div>
      <p className="text-sm" style={{ color: C.sub }}>{label}</p>
      <p className="text-[28px] font-semibold mt-1 tracking-tight leading-none" style={{ color: C.text }}>{value}</p>
    </Card>
  );
}

function Tile({ to, icon: Icon, label, color }) {
  const t = tone(color);
  return (
    <Link to={to}>
      <Card className="p-4 flex items-center gap-3 hover:shadow-md transition">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.bg }}>
          <Icon className="w-5 h-5" style={{ color: t.fg }} />
        </div>
        <span className="text-sm font-medium flex-1" style={{ color: C.text }}>{label}</span>
        <ArrowRight className="w-4 h-4" style={{ color: C.muted }} />
      </Card>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isPatient = user?.role === 'patient';
  const [kyc, setKyc] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(isPatient);
  const [error, setError] = useState('');
  const [making, setMaking] = useState(false);

  useEffect(() => {
    if (!isPatient) return undefined;
    let alive = true;
    Promise.all([
      api.get('/patient/kyc').then((r) => r.data).catch((err) => (err.response?.status === 404 ? null : Promise.reject(err))),
      api.get('/patient/visits').then((r) => r.data).catch(() => []),
    ])
      .then(([k, v]) => {
        if (!alive) return;
        setKyc(k);
        setVisits(v);
      })
      .catch((err) => alive && setError(err.response?.data?.message || "Couldn't load your profile. Is the backend running?"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [isPatient]);

  const { percent, missing } = completeness(kyc);

  const downloadCard = async () => {
    setMaking(true);
    setError('');
    try {
      const name = user?.name || '--';
      const blood = kyc?.bloodGroup || 'Not set';
      const allergies = kyc?.allergies?.length ? kyc.allergies.join(', ') : 'None recorded';
      const meds = kyc?.medications?.length ? kyc.medications.join(', ') : 'None recorded';
      const contact = kyc?.emergencyContactName
        ? `${kyc.emergencyContactName}${kyc.emergencyContactPhone ? ' - ' + kyc.emergencyContactPhone : ''}`
        : 'Not set';
      const dob = kyc?.dob ? new Date(kyc.dob).toLocaleDateString('en-IN') : '--';

      const qrText = [
        'MedKYC-AI emergency card',
        `Name: ${name}`,
        `Blood group: ${blood}`,
        `Allergies: ${allergies}`.slice(0, 140),
        `Medications: ${meds}`.slice(0, 140),
        `Emergency contact: ${contact}`,
      ].join('\n');
      const qr = await QRCode.toDataURL(qrText, { margin: 1, width: 240, errorCorrectionLevel: 'M' });

      const doc = new jsPDF({ unit: 'pt', format: [340, 240] });

      // header band
      doc.setFillColor(11, 41, 66);
      doc.rect(0, 0, 340, 240, 'F');
      doc.setFillColor(94, 234, 212);
      doc.roundedRect(16, 11, 22, 22, 5, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(11, 41, 66);
      doc.text('M', 23.5, 27);
      doc.setTextColor(255, 255, 255);
      doc.text('MedKYC-AI Health ID', 46, 23);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(180, 220, 215);
      doc.text('Emergency health card', 46, 33);

      // body
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(12, 46, 316, 182, 8, 8, 'F');

      let y = 66;
      const label = (t, x) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(120, 125, 135);
        doc.text(t.toUpperCase(), x, y);
      };
      const fit = (text, width, maxLines) => {
        const all = doc.splitTextToSize(String(text), width);
        if (all.length <= maxLines) return all;
        const cut = all.slice(0, maxLines);
        cut[maxLines - 1] = cut[maxLines - 1].replace(/.{0,3}$/, '...');
        return cut;
      };
      const value = (text, x, size, color, maxLines) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(size);
        doc.setTextColor(...color);
        const lines = fit(text, 190, maxLines);
        doc.text(lines, x, y + 11);
        return lines.length;
      };

      label('Name', 24);
      let n = value(name, 24, 11, [20, 20, 20], 1);
      y += 11 + n * 13 + 6;

      label('Blood group', 24);
      label('Date of birth', 120);
      value(blood, 24, 15, [179, 38, 30], 1);
      value(dob, 120, 9, [20, 20, 20], 1);
      y += 11 + 18 + 6;

      label('Allergies', 24);
      n = value(allergies, 24, 8.5, [20, 20, 20], 2);
      y += 11 + n * 10.5 + 6;

      label('Medications', 24);
      n = value(meds, 24, 8.5, [20, 20, 20], 1);
      y += 11 + n * 10.5 + 6;

      label('Emergency contact', 24);
      value(contact, 24, 8.5, [20, 20, 20], 1);

      // QR + footer
      doc.addImage(qr, 'PNG', 238, 62, 78, 78);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(120, 125, 135);
      doc.text('SCAN IN AN EMERGENCY', 277, 150, { align: 'center' });
      doc.text('Self-reported information. Not a medical record.', 24, 222);

      doc.save(`MedKYC-Health-Card-${name.replace(/\s+/g, '-')}.pdf`);
    } catch (e) {
      setError(`Could not create the card. ${e.message || ''}`);
    }
    setMaking(false);
  };

  if (!isPatient) {
    return (
      <div>
        <PageHeader title={`Welcome, ${user?.name || ''}`} subtitle={user?.role === 'admin' ? 'You are signed in as an administrator' : 'You are signed in as a doctor'} />
        <div className="grid grid-cols-3 gap-4">
          {user?.role === 'admin' && <Tile to="/admin" icon={ShieldCheck} label="Admin console" color="amber" />}
          <Tile to="/doctor" icon={Stethoscope} label="Doctor dashboard" color="purple" />
        </div>
      </div>
    );
  }

  if (loading) return <Loading text="Loading your health overview..." />;

  return (
    <div>
      <PageHeader
        title={`Hello, ${user?.name || ''}`}
        subtitle="Your health overview at a glance"
        action={
          <Button onClick={downloadCard} loading={making} disabled={!kyc}>
            <Download className="w-4 h-4" /> Download health card
          </Button>
        }
      />
      {error && <Notice color="red">{error}</Notice>}
      {!kyc && !error && (
        <Notice color="amber">
          You haven't filled in your KYC yet. <Link to="/kyc" className="font-semibold underline">Complete it now</Link> to unlock your health card.
        </Notice>
      )}

      <div className="grid grid-cols-3 gap-4 mb-4">
        <Kpi label="Blood group" value={kyc?.bloodGroup || '--'} icon={Droplet} color="red" />
        <Kpi label="Allergies logged" value={kyc ? kyc.allergies?.length || 0 : '--'} icon={AlertCircle} color="amber" />
        <Kpi label="Doctor visits" value={visits.length} icon={Clock} color="teal" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <Ring percent={percent} />
            <div>
              <p className="font-semibold text-sm" style={{ color: C.text }}>Profile</p>
              <p className="text-xs mt-0.5" style={{ color: C.muted }}>{percent === 100 ? 'Complete' : `${missing.length} to fill in`}</p>
              {percent < 100 && <Link to="/kyc" className="text-xs font-medium mt-2 inline-block" style={{ color: C.teal }}>Finish your KYC</Link>}
            </div>
          </div>
        </Card>

        <Card className="p-5 col-span-2">
          <p className="font-semibold text-sm mb-3" style={{ color: C.text }}>Health summary</p>
          {!kyc ? (
            <p className="text-sm" style={{ color: C.muted }}>Nothing saved yet.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs w-24" style={{ color: C.muted }}>Allergies</span>
                {kyc.allergies?.length ? kyc.allergies.map((a) => <Badge key={a} color="red">{a}</Badge>) : <span className="text-sm" style={{ color: C.sub }}>None recorded</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs w-24" style={{ color: C.muted }}>Medications</span>
                {kyc.medications?.length ? kyc.medications.map((m) => <Badge key={m} color="teal">{m}</Badge>) : <span className="text-sm" style={{ color: C.sub }}>None recorded</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs w-24" style={{ color: C.muted }}>Emergency</span>
                <span className="text-sm" style={{ color: C.text }}>
                  {kyc.emergencyContactName ? `${kyc.emergencyContactName}${kyc.emergencyContactPhone ? ' (' + kyc.emergencyContactPhone + ')' : ''}` : 'Not set'}
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <Tile to="/kyc" icon={FileText} label="Update KYC" color="teal" />
        <Tile to="/blood-bank" icon={Droplet} label="Find blood" color="red" />
        <Tile to="/ambulance" icon={Siren} label="Ambulance" color="amber" />
        <Tile to="/assistant" icon={Bot} label="Care agent" color="purple" />
      </div>

      <Card className="p-5">
        <p className="font-semibold text-sm mb-3" style={{ color: C.text }}>Recent visits</p>
        {visits.length === 0 ? (
          <p className="text-sm" style={{ color: C.muted }}>No visits recorded yet. They appear here after a doctor adds one.</p>
        ) : (
          <div className="space-y-3">
            {visits.slice(0, 4).map((v) => (
              <div key={v._id} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: tone('purple').bg }}>
                  <Stethoscope className="w-4 h-4" style={{ color: tone('purple').fg }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm" style={{ color: C.text }}>
                    <b>{v.doctor?.name || 'Doctor'}</b>{v.diagnosis ? `: ${v.diagnosis}` : ''}
                  </p>
                  {v.prescription?.length > 0 && (
                    <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: C.sub }}>
                      <Pill className="w-3 h-3" /> {v.prescription.join(', ')}
                    </p>
                  )}
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                    {new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}