import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import { Card, PageHeader, Button, Notice, Loading, EmptyState, C } from '../components/ui';
import { QrCode, Copy, Download, RefreshCw, ExternalLink, FileText } from 'lucide-react';

function Switch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{ width: 46, height: 26, borderRadius: 999, backgroundColor: checked ? C.teal : '#D1D5DB', position: 'relative', flexShrink: 0, transition: 'background-color .15s', opacity: disabled ? 0.6 : 1 }}
    >
      <span style={{ position: 'absolute', top: 3, left: checked ? 23 : 3, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#FFFFFF', transition: 'left .15s' }} />
    </button>
  );
}

export default function Emergency() {
  const toast = useToast();
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState('');

  useEffect(() => {
    api.get('/emergency/settings')
      .then((res) => setState(res.data))
      .catch((err) => setError(err.response?.data?.message || "Couldn't load this page. Is the backend running?"));
  }, []);

  const url = state?.token ? `${window.location.origin}/e/${state.token}` : '';

  useEffect(() => {
    if (!url || !state?.enabled) {
      setQr('');
      return;
    }
    QRCode.toDataURL(url, { width: 300, margin: 1, errorCorrectionLevel: 'M' }).then(setQr).catch(() => setQr(''));
  }, [url, state?.enabled]);

  const update = async (body, okMessage) => {
    setBusy(true);
    try {
      const res = await api.post('/emergency/settings', body);
      setState(res.data);
      toast.success(okMessage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save that change.');
    }
    setBusy(false);
  };

  const regenerate = () => {
    if (!window.confirm('Make a new QR code? The old QR code and link will stop working immediately.')) return;
    update({ regenerate: true }, 'New QR created. The old one no longer works.');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy. Select the link and copy it by hand.');
    }
  };

  if (error) return <Notice color="red">{error}</Notice>;
  if (!state) return <Loading />;

  if (!state.hasKyc) {
    return (
      <div>
        <PageHeader title="Emergency card" subtitle="A QR code that shows your key medical details to a first responder" />
        <Card>
          <EmptyState
            icon={FileText}
            title="Fill in your KYC first"
            text="The card shows your blood group, allergies and emergency contact, so those need to be saved."
            action={<Link to="/kyc"><Button>Go to KYC</Button></Link>}
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Emergency card" subtitle="A QR code that shows your key medical details to a first responder, without a login" />

      <div className="grid grid-cols-5 gap-6 items-start">
        <div className="col-span-3 space-y-5">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold text-[15px]" style={{ color: C.text }}>Emergency access</p>
                <p className="text-sm mt-0.5" style={{ color: C.sub }}>
                  {state.enabled ? 'On. Anyone who scans your QR code can see the details listed below.' : 'Off. Nobody can open your emergency page.'}
                </p>
              </div>
              <Switch checked={state.enabled} disabled={busy} onChange={(v) => update({ enabled: v }, v ? 'Emergency access is on' : 'Emergency access is off')} />
            </div>
          </Card>

          <Card className="p-6">
            <p className="font-semibold text-[15px] mb-3" style={{ color: C.text }}>What a person who scans it sees</p>
            <ul className="text-sm space-y-1.5" style={{ color: C.sub }}>
              <li>Your name and age</li>
              <li>Blood group</li>
              <li>Allergies and current medications</li>
              <li>Your emergency contact, with a call button</li>
            </ul>
            <p className="font-semibold text-[15px] mt-5 mb-2" style={{ color: C.text }}>What they never see</p>
            <p className="text-sm" style={{ color: C.sub }}>Your email, phone number, ABHA number, surgeries, visit history, vitals or anything else.</p>
          </Card>

          <Notice color="amber">
            This page needs no password, so anyone holding the QR code can read it. Turn it on only if you're comfortable with that, and generate a new QR if the old one is lost or shared. Each scan is recorded in{' '}
            <Link to="/access-log" className="font-semibold underline">Who accessed me</Link>.
          </Notice>
        </div>

        <Card className="col-span-2 p-6 text-center">
          {state.enabled && qr ? (
            <>
              <img src={qr} alt="Emergency QR code" style={{ width: 240, height: 240, margin: '0 auto', borderRadius: 12, border: '1px solid #EAEBEF' }} />
              <p className="text-xs mt-3 break-all" style={{ color: C.muted }}>{url}</p>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button variant="secondary" onClick={copy}><Copy className="w-4 h-4" /> Copy link</Button>
                <a href={qr} download="medkyc-emergency-qr.png">
                  <Button variant="secondary" className="w-full"><Download className="w-4 h-4" /> Save QR</Button>
                </a>
                <a href={url} target="_blank" rel="noreferrer">
                  <Button variant="secondary" className="w-full"><ExternalLink className="w-4 h-4" /> Preview</Button>
                </a>
                <Button variant="secondary" onClick={regenerate} disabled={busy}><RefreshCw className="w-4 h-4" /> New QR</Button>
              </div>
              {window.location.hostname === 'localhost' && (
                <p className="text-xs mt-4" style={{ color: '#B7791F' }}>
                  You're on localhost, so this link only opens on this computer. Create your real QR on the live site.
                </p>
              )}
              <p className="text-xs mt-4" style={{ color: C.muted }}>Save it as your phone's lock-screen picture, or print it for your wallet.</p>
            </>
          ) : (
            <EmptyState icon={QrCode} title="No active QR code" text="Turn on emergency access to create one." />
          )}
        </Card>
      </div>
    </div>
  );
}