import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import { Card, PageHeader, Badge, Button, Notice, Loading, EmptyState, C, tone } from '../components/ui';
import { Droplet, Phone, MapPin, Search, X } from 'lucide-react';

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const pad = (n) => String(n).padStart(2, '0');
const dayInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return dayInput(d);
};

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function BloodBank() {
  const toast = useToast();
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('');
  const [onlyStock, setOnlyStock] = useState(false);
  const [me, setMe] = useState(null);
  const [myGroup, setMyGroup] = useState('');
  const [modal, setModal] = useState(null); // the bank being requested from
  const [form, setForm] = useState({ group: '', neededBy: tomorrow() });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/bloodbanks')
      .then((res) => setBanks(res.data))
      .catch((err) => setError(err.response?.data?.message || "Couldn't load blood banks. Is the backend running?"))
      .finally(() => setLoading(false));

    api.get('/patient/kyc').then((res) => setMyGroup(res.data.bloodGroup || '')).catch(() => {});

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 8000 }
      );
    }
  }, []);

  const list = useMemo(() => {
    let items = banks.map((b) => ({
      ...b,
      km: me && Number.isFinite(b.lat) && Number.isFinite(b.lng) ? haversine(me.lat, me.lng, b.lat, b.lng) : null,
    }));
    const s = q.trim().toLowerCase();
    if (s) items = items.filter((b) => `${b.name} ${b.address}`.toLowerCase().includes(s));
    if (group && onlyStock) items = items.filter((b) => (b.stock?.[group] || 0) > 0);
    if (me) items.sort((a, b) => (a.km ?? 99) - (b.km ?? 99));
    else if (group) items.sort((a, b) => (b.stock?.[group] || 0) - (a.stock?.[group] || 0));
    return items;
  }, [banks, q, group, onlyStock, me]);

  const openModal = (bank) => {
    setForm({ group: group || myGroup || '', neededBy: tomorrow() });
    setModal(bank);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/bloodbanks/request', {
        bloodBankId: modal._id,
        bloodGroup: form.group,
        neededBy: new Date(`${form.neededBy}T09:00:00`).toISOString(),
      });
      toast.success(`Request for ${form.group} sent to ${modal.name}`);
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send the request.');
    }
    setSaving(false);
  };

  const cell = (n) => (n === 0 ? tone('red') : n < 5 ? tone('amber') : tone('teal'));

  return (
    <div>
      <PageHeader
        title="Blood banks"
        subtitle={me ? 'Nearest first. Check stock, call, or pre-register a request.' : 'Check stock, call, or pre-register a request. Turn on location to sort by distance.'}
      />

      {error && <Notice color="red">{error}</Notice>}

      <Card className="p-4 mb-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ border: '1px solid #E5E7EB', minWidth: 260 }}>
            <Search className="w-4 h-4" style={{ color: C.muted }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or area" className="text-sm flex-1 focus:outline-none" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setGroup('')}
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={!group ? { backgroundColor: C.navy, color: '#FFFFFF' } : { border: '1px solid #E5E7EB', color: C.sub }}
            >
              All
            </button>
            {GROUPS.map((g) => (
              <button
                key={g}
                onClick={() => setGroup(group === g ? '' : g)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={group === g ? { backgroundColor: '#B3261E', color: '#FFFFFF' } : { border: '1px solid #E5E7EB', color: C.sub }}
              >
                {g}
              </button>
            ))}
          </div>
          {group && (
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: C.sub }}>
              <input type="checkbox" checked={onlyStock} onChange={(e) => setOnlyStock(e.target.checked)} />
              Only banks with {group} in stock
            </label>
          )}
        </div>
      </Card>

      {loading ? (
        <Loading text="Loading blood banks..." />
      ) : list.length === 0 ? (
        <Card>
          <EmptyState icon={Droplet} title="No blood banks match" text="Try clearing the search or the filter." />
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {list.map((b) => (
            <Card key={b._id} className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FDEEEE' }}>
                  <Droplet className="w-4 h-4" style={{ color: '#B3261E' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: C.text }}>{b.name}</p>
                  <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: C.muted }}>
                    <MapPin className="w-3 h-3" /> {b.address}
                  </p>
                </div>
                {b.km != null && <Badge color="teal">{b.km.toFixed(1)} km</Badge>}
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {GROUPS.map((g) => {
                  const n = b.stock?.[g] || 0;
                  const t = cell(n);
                  return (
                    <div
                      key={g}
                      className="rounded-lg py-1.5 text-center"
                      style={{ backgroundColor: t.bg, outline: group === g ? `2px solid ${C.navy}` : 'none' }}
                    >
                      <div className="text-xs font-semibold" style={{ color: t.fg }}>{g}</div>
                      <div className="text-sm font-semibold" style={{ color: C.text }}>{n}</div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <a href={`tel:${b.phone}`} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50" style={{ color: C.navy }}>
                  <Phone className="w-4 h-4" /> Call
                </a>
                <Button className="flex-1" onClick={() => openModal(b)}>Pre-register</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <div
          onClick={() => setModal(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 80, backgroundColor: 'rgba(11,41,66,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            style={{ width: 400, maxWidth: '100%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, boxShadow: '0 24px 60px rgba(16,24,40,0.3)' }}
          >
            <div className="flex items-start justify-between mb-1">
              <h2 className="font-semibold text-lg" style={{ color: C.text }}>Pre-register a request</h2>
              <button type="button" onClick={() => setModal(null)} aria-label="Close"><X className="w-4 h-4" style={{ color: C.muted }} /></button>
            </div>
            <p className="text-sm mb-5" style={{ color: C.sub }}>{modal.name}</p>

            <span className="block text-xs font-medium mb-2" style={{ color: C.sub }}>Blood group needed</span>
            <div className="grid grid-cols-4 gap-2 mb-5">
              {GROUPS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, group: g }))}
                  className="py-2 rounded-lg text-sm font-semibold"
                  style={form.group === g ? { backgroundColor: '#B3261E', color: '#FFFFFF', border: '1px solid #B3261E' } : { border: '1px solid #E5E7EB', color: C.text }}
                >
                  {g}
                </button>
              ))}
            </div>

            <label className="block mb-5">
              <span className="block text-xs font-medium mb-1.5" style={{ color: C.sub }}>Needed by</span>
              <input
                type="date"
                required
                min={dayInput(new Date())}
                value={form.neededBy}
                onChange={(e) => setForm((f) => ({ ...f, neededBy: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none"
              />
            </label>

            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setModal(null)}>Cancel</Button>
              <Button type="submit" className="flex-1" loading={saving} disabled={!form.group}>Send request</Button>
            </div>
            <p className="text-xs mt-3" style={{ color: C.muted }}>This registers your interest. It doesn't reserve blood. Call the bank to confirm.</p>
          </form>
        </div>
      )}
    </div>
  );
}