import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { io } from 'socket.io-client';
import { Siren, Phone, MapPin, CheckCircle2 } from 'lucide-react';

const statusSteps = ['Requested', 'Accepted', 'En Route', 'Arrived'];

export default function Ambulance() {
  const [ambulances, setAmbulances] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);
  const [status, setStatus] = useState('Requested');
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);

  const socketRef = useRef(null);

  const loadAmbulances = async () => {
    try {
      const res = await api.get('/ambulances');
      setAmbulances(res.data);
    } catch (err) {
      console.error('Failed to load ambulances:', err);
    }
  };

  const fetchNearbyHospitals = async (lat, lng) => {
    setLoadingHospitals(true);
    try {
      const query = `
        [out:json][timeout:15];
        (
          node["amenity"="hospital"](around:8000,${lat},${lng});
          node["emergency"="yes"](around:8000,${lat},${lng});
        );
        out body 15;
      `;
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
      });
      const data = await res.json();
      const hospitals = data.elements
        .map((el) => ({
          id: el.id,
          name: el.tags?.name || 'Unnamed Hospital',
          phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
          lat: el.lat,
          lng: el.lon,
        }))
        .filter((h) => h.name !== 'Unnamed Hospital');
      setNearbyHospitals(hospitals);
    } catch (err) {
      console.error('Failed to fetch nearby hospitals:', err);
    }
    setLoadingHospitals(false);
  };

  useEffect(() => {
    loadAmbulances();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetchNearbyHospitals(latitude, longitude);
        },
        () => console.log('Location denied — real hospital search unavailable')
      );
    }

    socketRef.current = io('http://localhost:5000');
    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.io:', socketRef.current.id);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!activeBooking || !socketRef.current) return;
    const bookingId = activeBooking._id;
    socketRef.current.emit('joinBooking', bookingId);

    const handleStatusUpdate = ({ status }) => setStatus(status);
    socketRef.current.on('statusUpdate', handleStatusUpdate);

    return () => {
      socketRef.current.off('statusUpdate', handleStatusUpdate);
    };
  }, [activeBooking]);

  const handleBook = async (amb) => {
    try {
      const res = await api.post('/ambulances/book', { ambulanceId: amb._id });
      setActiveBooking(res.data.ambulance);
      setStatus('Requested');
      loadAmbulances();
    } catch (err) {
      alert(err.response?.data?.message || 'Booking failed');
    }
  };

  if (activeBooking) {
    const currentStepIndex = statusSteps.indexOf(status);
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Ambulance Booked</h1>
        <p className="text-sm text-gray-500 mb-6">Tracking your ride in real time</p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <Siren className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{activeBooking.driverName}</p>
              <p className="text-sm text-gray-500">{activeBooking.vehicleNumber}</p>
            </div>
            {activeBooking.phone && (
              <a href={`tel:${activeBooking.phone}`} className="ml-auto bg-gray-100 hover:bg-gray-200 p-2.5 rounded-xl transition">
                <Phone className="w-4 h-4 text-gray-600" />
              </a>
            )}
          </div>

          <div className="mb-6 p-4 rounded-xl bg-blue-50">
            <p className="text-xs text-blue-500 uppercase font-medium">Current Status</p>
            <p className="text-lg font-semibold text-blue-700 mt-1">{status}</p>
          </div>

          <div className="space-y-0">
            {statusSteps.map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${i <= currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'}`}>
                    {i <= currentStepIndex && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  {i < statusSteps.length - 1 && (
                    <div className={`w-0.5 h-8 ${i < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  )}
                </div>
                <span className={`text-sm pb-8 ${i <= currentStepIndex ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          {status === 'Arrived' && (
            <button
              onClick={() => {
                setActiveBooking(null);
                setStatus('Requested');
                loadAmbulances();
              }}
              className="w-full mt-2 bg-gray-100 hover:bg-gray-200 rounded-xl py-2.5 text-sm font-medium transition"
            >
              Done
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Nearby Ambulances</h1>
      <p className="text-sm text-gray-500 mb-6">Book an ambulance and track it live</p>

      <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-6">
        <p className="text-xs font-semibold text-red-700 mb-3 uppercase tracking-wide">In an emergency, call now</p>
        <div className="grid grid-cols-3 gap-3">
          <a href="tel:108" className="bg-white rounded-xl p-3 text-center border border-red-100 hover:bg-red-100 transition">
            <p className="text-2xl font-bold text-red-600">108</p>
            <p className="text-xs text-gray-600 mt-0.5">National Ambulance</p>
          </a>
          <a href="tel:102" className="bg-white rounded-xl p-3 text-center border border-red-100 hover:bg-red-100 transition">
            <p className="text-2xl font-bold text-red-600">102</p>
            <p className="text-xs text-gray-600 mt-0.5">Pregnancy & Child</p>
          </a>
          <a href="tel:112" className="bg-white rounded-xl p-3 text-center border border-red-100 hover:bg-red-100 transition">
            <p className="text-2xl font-bold text-red-600">112</p>
            <p className="text-xs text-gray-600 mt-0.5">All Emergencies</p>
          </a>
        </div>
        <p className="text-xs text-gray-500 mt-3">India's real national emergency lines — free, available 24/7, nationwide.</p>
      </div>

      {loadingHospitals && <p className="text-xs text-gray-400 mb-4">Searching real hospitals nearby...</p>}

      {nearbyHospitals.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Real hospitals near you</p>
          <div className="grid grid-cols-2 gap-3">
            {nearbyHospitals.map((h) => (
              <div key={h.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="font-medium text-sm text-gray-900">{h.name}</p>
                {h.phone ? (
                  <a href={`tel:${h.phone}`} className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {h.phone}
                  </a>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">No phone listed on OpenStreetMap</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Or book through our network</p>

      <div className="grid grid-cols-2 gap-4">
        {ambulances.map((amb) => (
          <div key={amb._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Siren className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">{amb.driverName}</p>
                <p className="text-xs text-gray-500">{amb.vehicleNumber}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {amb.phone && (
                <a href={`tel:${amb.phone}`} className="flex-1 text-center bg-gray-100 hover:bg-gray-200 rounded-xl py-2 text-sm transition flex items-center justify-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
              )}
              <button onClick={() => handleBook(amb)} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2 text-sm font-medium transition">
                Book Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {ambulances.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No ambulances available right now.</p>
        </div>
      )}
    </div>
  );
}