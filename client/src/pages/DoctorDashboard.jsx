import { useState } from 'react';
import api from '../api/axios';

export default function DoctorDashboard() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescriptionInput, setPrescriptionInput] = useState('');
  const [prescription, setPrescription] = useState([]);
  const [notes, setNotes] = useState('');
  const [conflicts, setConflicts] = useState([]);
  const [message, setMessage] = useState('');

  const handleSearch = async () => {
    const res = await api.get(`/doctor/search?query=${query}`);
    setResults(res.data);
  };

  const selectPatient = async (patient) => {
    setSelectedPatient(patient);
    const res = await api.get(`/doctor/patient/${patient._id}`);
    setPatientData(res.data);
    setConflicts([]);
    setMessage('');
  };

  const addDrug = () => {
    if (!prescriptionInput.trim()) return;
    setPrescription([...prescription, prescriptionInput.trim()]);
    setPrescriptionInput('');
  };

  const submitVisit = async () => {
    try {
      const res = await api.post('/doctor/visit', {
        patientId: selectedPatient._id,
        diagnosis,
        prescription,
        notes,
      });
      setConflicts(res.data.conflicts || []);
      setMessage('Visit saved successfully');
      setDiagnosis('');
      setPrescription([]);
      setNotes('');
    } catch (err) {
      setMessage('Failed to save visit');
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Search column */}
      <div>
        <h2 className="font-semibold mb-2">Search Patient</h2>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or email"
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
          <button onClick={handleSearch} className="bg-blue-600 text-white px-4 rounded-lg text-sm">Search</button>
        </div>
        <div className="mt-3 space-y-2">
          {results.map((p) => (
            <div
              key={p._id}
              onClick={() => selectPatient(p)}
              className={`p-3 rounded-lg cursor-pointer text-sm ${selectedPatient?._id === p._id ? 'bg-blue-50' : 'bg-white shadow-sm hover:bg-gray-50'}`}
            >
              <div className="font-medium">{p.name}</div>
              <div className="text-gray-500 text-xs">{p.email}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Patient details + visit form */}
      <div className="col-span-2">
        {!selectedPatient && <p className="text-gray-500 text-sm">Select a patient to view their record.</p>}

        {selectedPatient && patientData && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-medium mb-2">{selectedPatient.name}'s KYC</h3>
              {patientData.patient ? (
                <div className="text-sm space-y-1">
                  <p><span className="text-gray-500">Blood group:</span> {patientData.patient.bloodGroup || '--'}</p>
                  <p><span className="text-gray-500">Allergies:</span> {patientData.patient.allergies?.join(', ') || 'None recorded'}</p>
                  <p><span className="text-gray-500">Medications:</span> {patientData.patient.medications?.join(', ') || 'None'}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No KYC filled yet.</p>
              )}
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
              <h3 className="font-medium">Add Visit</h3>
              <input
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Diagnosis"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <input
                  value={prescriptionInput}
                  onChange={(e) => setPrescriptionInput(e.target.value)}
                  placeholder="Add medicine (e.g. Amoxicillin 500mg)"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                />
                <button onClick={addDrug} className="bg-gray-100 px-4 rounded-lg text-sm">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {prescription.map((drug, i) => (
                  <span key={i} className="bg-gray-100 px-2 py-1 rounded-full text-xs">{drug}</span>
                ))}
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={2}
              />
              <button onClick={submitVisit} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">
                Save Visit
              </button>

              {conflicts.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <strong>⚠ AI Allergy Alert:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {conflicts.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}
              {message && conflicts.length === 0 && <p className="text-green-600 text-sm">{message}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}