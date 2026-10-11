
import React, { useState, useMemo } from 'react';
import {
  Calendar, Droplet, AlertCircle, Pill, FileText, Phone,
  Camera, ShieldCheck, X, Plus,
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

function TagInput({ icon: Icon, label, placeholder, items, onAdd, onRemove }) {
  const [value, setValue] = useState('');

  function handleAdd() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
  }

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
        <Icon size={16} className="text-teal-600" />
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          placeholder={placeholder}
          className="flex-1 h-11 px-4 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="h-11 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium flex items-center gap-1.5 hover:bg-slate-800 active:scale-[0.98] transition"
        >
          <Plus size={16} />
          Add
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {items.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-teal-50 text-teal-800 text-xs font-medium border border-teal-100"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="hover:bg-teal-100 rounded-full p-0.5 transition"
                aria-label={`Remove ${item}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ConsentToggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-teal-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function PatientKYCForm() {
  const [dob, setDob] = useState('2026-07-29');
  const [bloodGroup, setBloodGroup] = useState('A-');
  const [allergies, setAllergies] = useState(['Penicillin']);
  const [medications, setMedications] = useState([]);
  const [surgeries, setSurgeries] = useState([]);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [consent, setConsent] = useState({
    allergies: true,
    history: true,
    medications: true,
  });

  const completeness = useMemo(() => {
    const fields = [
      dob, bloodGroup, allergies.length > 0, medications.length > 0,
      surgeries.length > 0, contactName, contactPhone,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [dob, bloodGroup, allergies, medications, surgeries, contactName, contactPhone]);

  const ringCircumference = 2 * Math.PI * 26;
  const ringOffset = ringCircumference - (completeness / 100) * ringCircumference;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Patient KYC form</h1>
            <p className="text-sm text-slate-500 mt-1">Keep your medical profile complete and up to date</p>
          </div>
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5">
            <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
              <circle cx="28" cy="28" r="26" fill="none" stroke="#E2E8F0" strokeWidth="4" />
              <circle
                cx="28" cy="28" r="26" fill="none" stroke="#0D9488" strokeWidth="4"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                transform="rotate(-90 28 28)"
                style={{ transition: 'stroke-dashoffset 0.4s ease' }}
              />
              <text x="28" y="33" textAnchor="middle" fontSize="14" fontWeight="600" fill="#0F172A">
                {completeness}%
              </text>
            </svg>
            <div>
              <p className="text-xs font-medium text-slate-700 leading-tight">Profile<br />complete</p>
            </div>
          </div>
        </div>

        {/* Scan ID banner */}
        <button className="w-full flex items-center justify-center gap-2 mb-6 py-3 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 text-sm font-medium hover:bg-teal-100 transition">
          <Camera size={16} />
          Scan ID to auto-fill
        </button>

        {/* Main form card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-7">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Calendar size={16} className="text-teal-600" />
                Date of birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Droplet size={16} className="text-teal-600" />
                Blood group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <TagInput
            icon={AlertCircle}
            label="Allergies"
            placeholder="e.g. Penicillin"
            items={allergies}
            onAdd={(v) => setAllergies([...allergies, v])}
            onRemove={(i) => setAllergies(allergies.filter((_, idx) => idx !== i))}
          />

          <TagInput
            icon={Pill}
            label="Current medications"
            placeholder="e.g. Metformin 500mg"
            items={medications}
            onAdd={(v) => setMedications([...medications, v])}
            onRemove={(i) => setMedications(medications.filter((_, idx) => idx !== i))}
          />

          <TagInput
            icon={FileText}
            label="Past surgeries"
            placeholder="e.g. Appendectomy 2019"
            items={surgeries}
            onAdd={(v) => setSurgeries([...surgeries, v])}
            onRemove={(i) => setSurgeries(surgeries.filter((_, idx) => idx !== i))}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Phone size={16} className="text-teal-600" />
                Emergency contact name
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Full name"
                className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Phone size={16} className="text-teal-600" />
                Emergency contact phone
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Consent card — visually distinct */}
        <div className="mt-6 bg-white border border-teal-100 rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-2.5 mb-1">
            <ShieldCheck size={18} className="text-teal-600" />
            <h2 className="text-base font-semibold text-slate-900">Consent — what can doctors see?</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            You control which parts of your profile are visible to a doctor during a visit. You can change this anytime.
          </p>
          <ConsentToggle
            label="Share allergies"
            description="Doctors can view your recorded allergy list"
            checked={consent.allergies}
            onChange={(v) => setConsent({ ...consent, allergies: v })}
          />
          <ConsentToggle
            label="Share history"
            description="Doctors can view your past surgeries and medical history"
            checked={consent.history}
            onChange={(v) => setConsent({ ...consent, history: v })}
          />
          <ConsentToggle
            label="Share medications"
            description="Doctors can view your current medications"
            checked={consent.medications}
            onChange={(v) => setConsent({ ...consent, medications: v })}
          />
        </div>

        {/* Save bar */}
        <div className="mt-6 flex justify-end">
          <button className="px-6 h-11 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 active:scale-[0.98] transition">
            Save profile
          </button>
        </div>
      </div>
    </div>
  );
}