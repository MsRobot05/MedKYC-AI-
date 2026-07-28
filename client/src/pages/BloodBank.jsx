import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function BloodBank() {
  const [banks, setBanks] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/bloodbanks').then((res) => setBanks(res.data));
  }, []);

  const handleRequest = async (bankId) => {
    const bloodGroup = prompt('Enter blood group needed (e.g. O+):');
    if (!bloodGroup) return;
    try {
      await api.post('/bloodbanks/request', { bloodBankId: bankId, bloodGroup, neededBy: new Date() });
      setMessage('Request pre-registered successfully!');
    } catch (err) {
      setMessage('Failed to register request');
    }
  };

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Nearby Blood Banks</h1>
      {message && <p className="text-green-600 text-sm mb-3">{message}</p>}
      <div className="grid grid-cols-2 gap-4">
        {banks.map((bank) => (
          <div key={bank._id} className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-medium">{bank.name}</h3>
            <p className="text-sm text-gray-500">{bank.address}</p>
            <div className="grid grid-cols-4 gap-1 my-3 text-xs">
              {Object.entries(bank.stock).map(([group, count]) => (
                <div key={group} className="bg-gray-50 rounded px-2 py-1 text-center">
                  <div className="font-medium">{group}</div>
                  <div className="text-gray-500">{count}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <a href={`tel:${bank.phone}`} className="flex-1 text-center bg-gray-100 rounded-lg py-2 text-sm">Call</a>
              <button onClick={() => handleRequest(bank._id)} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm">
                Pre-register
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}