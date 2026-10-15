import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { Card, PageHeader, Badge, Button, Notice, Loading, EmptyState, C } from '../components/ui';
import { Siren, Phone, CheckCircle2, Building2 } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const STEPS = ['Requested', 'Accepted', 'En Route', 'Arrived'];
const PROGRESS = { Requested: 0, Accepted: 0, 'En Route': 0.6, Arrived: 1 };
const PUNE = [18.5204, 73.8567];
const AVG_KMH = 30; // rough city average, used only for the ETA estimate

const dot = (color) =>
  L.divIcon({
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.45)"></div>`,
  });
const ME_ICON = dot('#2563EB');
const AMB_ICON = dot('#C62828');

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const etaMin = (km) => Math.max(1, Math.round((km / AVG_KMH) * 60));
const hasPos = (x) => Number.isFinite(x?.lat) && Number.isFinite(x?.lng);

function FitBounds({ points }) {
  const map = useMap();
  const key = JSON.stringify(points);
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) map.setView(points[0], 13);
    else map.fitBounds(points, { padding: [40, 40], maxZoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

function AmbMap({ me, ambulances, tracked, trackedInfo }) {
  const points = useMemo(() => {
    const p = [];
    if (me) p.push([me.lat, me.lng]);
    if (tracked) p.push(tracked);
    else ambulances.filter(hasPos).forEach((a) => p.push([a.lat, a.lng]));
    return p;
  }, [me, ambulances, tracked]);

  return (
    <MapContainer center={PUNE} zoom={12} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <FitBounds points={points} />
      {me && (
        <Marker position={[me.lat, me.lng]} icon={ME_ICON}>
          <Popup>You are here</Popup>
        </Marker>
      )}
      {tracked ? (
        <Marker position={tracked} icon={AMB_ICON}>
          <Popup>{trackedInfo}</Popup>
        </Marker>
      ) : (
        ambulances.filter(hasPos).map((a) => (
          <Marker key={a._id} position={[a.lat, a.lng]} icon={AMB_ICON}>
            <Popup>{a.driverName} ({a.vehicleNumber})</Popup>
          </Marker>
        ))
      )}
    </MapContainer>
  );
}

export default function Ambulance() {
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [me, setMe] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [booking, setBooking] = useState(null);
  const [status, setStatus] = useState('Requested');
  const [hospitals, setHospitals] = useState([]);
  const socketRef = useRef(null);

  const load = async () => {
    try {
      const res = await api.get('/ambulances');
      setAmbulances(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't load ambulances. Is the backend running?");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.on('statusUpdate', ({ status: s }) => setStatus(s));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 8000 }
      );
    }
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (booking) socketRef.current?.emit('joinBooking', booking._id);
  }, [booking]);

  // Real hospitals near you, from OpenStreetMap. Phone numbers exist only where volunteers added them.
  useEffect(() => {
    if (!me) return;
    const q = `[out:json][timeout:15];nwr["amenity"="hospital"](around:8000,${me.lat},${me.lng});out center 15;`;
    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(q)}`,
    })
      .then((r) => r.json())
      .then((data) => {
        const list = (data.elements || [])
          .map((el) => {
            const lat = el.lat ?? el.center?.lat;
            const lng = el.lon ?? el.center?.lon;
            return {
              id: el.id,
              name: el.tags?.name,
              phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
              km: Number.isFinite(lat) ? haversine(me.lat, me.lng, lat, lng) : null,
            };
          })
          .filter((h) => h.name)
          .sort((a, b) => (a.km ?? 99) - (b.km ?? 99))
          .slice(0, 6);
        setHospitals(list);
      })
      .catch(() => {});
  }, [me]);

  const list = useMemo(() => {
    const withKm = ambulances.map((a) => ({ ...a, km: me && hasPos(a) ? haversine(me.lat, me.lng, a.lat, a.lng) : null }));
    return me ? withKm.sort((a, b) => (a.km ?? 99) - (b.km ?? 99)) : withKm;
  }, [ambulances, me]);

  const book = async (a) => {
    setBookingId(a._id);
    setError('');
    try {
      const res = await api.post('/ambulances/book', { ambulanceId: a._id });
      setBooking(res.data.ambulance);
      setStatus('Requested');
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
      load();
    }
    setBookingId(null);
  };

  const progress = PROGRESS[status] ?? 0;
  const tracked = useMemo(() => {
    if (!booking || !hasPos(booking)) return null;
    if (!me) return [booking.lat, booking.lng];
    return [booking.lat + (me.lat - booking.lat) * progress, booking.lng + (me.lng - booking.lng) * progress];
  }, [booking, me, progress]);

  /* ---------------- Tracking view ---------------- */
  if (booking) {
    const totalKm = me && hasPos(booking) ? haversine(me.lat, me.lng, booking.lat, booking.lng) : null;
    const remaining = totalKm == null ? null : status === 'Arrived' ? 0 : etaMin((1 - progress) * totalKm);
    const stepIndex = STEPS.indexOf(status);

    return (
      <div>
        <PageHeader
          title={status === 'Arrived' ? 'Ambulance has arrived' : 'Ambulance on the way'}
          subtitle="Live status for your booking"
          action={<Badge color="amber">Demo simulation</Badge>}
        />
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-2 space-y-4">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FDEEEE' }}>
                  <Siren className="w-5 h-5" style={{ color: '#B3261E' }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold" style={{ color: C.text }}>{booking.driverName}</p>
                  <p className="text-sm" style={{ color: C.sub }}>{booking.vehicleNumber}</p>
                </div>
                {booking.phone && (
                  <a href={`tel:${booking.phone}`} className="w-10 h-10 rounded-xl flex items-center justify-center border border-gray-200 hover:bg-gray-50" aria-label="Call driver">
                    <Phone className="w-4 h-4" style={{ color: C.navy }} />
                  </a>
                )}
              </div>
              {remaining != null && (
                <div className="mt-4 rounded-xl px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#EEF7F6' }}>
                  <span className="text-xs" style={{ color: C.teal }}>Estimated arrival</span>
                  <span className="font-semibold" style={{ color: C.teal }}>{remaining === 0 ? 'Here now' : `~${remaining} min`}</span>
                </div>
              )}
            </Card>

            <Card className="p-5">
              {STEPS.map((step, i) => {
                const done = i <= stepIndex;
                return (
                  <div key={step} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: done ? C.teal : '#E5E7EB' }}>
                        {done && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      {i < STEPS.length - 1 && <div style={{ width: 2, height: 28, backgroundColor: i < stepIndex ? C.teal : '#E5E7EB' }} />}
                    </div>
                    <span className="text-sm pt-0.5" style={{ color: done ? C.text : C.muted, fontWeight: done ? 600 : 400 }}>{step}</span>
                  </div>
                );
              })}
              {status === 'Arrived' && (
                <Button
                  variant="secondary"
                  className="w-full mt-4"
                  onClick={() => {
                    setBooking(null);
                    setStatus('Requested');
                    load();
                  }}
                >
                  Done
                </Button>
              )}
            </Card>
          </div>

          <div className="col-span-3">
            <Card style={{ overflow: 'hidden', height: 460 }}>
              <AmbMap me={me} ambulances={[]} tracked={tracked} trackedInfo={`${booking.driverName} (${booking.vehicleNumber})`} />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- List view ---------------- */
  return (
    <div>
      <PageHeader title="Ambulance" subtitle={me ? 'Free ambulances nearest to you' : 'Free ambulances (turn on location to sort by distance)'} />

      <Card className="p-4 mb-5 flex items-center gap-4" style={{ backgroundColor: '#FDEEEE', border: '1px solid #F7D4D1' }}>
        <p className="text-sm font-semibold flex-1" style={{ color: '#B3261E' }}>In an emergency, don't wait. Call now.</p>
        {[['108', 'Ambulance'], ['112', 'Emergency'], ['102', 'Mother & child']].map(([n, l]) => (
          <a key={n} href={`tel:${n}`} className="px-4 py-2 rounded-xl text-center bg-white hover:brightness-95" style={{ border: '1px solid #F7D4D1' }}>
            <span className="block text-lg font-bold leading-tight" style={{ color: '#B3261E' }}>{n}</span>
            <span className="block text-xs" style={{ color: C.sub }}>{l}</span>
          </a>
        ))}
      </Card>

      {error && <Notice color="red">{error}</Notice>}
      {loading && <Loading text="Finding ambulances..." />}

      {!loading && (
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-2 space-y-3" style={{ maxHeight: 'calc(100vh - 340px)', minHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
            {list.length === 0 ? (
              <Card>
                <EmptyState icon={Siren} title="No ambulances are free right now" text="Call 108 for immediate help." />
              </Card>
            ) : (
              list.map((a) => (
                <Card key={a._id} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FDEEEE' }}>
                      <Siren className="w-5 h-5" style={{ color: '#B3261E' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: C.text }}>{a.driverName}</p>
                      <p className="text-xs" style={{ color: C.sub }}>{a.vehicleNumber}</p>
                    </div>
                    {a.km != null && (
                      <div className="text-right">
                        <Badge color="teal">{a.km.toFixed(1)} km</Badge>
                        <p className="text-xs mt-1" style={{ color: C.muted }}>~{etaMin(a.km)} min</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    {a.phone && (
                      <a href={`tel:${a.phone}`} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50" style={{ color: C.navy }}>
                        <Phone className="w-4 h-4" /> Call
                      </a>
                    )}
                    <Button variant="danger" className="flex-1" loading={bookingId === a._id} onClick={() => book(a)}>
                      Book now
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          <div className="col-span-3">
            <Card style={{ overflow: 'hidden', height: 'calc(100vh - 340px)', minHeight: 320, position: 'sticky', top: 88 }}>
              <AmbMap me={me} ambulances={list} tracked={null} />
            </Card>
          </div>
        </div>
      )}

      {hospitals.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold mb-3" style={{ color: C.text }}>
            Hospitals near you <span style={{ color: C.muted, fontWeight: 400 }}>(OpenStreetMap data, phone numbers only where listed)</span>
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {hospitals.map((h) => (
              <Card key={h.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 mt-0.5" style={{ color: C.teal }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: C.text }}>{h.name}</p>
                    {h.km != null && <p className="text-xs" style={{ color: C.muted }}>{h.km.toFixed(1)} km away</p>}
                    {h.phone ? (
                      <a href={`tel:${h.phone}`} className="text-xs font-medium mt-1 inline-flex items-center gap-1" style={{ color: C.teal }}>
                        <Phone className="w-3 h-3" /> {h.phone}
                      </a>
                    ) : (
                      <p className="text-xs mt-1" style={{ color: C.muted }}>No phone listed</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}