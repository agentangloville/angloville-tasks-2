'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Loader2, CheckCircle, Clock, Zap, AlertCircle, Send, ChevronDown, ChevronUp, Flag, Mail, BarChart3 } from 'lucide-react';
import { getTasks, getTeamMembers } from '../../lib/supabase';
import { getScheduledSends } from '../../lib/supabase-planner';

const MARKETS = [
  { id: 'pl', name: 'Polska', icon: '🇵🇱' },
  { id: 'ns', name: 'NS', icon: '🇬🇧' },
  { id: 'it', name: 'Włochy', icon: '🇮🇹' },
  { id: 'exchange', name: 'Wymiana', icon: '🎓' },
  { id: 'tefl', name: 'TEFL', icon: '🌏' },
  { id: 'brazil', name: 'Brazylia', icon: '🇧🇷' },
];

const getInitials = (n) => { const p = n.split(' '); return p.length >= 2 ? p[0][0] + p[1][0] : n[0]; };
const shortName = (n) => { const m = { 'Aleksandra': 'Ola', 'Wojciech': 'Wojtek' }; const f = n.split(' ')[0]; return m[f] || f; };

function Bar({ value, max, color, h = 16 }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ height: h, background: '#f1f3f4', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.3s ease' }} />
      {value > 0 && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: pct > 30 ? '#fff' : color }}>{value}</span>}
    </div>
  );
}

function KPI({ label, value, sub, icon: Icon, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid #e8eaed' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span style={{ fontSize: 12, color: '#5f6368', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, color: '#202124', letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#80868b', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState([]);
  const [sends, setSends] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPerson, setExpandedPerson] = useState(null);

  const today = new Date().toISOString().split('T')[0];
  const ago30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const [from, setFrom] = useState(ago30);
  const [to, setTo] = useState(today);

  useEffect(() => {
    (async () => {
      const [t, m, s] = await Promise.all([getTasks(), getTeamMembers(), getScheduledSends()]);
      setTasks(t); setTeamMembers(m); setSends(s); setLoading(false);
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

  // Use closedAt if present, fall back to updatedAt for tasks closed before the closed_at migration
  const closedDate = (t) => t.closedAt || t.updatedAt;

  const data = useMemo(() => {
    const tCreated = tasks.filter(t => inR(t.createdAt));
    const tClosed = tasks.filter(t => t.status === 'closed' && closedDate(t) && inR(closedDate(t)));
    const tActive = tasks.filter(t => !['closed', 'pending'].includes(t.status));
    const overdue = tActive.filter(t => t.deadline && t.deadline < today);
    const daysInRange = Math.max(1, Math.ceil((new Date(to) - new Date(from)) / 86400000));

    // Build list of days in range (YYYY-MM-DD), oldest → newest
    const days = [];
    const dStart = new Date(from);
    const dEnd = new Date(to);
    for (let d = new Date(dStart); d <= dEnd; d.setDate(d.getDate() + 1)) {
      days.push(d.toISOString().split('T')[0]);
    }

    // Sends in range
    const sendsInRange = sends.filter(s => inR(s.sendDate));
    const sendsSent = sendsInRange.filter(s => s.status === 'sent' || s.status === 'scheduled');
    const sendsTodo = sendsInRange.filter(s => s.status === 'todo');

    // All active sends (upcoming)
    const sendsUpcoming = sends.filter(s => s.sendDate >= today && s.status === 'todo');

    // Avg close time
    let totalClose = 0, closeN = 0;
    tClosed.forEach(t => { const d = (new Date(closedDate(t)) - new Date(t.createdAt)) / 86400000; if (d >= 0) { totalClose += d; closeN++; } });

    // Priority active
    const priorities = [
      { id: 'urgent', label: 'Pilny', color: '#d93025', count: tActive.filter(t => t.priority === 'urgent').length },
      { id: 'high', label: 'Wysoki', color: '#ea4335', count: tActive.filter(t => t.priority === 'high').length },
      { id: 'medium', label: 'Średni', color: '#f9ab00', count: tActive.filter(t => t.priority === 'medium').length },
      { id: 'low', label: 'Niski', color: '#34a853', count: tActive.filter(t => t.priority === 'low').length },
    ];

    // Per person
    const am = teamMembers.filter(m => m.isActive !== false && !m.isManager);
    const people = am.map(member => {
      const id = member.id;

      // Tasks where this person is an assignee
      const pt = tasks.filter(t => (t.assignees || []).includes(id));
      const pClosed = pt.filter(t => t.status === 'closed' && closedDate(t) && inR(closedDate(t)));
      const pActive = pt.filter(t => !['closed', 'pending'].includes(t.status));
      // Tasks this person CREATED in range (for "utworzone" credit) — separate from assignee tasks
      const pCreated = tasks.filter(t => t.createdBy === id && inR(t.createdAt));

      // Daily breakdown: created (by this person) and closed (where this person was an assignee)
      const byDay = {};
      days.forEach(d => { byDay[d] = { c: 0, z: 0 }; });
      pCreated.forEach(t => {
        const d = t.createdAt?.split('T')[0];
        if (d && byDay[d]) byDay[d].c++;
      });
      pClosed.forEach(t => {
        const d = closedDate(t)?.split('T')[0];
        if (d && byDay[d]) byDay[d].z++;
      });

      const closeTimes = pClosed.map(t => Math.max(0, (new Date(closedDate(t)) - new Date(t.createdAt)) / 86400000));
      const sorted = [...closeTimes].sort((a, b) => a - b);
      const avgDays = sorted.length > 0 ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0;
      const medianDays = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;

      // Sends
      const pSends = sends.filter(s => (s.assignees || []).includes(id));
      const pSendsInRange = pSends.filter(s => inR(s.sendDate));
      const pSendsSent = pSendsInRange.filter(s => s.status === 'sent' || s.status === 'scheduled');
      const pSendsTodo = pSendsInRange.filter(s => s.status === 'todo');
      const pSendsUpcoming = pSends.filter(s => s.sendDate >= today && s.status === 'todo');

      // Comments
      let comments = 0;
      pt.forEach(t => { (t.comments || []).forEach(c => { if (c.author === id) comments++; }); });

      // Markets
      const mkts = {};
      pt.forEach(t => { if (t.market) mkts[t.market] = (mkts[t.market] || 0) + 1; });
      pSends.forEach(s => { if (s.market) mkts[s.market] = (mkts[s.market] || 0) + 1; });
      const markets = MARKETS.filter(m => mkts[m.id]).map(m => ({ ...m, count: mkts[m.id] })).sort((a, b) => b.count - a.count);

      return {
        ...member, short: shortName(member.name),
        // Tasks
        totalTasks: pt.length, closedTasks: pClosed.length, activeTasks: pActive.length, createdTasks: pCreated.length,
        avgDays, medianDays,
        byDay,
        // Sends
        totalSends: pSends.length, sendsInRange: pSendsInRange.length,
        sendsSent: pSendsSent.length, sendsTodo: pSendsTodo.length,
        sendsUpcoming: pSendsUpcoming.length,
        // Combined
        totalItems: pt.length + pSends.length,
        completedItems: pClosed.length + pSendsSent.length,
        // Other
        comments, markets,
      };
    }).filter(p => p.totalItems > 0 || p.createdTasks > 0).sort((a, b) => (b.createdTasks + b.closedTasks) - (a.createdTasks + a.closedTasks));

    // Markets
    const byMarket = MARKETS.map(m => ({
      ...m,
      tasksCr: tCreated.filter(t => t.market === m.id).length,
      tasksCl: tClosed.filter(t => t.market === m.id).length,
      tasksAc: tActive.filter(t => t.market === m.id).length,
      sends: sendsInRange.filter(s => s.market === m.id).length,
      sendsSent: sendsSent.filter(s => s.market === m.id).length,
    })).filter(m => m.tasksCr + m.tasksCl + m.tasksAc + m.sends > 0);

    return {
      tCreated: tCreated.length, tClosed: tClosed.length, tActive: tActive.length,
      overdue: overdue.length,
      avgClose: closeN > 0 ? totalClose / closeN : 0,
      daysInRange, priorities, days,
      sendsInRange: sendsInRange.length, sendsSent: sendsSent.length, sendsTodo: sendsTodo.length,
      sendsUpcoming: sendsUpcoming.length,
      people, byMarket,
      closedPerDay: (tClosed.length / daysInRange).toFixed(1),
    };
  }, [tasks, sends, teamMembers, from, to]);

  const presets = [7, 14, 30, 60];
  const maxMarket = Math.max(...data.byMarket.flatMap(m => [m.tasksCr, m.tasksCl, m.tasksAc, m.sends]), 1);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
      <Loader2 className="animate-spin" size={28} style={{ color: '#1a73e8' }} />
    </div>
  );

  return (
    <div style={{ fontFamily: "'Google Sans', 'Roboto', -apple-system, sans-serif", background: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8eaed', padding: '12px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="AV" style={{ height: 24 }} />
            <div style={{ width: 1, height: 20, background: '#e8eaed' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart3 size={16} style={{ color: '#1a73e8' }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: '#202124' }}>Dashboard</span>
            </div>
            <a href="/" style={{ fontSize: 12, color: '#1a73e8', textDecoration: 'none', marginLeft: 4 }}>← Tasks</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {presets.map(d => {
              const expected = new Date(Date.now() - d * 86400000).toISOString().split('T')[0];
              const isActive = from === expected && to === today;
              return (
                <button key={d} onClick={() => setPreset(d)}
                  style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, border: 'none',
                    background: isActive ? '#e8f0fe' : '#f1f3f4', color: isActive ? '#1a73e8' : '#5f6368',
                    fontWeight: 500, cursor: 'pointer' }}>
                  {d}d
                </button>
              );
            })}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 20, background: '#f1f3f4' }}>
              <Calendar size={12} style={{ color: '#5f6368' }} />
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                style={{ fontSize: 12, border: 'none', outline: 'none', color: '#202124', background: 'transparent', width: 110 }} />
              <span style={{ color: '#dadce0' }}>–</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                style={{ fontSize: 12, border: 'none', outline: 'none', color: '#202124', background: 'transparent', width: 110 }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 24px' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
          <KPI label="Zamknięte taski" value={data.tClosed} sub={`${data.closedPerDay}/dzień`} icon={CheckCircle} color="#1e8e3e" />
          <KPI label="Aktywne taski" value={data.tActive} icon={Clock} color="#1a73e8" />
          <KPI label="Wysyłki w okresie" value={data.sendsInRange} sub={`${data.sendsSent} wysłane, ${data.sendsTodo} do zrobienia`} icon={Send} color="#7c3aed" />
          <KPI label="⌀ Czas zamknięcia" value={`${data.avgClose.toFixed(1)}d`} icon={Zap} color="#f9ab00" />
          {data.overdue > 0 && <KPI label="Po terminie" value={data.overdue} icon={AlertCircle} color="#d93025" />}
        </div>

        {/* Priority pills */}
        {data.priorities.some(p => p.count > 0) && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {data.priorities.filter(p => p.count > 0).map(p => (
              <span key={p.id} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: '#fff', border: '1px solid #e8eaed',
                color: p.color, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Flag size={10} /> {p.label}: {p.count}
              </span>
            ))}
          </div>
        )}

        {/* Team — daily activity (created / closed per day, per person) */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8eaed', marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e8eaed', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#202124' }}>Zespół — dzienna aktywność</div>
              <div style={{ fontSize: 11, color: '#80868b', marginTop: 2 }}>Utworzone (kto utworzył) i zamknięte (kto był przypisany), per dzień</div>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#5f6368' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#1a73e8', display: 'inline-block' }} />Utworzone</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#1e8e3e', display: 'inline-block' }} />Zamknięte</span>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${data.days.length}, 36px)`, alignItems: 'stretch' }}>
              {/* Day header row */}
              <div style={{ position: 'sticky', left: 0, zIndex: 2, background: '#f8f9fa', borderBottom: '1px solid #e8eaed', padding: '8px 12px', fontSize: 11, color: '#5f6368', fontWeight: 500 }}>Σ utw. / zam.</div>
              {data.days.map(d => {
                const dt = new Date(d);
                const dow = dt.getDay(); // 0=Nd..6=Sb
                const isWeekend = dow === 0 || dow === 6;
                const isToday = d === today;
                const wkLabels = ['Nd','Pn','Wt','Śr','Cz','Pt','Sb'];
                return (
                  <div key={d} style={{
                    borderBottom: '1px solid #e8eaed',
                    borderLeft: isToday ? '2px solid #1a73e8' : '1px solid #f1f3f4',
                    background: isToday ? '#e8f0fe' : isWeekend ? '#fafbfc' : '#f8f9fa',
                    padding: '4px 0', textAlign: 'center', fontSize: 10, lineHeight: 1.15,
                    color: isToday ? '#1a73e8' : '#5f6368', fontWeight: isToday ? 600 : 500,
                  }}>
                    <div>{wkLabels[dow]}</div>
                    <div>{dt.getDate()}.{String(dt.getMonth() + 1).padStart(2, '0')}</div>
                  </div>
                );
              })}

              {/* Person rows */}
              {data.people.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '24px', textAlign: 'center', fontSize: 12, color: '#80868b' }}>
                  Brak aktywności w wybranym okresie.
                </div>
              )}
              {data.people.map((p, i) => {
                const isExpanded = expandedPerson === p.id;
                const isLast = i === data.people.length - 1;
                return (
                  <React.Fragment key={p.id}>
                    {/* Name + summary cell (sticky left) */}
                    <div
                      onClick={() => setExpandedPerson(isExpanded ? null : p.id)}
                      style={{
                        position: 'sticky', left: 0, zIndex: 1,
                        background: isExpanded ? '#f8f9fa' : '#fff',
                        borderBottom: isLast && !isExpanded ? 'none' : '1px solid #f1f3f4',
                        padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                      }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 500, flexShrink: 0 }}>
                        {getInitials(p.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#202124' }}>{p.short}</div>
                        <div style={{ fontSize: 10, color: '#80868b' }}>
                          <span style={{ color: '#1a73e8' }}>{p.createdTasks}</span>
                          {' / '}
                          <span style={{ color: '#1e8e3e' }}>{p.closedTasks}</span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp size={12} style={{ color: '#80868b' }} /> : <ChevronDown size={12} style={{ color: '#80868b' }} />}
                    </div>

                    {/* Daily cells */}
                    {data.days.map(d => {
                      const dt = new Date(d);
                      const dow = dt.getDay();
                      const isWeekend = dow === 0 || dow === 6;
                      const isToday = d === today;
                      const x = p.byDay[d] || { c: 0, z: 0 };
                      const empty = x.c === 0 && x.z === 0;
                      return (
                        <div key={d} style={{
                          borderBottom: isLast && !isExpanded ? 'none' : '1px solid #f1f3f4',
                          borderLeft: isToday ? '2px solid #1a73e8' : '1px solid #f1f3f4',
                          background: isExpanded ? '#f8f9fa' : isToday ? '#f3f8fe' : isWeekend ? '#fafbfc' : '#fff',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 600, lineHeight: 1.2, padding: '4px 0',
                        }}>
                          {empty ? (
                            <span style={{ color: '#dadce0', fontSize: 10, fontWeight: 400 }}>·</span>
                          ) : (
                            <>
                              <span style={{ color: x.c > 0 ? '#1a73e8' : '#dadce0' }}>{x.c || '·'}</span>
                              <span style={{ color: x.z > 0 ? '#1e8e3e' : '#dadce0' }}>{x.z || '·'}</span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Expanded details (rendered outside grid to keep layout clean) */}
          {data.people.map(p => {
            if (expandedPerson !== p.id) return null;
            return (
              <div key={`${p.id}-exp`} style={{ borderTop: '1px solid #e8eaed', background: '#f8f9fa', padding: '12px 18px' }}>
                <div style={{ fontSize: 11, color: '#5f6368', marginBottom: 8, fontWeight: 500 }}>{p.short} — szczegóły w okresie</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                  <Chip label="Utworzone taski" value={p.createdTasks} color="#1a73e8" />
                  <Chip label="Zamknięte taski" value={p.closedTasks} color="#1e8e3e" />
                  <Chip label="Aktywne taski" value={p.activeTasks} color="#5f6368" />
                  {p.medianDays > 0 && <Chip label="⌀ Czas zamknięcia" value={`${p.medianDays.toFixed(1)}d`} color={p.medianDays <= 7 ? '#1e8e3e' : p.medianDays <= 14 ? '#f9ab00' : '#d93025'} />}
                  <Chip label="Wysyłki (okres)" value={p.sendsInRange} color="#7c3aed" />
                  <Chip label="Wysłane" value={p.sendsSent} color="#1e8e3e" />
                  <Chip label="Nadchodzące" value={p.sendsUpcoming} color="#f9ab00" />
                  <Chip label="Wszystkie taski" value={p.totalTasks} color="#5f6368" />
                  {p.comments > 0 && <Chip label="Komentarze" value={p.comments} color="#5f6368" />}
                </div>
                {p.markets.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {p.markets.map(m => (
                      <span key={m.id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: '#f1f3f4', color: '#3c4043', fontWeight: 500 }}>
                        {m.icon} {m.count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Markets */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8eaed', padding: '14px 18px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#202124' }}>Rynki</span>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#5f6368' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a73e8', display: 'inline-block' }} />Utworzone</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1e8e3e', display: 'inline-block' }} />Zamknięte</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f9ab00', display: 'inline-block' }} />Aktywne</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }} />Wysyłki</span>
            </div>
          </div>
          {data.byMarket.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 68, fontSize: 12, fontWeight: 500, color: '#202124', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <span>{m.icon}</span><span>{m.name}</span>
              </div>
              <div style={{ flex: 1, display: 'flex', gap: 3 }}>
                <div style={{ flex: 1 }}><Bar value={m.tasksCr} max={maxMarket} color="#1a73e8" /></div>
                <div style={{ flex: 1 }}><Bar value={m.tasksCl} max={maxMarket} color="#1e8e3e" /></div>
                <div style={{ flex: 1 }}><Bar value={m.tasksAc} max={maxMarket} color="#f9ab00" /></div>
                <div style={{ flex: 1 }}><Bar value={m.sends} max={maxMarket} color="#7c3aed" /></div>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming sends summary */}
        {data.sendsUpcoming > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8eaed', padding: '14px 18px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={16} style={{ color: '#7c3aed' }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: '#202124' }}>
                {data.sendsUpcoming} nadchodzących wysyłek
              </span>
              <a href="/planner" style={{ fontSize: 12, color: '#1a73e8', textDecoration: 'none', marginLeft: 'auto' }}>Otwórz Planner →</a>
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', padding: '16px 24px', fontSize: 11, color: '#80868b' }}>
        Angloville Dashboard • {from} – {to}
      </div>
    </div>
  );
}

function Chip({ label, value, color }) {
  return (
    <div style={{ padding: '8px 10px', background: '#f8f9fa', borderRadius: 8, border: '1px solid #f1f3f4' }}>
      <div style={{ fontSize: 10, color: '#80868b', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color }}>{value}</div>
    </div>
  );
}
