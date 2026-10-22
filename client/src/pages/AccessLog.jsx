import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card, PageHeader, Notice, Loading, EmptyState, Badge, C, tone } from '../components/ui';
import { Eye, Stethoscope, ShieldCheck, QrCode } from 'lucide-react';

const ACTIONS = {
  viewed_record: { text: 'viewed your health record', icon: Eye, color: 'teal' },
  added_visit: { text: 'added a visit to your record', icon: Stethoscope, color: 'purple' },
  emergency_scan: { text: 'scanned your emergency QR code', icon: QrCode, color: 'red' },
};

const fmt = (d) =>
  new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function AccessLog() {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/access-log')
      .then((res) => setLogs(res.data))
      .catch((err) => {
        setError(err.response?.data?.message || "Couldn't load the access log. Is the backend running?");
        setLogs([]);
      });
  }, []);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Who accessed my record" subtitle="Every time a doctor opens your record, or someone scans your emergency QR, it is listed here." />
      {error && <Notice color="red">{error}</Notice>}

      <Card className="p-5">
        {logs === null ? (
          <Loading />
        ) : logs.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No one has accessed your record" text="You'll see an entry here the moment someone does." />
        ) : (
          <div className="space-y-4">
            {logs.map((l) => {
              const a = ACTIONS[l.action] || ACTIONS.viewed_record;
              const Icon = a.icon;
              const t = tone(a.color);
              const who = l.action === 'emergency_scan' ? 'Someone' : l.viewer?.name || 'A user';
              return (
                <div key={l._id} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: t.bg }}>
                    <Icon className="w-4 h-4" style={{ color: t.fg }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: C.text }}>
                      <b>{who}</b> {a.text}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>{fmt(l.createdAt)}</p>
                  </div>
                  <Badge color={l.action === 'emergency_scan' ? 'red' : 'gray'}>{l.viewerRole}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}