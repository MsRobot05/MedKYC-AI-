import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import { Card, PageHeader, Badge, Button, Loading, EmptyState, C } from '../components/ui';
import { HeartPulse, Droplet, Activity, Wind, Scale, Trash2 } from 'lucide-react';

const TYPES = {
  bp: { label: 'Blood pressure', unit: 'mmHg', icon: HeartPulse },
  sugar: { label: 'Blood sugar', unit: 'mg/dL', icon: Droplet },
  pulse: { label: 'Pulse', unit: 'bpm', icon: Activity },
  spo2: { label: 'Oxygen (SpO2)', unit: '%', icon: Wind },
  weight: { label: 'Weight', unit: 'kg', icon: Scale },
};
const STATUS = { normal: ['green', 'Normal'], watch: ['amber', 'Watch'], high: ['red', 'High'], low: ['purple', 'Low'] };

const show = (r) => (r.type === 'bp' ? `${r.value}/${r.value2}` : String(r.value));
const when = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const localNow = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

function Chart({ rows, type }) {
  const data = [...rows].reverse().slice(-30); // oldest to newest
  if (data.length < 2) {
    return <p className="text-sm py-10 text-center" style={{ color: C.muted }}>Add at least two readings to see a trend.</p>;
  }
  const W = 640, H = 200, P = { l: 40, r: 14, t: 14, b: 26 };
  const series = type === 'bp'
    ? [{ key: 'value', color: '#B3261E' }, { key: 'value2', color: '#2563EB' }]
    : [{ key: 'value', color: C.teal }];

  const all = data.flatMap((r) => series.map((s) => r[s.key])).filter(Number.isFinite);
  let min = Math.min(...all);
  let max = Math.max(...all);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.15;
  min -= pad;
  max += pad;

  const x = (i) => P.l + (i / (data.length - 1)) * (W - P.l - P.r);
  const y = (v) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
  const ticks = [0, 1, 2, 3].map((i) => min + ((max - min) * i) / 3);
  const dotColor = { normal: '#1E7A3D', watch: '#B7791F', high: '#B3261E', low: '#6B3FA0' };

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${TYPES[type].label} trend`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="#F1F2F4" />
            <text x={P.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#8A8F98">{Math.round(t)}</text>
          </g>
        ))}
        {series.map((s) => (
          <polyline
            key={s.key}
            fill="none"
            stroke={s.color}
            strokeWidth="2.5"
            strokeLinejoin="round"
            points={data.map((r, i) => `${x(i)},${y(r[s.key])}`).join(' ')}
          />
        ))}
        {data.map((r, i) => (
          <circle key={r._id} cx={x(i)} cy={y(r.value)} r="4" fill={dotColor[r.status] || series[0].color} stroke="#FFFFFF" strokeWidth="2">
            <title>{`${show(r)} ${TYPES[type].unit} on ${when(r.measuredAt)}`}</title>
          </circle>
        ))}
        <text x={P.l} y={H - 6} fontSize="11" fill="#8A8F98">{when(data[0].measuredAt)}</text>
        <text x={W - P.r} y={H - 6} textAnchor="end" fontSize="11" fill="#8A8F98">{when(data[data.length - 1].measuredAt)}</text>
      </svg>
      {type === 'bp' && (
        <div className="flex gap-4 text-xs mt-1" style={{ color: C.sub }}>
          <span className="flex items-center gap-1.5"><span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#B3261E' }} />Top number</span>
          <span className="flex items-center gap-1.5"><span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#2563EB' }} />Bottom number</span>
        </div>
      )}
    </div>
  );
}

export default function Vitals() {
  const toast = useToast();
  const [type, setType] = useState('bp');
  const [rows, setRows] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ value: '', value2: '', context: 'fasting', note: '', measuredAt: localNow() });

  const load = useCallback(async () => {
    setRows(null);
    try {
      const res = await api.get('/vitals', { params: { type } });
      setRows(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't load readings. Is the backend running?");
      setRows([]);
    }
  }, [type, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setForm({ value: '', value2: '', context: 'fasting', note: '', measuredAt: localNow() });
  }, [type]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const meta = TYPES[type];
  const latest = rows?.[0];

  const stats = useMemo(() => {
    if (!rows?.length) return null;
    const recent = rows.slice(0, 7);
    const avg = (key) => recent.reduce((s, r) => s + r[key], 0) / recent.length;
    const vals = rows.map((r) => r.value);
    return {
      avg: type === 'bp' ? `${Math.round(avg('value'))}/${Math.round(avg('value2'))}` : avg('value').toFixed(1),
      min: Math.min(...vals),
      max: Math.max(...vals),
    };
  }, [rows, type]);

  const add = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/vitals', {
        type,
        value: form.value,
        value2: form.value2,
        context: form.context,
        note: form.note,
        measuredAt: new Date(form.measuredAt).toISOString(),
      });
      toast.success('Reading saved');
      setForm({ value: '', value2: '', context: 'fasting', note: '', measuredAt: localNow() });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save that reading.');
    }
    setSaving(false);
  };

  const remove = async (id) => {
    try {
      await api.delete(`/vitals/${id}`);
      setRows((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete.');
    }
  };

  const inputClass = 'w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500';

  return (
    <div>
      <PageHeader title="Vitals" subtitle="Log your readings and watch the trend over time" />

      <div className="inline-flex gap-1 rounded-xl p-1 mb-6" style={{ backgroundColor: '#F2F3F5' }}>
        {Object.entries(TYPES).map(([key, t]) => {
          const Icon = t.icon;
          return (
            <button
              key={key}
              onClick={() => setType(key)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium"
              style={type === key ? { backgroundColor: '#FFFFFF', color: C.navy, boxShadow: '0 1px 2px rgba(16,24,40,0.08)' } : { color: C.muted }}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-5 gap-6 items-start">
        <div className="col-span-3 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-5">
              <p className="text-xs" style={{ color: C.sub }}>Latest</p>
              <p className="text-[26px] font-semibold mt-1 leading-none" style={{ color: C.text }}>{latest ? show(latest) : '--'}</p>
              <p className="text-xs mt-1" style={{ color: C.muted }}>{meta.unit}</p>
              {latest && STATUS[latest.status] && <div className="mt-2"><Badge color={STATUS[latest.status][0]}>{STATUS[latest.status][1]}</Badge></div>}
            </Card>
            <Card className="p-5">
              <p className="text-xs" style={{ color: C.sub }}>Average (last 7)</p>
              <p className="text-[26px] font-semibold mt-1 leading-none" style={{ color: C.text }}>{stats ? stats.avg : '--'}</p>
              <p className="text-xs mt-1" style={{ color: C.muted }}>{meta.unit}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs" style={{ color: C.sub }}>Range</p>
              <p className="text-[26px] font-semibold mt-1 leading-none" style={{ color: C.text }}>{stats ? `${stats.min}-${stats.max}` : '--'}</p>
              <p className="text-xs mt-1" style={{ color: C.muted }}>{type === 'bp' ? 'top number' : meta.unit}</p>
            </Card>
          </div>

          <Card className="p-5">
            <p className="font-semibold text-[15px] mb-3" style={{ color: C.text }}>Trend</p>
            {rows === null ? <Loading /> : <Chart rows={rows} type={type} />}
          </Card>

          <Card className="p-5">
            <p className="font-semibold text-[15px] mb-1" style={{ color: C.text }}>Readings</p>
            {rows === null ? (
              <Loading />
            ) : rows.length === 0 ? (
              <EmptyState icon={meta.icon} title="No readings yet" text="Add your first one using the form." />
            ) : (
              rows.slice(0, 12).map((r) => (
                <div key={r._id} className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid #F1F2F4' }}>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: C.text }}>
                      {show(r)} <span className="font-normal text-xs" style={{ color: C.muted }}>{meta.unit}{r.context ? `, ${r.context === 'fasting' ? 'fasting' : 'after meal'}` : ''}</span>
                    </p>
                    <p className="text-xs" style={{ color: C.muted }}>{when(r.measuredAt)}{r.note ? ` · ${r.note}` : ''}</p>
                  </div>
                  {STATUS[r.status] && <Badge color={STATUS[r.status][0]}>{STATUS[r.status][1]}</Badge>}
                  <button onClick={() => remove(r._id)} aria-label="Delete reading" className="p-1.5 rounded-lg hover:bg-gray-50">
                    <Trash2 className="w-4 h-4" style={{ color: C.muted }} />
                  </button>
                </div>
              ))
            )}
          </Card>
        </div>

        <Card className="col-span-2 p-5" style={{ position: 'sticky', top: 88 }}>
          <p className="font-semibold text-[15px] mb-4" style={{ color: C.text }}>Add a reading</p>
          <form onSubmit={add} className="space-y-4">
            {type === 'bp' ? (
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs font-medium mb-1.5" style={{ color: C.sub }}>Top number</span>
                  <input required inputMode="numeric" value={form.value} onChange={(e) => set({ value: e.target.value })} placeholder="120" className={inputClass} />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium mb-1.5" style={{ color: C.sub }}>Bottom number</span>
                  <input required inputMode="numeric" value={form.value2} onChange={(e) => set({ value2: e.target.value })} placeholder="80" className={inputClass} />
                </label>
              </div>
            ) : (
              <label className="block">
                <span className="block text-xs font-medium mb-1.5" style={{ color: C.sub }}>{meta.label} ({meta.unit})</span>
                <input required inputMode="decimal" value={form.value} onChange={(e) => set({ value: e.target.value })} className={inputClass} />
              </label>
            )}

            {type === 'sugar' && (
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl" style={{ backgroundColor: '#F2F3F5' }}>
                {[['fasting', 'Fasting'], ['after_meal', 'After meal']].map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => set({ context: v })}
                    className="py-2 rounded-lg text-sm font-medium"
                    style={form.context === v ? { backgroundColor: '#FFFFFF', color: C.navy, boxShadow: '0 1px 2px rgba(16,24,40,0.08)' } : { color: C.muted }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}

            <label className="block">
              <span className="block text-xs font-medium mb-1.5" style={{ color: C.sub }}>When</span>
              <input type="datetime-local" required value={form.measuredAt} max={localNow()} onChange={(e) => set({ measuredAt: e.target.value })} className={inputClass} />
            </label>

            <label className="block">
              <span className="block text-xs font-medium mb-1.5" style={{ color: C.sub }}>Note (optional)</span>
              <input value={form.note} maxLength={200} onChange={(e) => set({ note: e.target.value })} placeholder="e.g. after a walk" className={inputClass} />
            </label>

            <Button type="submit" loading={saving} className="w-full">Save reading</Button>
          </form>
          <p className="text-xs mt-4" style={{ color: C.muted }}>
            Normal, watch and high labels use general reference ranges. They are not a diagnosis. Talk to your doctor about any reading that worries you.
          </p>
        </Card>
      </div>
    </div>
  );
}