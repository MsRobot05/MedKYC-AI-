import { Loader2 } from 'lucide-react';

export const C = {
  navy: '#0B2942',
  teal: '#0F6E64',
  text: '#111827',
  sub: '#6B7280',
  muted: '#8A8F98',
  border: '#EAEBEF',
};

const TONES = {
  teal: { bg: '#EEF7F6', fg: '#0F6E64', line: '#D5EDE9' },
  red: { bg: '#FDEEEE', fg: '#B3261E', line: '#F7D4D1' },
  amber: { bg: '#FEF6E7', fg: '#B7791F', line: '#F5E3BC' },
  green: { bg: '#EAF7EE', fg: '#1E7A3D', line: '#CDEBD6' },
  purple: { bg: '#F3EEFB', fg: '#6B3FA0', line: '#E2D6F3' },
  gray: { bg: '#F2F3F5', fg: '#4A4F57', line: '#E5E7EB' },
};
export const tone = (name) => TONES[name] || TONES.gray;

export function Card({ children, className = '', style, ...rest }) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: '#FFFFFF',
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: C.text }}>{title}</h1>
        {subtitle && <p className="text-sm mt-1" style={{ color: C.sub }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Badge({ children, color = 'teal' }) {
  const t = tone(color);
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: t.bg, color: t.fg }}>
      {children}
    </span>
  );
}

export function Button({ children, variant = 'primary', loading = false, disabled = false, className = '', style, ...rest }) {
  const variants = {
    primary: { backgroundColor: C.navy, color: '#FFFFFF', border: `1px solid ${C.navy}` },
    secondary: { backgroundColor: '#FFFFFF', color: C.navy, border: '1px solid #E5E7EB' },
    danger: { backgroundColor: '#C62828', color: '#FFFFFF', border: '1px solid #C62828' },
  };
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ ...(variants[variant] || variants.primary), ...style }}
      {...rest}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Notice({ color = 'teal', children }) {
  const t = tone(color);
  return (
    <div className="rounded-xl px-4 py-3 text-sm mb-4" style={{ backgroundColor: t.bg, color: t.fg, border: `1px solid ${t.line}` }}>
      {children}
    </div>
  );
}

export function Loading({ text = 'Loading...' }) {
  return (
    <div className="flex items-center gap-2 text-sm py-10" style={{ color: C.muted }}>
      <Loader2 className="w-4 h-4 animate-spin" /> {text}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="text-center py-10 px-6">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#F2F3F5' }}>
          <Icon className="w-5 h-5" style={{ color: C.muted }} />
        </div>
      )}
      <p className="font-medium text-sm" style={{ color: C.text }}>{title}</p>
      {text && <p className="text-sm mt-1" style={{ color: C.sub }}>{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Ring({ percent = 0, size = 92, stroke = 9, color = C.teal }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const len = (Math.max(0, Math.min(100, percent)) / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F2F4" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${len} ${circ - len}`}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: size / 4.2, color: C.text }}>
        {percent}%
      </div>
    </div>
  );
}

// Which KYC fields count toward "profile complete"
export const PROFILE_FIELDS = [
  ['dob', 'Date of birth'],
  ['gender', 'Gender'],
  ['phone', 'Mobile number'],
  ['city', 'City'],
  ['bloodGroup', 'Blood group'],
  ['emergencyContactName', 'Emergency contact name'],
  ['emergencyContactPhone', 'Emergency contact number'],
];

export function completeness(kyc) {
  const missing = PROFILE_FIELDS.filter(([key]) => !kyc || !kyc[key]).map(([, label]) => label);
  return {
    percent: Math.round(((PROFILE_FIELDS.length - missing.length) / PROFILE_FIELDS.length) * 100),
    missing,
  };
}