'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus, X, Check, Edit3, Trash2, ChevronLeft, ChevronRight,
  Calendar, List, ExternalLink, Loader2, LogOut, Lock, Menu,
  CheckCircle, Circle, Clock, Users, UserPlus, Instagram,
  FileText, Send, Eye, Heart, MessageSquare, Film, Image,
  Link2, Flag, Filter, ArrowUpDown, ArrowDown, ArrowUp,
  Copy, DollarSign, Sparkles, TrendingUp, AlertCircle,
  Globe, Star, Megaphone, ChevronDown
} from 'lucide-react';
import { getTeamMembers } from '../../lib/supabase';
import { getCollabs, createCollab, updateCollab, deleteCollab } from '../../lib/supabase-collabs';

// ── Constants ────────────────────────────────────────

const MARKETS = [
  { id: 'pl', name: 'Polska', nameEn: 'Poland', icon: '🇵🇱' },
  { id: 'ns', name: 'Native Speakers', nameEn: 'Native Speakers', icon: '🇬🇧' },
  { id: 'it', name: 'Włochy', nameEn: 'Italy', icon: '🇮🇹' },
  { id: 'exchange', name: 'Wymiana', nameEn: 'Exchange', icon: '🎓' },
  { id: 'tefl', name: 'TEFL in Asia', nameEn: 'TEFL in Asia', icon: '🌏' },
  { id: 'brazil', name: 'Brazylia', nameEn: 'Brazil', icon: '🇧🇷' },
];

const STATUSES = [
  { id: 'contacted', name: 'Skontaktowani', nameEn: 'Contacted', color: '#9ca3af', bg: '#f3f4f6', icon: Send },
  { id: 'negotiating', name: 'W negocjacjach', nameEn: 'Negotiating', color: '#f59e0b', bg: '#fefce8', icon: MessageSquare },
  { id: 'agreed', name: 'Dogadani', nameEn: 'Agreed', color: '#2563eb', bg: '#eff6ff', icon: Check },
  { id: 'contract_sent', name: 'Umowa wysłana', nameEn: 'Contract sent', color: '#7c3aed', bg: '#f5f3ff', icon: FileText },
  { id: 'contract_signed', name: 'Umowa podpisana', nameEn: 'Contract signed', color: '#0891b2', bg: '#ecfeff', icon: CheckCircle },
  { id: 'content_ready', name: 'Content gotowy', nameEn: 'Content ready', color: '#ea580c', bg: '#fff7ed', icon: Film },
  { id: 'published', name: 'Opublikowane', nameEn: 'Published', color: '#16a34a', bg: '#f0fdf4', icon: Eye },
  { id: 'settled', name: 'Rozliczone', nameEn: 'Settled', color: '#059669', bg: '#ecfdf5', icon: DollarSign },
  { id: 'rejected', name: 'Odmowa', nameEn: 'Rejected', color: '#ef4444', bg: '#fef2f2', icon: X },
];

const COLLAB_TYPES = [
  { id: 'barter', name: 'Barter', color: '#16a34a', bg: '#f0fdf4' },
  { id: 'paid', name: 'Płatna', nameEn: 'Paid', color: '#2563eb', bg: '#eff6ff' },
  { id: 'commission', name: 'Prowizja', nameEn: 'Commission', color: '#7c3aed', bg: '#f5f3ff' },
  { id: 'barter_paid', name: 'Barter + płatna', nameEn: 'Barter + paid', color: '#ea580c', bg: '#fff7ed' },
];

const PRODUCTS = [
  { id: 'junior', name: 'Junior' },
  { id: 'kids', name: 'Kids' },
  { id: 'adult', name: 'Adult' },
  { id: 'family', name: 'Family' },
  { id: 'malta', name: 'Malta' },
  { id: 'england', name: 'Anglia' },
  { id: 'ski', name: 'SKI' },
  { id: 'ferie', name: 'Ferie' },
  { id: 'other', name: 'Inne' },
];

const DELIVERABLE_TYPES = [
  { id: 'reel', name: 'Rolka', icon: Film },
  { id: 'stories', name: 'Stories', icon: Image },
  { id: 'post', name: 'Post', icon: Heart },
  { id: 'tiktok', name: 'TikTok', icon: Film },
  { id: 'youtube', name: 'YouTube', icon: Film },
  { id: 'vlog', name: 'Vlog', icon: Film },
];

const CONTRACT_STATUSES = [
  { id: null, name: 'Brak', color: '#9ca3af' },
  { id: 'draft', name: 'W przygotowaniu', nameEn: 'Draft', color: '#f59e0b' },
  { id: 'sent', name: 'Wysłana', nameEn: 'Sent', color: '#7c3aed' },
  { id: 'signed', name: 'Podpisana', nameEn: 'Signed', color: '#16a34a' },
];

const T = {
  pl: {
    collabs: 'Współprace', newCollab: 'Nowa współpraca', influencer: 'Influencer', handle: 'Handle IG',
    link: 'Link Instagram', followers: 'Obserwujący', engagement: 'Zaangażowanie', avgViews: 'Śr. wyświetlenia',
    market: 'Rynek', allMarkets: 'Wszystkie', collabType: 'Typ współpracy', amount: 'Kwota',
    code: 'Kod rabatowy', landingPage: 'Landing page', status: 'Status', product: 'Produkt',
    campDates: 'Termin obozu', contactDate: 'Data kontaktu', agreedDate: 'Data ustaleń',
    publishDeadline: 'Deadline publikacji', publishedDate: 'Data publikacji', contract: 'Umowa',
    contractStatus: 'Status umowy', adLicense: 'Licencja na reklamy', adDays: 'Dni licencji',
    adPlatforms: 'Platformy', assignees: 'Przypisani', notes: 'Notatki', rejectionReason: 'Powód odmowy',
    save: 'Zapisz', cancel: 'Anuluj', delete: 'Usuń', edit: 'Edytuj', add: 'Dodaj',
    deliverables: 'Świadczenia', type: 'Typ', count: 'Ilość', withAdLicense: 'Z licencją na reklamy',
    noCollabs: 'Brak współprac', deleteConfirm: 'Usunąć współpracę?', loading: 'Ładowanie...',
    backToTasks: '← Taskery', all: 'Wszystkie', pipeline: 'Pipeline', calendar: 'Kalendarz',
    list: 'Lista', today: 'Dziś', publications: 'Publikacje', addLink: '+ Link',
    totalCollabs: 'Współprac', active: 'Aktywne', totalValue: 'Wartość', tiktok: 'TikTok', youtube: 'YouTube',
    sortNewest: 'Od najnowszych', sortFollowers: 'Wg obserwujących', sortDeadline: 'Wg deadline',
    filterActive: 'Aktywne', filterAll: 'Wszystkie',
    planner: 'Planner',
  },
  en: {
    collabs: 'Collabs', newCollab: 'New collab', influencer: 'Influencer', handle: 'IG Handle',
    link: 'Instagram link', followers: 'Followers', engagement: 'Engagement', avgViews: 'Avg. views',
    market: 'Market', allMarkets: 'All', collabType: 'Collab type', amount: 'Amount',
    code: 'Discount code', landingPage: 'Landing page', status: 'Status', product: 'Product',
    campDates: 'Camp dates', contactDate: 'Contact date', agreedDate: 'Agreed date',
    publishDeadline: 'Publish deadline', publishedDate: 'Published date', contract: 'Contract',
    contractStatus: 'Contract status', adLicense: 'Ad license', adDays: 'License days',
    adPlatforms: 'Platforms', assignees: 'Assigned', notes: 'Notes', rejectionReason: 'Rejection reason',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', add: 'Add',
    deliverables: 'Deliverables', type: 'Type', count: 'Count', withAdLicense: 'With ad license',
    noCollabs: 'No collabs', deleteConfirm: 'Delete collab?', loading: 'Loading...',
    backToTasks: '← Tasks', all: 'All', pipeline: 'Pipeline', calendar: 'Calendar',
    list: 'List', today: 'Today', publications: 'Publications', addLink: '+ Link',
    totalCollabs: 'Collabs', active: 'Active', totalValue: 'Value', tiktok: 'TikTok', youtube: 'YouTube',
    sortNewest: 'Newest', sortFollowers: 'By followers', sortDeadline: 'By deadline',
    filterActive: 'Active', filterAll: 'All',
    planner: 'Planner',
  },
};

const getInitials = (n) => { const p = n.split(' '); return p.length >= 2 ? p[0][0] + p[1][0] : n[0]; };
const fmt = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }) : '';
const fmtFull = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const fmtNum = (n) => n ? n.toLocaleString('pl-PL') : '';
const extractHandle = (url) => {
  if (!url) return '';
  const m = url.match(/instagram\.com\/([^/?]+)/);
  return m ? '@' + m[1].replace(/\/$/, '') : '';
};
const DAYS_PL = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
const MONTHS_PL = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
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
const fmtD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const isToday = (ds) => ds === fmtD(new Date());

// ── Login ────────────────────────────────────────────

function LoginScreen({ onLogin, teamMembers }) {
  const [su, setSu] = useState(''); const [pin, setPin] = useState(''); const [err, setErr] = useState(''); const [ld, setLd] = useState(false);
  const am = teamMembers.filter(m => m.isActive !== false);
  const hl = async (e) => {
    e.preventDefault(); if (!su) { setErr('Wybierz osobę'); return; }
    setLd(true);
    try {
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: su, pin }) });
      const d = await r.json();
      if (d.success) { localStorage.setItem('av_tasks_user', su); onLogin(su); } else setErr('Nieprawidłowy PIN');
    } catch { setErr('Błąd połączenia'); }
    setLd(false);
  };
  return <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f8f9fa' }}><div className="bg-white rounded-xl p-8 w-full max-w-sm" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><div className="text-center mb-6"><h1 className="text-xl font-semibold" style={{ color: '#111827' }}>📣 Influencer Collabs</h1><p className="text-sm mt-1" style={{ color: '#6b7280' }}>Panel współprac z influencerami</p></div><form onSubmit={hl} className="space-y-4">{err && <div className="p-3 rounded-lg text-sm text-center" style={{ background: '#fef2f2', color: '#dc2626' }}>{err}</div>}<div><label className="block text-sm font-medium mb-1.5" style={{ color: '#111827' }}>Osoba</label><select value={su} onChange={e => { setSu(e.target.value); setErr(''); }} className="w-full px-4 py-3 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }}><option value="">Wybierz...</option>{am.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div><div><label className="block text-sm font-medium mb-1.5" style={{ color: '#111827' }}>PIN</label><input type="password" value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setErr(''); }} className="w-full px-4 py-3 border rounded-lg text-sm text-center tracking-widest" style={{ borderColor: '#d1d5db' }} placeholder="••••" maxLength={4} inputMode="numeric" /></div><button type="submit" disabled={ld} className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-70" style={{ background: '#2563eb', color: 'white' }}>{ld ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}{ld ? '...' : 'Zaloguj się'}</button></form></div></div>;
}

// ── Deliverables Editor ──────────────────────────────

function DeliverablesEditor({ deliverables, onChange, t }) {
  const add = () => onChange([...deliverables, { type: 'reel', count: 1, adLicense: false, adDays: 30 }]);
  const upd = (i, k, v) => onChange(deliverables.map((d, j) => j === i ? { ...d, [k]: v } : d));
  const rm = (i) => onChange(deliverables.filter((_, j) => j !== i));
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.deliverables}</label>
      {deliverables.map((d, i) => (
        <div key={i} className="flex items-center gap-2 mb-1.5 p-2 rounded-lg" style={{ background: '#f8f9fa' }}>
          <select value={d.type} onChange={e => upd(i, 'type', e.target.value)} className="px-2 py-1.5 border rounded-lg text-xs" style={{ borderColor: '#d1d5db' }}>
            {DELIVERABLE_TYPES.map(dt => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
          </select>
          <input type="number" value={d.count} onChange={e => upd(i, 'count', parseInt(e.target.value) || 1)} className="w-14 px-2 py-1.5 border rounded-lg text-xs text-center" style={{ borderColor: '#d1d5db' }} min={1} />
          <label className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: '#6b7280' }}>
            <input type="checkbox" checked={d.adLicense} onChange={e => upd(i, 'adLicense', e.target.checked)} className="w-3.5 h-3.5 rounded" style={{ accentColor: '#2563eb' }} />
            Ads
          </label>
          {d.adLicense && <input type="number" value={d.adDays || 30} onChange={e => upd(i, 'adDays', parseInt(e.target.value) || 30)} className="w-14 px-2 py-1.5 border rounded-lg text-xs text-center" style={{ borderColor: '#d1d5db' }} placeholder="dni" />}
          <button type="button" onClick={() => rm(i)} className="p-1 rounded hover:bg-red-50" style={{ color: '#ef4444' }}><X size={14} /></button>
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs font-medium px-2 py-1 rounded hover:bg-blue-50" style={{ color: '#2563eb' }}>+ {t.add}</button>
    </div>
  );
}

function DeliverablesBadges({ deliverables }) {
  if (!deliverables?.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {deliverables.map((d, i) => {
        const dt = DELIVERABLE_TYPES.find(t => t.id === d.type);
        return (
          <span key={i} className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#f3f4f6', color: '#6b7280' }}>
            {d.count}× {dt?.name || d.type}
            {d.adLicense && <Megaphone size={9} style={{ color: '#f59e0b' }} />}
          </span>
        );
      })}
    </div>
  );
}

// ── Publication Links Editor ─────────────────────────

function PubLinksEditor({ links, onChange, t }) {
  const add = () => onChange([...links, { url: '', type: 'reel', publishedAt: '' }]);
  const upd = (i, k, v) => onChange(links.map((l, j) => j === i ? { ...l, [k]: v } : l));
  const rm = (i) => onChange(links.filter((_, j) => j !== i));
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.publications}</label>
      {links.map((l, i) => (
        <div key={i} className="flex items-center gap-2 mb-1.5">
          <input type="url" value={l.url} onChange={e => upd(i, 'url', e.target.value)} className="flex-1 px-2 py-1.5 border rounded-lg text-xs" style={{ borderColor: '#d1d5db' }} placeholder="https://instagram.com/p/..." />
          <select value={l.type} onChange={e => upd(i, 'type', e.target.value)} className="px-2 py-1.5 border rounded-lg text-xs" style={{ borderColor: '#d1d5db' }}>
            {DELIVERABLE_TYPES.map(dt => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
          </select>
          <button type="button" onClick={() => rm(i)} className="p-1 rounded hover:bg-red-50" style={{ color: '#ef4444' }}><X size={14} /></button>
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs font-medium px-2 py-1 rounded hover:bg-blue-50" style={{ color: '#2563eb' }}>{t.addLink}</button>
    </div>
  );
}

// ── Collab Form Modal ────────────────────────────────

function CollabFormModal({ collab, onSave, onClose, currentUser, teamMembers, t, lang }) {
  const isEdit = !!collab?.id;
  const [f, sF] = useState({
    influencerName: collab?.influencerName || '',
    instagramUrl: collab?.instagramUrl || '',
    tiktokUrl: collab?.tiktokUrl || '',
    youtubeUrl: collab?.youtubeUrl || '',
    followers: collab?.followers || '',
    avgEngagement: collab?.avgEngagement || '',
    avgViews: collab?.avgViews || '',
    market: collab?.market || 'pl',
    collabType: collab?.collabType || 'barter',
    paymentAmount: collab?.paymentAmount || '',
    discountCode: collab?.discountCode || '',
    landingPageUrl: collab?.landingPageUrl || '',
    deliverables: collab?.deliverables || [],
    status: collab?.status || 'contacted',
    product: collab?.product || '',
    campDates: collab?.campDates || '',
    contactDate: collab?.contactDate || new Date().toISOString().split('T')[0],
    agreedDate: collab?.agreedDate || '',
    publishDeadline: collab?.publishDeadline || '',
    publishedDate: collab?.publishedDate || '',
    publicationLinks: collab?.publicationLinks || [],
    contractUrl: collab?.contractUrl || '',
    contractStatus: collab?.contractStatus || null,
    adLicense: collab?.adLicense || false,
    adLicenseDays: collab?.adLicenseDays || 30,
    adPlatforms: collab?.adPlatforms || 'Meta, Google',
    assignedTo: collab?.assignedTo || [currentUser],
    notes: collab?.notes || '',
    rejectionReason: collab?.rejectionReason || '',
  });

  const save = () => {
    if (!f.influencerName.trim()) return;
    const handle = extractHandle(f.instagramUrl);
    onSave({
      ...f,
      instagramHandle: handle,
      followers: f.followers ? parseInt(f.followers) : null,
      avgEngagement: f.avgEngagement ? parseFloat(f.avgEngagement) : null,
      avgViews: f.avgViews ? parseInt(f.avgViews) : null,
      paymentAmount: f.paymentAmount ? parseFloat(f.paymentAmount) : null,
      adLicenseDays: f.adLicenseDays ? parseInt(f.adLicenseDays) : null,
      publicationLinks: f.publicationLinks.filter(l => l.url.trim()),
      contactDate: f.contactDate || null,
      agreedDate: f.agreedDate || null,
      publishDeadline: f.publishDeadline || null,
      publishedDate: f.publishedDate || null,
      contractStatus: f.contractStatus || null,
      createdBy: collab?.createdBy || currentUser,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ boxShadow: '0 24px 38px 3px rgba(0,0,0,.14)' }} onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#e5e7eb' }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '20px' }}>📣</span>
            <h3 className="text-lg font-medium" style={{ color: '#111827' }}>{isEdit ? t.edit : t.newCollab}</h3>
          </div>
          <button onClick={onClose} style={{ color: '#6b7280' }}><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Influencer info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.influencer} *</label>
              <input type="text" value={f.influencerName} onChange={e => sF({ ...f, influencerName: e.target.value })} className="w-full px-4 py-2.5 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} placeholder="Imię i nazwisko / nazwa" autoFocus />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.link}</label>
              <input type="url" value={f.instagramUrl} onChange={e => sF({ ...f, instagramUrl: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} placeholder="https://instagram.com/..." />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>{t.followers}</label>
                <input type="number" value={f.followers} onChange={e => sF({ ...f, followers: e.target.value })} className="w-full px-2 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} placeholder="150000" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>Eng. %</label>
                <input type="number" step="0.01" value={f.avgEngagement} onChange={e => sF({ ...f, avgEngagement: e.target.value })} className="w-full px-2 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} placeholder="8.5" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>Śr. views</label>
                <input type="number" value={f.avgViews} onChange={e => sF({ ...f, avgViews: e.target.value })} className="w-full px-2 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} placeholder="50000" />
              </div>
            </div>
          </div>

          {/* TikTok / YouTube */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>{t.tiktok}</label>
              <input type="url" value={f.tiktokUrl} onChange={e => sF({ ...f, tiktokUrl: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} placeholder="https://tiktok.com/@..." />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>{t.youtube}</label>
              <input type="url" value={f.youtubeUrl} onChange={e => sF({ ...f, youtubeUrl: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} placeholder="https://youtube.com/..." />
            </div>
          </div>

          {/* Market, type, product */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.market}</label>
              <select value={f.market} onChange={e => sF({ ...f, market: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }}>
                {MARKETS.map(m => <option key={m.id} value={m.id}>{m.icon} {lang === 'en' ? m.nameEn : m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.collabType}</label>
              <select value={f.collabType} onChange={e => sF({ ...f, collabType: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }}>
                {COLLAB_TYPES.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.product}</label>
              <select value={f.product} onChange={e => sF({ ...f, product: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }}>
                <option value="">—</option>
                {PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          {(f.collabType === 'paid' || f.collabType === 'barter_paid') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.amount} (PLN)</label>
                <input type="number" value={f.paymentAmount} onChange={e => sF({ ...f, paymentAmount: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} placeholder="5000" />
              </div>
              <div />
            </div>
          )}

          {/* Camp dates, discount, landing */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>{t.campDates}</label>
              <input type="text" value={f.campDates} onChange={e => sF({ ...f, campDates: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} placeholder="12-18 lipca, Niegocin" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>{t.code}</label>
              <input type="text" value={f.discountCode} onChange={e => sF({ ...f, discountCode: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} placeholder="ZUZIA" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>{t.landingPage}</label>
              <input type="url" value={f.landingPageUrl} onChange={e => sF({ ...f, landingPageUrl: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} placeholder="https://angloville.pl/zuzia" />
            </div>
          </div>

          {/* Deliverables */}
          <DeliverablesEditor deliverables={f.deliverables} onChange={d => sF({ ...f, deliverables: d })} t={t} />

          {/* Status */}
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.status}</label>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map(s => {
                const I = s.icon; const on = f.status === s.id;
                return <button key={s.id} type="button" onClick={() => sF({ ...f, status: s.id })}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: on ? s.bg : '#f3f4f6', color: on ? s.color : '#6b7280', border: on ? `1.5px solid ${s.color}` : '1.5px solid transparent' }}>
                  <I size={12} />{lang === 'en' ? s.nameEn : s.name}
                </button>;
              })}
            </div>
          </div>

          {f.status === 'rejected' && (
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.rejectionReason}</label>
              <textarea value={f.rejectionReason} onChange={e => sF({ ...f, rejectionReason: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" style={{ borderColor: '#d1d5db' }} rows={2} />
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>{t.contactDate}</label>
              <input type="date" value={f.contactDate || ''} onChange={e => sF({ ...f, contactDate: e.target.value })} className="w-full px-2 py-1.5 border rounded-lg text-xs" style={{ borderColor: '#d1d5db' }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>{t.agreedDate}</label>
              <input type="date" value={f.agreedDate || ''} onChange={e => sF({ ...f, agreedDate: e.target.value })} className="w-full px-2 py-1.5 border rounded-lg text-xs" style={{ borderColor: '#d1d5db' }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>{t.publishDeadline}</label>
              <input type="date" value={f.publishDeadline || ''} onChange={e => sF({ ...f, publishDeadline: e.target.value })} className="w-full px-2 py-1.5 border rounded-lg text-xs" style={{ borderColor: '#d1d5db' }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>{t.publishedDate}</label>
              <input type="date" value={f.publishedDate || ''} onChange={e => sF({ ...f, publishedDate: e.target.value })} className="w-full px-2 py-1.5 border rounded-lg text-xs" style={{ borderColor: '#d1d5db' }} />
            </div>
          </div>

          {/* Contract */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.contractStatus}</label>
              <select value={f.contractStatus || ''} onChange={e => sF({ ...f, contractStatus: e.target.value || null })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }}>
                {CONTRACT_STATUSES.map(cs => <option key={cs.id || 'none'} value={cs.id || ''}>{lang === 'en' ? (cs.nameEn || cs.name) : cs.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.contract} URL</label>
              <input type="url" value={f.contractUrl} onChange={e => sF({ ...f, contractUrl: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }} placeholder="https://docs.google.com/..." />
            </div>
          </div>

          {/* Publication links */}
          <PubLinksEditor links={f.publicationLinks} onChange={l => sF({ ...f, publicationLinks: l })} t={t} />

          {/* Assignees */}
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.assignees}</label>
            <div className="flex flex-wrap gap-1.5">
              {teamMembers.filter(m => m.isActive !== false).map(m => {
                const on = f.assignedTo.includes(m.id);
                return <button key={m.id} type="button" onClick={() => sF({ ...f, assignedTo: on ? f.assignedTo.filter(a => a !== m.id) : [...f.assignedTo, m.id] })}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border"
                  style={{ borderColor: on ? '#2563eb' : '#d1d5db', background: on ? '#eff6ff' : 'white', color: on ? '#2563eb' : '#111827' }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: m.color, fontSize: '8px', fontWeight: 600 }}>{getInitials(m.name)}</div>
                  {m.name.split(' ')[0]}{on && <Check size={12} />}
                </button>;
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: '#111827' }}>{t.notes}</label>
            <textarea value={f.notes} onChange={e => sF({ ...f, notes: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" style={{ borderColor: '#d1d5db' }} rows={3} />
          </div>
        </div>
        <div className="p-5 border-t flex justify-end gap-3" style={{ borderColor: '#e5e7eb' }}>
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100" style={{ color: '#6b7280' }}>{t.cancel}</button>
          <button onClick={save} disabled={!f.influencerName.trim()} className="px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50" style={{ background: '#2563eb', color: 'white' }}>{t.save}</button>
        </div>
      </div>
    </div>
  );
}

// ── Collab Detail Panel ──────────────────────────────

function CollabDetail({ collab, onUpdate, onEdit, onDelete, onClose, teamMembers, t, lang }) {
  const st = STATUSES.find(s => s.id === collab.status);
  const ct = COLLAB_TYPES.find(c => c.id === collab.collabType);
  const mk = MARKETS.find(m => m.id === collab.market);
  const pr = PRODUCTS.find(p => p.id === collab.product);
  const cs = CONTRACT_STATUSES.find(c => c.id === collab.contractStatus);
  const assigned = (collab.assignedTo || []).map(id => teamMembers.find(m => m.id === id)).filter(Boolean);
  const StI = st?.icon || Circle;
  const handle = collab.instagramHandle || extractHandle(collab.instagramUrl);

  const nextStatus = () => {
    const idx = STATUSES.findIndex(s => s.id === collab.status);
    if (idx < STATUSES.length - 2) onUpdate(collab.id, { status: STATUSES[idx + 1].id });
  };

  return (
    <aside className="w-full lg:w-[560px] bg-white border-l flex flex-col overflow-hidden flex-shrink-0 fixed lg:static inset-0 z-40 lg:z-auto" style={{ borderColor: '#e5e7eb' }}>
      <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: '#e5e7eb' }}>
        <div className="flex items-center gap-2">
          <StI size={18} style={{ color: st?.color }} />
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: st?.bg, color: st?.color }}>{lang === 'en' ? st?.nameEn : st?.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: ct?.bg, color: ct?.color }}>{ct?.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(collab)} className="p-1.5 rounded-full hover:bg-gray-100" style={{ color: '#6b7280' }}><Edit3 size={16} /></button>
          <button onClick={() => onDelete(collab)} className="p-1.5 rounded-full hover:bg-red-50" style={{ color: '#6b7280' }}><Trash2 size={16} /></button>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100" style={{ color: '#6b7280' }}><X size={16} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <h3 className="font-semibold text-lg" style={{ color: '#111827' }}>{collab.influencerName}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {handle && <span className="text-sm" style={{ color: '#2563eb' }}>{handle}</span>}
            {collab.instagramUrl && <a href={collab.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-blue-50"><ExternalLink size={14} style={{ color: '#2563eb' }} /></a>}
            {collab.tiktokUrl && <a href={collab.tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-0.5 rounded-full hover:bg-gray-100" style={{ color: '#111827' }}>TikTok ↗</a>}
            {collab.youtubeUrl && <a href={collab.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-0.5 rounded-full hover:bg-gray-100" style={{ color: '#ef4444' }}>YouTube ↗</a>}
          </div>
        </div>

        {/* Quick action — advance status */}
        {collab.status !== 'settled' && collab.status !== 'rejected' && collab.status !== 'published' && (
          <button onClick={nextStatus} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium" style={{ background: st?.bg, color: st?.color, border: `1px solid ${st?.color}40` }}>
            <Check size={14} /> {lang === 'en' ? 'Advance status' : 'Następny status'} →
          </button>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {collab.followers && <div className="p-2.5 rounded-lg text-center" style={{ background: '#f8f9fa' }}><div className="text-base font-bold" style={{ color: '#111827' }}>{fmtNum(collab.followers)}</div><div className="text-xs" style={{ color: '#9ca3af' }}>{t.followers}</div></div>}
          {collab.avgEngagement && <div className="p-2.5 rounded-lg text-center" style={{ background: '#f8f9fa' }}><div className="text-base font-bold" style={{ color: '#111827' }}>{collab.avgEngagement}%</div><div className="text-xs" style={{ color: '#9ca3af' }}>Eng.</div></div>}
          {collab.avgViews && <div className="p-2.5 rounded-lg text-center" style={{ background: '#f8f9fa' }}><div className="text-base font-bold" style={{ color: '#111827' }}>{fmtNum(collab.avgViews)}</div><div className="text-xs" style={{ color: '#9ca3af' }}>Avg views</div></div>}
        </div>

        {/* Info block */}
        <div className="space-y-2.5 p-3 rounded-lg" style={{ background: '#f8f9fa', border: '1px solid #e5e7eb' }}>
          <Row label={t.market}><span className="text-sm">{mk?.icon} {lang === 'en' ? mk?.nameEn : mk?.name}</span></Row>
          {pr && <Row label={t.product}><span className="text-sm">{pr.name}</span></Row>}
          {collab.campDates && <Row label={t.campDates}><span className="text-sm">{collab.campDates}</span></Row>}
          {collab.paymentAmount && <Row label={t.amount}><span className="text-sm font-medium" style={{ color: '#2563eb' }}>{fmtNum(collab.paymentAmount)} PLN</span></Row>}
          {collab.discountCode && <Row label={t.code}><span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: '#eff6ff', color: '#2563eb' }}>{collab.discountCode}</span></Row>}
          {collab.landingPageUrl && <Row label={t.landingPage}><a href={collab.landingPageUrl} target="_blank" rel="noopener noreferrer" className="text-sm flex items-center gap-1" style={{ color: '#2563eb' }}><ExternalLink size={12} />{collab.landingPageUrl.replace('https://','').split('/').slice(0,2).join('/')}</a></Row>}
        </div>

        {/* Deliverables */}
        {collab.deliverables?.length > 0 && (
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#6b7280' }}>{t.deliverables}</label>
            <div className="space-y-1">
              {collab.deliverables.map((d, i) => {
                const dt = DELIVERABLE_TYPES.find(t => t.id === d.type);
                const DI = dt?.icon || Film;
                return (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#f3f4f6' }}>
                    <DI size={14} style={{ color: '#6b7280' }} />
                    <span className="text-sm flex-1">{d.count}× {dt?.name || d.type}</span>
                    {d.adLicense && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#fefce8', color: '#ca8a04' }}>📣 Ads {d.adDays}d</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="space-y-2 p-3 rounded-lg" style={{ background: '#f8f9fa', border: '1px solid #e5e7eb' }}>
          {collab.contactDate && <Row label={t.contactDate}><span className="text-sm">{fmtFull(collab.contactDate)}</span></Row>}
          {collab.agreedDate && <Row label={t.agreedDate}><span className="text-sm">{fmtFull(collab.agreedDate)}</span></Row>}
          {collab.publishDeadline && <Row label={t.publishDeadline}><span className="text-sm font-medium" style={{ color: collab.publishDeadline < fmtD(new Date()) && collab.status !== 'published' && collab.status !== 'settled' ? '#ef4444' : '#111827' }}>{fmtFull(collab.publishDeadline)}</span></Row>}
          {collab.publishedDate && <Row label={t.publishedDate}><span className="text-sm" style={{ color: '#16a34a' }}>{fmtFull(collab.publishedDate)}</span></Row>}
        </div>

        {/* Contract */}
        {collab.contractStatus && (
          <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: cs?.color === '#16a34a' ? '#f0fdf4' : '#f8f9fa', border: `1px solid ${cs?.color}30` }}>
            <FileText size={16} style={{ color: cs?.color }} />
            <span className="text-sm flex-1" style={{ color: cs?.color }}>{lang === 'en' ? (cs?.nameEn || cs?.name) : cs?.name}</span>
            {collab.contractUrl && <a href={collab.contractUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium px-2.5 py-1 rounded-lg hover:bg-gray-100" style={{ color: '#2563eb' }}>Otwórz ↗</a>}
          </div>
        )}

        {/* Publication links */}
        {collab.publicationLinks?.length > 0 && (
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#6b7280' }}>{t.publications}</label>
            {collab.publicationLinks.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-blue-50 text-sm" style={{ color: '#2563eb' }}>
                <ExternalLink size={13} /><span className="hover:underline truncate">{l.url}</span>
              </a>
            ))}
          </div>
        )}

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

        {/* Notes */}
        {collab.notes && (
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>{t.notes}</label>
            <div className="px-3 py-2 rounded-lg text-sm whitespace-pre-wrap" style={{ background: '#f3f4f6', color: '#374151' }}>{collab.notes}</div>
          </div>
        )}

        {/* Rejection reason */}
        {collab.status === 'rejected' && collab.rejectionReason && (
          <div className="p-3 rounded-lg" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <label className="text-xs font-medium block mb-1" style={{ color: '#ef4444' }}>{t.rejectionReason}</label>
            <p className="text-sm" style={{ color: '#dc2626' }}>{collab.rejectionReason}</p>
          </div>
        )}

        <div className="pt-3 border-t text-xs" style={{ borderColor: '#e5e7eb', color: '#9ca3af' }}>
          <p>Dodano: {fmtFull(collab.createdAt?.split('T')[0])}</p>
        </div>
      </div>
    </aside>
  );
}

function Row({ label, children }) {
  return <div className="flex items-center justify-between"><span className="text-xs font-medium" style={{ color: '#6b7280' }}>{label}</span>{children}</div>;
}

// ── Collab Row (list item) ───────────────────────────

function CollabRow({ collab, isSelected, onClick, teamMembers, t, lang }) {
  const st = STATUSES.find(s => s.id === collab.status);
  const ct = COLLAB_TYPES.find(c => c.id === collab.collabType);
  const mk = MARKETS.find(m => m.id === collab.market);
  const StI = st?.icon || Circle;
  const handle = collab.instagramHandle || extractHandle(collab.instagramUrl);
  const assigned = (collab.assignedTo || []).map(id => teamMembers.find(m => m.id === id)).filter(Boolean);
  const deadlinePast = collab.publishDeadline && collab.publishDeadline < fmtD(new Date()) && !['published', 'settled', 'rejected'].includes(collab.status);

  return (
    <div onClick={onClick} className="bg-white rounded-lg px-3 py-2.5 cursor-pointer border transition-all duration-100"
      style={{ borderWidth: '0.5px', borderColor: isSelected ? '#3b82f6' : '#e5e7eb', boxShadow: isSelected ? '0 0 0 1px rgba(59,130,246,0.15)' : 'none' }}
      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; } }}
      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; } }}>
      <div className="flex items-center gap-2.5">
        <StI size={16} style={{ color: st?.color }} className={collab.status === 'published' || collab.status === 'settled' ? 'fill-current' : ''} />
        <span className="text-sm flex-shrink-0">{mk?.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium truncate" style={{ color: collab.status === 'rejected' ? '#9ca3af' : '#111827', textDecoration: collab.status === 'rejected' ? 'line-through' : 'none' }}>{collab.influencerName}</h4>
            {handle && <span className="text-xs hidden sm:inline" style={{ color: '#9ca3af' }}>{handle}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium hidden sm:inline" style={{ background: ct?.bg, color: ct?.color }}>{ct?.name}</span>
          {collab.followers && <span className="text-xs hidden sm:inline" style={{ color: '#9ca3af' }}>{fmtNum(collab.followers)}</span>}
          <DeliverablesBadges deliverables={collab.deliverables} />
          {collab.paymentAmount && <span className="text-xs font-medium hidden sm:inline" style={{ color: '#2563eb' }}>{fmtNum(collab.paymentAmount)} zł</span>}
          {deadlinePast && <AlertCircle size={14} style={{ color: '#ef4444' }} />}
          {collab.publishDeadline && !deadlinePast && <span className="text-xs hidden sm:inline" style={{ color: '#9ca3af' }}>{fmt(collab.publishDeadline)}</span>}
          <div className="flex -space-x-1">
            {assigned.slice(0, 2).map(m => <div key={m.id} className="w-5 h-5 rounded-full flex items-center justify-center text-white border border-white" style={{ background: m.color, fontSize: '8px', fontWeight: 600 }}>{getInitials(m.name)}</div>)}
          </div>
          <ChevronRight size={14} style={{ color: '#d1d5db' }} />
        </div>
      </div>
    </div>
  );
}



// ── Calendar View ────────────────────────────────────

function CalendarView({ collabs, year, month, onSelectCollab, selectedId, lang }) {
  const days = getMonthDays(year, month);
  const dayNames = DAYS_PL;
  const todayStr = fmtD(new Date());

  const byDate = useMemo(() => {
    const m = {};
    collabs.forEach(c => {
      if (c.publishDeadline) (m[c.publishDeadline] || (m[c.publishDeadline] = [])).push({ ...c, _calType: 'deadline' });
      if (c.publishedDate) (m[c.publishedDate] || (m[c.publishedDate] = [])).push({ ...c, _calType: 'published' });
    });
    return m;
  }, [collabs]);

  return (
    <div className="bg-white rounded-xl border" style={{ borderColor: '#e5e7eb' }}>
      <div className="grid grid-cols-7 border-b" style={{ borderColor: '#e5e7eb' }}>
        {dayNames.map(d => <div key={d} className="text-center py-2.5 text-xs font-medium" style={{ color: '#6b7280' }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const ds = fmtD(day.date); const items = byDate[ds] || []; const it = ds === todayStr;
          return (
            <div key={i} className="min-h-[80px] p-1 border-b border-r" style={{ borderColor: '#f3f4f6', background: it ? '#fefce8' : !day.cur ? '#fafafa' : 'white' }}>
              <div className="px-1 mb-0.5">
                <span className={`text-xs font-medium ${it ? 'w-5 h-5 rounded-full flex items-center justify-center' : ''}`} style={{ color: !day.cur ? '#d1d5db' : it ? 'white' : '#111827', background: it ? '#2563eb' : 'transparent' }}>
                  {day.date.getDate()}
                </span>
              </div>
              <div className="space-y-0.5">
                {items.slice(0, 3).map((c, j) => {
                  const isDl = c._calType === 'deadline';
                  return (
                    <div key={`${c.id}-${j}`} onClick={() => onSelectCollab(c)}
                      className="px-1 py-0.5 rounded text-xs truncate cursor-pointer hover:bg-blue-50"
                      style={{ color: isDl ? '#ea580c' : '#16a34a', fontSize: '10px' }}>
                      {isDl ? '⏰' : '✅'} {c.influencerName}
                    </div>
                  );
                })}
                {items.length > 3 && <div className="px-1 text-xs" style={{ color: '#2563eb', fontSize: '10px' }}>+{items.length - 3}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Side Button ──────────────────────────────────────

function SideBtn({ active, color, bg, onClick, label, count, dot }) {
  return <button onClick={onClick} className="w-full flex items-center justify-between px-2.5 py-1 rounded-md text-xs" style={{ background: active ? bg : 'transparent', color: active ? color : '#374151', fontWeight: active ? 500 : 400 }}>
    <div className={`flex items-center gap-1.5 ${dot ? 'pl-1.5' : ''}`}>
      {dot ? <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, opacity: active ? 1 : 0.5 }} /> : null}
      <span>{label}</span>
    </div>
    <span style={{ color: active ? color : '#9ca3af', fontSize: '11px' }}>{count}</span>
  </button>;
}

// ── Main App ─────────────────────────────────────────

export default function CollabsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [collabs, setCollabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [view, setView] = useState('list');
  const [showForm, setShowForm] = useState(false);
  const [editCollab, setEditCollab] = useState(null);
  const [selectedCollab, setSelectedCollab] = useState(null);
  const [filterMarket, setFilterMarket] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [sortBy, setSortBy] = useState('newest');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  useEffect(() => { (async () => { setLoadingTeam(true); const m = await getTeamMembers(); if (m.length > 0) setTeamMembers(m); setLoadingTeam(false); })(); }, []);
  const cm = teamMembers.find(m => m.id === currentUser);
  const lang = cm?.language || 'pl';
  const t = T[lang];

  useEffect(() => { const su = localStorage.getItem('av_tasks_user'); if (su) { (async () => { const m = await getTeamMembers(); if (m.find(x => x.id === su)) { setCurrentUser(su); setTeamMembers(m); } setCheckingAuth(false); })(); } else setCheckingAuth(false); }, []);

  const loadCollabs = useCallback(async () => { const d = await getCollabs(); setCollabs(d); setLoading(false); }, []);
  useEffect(() => { if (currentUser) loadCollabs(); }, [currentUser, loadCollabs]);
  useEffect(() => { if (!currentUser) return; const iv = setInterval(loadCollabs, 30000); return () => clearInterval(iv); }, [currentUser, loadCollabs]);

  const handleLogout = () => { localStorage.removeItem('av_tasks_user'); setCurrentUser(null); };

  const handleSave = async (data) => {
    if (editCollab?.id) {
      const up = await updateCollab(editCollab.id, data);
      if (up) { setCollabs(p => p.map(c => c.id === up.id ? up : c)); setSelectedCollab(p => p?.id === up.id ? up : p); }
    } else {
      const cr = await createCollab(data);
      if (cr) setCollabs(p => [cr, ...p]);
    }
    setShowForm(false); setEditCollab(null);
  };

  const handleUpdate = async (id, updates) => {
    const up = await updateCollab(id, updates);
    if (up) { setCollabs(p => p.map(c => c.id === up.id ? up : c)); setSelectedCollab(p => p?.id === up.id ? up : p); }
  };

  const handleDelete = (collab) => {
    if (!confirm(t.deleteConfirm)) return;
    deleteCollab(collab.id).then(() => {
      setCollabs(p => p.filter(c => c.id !== collab.id));
      if (selectedCollab?.id === collab.id) setSelectedCollab(null);
    });
  };

  const handleEdit = (collab) => { setEditCollab(collab); setShowForm(true); };

  // Filtering
  const activeStatuses = ['contacted', 'negotiating', 'agreed', 'contract_sent', 'contract_signed', 'content_ready'];
  const filtered = useMemo(() => {
    let list = collabs;
    if (filterMarket !== 'all') list = list.filter(c => c.market === filterMarket);
    if (filterStatus === 'active') list = list.filter(c => activeStatuses.includes(c.status));
    else if (filterStatus !== 'all') list = list.filter(c => c.status === filterStatus);
    // Sort
    if (sortBy === 'newest') list = [...list].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    else if (sortBy === 'followers') list = [...list].sort((a, b) => (b.followers || 0) - (a.followers || 0));
    else if (sortBy === 'deadline') list = [...list].sort((a, b) => { if (!a.publishDeadline) return 1; if (!b.publishDeadline) return -1; return a.publishDeadline.localeCompare(b.publishDeadline); });
    return list;
  }, [collabs, filterMarket, filterStatus, sortBy]);

  // Counts
  const statusCounts = useMemo(() => {
    const counts = {};
    STATUSES.forEach(s => { counts[s.id] = collabs.filter(c => c.status === s.id && (filterMarket === 'all' || c.market === filterMarket)).length; });
    counts.active = collabs.filter(c => activeStatuses.includes(c.status) && (filterMarket === 'all' || c.market === filterMarket)).length;
    counts.all = collabs.filter(c => filterMarket === 'all' || c.market === filterMarket).length;
    return counts;
  }, [collabs, filterMarket]);

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };
  const goToday = () => { setCalYear(now.getFullYear()); setCalMonth(now.getMonth()); };
  const months = lang === 'en' ? MONTHS_EN : MONTHS_PL;

  if (checkingAuth || loadingTeam) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fa' }}><Loader2 size={32} className="animate-spin" style={{ color: '#2563eb' }} /></div>;
  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} teamMembers={teamMembers} />;
  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fa', color: '#6b7280' }}>{t.loading}</div>;

  return (
    <div className="min-h-screen flex" style={{ background: '#f9fafb' }}>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`w-52 flex flex-col min-h-screen flex-shrink-0 bg-white fixed lg:static z-30 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ borderRight: '0.5px solid #e5e7eb' }}>
        <div className="p-3 border-b" style={{ borderColor: '#e5e7eb' }}>
          <h1 className="text-sm font-semibold" style={{ color: '#111827' }}>📣 {t.collabs}</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-0.5">
          {/* Markets */}
          <div>
            <p className="text-xs font-medium px-2 mb-0.5 mt-1" style={{ color: '#9ca3af' }}>{t.market}</p>
            <SideBtn active={filterMarket === 'all'} color="#2563eb" bg="#eff6ff" onClick={() => setFilterMarket('all')} label={t.allMarkets} count={collabs.length} />
            {MARKETS.map(m => <SideBtn key={m.id} active={filterMarket === m.id} color="#2563eb" bg="#eff6ff" onClick={() => setFilterMarket(m.id)} label={`${m.icon} ${lang === 'en' ? m.nameEn : m.name}`} count={collabs.filter(c => c.market === m.id).length} dot />)}
          </div>

          <div style={{ height: '0.5px', background: '#e5e7eb', margin: '4px 8px' }} />

          {/* Status */}
          <div>
            <p className="text-xs font-medium px-2 mb-0.5" style={{ color: '#9ca3af' }}>{t.status}</p>
            <SideBtn active={filterStatus === 'active'} color="#2563eb" bg="#eff6ff" onClick={() => setFilterStatus('active')} label={lang === 'en' ? 'Active' : 'Aktywne'} count={statusCounts.active} />
            <SideBtn active={filterStatus === 'all'} color="#6b7280" bg="#f3f4f6" onClick={() => setFilterStatus('all')} label={t.all} count={statusCounts.all} />
            {STATUSES.map(s => <SideBtn key={s.id} active={filterStatus === s.id} color={s.color} bg={s.bg} onClick={() => setFilterStatus(s.id)} label={lang === 'en' ? s.nameEn : s.name} count={statusCounts[s.id]} dot />)}
          </div>
        </div>

        <div className="px-3 py-2" style={{ borderTop: '0.5px solid #e5e7eb' }}>
          <div className="space-y-1">
            <a href="/planner" className="text-xs px-2.5 py-1.5 rounded-md hover:bg-gray-100 flex items-center gap-1.5" style={{ color: '#6b7280' }}>📬 {t.planner}<ExternalLink size={9} style={{ color: '#9ca3af' }} /></a>
            <a href="/" className="text-xs px-2.5 py-1.5 rounded-md hover:bg-gray-100 block" style={{ color: '#2563eb' }}>{t.backToTasks}</a>
          </div>
        </div>

        <div className="px-3 py-2.5" style={{ borderTop: '0.5px solid #e5e7eb' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ background: cm?.color, fontSize: '9px', fontWeight: 600 }}>{getInitials(cm?.name || '')}</div>
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
            {view === 'calendar' ? (
              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="p-1.5 rounded-full hover:bg-gray-100" style={{ color: '#6b7280' }}><ChevronLeft size={18} /></button>
                <h2 className="text-sm lg:text-base font-semibold min-w-[160px] text-center" style={{ color: '#111827' }}>{months[calMonth]} {calYear}</h2>
                <button onClick={nextMonth} className="p-1.5 rounded-full hover:bg-gray-100" style={{ color: '#6b7280' }}><ChevronRight size={18} /></button>
                <button onClick={goToday} className="text-xs px-2.5 py-1 rounded-md border" style={{ borderColor: '#d1d5db', color: '#6b7280' }}>{t.today}</button>
              </div>
            ) : (
              <h2 className="text-sm lg:text-base font-semibold" style={{ color: '#111827' }}>{t.collabs} <span className="font-normal text-xs" style={{ color: '#9ca3af' }}>({filtered.length})</span></h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex rounded-lg overflow-hidden border" style={{ borderColor: '#d1d5db' }}>
              <button onClick={() => setView('list')} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium" style={{ background: view === 'list' ? '#2563eb' : 'white', color: view === 'list' ? 'white' : '#6b7280' }}><List size={14} />{t.list}</button>
              <button onClick={() => setView('calendar')} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium" style={{ background: view === 'calendar' ? '#2563eb' : 'white', color: view === 'calendar' ? 'white' : '#6b7280', borderLeft: '1px solid #d1d5db' }}><Calendar size={14} />{t.calendar}</button>
            </div>
            {view === 'list' && (
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-1.5 border rounded-lg text-xs" style={{ borderColor: '#d1d5db', color: '#6b7280' }}>
                <option value="newest">{t.sortNewest}</option>
                <option value="followers">{t.sortFollowers}</option>
                <option value="deadline">{t.sortDeadline}</option>
              </select>
            )}
            <button onClick={loadCollabs} className="p-2 rounded-full hover:bg-gray-100" style={{ color: '#6b7280' }}><Loader2 size={18} /></button>
            <button onClick={() => { setEditCollab(null); setShowForm(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs" style={{ background: '#2563eb', color: 'white' }}><Plus size={15} /><span className="hidden sm:inline">{t.newCollab}</span></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 lg:p-4">
          {view === 'calendar' ? (
            <CalendarView collabs={filtered} year={calYear} month={calMonth} onSelectCollab={setSelectedCollab} selectedId={selectedCollab?.id} lang={lang} />
          ) : (
            <div className="max-w-4xl mx-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-16"><Users size={48} className="mx-auto mb-4" style={{ color: '#d1d5db' }} /><p style={{ color: '#6b7280' }}>{t.noCollabs}</p></div>
              ) : (
                <div className="space-y-0.5">
                  {filtered.map(c => (
                    <CollabRow key={c.id} collab={c} isSelected={selectedCollab?.id === c.id} onClick={() => setSelectedCollab(c)} teamMembers={teamMembers} t={t} lang={lang} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {selectedCollab && <CollabDetail collab={selectedCollab} onUpdate={handleUpdate} onEdit={handleEdit} onDelete={handleDelete} onClose={() => setSelectedCollab(null)} teamMembers={teamMembers} t={t} lang={lang} />}
      {showForm && <CollabFormModal collab={editCollab} onSave={handleSave} onClose={() => { setShowForm(false); setEditCollab(null); }} currentUser={currentUser} teamMembers={teamMembers} t={t} lang={lang} />}
    </div>
  );
}
