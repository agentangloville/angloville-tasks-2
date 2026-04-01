'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, X, Check, Edit3, Trash2, ChevronLeft, ChevronRight,
  Calendar, List, Mail, MessageSquare, Phone, Clock,
  Filter, Loader2, LogOut, Lock, Menu, Repeat,
  CheckCircle, Circle, XCircle, ExternalLink, Users, Download
} from 'lucide-react';
import { getTeamMembers, createTask, updateTask as updateTaskDb } from '../../lib/supabase';
import {
  getScheduledSends, createScheduledSend, updateScheduledSend,
  deleteScheduledSend, generateRecurrences, updateSeries, deleteSeries
} from '../../lib/supabase-planner';

// ── Constants ────────────────────────────────────────

const MARKETS = [
  { id: 'pl', name: 'Polska', nameEn: 'Poland', icon: '🇵🇱' },
  { id: 'ns', name: 'Native Speakers', nameEn: 'Native Speakers', icon: '🇬🇧' },
  { id: 'it', name: 'Włochy', nameEn: 'Italy', icon: '🇮🇹' },
  { id: 'exchange', name: 'Wymiana', nameEn: 'Exchange', icon: '🎓' },
  { id: 'tefl', name: 'TEFL in Asia', nameEn: 'TEFL in Asia', icon: '🌏' },
  { id: 'brazil', name: 'Brazylia', nameEn: 'Brazil', icon: '🇧🇷' },
];

const CHANNELS = [
  { id: 'email', name: 'Email', icon: Mail, color: '#2563eb', bg: '#eff6ff' },
  { id: 'sms', name: 'SMS', icon: Phone, color: '#16a34a', bg: '#f0fdf4' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, color: '#25d366', bg: '#ecfdf5' },
  { id: 'infomeeting', name: 'Infomeeting', icon: Users, color: '#7c3aed', bg: '#f5f3ff' },
];

const TOOLS = [
  { id: 'hubspot', name: 'HubSpot', channel: 'email', color: '#ff7a59' },
  { id: 'mailchimp', name: 'Mailchimp', channel: 'email', color: '#ffe01b' },
  { id: 'mailshake', name: 'Mailshake', channel: 'email', color: '#6c5ce7' },
  { id: 'sms_api', name: 'SMS', channel: 'sms', color: '#16a34a' },
  { id: 'whatsapp_pl', name: 'WhatsApp PL', channel: 'whatsapp', color: '#25d366' },
  { id: 'whatsapp_uk', name: 'WhatsApp UK', channel: 'whatsapp', color: '#25d366' },
  { id: 'whatsapp_it', name: 'WhatsApp IT', channel: 'whatsapp', color: '#25d366' },
  { id: 'zoom', name: 'Zoom', channel: 'infomeeting', color: '#2d8cff' },
  { id: 'onsite', name: 'Stacjonarnie', channel: 'infomeeting', color: '#f59e0b' },
  { id: 'teams', name: 'Teams', channel: 'infomeeting', color: '#6264a7' },
];

const STATUSES = [
  { id: 'todo', name: 'Do przygotowania', nameEn: 'To prepare', color: '#9ca3af', bg: '#f3f4f6', icon: Circle },
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

const T = {
  pl: {
    planner: 'Planner wysyłek', calendar: 'Kalendarz', list: 'Lista', newSend: 'Nowa wysyłka',
    title: 'Tytuł', channel: 'Typ', tools: 'Narzędzia', market: 'Rynek',
    segment: 'Segment', sendDate: 'Data', sendTime: 'Godzina', recurrence: 'Powtarzanie',
    recurrenceEnd: 'Powtarzaj do', status: 'Status', subjectLine: 'Temat', notes: 'Notatki',
    save: 'Zapisz', cancel: 'Anuluj', delete: 'Usuń', edit: 'Edytuj',
    today: 'Dziś', allMarkets: 'Wszystkie rynki', noSends: 'Brak wysyłek',
    markSent: 'Oznacz wysłane', restore: 'Przywróć', markScheduled: 'Zaplanuj',
    loading: 'Ładowanie...', deleteSend: 'Usunąć?', assignees: 'Przypisani',
    links: 'Linki', addLink: '+ Link', addPerson: '+ Dodaj',
    segmentPlaceholder: 'np. alumni, leady wakacje...',
    subjectPlaceholder: 'Temat emaila...', notesPlaceholder: 'Notatki...',
    taskLink: 'Link do taska', taskLinkPlaceholder: 'https://...vercel.app/ (opcjonalnie)',
    backToTasks: '← Taskery', selectTools: 'Wybierz...',
    exportBtn: 'Eksport', exportTitle: 'Eksportuj harmonogram', exportMarkets: 'Rynki', exportStatuses: 'Statusy', exportChannels: 'Kanały', exportRange: 'Zakres dat', exportDownload: 'Pobierz CSV', exportAll: 'Wszystkie',
    editThis: 'Tylko tę wysyłkę', editAll: 'Całą serię',
    deleteThis: 'Tylko tę', deleteAll: 'Całą serię',
    editRecurring: 'Edytuj cykliczną', deleteRecurring: 'Usuń cykliczną',
    noEndDefault: 'Brak = rok do przodu',
    optional: 'opcjonalnie',
    createLinkedTask: 'Utwórz task w Taskerze',
    linkedTask: 'Powiązany task',
    openLinkedTask: 'Otwórz w Taskerze',
  },
  en: {
    planner: 'Send Planner', calendar: 'Calendar', list: 'List', newSend: 'New send',
    title: 'Title', channel: 'Type', tools: 'Tools', market: 'Market',
    segment: 'Segment', sendDate: 'Date', sendTime: 'Time', recurrence: 'Recurrence',
    recurrenceEnd: 'Repeat until', status: 'Status', subjectLine: 'Subject', notes: 'Notes',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
    today: 'Today', allMarkets: 'All markets', noSends: 'No sends',
    markSent: 'Mark sent', restore: 'Restore', markScheduled: 'Schedule',
    loading: 'Loading...', deleteSend: 'Delete?', assignees: 'Assigned',
    links: 'Links', addLink: '+ Link', addPerson: '+ Add',
    segmentPlaceholder: 'e.g. alumni, summer leads...',
    subjectPlaceholder: 'Email subject...', notesPlaceholder: 'Notes...',
    taskLink: 'Related task', taskLinkPlaceholder: 'https://...vercel.app/ (optional)',
    backToTasks: '← Tasks', selectTools: 'Select...',
    exportBtn: 'Export', exportTitle: 'Export schedule', exportMarkets: 'Markets', exportStatuses: 'Statuses', exportChannels: 'Channels', exportRange: 'Date range', exportDownload: 'Download CSV', exportAll: 'All',
    editThis: 'This send only', editAll: 'All in series',
    deleteThis: 'This only', deleteAll: 'Entire series',
    editRecurring: 'Edit recurring', deleteRecurring: 'Delete recurring',
    noEndDefault: 'None = 1 year ahead',
    optional: 'optional',
    createLinkedTask: 'Create task in Tasker',
    linkedTask: 'Linked task',
    openLinkedTask: 'Open in Tasker',
  },
};

const getInitials = (n) => { const p = n.split(' '); return p.length >= 2 ? p[0][0] + p[1][0] : n[0]; };
const DAYS_PL = ['Pon','Wt','Śr','Czw','Pt','Sob','Nd'];
const DAYS_EN = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MONTHS_PL = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  let sw = first.getDay(); sw = sw === 0 ? 6 : sw - 1;
  const days = [];
  for (let i = sw - 1; i >= 0; i--) days.push({ date: new Date(year, month, -i), cur: false });
  for (let i = 1; i <= last.getDate(); i++) days.push({ date: new Date(year, month, i), cur: true });
  while (days.length < 42) { const n = days.length - sw - last.getDate() + 1; days.push({ date: new Date(year, month + 1, n), cur: false }); }
  return days;
}

const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fmtDisp = (ds, lang) => new Date(ds+'T00:00:00').toLocaleDateString(lang==='en'?'en-US':'pl-PL',{day:'numeric',month:'short',year:'numeric'});
const fmtTime = (ts) => ts ? ts.substring(0,5) : '';
const isToday = (ds) => ds === fmt(new Date());
const isPast = (ds) => ds < fmt(new Date());
const isPartOfSeries = (s) => !!(s.parentId || s.recurrence);
const getSeriesRoot = (s) => s.parentId || s.id;

// ── Series Choice Modal (like Google Calendar) ───────

function SeriesChoiceModal({ type, onChoice, onClose, t }) {
  const isDelete = type === 'delete';
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-xs overflow-hidden" style={{ boxShadow: '0 24px 38px 3px rgba(0,0,0,.14)' }} onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <h3 className="text-base font-semibold mb-4" style={{ color: '#111827' }}>
            {isDelete ? t.deleteRecurring : t.editRecurring}
          </h3>
          <div className="space-y-2">
            <button onClick={() => onChoice('this')}
              className="w-full text-left px-4 py-3 rounded-lg border hover:bg-gray-50 text-sm font-medium"
              style={{ borderColor: '#e5e7eb', color: '#111827' }}>
              {isDelete ? t.deleteThis : t.editThis}
            </button>
            <button onClick={() => onChoice('all')}
              className="w-full text-left px-4 py-3 rounded-lg border hover:bg-gray-50 text-sm font-medium"
              style={{ borderColor: '#e5e7eb', color: '#111827' }}>
              {isDelete ? t.deleteAll : t.editAll}
            </button>
          </div>
        </div>
        <div className="px-5 pb-4">
          <button onClick={onClose} className="w-full py-2 rounded-lg text-sm" style={{ color: '#6b7280' }}>{t.cancel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Links Editor ─────────────────────────────────────

function LinksEditor({ links, onChange, t }) {
  const add = () => onChange([...links, { name: '', url: '' }]);
  const upd = (i, k, v) => onChange(links.map((l, j) => j === i ? { ...l, [k]: v } : l));
  const rm = (i) => onChange(links.filter((_, j) => j !== i));
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.links}</label>
      {links.map((l, i) => (
        <div key={i} className="flex items-center gap-2 mb-1.5">
          <input type="text" value={l.name} onChange={e => upd(i,'name',e.target.value)} className="w-28 px-2 py-1.5 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} placeholder={t.title} />
          <input type="url" value={l.url} onChange={e => upd(i,'url',e.target.value)} className="flex-1 px-2 py-1.5 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} placeholder="https://..." />
          <button type="button" onClick={() => rm(i)} className="p-1 rounded hover:bg-red-50" style={{ color: '#ef4444' }}><X size={14} /></button>
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs font-medium px-2 py-1 rounded hover:bg-blue-50" style={{ color: '#2563eb' }}>{t.addLink}</button>
    </div>
  );
}

function LinksDisplay({ links }) {
  if (!links?.length) return null;
  return (
    <div className="space-y-1">
      {links.map((l, i) => (
        <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-blue-50 text-sm" style={{ color: '#2563eb' }}>
          <ExternalLink size={13} /><span className="hover:underline">{l.name || l.url}</span>
        </a>
      ))}
    </div>
  );
}

// ── Multi-Tool Selector ──────────────────────────────

function ToolMultiSelect({ selected, channel, onChange, t }) {
  const opts = TOOLS.filter(t => t.channel === channel);
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.tools}</label>
      <div className="flex flex-wrap gap-1.5">
        {opts.map(tool => {
          const on = selected.includes(tool.id);
          return <button key={tool.id} type="button" onClick={() => toggle(tool.id)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border"
            style={{ background: on ? tool.color+'18' : '#f3f4f6', color: on ? tool.color : '#6b7280', borderColor: on ? tool.color : 'transparent' }}>
            {tool.name}{on && <Check size={12} />}
          </button>;
        })}
      </div>
      {selected.length === 0 && opts.length > 0 && <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>{t.selectTools}</p>}
    </div>
  );
}

// ── Multi-Assignee Selector ──────────────────────────

function AssigneeSelector({ assignees, teamMembers, onChange, t }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.assignees}</label>
      <div className="flex flex-wrap gap-1.5">
        {teamMembers.filter(m => m.isActive !== false).map(m => {
          const on = assignees.includes(m.id);
          return <button key={m.id} type="button" onClick={() => onChange(on ? assignees.filter(a => a !== m.id) : [...assignees, m.id])}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border"
            style={{ borderColor: on ? '#2563eb' : '#d1d5db', background: on ? '#eff6ff' : 'white', color: on ? '#2563eb' : '#111827' }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: m.color, fontSize: '8px', fontWeight: 600 }}>{getInitials(m.name)}</div>
            {m.name.split(' ')[0]}{on && <Check size={12} />}
          </button>;
        })}
      </div>
    </div>
  );
}

// ── Send Form Modal ──────────────────────────────────

function SendFormModal({ send, onSave, onClose, currentUser, teamMembers, t, lang }) {
  const isEdit = !!send?.id;
  const [f, sF] = useState({
    title: send?.title || '', description: send?.description || '',
    channel: send?.channel || 'email', tools: send?.tools || [],
    market: send?.market || 'pl', segment: send?.segment || '',
    sendDate: send?.sendDate || send?._prefillDate || fmt(new Date()),
    sendTime: send?.sendTime ? fmtTime(send.sendTime) : '10:00',
    recurrence: send?.recurrence || null, recurrenceEndDate: send?.recurrenceEndDate || '',
    status: send?.status || 'scheduled', subjectLine: send?.subjectLine || '',
    notes: send?.notes || '', links: send?.links || [],
    taskLink: send?.taskLink || '',
    assignees: send?.assignees || [currentUser],
    createTask: false,
    linkedTaskId: send?.linkedTaskId || null,
  });

  const chChange = (ch) => {
    const avail = TOOLS.filter(t => t.channel === ch);
    const valid = f.tools.filter(id => avail.some(t => t.id === id));
    sF({ ...f, channel: ch, tools: valid.length ? valid : (avail[0] ? [avail[0].id] : []) });
  };

  const save = async () => {
    if (!f.title.trim() || !f.sendDate) return;
    let linkedTaskId = f.linkedTaskId;

    // Jeśli checkbox zaznaczony i jeszcze nie ma powiązanego taska — utwórz go
    if (f.createTask && !linkedTaskId) {
      const newTask = await createTask({
        title: f.title,
        description: f.notes || '',
        market: f.market,
        status: 'open',
        deadline: f.sendDate || null,
        assignees: f.assignees || [],
        createdBy: f.createdBy || currentUser,
        language: 'pl',
      });
      if (newTask) {
        linkedTaskId = newTask.id;
      }
    }

    onSave({
      ...f,
      linkedTaskId,
      sendTime: f.sendTime || '10:00',
      recurrence: f.recurrence || null,
      recurrenceEndDate: f.recurrenceEndDate || null,
      links: f.links.filter(l => l.url.trim()),
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
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.title} *</label>
            <input type="text" value={f.title} onChange={e => sF({...f, title: e.target.value})} className="w-full px-4 py-2.5 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} autoFocus />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.channel}</label>
            <div className="flex gap-1.5 flex-wrap">
              {CHANNELS.map(ch => {
                const I = ch.icon; const on = f.channel === ch.id;
                return <button key={ch.id} type="button" onClick={() => chChange(ch.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                  style={{ background: on ? ch.bg : '#f3f4f6', color: on ? ch.color : '#6b7280', border: on ? `1.5px solid ${ch.color}` : '1.5px solid transparent' }}>
                  <I size={14} />{ch.name}
                </button>;
              })}
            </div>
          </div>

          <ToolMultiSelect selected={f.tools} channel={f.channel} onChange={tools => sF({...f, tools})} t={t} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.market}</label>
              <select value={f.market} onChange={e => sF({...f, market: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }}>
                {MARKETS.map(m => <option key={m.id} value={m.id}>{m.icon} {lang==='en' ? m.nameEn : m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.segment}</label>
              <input type="text" value={f.segment} onChange={e => sF({...f, segment: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} placeholder={t.segmentPlaceholder} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.subjectLine}</label>
            <input type="text" value={f.subjectLine} onChange={e => sF({...f, subjectLine: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} placeholder={t.subjectPlaceholder} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.sendDate} *</label>
              <input type="date" value={f.sendDate} onChange={e => sF({...f, sendDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.sendTime}</label>
              <input type="time" value={f.sendTime} onChange={e => sF({...f, sendTime: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} />
            </div>
          </div>

          {!isEdit && (
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.recurrence}</label>
                  <select value={f.recurrence || ''} onChange={e => sF({...f, recurrence: e.target.value || null})} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }}>
                    {RECURRENCE_OPTIONS.map(r => <option key={r.id||'none'} value={r.id||''}>{lang==='en' ? r.nameEn : r.name}</option>)}
                  </select>
                </div>
                {f.recurrence && (
                  <div>
                    <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.recurrenceEnd} <span className="font-normal" style={{ color: '#9ca3af' }}>({t.optional})</span></label>
                    <input type="date" value={f.recurrenceEndDate||''} onChange={e => sF({...f, recurrenceEndDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} />
                  </div>
                )}
              </div>
              {f.recurrence && !f.recurrenceEndDate && <p className="text-xs mt-1.5" style={{ color: '#9ca3af' }}>{t.noEndDefault}</p>}
            </div>
          )}

          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.status}</label>
            <div className="flex gap-1.5 flex-wrap">
              {STATUSES.map(s => {
                const I = s.icon; const on = f.status === s.id;
                return <button key={s.id} type="button" onClick={() => sF({...f, status: s.id})}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: on ? s.bg : '#f3f4f6', color: on ? s.color : '#6b7280', border: on ? `1.5px solid ${s.color}` : '1.5px solid transparent' }}>
                  <I size={12} />{lang==='en' ? s.nameEn : s.name}
                </button>;
              })}
            </div>
          </div>

          <AssigneeSelector assignees={f.assignees} teamMembers={teamMembers} onChange={a => sF({...f, assignees: a})} t={t} />

          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.taskLink}</label>
            <input type="url" value={f.taskLink} onChange={e => sF({...f, taskLink: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} placeholder={t.taskLinkPlaceholder} />
          </div>

          {/* Checkbox: Utwórz task w Taskerze */}
          {!f.linkedTaskId && (
            <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-lg hover:bg-gray-50" style={{ border: '1px solid #e5e7eb' }}>
              <input type="checkbox" checked={f.createTask} onChange={e => sF({...f, createTask: e.target.checked})} className="w-4 h-4 rounded" style={{ accentColor: '#2563eb' }} />
              <div>
                <span className="text-sm font-medium" style={{ color: '#111827' }}>{t.createLinkedTask}</span>
                <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{lang === 'en' ? 'Auto-creates a task with same title, market & assignees' : 'Automatycznie utworzy task z tym samym tytułem, rynkiem i przypisanymi'}</p>
              </div>
            </label>
          )}

          {/* Pokaż info o powiązanym tasku przy edycji */}
          {f.linkedTaskId && (
            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <CheckCircle size={14} style={{ color: '#2563eb' }} />
              <span className="text-sm" style={{ color: '#2563eb' }}>{t.linkedTask}</span>
              <a href={`/?task=${f.linkedTaskId}`} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs font-medium hover:underline" style={{ color: '#2563eb' }}>{t.openLinkedTask} →</a>
            </div>
          )}

          <LinksEditor links={f.links} onChange={links => sF({...f, links})} t={t} />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium" style={{ color: '#111827' }}>{t.notes}</label>
              {f.channel === 'sms' && (
                <span className="text-xs font-medium" style={{ color: f.notes.length > 160 ? '#ef4444' : f.notes.length > 140 ? '#f59e0b' : '#9ca3af' }}>
                  {f.notes.length}/160
                </span>
              )}
            </div>
            <textarea value={f.notes} onChange={e => sF({...f, notes: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
              style={{ borderColor: f.channel === 'sms' && f.notes.length > 160 ? '#ef4444' : '#d1d5db' }}
              rows={3} placeholder={f.channel === 'sms' ? (lang === 'en' ? 'SMS text (max 160 chars, no Polish chars)...' : 'Treść SMS (max 160 znaków, bez polskich znaków)...') : t.notesPlaceholder} />
            {f.channel === 'sms' && f.notes.length > 160 && (
              <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                {lang === 'en' ? `⚠ ${f.notes.length - 160} characters over limit — will be sent as 2 SMS` : `⚠ ${f.notes.length - 160} znaków ponad limit — zostanie wysłany jako 2 SMS`}
              </p>
            )}
          </div>
        </div>
        <div className="p-5 border-t flex justify-end gap-3" style={{ borderColor: '#e5e7eb' }}>
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100" style={{ color: '#6b7280' }}>{t.cancel}</button>
          <button onClick={save} disabled={!f.title.trim()||!f.sendDate} className="px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50" style={{ background: '#2563eb', color: 'white' }}>{t.save}</button>
        </div>
      </div>
    </div>
  );
}

// ── Send Detail Panel ────────────────────────────────

function SendDetail({ send, onUpdate, onDelete, onEdit, onClose, onSelectSend, allSends, teamMembers, t, lang }) {
  const ch = CHANNELS.find(c => c.id === send.channel);
  const tools = (send.tools||[]).map(id => TOOLS.find(t => t.id === id)).filter(Boolean);
  const mk = MARKETS.find(m => m.id === send.market);
  const st = STATUSES.find(s => s.id === send.status);
  const assigned = (send.assignees||[]).map(id => teamMembers.find(m => m.id === id)).filter(Boolean);
  const ChIcon = ch?.icon || Mail;

  // Series siblings: all sends with same title + market
  const seriesSiblings = useMemo(() => {
    const siblings = allSends
      .filter(s => s.title === send.title && s.market === send.market)
      .sort((a, b) => a.sendDate.localeCompare(b.sendDate) || (a.sendTime||'').localeCompare(b.sendTime||''));
    return siblings.length > 1 ? siblings : [];
  }, [send, allSends]);

  // Show 3 previous + current + 5 next
  const seriesView = useMemo(() => {
    if (!seriesSiblings.length) return [];
    const idx = seriesSiblings.findIndex(s => s.id === send.id);
    if (idx === -1) return seriesSiblings.slice(0, 9);
    const start = Math.max(0, idx - 3);
    const end = Math.min(seriesSiblings.length, idx + 13);
    return seriesSiblings.slice(start, end);
  }, [seriesSiblings, send.id]);

  return (
    <aside className="w-full lg:w-[520px] bg-white border-l flex flex-col overflow-hidden flex-shrink-0 fixed lg:static inset-0 z-40 lg:z-auto" style={{ borderColor: '#e5e7eb' }}>
      <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: '#e5e7eb' }}>
        <div className="flex items-center gap-2">
          <ChIcon size={18} style={{ color: ch?.color }} />
          <span className="text-sm font-medium" style={{ color: '#111827' }}>{ch?.name}</span>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: st?.bg, color: st?.color }}>{lang==='en' ? st?.nameEn : st?.name}</span>
          {(isPartOfSeries(send) || seriesSiblings.length > 0) && <Repeat size={13} style={{ color: '#7c3aed' }} />}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(send)} className="p-1.5 rounded-full hover:bg-gray-100" style={{ color: '#6b7280' }}><Edit3 size={16} /></button>
          <button onClick={() => onDelete(send)} className="p-1.5 rounded-full hover:bg-red-50" style={{ color: '#6b7280' }}><Trash2 size={16} /></button>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100" style={{ color: '#6b7280' }}><X size={16} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <h3 className="font-medium text-lg" style={{ color: '#111827' }}>{send.title}</h3>

        {/* Quick actions */}
        <div className="flex gap-2">
          {send.status === 'scheduled' && <>
            <button onClick={() => onUpdate(send.id, { status: 'sent' })} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}><CheckCircle size={14} />{t.markSent}</button>
            <button onClick={() => onUpdate(send.id, { status: 'cancelled' })} className="px-4 py-2 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}><XCircle size={14} /></button>
          </>}
          {send.status === 'todo' && <button onClick={() => onUpdate(send.id, { status: 'scheduled' })} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}><Clock size={14} />{t.markScheduled}</button>}
          {send.status === 'cancelled' && <button onClick={() => onUpdate(send.id, { status: 'scheduled' })} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}><Clock size={14} />{t.restore}</button>}
        </div>

        {/* Info */}
        <div className="space-y-3 p-3 rounded-lg" style={{ background: '#f8f9fa', border: '1px solid #e5e7eb' }}>
          <Row label={t.sendDate}><span className="text-sm font-medium" style={{ color: isToday(send.sendDate)?'#2563eb':isPast(send.sendDate)?'#9ca3af':'#111827' }}>{fmtDisp(send.sendDate,lang)} · {fmtTime(send.sendTime)}</span></Row>
          <Row label={t.market}><span className="text-sm">{mk?.icon} {lang==='en'?mk?.nameEn:mk?.name}</span></Row>
          <Row label={t.tools}>
            <div className="flex flex-wrap gap-1 justify-end">
              {tools.map(tl => <span key={tl.id} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: tl.color+'18', color: tl.color }}>{tl.name}</span>)}
              {!tools.length && <span className="text-xs" style={{ color: '#9ca3af' }}>—</span>}
            </div>
          </Row>
          {send.segment && <Row label={t.segment}><span className="text-sm">{send.segment}</span></Row>}
          {send.recurrence && <Row label={t.recurrence}><span className="flex items-center gap-1 text-sm" style={{ color: '#7c3aed' }}><Repeat size={12} />{RECURRENCE_OPTIONS.find(r=>r.id===send.recurrence)?.[lang==='en'?'nameEn':'name']}</span></Row>}
          {send.parentId && <Row label={lang==='en'?'Series':'Seria'}><span className="text-xs" style={{ color: '#7c3aed' }}><Repeat size={11} /> {lang==='en'?'Part of series':'Część serii'}</span></Row>}
        </div>

        {/* Assignees */}
        {assigned.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {assigned.map(m => (
              <div key={m.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: '#f3f4f6' }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: m.color }}>{getInitials(m.name)}</div>
                <span className="text-xs" style={{ color: '#111827' }}>{m.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        )}

        {send.subjectLine && <div><label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>{t.subjectLine}</label><div className="px-3 py-2 rounded-lg text-sm" style={{ background: '#f3f4f6' }}>{send.subjectLine}</div></div>}
        <LinksDisplay links={send.links} />
        {send.taskLink && <div><label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>{t.taskLink}</label><a href={send.taskLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-blue-50 text-sm" style={{ color: '#2563eb' }}><ExternalLink size={13} /><span className="hover:underline">{lang==='en'?'Open task':'Otwórz task'}</span></a></div>}

        {/* Linked Task */}
        {send.linkedTaskId && (
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>{t.linkedTask}</label>
            <a href={`/?task=${send.linkedTaskId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-blue-50 text-sm" style={{ color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <CheckCircle size={13} />
              <span className="hover:underline">{lang==='en'?'Open linked task':'Otwórz powiązany task'}</span>
            </a>
          </div>
        )}

        {send.notes && <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium" style={{ color: '#6b7280' }}>{t.notes}</label>
            {send.channel === 'sms' && <span className="text-xs font-medium" style={{ color: send.notes.length > 160 ? '#ef4444' : send.notes.length > 140 ? '#f59e0b' : '#9ca3af' }}>{send.notes.length}/160</span>}
          </div>
          <div className="px-3 py-2 rounded-lg text-sm whitespace-pre-wrap" style={{ background: send.channel === 'sms' && send.notes.length > 160 ? '#fef2f2' : '#f3f4f6', color: send.channel === 'sms' && send.notes.length > 160 ? '#ef4444' : '#374151' }}>{send.notes}</div>
          {send.channel === 'sms' && send.notes.length > 160 && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>⚠ {send.notes.length - 160} {lang==='en' ? 'chars over limit' : 'znaków ponad limit'}</p>}
        </div>}

        {/* Series Timeline */}
        {seriesView.length > 0 && (
          <SeriesTimeline
            items={seriesView}
            currentId={send.id}
            totalCount={seriesSiblings.length}
            onSelect={onSelectSend}
            onUpdate={onUpdate}
            t={t}
            lang={lang}
          />
        )}
      </div>
    </aside>
  );
}

function Row({ label, children }) {
  return <div className="flex items-center justify-between"><span className="text-xs font-medium" style={{ color: '#6b7280' }}>{label}</span>{children}</div>;
}

function SeriesTimeline({ items, currentId, totalCount, onSelect, onUpdate, t, lang }) {
  const [editingId, setEditingId] = useState(null);
  const [editSubject, setEditSubject] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditSubject(item.subjectLine || '');
    setEditNotes(item.notes || '');
  };

  const saveEdit = () => {
    if (editingId) {
      onUpdate(editingId, { subjectLine: editSubject, notes: editNotes });
      setEditingId(null);
    }
  };

  const cancelEdit = () => { setEditingId(null); };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Repeat size={14} style={{ color: '#7c3aed' }} />
          <label className="text-xs font-semibold" style={{ color: '#7c3aed' }}>{lang==='en' ? 'Series' : 'Seria'} ({totalCount})</label>
        </div>
      </div>
      <div className="space-y-1">
        {items.map(item => {
          const isCurrent = item.id === currentId;
          const past = isPast(item.sendDate) && !isToday(item.sendDate);
          const isSent = item.status === 'sent';
          const isEditing = editingId === item.id;

          return (
            <div key={item.id}
              className="rounded-lg border transition-all"
              style={{
                borderColor: isCurrent ? '#7c3aed' : '#e5e7eb',
                background: isCurrent ? '#f5f3ff' : past ? '#fafafa' : 'white',
                borderWidth: isCurrent ? '1.5px' : '0.5px',
              }}>
              {/* Header row — clickable */}
              <div className="flex items-center gap-2 px-3 py-2 cursor-pointer" onClick={() => !isEditing && onSelect(item)}>
                <div className="flex-shrink-0">
                  {isSent ? <CheckCircle size={14} style={{ color: '#16a34a' }} /> :
                   isCurrent ? <div className="w-3 h-3 rounded-full" style={{ background: '#7c3aed' }} /> :
                   <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: past ? '#d1d5db' : '#7c3aed' }} />}
                </div>
                <span className="text-xs font-medium flex-1" style={{ color: past && !isCurrent ? '#9ca3af' : '#111827' }}>
                  {fmtDisp(item.sendDate, lang)}
                </span>
                {isCurrent && <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: '#7c3aed', color: 'white' }}>
                  {lang==='en' ? 'current' : 'teraz'}
                </span>}
                {!isEditing && (
                  <button onClick={e => { e.stopPropagation(); startEdit(item); }}
                    className="p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100"
                    style={{ color: '#6b7280', opacity: isCurrent ? 1 : undefined }}>
                    <Edit3 size={12} />
                  </button>
                )}
              </div>

              {/* Content — subject + notes preview OR edit mode */}
              {isEditing ? (
                <div className="px-3 pb-3 space-y-2" onClick={e => e.stopPropagation()}>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>{t.subjectLine}</label>
                    <input type="text" value={editSubject} onChange={e => setEditSubject(e.target.value)}
                      className="w-full px-2.5 py-1.5 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }}
                      placeholder={t.subjectPlaceholder} autoFocus />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>{lang==='en' ? 'Idea / outline' : 'Zarys / pomysł'}</label>
                    <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 border rounded-lg text-sm resize-none" style={{ borderColor: '#d1d5db' }}
                      rows={2} placeholder={lang==='en' ? 'Brief idea for this send...' : 'Krótki zarys tej wysyłki...'} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex-1 py-1.5 rounded-lg text-xs font-medium" style={{ background: '#2563eb', color: 'white' }}>{t.save}</button>
                    <button onClick={cancelEdit} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: '#6b7280' }}>{t.cancel}</button>
                  </div>
                </div>
              ) : (item.subjectLine || item.notes) ? (
                <div className="px-3 pb-2 pl-8">
                  {item.subjectLine && <p className="text-xs font-medium truncate" style={{ color: past && !isCurrent ? '#bdc1c6' : '#374151' }}>✉ {item.subjectLine}</p>}
                  {item.notes && <p className="text-xs truncate mt-0.5" style={{ color: '#9ca3af' }}>{item.notes}</p>}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Calendar View ────────────────────────────────────

function CalendarView({ sends, year, month, onSelectDay, onAddSend, onSelectSend, selectedDate, lang }) {
  const days = getMonthDays(year, month);
  const dayNames = lang==='en' ? DAYS_EN : DAYS_PL;
  const todayStr = fmt(new Date());
  const byDate = useMemo(() => { const m = {}; sends.forEach(s => { (m[s.sendDate]||(m[s.sendDate]=[])).push(s); }); return m; }, [sends]);

  return (
    <div className="bg-white rounded-xl border" style={{ borderColor: '#e5e7eb' }}>
      <div className="grid grid-cols-7 border-b" style={{ borderColor: '#e5e7eb' }}>
        {dayNames.map(d => <div key={d} className="text-center py-2.5 text-xs font-medium" style={{ color: '#6b7280' }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const ds = fmt(day.date); const ss = byDate[ds]||[]; const it = ds===todayStr; const iSel = ds===selectedDate;
          return (
            <div key={i} onClick={() => onSelectDay(ds)} className="group min-h-[90px] p-1 border-b border-r cursor-pointer transition-colors hover:bg-blue-50/30"
              style={{ borderColor: '#f3f4f6', background: iSel?'#eff6ff':it?'#fefce8':!day.cur?'#fafafa':'white' }}>
              <div className="flex items-center justify-between px-1 mb-0.5">
                <span className={`text-xs font-medium ${it?'w-5 h-5 rounded-full flex items-center justify-center':''}`}
                  style={{ color: !day.cur?'#d1d5db':it?'white':'#111827', background: it?'#2563eb':'transparent' }}>
                  {day.date.getDate()}
                </span>
                <button onClick={e => {e.stopPropagation();onAddSend(ds);}} className="w-4 h-4 rounded-full items-center justify-center hidden group-hover:flex" style={{ background: 'transparent', border: '1.5px solid #d1d5db', color: '#9ca3af', fontSize: '12px', lineHeight: '12px' }}>+</button>
              </div>
              <div className="space-y-0.5">
                {ss.slice(0,3).map(s => {
                  const c = CHANNELS.find(ch => ch.id === s.channel);
                  const st = STATUSES.find(x => x.id === s.status);
                  return (
                    <div key={s.id} onClick={e => {e.stopPropagation();onSelectSend(s);}}
                      className="flex items-center gap-1 px-1 py-0.5 rounded text-xs truncate cursor-pointer hover:bg-blue-50"
                      style={{ color: s.status==='cancelled'?'#9ca3af':st?.color }}>
                      <span style={{ fontSize: '10px', textDecoration: s.status==='cancelled'?'line-through':'none' }}>
                        {MARKETS.find(m=>m.id===s.market)?.icon} {s.title}
                      </span>
                    </div>
                  );
                })}
                {ss.length > 3 && <span style={{ fontSize: '10px', color: '#6b7280' }}>+{ss.length-3}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── List View ────────────────────────────────────────

function ListView({ sends, onSelectSend, selectedId, teamMembers, t, lang }) {
  const grouped = useMemo(() => {
    const m = {}; sends.forEach(s => { (m[s.sendDate]||(m[s.sendDate]=[])).push(s); }); return Object.entries(m).sort(([a],[b]) => a.localeCompare(b));
  }, [sends]);
  if (!sends.length) return <div className="text-center py-16"><Calendar size={48} className="mx-auto mb-4" style={{ color: '#d1d5db' }} /><p style={{ color: '#6b7280' }}>{t.noSends}</p></div>;

  return (
    <div className="space-y-4">
      {grouped.map(([date, ss]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: isToday(date)?'#2563eb':'#f3f4f6', color: isToday(date)?'white':isPast(date)?'#9ca3af':'#111827' }}>{fmtDisp(date,lang)}</span>
            {isToday(date) && <span className="text-xs font-medium" style={{ color: '#2563eb' }}>{t.today}</span>}
          </div>
          <div className="space-y-1">
            {ss.map(s => {
              const ch = CHANNELS.find(c => c.id === s.channel); const st = STATUSES.find(x => x.id === s.status);
              const StI = st?.icon||Circle; const ChI = ch?.icon||Mail; const mk = MARKETS.find(m => m.id === s.market);
              const tools = (s.tools||[]).map(id => TOOLS.find(t=>t.id===id)).filter(Boolean);
              const assigned = (s.assignees||[]).map(id => teamMembers.find(m=>m.id===id)).filter(Boolean);
              return (
                <div key={s.id} onClick={() => onSelectSend(s)} className="bg-white rounded-lg px-3 py-2.5 cursor-pointer border flex items-center gap-3"
                  style={{ borderWidth: '0.5px', borderColor: selectedId===s.id?'#3b82f6':'#e5e7eb', opacity: s.status==='cancelled'?0.5:1, boxShadow: selectedId===s.id?'0 0 0 1px rgba(59,130,246,0.15)':'none' }}>
                  <StI size={16} style={{ color: st?.color }} className={s.status==='sent'?'fill-current':''} />
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: ch?.bg }}><ChI size={13} style={{ color: ch?.color }} /></div>
                  <span className="text-sm">{mk?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate" style={{ color: s.status==='cancelled'?'#9ca3af':'#111827', textDecoration: s.status==='cancelled'?'line-through':'none' }}>{s.title}</h4>
                    {s.subjectLine && <p className="text-xs truncate" style={{ color: '#9ca3af' }}>✉ {s.subjectLine}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    {tools.slice(0,2).map(tl => <span key={tl.id} className="text-xs px-1.5 py-0.5 rounded-full font-medium hidden sm:inline" style={{ background: tl.color+'18', color: tl.color }}>{tl.name}</span>)}
                  </div>
                  <div className="flex -space-x-1">
                    {assigned.slice(0,2).map(m => <div key={m.id} className="w-5 h-5 rounded-full flex items-center justify-center text-white border border-white" style={{ background: m.color, fontSize: '8px', fontWeight: 600 }}>{getInitials(m.name)}</div>)}
                  </div>
                  <span className="text-xs whitespace-nowrap" style={{ color: '#9ca3af' }}>{fmtTime(s.sendTime)}</span>
                  {isPartOfSeries(s) && <Repeat size={12} style={{ color: '#7c3aed' }} />}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Login Screen ─────────────────────────────────────

function LoginScreen({ onLogin, teamMembers }) {
  const [su, setSu] = useState(''); const [pin, setPin] = useState(''); const [err, setErr] = useState(''); const [ld, setLd] = useState(false);
  const am = teamMembers.filter(m => m.isActive !== false);
  const hl = async (e) => {
    e.preventDefault(); if (!su) { setErr('Select person'); return; }
    setLd(true);
    try {
      const r = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: su, pin }) });
      const d = await r.json();
      if (d.success) { localStorage.setItem('av_tasks_user', su); onLogin(su); } else setErr(d.error || 'Incorrect PIN');
    } catch { setErr('Connection error'); }
    setLd(false);
  };
  return <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f8f9fa' }}><div className="bg-white rounded-xl p-8 w-full max-w-sm" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><div className="text-center mb-6"><h1 className="text-xl font-semibold" style={{ color: '#111827' }}>Send Planner</h1><p className="text-sm mt-1" style={{ color: '#6b7280' }}>Email · SMS · WhatsApp · Infomeetings</p></div><form onSubmit={hl} className="space-y-4">{err&&<div className="p-3 rounded-lg text-sm text-center" style={{ background: '#fef2f2', color: '#dc2626' }}>{err}</div>}<div><label className="block text-sm font-medium mb-1.5" style={{ color: '#111827' }}>Person</label><select value={su} onChange={e=>{setSu(e.target.value);setErr('');}} className="w-full px-4 py-3 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }}><option value="">Select...</option>{am.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div><div><label className="block text-sm font-medium mb-1.5" style={{ color: '#111827' }}>PIN</label><input type="password" value={pin} onChange={e=>{setPin(e.target.value.replace(/\D/g,'').slice(0,4));setErr('');}} className="w-full px-4 py-3 border rounded-lg text-sm text-center tracking-widest" style={{ borderColor: '#d1d5db' }} placeholder="••••" maxLength={4} inputMode="numeric" /></div><button type="submit" disabled={ld} className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-70" style={{ background: '#2563eb', color: 'white' }}>{ld?<Loader2 size={18} className="animate-spin" />:<Lock size={18} />}{ld?'...':'Log in'}</button></form></div></div>;
}


// ── Export Modal ─────────────────────────────────────

function ExportModal({ sends, onClose, t, lang }) {
  const [selMarkets, setSelMarkets] = useState(MARKETS.map(m => m.id));
  const [selStatuses, setSelStatuses] = useState(['todo', 'scheduled']);
  const [selChannels, setSelChannels] = useState(CHANNELS.map(c => c.id));
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const toggleArr = (arr, setArr, val) => {
    setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };
  const toggleAll = (arr, setArr, allVals) => {
    setArr(arr.length === allVals.length ? [] : allVals);
  };

  const filtered = useMemo(() => {
    return sends.filter(s => {
      if (!selMarkets.includes(s.market)) return false;
      if (!selStatuses.includes(s.status)) return false;
      if (!selChannels.includes(s.channel)) return false;
      if (dateFrom && s.sendDate < dateFrom) return false;
      if (dateTo && s.sendDate > dateTo) return false;
      return true;
    }).sort((a, b) => a.sendDate.localeCompare(b.sendDate));
  }, [sends, selMarkets, selStatuses, selChannels, dateFrom, dateTo]);

  const downloadCSV = () => {
    const headers = ['Date', 'Time', 'Title', 'Market', 'Channel', 'Tools', 'Status', 'Segment', 'Subject Line', 'Notes/Idea'];
    const rows = filtered.map(s => {
      const mk = MARKETS.find(m => m.id === s.market);
      const tools = (s.tools || []).map(id => TOOLS.find(t => t.id === id)?.name || id).join(', ');
      const st = STATUSES.find(x => x.id === s.status);
      return [
        s.sendDate,
        (s.sendTime || '').substring(0, 5),
        s.title,
        mk ? (lang === 'en' ? mk.nameEn : mk.name) : '',
        s.channel,
        tools,
        st ? (lang === 'en' ? st.nameEn : st.name) : '',
        s.segment || '',
        s.subjectLine || '',
        s.notes || '',
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `send-planner-export-${fmt(new Date())}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ boxShadow: '0 24px 38px 3px rgba(0,0,0,.14)' }} onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#e5e7eb' }}>
          <h3 className="text-lg font-medium" style={{ color: '#111827' }}>{t.exportTitle}</h3>
          <button onClick={onClose} style={{ color: '#6b7280' }}><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Markets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: '#111827' }}>{t.exportMarkets}</label>
              <button onClick={() => toggleAll(selMarkets, setSelMarkets, MARKETS.map(m => m.id))} className="text-xs" style={{ color: '#2563eb' }}>{t.exportAll}</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {MARKETS.map(m => {
                const on = selMarkets.includes(m.id);
                return <button key={m.id} type="button" onClick={() => toggleArr(selMarkets, setSelMarkets, m.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border"
                  style={{ borderColor: on ? '#2563eb' : '#d1d5db', background: on ? '#eff6ff' : 'white', color: on ? '#2563eb' : '#6b7280' }}>
                  {m.icon} {lang === 'en' ? m.nameEn : m.name} {on && <Check size={12} />}
                </button>;
              })}
            </div>
          </div>

          {/* Statuses */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: '#111827' }}>{t.exportStatuses}</label>
              <button onClick={() => toggleAll(selStatuses, setSelStatuses, STATUSES.map(s => s.id))} className="text-xs" style={{ color: '#2563eb' }}>{t.exportAll}</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map(st => {
                const on = selStatuses.includes(st.id);
                return <button key={st.id} type="button" onClick={() => toggleArr(selStatuses, setSelStatuses, st.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border"
                  style={{ borderColor: on ? st.color : '#d1d5db', background: on ? st.bg : 'white', color: on ? st.color : '#6b7280' }}>
                  {lang === 'en' ? st.nameEn : st.name} {on && <Check size={12} />}
                </button>;
              })}
            </div>
          </div>

          {/* Channels */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: '#111827' }}>{t.exportChannels}</label>
              <button onClick={() => toggleAll(selChannels, setSelChannels, CHANNELS.map(c => c.id))} className="text-xs" style={{ color: '#2563eb' }}>{t.exportAll}</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CHANNELS.map(ch => {
                const on = selChannels.includes(ch.id);
                return <button key={ch.id} type="button" onClick={() => toggleArr(selChannels, setSelChannels, ch.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border"
                  style={{ borderColor: on ? ch.color : '#d1d5db', background: on ? ch.bg : 'white', color: on ? ch.color : '#6b7280' }}>
                  {ch.name} {on && <Check size={12} />}
                </button>;
              })}
            </div>
          </div>

          {/* Date range */}
          <div>
            <label className="text-sm font-medium block mb-2" style={{ color: '#111827' }}>{t.exportRange}</label>
            <div className="flex items-center gap-2">
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} />
              <span className="text-xs" style={{ color: '#9ca3af' }}>–</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} />
            </div>
          </div>

          {/* Preview count */}
          <div className="px-4 py-3 rounded-lg text-center" style={{ background: '#f8f9fa', border: '1px solid #e5e7eb' }}>
            <span className="text-2xl font-bold" style={{ color: '#2563eb' }}>{filtered.length}</span>
            <span className="text-sm ml-2" style={{ color: '#6b7280' }}>{lang === 'en' ? 'sends to export' : 'wysyłek do eksportu'}</span>
          </div>
        </div>

        <div className="p-5 border-t flex justify-end gap-3" style={{ borderColor: '#e5e7eb' }}>
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100" style={{ color: '#6b7280' }}>{t.cancel}</button>
          <button onClick={downloadCSV} disabled={filtered.length === 0} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50" style={{ background: '#2563eb', color: 'white' }}>
            <Download size={16} /> {t.exportDownload}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────

export default function PlannerPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [sends, setSends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [view, setView] = useState('calendar');
  const [showForm, setShowForm] = useState(false);
  const [editSend, setEditSend] = useState(null);
  const [selectedSend, setSelectedSend] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [seriesModal, setSeriesModal] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [filterMarket, setFilterMarket] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { (async () => { setLoadingTeam(true); const m = await getTeamMembers(); if (m.length > 0) setTeamMembers(m); setLoadingTeam(false); })(); }, []);
  const cm = teamMembers.find(m => m.id === currentUser);
  const lang = cm?.language || 'pl';
  const t = T[lang];

  useEffect(() => { const su = localStorage.getItem('av_tasks_user'); if (su) { (async () => { const m = await getTeamMembers(); if (m.find(x => x.id === su)) { setCurrentUser(su); setTeamMembers(m); } setCheckingAuth(false); })(); } else setCheckingAuth(false); }, []);

  const loadSends = useCallback(async () => { const d = await getScheduledSends(); setSends(d); setLoading(false); }, []);
  useEffect(() => { if (currentUser) loadSends(); }, [currentUser, loadSends]);
  useEffect(() => { if (!currentUser) return; const iv = setInterval(loadSends, 30000); return () => clearInterval(iv); }, [currentUser, loadSends]);

  const handleLogout = () => { localStorage.removeItem('av_tasks_user'); setCurrentUser(null); setSends([]); };

  const seeOnlyAssigned = cm?.seeOnlyAssigned || false;
  const restrictedMarket = cm?.restrictedToMarket || null;

  const filteredSends = useMemo(() => {
    return sends.filter(s => {
      if (restrictedMarket && s.market !== restrictedMarket) return false;
      if (seeOnlyAssigned && !(s.assignees || []).includes(currentUser)) return false;
      if (filterMarket !== 'all' && s.market !== filterMarket) return false;
      if (filterChannel !== 'all' && s.channel !== filterChannel) return false;
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      return true;
    });
  }, [sends, filterMarket, filterChannel, filterStatus, restrictedMarket, seeOnlyAssigned, currentUser]);

  const calendarSends = useMemo(() => {
    const s = new Date(calYear, calMonth - 1, 20); const e = new Date(calYear, calMonth + 1, 10);
    const ss = fmt(s); const ee = fmt(e);
    return filteredSends.filter(s => s.sendDate >= ss && s.sendDate <= ee);
  }, [filteredSends, calYear, calMonth]);

  // ── Handlers ──

  const handleSaveSend = async (data) => {
    if (editSend?.id) {
      if (editSend._editAll) {
        await updateSeries(getSeriesRoot(editSend), data);
        await loadSends();
        setSelectedSend(null);
      } else {
        const up = await updateScheduledSend(editSend.id, data);
        if (up) {
          // 2-way link: if task was just created during edit, update it with send id
          if (up.linkedTaskId && !editSend.linkedTaskId) {
            try {
              await updateTaskDb(up.linkedTaskId, { linkedSendId: up.id });
            } catch (e) { console.error('Failed to update task with send link:', e); }
          }
          setSends(p => p.map(s => s.id === up.id ? up : s)); setSelectedSend(p => p?.id === up.id ? up : p);
        }
      }
    } else {
      const cr = await createScheduledSend(data);
      if (cr) {
        // 2-way link: update task with linked_send_id
        if (cr.linkedTaskId) {
          try {
            await updateTaskDb(cr.linkedTaskId, { linkedSendId: cr.id });
          } catch (e) { console.error('Failed to update task with send link:', e); }
        }
        setSends(p => [...p, cr]);
        if (cr.recurrence) {
          const occ = await generateRecurrences(cr);
          if (occ.length) setSends(p => [...p, ...occ]);
        }
      }
    }
    setShowForm(false); setEditSend(null);
  };

  const handleUpdateSend = async (id, updates) => {
    const up = await updateScheduledSend(id, updates);
    if (up) { setSends(p => p.map(s => s.id === up.id ? up : s)); setSelectedSend(p => p?.id === up.id ? up : p); }
  };

  const handleEditSend = (send) => {
    if (isPartOfSeries(send)) {
      setSeriesModal({ type: 'edit', send });
    } else {
      setEditSend(send); setShowForm(true);
    }
  };

  const handleDeleteSend = (send) => {
    if (isPartOfSeries(send)) {
      setSeriesModal({ type: 'delete', send });
    } else {
      if (!confirm(t.deleteSend)) return;
      deleteScheduledSend(send.id).then(() => {
        setSends(p => p.filter(s => s.id !== send.id));
        if (selectedSend?.id === send.id) setSelectedSend(null);
      });
    }
  };

  const handleSeriesChoice = async (choice) => {
    const { type, send } = seriesModal;
    const pid = getSeriesRoot(send);

    if (type === 'edit') {
      if (choice === 'this') {
        setEditSend({ ...send, _editAll: false });
      } else {
        setEditSend({ ...send, _editAll: true });
      }
      setShowForm(true);
    } else if (type === 'delete') {
      if (choice === 'this') {
        await deleteScheduledSend(send.id);
        setSends(p => p.filter(s => s.id !== send.id));
        if (selectedSend?.id === send.id) setSelectedSend(null);
      } else {
        await deleteSeries(pid);
        setSends(p => p.filter(s => s.id !== pid && s.parentId !== pid));
        setSelectedSend(null);
      }
    }
    setSeriesModal(null);
  };

  const prevMonth = () => { if (calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1); };
  const nextMonth = () => { if (calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1); };
  const goToday = () => { setCalYear(now.getFullYear()); setCalMonth(now.getMonth()); };
  const months = lang==='en' ? MONTHS_EN : MONTHS_PL;

  if (checkingAuth || loadingTeam) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fa' }}><Loader2 size={32} className="animate-spin" style={{ color: '#2563eb' }} /></div>;
  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} teamMembers={teamMembers} />;
  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fa', color: '#6b7280' }}>{t.loading}</div>;

  const marketCounts = {};
  MARKETS.forEach(m => { marketCounts[m.id] = sends.filter(s => s.market === m.id).length; });
  const channelCounts = {};
  CHANNELS.forEach(c => { channelCounts[c.id] = sends.filter(s => s.channel === c.id).length; });
  const statusCounts = {};
  STATUSES.forEach(s => { statusCounts[s.id] = sends.filter(x => x.status === s.id).length; });

  return (
    <div className="min-h-screen flex" style={{ background: '#f9fafb' }}>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`w-52 flex flex-col min-h-screen flex-shrink-0 bg-white fixed lg:static z-30 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ borderRight: '0.5px solid #e5e7eb' }}>
        <div className="p-3 border-b" style={{ borderColor: '#e5e7eb' }}>
          <h1 className="text-sm font-semibold" style={{ color: '#111827' }}>📬 {t.planner}</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
          {/* Markets */}
          <div>
            <p className="text-xs font-medium px-2 mb-1" style={{ color: '#9ca3af' }}>{t.market}</p>
            <SideBtn active={filterMarket==='all'} color="#2563eb" bg="#eff6ff" onClick={() => setFilterMarket('all')} label={t.allMarkets} count={sends.length} />
            {MARKETS.map(m => <SideBtn key={m.id} active={filterMarket===m.id} color="#2563eb" bg="#eff6ff" onClick={() => setFilterMarket(m.id)} label={`${m.icon} ${lang==='en'?m.nameEn:m.name}`} count={marketCounts[m.id]||0} dot />)}
          </div>

          {/* Channels */}
          <div>
            <p className="text-xs font-medium px-2 mb-1" style={{ color: '#9ca3af' }}>{t.channel}</p>
            <SideBtn active={filterChannel==='all'} color="#2563eb" bg="#eff6ff" onClick={() => setFilterChannel('all')} label={lang==='en'?'All channels':'Wszystkie'} count={sends.length} />
            {CHANNELS.map(c => <SideBtn key={c.id} active={filterChannel===c.id} color={c.color} bg={c.bg} onClick={() => setFilterChannel(c.id)} label={c.name} count={channelCounts[c.id]||0} dot />)}
          </div>

          {/* Statuses */}
          <div>
            <p className="text-xs font-medium px-2 mb-1" style={{ color: '#9ca3af' }}>{t.status}</p>
            <SideBtn active={filterStatus==='all'} color="#2563eb" bg="#eff6ff" onClick={() => setFilterStatus('all')} label={lang==='en'?'All':'Wszystkie'} count={sends.length} />
            {STATUSES.map(s => <SideBtn key={s.id} active={filterStatus===s.id} color={s.color} bg={s.bg} onClick={() => setFilterStatus(s.id)} label={lang==='en'?s.nameEn:s.name} count={statusCounts[s.id]||0} dot />)}
          </div>
        </div>

        <div className="px-3 py-2" style={{ borderTop: '0.5px solid #e5e7eb' }}>
          <div className="space-y-1">
            <a href="/planner/generator" className="text-xs px-2.5 py-1.5 rounded-md hover:bg-gray-100 flex items-center gap-1.5" style={{ color: '#6b7280' }}>✉ {lang==='en'?'Mail Generator':'Generator maili'}<ExternalLink size={9} style={{ color: '#9ca3af' }} /></a>
            <a href="/" className="text-xs px-2.5 py-1.5 rounded-md hover:bg-gray-100 block" style={{ color: '#2563eb' }}>{t.backToTasks}</a>
          </div>
        </div>

        <div className="px-3 py-2.5" style={{ borderTop: '0.5px solid #e5e7eb' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ background: cm?.color, fontSize: '9px', fontWeight: 600 }}>{getInitials(cm?.name||'')}</div>
            <span className="text-xs font-medium truncate" style={{ color: '#374151' }}>{cm?.name?.split(' ')[0]}</span>
            <button onClick={handleLogout} className="p-1 rounded-full hover:bg-gray-100 ml-auto" style={{ color: '#9ca3af' }}><LogOut size={15} /></button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white px-4 lg:px-6 py-2.5 flex items-center justify-between gap-2" style={{ borderBottom: '0.5px solid #e5e7eb' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-full hover:bg-gray-100 lg:hidden" style={{ color: '#9ca3af' }}><Menu size={20} /></button>
            {view==='calendar' && (
              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="p-1.5 rounded-full hover:bg-gray-100" style={{ color: '#6b7280' }}><ChevronLeft size={18} /></button>
                <h2 className="text-sm lg:text-base font-semibold min-w-[160px] text-center" style={{ color: '#111827' }}>{months[calMonth]} {calYear}</h2>
                <button onClick={nextMonth} className="p-1.5 rounded-full hover:bg-gray-100" style={{ color: '#6b7280' }}><ChevronRight size={18} /></button>
                <button onClick={goToday} className="text-xs px-2.5 py-1 rounded-md border" style={{ borderColor: '#d1d5db', color: '#6b7280' }}>{t.today}</button>
              </div>
            )}
            {view==='list' && <h2 className="text-sm lg:text-base font-semibold" style={{ color: '#111827' }}>{t.planner}</h2>}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex rounded-lg overflow-hidden border" style={{ borderColor: '#d1d5db' }}>
              <button onClick={() => setView('calendar')} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium" style={{ background: view==='calendar'?'#2563eb':'white', color: view==='calendar'?'white':'#6b7280' }}><Calendar size={14} /><span className="hidden sm:inline">{t.calendar}</span></button>
              <button onClick={() => setView('list')} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium" style={{ background: view==='list'?'#2563eb':'white', color: view==='list'?'white':'#6b7280', borderLeft: '1px solid #d1d5db' }}><List size={14} /><span className="hidden sm:inline">{t.list}</span></button>
            </div>
            <button onClick={loadSends} className="p-2 rounded-full hover:bg-gray-100" style={{ color: '#6b7280' }}><Loader2 size={18} /></button>
            <button onClick={() => setShowExport(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-gray-50" style={{ borderColor: '#d1d5db', color: '#6b7280' }}><Download size={14} /><span className="hidden sm:inline">{t.exportBtn}</span></button>
            <button onClick={() => {setEditSend(null);setShowForm(true);}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs" style={{ background: '#2563eb', color: 'white' }}><Plus size={15} /><span className="hidden sm:inline">{t.newSend}</span></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 lg:p-4">
          {/* Mobile: always list */}
          <div className="lg:hidden">
            <div className="max-w-4xl mx-auto"><ListView sends={filteredSends} onSelectSend={setSelectedSend} selectedId={selectedSend?.id} teamMembers={teamMembers} t={t} lang={lang} /></div>
          </div>
          {/* Desktop: calendar/list toggle */}
          <div className="hidden lg:block">
            {view==='calendar'
              ? <CalendarView sends={calendarSends} year={calYear} month={calMonth} onSelectDay={d => {setSelectedDate(d);setSelectedSend(null);}} onAddSend={d => {setEditSend({ _prefillDate: d });setShowForm(true);}} onSelectSend={setSelectedSend} selectedDate={selectedDate} lang={lang} />
              : <div className="max-w-4xl mx-auto"><ListView sends={filteredSends} onSelectSend={setSelectedSend} selectedId={selectedSend?.id} teamMembers={teamMembers} t={t} lang={lang} /></div>
            }
          </div>
        </div>
      </main>

      {selectedSend && <SendDetail send={selectedSend} onUpdate={handleUpdateSend} onDelete={handleDeleteSend} onEdit={handleEditSend} onClose={() => setSelectedSend(null)} onSelectSend={setSelectedSend} allSends={sends} teamMembers={teamMembers} t={t} lang={lang} />}
      {showForm && <SendFormModal send={editSend} onSave={handleSaveSend} onClose={() => {setShowForm(false);setEditSend(null);}} currentUser={currentUser} teamMembers={teamMembers} t={t} lang={lang} />}
      {seriesModal && <SeriesChoiceModal type={seriesModal.type} onChoice={handleSeriesChoice} onClose={() => setSeriesModal(null)} t={t} />}
      {showExport && <ExportModal sends={sends} onClose={() => setShowExport(false)} t={t} lang={lang} />}
    </div>
  );
}

function SideBtn({ active, color, bg, onClick, label, count, icon, dot }) {
  return <button onClick={onClick} className="w-full flex items-center justify-between px-2.5 py-1 rounded-md text-xs" style={{ background: active?bg:'transparent', color: active?color:'#374151', fontWeight: active?500:400 }}>
    <div className={`flex items-center gap-1.5 ${dot?'pl-1.5':''}`}>
      {dot ? <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, opacity: active?1:0.5 }} /> : icon}
      <span>{label}</span>
    </div>
    <span style={{ color: active?color:'#9ca3af', fontSize: '11px' }}>{count}</span>
  </button>;
}
