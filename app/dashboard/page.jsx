'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Loader2, TrendingUp, Clock, CheckCircle, AlertCircle, Zap, Target, ChevronDown, ChevronUp, Flag } from 'lucide-react';
import { getTasks, getTeamMembers } from '../../lib/supabase';

const MARKETS = [
  { id: 'pl', name: 'Polska', icon: '🇵🇱' },
  { id: 'ns', name: 'NS', icon: '🇬🇧' },
  { id: 'it', name: 'Włochy', icon: '🇮🇹' },
  { id: 'exchange', name: 'Wymiana', icon: '🎓' },
  { id: 'tefl', name: 'TEFL', icon: '🌏' },
  { id: 'brazil', name: 'Brazylia', icon: '🇧🇷' },
];

const getInitials = (name) => {
  const parts = name.split(' ');
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return name[0];
};

const shortName = (name) => {
  const map = { 'Aleksandra': 'Ola', 'Wojciech': 'Wojtek' };
  const first = name.split(' ')[0];
  return map[first] || first;
};

function scoreColor(score) {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#ea580c';
  return '#ef4444';
}
function scoreBg(score) {
  if (score >= 80) return '#f0fdf4';
  if (score >= 60) return '#fefce8';
  if (score >= 40) return '#fff7ed';
  return '#fef2f2';
}
function scoreGrade(score) {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

function ScoreRing({ score, size = 48, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f3f4" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  );
}

function MiniBar({ value, max, color, height = 14 }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ height, background: '#f3f4f6', borderRadius: 3, position: 'relative', overflow: 'hidden', minWidth: 40 }}>
      <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
      {value > 0 && (
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 600, color: pct > 35 ? '#fff' : color }}>{value}</span>
      )}
    </div>
  );
}

function Stat({ label, value, sub, icon: Icon, color }) {
  return (
    <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 10, padding: '14px 16px', borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <Icon size={14} style={{ color }} />
        <span style={{ fontSize: 11, fontWeight: 500, color: '#6b7280' }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function DetailBox({ label, value, bar, color }) {
  return (
    <div style={{ padding: '8px 10px', background: '#f9fafb', borderRadius: 6, border: '0.5px solid #f1f3f4' }}>
      <div style={{ fontSize: 9, color: '#9ca3af', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{value}</div>
      <div style={{ marginTop: 4, height: 3, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, bar))}%`, background: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

function PersonCard({ person, expanded, onToggle }) {
  const p = person;
  const score = p.score;
  const color = scoreColor(score);
  const bg = scoreBg(score);

  return (
    <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', cursor: 'pointer' }}
      onClick={onToggle}>
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
          <ScoreRing score={score} size={44} stroke={3.5} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 9, fontWeight: 600 }}>
              {getInitials(p.name)}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{shortName(p.name)}</span>
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: bg, color, fontWeight: 600 }}>
              {scoreGrade(score)}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <span style={{ fontSize: 10, color: '#6b7280' }}><span style={{ fontWeight: 600, color: '#111827' }}>{p.closed}</span> zamkn.</span>
            <span style={{ fontSize: 10, color: '#6b7280' }}><span style={{ fontWeight: 600, color: '#111827' }}>{p.active}</span> aktyw.</span>
            <span style={{ fontSize: 10, color: '#6b7280' }}>⌀ <span style={{ fontWeight: 600, color: p.medianDays <= 7 ? '#16a34a' : p.medianDays <= 14 ? '#f59e0b' : '#ef4444' }}>{p.medianDays.toFixed(1)}d</span></span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>{p.total} tasków</span>
            {expanded ? <ChevronUp size={12} style={{ color: '#9ca3af' }} /> : <ChevronDown size={12} style={{ color: '#9ca3af' }} />}
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {p.fastPct > 0 && <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: '#f0fdf4', color: '#16a34a', fontWeight: 500 }}>⚡{p.fastClosed}</span>}
            {p.slowPct > 0 && <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: '#fef2f2', color: '#ef4444', fontWeight: 500 }}>🐢{p.slowClosed}</span>}
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '0.5px solid #f1f3f4' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
            <DetailBox label="Completion rate" value={`${p.completionPct}%`}
              bar={p.completionPct} color={p.completionPct >= 75 ? '#16a34a' : p.completionPct >= 50 ? '#f59e0b' : '#ef4444'} />
            <DetailBox label="Średni czas zamknięcia" value={`${p.avgDays.toFixed(1)} dni`}
              bar={Math.max(0, 100 - (p.avgDays / 20) * 100)} color={p.avgDays <= 7 ? '#16a34a' : p.avgDays <= 14 ? '#f59e0b' : '#ef4444'} />
            <DetailBox label="Komentarze / task" value={p.commentsPerTask.toFixed(1)}
              bar={Math.min(100, p.commentsPerTask * 33)} color="#3b82f6" />
            <DetailBox label="Szybkie (<3d)" value={`${p.fastClosed} z ${p.closed}`}
              bar={p.fastPct} color="#16a34a" />
          </div>

          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Rozkład czasu zamknięcia</div>
            <div style={{ display: 'flex', gap: 2, height: 20 }}>
              {p.buckets.map((b, i) => {
                const colors = ['#16a34a', '#22c55e', '#f59e0b', '#ea580c', '#ef4444'];
                const pct = p.closed > 0 ? (b.count / p.closed) * 100 : 0;
                return pct > 0 ? (
                  <div key={i} style={{ flex: pct, background: colors[i], borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, fontWeight: 600, color: '#fff', minWidth: pct > 8 ? 20 : 0, overflow: 'hidden' }}
                    title={`${b.label}: ${b.count}`}>
                    {pct > 12 && b.count}
                  </div>
                ) : null;
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
              {p.buckets.map((b, i) => {
                const colors = ['#16a34a', '#22c55e', '#f59e0b', '#ea580c', '#ef4444'];
                return <span key={i} style={{ fontSize: 8, color: colors[i], fontWeight: 500 }}>{b.label}: {b.count}</span>;
              })}
            </div>
          </div>

          {p.markets.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Rynki</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {p.markets.map(m => (
                  <span key={m.id} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#f6f8fc', border: '0.5px solid #e5e7eb', color: '#374151' }}>
                    {m.icon} {m.count}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 10, padding: '6px 8px', background: '#f6f8fc', borderRadius: 4 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#9ca3af', marginBottom: 3 }}>Breakdown scoringu</div>
            <div style={{ display: 'flex', gap: 8, fontSize: 9, color: '#6b7280' }}>
              <span>Speed: <b style={{ color: '#111' }}>{p.speedScore}</b>/30</span>
              <span>Completion: <b style={{ color: '#111' }}>{p.completionScore}</b>/30</span>
              <span>Volume: <b style={{ color: '#111' }}>{p.volumeScore}</b>/20</span>
              <span>Engagement: <b style={{ color: '#111' }}>{p.engageScore}</b>/20</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPerson, setExpandedPerson] = useState(null);
  const [sortBy, setSortBy] = useState('score');

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
    const ds = typeof d === 'string' ? d.split('T')[0] : '';
    return (!from || ds >= from) && (!to || ds <= to);
  };

  const setPreset = (days) => {
    setFrom(new Date(Date.now() - days * 86400000).toISOString().split('T')[0]);
    setTo(today);
  };

  const data = useMemo(() => {
    const created = tasks.filter(t => inR(t.createdAt));
    const closed = tasks.filter(t => t.status === 'closed' && t.updatedAt && inR(t.updatedAt));
    const active = tasks.filter(t => !['closed', 'pending'].includes(t.status));
    const overdue = active.filter(t => t.deadline && t.deadline < today);
    const am = teamMembers.filter(m => m.isActive !== false && !m.isManager);
    const daysInRange = Math.max(1, Math.ceil((new Date(to) - new Date(from)) / 86400000));

    let totalCloseTime = 0, closeCount = 0;
    closed.forEach(t => {
      const d = (new Date(t.updatedAt) - new Date(t.createdAt)) / 86400000;
      if (d >= 0) { totalCloseTime += d; closeCount++; }
    });
    const avgCloseTime = closeCount > 0 ? totalCloseTime / closeCount : 0;

    const people = am.map(member => {
      const id = member.id;
      const pt = tasks.filter(t => (t.assignees || []).includes(id));
      const pClosed = pt.filter(t => t.status === 'closed' && t.updatedAt && inR(t.updatedAt));
      const pActive = pt.filter(t => !['closed', 'pending'].includes(t.status));

      const closeTimes = pClosed.map(t => Math.max(0, (new Date(t.updatedAt) - new Date(t.createdAt)) / 86400000));
      const sorted = [...closeTimes].sort((a, b) => a - b);
      const avgDays = sorted.length > 0 ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0;
      const medianDays = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;

      const buckets = [
        { label: '<1d', count: closeTimes.filter(d => d < 1).length },
        { label: '1–3d', count: closeTimes.filter(d => d >= 1 && d < 3).length },
        { label: '3–7d', count: closeTimes.filter(d => d >= 3 && d < 7).length },
        { label: '7–14d', count: closeTimes.filter(d => d >= 7 && d < 14).length },
        { label: '14d+', count: closeTimes.filter(d => d >= 14).length },
      ];

      const fastClosed = closeTimes.filter(d => d <= 3).length;
      const slowClosed = closeTimes.filter(d => d > 14).length;
      const completionPct = (pClosed.length + pActive.length) > 0 ? Math.round((pClosed.length / (pClosed.length + pActive.length)) * 100) : 0;

      let commentsWritten = 0;
      pt.forEach(t => { (t.comments || []).forEach(c => { if (c.author === id) commentsWritten++; }); });
      const commentsPerTask = pt.length > 0 ? commentsWritten / pt.length : 0;

      const marketCounts = {};
      pt.forEach(t => { if (t.market) marketCounts[t.market] = (marketCounts[t.market] || 0) + 1; });
      const markets = MARKETS.filter(m => marketCounts[m.id]).map(m => ({ ...m, count: marketCounts[m.id] }));

      let speedScore = 0;
      if (pClosed.length > 0) {
        if (medianDays <= 3) speedScore = 30;
        else if (medianDays <= 7) speedScore = 25;
        else if (medianDays <= 10) speedScore = 18;
        else if (medianDays <= 14) speedScore = 12;
        else speedScore = 5;
      }
      const completionScore = Math.round(completionPct * 0.3);
      const maxExpected = Math.max(20, Math.round(daysInRange * 0.8));
      const volumeScore = Math.min(20, Math.round((pClosed.length / maxExpected) * 20));
      let engageScore = commentsPerTask >= 2 ? 20 : commentsPerTask >= 1 ? 14 : commentsPerTask >= 0.5 ? 10 : commentsPerTask >= 0.2 ? 5 : 2;

      const raw = speedScore + completionScore + volumeScore + engageScore;
      const score = pt.length >= 5 ? Math.min(100, raw) : Math.min(100, Math.round(raw * 0.7));

      return {
        ...member, short: shortName(member.name),
        total: pt.length, closed: pClosed.length, active: pActive.length,
        avgDays, medianDays, fastClosed, slowClosed,
        fastPct: pClosed.length > 0 ? Math.round((fastClosed / pClosed.length) * 100) : 0,
        slowPct: pClosed.length > 0 ? Math.round((slowClosed / pClosed.length) * 100) : 0,
        completionPct, commentsWritten, commentsPerTask, buckets, markets,
        score, speedScore, completionScore, volumeScore, engageScore,
      };
    }).filter(p => p.total > 0);

    const byMarket = MARKETS.map(m => ({
      ...m,
      created: created.filter(t => t.market === m.id).length,
      closed: closed.filter(t => t.market === m.id).length,
      active: active.filter(t => t.market === m.id).length,
    })).filter(m => m.created + m.closed + m.active > 0);

    const priorities = [
      { id: 'urgent', label: 'Pilny', color: '#b91c1c', count: active.filter(t => t.priority === 'urgent').length },
      { id: 'high', label: 'Wysoki', color: '#ef4444', count: active.filter(t => t.priority === 'high').length },
      { id: 'medium', label: 'Średni', color: '#f59e0b', count: active.filter(t => t.priority === 'medium').length },
      { id: 'low', label: 'Niski', color: '#16a34a', count: active.filter(t => t.priority === 'low').length },
    ];

    return {
      created: created.length, closed: closed.length, active: active.length, overdue: overdue.length,
      avgCloseTime, daysInRange, people, byMarket, priorities,
      closedPerDay: (closed.length / daysInRange).toFixed(1),
      createdPerDay: (created.length / daysInRange).toFixed(1),
    };
  }, [tasks, teamMembers, from, to]);

  const sortedPeople = useMemo(() => {
    const p = [...data.people];
    switch (sortBy) {
      case 'score': return p.sort((a, b) => b.score - a.score);
      case 'speed': return p.sort((a, b) => a.medianDays - b.medianDays);
      case 'volume': return p.sort((a, b) => b.closed - a.closed);
      case 'active': return p.sort((a, b) => b.active - a.active);
      default: return p;
    }
  }, [data.people, sortBy]);

  const presets = [7, 14, 30, 60];
  const maxMarket = Math.max(...data.byMarket.flatMap(m => [m.created, m.closed, m.active]), 1);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <Loader2 className="animate-spin" size={28} style={{ color: '#3b82f6' }} />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Google Sans', -apple-system, BlinkMacSystemFont, sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ background: '#fff', borderBottom: '0.5px solid #e5e7eb', padding: '10px 20px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="AV" style={{ height: 22 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Target size={15} style={{ color: '#3b82f6' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Performance</span>
            </div>
            <a href="/" style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'none', marginLeft: 8 }}>← Tasks</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {presets.map(d => {
              const expected = new Date(Date.now() - d * 86400000).toISOString().split('T')[0];
              const isActive = from === expected && to === today;
              return (
                <button key={d} onClick={() => setPreset(d)}
                  style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, border: `0.5px solid ${isActive ? '#3b82f6' : '#e5e7eb'}`,
                    background: isActive ? '#eff6ff' : '#fff', color: isActive ? '#3b82f6' : '#6b7280', fontWeight: 500, cursor: 'pointer' }}>
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

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
          <Stat label="Utworzone" value={data.created} sub={`${data.createdPerDay}/dzień`} icon={TrendingUp} color="#3b82f6" />
          <Stat label="Zamknięte" value={data.closed} sub={`${data.closedPerDay}/dzień`} icon={CheckCircle} color="#16a34a" />
          <Stat label="Aktywne" value={data.active} icon={Clock} color="#f59e0b" />
          <Stat label="⌀ Czas zamknięcia" value={`${data.avgCloseTime.toFixed(1)}d`} icon={Zap} color="#7c3aed" />
          {data.overdue > 0 && <Stat label="Po terminie" value={data.overdue} icon={AlertCircle} color="#ef4444" />}
        </div>

        {data.priorities.some(p => p.count > 0) && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {data.priorities.filter(p => p.count > 0).map(p => (
              <span key={p.id} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, background: `${p.color}10`, color: p.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Flag size={9} /> {p.label}: {p.count}
              </span>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Scoring zespołu</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { key: 'score', label: 'Score' },
                { key: 'speed', label: 'Szybkość' },
                { key: 'volume', label: 'Wolumen' },
                { key: 'active', label: 'Aktywne' },
              ].map(s => (
                <button key={s.key} onClick={() => setSortBy(s.key)}
                  style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, border: `0.5px solid ${sortBy === s.key ? '#3b82f6' : '#e5e7eb'}`,
                    background: sortBy === s.key ? '#eff6ff' : '#fff', color: sortBy === s.key ? '#3b82f6' : '#6b7280', fontWeight: 500, cursor: 'pointer' }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            {sortedPeople.map(p => (
              <PersonCard key={p.id} person={p} expanded={expandedPerson === p.id}
                onToggle={() => setExpandedPerson(expandedPerson === p.id ? null : p.id)} />
            ))}
          </div>

          <div style={{ marginTop: 8, padding: '8px 12px', background: '#f6f8fc', borderRadius: 6, border: '0.5px solid #e5e7eb' }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#9ca3af', marginBottom: 4 }}>SCORING: Speed (30) + Completion (30) + Volume (20) + Engagement (20) = 100</div>
            <div style={{ display: 'flex', gap: 10, fontSize: 9, color: '#6b7280', flexWrap: 'wrap' }}>
              <span><span style={{ color: '#16a34a', fontWeight: 600 }}>A</span> ≥80</span>
              <span><span style={{ color: '#f59e0b', fontWeight: 600 }}>B</span> ≥60</span>
              <span><span style={{ color: '#ea580c', fontWeight: 600 }}>C</span> ≥40</span>
              <span><span style={{ color: '#ef4444', fontWeight: 600 }}>D</span> &lt;40</span>
              <span style={{ color: '#d1d5db' }}>|</span>
              <span>⚡ zamknięte &lt;3d</span>
              <span>🐢 zamknięte &gt;14d</span>
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Rynki</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 9, color: '#3b82f6', fontWeight: 500 }}>● Utworzone</span>
            <span style={{ fontSize: 9, color: '#16a34a', fontWeight: 500 }}>● Zamknięte</span>
            <span style={{ fontSize: 9, color: '#f59e0b', fontWeight: 500 }}>● Aktywne</span>
          </div>
          {data.byMarket.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <div style={{ width: 65, fontSize: 11, fontWeight: 500, color: '#111827', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <span>{m.icon}</span><span>{m.name}</span>
              </div>
              <div style={{ flex: 1, display: 'flex', gap: 3 }}>
                <div style={{ flex: 1 }}><MiniBar value={m.created} max={maxMarket} color="#3b82f6" /></div>
                <div style={{ flex: 1 }}><MiniBar value={m.closed} max={maxMarket} color="#16a34a" /></div>
                <div style={{ flex: 1 }}><MiniBar value={m.active} max={maxMarket} color="#f59e0b" /></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '12px 20px', fontSize: 10, color: '#9ca3af' }}>
        Angloville Performance • {from} – {to}
      </div>
    </div>
  );
}
