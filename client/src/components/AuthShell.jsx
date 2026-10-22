import { ShieldCheck, Siren, Bot } from 'lucide-react';

const POINTS = [
  [ShieldCheck, 'You control who sees your record', 'Field-level consent, with a log of every access.'],
  [Siren, 'Help when minutes matter', 'Blood banks, ambulances and a scannable emergency card.'],
  [Bot, 'An AI agent that asks first', 'It finds options and never acts without your tap.'],
];

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F7F8FA' }}>
      <div
        className="hidden lg:flex flex-col justify-between p-12"
        style={{ width: '44%', backgroundColor: '#0B2942', color: '#FFFFFF' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{ backgroundColor: '#5EEAD4', color: '#0B2942' }}>
            M
          </div>
          <span className="text-lg font-semibold tracking-tight">MedKYC-AI</span>
        </div>

        <div>
          <h2 className="text-4xl font-semibold tracking-tight leading-tight mb-4">
            Your health record,<br />in your hands.
          </h2>
          <p className="mb-10" style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 380 }}>
            Structured KYC for small clinics, with emergency tools built in.
          </p>
          <div className="space-y-6">
            {POINTS.map(([Icon, head, text]) => (
              <div key={head} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(94,234,212,0.14)' }}>
                  <Icon className="w-4 h-4" style={{ color: '#5EEAD4' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{head}</p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Student project. Use dummy data only. Not a medical device.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#111827' }}>{title}</h1>
          <p className="text-sm mt-1.5 mb-7" style={{ color: '#6B7280' }}>{subtitle}</p>
          {children}
          {footer && <div className="text-sm text-center mt-6" style={{ color: '#6B7280' }}>{footer}</div>}
        </div>
      </div>
    </div>
  );
}