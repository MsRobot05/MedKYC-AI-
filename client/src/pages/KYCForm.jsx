import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { Card, PageHeader, Button, Notice, Loading, Ring, completeness, C, tone } from '../components/ui';
import { Camera, Plus, X, ShieldCheck, Droplet, Pill, AlertCircle, FileText, Phone, User, Save } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const GENDERS = [['female', 'Female'], ['male', 'Male'], ['other', 'Other'], ['prefer_not_to_say', 'Prefer not to say']];
const COMMON_ALLERGIES = ['Penicillin', 'Sulfa drugs', 'Aspirin', 'Peanuts', 'Dust', 'Latex'];

const EMPTY = {
  dob: '', gender: '', phone: '', city: '', abhaNumber: '',
  bloodGroup: '', allergies: [], medications: [], pastSurgeries: [],
  emergencyContactName: '', emergencyContactPhone: '',
  consent: { shareAllergies: true, shareHistory: true, shareMedications: true },
};

function normalize(d) {
  const x = d || {};
  return {
    dob: x.dob ? String(x.dob).slice(0, 10) : '',
    gender: x.gender || '',
    phone: x.phone || '',
    city: x.city || '',
    abhaNumber: x.abhaNumber || '',
    bloodGroup: x.bloodGroup || '',
    allergies: Array.isArray(x.allergies) ? x.allergies : [],
    medications: Array.isArray(x.medications) ? x.medications : [],
    pastSurgeries: Array.isArray(x.pastSurgeries) ? x.pastSurgeries : [],
    emergencyContactName: x.emergencyContactName || '',
    emergencyContactPhone: x.emergencyContactPhone || '',
    consent: {
      shareAllergies: x.consent?.shareAllergies !== false,
      shareHistory: x.consent?.shareHistory !== false,
      shareMedications: x.consent?.shareMedications !== false,
    },
  };
}

// Best-effort reading of a scanned ID. The user always reviews the result.
function parseId(text) {
  const out = {};
  const m = text.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})\b/);
  if (m) {
    const [, d, mo, y] = m;
    const iso = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
    const date = new Date(`${iso}T00:00:00`);
    if (!Number.isNaN(date.getTime()) && Number(y) >= 1900 && date <= new Date()) out.dob = iso;
  }
  const b = text.match(/blood\s*(?:group)?\s*[:\-]?\s*(AB|A|B|O)\s*([+-]|pos(?:itive)?|neg(?:ative)?)/i);
  if (b) out.bloodGroup = `${b[1].toUpperCase()}${/^p|\+/i.test(b[2]) ? '+' : '-'}`;
  return out;
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium mb-1.5" style={{ color: C.sub }}>{label}</span>
      {children}
      {hint && <span className="block text-xs mt-1" style={{ color: C.muted }}>{hint}</span>}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
    />
  );
}

function SectionTitle({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: tone('teal').bg }}>
        <Icon className="w-4.5 h-4.5" style={{ color: C.teal }} />
      </div>
      <div>
        <h2 className="font-semibold text-[15px]" style={{ color: C.text }}>{title}</h2>
        {desc && <p className="text-xs" style={{ color: C.muted }}>{desc}</p>}
      </div>
    </div>
  );
}

function TagInput({ label, placeholder, values, onChange, color, suggestions = [] }) {
  const [text, setText] = useState('');
  const t = tone(color);

  const add = (raw) => {
    const v = raw.trim();
    setText('');
    if (!v || values.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    onChange([...values, v]);
  };

  return (
    <div>
      <span className="block text-xs font-medium mb-1.5" style={{ color: C.sub }}>{label}</span>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add(text);
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
        />
        <button type="button" onClick={() => add(text)} className="px-3.5 rounded-xl border border-gray-200 hover:bg-gray-50" aria-label="Add">
          <Plus className="w-4 h-4" style={{ color: C.navy }} />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2.5">
          {values.map((v) => (
            <span key={v} className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: t.bg, color: t.fg }}>
              {v}
              <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`Remove ${v}`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          <span className="text-xs" style={{ color: C.muted }}>Quick add:</span>
          {suggestions
            .filter((s) => !values.some((x) => x.toLowerCase() === s.toLowerCase()))
            .map((s) => (
              <button key={s} type="button" onClick={() => add(s)} className="text-xs px-2.5 py-1 rounded-full border border-gray-200 hover:bg-gray-50" style={{ color: C.sub }}>
                + {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function Switch({ checked, onChange, label, desc }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium" style={{ color: C.text }}>{label}</p>
        <p className="text-xs" style={{ color: C.muted }}>{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{ width: 42, height: 24, borderRadius: 999, backgroundColor: checked ? C.teal : '#D1D5DB', position: 'relative', flexShrink: 0, transition: 'background-color .15s' }}
      >
        <span style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#FFFFFF', transition: 'left .15s' }} />
      </button>
    </div>
  );
}

export default function KYCForm() {
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(JSON.stringify(EMPTY));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let alive = true;
    api.get('/patient/kyc')
      .then((res) => {
        if (!alive) return;
        const n = normalize(res.data);
        setForm(n);
        setSaved(JSON.stringify(n));
      })
      .catch((err) => {
        if (alive && err.response?.status !== 404) {
          setNotice({ color: 'red', text: err.response?.data?.message || "Couldn't load your KYC. Is the backend running?" });
        }
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const dirty = JSON.stringify(form) !== saved;
  const { percent, missing } = useMemo(() => completeness(form), [form]);

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const res = await api.post('/patient/kyc', form);
      const n = normalize(res.data.patient);
      setForm(n);
      setSaved(JSON.stringify(n));
      setNotice({ color: 'green', text: 'Saved. Your dashboard and health card now use this data.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setNotice({ color: 'red', text: err.response?.data?.message || 'Could not save. Check that the backend is running.' });
    }
    setSaving(false);
  };

  const handleScan = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setScanning(true);
    setNotice(null);
    try {
      const { default: Tesseract } = await import('tesseract.js');
      const { data } = await Tesseract.recognize(file, 'eng');
      const found = parseId(data.text || '');
      if (found.dob || found.bloodGroup) {
        set(found);
        setNotice({ color: 'amber', text: 'Details read from the image. OCR can be wrong, so check them before saving.' });
      } else {
        setNotice({ color: 'amber', text: 'Could not find a date of birth or blood group in that image. Try a clearer photo, or type it in.' });
      }
    } catch {
      setNotice({ color: 'red', text: 'Scan failed. Please fill the fields manually.' });
    }
    setScanning(false);
  };

  if (loading) return <Loading text="Loading your KYC..." />;

  return (
    <form onSubmit={save}>
      <PageHeader title="Patient KYC" subtitle="Keep your medical profile complete. Doctors and emergency services rely on it." />
      {notice && <Notice color={notice.color}>{notice.text}</Notice>}

      <div className="grid grid-cols-3 gap-6 items-start">
        <div className="col-span-2 space-y-5">
          <Card className="p-6">
            <SectionTitle icon={User} title="Personal details" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date of birth">
                <Input type="date" value={form.dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set({ dob: e.target.value })} />
              </Field>
              <Field label="Gender">
                <select
                  value={form.gender}
                  onChange={(e) => set({ gender: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                >
                  <option value="">Select</option>
                  {GENDERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Mobile number" hint="10-digit Indian mobile">
                <Input inputMode="tel" placeholder="98XXXXXXXX" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
              </Field>
              <Field label="City">
                <Input placeholder="Pune" value={form.city} onChange={(e) => set({ city: e.target.value })} />
              </Field>
              <div className="col-span-2">
                <Field label="ABHA number (optional)" hint="14 digits, from your Ayushman Bharat Health Account">
                  <Input inputMode="numeric" placeholder="12-3456-7890-1234" value={form.abhaNumber} onChange={(e) => set({ abhaNumber: e.target.value })} />
                </Field>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle icon={Droplet} title="Medical profile" desc="Press Enter or comma to add an item" />
            <div className="mb-5">
              <span className="block text-xs font-medium mb-2" style={{ color: C.sub }}>Blood group</span>
              <div className="grid grid-cols-8 gap-2">
                {BLOOD_GROUPS.map((g) => {
                  const on = form.bloodGroup === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => set({ bloodGroup: on ? '' : g })}
                      className="py-2.5 rounded-xl text-sm font-semibold transition"
                      style={on ? { backgroundColor: '#B3261E', color: '#FFFFFF', border: '1px solid #B3261E' } : { backgroundColor: '#FFFFFF', color: C.text, border: '1px solid #E5E7EB' }}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-5">
              <TagInput label="Allergies" placeholder="e.g. Penicillin" color="red" values={form.allergies} onChange={(v) => set({ allergies: v })} suggestions={COMMON_ALLERGIES} />
              <TagInput label="Current medications" placeholder="e.g. Metformin 500mg" color="teal" values={form.medications} onChange={(v) => set({ medications: v })} />
              <TagInput label="Past surgeries" placeholder="e.g. Appendectomy 2019" color="gray" values={form.pastSurgeries} onChange={(v) => set({ pastSurgeries: v })} />
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle icon={Phone} title="Emergency contact" desc="Shown on your health card" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name">
                <Input value={form.emergencyContactName} onChange={(e) => set({ emergencyContactName: e.target.value })} />
              </Field>
              <Field label="Mobile number">
                <Input inputMode="tel" placeholder="98XXXXXXXX" value={form.emergencyContactPhone} onChange={(e) => set({ emergencyContactPhone: e.target.value })} />
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle icon={ShieldCheck} title="Privacy and consent" desc="Choose what a doctor can see in your record" />
            <div style={{ borderTop: '1px solid #F1F2F4' }}>
              <Switch label="Allergies" desc="Doctors can view your allergy list" checked={form.consent.shareAllergies} onChange={(v) => set({ consent: { ...form.consent, shareAllergies: v } })} />
              <div style={{ borderTop: '1px solid #F1F2F4' }} />
              <Switch label="Medical history" desc="Doctors can view your past surgeries" checked={form.consent.shareHistory} onChange={(v) => set({ consent: { ...form.consent, shareHistory: v } })} />
              <div style={{ borderTop: '1px solid #F1F2F4' }} />
              <Switch label="Medications" desc="Doctors can view your current medications" checked={form.consent.shareMedications} onChange={(v) => set({ consent: { ...form.consent, shareMedications: v } })} />
            </div>
            <p className="text-xs mt-3" style={{ color: C.muted }}>
              Even if you hide allergies, the safety check still runs against them when a doctor prescribes.
            </p>
          </Card>
        </div>

        <div className="space-y-5" style={{ position: 'sticky', top: 88 }}>
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <Ring percent={percent} />
              <div>
                <p className="font-semibold text-sm" style={{ color: C.text }}>Profile completeness</p>
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>{percent === 100 ? 'All key details are filled in.' : `${missing.length} item${missing.length === 1 ? '' : 's'} left`}</p>
              </div>
            </div>
            {missing.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {missing.map((m) => (
                  <li key={m} className="text-xs flex items-center gap-2" style={{ color: C.sub }}>
                    <AlertCircle className="w-3.5 h-3.5" style={{ color: '#B7791F' }} /> {m}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <Camera className="w-4 h-4" style={{ color: C.teal }} />
              <p className="font-semibold text-sm" style={{ color: C.text }}>Scan an ID</p>
            </div>
            <p className="text-xs mb-3" style={{ color: C.muted }}>Upload a photo of an ID or report to auto-fill date of birth and blood group. Review the result before saving.</p>
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer border border-gray-200 hover:bg-gray-50" style={{ color: C.navy }}>
              {scanning ? 'Reading image...' : 'Choose image'}
              <input type="file" accept="image/*" onChange={handleScan} disabled={scanning} className="hidden" />
            </label>
          </Card>

          <Button type="submit" loading={saving} disabled={!dirty} className="w-full py-3">
            <Save className="w-4 h-4" /> {dirty ? 'Save KYC' : 'All changes saved'}
          </Button>
        </div>
      </div>
    </form>
  );
}