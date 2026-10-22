import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, CornerDownLeft } from 'lucide-react';
import { NAV_LINKS } from './navLinks';
import { useAuth } from '../context/AuthContext';

export default function CommandPalette({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  const items = useMemo(() => {
    const pages = NAV_LINKS.filter((l) => l.roles.includes(user?.role)).map((l) => ({
      id: l.to,
      label: l.label,
      hint: 'Go to page',
      icon: l.icon,
      run: () => navigate(l.to),
    }));
    const actions = [
      { id: 'logout', label: 'Log out', hint: 'Action', icon: LogOut, run: () => { logout(); navigate('/login'); } },
    ];
    const all = [...pages, ...actions];
    const s = q.trim().toLowerCase();
    return s ? all.filter((i) => i.label.toLowerCase().includes(s)) : all;
  }, [q, user, navigate, logout]);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  if (!open) return null;

  const run = (item) => {
    onClose();
    item?.run();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(items[active]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 90, backgroundColor: 'rgba(11,41,66,0.45)', display: 'flex', justifyContent: 'center', paddingTop: '14vh' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
        style={{ width: 520, maxWidth: '92vw', maxHeight: 420, backgroundColor: '#FFFFFF', borderRadius: 16, boxShadow: '0 24px 60px rgba(16,24,40,0.3)', overflow: 'hidden', alignSelf: 'flex-start' }}
      >
        <div className="flex items-center gap-3 px-4" style={{ borderBottom: '1px solid #EAEBEF' }}>
          <Search className="w-4 h-4" style={{ color: '#8A8F98' }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages and actions..."
            className="flex-1 py-4 text-sm focus:outline-none"
          />
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ border: '1px solid #E5E7EB', color: '#8A8F98' }}>Esc</span>
        </div>
        <div style={{ maxHeight: 340, overflowY: 'auto', padding: 8 }}>
          {items.length === 0 && <p className="text-sm text-center py-8" style={{ color: '#8A8F98' }}>No matches</p>}
          {items.map((item, i) => {
            const Icon = item.icon;
            const on = i === active;
            return (
              <button
                key={item.id}
                onClick={() => run(item)}
                onMouseEnter={() => setActive(i)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left"
                style={{ backgroundColor: on ? '#EEF7F6' : 'transparent', color: '#111827' }}
              >
                <Icon className="w-4 h-4" style={{ color: on ? '#0F6E64' : '#8A8F98' }} />
                <span className="flex-1">{item.label}</span>
                <span className="text-xs" style={{ color: '#8A8F98' }}>{item.hint}</span>
                {on && <CornerDownLeft className="w-3.5 h-3.5" style={{ color: '#0F6E64' }} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}