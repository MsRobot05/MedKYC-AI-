import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Card, PageHeader, Badge, Button, Notice, Loading, EmptyState, C } from '../components/ui';
import { CalendarDays, Clock } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');
const SLOTS = [];
for (let h = 10; h < 17; h++) {
  SLOTS.push(`${pad(h)}:00`, `${pad(h)}:30`);
}
const STATUS_COLOR = { requested: 'amber', confirmed: 'green', completed: 'gray', cancelled: 'red' };
const MIN_LEAD_MS = 30 * 60 * 1000;

const dayInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtDay = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

function useAppointments() {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/appointments/mine');
      setList(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't load appointments. Is the backend running?");
      setList((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { list, error, load };
}

function Row({ appt, who, actions }) {
  return (
    <div className="flex items-center gap-4 py-3.5" style={{ borderBottom: '1px solid #F1F2F4' }}>
      <div className="w-14 text-center flex-shrink-0">
        <p className="text-xs" style={{ color: C.muted }}>{fmtDay(appt.date).split(',')[0]}</p>
        <p className="text-sm font-semibold" style={{ color: C.text }}>{fmtDay(appt.date).split(',')[1]}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: C.text }}>{who} <span style={{ color: C.muted, fontWeight: 400 }}>at {fmtTime(appt.date)}</span></p>
        {appt.reason && <p className="text-xs truncate" style={{ color: C.sub }}>{appt.reason}</p>}
      </div>
      <Badge color={STATUS_COLOR[appt.status]}>{appt.status}</Badge>
      <div className="flex gap-2">{actions}</div>
    </div>
  );
}

function splitList(list) {
  const now = Date.now();
  const upcoming = list.filter((a) => ['requested', 'confirmed'].includes(a.status) && new Date(a.date).getTime() >= now - 60 * 60 * 1000);
  const past = list.filter((a) => !upcoming.includes(a)).reverse();
  return { upcoming, past };
}

/* ---------------- Patient ---------------- */
function PatientView() {
  const { list, error, load } = useAppointments();
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return dayInput(d);
  });
  const [slot, setSlot] = useState('');
  const [reason, setReason] = useState('');
  const [taken, setTaken] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const today = useMemo(() => dayInput(new Date()), []);
  const maxDay = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return dayInput(d);
  }, []);

  useEffect(() => {
    api.get('/appointments/doctors')
      .then((res) => {
        setDoctors(res.data);
        if (res.data[0]) setDoctorId(res.data[0]._id);
      })
      .catch(() => setNotice({ color: 'red', text: "Couldn't load the doctor list." }));
  }, []);

  const loadTaken = useCallback(() => {
    if (!doctorId) return;
    api.get('/appointments/taken', { params: { doctorId } })
      .then((res) => setTaken(new Set(res.data.map((d) => new Date(d).getTime()))))
      .catch(() => {});
  }, [doctorId]);

  useEffect(() => {
    loadTaken();
  }, [loadTaken]);

  const slotTime = (s) => new Date(`${date}T${s}:00`).getTime();
  const unavailable = (s) => taken.has(slotTime(s)) || slotTime(s) < Date.now() + MIN_LEAD_MS;

  const book = async () => {
    setSaving(true);
    setNotice(null);
    try {
      await api.post('/appointments', { doctorId, date: new Date(`${date}T${slot}:00`).toISOString(), reason });
      setNotice({ color: 'green', text: 'Requested. The doctor will confirm it.' });
      setSlot('');
      setReason('');
      load();
      loadTaken();
    } catch (err) {
      setNotice({ color: 'red', text: err.response?.data?.message || 'Could not book that slot.' });
      loadTaken();
    }
    setSaving(false);
  };

  const cancel = async (id) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status: 'cancelled' });
      load();
      loadTaken();
    } catch (err) {
      setNotice({ color: 'red', text: err.response?.data?.message || 'Could not cancel.' });
    }
  };

  const { upcoming, past } = splitList(list || []);

  return (
    <div>
      <PageHeader title="Appointments" subtitle="Book a visit with a doctor. Times are in your local timezone." />
      {notice && <Notice color={notice.color}>{notice.text}</Notice>}
      {error && <Notice color="red">{error}</Notice>}

      <div className="grid grid-cols-5 gap-6 items-start">
        <Card className="col-span-2 p-5">
          <h2 className="font-semibold text-[15px] mb-4" style={{ color: C.text }}>Book a visit</h2>
          {doctors.length === 0 ? (
            <p className="text-sm" style={{ color: C.muted }}>No doctors are registered yet. Register a doctor account to try this.</p>
          ) : (
            <div className="space-y-4">
              <label className="block">
                <span className="block text-xs font-medium mb-1.5" style={{ color: C.sub }}>Doctor</span>
                <select value={doctorId} onChange={(e) => { setDoctorId(e.target.value); setSlot(''); }} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none">
                  {doctors.map((d) => <option key={d._id} value={d._id}>Dr. {d.name}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="block text-xs font-medium mb-1.5" style={{ color: C.sub }}>Date</span>
                <input type="date" value={date} min={today} max={maxDay} onChange={(e) => { setDate(e.target.value); setSlot(''); }} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none" />
              </label>

              <div>
                <span className="block text-xs font-medium mb-1.5" style={{ color: C.sub }}>Time</span>
                <div className="grid grid-cols-4 gap-2">
                  {SLOTS.map((s) => {
                    const off = !date || unavailable(s);
                    const on = slot === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={off}
                        onClick={() => setSlot(s)}
                        className="py-2 rounded-lg text-xs font-medium transition disabled:cursor-not-allowed"
                        style={
                          on
                            ? { backgroundColor: C.navy, color: '#FFFFFF', border: `1px solid ${C.navy}` }
                            : off
                            ? { backgroundColor: '#F7F8FA', color: '#C4C7CE', border: '1px solid #F1F2F4', textDecoration: 'line-through' }
                            : { backgroundColor: '#FFFFFF', color: C.text, border: '1px solid #E5E7EB' }
                        }
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className="block text-xs font-medium mb-1.5" style={{ color: C.sub }}>Reason (optional)</span>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} rows={2} placeholder="e.g. Fever for three days" className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none" />
              </label>

              <Button className="w-full" onClick={book} loading={saving} disabled={!doctorId || !date || !slot}>
                Request appointment
              </Button>
            </div>
          )}
        </Card>

        <div className="col-span-3 space-y-5">
          <Card className="p-5">
            <h2 className="font-semibold text-[15px] mb-1" style={{ color: C.text }}>Upcoming</h2>
            {list === null ? (
              <Loading />
            ) : upcoming.length === 0 ? (
              <EmptyState icon={CalendarDays} title="No upcoming appointments" text="Pick a doctor, date and time on the left." />
            ) : (
              upcoming.map((a) => (
                <Row
                  key={a._id}
                  appt={a}
                  who={`Dr. ${a.doctor?.name || 'Unknown'}`}
                  actions={<Button variant="secondary" className="!py-1.5 !px-3 text-xs" onClick={() => cancel(a._id)}>Cancel</Button>}
                />
              ))
            )}
          </Card>

          {past.length > 0 && (
            <Card className="p-5">
              <h2 className="font-semibold text-[15px] mb-1" style={{ color: C.text }}>History</h2>
              {past.slice(0, 8).map((a) => (
                <Row key={a._id} appt={a} who={`Dr. ${a.doctor?.name || 'Unknown'}`} />
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Doctor ---------------- */
function DoctorView() {
  const { list, error, load } = useAppointments();
  const [notice, setNotice] = useState(null);

  const setStatus = async (id, status) => {
    setNotice(null);
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      load();
    } catch (err) {
      setNotice({ color: 'red', text: err.response?.data?.message || 'Could not update.' });
    }
  };

  const { upcoming, past } = splitList(list || []);
  const pending = upcoming.filter((a) => a.status === 'requested').length;

  return (
    <div>
      <PageHeader title="Appointments" subtitle={pending ? `${pending} request${pending === 1 ? '' : 's'} waiting for you` : 'Your upcoming schedule'} />
      {notice && <Notice color={notice.color}>{notice.text}</Notice>}
      {error && <Notice color="red">{error}</Notice>}

      <Card className="p-5 mb-5">
        <h2 className="font-semibold text-[15px] mb-1" style={{ color: C.text }}>Upcoming</h2>
        {list === null ? (
          <Loading />
        ) : upcoming.length === 0 ? (
          <EmptyState icon={Clock} title="Nothing scheduled" text="Patients' booking requests will show up here." />
        ) : (
          upcoming.map((a) => (
            <Row
              key={a._id}
              appt={a}
              who={a.patient?.name || 'Unknown patient'}
              actions={
                <>
                  {a.status === 'requested' && <Button className="!py-1.5 !px-3 text-xs" onClick={() => setStatus(a._id, 'confirmed')}>Confirm</Button>}
                  {a.status === 'confirmed' && <Button className="!py-1.5 !px-3 text-xs" onClick={() => setStatus(a._id, 'completed')}>Mark done</Button>}
                  <Button variant="secondary" className="!py-1.5 !px-3 text-xs" onClick={() => setStatus(a._id, 'cancelled')}>Cancel</Button>
                </>
              }
            />
          ))
        )}
      </Card>

      {past.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold text-[15px] mb-1" style={{ color: C.text }}>History</h2>
          {past.slice(0, 10).map((a) => (
            <Row key={a._id} appt={a} who={a.patient?.name || 'Unknown patient'} />
          ))}
        </Card>
      )}
    </div>
  );
}

export default function Appointments() {
  const { user } = useAuth();
  return user?.role === 'doctor' ? <DoctorView /> : <PatientView />;
}