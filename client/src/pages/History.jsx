import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Clock, Pill, FileText } from 'lucide-react';

export default function History() {
  const [kyc, setKyc] = useState(null);

  useEffect(() => {
    api.get('/patient/kyc').then((res) => setKyc(res.data)).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Visit History</h1>
      <p className="text-sm text-gray-500 mb-6">Your recorded medical history and past visits</p>

      {!kyc && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No history yet — fill out your KYC form to get started.</p>
        </div>
      )}

      {kyc && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Pill className="w-4 h-4 text-blue-600" />
              <h3 className="font-medium text-sm text-gray-900">Medications</h3>
            </div>
            {kyc.medications?.length ? (
              <ul className="space-y-1.5">
                {kyc.medications.map((m, i) => (
                  <li key={i} className="text-sm text-gray-600">{m}</li>
                ))}
              </ul>
            ) : <p className="text-sm text-gray-400">None recorded</p>}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="font-medium text-sm text-gray-900">Past Surgeries</h3>
            </div>
            {kyc.pastSurgeries?.length ? (
              <ul className="space-y-1.5">
                {kyc.pastSurgeries.map((s, i) => (
                  <li key={i} className="text-sm text-gray-600">{s}</li>
                ))}
              </ul>
            ) : <p className="text-sm text-gray-400">None recorded</p>}
          </div>
        </div>
      )}
    </div>
  );
}