'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, X, Edit3, Trash2, CheckCircle, Circle, Send, MessageSquare, ChevronDown, ChevronRight, Clock, AlertCircle, ExternalLink, Copy, Languages, Loader2, ListTodo, Square, CheckSquare, Bold, Italic, List, ListOrdered, LogOut, Lock, GripVertical, Filter, Underline, AlignLeft, AlignCenter, AlignRight, Link2, Heading1, Heading2, Quote, Code, Undo, Redo } from 'lucide-react';
import { getTasks, createTask, updateTask as updateTaskDb, deleteTask as deleteTaskDb, getQuickLinks, createQuickLink, updateQuickLink, deleteQuickLink } from '../lib/supabase';

const TEAM_MEMBERS = [
  { id: 'edyta', name: 'Edyta Kędzior', email: 'e.kedzior@angloville.pl', isManager: true, color: '#4285f4', pin: '1234' },
  { id: 'aleksandra', name: 'Aleksandra Witkowska', email: 'a.witkowska@angloville.com', color: '#a142f4', pin: '2345' },
  { id: 'damian_l', name: 'Damian Ładak', email: 'd.ladak@angloville.pl', color: '#34a853', pin: '3456' },
  { id: 'damian_w', name: 'Damian Wójcicki', email: 'd.wojcicki@angloville.com', color: '#fbbc04', pin: '4567' },
  { id: 'wojciech', name: 'Wojciech Pisarski', email: 'w.pisarski@angloville.com', color: '#ea4335', pin: '5678' },
  { id: 'klaudia', name: 'Klaudia Gołembiowska', email: 'k.golembiowska@angloville.com', color: '#e91e63', pin: '6789' },
];

const MARKETS = [
  { id: 'pl', name: 'Polska', icon: '🇵🇱' },
  { id: 'ns', name: 'Native Speakers', icon: '🇬🇧' },
  { id: 'it', name: 'Włochy', icon: '🇮🇹' },
  { id: 'exchange', name: 'Wymiana', icon: '🇺🇸' },
];

const STATUSES = [
  { id: 'pending', name: 'Oczekujące', icon: AlertCircle, color: '#fbbc04', bg: '#fef7e0' },
  { id: 'open', name: 'Otwarte', icon: Circle, color: '#4285f4', bg: '#e8f0fe' },
  { id: 'longterm', name: 'Long-term', icon: Clock, color: '#a142f4', bg: '#f3e8fd' },
  { id: 'closed', name: 'Zamknięte', icon: CheckCircle, color: '#34a853', bg: '#e6f4ea' },
];

const getInitials = (name) => {
  const parts = name.split(' ');
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return name[0];
};

// Helper to make links clickable
function linkify(text) {
  if (!text) return '';
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  return text.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${url}</a>`);
}

// Component to display clickable links
function ClickableLinks({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          const url = urlMatch[1];
          let label = url;
          try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('docs.google.com')) label = '📄 Google Docs';
            else if (urlObj.hostname.includes('drive.google.com')) label = '📁 Google Drive';
            else if (urlObj.hostname.includes('sheets.google.com')) label = '📊 Google Sheets';
            else if (urlObj.hostname.includes('slides.google.com')) label = '📽️ Google Slides';
            else if (urlObj.hostname.includes('figma.com')) label = '🎨 Figma';
            else if (urlObj.hostname.includes('canva.com')) label = '🖼️ Canva';
            else if (urlObj.hostname.includes('notion.so')) label = '📝 Notion';
            else if (urlObj.hostname.includes('trello.com')) label = '📋 Trello';
            else if (urlObj.hostname.includes('asana.com')) label = '✅ Asana';
            else if (urlObj.hostname.includes('github.com')) label = '💻 GitHub';
            else if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) label = '▶️ YouTube';
            else label = urlObj.hostname.replace('www.', '');
          } catch {}
          return (
            <a 
              key={i}
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors group"
              style={{ color: '#1a73e8' }}
            >
              <ExternalLink size={14} className="flex-shrink-0" />
              <span className="text-sm group-hover:underline truncate">{label}</span>
            </a>
          );
        }
        return line ? <span key={i} className="text-sm block" style={{ color: '#5f6368' }}>{line}</span> : null;
      })}
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [selectedUser, setSelectedUser] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const member = TEAM_MEMBERS.find(m => m.id === selectedUser);
    if (!member) { setError('Wybierz osobę'); return; }
    if (member.pin !== pin) { setError('Nieprawidłowy PIN'); setPin(''); return; }
    localStorage.setItem('av_tasks_user', selectedUser);
    onLogin(selectedUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f8f9fa' }}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm" style={{ boxShadow: '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)' }}>
        <div className="text-center mb-8">
          <img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="Angloville" className="h-10 mx-auto mb-4" />
          <h1 className="text-xl font-semibold" style={{ color: '#202124' }}>Marketing Tasks</h1>
          <p className="text-sm mt-1" style={{ color: '#5f6368' }}>Zaloguj się do panelu</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="p-3 rounded-lg text-sm text-center" style={{ background: '#fce8e6', color: '#c5221f' }}>{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#202124' }}>Osoba</label>
            <select value={selectedUser} onChange={(e) => { setSelectedUser(e.target.value); setError(''); }} className="w-full px-4 py-3 border rounded-lg text-sm transition-colors focus:border-blue-500" style={{ borderColor: '#dadce0', color: '#202124' }}>
              <option value="">Wybierz...</option>
              {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#202124' }}>PIN</label>
            <input type="password" value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }} className="w-full px-4 py-3 border rounded-lg text-sm text-center tracking-widest transition-colors focus:border-blue-500" style={{ borderColor: '#dadce0' }} placeholder="••••" maxLength={4} inputMode="numeric" />
          </div>
          <button type="submit" className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors hover:shadow-md" style={{ background: '#1a73e8', color: 'white' }}><Lock size={18} />Zaloguj się</button>
        </form>
      </div>
    </div>
  );
}

// Google Docs style editor
function RichTextEditor({ value, onChange, placeholder, minHeight = '150px' }) {
  const editorRef = useRef(null);
  
  useEffect(() => { 
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''; 
    }
  }, [value]);
  
  const execCommand = (command, val = null) => { 
    document.execCommand(command, false, val); 
    editorRef.current?.focus(); 
    handleChange(); 
  };
  
  const handleChange = () => { 
    if (editorRef.current) onChange(editorRef.current.innerHTML); 
  };

  const insertLink = () => {
    const url = prompt('Podaj URL:');
    if (url) execCommand('createLink', url);
  };
  
  return (
    <div className="border rounded-lg overflow-hidden bg-white" style={{ borderColor: '#dadce0' }}>
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b flex-wrap" style={{ background: '#f1f3f4', borderColor: '#dadce0' }}>
        <button type="button" onClick={() => execCommand('undo')} className="p-1.5 rounded hover:bg-gray-200" title="Cofnij"><Undo size={18} style={{ color: '#444746' }} /></button>
        <button type="button" onClick={() => execCommand('redo')} className="p-1.5 rounded hover:bg-gray-200" title="Ponów"><Redo size={18} style={{ color: '#444746' }} /></button>
        
        <div className="w-px h-5 mx-1.5" style={{ background: '#dadce0' }} />
        
        <select onChange={(e) => execCommand('fontSize', e.target.value)} className="text-sm px-2 py-1 rounded bg-transparent hover:bg-gray-200 cursor-pointer" style={{ color: '#444746' }} defaultValue="3">
          <option value="1">Mały</option>
          <option value="2">Mniejszy</option>
          <option value="3">Normalny</option>
          <option value="4">Większy</option>
          <option value="5">Duży</option>
        </select>
        
        <div className="w-px h-5 mx-1.5" style={{ background: '#dadce0' }} />
        
        <button type="button" onClick={() => execCommand('bold')} className="p-1.5 rounded hover:bg-gray-200" title="Pogrubienie"><Bold size={18} style={{ color: '#444746' }} /></button>
        <button type="button" onClick={() => execCommand('italic')} className="p-1.5 rounded hover:bg-gray-200" title="Kursywa"><Italic size={18} style={{ color: '#444746' }} /></button>
        <button type="button" onClick={() => execCommand('underline')} className="p-1.5 rounded hover:bg-gray-200" title="Podkreślenie"><Underline size={18} style={{ color: '#444746' }} /></button>
        
        <div className="w-px h-5 mx-1.5" style={{ background: '#dadce0' }} />
        
        <div className="relative group">
          <button type="button" className="p-1.5 rounded hover:bg-gray-200 flex items-center" title="Kolor tekstu">
            <span style={{ color: '#444746', fontSize: '16px', fontWeight: '600', borderBottom: '3px solid #000' }}>A</span>
          </button>
          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border p-2 hidden group-hover:grid grid-cols-5 gap-1 z-20" style={{ borderColor: '#dadce0' }}>
            {['#000000', '#434343', '#666666', '#999999', '#1a73e8', '#ea4335', '#fbbc04', '#34a853', '#ff6d01', '#46bdc6', '#7baaf7', '#f07b72', '#fdd663', '#57bb8a', '#ff8a65', '#4dd0e1'].map(color => (
              <button key={color} type="button" onClick={() => execCommand('foreColor', color)} className="w-6 h-6 rounded hover:scale-110 transition-transform" style={{ background: color }} />
            ))}
          </div>
        </div>

        <div className="relative group">
          <button type="button" className="p-1.5 rounded hover:bg-gray-200 flex items-center" title="Wyróżnienie">
            <span style={{ background: '#fcf3cf', color: '#444746', fontSize: '16px', fontWeight: '600', padding: '0 3px' }}>A</span>
          </button>
          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border p-2 hidden group-hover:grid grid-cols-4 gap-1 z-20" style={{ borderColor: '#dadce0' }}>
            {['#ffffff', '#fcf3cf', '#d9ead3', '#c9daf8', '#fce5cd', '#f4cccc', '#d9d2e9', '#cfe2f3', '#ead1dc', '#fff2cc', '#d0e0e3', '#fce8e6'].map(color => (
              <button key={color} type="button" onClick={() => execCommand('hiliteColor', color)} className="w-6 h-6 rounded border hover:scale-110 transition-transform" style={{ background: color, borderColor: '#dadce0' }} />
            ))}
          </div>
        </div>
        
        <div className="w-px h-5 mx-1.5" style={{ background: '#dadce0' }} />
        
        <button type="button" onClick={insertLink} className="p-1.5 rounded hover:bg-gray-200" title="Wstaw link"><Link2 size={18} style={{ color: '#444746' }} /></button>
        
        <div className="w-px h-5 mx-1.5" style={{ background: '#dadce0' }} />
        
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-1.5 rounded hover:bg-gray-200" title="Lista punktowana"><List size={18} style={{ color: '#444746' }} /></button>
        <button type="button" onClick={() => execCommand('insertOrderedList')} className="p-1.5 rounded hover:bg-gray-200" title="Lista numerowana"><ListOrdered size={18} style={{ color: '#444746' }} /></button>
        
        <div className="w-px h-5 mx-1.5" style={{ background: '#dadce0' }} />
        
        <button type="button" onClick={() => execCommand('justifyLeft')} className="p-1.5 rounded hover:bg-gray-200" title="Do lewej"><AlignLeft size={18} style={{ color: '#444746' }} /></button>
        <button type="button" onClick={() => execCommand('justifyCenter')} className="p-1.5 rounded hover:bg-gray-200" title="Wyśrodkuj"><AlignCenter size={18} style={{ color: '#444746' }} /></button>
        
        <button type="button" onClick={() => execCommand('removeFormat')} className="p-1.5 rounded hover:bg-gray-200 ml-auto" title="Usuń formatowanie"><X size={18} style={{ color: '#9aa0a6' }} /></button>
      </div>
      
      <div 
        ref={editorRef} 
        contentEditable 
        onInput={handleChange} 
        onBlur={handleChange} 
        className="px-4 py-3 text-sm focus:outline-none overflow-y-auto"
        style={{ color: '#202124', minHeight, maxHeight: '400px', lineHeight: '1.6' }} 
        data-placeholder={placeholder} 
        suppressContentEditableWarning 
      />
    </div>
  );
}

function RichTextDisplay({ html }) {
  if (!html) return null;
  return (
    <div 
      className="text-sm leading-relaxed prose-docs"
      style={{ color: '#3c4043' }}
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}

const translationCache = {};
async function translateToPolish(text) {
  if (!text) return '';
  const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plainText) return '';
  if (translationCache[plainText]) return translationCache[plainText];
  try {
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(plainText)}&langpair=en|pl`);
    const data = await response.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) { translationCache[plainText] = data.responseData.translatedText; return data.responseData.translatedText; }
    return plainText;
  } catch { return plainText; }
}

function TranslationPopup({ title, description, onClose }) {
  const [translatedTitle, setTranslatedTitle] = useState('');
  const [translatedDesc, setTranslatedDesc] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { async function translate() { setLoading(true); const [tTitle, tDesc] = await Promise.all([translateToPolish(title), description ? translateToPolish(description) : Promise.resolve('')]); setTranslatedTitle(tTitle); setTranslatedDesc(tDesc); setLoading(false); } translate(); }, [title, description]);
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md" style={{ boxShadow: '0 24px 38px 3px rgba(0,0,0,.14), 0 9px 46px 8px rgba(0,0,0,.12), 0 11px 15px -7px rgba(0,0,0,.2)' }} onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#e8eaed' }}><div className="flex items-center gap-2"><Languages size={20} style={{ color: '#1a73e8' }} /><h3 className="font-medium" style={{ color: '#202124' }}>Tłumaczenie na polski</h3></div><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100" style={{ color: '#5f6368' }}><X size={20} /></button></div>
        <div className="p-5 space-y-4">
          {loading ? <div className="flex items-center justify-center py-8"><Loader2 size={24} className="animate-spin" style={{ color: '#1a73e8' }} /><span className="ml-2 text-sm" style={{ color: '#5f6368' }}>Tłumaczenie...</span></div> : <>
            <div><label className="block text-xs font-medium mb-1" style={{ color: '#5f6368' }}>Tytuł</label><div className="p-3 rounded-lg" style={{ background: '#e8f0fe' }}><p className="text-sm font-medium" style={{ color: '#202124' }}>{translatedTitle}</p></div></div>
            {translatedDesc && <div><label className="block text-xs font-medium mb-1" style={{ color: '#5f6368' }}>Opis</label><div className="p-3 rounded-lg" style={{ background: '#e8f0fe' }}><p className="text-sm" style={{ color: '#3c4043' }}>{translatedDesc}</p></div></div>}
            <p className="text-xs pt-2" style={{ color: '#9aa0a6' }}>🇬🇧 → 🇵🇱 Tłumaczenie automatyczne</p>
          </>}
        </div>
      </div>
    </div>
  );
}

function TranslateButton({ task, size = 'normal' }) {
  const [showPopup, setShowPopup] = useState(false);
  if (task.language !== 'en') return null;
  return <><button onClick={(e) => { e.stopPropagation(); setShowPopup(true); }} className={`${size === 'small' ? 'p-0.5' : 'p-1.5'} rounded-full hover:bg-blue-50 transition-colors`} style={{ color: '#1a73e8' }} title="Przetłumacz na polski"><Languages size={size === 'small' ? 14 : 16} /></button>{showPopup && <TranslationPopup title={task.title} description={task.description} onClose={() => setShowPopup(false)} />}</>;
}

function SubtaskProgress({ subtasks }) {
  if (!subtasks || subtasks.length === 0) return null;
  const done = subtasks.filter(s => s.status === 'closed').length;
  const total = subtasks.length;
  return <div className="flex items-center gap-1.5" title={`${done}/${total} subtasków`}><ListTodo size={12} style={{ color: '#5f6368' }} /><span className="text-xs" style={{ color: '#5f6368' }}>{done}/{total}</span></div>;
}

const generateId = () => Math.random().toString(36).substr(2, 9);
const formatDateTime = (date) => new Date(date).toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

async function sendEmailNotification(to, assigneeName, taskTitle, assignedBy) {
  try { await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, assigneeName, taskTitle, assignedBy }) }); } catch (e) { console.log('Email skipped:', e); }
}

// Quick Links Manager Component - saves to Supabase
function QuickLinksSection() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', url: '' });
  const [expanded, setExpanded] = useState(true);

  const loadLinks = async () => {
    const data = await getQuickLinks();
    setLinks(data);
    setLoading(false);
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const addLink = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    let url = form.url.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    
    const newLink = await createQuickLink({ name: form.name.trim(), url });
    if (newLink) {
      setLinks([...links, newLink]);
    }
    setForm({ name: '', url: '' });
    setShowAddForm(false);
  };

  const updateLink = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    let url = form.url.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    
    const updated = await updateQuickLink(editingId, { name: form.name.trim(), url });
    if (updated) {
      setLinks(links.map(l => l.id === editingId ? { ...l, name: form.name.trim(), url } : l));
    }
    setForm({ name: '', url: '' });
    setEditingId(null);
  };

  const removeLink = async (id) => {
    const success = await deleteQuickLink(id);
    if (success) {
      setLinks(links.filter(l => l.id !== id));
    }
  };

  const startEdit = (link) => {
    setForm({ name: link.name, url: link.url });
    setEditingId(link.id);
    setShowAddForm(false);
  };

  const getLinkIcon = (url) => {
    try {
      const hostname = new URL(url).hostname;
      if (hostname.includes('docs.google.com')) return '📄';
      if (hostname.includes('sheets.google.com')) return '📊';
      if (hostname.includes('slides.google.com')) return '📽️';
      if (hostname.includes('drive.google.com')) return '📁';
      if (hostname.includes('notion.so')) return '📝';
      if (hostname.includes('figma.com')) return '🎨';
      if (hostname.includes('miro.com')) return '🎯';
      if (hostname.includes('trello.com')) return '📋';
      if (hostname.includes('asana.com')) return '✅';
      if (hostname.includes('slack.com')) return '💬';
      if (hostname.includes('hubspot')) return '🟠';
      if (hostname.includes('lookerstudio') || hostname.includes('datastudio')) return '📈';
      if (hostname.includes('pipedrive')) return '🟢';
      if (hostname.includes('mailchimp')) return '🐵';
      if (hostname.includes('canva')) return '🎨';
      return '🔗';
    } catch { return '🔗'; }
  };

  return (
    <div className="mx-2 mt-3 rounded-lg overflow-hidden" style={{ background: '#f8f9fa', border: '1px solid #e8eaed' }}>
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium hover:bg-gray-100 transition-colors"
        style={{ color: '#5f6368' }}
      >
        <span>📌 Przydatne linki</span>
        <ChevronDown size={14} className={`transition-transform ${expanded ? '' : '-rotate-90'}`} />
      </button>
      
      {expanded && (
        <div className="px-2 pb-2">
          {/* Links list */}
          {loading ? (
            <div className="py-3 text-center">
              <Loader2 size={16} className="animate-spin mx-auto" style={{ color: '#9aa0a6' }} />
            </div>
          ) : (
            <div className="space-y-0.5 mb-2 max-h-64 overflow-y-auto">
              {links.map(link => (
                <div key={link.id} className="group flex items-center gap-1 rounded hover:bg-white transition-colors">
                  {editingId === link.id ? (
                    <div className="flex-1 p-1.5 space-y-1">
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Nazwa"
                        className="w-full px-2 py-1 text-xs rounded border"
                        style={{ borderColor: '#dadce0' }}
                        autoFocus
                      />
                      <input
                        type="text"
                        value={form.url}
                        onChange={(e) => setForm({ ...form, url: e.target.value })}
                        placeholder="URL"
                        className="w-full px-2 py-1 text-xs rounded border font-mono"
                        style={{ borderColor: '#dadce0' }}
                      />
                      <div className="flex gap-1">
                        <button onClick={updateLink} className="flex-1 py-1 rounded text-xs font-medium" style={{ background: '#1a73e8', color: 'white' }}>Zapisz</button>
                        <button onClick={() => { setEditingId(null); setForm({ name: '', url: '' }); }} className="px-2 py-1 rounded text-xs" style={{ color: '#5f6368' }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center gap-1.5 px-2 py-1.5 text-xs rounded hover:underline truncate"
                        style={{ color: '#1a73e8' }}
                        title={link.url}
                      >
                        <span>{getLinkIcon(link.url)}</span>
                        <span className="truncate">{link.name}</span>
                      </a>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(link)} className="p-1 rounded hover:bg-gray-200" style={{ color: '#5f6368' }}>
                          <Edit3 size={12} />
                        </button>
                        <button onClick={() => removeLink(link.id)} className="p-1 rounded hover:bg-red-50" style={{ color: '#ea4335' }}>
                          <X size={12} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {links.length === 0 && !loading && (
                <p className="text-xs text-center py-2" style={{ color: '#9aa0a6' }}>Brak linków</p>
              )}
            </div>
          )}

          {/* Add form */}
          {showAddForm ? (
            <div className="p-2 rounded-lg space-y-1.5" style={{ background: 'white', border: '1px solid #dadce0' }}>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nazwa (np. Budget NS)"
                className="w-full px-2 py-1.5 text-xs rounded border"
                style={{ borderColor: '#dadce0' }}
                autoFocus
              />
              <input
                type="text"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="Link (wklej URL)"
                className="w-full px-2 py-1.5 text-xs rounded border font-mono"
                style={{ borderColor: '#dadce0' }}
                onKeyDown={(e) => e.key === 'Enter' && addLink()}
              />
              <div className="flex gap-1">
                <button onClick={addLink} className="flex-1 py-1.5 rounded text-xs font-medium" style={{ background: '#1a73e8', color: 'white' }}>
                  Dodaj
                </button>
                <button onClick={() => { setShowAddForm(false); setForm({ name: '', url: '' }); }} className="px-3 py-1.5 rounded text-xs" style={{ background: '#f1f3f4', color: '#5f6368' }}>
                  Anuluj
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => { setShowAddForm(true); setEditingId(null); }}
              className="w-full py-1.5 rounded text-xs flex items-center justify-center gap-1 hover:bg-white transition-colors"
              style={{ color: '#1a73e8', border: '1px dashed #dadce0' }}
            >
              <Plus size={12} /> Dodaj link
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function TaskApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [filterMarket, setFilterMarket] = useState('all');
  const [filterPerson, setFilterPerson] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [activeTab, setActiveTab] = useState('tasks');
  const [copied, setCopied] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  useEffect(() => { const savedUser = localStorage.getItem('av_tasks_user'); if (savedUser && TEAM_MEMBERS.find(m => m.id === savedUser)) setCurrentUser(savedUser); setCheckingAuth(false); }, []);
  
  const loadTasks = async () => { 
    const data = await getTasks(); 
    const sorted = data.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    setTasks(sorted); 
    setLoading(false); 
  };
  
  useEffect(() => { if (currentUser) loadTasks(); }, [currentUser]);
  const handleLogout = () => { localStorage.removeItem('av_tasks_user'); setCurrentUser(null); setTasks([]); setSelectedTask(null); };

  if (checkingAuth) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fa' }}><Loader2 className="animate-spin" size={32} style={{ color: '#1a73e8' }} /></div>;
  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />;

  const currentMember = TEAM_MEMBERS.find(m => m.id === currentUser);
  const isManager = currentMember?.isManager || false;
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  
  const visibleTasks = tasks.filter(t => {
    if (t.status === 'pending') return false;
    if (!isManager && !t.assignees?.includes(currentUser) && t.createdBy !== currentUser) return false;
    if (filterMarket !== 'all' && t.market !== filterMarket) return false;
    if (filterPerson !== 'all' && !t.assignees?.includes(filterPerson)) return false;
    return true;
  });

  const getFilteredByStatus = (statusFilter) => {
    switch (statusFilter) {
      case 'all': return visibleTasks;
      case 'active': return visibleTasks.filter(t => t.status === 'open' || t.status === 'longterm');
      case 'open': return visibleTasks.filter(t => t.status === 'open');
      case 'longterm': return visibleTasks.filter(t => t.status === 'longterm');
      case 'closed': return visibleTasks.filter(t => t.status === 'closed');
      default: return visibleTasks;
    }
  };

  const filteredTasks = getFilteredByStatus(filterStatus);
  const openTasks = visibleTasks.filter(t => t.status === 'open');
  const longtermTasks = visibleTasks.filter(t => t.status === 'longterm');
  const closedTasks = visibleTasks.filter(t => t.status === 'closed');

  const updateTask = async (id, updates) => { 
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t)); 
    if (selectedTask?.id === id) setSelectedTask(prev => ({ ...prev, ...updates })); 
    await updateTaskDb(id, updates); 
  };
  
  const deleteTask = async (id) => { if (confirm('Usunąć zadanie?')) { setTasks(prev => prev.filter(t => t.id !== id)); setSelectedTask(null); await deleteTaskDb(id); } };
  
  const approveTask = async (task, assignees) => { 
    await updateTask(task.id, { status: 'open', assignees, approvedAt: new Date().toISOString(), approvedBy: currentUser }); 
    for (const aId of assignees) { const m = TEAM_MEMBERS.find(x => x.id === aId); if (m) await sendEmailNotification(m.email, m.name, task.title, currentMember?.name); } 
    setActiveTab('tasks'); 
  };
  
  const addTask = async (task) => { 
    const newTask = { ...task, createdAt: new Date().toISOString(), createdBy: currentUser, isExternal: false, subtasks: [], status: task.status || 'open', order: 0 }; 
    const created = await createTask(newTask); 
    if (created) await loadTasks(); 
    setShowNewTask(false); 
    for (const aId of task.assignees || []) { const m = TEAM_MEMBERS.find(x => x.id === aId); if (m && m.id !== currentUser) await sendEmailNotification(m.email, m.name, task.title, currentMember?.name); } 
  };

  // Improved drag & drop
  const handleDragStart = (e, task) => { 
    setDraggedTask(task); 
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };
  
  const handleDragOver = (e, targetTask) => { 
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
    if (draggedTask && targetTask.id !== draggedTask.id && targetTask.status === draggedTask.status) {
      setDragOverId(targetTask.id);
    }
  };
  
  const handleDrop = async (e, targetTask) => {
    e.preventDefault();
    setDragOverId(null);
    
    if (!draggedTask || draggedTask.id === targetTask.id) {
      setDraggedTask(null);
      return;
    }
    if (draggedTask.status !== targetTask.status) {
      setDraggedTask(null);
      return;
    }
    
    const statusTasks = filteredTasks.filter(t => t.status === draggedTask.status);
    const draggedIndex = statusTasks.findIndex(t => t.id === draggedTask.id);
    const targetIndex = statusTasks.findIndex(t => t.id === targetTask.id);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedTask(null);
      return;
    }
    
    const newStatusTasks = [...statusTasks];
    newStatusTasks.splice(draggedIndex, 1);
    newStatusTasks.splice(targetIndex, 0, draggedTask);
    
    // Update local state immediately
    const updates = newStatusTasks.map((t, idx) => ({ id: t.id, order: idx }));
    setTasks(prev => {
      const otherTasks = prev.filter(t => t.status !== draggedTask.status);
      const reorderedTasks = newStatusTasks.map((t, idx) => ({ ...t, order: idx }));
      return [...otherTasks, ...reorderedTasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });
    
    // Persist to database
    for (const u of updates) {
      await updateTaskDb(u.id, { order: u.order });
    }
    
    setDraggedTask(null);
  };
  
  const handleDragEnd = () => { 
    setDraggedTask(null); 
    setDragOverId(null);
  };

  const formUrl = typeof window !== 'undefined' ? `${window.location.origin}/request` : '/request';
  const copyLink = () => { navigator.clipboard.writeText(formUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fa', color: '#5f6368' }}>Ładowanie...</div>;

  return (
    <div className="min-h-screen flex" style={{ background: '#f8f9fa' }}>
      {/* Google-style sidebar */}
      <aside className="w-56 flex flex-col min-h-screen flex-shrink-0 border-r bg-white" style={{ borderColor: '#e8eaed' }}>
        <div className="p-4 border-b" style={{ borderColor: '#e8eaed' }}>
          <img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="Angloville" className="h-7" />
          <p className="mt-1 text-xs" style={{ color: '#5f6368' }}>Marketing Tasks</p>
        </div>
        
        <div className="p-3 border-b space-y-2" style={{ borderColor: '#e8eaed' }}>
          <select value={filterMarket} onChange={(e) => setFilterMarket(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm border transition-colors focus:border-blue-500" style={{ borderColor: '#dadce0', color: '#202124' }}>
            <option value="all">Wszystkie rynki</option>
            {MARKETS.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
          </select>
          {isManager && (
            <select value={filterPerson} onChange={(e) => setFilterPerson(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm border transition-colors focus:border-blue-500" style={{ borderColor: '#dadce0', color: '#202124' }}>
              <option value="all">Wszyscy</option>
              {TEAM_MEMBERS.filter(m => !m.isManager).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          )}
        </div>

        <div className="p-2 flex-1">
          <div className="space-y-0.5">
            {isManager && pendingTasks.length > 0 && (
              <button onClick={() => setActiveTab('pending')} className="w-full flex items-center justify-between px-3 py-2 rounded-full text-sm transition-colors" style={{ background: activeTab === 'pending' ? '#fef7e0' : 'transparent', color: activeTab === 'pending' ? '#b06000' : '#202124' }}>
                <div className="flex items-center gap-3"><AlertCircle size={18} style={{ color: '#fbbc04' }} /><span>Oczekujące</span></div>
                <span className="font-medium" style={{ color: '#fbbc04' }}>{pendingTasks.length}</span>
              </button>
            )}
            <button onClick={() => { setActiveTab('tasks'); setFilterStatus('active'); }} className="w-full flex items-center justify-between px-3 py-2 rounded-full text-sm transition-colors" style={{ background: activeTab === 'tasks' && filterStatus === 'active' ? '#e8f0fe' : 'transparent', color: activeTab === 'tasks' && filterStatus === 'active' ? '#1a73e8' : '#202124' }}>
              <div className="flex items-center gap-3"><Filter size={18} style={{ color: '#1a73e8' }} /><span>Aktywne</span></div>
              <span className="font-medium">{openTasks.length + longtermTasks.length}</span>
            </button>
            <button onClick={() => { setActiveTab('tasks'); setFilterStatus('open'); }} className="w-full flex items-center justify-between px-3 py-2 rounded-full text-sm transition-colors" style={{ background: activeTab === 'tasks' && filterStatus === 'open' ? '#e8f0fe' : 'transparent', color: '#202124' }}>
              <div className="flex items-center gap-3 pl-2"><Circle size={16} style={{ color: '#4285f4' }} /><span>Otwarte</span></div>
              <span style={{ color: '#5f6368' }}>{openTasks.length}</span>
            </button>
            <button onClick={() => { setActiveTab('tasks'); setFilterStatus('longterm'); }} className="w-full flex items-center justify-between px-3 py-2 rounded-full text-sm transition-colors" style={{ background: activeTab === 'tasks' && filterStatus === 'longterm' ? '#f3e8fd' : 'transparent', color: '#202124' }}>
              <div className="flex items-center gap-3 pl-2"><Clock size={16} style={{ color: '#a142f4' }} /><span>Long-term</span></div>
              <span style={{ color: '#5f6368' }}>{longtermTasks.length}</span>
            </button>
            <button onClick={() => { setActiveTab('tasks'); setFilterStatus('closed'); }} className="w-full flex items-center justify-between px-3 py-2 rounded-full text-sm transition-colors" style={{ background: activeTab === 'tasks' && filterStatus === 'closed' ? '#e6f4ea' : 'transparent', color: '#202124' }}>
              <div className="flex items-center gap-3 pl-2"><CheckCircle size={16} style={{ color: '#34a853' }} /><span>Zamknięte</span></div>
              <span style={{ color: '#5f6368' }}>{closedTasks.length}</span>
            </button>
          </div>

          <div className="mt-4 mx-2 p-3 rounded-lg text-xs" style={{ background: '#f1f3f4' }}>
            <p className="mb-1.5" style={{ color: '#5f6368' }}>Formularz EN:</p>
            <button onClick={copyLink} className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200 transition-colors">
              <code className="flex-1 text-xs truncate" style={{ color: '#1a73e8' }}>/request</code>
              {copied ? <Check size={14} style={{ color: '#34a853' }} /> : <Copy size={14} style={{ color: '#5f6368' }} />}
            </button>
          </div>

          {/* Quick Links Section - only for manager */}
          {isManager && <QuickLinksSection />}
        </div>

        <div className="p-3 border-t" style={{ borderColor: '#e8eaed' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: currentMember?.color }}>{getInitials(currentMember?.name || '')}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: '#202124' }}>{currentMember?.name?.split(' ')[0]}</div>
              {isManager && <div className="text-xs" style={{ color: '#5f6368' }}>Manager</div>}
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-full hover:bg-gray-100" style={{ color: '#5f6368' }}><LogOut size={18} /></button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between" style={{ borderColor: '#e8eaed' }}>
          <div>
            <h2 className="text-lg font-medium" style={{ color: '#202124' }}>
              {activeTab === 'pending' ? 'Oczekujące na akceptację' : 
               filterStatus === 'active' ? 'Aktywne zadania' :
               filterStatus === 'open' ? 'Otwarte zadania' :
               filterStatus === 'longterm' ? 'Zadania long-term' :
               filterStatus === 'closed' ? 'Zamknięte zadania' :
               'Wszystkie zadania'}
            </h2>
            {filterPerson !== 'all' && <p className="text-xs" style={{ color: '#5f6368' }}>Filtr: {TEAM_MEMBERS.find(m => m.id === filterPerson)?.name}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadTasks} className="p-2 rounded-full hover:bg-gray-100" style={{ color: '#5f6368' }}><Loader2 size={18} className={loading ? 'animate-spin' : ''} /></button>
            {activeTab === 'tasks' && <button onClick={() => setShowNewTask(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors hover:shadow-md" style={{ background: '#1a73e8', color: 'white' }}><Plus size={18} /> Nowe zadanie</button>}
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'pending' && isManager ? (
            <PendingView tasks={pendingTasks} approveTask={approveTask} deleteTask={deleteTask} />
          ) : (
            <div className="max-w-4xl mx-auto">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-16"><CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#34a853', opacity: 0.4 }} /><p style={{ color: '#5f6368' }}>Brak zadań do wyświetlenia</p></div>
              ) : (
                <div className="space-y-1">
                  {filteredTasks.map(t => (
                    <TaskItem 
                      key={t.id} 
                      task={t} 
                      isSelected={selectedTask?.id === t.id} 
                      onClick={() => setSelectedTask(t)} 
                      onStatusChange={(s) => updateTask(t.id, { status: s })} 
                      onDragStart={handleDragStart} 
                      onDragOver={handleDragOver} 
                      onDrop={handleDrop} 
                      onDragEnd={handleDragEnd} 
                      isDragging={draggedTask?.id === t.id}
                      dragOverId={dragOverId}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      {selectedTask && <TaskDetail task={selectedTask} updateTask={updateTask} deleteTask={deleteTask} onClose={() => setSelectedTask(null)} currentUser={currentUser} isManager={isManager} />}
      {showNewTask && <NewTaskModal onClose={() => setShowNewTask(false)} onSave={addTask} currentUser={currentUser} />}
    </div>
  );
}

function PendingView({ tasks, approveTask, deleteTask }) {
  const [selected, setSelected] = useState({});
  const toggle = (taskId, memberId) => { setSelected(p => { const curr = p[taskId] || []; return { ...p, [taskId]: curr.includes(memberId) ? curr.filter(x => x !== memberId) : [...curr, memberId] }; }); };
  if (!tasks.length) return <div className="max-w-3xl mx-auto text-center py-16"><CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#34a853', opacity: 0.4 }} /><p style={{ color: '#5f6368' }}>Brak oczekujących</p></div>;
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {tasks.map(task => {
        const market = MARKETS.find(m => m.id === task.market);
        const assignees = selected[task.id] || task.assignees || [];
        return (
          <div key={task.id} className="bg-white rounded-xl p-5 border" style={{ borderColor: '#e8eaed' }}>
            {task.isExternal && <div className="flex items-center gap-2 mb-3 pb-3 border-b" style={{ borderColor: '#e8eaed' }}><ExternalLink size={14} style={{ color: '#fbbc04' }} /><span className="text-xs font-medium" style={{ color: '#b06000' }}>Zewnętrzne</span>{task.language === 'en' && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#e8f0fe', color: '#1a73e8' }}>🇬🇧</span>}<span className="text-xs" style={{ color: '#9aa0a6' }}>od {task.submittedBy}</span></div>}
            <div className="flex items-start gap-3 mb-4"><span className="text-xl">{market?.icon}</span><div className="flex-1"><div className="flex items-center gap-2"><h3 className="font-medium text-lg" style={{ color: '#202124' }}>{task.title}</h3><TranslateButton task={task} /></div>{task.description && <div className="mt-2"><RichTextDisplay html={task.description} /></div>}{task.links && <div className="mt-3 p-3 rounded-lg" style={{ background: '#f8f9fa' }}><ClickableLinks text={task.links} /></div>}</div></div>
            <div className="mb-4"><p className="text-xs font-medium mb-2" style={{ color: '#5f6368' }}>Przypisz:</p><div className="flex flex-wrap gap-2">{TEAM_MEMBERS.filter(m => !m.isManager).map(m => <button key={m.id} onClick={() => toggle(task.id, m.id)} className="flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition-all" style={{ borderColor: assignees.includes(m.id) ? '#1a73e8' : '#dadce0', background: assignees.includes(m.id) ? '#e8f0fe' : 'white', color: assignees.includes(m.id) ? '#1a73e8' : '#202124' }}><div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: m.color }}>{getInitials(m.name)}</div><span>{m.name.split(' ')[0]}</span>{assignees.includes(m.id) && <Check size={14} />}</button>)}</div></div>
            <div className="flex gap-2 pt-4 border-t" style={{ borderColor: '#e8eaed' }}><button onClick={() => approveTask(task, assignees)} disabled={!assignees.length} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium disabled:opacity-50 transition-colors" style={{ background: assignees.length ? '#1a73e8' : '#f1f3f4', color: assignees.length ? 'white' : '#9aa0a6' }}><Check size={18} /> Zatwierdź</button><button onClick={() => deleteTask(task.id)} className="px-4 py-2.5 rounded-lg hover:bg-red-50 transition-colors" style={{ color: '#ea4335', border: '1px solid #f5c6cb' }}><X size={18} /></button></div>
          </div>
        );
      })}
    </div>
  );
}

// COMPACT TaskItem - single row, no description
function TaskItem({ task, isSelected, onClick, onStatusChange, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, dragOverId }) {
  const market = MARKETS.find(m => m.id === task.market);
  const status = STATUSES.find(s => s.id === task.status);
  const Icon = status?.icon || Circle;
  const cycle = (e) => { e.stopPropagation(); onStatusChange(task.status === 'open' ? 'closed' : 'open'); };
  const isDropTarget = dragOverId === task.id;
  
  return (
    <div 
      onClick={onClick} 
      draggable 
      onDragStart={(e) => onDragStart(e, task)} 
      onDragOver={(e) => onDragOver(e, task)} 
      onDrop={(e) => onDrop(e, task)} 
      onDragEnd={onDragEnd} 
      className="bg-white rounded-lg px-3 py-2.5 cursor-pointer transition-all hover:shadow-sm border" 
      style={{ 
        borderColor: isSelected ? '#1a73e8' : isDropTarget ? '#4285f4' : '#e8eaed', 
        opacity: isDragging ? 0.4 : 1,
        borderTopWidth: isDropTarget ? '3px' : '1px',
        borderTopColor: isDropTarget ? '#4285f4' : undefined,
      }}
    >
      <div className="flex items-center gap-2">
        <GripVertical size={14} style={{ color: '#dadce0' }} className="cursor-grab flex-shrink-0" />
        <button onClick={cycle} className="hover:scale-110 transition-transform flex-shrink-0">
          <Icon size={18} style={{ color: status?.color }} className={task.status === 'closed' ? 'fill-current' : ''} />
        </button>
        <span className="flex-shrink-0">{market?.icon}</span>
        <h4 className="font-medium text-sm flex-1 min-w-0 truncate" style={{ color: task.status === 'closed' ? '#9aa0a6' : '#202124', textDecoration: task.status === 'closed' ? 'line-through' : 'none' }}>
          {task.title}
        </h4>
        <div className="flex items-center gap-2 flex-shrink-0">
          {task.isExternal && <ExternalLink size={12} style={{ color: '#fbbc04' }} />}
          {task.language === 'en' && <TranslateButton task={task} size="small" />}
          {task.status === 'longterm' && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#f3e8fd', color: '#a142f4' }}>LT</span>}
          <div className="flex -space-x-1">
            {task.assignees?.slice(0, 3).map(aId => { 
              const m = TEAM_MEMBERS.find(x => x.id === aId); 
              return m && <div key={aId} className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium border border-white" style={{ background: m.color }} title={m.name}>{getInitials(m.name)}</div>; 
            })}
            {task.assignees?.length > 3 && <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium border border-white" style={{ background: '#e8eaed', color: '#5f6368' }}>+{task.assignees.length - 3}</div>}
          </div>
          {task.comments?.length > 0 && <div className="flex items-center gap-0.5" style={{ color: '#9aa0a6' }}><MessageSquare size={12} /><span className="text-xs">{task.comments.length}</span></div>}
          <SubtaskProgress subtasks={task.subtasks} />
          <ChevronRight size={16} style={{ color: '#dadce0' }} />
        </div>
      </div>
    </div>
  );
}

// Wider task detail panel - Google Docs style
function TaskDetail({ task, updateTask, deleteTask, onClose, currentUser, isManager }) {
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: task.title, description: task.description || '' });
  const [newSubtask, setNewSubtask] = useState('');
  const [subtaskAssignee, setSubtaskAssignee] = useState('');
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  
  const market = MARKETS.find(m => m.id === task.market);
  const me = TEAM_MEMBERS.find(m => m.id === currentUser);
  const subtasks = task.subtasks || [];
  const canEdit = isManager || task.createdBy === currentUser;

  const addComment = () => { if (!comment.trim()) return; updateTask(task.id, { comments: [...(task.comments || []), { id: generateId(), text: comment.trim(), author: currentUser, createdAt: new Date().toISOString() }] }); setComment(''); };
  const editComment = (commentId) => { const c = task.comments?.find(x => x.id === commentId); if (c) { setEditingCommentId(commentId); setEditingCommentText(c.text); } };
  const saveCommentEdit = () => { if (!editingCommentText.trim()) return; updateTask(task.id, { comments: (task.comments || []).map(c => c.id === editingCommentId ? { ...c, text: editingCommentText.trim(), editedAt: new Date().toISOString() } : c) }); setEditingCommentId(null); setEditingCommentText(''); };
  const deleteComment = (commentId) => { if (confirm('Usunąć?')) updateTask(task.id, { comments: (task.comments || []).filter(c => c.id !== commentId) }); };
  const save = () => { updateTask(task.id, { title: form.title, description: form.description }); setEditing(false); };
  const addSubtask = () => { if (!newSubtask.trim()) return; updateTask(task.id, { subtasks: [...subtasks, { id: generateId(), title: newSubtask.trim(), assignee: subtaskAssignee || null, status: 'open', createdAt: new Date().toISOString() }] }); setNewSubtask(''); setSubtaskAssignee(''); setShowSubtaskForm(false); };
  const toggleSubtask = (subId) => { updateTask(task.id, { subtasks: subtasks.map(s => s.id === subId ? { ...s, status: s.status === 'open' ? 'closed' : 'open' } : s) }); };
  const deleteSubtask = (subId) => { updateTask(task.id, { subtasks: subtasks.filter(s => s.id !== subId) }); };
  const updateSubtaskAssignee = (subId, assigneeId) => { updateTask(task.id, { subtasks: subtasks.map(s => s.id === subId ? { ...s, assignee: assigneeId || null } : s) }); };

  return (
    <aside className="w-[640px] bg-white border-l flex flex-col overflow-hidden flex-shrink-0" style={{ borderColor: '#e8eaed' }}>
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#e8eaed' }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{market?.icon}</span>
          <span className="text-sm font-medium" style={{ color: '#202124' }}>{market?.name}</span>
          {task.isExternal && <ExternalLink size={14} style={{ color: '#fbbc04' }} />}
          {task.language === 'en' && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#e8f0fe', color: '#1a73e8' }}>🇬🇧</span>}
        </div>
        <div className="flex items-center gap-1">
          {task.language === 'en' && <TranslateButton task={task} />}
          {canEdit && <><button onClick={() => setEditing(!editing)} className="p-2 rounded-full hover:bg-gray-100" style={{ color: '#5f6368' }}><Edit3 size={18} /></button><button onClick={() => deleteTask(task.id)} className="p-2 rounded-full hover:bg-red-50" style={{ color: '#5f6368' }}><Trash2 size={18} /></button></>}
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100" style={{ color: '#5f6368' }}><X size={18} /></button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {task.isExternal && <div className="p-3 rounded-lg" style={{ background: '#fef7e0', border: '1px solid #feefc3' }}><p className="text-sm" style={{ color: '#b06000' }}>📨 Od: <strong>{task.submittedBy}</strong> {task.submitterEmail && `(${task.submitterEmail})`}</p></div>}
        
        {editing ? (
          <div className="space-y-3">
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-lg font-medium transition-colors focus:border-blue-500" style={{ borderColor: '#dadce0', color: '#202124' }} />
            <RichTextEditor value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Opis zadania..." minHeight="200px" />
            <div className="flex gap-2">
              <button onClick={save} className="flex-1 py-2 rounded-lg font-medium text-sm" style={{ background: '#1a73e8', color: 'white' }}>Zapisz</button>
              <button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-lg text-sm" style={{ background: '#f1f3f4', color: '#5f6368' }}>Anuluj</button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="font-medium text-xl mb-3" style={{ color: '#202124' }}>{task.title}</h3>
            <RichTextDisplay html={task.description} />
          </div>
        )}
        
        {/* Clickable links */}
        {task.links && (
          <div>
            <label className="block mb-2 text-xs font-medium" style={{ color: '#5f6368' }}>Linki</label>
            <div className="rounded-lg border p-1" style={{ background: '#f8f9fa', borderColor: '#e8eaed' }}>
              <ClickableLinks text={task.links} />
            </div>
          </div>
        )}
        
        {/* Subtasks */}
        <div>
          <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><ListTodo size={18} style={{ color: '#5f6368' }} /><label className="text-sm font-medium" style={{ color: '#202124' }}>Subtaski ({subtasks.filter(s => s.status === 'closed').length}/{subtasks.length})</label></div>{!showSubtaskForm && <button onClick={() => setShowSubtaskForm(true)} className="text-sm flex items-center gap-1 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors" style={{ color: '#1a73e8' }}><Plus size={16} /> Dodaj</button>}</div>
          <div className="space-y-1">{subtasks.map(sub => { const assignee = TEAM_MEMBERS.find(m => m.id === sub.assignee); const isDone = sub.status === 'closed'; return <div key={sub.id} className="flex items-center gap-2 px-3 py-2 rounded-lg group hover:bg-gray-50 transition-colors"><button onClick={() => toggleSubtask(sub.id)} className="flex-shrink-0">{isDone ? <CheckSquare size={20} style={{ color: '#34a853' }} /> : <Square size={20} style={{ color: '#dadce0' }} />}</button><span className="flex-1 text-sm" style={{ color: isDone ? '#9aa0a6' : '#202124', textDecoration: isDone ? 'line-through' : 'none' }}>{sub.title}</span>{assignee ? <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: assignee.color }} title={assignee.name}>{getInitials(assignee.name)}</div> : <select onChange={(e) => updateSubtaskAssignee(sub.id, e.target.value)} className="text-xs px-2 py-1 rounded border opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: '#dadce0', color: '#5f6368' }} value=""><option value="">+ Przypisz</option>{TEAM_MEMBERS.filter(m => !m.isManager).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>}<button onClick={() => deleteSubtask(sub.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-full transition-all" style={{ color: '#ea4335' }}><X size={16} /></button></div>; })}</div>
          {showSubtaskForm && <div className="mt-3 p-3 rounded-lg border" style={{ borderColor: '#1a73e8', background: '#f8fbff' }}><input type="text" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSubtask()} placeholder="Nazwa subtaska..." className="w-full px-3 py-2 border rounded-lg text-sm mb-2 transition-colors focus:border-blue-500" style={{ borderColor: '#dadce0' }} autoFocus /><div className="flex items-center gap-2"><select value={subtaskAssignee} onChange={(e) => setSubtaskAssignee(e.target.value)} className="flex-1 px-2 py-1.5 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }}><option value="">Bez przypisania</option>{TEAM_MEMBERS.filter(m => !m.isManager).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select><button onClick={addSubtask} className="px-4 py-1.5 rounded-lg text-sm font-medium" style={{ background: '#1a73e8', color: 'white' }}>Dodaj</button><button onClick={() => { setShowSubtaskForm(false); setNewSubtask(''); }} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: '#5f6368' }}>Anuluj</button></div></div>}
        </div>
        
        {/* Status */}
        <div><label className="block mb-2 text-sm font-medium" style={{ color: '#202124' }}>Status</label><div className="flex flex-wrap gap-2">{STATUSES.filter(s => s.id !== 'pending').map(s => <button key={s.id} onClick={() => updateTask(task.id, { status: s.id })} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all" style={{ background: task.status === s.id ? s.bg : '#f1f3f4', color: task.status === s.id ? s.color : '#5f6368', border: task.status === s.id ? `2px solid ${s.color}` : '2px solid transparent' }}><s.icon size={16} /> {s.name}</button>)}</div></div>
        
        {/* Assignees */}
        <div><label className="block mb-2 text-sm font-medium" style={{ color: '#202124' }}>Przypisani</label><div className="flex flex-wrap gap-2">{task.assignees?.map(aId => { const m = TEAM_MEMBERS.find(x => x.id === aId); return m && <div key={aId} className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: '#f1f3f4' }}><div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: m.color }}>{getInitials(m.name)}</div><span className="text-sm" style={{ color: '#202124' }}>{m.name}</span>{canEdit && <button onClick={() => updateTask(task.id, { assignees: task.assignees.filter(a => a !== aId) })} className="hover:text-red-500 transition-colors" style={{ color: '#9aa0a6' }}><X size={14} /></button>}</div>; })}{canEdit && <select onChange={(e) => { if (e.target.value && !task.assignees?.includes(e.target.value)) { updateTask(task.id, { assignees: [...(task.assignees || []), e.target.value] }); const m = TEAM_MEMBERS.find(x => x.id === e.target.value); if (m) sendEmailNotification(m.email, m.name, task.title, me?.name); } e.target.value = ''; }} className="rounded-full px-3 py-1.5 text-sm cursor-pointer" style={{ background: '#f1f3f4', border: '1px dashed #dadce0', color: '#5f6368' }} defaultValue=""><option value="">+ Dodaj</option>{TEAM_MEMBERS.filter(m => !task.assignees?.includes(m.id)).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>}</div></div>
        
        {/* Comments */}
        <div>
          <label className="block mb-3 text-sm font-medium" style={{ color: '#202124' }}>Komentarze ({task.comments?.length || 0})</label>
          <div className="space-y-3 mb-4">{task.comments?.map(c => { const author = TEAM_MEMBERS.find(m => m.id === c.author); const isMyComment = c.author === currentUser; if (editingCommentId === c.id) return <div key={c.id} className="flex gap-3"><div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ background: author?.color || '#9aa0a6' }}>{getInitials(author?.name || '?')}</div><div className="flex-1"><input type="text" value={editingCommentText} onChange={(e) => setEditingCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveCommentEdit()} className="w-full px-3 py-2 border rounded-lg text-sm mb-2 transition-colors focus:border-blue-500" style={{ borderColor: '#1a73e8' }} autoFocus /><div className="flex gap-2"><button onClick={saveCommentEdit} className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: '#1a73e8', color: 'white' }}>Zapisz</button><button onClick={() => { setEditingCommentId(null); setEditingCommentText(''); }} className="text-xs px-3 py-1 rounded-full" style={{ color: '#5f6368' }}>Anuluj</button></div></div></div>; return <div key={c.id} className="flex gap-3 group"><div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ background: author?.color || '#9aa0a6' }}>{getInitials(author?.name || '?')}</div><div className="flex-1"><div className="rounded-2xl px-4 py-2" style={{ background: '#f1f3f4' }}><div className="flex items-center justify-between mb-1"><div className="flex items-center gap-2"><span className="text-sm font-medium" style={{ color: '#202124' }}>{author?.name || 'Nieznany'}</span><span className="text-xs" style={{ color: '#9aa0a6' }}>{formatDateTime(c.createdAt)}</span>{c.editedAt && <span className="text-xs italic" style={{ color: '#9aa0a6' }}>(edytowano)</span>}</div>{isMyComment && <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => editComment(c.id)} className="p-1 rounded-full hover:bg-gray-200" style={{ color: '#5f6368' }}><Edit3 size={14} /></button><button onClick={() => deleteComment(c.id)} className="p-1 rounded-full hover:bg-red-50" style={{ color: '#ea4335' }}><Trash2 size={14} /></button></div>}</div><p className="text-sm" style={{ color: '#3c4043' }}>{c.text}</p></div></div></div>; })}</div>
          <div className="flex gap-2"><input type="text" value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addComment()} placeholder="Napisz komentarz..." className="flex-1 px-4 py-2.5 rounded-full text-sm transition-colors focus:border-blue-500" style={{ background: '#f1f3f4', border: '1px solid #e8eaed' }} /><button onClick={addComment} className="p-2.5 rounded-full transition-colors hover:shadow-md" style={{ background: '#1a73e8', color: 'white' }}><Send size={18} /></button></div>
        </div>
        
        <div className="pt-4 border-t text-xs" style={{ borderColor: '#e8eaed', color: '#9aa0a6' }}><p>Utworzono: {formatDateTime(task.createdAt)}</p>{task.createdBy && <p>Przez: {TEAM_MEMBERS.find(m => m.id === task.createdBy)?.name}</p>}</div>
      </div>
    </aside>
  );
}

function NewTaskModal({ onClose, onSave, currentUser }) {
  const [form, setForm] = useState({ title: '', description: '', market: 'pl', status: 'open', assignees: [currentUser], comments: [] });
  const toggle = (id) => setForm(p => ({ ...p, assignees: p.assignees.includes(id) ? p.assignees.filter(a => a !== id) : [...p.assignees, id] }));
  const save = () => { if (form.title.trim()) onSave(form); };
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ boxShadow: '0 24px 38px 3px rgba(0,0,0,.14), 0 9px 46px 8px rgba(0,0,0,.12), 0 11px 15px -7px rgba(0,0,0,.2)' }} onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#e8eaed' }}><h3 className="text-lg font-medium" style={{ color: '#202124' }}>Nowe zadanie</h3><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100" style={{ color: '#5f6368' }}><X size={22} /></button></div>
        <div className="p-5 space-y-4">
          <div><label className="text-sm font-medium block mb-1.5" style={{ color: '#202124' }}>Tytuł *</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 border rounded-lg text-sm transition-colors focus:border-blue-500" style={{ borderColor: '#dadce0' }} placeholder="Co trzeba zrobić?" autoFocus /></div>
          <div><label className="text-sm font-medium block mb-1.5" style={{ color: '#202124' }}>Opis</label><RichTextEditor value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Szczegóły zadania..." minHeight="200px" /></div>
          <div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-medium block mb-1.5" style={{ color: '#202124' }}>Rynek</label><select value={form.market} onChange={(e) => setForm({ ...form, market: e.target.value })} className="w-full px-4 py-2.5 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }}>{MARKETS.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}</select></div><div><label className="text-sm font-medium block mb-1.5" style={{ color: '#202124' }}>Typ</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }}><option value="open">Otwarte</option><option value="longterm">Long-term</option></select></div></div>
          <div><label className="text-sm font-medium block mb-2" style={{ color: '#202124' }}>Przypisz do</label><div className="flex flex-wrap gap-2">{TEAM_MEMBERS.map(m => <button key={m.id} onClick={() => toggle(m.id)} className="flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition-all" style={{ borderColor: form.assignees.includes(m.id) ? '#1a73e8' : '#dadce0', background: form.assignees.includes(m.id) ? '#e8f0fe' : 'white', color: form.assignees.includes(m.id) ? '#1a73e8' : '#202124' }}><div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: m.color }}>{getInitials(m.name)}</div><span>{m.name}</span>{form.assignees.includes(m.id) && <Check size={14} />}</button>)}</div></div>
        </div>
        <div className="p-5 border-t flex justify-end gap-3" style={{ borderColor: '#e8eaed' }}><button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100" style={{ color: '#5f6368' }}>Anuluj</button><button onClick={save} className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors hover:shadow-md" style={{ background: '#1a73e8', color: 'white' }}>Utwórz zadanie</button></div>
      </div>
    </div>
  );
}
