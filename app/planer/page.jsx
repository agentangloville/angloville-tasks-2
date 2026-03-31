'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Plus, X, Check, Edit3, Trash2, ChevronLeft, ChevronRight,
  Calendar, List, Mail, MessageSquare, Phone, Send, Clock,
  Filter, Loader2, LogOut, Lock, Menu, Repeat, Globe,
  CheckCircle, Circle, XCircle, ArrowLeft, ChevronDown
} from 'lucide-react';
import { getTeamMembers } from '../../lib/supabase';
import {
  getScheduledSends, createScheduledSend, updateScheduledSend,
  deleteScheduledSend, generateRecurrences
} from '../../lib/supabase-planer';

// ── Constants ──────────────────────────────────────────────

const MARKETS = [
  { id: 'pl', name: 'Polska', icon: '🇵🇱' },
  { id: 'ns', name: 'Native Speakers', icon: '🇬🇧' },
  { id: 'it', name: 'Włochy', icon: '🇮🇹' },
];

const CHANNELS = [
  { id: 'email', name: 'Email', icon: Mail, color: '#2563eb', bg: '#eff6ff' },
  { id: 'sms', name: 'SMS', icon: Phone, color: '#16a34a', bg: '#f0fdf4' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, color: '#25d366', bg: '#f0fdf4' },
];

const TOOLS = [
  { id: 'hubspot', name: 'HubSpot', channel: 'email', color: '#ff7a59' },
  { id: 'mailchimp', name: 'Mailchimp', channel: 'email', color: '#ffe01b' },
  { id: 'mailshake', name: 'Mailshake', channel: 'email', color: '#6c5ce7' },
  { id: 'sms_api', name: 'SMS API', channel: 'sms', color: '#16a34a' },
  { id: 'whatsapp_pl', name: 'WhatsApp PL', channel: 'whatsapp', color: '#25d366' },
  { id: 'whatsapp_uk', name: 'WhatsApp UK', channel: 'whatsapp', color: '#25d366' },
  { id: 'whatsapp_it', name: 'WhatsApp IT', channel: 'whatsapp', color: '#25d366' },
];

const STATUSES = [
  { id: 'draft', name: 'Szkic', nameEn: 'Draft', color: '#9ca3af', bg: '#f3f4f6', icon: Circle },
  { id: 'scheduled', name: 'Zaplanowane', nameEn: 'Scheduled', color: '#2563eb', bg: '#eff6ff', icon: Clock },
  { id: 'sent', name: 'Wysłane', nameEn: 'Sent', color: '#16a34a', bg: '#f0fdf4', icon: CheckCircle },
  { id: 'cancelled', name: 'Anulowane', nameEn: 'Cancelled', color: '#ef4444', bg: '#fef2f2', icon: XCircle },
];

const RECURRENCE_OPTIONS = [
  { id: null, name: 'Jednorazowo', nameEn: 'One-time' },
  { id: 'weekly', name: 'Co tydzień', nameEn: 'Weekly' },
  { id: 'biweekly', name: 'Co 2 tygodnie', nameEn: 'Biweekly' },
  { id: 'monthly', name: 'Co miesiąc', nameEn: 'Monthly' },
];

const TRANSLATIONS = {
  pl: {
    planner: 'Planer wysyłek', calendar: 'Kalendarz', list: 'Lista', newSend: 'Nowa wysyłka',
    title: 'Tytuł', description: 'Opis', channel: 'Kanał', tool: 'Narzędzie', market: 'Rynek',
    segment: 'Segment', sendDate: 'Data wysyłki', sendTime: 'Godzina', recurrence: 'Powtarzanie',
    recurrenceEnd: 'Powtarzaj do', status: 'Status', subjectLine: 'Temat', notes: 'Notatki',
    save: 'Zapisz', cancel: 'Anuluj', delete: 'Usuń', edit: 'Edytuj', close: 'Zamknij',
    today: 'Dziś', allMarkets: 'Wszystkie rynki', allChannels: 'Wszystkie kanały',
    allStatuses: 'Wszystkie statusy', noSends: 'Brak zaplanowanych wysyłek',
    draft: 'Szkic', scheduled: 'Zaplanowane', sent: 'Wysłane', cancelled: 'Anulowane',
    markSent: 'Oznacz jako wysłane', markCancelled: 'Anuluj', restore: 'Przywróć',
    loading: 'Ładowanie...', deleteSend: 'Usunąć wysyłkę?', assignedTo: 'Przypisane do',
    oneTime: 'Jednorazowo', weekly: 'Co tydzień', biweekly: 'Co 2 tygodnie', monthly: 'Co miesiąc',
    recurring: 'Cykliczne', createSeries: 'Utwórz serię', seriesCreated: 'Seria utworzona',
    segmentPlaceholder: 'np. alumni, leady wakacje, rodzice Junior...',
    subjectPlaceholder: 'Temat emaila...',
    notesPlaceholder: 'Dodatkowe notatki...',
    backToTasks: '← Taskery',
    mon: 'Pon', tue: 'Wt', wed: 'Śr', thu: 'Czw', fri: 'Pt', sat: 'Sob', sun: 'Nd',
  },
  en: {
    planner: 'Send Planner', calendar: 'Calendar', list: 'List', newSend: 'New send',
    title: 'Title', description: 'Description', channel: 'Channel', tool: 'Tool', market: 'Market',
    segment: 'Segment', sendDate: 'Send date', sendTime: 'Time', recurrence: 'Recurrence',
    recurrenceEnd: 'Repeat until', status: 'Status', subjectLine: 'Subject line', notes: 'Notes',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', close: 'Close',
    today: 'Today', allMarkets: 'All markets', allChannels: 'All channels',
    allStatuses: 'All statuses', noSends: 'No scheduled sends',
    draft: 'Draft', scheduled: 'Scheduled', sent: 'Sent', cancelled: 'Cancelled',
    markSent: 'Mark as sent', markCancelled: 'Cancel', restore: 'Restore',
    loading: 'Loading...', deleteSend: 'Delete send?', assignedTo: 'Assigned to',
    oneTime: 'One-time', weekly: 'Weekly', biweekly: 'Biweekly', monthly: 'Monthly',
    recurring: 'Recurring', createSeries: 'Create series', seriesCreated: 'Series created',
    segmentPlaceholder: 'e.g. alumni, summer leads, parents...',
    subjectPlaceholder: 'Email subject line...',
    notesPlaceholder: 'Additional notes...',
    backToTasks: '← Tasks',
    mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
  },
};

const getInitials = (name) => {
  const parts = name.split(' ');
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : name[0];
};

const DAY_NAMES_PL = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
const DAY_NAMES_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES_PL = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ── Helpers ──────────────────────────────────────────────

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startWeekday = firstDay.getDay();
  startWeekday = startWeekday === 0 ? 6 : startWeekday - 1; // Monday start
  const days = [];
  // Previous month padding
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, isCurrentMonth: false });
  }
  // Current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  // Next month padding
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }
  return days;
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(dateStr, lang) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  return timeStr.substring(0, 5);
}

function isToday(dateStr) {
  return dateStr === formatDate(new Date());
}

function isPast(dateStr) {
  return dateStr < formatDate(new Date());
}

// ── Login Screen (shared logic) ──────────────────────────

function LoginScreen({ onLogin, teamMembers }) {
  const [su, setSu] = useState('');
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [ld, setLd] = useState(false);
  const am = teamMembers.filter(m => m.isActive !== false);

  const hl = async (e) => {
    e.preventDefault();
    if (!su) { setErr('Wybierz osobę'); return; }
    if (!pin || pin.length < 4) { setErr('Wpisz 4-cyfrowy PIN'); return; }
    setLd(true); setErr('');
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: su, pin })
      });
      const d = await r.json();
      if (d.success) { localStorage.setItem('av_tasks_user', su); onLogin(su); }
      else { setErr('Nieprawidłowy PIN'); setPin(''); }
    } catch { setErr('Błąd połączenia'); }
    setLd(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f8f9fa' }}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm" style={{ boxShadow: '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)' }}>
        <div className="text-center mb-8">
          <img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="Angloville" className="h-10 mx-auto mb-4" />
          <h1 className="text-xl font-semibold" style={{ color: '#111827' }}>Planer wysyłek</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Email · SMS · WhatsApp</p>
        </div>
        <form onSubmit={hl} className="space-y-4">
          {err && <div className="p-3 rounded-lg text-sm text-center" style={{ background: '#fef2f2', color: '#dc2626' }}>{err}</div>}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#111827' }}>Osoba</label>
            <select value={su} onChange={e => { setSu(e.target.value); setErr(''); }} className="w-full px-4 py-3 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }}>
              <option value="">Wybierz...</option>
              {am.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#111827' }}>PIN</label>
            <input type="password" value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setErr(''); }} className="w-full px-4 py-3 border rounded-lg text-sm text-center tracking-widest" style={{ borderColor: '#d1d5db' }} placeholder="••••" maxLength={4} inputMode="numeric" />
          </div>
          <button type="submit" disabled={ld} className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-70" style={{ background: '#2563eb', color: 'white' }}>
            {ld ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
            {ld ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Send Form Modal ──────────────────────────────────────

function SendFormModal({ send, onSave, onClose, currentUser, teamMembers, t, lang }) {
  const isEdit = !!send?.id;
  const [f, sF] = useState({
    title: send?.title || '',
    description: send?.description || '',
    channel: send?.channel || 'email',
    tool: send?.tool || 'hubspot',
    market: send?.market || 'pl',
    segment: send?.segment || '',
    sendDate: send?.sendDate || formatDate(new Date()),
    sendTime: send?.sendTime ? formatTime(send.sendTime) : '10:00',
    recurrence: send?.recurrence || null,
    recurrenceEndDate: send?.recurrenceEndDate || '',
    status: send?.status || 'scheduled',
    subjectLine: send?.subjectLine || '',
    notes: send?.notes || '',
    assignedTo: send?.assignedTo || currentUser,
  });

  const filteredTools = TOOLS.filter(tool => tool.channel === f.channel);

  useEffect(() => {
    if (!filteredTools.find(t => t.id === f.tool)) {
      sF(p => ({ ...p, tool: filteredTools[0]?.id || '' }));
    }
  }, [f.channel]);

  const handleSave = () => {
    if (!f.title.trim() || !f.sendDate) return;
    onSave({
      ...f,
      sendTime: f.sendTime || '10:00',
      recurrence: f.recurrence || null,
      recurrenceEndDate: f.recurrenceEndDate || null,
      createdBy: send?.createdBy || currentUser,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ boxShadow: '0 24px 38px 3px rgba(0,0,0,.14)' }} onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#e5e7eb' }}>
          <h3 className="text-lg font-medium" style={{ color: '#111827' }}>{isEdit ? t.edit : t.newSend}</h3>
          <button onClick={onClose} style={{ color: '#6b7280' }}><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.title} *</label>
            <input type="text" value={f.title} onChange={e => sF({ ...f, title: e.target.value })} className="w-full px-4 py-2.5 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} placeholder={lang === 'pl' ? 'Np. Newsletter wakacyjny' : 'e.g. Summer newsletter'} autoFocus />
          </div>

          {/* Channel + Tool */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.channel}</label>
              <div className="flex gap-1.5">
                {CHANNELS.map(ch => {
                  const Icon = ch.icon;
                  const active = f.channel === ch.id;
                  return (
                    <button key={ch.id} type="button" onClick={() => sF({ ...f, channel: ch.id })}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium"
                      style={{ background: active ? ch.bg : '#f3f4f6', color: active ? ch.color : '#6b7280', border: active ? `1.5px solid ${ch.color}` : '1.5px solid transparent' }}>
                      <Icon size={14} />{ch.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.tool}</label>
              <select value={f.tool} onChange={e => sF({ ...f, tool: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }}>
                {filteredTools.map(tool => <option key={tool.id} value={tool.id}>{tool.name}</option>)}
              </select>
            </div>
          </div>

          {/* Market + Segment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.market}</label>
              <select value={f.market} onChange={e => sF({ ...f, market: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }}>
                {MARKETS.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.segment}</label>
              <input type="text" value={f.segment} onChange={e => sF({ ...f, segment: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} placeholder={t.segmentPlaceholder} />
            </div>
          </div>

          {/* Subject line (email only) */}
          {f.channel === 'email' && (
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.subjectLine}</label>
              <input type="text" value={f.subjectLine} onChange={e => sF({ ...f, subjectLine: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} placeholder={t.subjectPlaceholder} />
            </div>
          )}

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.sendDate} *</label>
              <input type="date" value={f.sendDate} onChange={e => sF({ ...f, sendDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.sendTime}</label>
              <input type="time" value={f.sendTime} onChange={e => sF({ ...f, sendTime: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} />
            </div>
          </div>

          {/* Recurrence */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.recurrence}</label>
              <select value={f.recurrence || ''} onChange={e => sF({ ...f, recurrence: e.target.value || null })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }}>
                {RECURRENCE_OPTIONS.map(r => <option key={r.id || 'none'} value={r.id || ''}>{lang === 'en' ? r.nameEn : r.name}</option>)}
              </select>
            </div>
            {f.recurrence && (
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.recurrenceEnd}</label>
                <input type="date" value={f.recurrenceEndDate || ''} onChange={e => sF({ ...f, recurrenceEndDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} />
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.status}</label>
            <div className="flex gap-1.5 flex-wrap">
              {STATUSES.map(s => {
                const Icon = s.icon;
                const active = f.status === s.id;
                return (
                  <button key={s.id} type="button" onClick={() => sF({ ...f, status: s.id })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ background: active ? s.bg : '#f3f4f6', color: active ? s.color : '#6b7280', border: active ? `1.5px solid ${s.color}` : '1.5px solid transparent' }}>
                    <Icon size={12} />{lang === 'en' ? s.nameEn : s.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assigned to */}
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.assignedTo}</label>
            <select value={f.assignedTo || ''} onChange={e => sF({ ...f, assignedTo: e.target.value || null })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }}>
              <option value="">—</option>
              {teamMembers.filter(m => m.isActive !== false).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.notes}</label>
            <textarea value={f.notes} onChange={e => sF({ ...f, notes: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" style={{ borderColor: '#d1d5db' }} rows={3} placeholder={t.notesPlaceholder} />
          </div>
        </div>

        <div className="p-5 border-t flex justify-end gap-3" style={{ borderColor: '#e5e7eb' }}>
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100" style={{ color: '#6b7280' }}>{t.cancel}</button>
          <button onClick={handleSave} disabled={!f.title.trim() || !f.sendDate} className="px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50" style={{ background: '#2563eb', color: 'white' }}>{t.save}</button>
        </div>
      </div>
    </div>
  );
}

// ── Send Detail Panel ────────────────────────────────────

function SendDetail({ send, onUpdate, onDelete, onClose, teamMembers, t, lang }) {
  const ch = CHANNELS.find(c => c.id === send.channel);
  const tool = TOOLS.find(tl => tl.id === send.tool);
  const mk = MARKETS.find(m => m.id === send.market);
  const st = STATUSES.find(s => s.id === send.status);
  const assignee = teamMembers.find(m => m.id === send.assignedTo);
  const ChIcon = ch?.icon || Mail;
  const StIcon = st?.icon || Circle;

  return (
    <aside className="w-full lg:w-[420px] bg-white border-l flex flex-col overflow-hidden flex-shrink-0 fixed lg:static inset-0 z-40 lg:z-auto" style={{ borderColor: '#e5e7eb' }}>
      <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: '#e5e7eb' }}>
        <div className="flex items-center gap-2">
          <ChIcon size={18} style={{ color: ch?.color }} />
          <span className="text-sm font-medium" style={{ color: '#111827' }}>{ch?.name}</span>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: st?.bg, color: st?.color }}>{lang === 'en' ? st?.nameEn : st?.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onDelete(send.id)} className="p-1.5 rounded-full hover:bg-red-50" style={{ color: '#6b7280' }}><Trash2 size={16} /></button>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100" style={{ color: '#6b7280' }}><X size={16} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <h3 className="font-medium text-lg" style={{ color: '#111827' }}>{send.title}</h3>
          {send.description && <p className="text-sm mt-1" style={{ color: '#6b7280' }}>{send.description}</p>}
        </div>

        {/* Quick status actions */}
        <div className="flex gap-2">
          {send.status === 'scheduled' && (
            <>
              <button onClick={() => onUpdate(send.id, { status: 'sent' })} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                <CheckCircle size={14} />{t.markSent}
              </button>
              <button onClick={() => onUpdate(send.id, { status: 'cancelled' })} className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}>
                <XCircle size={14} />
              </button>
            </>
          )}
          {send.status === 'cancelled' && (
            <button onClick={() => onUpdate(send.id, { status: 'scheduled' })} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
              <Clock size={14} />{t.restore}
            </button>
          )}
          {send.status === 'draft' && (
            <button onClick={() => onUpdate(send.id, { status: 'scheduled' })} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
              <Clock size={14} />{t.scheduled}
            </button>
          )}
        </div>

        {/* Info grid */}
        <div className="space-y-3 p-3 rounded-lg" style={{ background: '#f8f9fa', border: '1px solid #e5e7eb' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: '#6b7280' }}>{t.sendDate}</span>
            <span className="text-sm font-medium" style={{ color: isToday(send.sendDate) ? '#2563eb' : isPast(send.sendDate) ? '#9ca3af' : '#111827' }}>
              {formatDisplayDate(send.sendDate, lang)} · {formatTime(send.sendTime)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: '#6b7280' }}>{t.market}</span>
            <span className="text-sm">{mk?.icon} {mk?.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: '#6b7280' }}>{t.tool}</span>
            <span className="text-sm font-medium" style={{ color: tool?.color }}>{tool?.name}</span>
          </div>
          {send.segment && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: '#6b7280' }}>{t.segment}</span>
              <span className="text-sm" style={{ color: '#111827' }}>{send.segment}</span>
            </div>
          )}
          {assignee && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: '#6b7280' }}>{t.assignedTo}</span>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: assignee.color }}>{getInitials(assignee.name)}</div>
                <span className="text-sm">{assignee.name.split(' ')[0]}</span>
              </div>
            </div>
          )}
          {send.recurrence && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: '#6b7280' }}>{t.recurrence}</span>
              <span className="flex items-center gap-1 text-sm" style={{ color: '#7c3aed' }}>
                <Repeat size={12} />{RECURRENCE_OPTIONS.find(r => r.id === send.recurrence)?.[lang === 'en' ? 'nameEn' : 'name']}
              </span>
            </div>
          )}
        </div>

        {send.subjectLine && (
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>{t.subjectLine}</label>
            <div className="px-3 py-2 rounded-lg text-sm" style={{ background: '#f3f4f6', color: '#111827' }}>{send.subjectLine}</div>
          </div>
        )}

        {send.notes && (
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>{t.notes}</label>
            <div className="px-3 py-2 rounded-lg text-sm whitespace-pre-wrap" style={{ background: '#f3f4f6', color: '#374151' }}>{send.notes}</div>
          </div>
        )}
      </div>
    </aside>
  );
}

// ── Calendar View ────────────────────────────────────────

function CalendarView({ sends, year, month, onSelectDay, onSelectSend, selectedDate, t, lang }) {
  const days = getMonthDays(year, month);
  const dayNames = lang === 'en' ? DAY_NAMES_EN : DAY_NAMES_PL;
  const todayStr = formatDate(new Date());

  const sendsByDate = useMemo(() => {
    const map = {};
    sends.forEach(s => {
      if (!map[s.sendDate]) map[s.sendDate] = [];
      map[s.sendDate].push(s);
    });
    return map;
  }, [sends]);

  return (
    <div className="bg-white rounded-xl border" style={{ borderColor: '#e5e7eb' }}>
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b" style={{ borderColor: '#e5e7eb' }}>
        {dayNames.map(d => (
          <div key={d} className="text-center py-2.5 text-xs font-medium" style={{ color: '#6b7280' }}>{d}</div>
        ))}
      </div>
      {/* Days grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dateStr = formatDate(day.date);
          const daySends = sendsByDate[dateStr] || [];
          const isT = dateStr === todayStr;
          const isSel = dateStr === selectedDate;
          return (
            <div key={i} onClick={() => onSelectDay(dateStr)}
              className="min-h-[90px] p-1 border-b border-r cursor-pointer transition-colors hover:bg-blue-50/30"
              style={{
                borderColor: '#f3f4f6',
                background: isSel ? '#eff6ff' : isT ? '#fefce8' : !day.isCurrentMonth ? '#fafafa' : 'white',
              }}>
              <div className="flex items-center justify-between px-1 mb-0.5">
                <span className={`text-xs font-medium ${isT ? 'w-5 h-5 rounded-full flex items-center justify-center' : ''}`}
                  style={{
                    color: !day.isCurrentMonth ? '#d1d5db' : isT ? 'white' : '#111827',
                    background: isT ? '#2563eb' : 'transparent',
                    fontSize: '11px',
                  }}>
                  {day.date.getDate()}
                </span>
                {daySends.length > 0 && (
                  <span className="text-xs px-1 rounded" style={{ background: '#e5e7eb', color: '#6b7280', fontSize: '10px' }}>
                    {daySends.length}
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                {daySends.slice(0, 3).map(s => {
                  const ch = CHANNELS.find(c => c.id === s.channel);
                  const st = STATUSES.find(st => st.id === s.status);
                  return (
                    <div key={s.id} onClick={e => { e.stopPropagation(); onSelectSend(s); }}
                      className="flex items-center gap-1 px-1 py-0.5 rounded text-xs truncate hover:opacity-80"
                      style={{ background: ch?.bg, color: ch?.color, opacity: s.status === 'cancelled' ? 0.4 : s.status === 'sent' ? 0.6 : 1 }}>
                      {s.status === 'sent' && <CheckCircle size={9} />}
                      {s.status === 'cancelled' && <XCircle size={9} />}
                      <span className="truncate" style={{ fontSize: '10px', fontWeight: 500, textDecoration: s.status === 'cancelled' ? 'line-through' : 'none' }}>
                        {MARKETS.find(m => m.id === s.market)?.icon} {s.title}
                      </span>
                    </div>
                  );
                })}
                {daySends.length > 3 && (
                  <span className="text-xs px-1" style={{ color: '#6b7280', fontSize: '10px' }}>+{daySends.length - 3}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── List View ────────────────────────────────────────────

function ListView({ sends, onSelectSend, selectedSendId, teamMembers, t, lang }) {
  const grouped = useMemo(() => {
    const map = {};
    sends.forEach(s => {
      if (!map[s.sendDate]) map[s.sendDate] = [];
      map[s.sendDate].push(s);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [sends]);

  if (sends.length === 0) {
    return (
      <div className="text-center py-16">
        <Calendar size={48} className="mx-auto mb-4" style={{ color: '#d1d5db' }} />
        <p style={{ color: '#6b7280' }}>{t.noSends}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(([date, daySends]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isToday(date) ? '' : ''}`}
              style={{ background: isToday(date) ? '#2563eb' : '#f3f4f6', color: isToday(date) ? 'white' : isPast(date) ? '#9ca3af' : '#111827' }}>
              {formatDisplayDate(date, lang)}
            </span>
            {isToday(date) && <span className="text-xs font-medium" style={{ color: '#2563eb' }}>{t.today}</span>}
          </div>
          <div className="space-y-1">
            {daySends.map(s => {
              const ch = CHANNELS.find(c => c.id === s.channel);
              const tool = TOOLS.find(tl => tl.id === s.tool);
              const mk = MARKETS.find(m => m.id === s.market);
              const st = STATUSES.find(st => st.id === s.status);
              const StIcon = st?.icon || Circle;
              const ChIcon = ch?.icon || Mail;
              const assignee = teamMembers.find(m => m.id === s.assignedTo);
              const selected = selectedSendId === s.id;

              return (
                <div key={s.id} onClick={() => onSelectSend(s)}
                  className="bg-white rounded-lg px-3 py-2.5 cursor-pointer border transition-all duration-100 flex items-center gap-3"
                  style={{
                    borderWidth: '0.5px',
                    borderColor: selected ? '#3b82f6' : '#e5e7eb',
                    opacity: s.status === 'cancelled' ? 0.5 : 1,
                    boxShadow: selected ? '0 0 0 1px rgba(59,130,246,0.15)' : 'none',
                  }}>
                  <StIcon size={16} style={{ color: st?.color }} className={s.status === 'sent' ? 'fill-current' : ''} />
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: ch?.bg }}>
                    <ChIcon size={13} style={{ color: ch?.color }} />
                  </div>
                  <span className="text-sm">{mk?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate" style={{
                      color: s.status === 'cancelled' ? '#9ca3af' : '#111827',
                      textDecoration: s.status === 'cancelled' ? 'line-through' : 'none'
                    }}>{s.title}</h4>
                    {s.segment && <p className="text-xs truncate" style={{ color: '#9ca3af' }}>{s.segment}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-medium" style={{ color: tool?.color }}>{tool?.name}</span>
                    <span className="text-xs" style={{ color: '#9ca3af' }}>{formatTime(s.sendTime)}</span>
                    {s.recurrence && <Repeat size={12} style={{ color: '#7c3aed' }} />}
                    {assignee && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: assignee.color }}>
                        {getInitials(assignee.name)}
                      </div>
                    )}
                    <ChevronRight size={14} style={{ color: '#d1d5db' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Planner App ─────────────────────────────────────

export default function PlannerPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [sends, setSends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [view, setView] = useState('calendar'); // calendar | list
  const [showForm, setShowForm] = useState(false);
  const [editSend, setEditSend] = useState(null);
  const [selectedSend, setSelectedSend] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  // Filters
  const [filterMarket, setFilterMarket] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Team
  useEffect(() => { (async () => { setLoadingTeam(true); const m = await getTeamMembers(); if (m.length > 0) setTeamMembers(m); setLoadingTeam(false); })(); }, []);

  const currentMember = teamMembers.find(m => m.id === currentUser);
  const lang = currentMember?.language || 'pl';
  const t = TRANSLATIONS[lang];

  // Auth
  useEffect(() => {
    const su = localStorage.getItem('av_tasks_user');
    if (su) {
      (async () => {
        const m = await getTeamMembers();
        if (m.find(x => x.id === su)) { setCurrentUser(su); setTeamMembers(m); }
        setCheckingAuth(false);
      })();
    } else setCheckingAuth(false);
  }, []);

  // Load sends
  const loadSends = useCallback(async () => {
    const data = await getScheduledSends();
    setSends(data);
    setLoading(false);
  }, []);

  useEffect(() => { if (currentUser) loadSends(); }, [currentUser, loadSends]);
  useEffect(() => { if (!currentUser) return; const iv = setInterval(loadSends, 30000); return () => clearInterval(iv); }, [currentUser, loadSends]);

  const handleLogout = () => { localStorage.removeItem('av_tasks_user'); setCurrentUser(null); setSends([]); setSelectedSend(null); };

  // Filtered sends
  const filteredSends = useMemo(() => {
    return sends.filter(s => {
      if (filterMarket !== 'all' && s.market !== filterMarket) return false;
      if (filterChannel !== 'all' && s.channel !== filterChannel) return false;
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      return true;
    });
  }, [sends, filterMarket, filterChannel, filterStatus]);

  // Calendar-filtered sends (only current month view)
  const calendarSends = useMemo(() => {
    const start = new Date(calYear, calMonth - 1, 20);
    const end = new Date(calYear, calMonth + 1, 10);
    const startStr = formatDate(start);
    const endStr = formatDate(end);
    return filteredSends.filter(s => s.sendDate >= startStr && s.sendDate <= endStr);
  }, [filteredSends, calYear, calMonth]);

  // Handlers
  const handleSaveSend = async (data) => {
    if (editSend?.id) {
      const updated = await updateScheduledSend(editSend.id, data);
      if (updated) {
        setSends(prev => prev.map(s => s.id === updated.id ? updated : s));
        if (selectedSend?.id === updated.id) setSelectedSend(updated);
      }
    } else {
      const created = await createScheduledSend(data);
      if (created) {
        setSends(prev => [...prev, created]);
        // Generate recurrences
        if (created.recurrence && created.recurrenceEndDate) {
          const occurrences = await generateRecurrences(created);
          if (occurrences.length > 0) {
            setSends(prev => [...prev, ...occurrences]);
          }
        }
      }
    }
    setShowForm(false);
    setEditSend(null);
  };

  const handleUpdateSend = async (id, updates) => {
    const updated = await updateScheduledSend(id, updates);
    if (updated) {
      setSends(prev => prev.map(s => s.id === updated.id ? updated : s));
      if (selectedSend?.id === updated.id) setSelectedSend(updated);
    }
  };

  const handleDeleteSend = async (id) => {
    if (!confirm(t.deleteSend)) return;
    const ok = await deleteScheduledSend(id);
    if (ok) {
      setSends(prev => prev.filter(s => s.id !== id));
      if (selectedSend?.id === id) setSelectedSend(null);
    }
  };

  const handleSelectSend = (send) => {
    setSelectedSend(send);
  };

  const handleSelectDay = (dateStr) => {
    setSelectedDate(dateStr);
    setSelectedSend(null);
  };

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };
  const goToday = () => { setCalYear(now.getFullYear()); setCalMonth(now.getMonth()); };

  const monthNames = lang === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_PL;

  // Counts for sidebar
  const counts = useMemo(() => {
    const filtered = sends.filter(s => {
      if (filterMarket !== 'all' && s.market !== filterMarket) return false;
      return true;
    });
    return {
      scheduled: filtered.filter(s => s.status === 'scheduled').length,
      draft: filtered.filter(s => s.status === 'draft').length,
      sent: filtered.filter(s => s.status === 'sent').length,
      cancelled: filtered.filter(s => s.status === 'cancelled').length,
      email: filtered.filter(s => s.channel === 'email').length,
      sms: filtered.filter(s => s.channel === 'sms').length,
      whatsapp: filtered.filter(s => s.channel === 'whatsapp').length,
    };
  }, [sends, filterMarket]);

  if (checkingAuth || loadingTeam) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fa' }}><Loader2 className="animate-spin" size={32} style={{ color: '#2563eb' }} /></div>;
  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} teamMembers={teamMembers} />;
  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fa', color: '#6b7280' }}>{t.loading}</div>;

  return (
    <div className="min-h-screen flex" style={{ background: '#f9fafb', fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`w-52 flex flex-col min-h-screen flex-shrink-0 bg-white fixed lg:static z-30 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ borderRight: '0.5px solid #e5e7eb' }}>
        <div className="px-4 py-3.5 flex items-center justify-between" style={{ borderBottom: '0.5px solid #e5e7eb' }}>
          <div>
            <img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="Angloville" className="h-6" />
            <p className="mt-0.5 text-xs" style={{ color: '#9ca3af', letterSpacing: '0.02em' }}>{t.planner}</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-1 rounded hover:bg-gray-100 lg:hidden" style={{ color: '#9ca3af' }}><X size={16} /></button>
        </div>

        {/* Market filter */}
        <div className="px-3 py-2.5" style={{ borderBottom: '0.5px solid #e5e7eb' }}>
          <select value={filterMarket} onChange={e => setFilterMarket(e.target.value)} className="w-full rounded-md px-2.5 py-1.5 text-xs border" style={{ borderColor: '#e5e7eb', color: '#374151', borderWidth: '0.5px' }}>
            <option value="all">{t.allMarkets}</option>
            {MARKETS.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
          </select>
        </div>

        {/* Status nav */}
        <div className="p-2 flex-1 overflow-y-auto">
          <div className="space-y-0.5">
            {/* All */}
            <button onClick={() => { setFilterStatus('all'); setFilterChannel('all'); setSidebarOpen(false); }}
              className="w-full flex items-center justify-between px-2.5 py-1 rounded-md text-xs"
              style={{ background: filterStatus === 'all' && filterChannel === 'all' ? '#eff6ff' : 'transparent', color: filterStatus === 'all' && filterChannel === 'all' ? '#2563eb' : '#374151', fontWeight: filterStatus === 'all' && filterChannel === 'all' ? 500 : 400 }}>
              <div className="flex items-center gap-1.5"><Filter size={13} style={{ color: '#2563eb' }} /><span>{lang === 'en' ? 'All sends' : 'Wszystkie'}</span></div>
              <span style={{ color: '#9ca3af', fontSize: '11px' }}>{filteredSends.length}</span>
            </button>

            {/* By status */}
            <div className="mt-2 mb-1 px-2.5"><span className="text-xs font-medium" style={{ color: '#9ca3af' }}>{t.status}</span></div>
            {STATUSES.map(s => {
              const Icon = s.icon;
              const active = filterStatus === s.id && filterChannel === 'all';
              return (
                <button key={s.id} onClick={() => { setFilterStatus(s.id); setFilterChannel('all'); setSidebarOpen(false); }}
                  className="w-full flex items-center justify-between px-2.5 py-1 rounded-md text-xs pl-4"
                  style={{ background: active ? s.bg : 'transparent', color: active ? s.color : '#374151', fontWeight: active ? 500 : 400 }}>
                  <div className="flex items-center gap-1.5">
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, opacity: active ? 1 : 0.5 }} />
                    <span>{lang === 'en' ? s.nameEn : s.name}</span>
                  </div>
                  <span style={{ color: active ? s.color : '#9ca3af', fontSize: '11px' }}>{counts[s.id] || 0}</span>
                </button>
              );
            })}

            {/* By channel */}
            <div className="mt-3 mb-1 px-2.5"><span className="text-xs font-medium" style={{ color: '#9ca3af' }}>{t.channel}</span></div>
            {CHANNELS.map(ch => {
              const Icon = ch.icon;
              const active = filterChannel === ch.id;
              return (
                <button key={ch.id} onClick={() => { setFilterChannel(ch.id); setFilterStatus('all'); setSidebarOpen(false); }}
                  className="w-full flex items-center justify-between px-2.5 py-1 rounded-md text-xs pl-4"
                  style={{ background: active ? ch.bg : 'transparent', color: active ? ch.color : '#374151', fontWeight: active ? 500 : 400 }}>
                  <div className="flex items-center gap-1.5">
                    <Icon size={12} style={{ color: ch.color, opacity: active ? 1 : 0.5 }} />
                    <span>{ch.name}</span>
                  </div>
                  <span style={{ color: active ? ch.color : '#9ca3af', fontSize: '11px' }}>{counts[ch.id] || 0}</span>
                </button>
              );
            })}
          </div>

          {/* Link back to tasks */}
          <div className="mt-6 mx-2">
            <a href="/" className="text-xs px-2.5 py-1.5 rounded-md hover:bg-gray-100 block" style={{ color: '#2563eb' }}>
              {t.backToTasks}
            </a>
          </div>
        </div>

        {/* User footer */}
        <div className="px-3 py-2.5" style={{ borderTop: '0.5px solid #e5e7eb' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: currentMember?.color, fontSize: '9px' }}>
              {getInitials(currentMember?.name || '')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: '#374151' }}>{currentMember?.name?.split(' ')[0]}</div>
            </div>
            <button onClick={handleLogout} className="p-1 rounded-full hover:bg-gray-100" style={{ color: '#9ca3af' }}><LogOut size={15} /></button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-white px-4 lg:px-6 py-2.5 flex items-center justify-between gap-2" style={{ borderBottom: '0.5px solid #e5e7eb' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-full hover:bg-gray-100 lg:hidden flex-shrink-0" style={{ color: '#9ca3af' }}><Menu size={20} /></button>

            {view === 'calendar' && (
              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="p-1.5 rounded-full hover:bg-gray-100" style={{ color: '#6b7280' }}><ChevronLeft size={18} /></button>
                <h2 className="text-sm lg:text-base font-semibold min-w-[160px] text-center" style={{ color: '#111827' }}>
                  {monthNames[calMonth]} {calYear}
                </h2>
                <button onClick={nextMonth} className="p-1.5 rounded-full hover:bg-gray-100" style={{ color: '#6b7280' }}><ChevronRight size={18} /></button>
                <button onClick={goToday} className="text-xs px-2.5 py-1 rounded-md border" style={{ borderColor: '#d1d5db', color: '#6b7280' }}>{t.today}</button>
              </div>
            )}
            {view === 'list' && (
              <h2 className="text-sm lg:text-base font-semibold" style={{ color: '#111827' }}>{t.planner}</h2>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: '#d1d5db' }}>
              <button onClick={() => setView('calendar')} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium"
                style={{ background: view === 'calendar' ? '#2563eb' : 'white', color: view === 'calendar' ? 'white' : '#6b7280' }}>
                <Calendar size={14} /><span className="hidden sm:inline">{t.calendar}</span>
              </button>
              <button onClick={() => setView('list')} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium"
                style={{ background: view === 'list' ? '#2563eb' : 'white', color: view === 'list' ? 'white' : '#6b7280', borderLeft: '1px solid #d1d5db' }}>
                <List size={14} /><span className="hidden sm:inline">{t.list}</span>
              </button>
            </div>

            <button onClick={loadSends} className="p-2 rounded-full hover:bg-gray-100" style={{ color: '#6b7280' }}><Loader2 size={18} className={loading ? 'animate-spin' : ''} /></button>
            <button onClick={() => { setEditSend(null); setShowForm(true); }} className="flex items-center gap-1.5 px-3 lg:px-3.5 py-1.5 rounded-lg font-medium text-xs" style={{ background: '#2563eb', color: 'white' }}>
              <Plus size={15} /><span className="hidden sm:inline">{t.newSend}</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-4">
          {view === 'calendar' ? (
            <CalendarView
              sends={calendarSends}
              year={calYear}
              month={calMonth}
              onSelectDay={handleSelectDay}
              onSelectSend={handleSelectSend}
              selectedDate={selectedDate}
              t={t}
              lang={lang}
            />
          ) : (
            <div className="max-w-4xl mx-auto">
              <ListView
                sends={filteredSends}
                onSelectSend={handleSelectSend}
                selectedSendId={selectedSend?.id}
                teamMembers={teamMembers}
                t={t}
                lang={lang}
              />
            </div>
          )}
        </div>
      </main>

      {/* ── Detail Panel ── */}
      {selectedSend && (
        <SendDetail
          send={selectedSend}
          onUpdate={handleUpdateSend}
          onDelete={handleDeleteSend}
          onClose={() => setSelectedSend(null)}
          teamMembers={teamMembers}
          t={t}
          lang={lang}
        />
      )}

      {/* ── Form Modal ── */}
      {showForm && (
        <SendFormModal
          send={editSend}
          onSave={handleSaveSend}
          onClose={() => { setShowForm(false); setEditSend(null); }}
          currentUser={currentUser}
          teamMembers={teamMembers}
          t={t}
          lang={lang}
        />
      )}
    </div>
  );
}
