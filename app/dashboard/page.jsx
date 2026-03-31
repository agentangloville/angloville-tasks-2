'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Calendar, X, Loader2 } from 'lucide-react';
import { getTasks, getTeamMembers } from '../../lib/supabase';

const MARKETS = [
  { id: 'pl', name: 'Polska', icon: '🇵🇱' },
  { id: 'ns', name: 'NS', icon: '🇬🇧' },
  { id: 'it', name: 'Włochy', icon: '🇮🇹' },
  { id: 'exchange', name: 'Wymiana', icon: '🎓' },
  { id: 'tefl', name: 'TEFL in Asia', nameEn: 'TEFL in Asia', icon: '🌏' },
  { id: 'brazil', name: 'Brazylia', nameEn: 'Brazil', icon: '🇧🇷' },
];

const getInitials = (name) => {
  const parts = name.split(' ');
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return name[0];
};

const shortName = (name) => {
  const map = { 'Aleksandra': 'Ola', 'Wojciech': 'Wojtek', 'Alessandro': 'Ale' };
  const first = name.split(' ')[0];
  return map[first] || first;
};

function DBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ height: 18, background: '#f3f4f6', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.3s ease' }} />
      {value > 0 && (
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: pct > 30 ? '#fff' : color }}>
          {value}
        </span>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const ago30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const [from, setFrom] = useState(ago30);
  const [to, setTo] = useState(today);

  useEffect(() => {
    (async () => {
      const [t, m] = await Promise.all([getTasks(), getTeamMembers()]);
      setTasks(t);
      setTeamMembers(m);
      setLoading(false);
    })();
  }, []);

  const inR = (d) => {
    if (!d) return false;
    const ds = d.split('T')[0];
    return (!from || ds >= from) && (!to || ds <= to);
  };

  const setPreset = (days) => {
    setFrom(new Date(Date.now() - days * 86400000).toISOString().split('T')[0]);
    setTo(today);
  };

  const data = useMemo(() => {
    const cr = tasks.filter(t => inR(t.createdAt));
    const cl = tasks.filter(t => t.status === 'closed' && t.updatedAt && inR(t.updatedAt));
    const ac = tasks.filter(t => !['closed', 'pending'].includes(t.status));
    const am = teamMembers.filter(m => m.isActive !== false && !m.isManager);

    const byMarket = MARKETS.map(m => ({
      ...m,
      cr: cr.filter(t => t.market === m.id).length,
      cl: cl.filter(t => t.market === m.id).length,
      ac: ac.filter(t => t.market === m.id).length,
    }));

    const byPerson = am.map(p => ({
      ...p,
      short: shortName(p.name),
      cr: cr.filter(t => t.assignees?.includes(p.id)).length,
      cl: cl.filter(t => t.assignees?.includes(p.id)).length,
      ac: ac.filter(t => t.assignees?.includes(p.id)).length,
    }));

    return { cr: cr.length, cl: cl.length, ac: ac.length, byMarket, byPerson };
  }, [tasks, teamMembers, from, to]);

  const maxM = Math.max(...data.byMarket.flatMap(m => [m.cr, m.cl, m.ac]), 1);
  const maxP = Math.max(...data.byPerson.flatMap(p => [p.cr, p.cl, p.ac]), 1);

  const CC = { cr: '#3b82f6', cl: '#16a34a', ac: '#f59e0b' };
  const presets = [7, 14, 30, 60];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f9fafb' }}>
        <Loader2 className="animate-spin" size={28} style={{ color: '#3b82f6' }} />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid #e5e7eb', padding: '10px 20px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="AV" style={{ height: 22 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart3 size={15} style={{ color: '#3b82f6' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Dashboard</span>
            </div>
            <a href="/" style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'none', marginLeft: 8 }}>← Taskery</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {presets.map(d => {
              const expected = new Date(Date.now() - d * 86400000).toISOString().split('T')[0];
              const active = from === expected && to === today;
              return (
                <button key={d} onClick={() => setPreset(d)}
                  style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, border: `0.5px solid ${active ? '#3b82f6' : '#e5e7eb'}`, background: active ? '#eff6ff' : '#fff', color: active ? '#3b82f6' : '#6b7280', fontWeight: 500, cursor: 'pointer' }}>
                  {d}d
                </button>
              );
            })}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, border: '0.5px solid #e5e7eb', background: '#fff' }}>
              <Calendar size={11} style={{ color: '#9ca3af' }} />
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                style={{ fontSize: 11, border: 'none', outline: 'none', color: '#111827', background: 'transparent', width: 100 }} />
              <span style={{ color: '#d1d5db', fontSize: 11 }}>–</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                style={{ fontSize: 11, border: 'none', outline: 'none', color: '#111827', background: 'transparent', width: 100 }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '16px 20px' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Utworzone', val: data.cr, color: CC.cr },
            { label: 'Zamknięte', val: data.cl, color: CC.cl },
            { label: 'Aktywne', val: data.ac, color: CC.ac },
          ].map(k => (
            <div key={k.label} style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 8, padding: '12px 14px', borderLeft: `3px solid ${k.color}` }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: k.color, lineHeight: 1 }}>{k.val}</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#6b7280', marginTop: 3 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
          {[
            { label: 'Utworzone', c: CC.cr },
            { label: 'Zamknięte', c: CC.cl },
            { label: 'Aktywne', c: CC.ac },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: l.c }} />
              <span style={{ fontSize: 11, color: '#6b7280' }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Markets */}
        <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 10 }}>Rynki</div>
          {data.byMarket.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, minHeight: 22 }}>
              <div style={{ width: 72, fontSize: 12, fontWeight: 500, color: '#111827', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <span>{m.icon}</span><span>{m.name}</span>
              </div>
              <div style={{ flex: 1, display: 'flex', gap: 3 }}>
                <div style={{ flex: 1 }}><DBar value={m.cr} max={maxM} color={CC.cr} /></div>
                <div style={{ flex: 1 }}><DBar value={m.cl} max={maxM} color={CC.cl} /></div>
                <div style={{ flex: 1 }}><DBar value={m.ac} max={maxM} color={CC.ac} /></div>
              </div>
            </div>
          ))}
        </div>

        {/* Team */}
        <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 10 }}>Zespół</div>
          {data.byPerson.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, minHeight: 22 }}>
              <div style={{ width: 72, fontSize: 12, fontWeight: 500, color: '#111827', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 8, fontWeight: 600, flexShrink: 0 }}>
                  {getInitials(p.name)}
                </div>
                <span>{p.short}</span>
              </div>
              <div style={{ flex: 1, display: 'flex', gap: 3 }}>
                <div style={{ flex: 1 }}><DBar value={p.cr} max={maxP} color={CC.cr} /></div>
                <div style={{ flex: 1 }}><DBar value={p.cl} max={maxP} color={CC.cl} /></div>
                <div style={{ flex: 1 }}><DBar value={p.ac} max={maxP} color={CC.ac} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '14px 20px', fontSize: 11, color: '#9ca3af' }}>
        Angloville Marketing • {from} — {to}
      </div>
    </div>
  );
}
