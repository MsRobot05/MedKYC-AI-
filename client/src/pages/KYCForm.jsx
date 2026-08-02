import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function KYCForm() {
  const [form, setForm] = useState({
    dob: '',
    bloodGroup: '',
    allergies: [],
    medications: [],
    pastSurgeries: [],
    emergencyContactName: '',
    emergencyContactPhone: '',
  });
  const [allergyInput, setAllergyInput] = useState('');
  const [medInput, setMedInput] = useState('');
  const [surgeryInput, setSurgeryInput] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/patient/kyc')
      .then((res) => setForm(res.data))
      .catch(() => {}); // no KYC yet, that's fine
  }, []);

  const addToList = (field, value, setInput) => {
    if (!value.trim()) return;
    setForm({ ...form, [field]: [...form[field], value.trim()] });
    setInput('');
  };

  const removeFromList = (field, index) => {
    setForm({ ...form, [field]: form[field].filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/patient/kyc', form);
      setMessage('KYC saved successfully!');
    } catch (err) {
      setMessage('Failed to save KYC');
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-semibold mb-4">Patient KYC Form</h1>
      {message && <p className="text-green-600 text-sm mb-3">{message}</p>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-5">
        {/* Identity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Date of Birth</label>
            <input
              type="date"
              value={form.dob?.slice(0, 10) || ''}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Blood Group</label>
            <select
              value={form.bloodGroup || ''}
              onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
            >
              <option value="">Select</option>
              {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Allergies */}
        <div>
          <label className="text-sm text-gray-600">Allergies</label>
          <div className="flex gap-2 mt-1">
            <input
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              placeholder="e.g. Penicillin"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            <button type="button" onClick={() => addToList('allergies', allergyInput, setAllergyInput)} className="bg-gray-100 px-4 rounded-lg text-sm">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {form.allergies?.map((a, i) => (
              <span key={i} className="bg-red-50 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                {a} <button type="button" onClick={() => removeFromList('allergies', i)}>×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Medications */}
        <div>
          <label className="text-sm text-gray-600">Current Medications</label>
          <div className="flex gap-2 mt-1">
            <input
              value={medInput}
              onChange={(e) => setMedInput(e.target.value)}
              placeholder="e.g. Metformin 500mg"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            <button type="button" onClick={() => addToList('medications', medInput, setMedInput)} className="bg-gray-100 px-4 rounded-lg text-sm">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {form.medications?.map((m, i) => (
              <span key={i} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                {m} <button type="button" onClick={() => removeFromList('medications', i)}>×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Past Surgeries */}
        <div>
          <label className="text-sm text-gray-600">Past Surgeries</label>
          <div className="flex gap-2 mt-1">
            <input
              value={surgeryInput}
              onChange={(e) => setSurgeryInput(e.target.value)}
              placeholder="e.g. Appendectomy 2019"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            <button type="button" onClick={() => addToList('pastSurgeries', surgeryInput, setSurgeryInput)} className="bg-gray-100 px-4 rounded-lg text-sm">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {form.pastSurgeries?.map((s, i) => (
              <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                {s} <button type="button" onClick={() => removeFromList('pastSurgeries', i)}>×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Emergency Contact Name</label>
            <input
              value={form.emergencyContactName || ''}
              onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Emergency Contact Phone</label>
            <input
              value={form.emergencyContactPhone || ''}
              onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
            />
          </div>
        </div>

        <button className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
          Save KYC
        </button>
      </form>
    </div>
  );
}