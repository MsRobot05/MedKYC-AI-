import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Ambulance() {
  const [ambulances, setAmbulances] = useState([]);
  const [message, setMessage] = useState('');

  const loadAmbulances = () => {
    api.get('/ambulances').then((res) => setAmbulances(res.data));
  };

  useEffect(() => {
    loadAmbulances();
  }, []);

  const handleBook = async (id) => {
    try {
      const res = await api.post('/ambulances/book', { ambulanceId: id });
      setMessage(res.data.message);
      loadAmbulances();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Booking failed');
    }
  };

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Nearby Ambulances</h1>
      {message && <p className="text-green-600 text-sm mb-3">{message}</p>}
      <div className="grid grid-cols-2 gap-4">
        {ambulances.map((amb) => (
          <div key={amb._id} className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-medium">{amb.driverName}</h3>
            <p className="text-sm text-gray-500">{amb.vehicleNumber}</p>
            <div className="flex gap-2 mt-3">
              <a href={`tel:${amb.phone}`} className="flex-1 text-center bg-gray-100 rounded-lg py-2 text-sm">Call</a>
              <button onClick={() => handleBook(amb._id)} className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm">
                Book Now
              </button>
            </div>
          </div>
        ))}
      </div>
      {ambulances.length === 0 && <p className="text-gray-500 text-sm">No ambulances available right now.</p>}
    </div>
  );
}