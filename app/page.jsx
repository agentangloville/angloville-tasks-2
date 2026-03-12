'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, X, Edit3, Trash2, CheckCircle, Circle, Send, MessageSquare, ChevronDown, ChevronRight, Clock, AlertCircle, ExternalLink, Copy, Languages, Loader2, ListTodo, Square, CheckSquare, Bold, Italic, List, ListOrdered, LogOut, Lock, GripVertical, User, Filter } from 'lucide-react';
import { getTasks, createTask, updateTask as updateTaskDb, deleteTask as deleteTaskDb } from '../lib/supabase';

const TEAM_MEMBERS = [
  { id: 'edyta', name: 'Edyta Kędzior', email: 'e.kedzior@angloville.pl', isManager: true, color: '#428BCA', pin: '1234' },
  { id: 'aleksandra', name: 'Aleksandra Witkowska', email: 'a.witkowska@angloville.com', color: '#8b5cf6', pin: '2345' },
  { id: 'damian_l', name: 'Damian Ładak', email: 'd.ladak@angloville.pl', color: '#10b981', pin: '3456' },
  { id: 'damian_w', name: 'Damian Wójcicki', email: 'd.wojcicki@angloville.com', color: '#f59e0b', pin: '4567' },
  { id: 'wojciech', name: 'Wojciech Pisarski', email: 'w.pisarski@angloville.com', color: '#ef4444', pin: '5678' },
  { id: 'klaudia', name: 'Klaudia Gołembiowska', email: 'k.golembiowska@angloville.com', color: '#ec4899', pin: '6789' },
];

const MARKETS = [
  { id: 'pl', name: 'Polska', icon: '🇵🇱' },
  { id: 'ns', name: 'Native Speakers', icon: '🇬🇧' },
  { id: 'it', name: 'Włochy', icon: '🇮🇹' },
  { id: 'exchange', name: 'Wymiana', icon: '🇺🇸' },
];

const STATUSES = [
  { id: 'pending', name: 'Oczekujące', icon: AlertCircle, color: '#f59e0b', bg: '#fef3c7' },
  { id: 'open', name: 'Otwarte', icon: Circle, color: '#428BCA', bg: '#e8f4fc' },
  { id: 'longterm', name: 'Long-term', icon: Clock, color: '#8b5cf6', bg: '#f3f0ff' },
  { id: 'closed', name: 'Zamknięte', icon: CheckCircle, color: '#22c55e', bg: '#ecfdf5' },
];

const getInitials = (name) => {
  const parts = name.split(' ');
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return name[0];
};

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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F5F5F5' }}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-lg">
        <div className="text-center mb-8">
          <img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="Angloville" className="h-10 mx-auto mb-4" style={{ filter: 'brightness(0)' }} />
          <h1 className="text-xl font-bold" style={{ color: '#232323' }}>Marketing Tasks</h1>
          <p className="text-sm mt-1" style={{ color: '#666' }}>Zaloguj się do panelu</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="p-3 rounded-lg text-sm text-center" style={{ background: '#fef2f2', color: '#dc2626' }}>{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#444' }}>Osoba</label>
            <select value={selectedUser} onChange={(e) => { setSelectedUser(e.target.value); setError(''); }} className="w-full px-4 py-3 border rounded-xl text-sm" style={{ borderColor: '#ddd' }}>
              <option value="">Wybierz...</option>
              {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#444' }}>PIN</label>
            <input type="password" value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }} className="w-full px-4 py-3 border rounded-xl text-sm text-center tracking-widest" style={{ borderColor: '#ddd' }} placeholder="••••" maxLength={4} inputMode="numeric" />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2" style={{ background: '#FCD23A', color: '#232323' }}><Lock size={18} />Zaloguj</button>
        </form>
      </div>
    </div>
  );
}

function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);
  useEffect(() => { if (editorRef.current && editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value || ''; }, [value]);
  const execCommand = (command) => { document.execCommand(command, false, null); editorRef.current?.focus(); handleChange(); };
  const handleChange = () => { if (editorRef.current) onChange(editorRef.current.innerHTML); };
  return (
    <div className="border rounded-xl overflow-hidden" style={{ borderColor: '#ddd' }}>
      <div className="flex items-center gap-1 p-2 border-b" style={{ background: '#f9f9f9', borderColor: '#eee' }}>
        <button type="button" onClick={() => execCommand('bold')} className="p-1.5 rounded hover:bg-gray-200"><Bold size={16} style={{ color: '#555' }} /></button>
        <button type="button" onClick={() => execCommand('italic')} className="p-1.5 rounded hover:bg-gray-200"><Italic size={16} style={{ color: '#555' }} /></button>
        <div className="w-px h-5 mx-1" style={{ background: '#ddd' }} />
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-1.5 rounded hover:bg-gray-200"><List size={16} style={{ color: '#555' }} /></button>
        <button type="button" onClick={() => execCommand('insertOrderedList')} className="p-1.5 rounded hover:bg-gray-200"><ListOrdered size={16} style={{ color: '#555' }} /></button>
      </div>
      <div ref={editorRef} contentEditable onInput={handleChange} onBlur={handleChange} className="px-4 py-3 min-h-[100px] text-sm focus:outline-none" style={{ color: '#333' }} data-placeholder={placeholder} suppressContentEditableWarning />
      <style jsx>{`[contenteditable]:empty:before { content: attr(data-placeholder); color: #999; }`}</style>
    </div>
  );
}

function RichTextDisplay({ html }) {
  if (!html) return null;
  return <div className="text-sm leading-relaxed prose prose-sm max-w-none" style={{ color: '#555' }} dangerouslySetInnerHTML={{ __html: html }} />;
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#eee' }}><div className="flex items-center gap-2"><Languages size={20} style={{ color: '#428BCA' }} /><h3 className="font-semibold" style={{ color: '#232323' }}>Tłumaczenie na polski</h3></div><button onClick={onClose} className="p-1 rounded hover:bg-gray-100" style={{ color: '#999' }}><X size={18} /></button></div>
        <div className="p-5 space-y-4">
          {loading ? <div className="flex items-center justify-center py-8"><Loader2 size={24} className="animate-spin" style={{ color: '#428BCA' }} /><span className="ml-2 text-sm" style={{ color: '#666' }}>Tłumaczenie...</span></div> : <>
            <div><label className="block text-xs font-medium mb-1" style={{ color: '#999' }}>Tytuł</label><div className="p-3 rounded-lg" style={{ background: '#e8f4fc', border: '1px solid #428BCA' }}><p className="text-sm font-medium" style={{ color: '#232323' }}>{translatedTitle}</p></div></div>
            {translatedDesc && <div><label className="block text-xs font-medium mb-1" style={{ color: '#999' }}>Opis</label><div className="p-3 rounded-lg" style={{ background: '#e8f4fc', border: '1px solid #428BCA' }}><p className="text-sm" style={{ color: '#444' }}>{translatedDesc}</p></div></div>}
            <p className="text-xs pt-2" style={{ color: '#999' }}>🇬🇧 → 🇵🇱 Tłumaczenie automatyczne</p>
          </>}
        </div>
      </div>
    </div>
  );
}

function TranslateButton({ task, size = 'normal' }) {
  const [showPopup, setShowPopup] = useState(false);
  if (task.language !== 'en') return null;
  return <><button onClick={(e) => { e.stopPropagation(); setShowPopup(true); }} className={`${size === 'small' ? 'p-1' : 'p-1.5'} rounded-lg hover:bg-blue-50 transition-colors`} style={{ color: '#428BCA' }} title="Przetłumacz na polski"><Languages size={size === 'small' ? 14 : 16} /></button>{showPopup && <TranslationPopup title={task.title} description={task.description} onClose={() => setShowPopup(false)} />}</>;
}

function SubtaskProgress({ subtasks }) {
  if (!subtasks || subtasks.length === 0) return null;
  const done = subtasks.filter(s => s.status === 'closed').length;
  const total = subtasks.length;
  return <div className="flex items-center gap-2" title={`${done}/${total} subtasków`}><div className="flex items-center gap-1" style={{ color: '#666' }}><ListTodo size={14} /><span className="text-xs font-medium">{done}/{total}</span></div><div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: '#e5e5e5' }}><div className="h-full rounded-full transition-all" style={{ width: `${Math.round((done / total) * 100)}%`, background: done === total ? '#22c55e' : '#428BCA' }} /></div></div>;
}

const generateId = () => Math.random().toString(36).substr(2, 9);
const formatDateTime = (date) => new Date(date).toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

async function sendEmailNotification(to, assigneeName, taskTitle, assignedBy) {
  try { await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, assigneeName, taskTitle, assignedBy }) }); } catch (e) { console.log('Email skipped:', e); }
}

export default function TaskApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [filterMarket, setFilterMarket] = useState('all');
  const [filterPerson, setFilterPerson] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active'); // 'all', 'active', 'open', 'longterm', 'closed'
  const [activeTab, setActiveTab] = useState('tasks');
  const [copied, setCopied] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [draggedTask, setDraggedTask] = useState(null);

  useEffect(() => { const savedUser = localStorage.getItem('av_tasks_user'); if (savedUser && TEAM_MEMBERS.find(m => m.id === savedUser)) setCurrentUser(savedUser); setCheckingAuth(false); }, []);
  
  const loadTasks = async () => { 
    const data = await getTasks(); 
    // Sort by order field if exists, otherwise by createdAt
    const sorted = data.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    setTasks(sorted); 
    setLoading(false); 
  };
  
  useEffect(() => { if (currentUser) loadTasks(); }, [currentUser]);
  const handleLogout = () => { localStorage.removeItem('av_tasks_user'); setCurrentUser(null); setTasks([]); setSelectedTask(null); };

  if (checkingAuth) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F5F5' }}><Loader2 className="animate-spin" size={32} style={{ color: '#428BCA' }} /></div>;
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
  
  const deleteTask = async (id) => { if (confirm('Usunąć?')) { setTasks(prev => prev.filter(t => t.id !== id)); setSelectedTask(null); await deleteTaskDb(id); } };
  
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

  // Drag and drop handlers
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetTask) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.id === targetTask.id) return;
    
    // Only allow reordering within same status
    if (draggedTask.status !== targetTask.status) return;
    
    const statusTasks = tasks.filter(t => t.status === draggedTask.status);
    const draggedIndex = statusTasks.findIndex(t => t.id === draggedTask.id);
    const targetIndex = statusTasks.findIndex(t => t.id === targetTask.id);
    
    // Reorder
    const newStatusTasks = [...statusTasks];
    newStatusTasks.splice(draggedIndex, 1);
    newStatusTasks.splice(targetIndex, 0, draggedTask);
    
    // Update order for all affected tasks
    const updates = newStatusTasks.map((t, idx) => ({ id: t.id, order: idx }));
    
    // Optimistic update
    setTasks(prev => {
      const otherTasks = prev.filter(t => t.status !== draggedTask.status);
      const reorderedTasks = newStatusTasks.map((t, idx) => ({ ...t, order: idx }));
      return [...otherTasks, ...reorderedTasks].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
        return 0;
      });
    });
    
    // Save to DB
    for (const u of updates) {
      await updateTaskDb(u.id, { order: u.order });
    }
    
    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const formUrl = typeof window !== 'undefined' ? `${window.location.origin}/request` : '/request';
  const copyLink = () => { navigator.clipboard.writeText(formUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F5F5', color: '#666' }}>Ładowanie...</div>;

  return (
    <div className="min-h-screen flex font-sans" style={{ background: '#F5F5F5' }}>
      <aside className="w-64 flex flex-col min-h-screen" style={{ background: '#232323' }}>
        <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="Angloville" className="h-8" /><p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.52)' }}>Marketing Tasks</p></div>
        
        {/* Filters */}
        <div className="p-4 border-b space-y-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div>
            <label className="block mb-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.52)' }}>Rynek</label>
            <select value={filterMarket} onChange={(e) => setFilterMarket(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.82)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <option value="all" style={{ background: '#232323' }}>Wszystkie rynki</option>
              {MARKETS.map(m => <option key={m.id} value={m.id} style={{ background: '#232323' }}>{m.icon} {m.name}</option>)}
            </select>
          </div>
          
          {isManager && (
            <div>
              <label className="block mb-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.52)' }}>Osoba</label>
              <select value={filterPerson} onChange={(e) => setFilterPerson(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.82)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <option value="all" style={{ background: '#232323' }}>Wszyscy</option>
                {TEAM_MEMBERS.filter(m => !m.isManager).map(m => <option key={m.id} value={m.id} style={{ background: '#232323' }}>{m.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="p-4 flex-1">
          {/* Status filters */}
          <div className="space-y-2">
            {isManager && pendingTasks.length > 0 && (
              <button onClick={() => setActiveTab('pending')} className="w-full flex items-center justify-between p-3 rounded-lg" style={{ background: activeTab === 'pending' ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.15)' }}>
                <div className="flex items-center gap-2"><AlertCircle size={16} style={{ color: '#f59e0b' }} /><span className="text-sm" style={{ color: 'rgba(255,255,255,0.82)' }}>Oczekujące</span></div>
                <span className="text-lg font-bold" style={{ color: '#f59e0b' }}>{pendingTasks.length}</span>
              </button>
            )}
            
            <button onClick={() => { setActiveTab('tasks'); setFilterStatus('active'); }} className="w-full flex items-center justify-between p-3 rounded-lg" style={{ background: activeTab === 'tasks' && filterStatus === 'active' ? 'rgba(66,139,202,0.25)' : 'rgba(66,139,202,0.15)' }}>
              <div className="flex items-center gap-2"><Filter size={16} style={{ color: '#428BCA' }} /><span className="text-sm" style={{ color: 'rgba(255,255,255,0.82)' }}>Aktywne</span></div>
              <span className="text-lg font-bold" style={{ color: '#428BCA' }}>{openTasks.length + longtermTasks.length}</span>
            </button>
            
            <button onClick={() => { setActiveTab('tasks'); setFilterStatus('open'); }} className="w-full flex items-center justify-between p-3 rounded-lg" style={{ background: activeTab === 'tasks' && filterStatus === 'open' ? 'rgba(66,139,202,0.25)' : 'transparent' }}>
              <div className="flex items-center gap-2 pl-2"><Circle size={14} style={{ color: '#428BCA' }} /><span className="text-sm" style={{ color: 'rgba(255,255,255,0.62)' }}>Otwarte</span></div>
              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.62)' }}>{openTasks.length}</span>
            </button>
            
            <button onClick={() => { setActiveTab('tasks'); setFilterStatus('longterm'); }} className="w-full flex items-center justify-between p-3 rounded-lg" style={{ background: activeTab === 'tasks' && filterStatus === 'longterm' ? 'rgba(139,92,246,0.25)' : 'transparent' }}>
              <div className="flex items-center gap-2 pl-2"><Clock size={14} style={{ color: '#8b5cf6' }} /><span className="text-sm" style={{ color: 'rgba(255,255,255,0.62)' }}>Long-term</span></div>
              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.62)' }}>{longtermTasks.length}</span>
            </button>
            
            <button onClick={() => { setActiveTab('tasks'); setFilterStatus('closed'); }} className="w-full flex items-center justify-between p-3 rounded-lg" style={{ background: activeTab === 'tasks' && filterStatus === 'closed' ? 'rgba(34,197,94,0.25)' : 'transparent' }}>
              <div className="flex items-center gap-2 pl-2"><CheckCircle size={14} style={{ color: '#22c55e' }} /><span className="text-sm" style={{ color: 'rgba(255,255,255,0.62)' }}>Zamknięte</span></div>
              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.62)' }}>{closedTasks.length}</span>
            </button>
            
            <button onClick={() => { setActiveTab('tasks'); setFilterStatus('all'); }} className="w-full flex items-center justify-between p-3 rounded-lg" style={{ background: activeTab === 'tasks' && filterStatus === 'all' ? 'rgba(255,255,255,0.15)' : 'transparent' }}>
              <div className="flex items-center gap-2 pl-2"><span className="text-sm" style={{ color: 'rgba(255,255,255,0.52)' }}>Wszystkie</span></div>
              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.52)' }}>{visibleTasks.length}</span>
            </button>
          </div>

          <div className="mt-6 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)' }}>
            <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.52)' }}>Link do formularza (EN):</p>
            <button onClick={copyLink} className="w-full flex items-center gap-2 p-2 rounded text-left hover:bg-white/5">
              <code className="flex-1 text-xs truncate" style={{ color: '#FCD23A' }}>/request</code>
              {copied ? <Check size={14} style={{ color: '#22c55e' }} /> : <Copy size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />}
            </button>
          </div>
        </div>

        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ background: currentMember?.color, border: isManager ? '2px solid #FCD23A' : 'none' }}>{getInitials(currentMember?.name || '')}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,0.82)' }}>{currentMember?.name}</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.52)' }}>{isManager ? '⭐ Manager' : ''}</div>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.5)' }} title="Wyloguj"><LogOut size={18} /></button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: '#eee' }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: '#232323' }}>
              {activeTab === 'pending' ? 'Oczekujące na akceptację' : 
               filterStatus === 'active' ? 'Aktywne zadania' :
               filterStatus === 'open' ? 'Otwarte zadania' :
               filterStatus === 'longterm' ? 'Zadania long-term' :
               filterStatus === 'closed' ? 'Zamknięte zadania' :
               'Wszystkie zadania'}
            </h2>
            {filterPerson !== 'all' && (
              <p className="text-sm" style={{ color: '#666' }}>
                Filtr: {TEAM_MEMBERS.find(m => m.id === filterPerson)?.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadTasks} className="p-2 rounded-lg hover:bg-gray-100" style={{ color: '#666' }} title="Odśwież"><Loader2 size={18} className={loading ? 'animate-spin' : ''} /></button>
            {activeTab === 'tasks' && <button onClick={() => setShowNewTask(true)} className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm"><Plus size={18} /> Nowe zadanie</button>}
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'pending' && isManager ? (
            <PendingView tasks={pendingTasks} approveTask={approveTask} deleteTask={deleteTask} />
          ) : (
            <div className="max-w-3xl mx-auto">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#22c55e', opacity: 0.4 }} />
                  <p style={{ color: '#666' }}>Brak zadań do wyświetlenia</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs mb-3" style={{ color: '#999' }}>
                    <GripVertical size={12} className="inline mr-1" />
                    Przeciągnij zadanie, aby zmienić kolejność
                  </p>
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
  if (!tasks.length) return <div className="max-w-3xl mx-auto text-center py-16"><CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#22c55e', opacity: 0.4 }} /><p style={{ color: '#666' }}>Brak oczekujących zgłoszeń</p></div>;
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {tasks.map(task => {
        const market = MARKETS.find(m => m.id === task.market);
        const assignees = selected[task.id] || task.assignees || [];
        return (
          <div key={task.id} className="card p-5">
            {task.isExternal && <div className="flex items-center gap-2 mb-3 pb-3 border-b" style={{ borderColor: '#eee' }}><ExternalLink size={14} style={{ color: '#f59e0b' }} /><span className="text-xs font-medium" style={{ color: '#f59e0b' }}>Zgłoszenie zewnętrzne</span>{task.language === 'en' && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#e8f4fc', color: '#428BCA' }}>🇬🇧 EN</span>}<span className="text-xs" style={{ color: '#999' }}>od {task.submittedBy}</span>{task.submitterEmail && <a href={`mailto:${task.submitterEmail}`} className="text-xs" style={{ color: '#428BCA' }}>{task.submitterEmail}</a>}</div>}
            <div className="flex items-start gap-3 mb-4"><span className="text-xl">{market?.icon}</span><div className="flex-1"><div className="flex items-center gap-2"><h3 className="font-semibold text-lg" style={{ color: '#232323' }}>{task.title}</h3><TranslateButton task={task} /></div>{task.description && <div className="mt-2"><RichTextDisplay html={task.description} /></div>}{task.links && <div className="mt-3 p-3 rounded-lg" style={{ background: '#F5F5F5' }}><p className="text-xs font-medium mb-1" style={{ color: '#999' }}>Linki:</p><pre className="text-sm whitespace-pre-wrap break-all" style={{ color: '#428BCA' }}>{task.links}</pre></div>}</div></div>
            <div className="mb-4"><p className="text-xs font-medium mb-2" style={{ color: '#999' }}>Przypisz do:</p><div className="flex flex-wrap gap-2">{TEAM_MEMBERS.filter(m => !m.isManager).map(m => <button key={m.id} onClick={() => toggle(task.id, m.id)} className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: assignees.includes(m.id) ? '#428BCA' : '#ddd', background: assignees.includes(m.id) ? '#e8f4fc' : 'white', color: assignees.includes(m.id) ? '#428BCA' : '#555' }}><div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: m.color }}>{getInitials(m.name)}</div><span>{m.name}</span>{assignees.includes(m.id) && <Check size={14} />}</button>)}</div></div>
            <div className="flex gap-2 pt-4 border-t" style={{ borderColor: '#eee' }}><button onClick={() => approveTask(task, assignees)} disabled={!assignees.length} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium disabled:opacity-50" style={{ background: assignees.length ? '#FCD23A' : '#eee', color: '#232323' }}><Check size={18} /> Zatwierdź {assignees.length > 0 && `(${assignees.length})`}</button><button onClick={() => deleteTask(task.id)} className="px-4 py-2.5 rounded-lg hover:bg-red-50" style={{ color: '#ef4444', border: '1px solid #fecaca' }}><X size={18} /></button></div>
          </div>
        );
      })}
    </div>
  );
}

function TaskItem({ task, isSelected, onClick, onStatusChange, onDragStart, onDragOver, onDrop, onDragEnd, isDragging }) {
  const market = MARKETS.find(m => m.id === task.market);
  const status = STATUSES.find(s => s.id === task.status);
  const Icon = status?.icon || Circle;
  const cycle = (e) => { e.stopPropagation(); onStatusChange(task.status === 'open' ? 'closed' : 'open'); };
  const plainDescription = task.description?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  return (
    <div 
      onClick={onClick} 
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, task)}
      onDragEnd={onDragEnd}
      className="card p-4 cursor-pointer transition-all hover:shadow-md"
      style={{ 
        border: isSelected ? '2px solid #428BCA' : '2px solid transparent',
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-1">
          <GripVertical size={16} style={{ color: '#ccc' }} className="cursor-grab active:cursor-grabbing" />
          <button onClick={cycle} className="hover:scale-110 transition-transform">
            <Icon size={22} style={{ color: status?.color }} className={task.status === 'closed' ? 'fill-current' : ''} />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{market?.icon}</span>
            <h4 className="font-medium" style={{ color: task.status === 'closed' ? '#999' : '#232323', textDecoration: task.status === 'closed' ? 'line-through' : 'none' }}>{task.title}</h4>
            {task.isExternal && <ExternalLink size={14} style={{ color: '#f59e0b' }} />}
            {task.language === 'en' && <TranslateButton task={task} size="small" />}
            {task.status === 'longterm' && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#f3f0ff', color: '#8b5cf6' }}>Long-term</span>}
          </div>
          {plainDescription && <p className="text-sm line-clamp-1 mb-2" style={{ color: '#666' }}>{plainDescription}</p>}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex -space-x-1.5">
              {task.assignees?.slice(0, 4).map(aId => { 
                const m = TEAM_MEMBERS.find(x => x.id === aId); 
                return m && <div key={aId} className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white" style={{ background: m.color }} title={m.name}>{getInitials(m.name)}</div>; 
              })}
            </div>
            {task.comments?.length > 0 && <div className="flex items-center gap-1" style={{ color: '#999' }}><MessageSquare size={14} /><span className="text-xs">{task.comments.length}</span></div>}
            <SubtaskProgress subtasks={task.subtasks} />
          </div>
        </div>
        <ChevronRight size={18} style={{ color: '#ccc' }} />
      </div>
    </div>
  );
}

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

  const addComment = () => { 
    if (!comment.trim()) return; 
    updateTask(task.id, { comments: [...(task.comments || []), { id: generateId(), text: comment.trim(), author: currentUser, createdAt: new Date().toISOString() }] }); 
    setComment(''); 
  };
  
  const editComment = (commentId) => {
    const c = task.comments?.find(x => x.id === commentId);
    if (c) {
      setEditingCommentId(commentId);
      setEditingCommentText(c.text);
    }
  };
  
  const saveCommentEdit = () => {
    if (!editingCommentText.trim()) return;
    const updatedComments = (task.comments || []).map(c => 
      c.id === editingCommentId ? { ...c, text: editingCommentText.trim(), editedAt: new Date().toISOString() } : c
    );
    updateTask(task.id, { comments: updatedComments });
    setEditingCommentId(null);
    setEditingCommentText('');
  };
  
  const deleteComment = (commentId) => {
    if (confirm('Usunąć komentarz?')) {
      updateTask(task.id, { comments: (task.comments || []).filter(c => c.id !== commentId) });
    }
  };
  
  const save = () => { updateTask(task.id, { title: form.title, description: form.description }); setEditing(false); };
  const addSubtask = () => { if (!newSubtask.trim()) return; updateTask(task.id, { subtasks: [...subtasks, { id: generateId(), title: newSubtask.trim(), assignee: subtaskAssignee || null, status: 'open', createdAt: new Date().toISOString() }] }); setNewSubtask(''); setSubtaskAssignee(''); setShowSubtaskForm(false); };
  const toggleSubtask = (subId) => { updateTask(task.id, { subtasks: subtasks.map(s => s.id === subId ? { ...s, status: s.status === 'open' ? 'closed' : 'open' } : s) }); };
  const deleteSubtask = (subId) => { updateTask(task.id, { subtasks: subtasks.filter(s => s.id !== subId) }); };
  const updateSubtaskAssignee = (subId, assigneeId) => { updateTask(task.id, { subtasks: subtasks.map(s => s.id === subId ? { ...s, assignee: assigneeId || null } : s) }); };

  return (
    <aside className="w-[420px] bg-white border-l flex flex-col overflow-hidden" style={{ borderColor: '#eee' }}>
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#eee' }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{market?.icon}</span>
          <span className="text-sm font-medium" style={{ color: '#555' }}>{market?.name}</span>
          {task.isExternal && <ExternalLink size={14} style={{ color: '#f59e0b' }} />}
          {task.language === 'en' && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#e8f4fc', color: '#428BCA' }}>🇬🇧 EN</span>}
        </div>
        <div className="flex items-center gap-1">
          {task.language === 'en' && <TranslateButton task={task} />}
          {canEdit && <>
            <button onClick={() => setEditing(!editing)} className="p-2 rounded-lg hover:bg-gray-100" style={{ color: '#666' }}><Edit3 size={16} /></button>
            <button onClick={() => deleteTask(task.id)} className="p-2 rounded-lg hover:bg-red-50" style={{ color: '#666' }}><Trash2 size={16} /></button>
          </>}
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" style={{ color: '#666' }}><X size={16} /></button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {task.isExternal && <div className="p-3 rounded-lg" style={{ background: '#fef3c7', border: '1px solid #fcd34d' }}><p className="text-xs font-medium" style={{ color: '#92400e' }}>Zgłoszone przez: {task.submittedBy}</p>{task.submitterEmail && <p className="text-xs" style={{ color: '#92400e' }}>{task.submitterEmail}</p>}</div>}
        
        {editing ? (
          <div className="space-y-3">
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#ddd' }} />
            <RichTextEditor value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Opis zadania..." />
            <div className="flex gap-2">
              <button onClick={save} className="btn-primary flex-1 py-2 rounded-lg text-sm">Zapisz</button>
              <button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-lg text-sm" style={{ background: '#F5F5F5', color: '#555' }}>Anuluj</button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="font-semibold text-lg mb-2" style={{ color: '#232323' }}>{task.title}</h3>
            <RichTextDisplay html={task.description} />
          </div>
        )}
        
        {task.links && <div><label className="block mb-2 text-xs font-medium" style={{ color: '#999' }}>Linki</label><div className="p-3 rounded-lg" style={{ background: '#F5F5F5' }}><pre className="text-sm whitespace-pre-wrap break-all" style={{ color: '#428BCA' }}>{task.links}</pre></div></div>}
        
        {/* Subtasks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><ListTodo size={16} style={{ color: '#666' }} /><label className="text-xs font-medium" style={{ color: '#999' }}>Subtaski ({subtasks.filter(s => s.status === 'closed').length}/{subtasks.length})</label></div>
            {!showSubtaskForm && <button onClick={() => setShowSubtaskForm(true)} className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100" style={{ color: '#428BCA' }}><Plus size={14} /> Dodaj</button>}
          </div>
          <div className="space-y-2">
            {subtasks.map(sub => { 
              const assignee = TEAM_MEMBERS.find(m => m.id === sub.assignee); 
              const isDone = sub.status === 'closed'; 
              return (
                <div key={sub.id} className="flex items-center gap-2 p-2 rounded-lg group" style={{ background: '#F9F9F9' }}>
                  <button onClick={() => toggleSubtask(sub.id)} className="flex-shrink-0">{isDone ? <CheckSquare size={18} style={{ color: '#22c55e' }} /> : <Square size={18} style={{ color: '#ccc' }} />}</button>
                  <span className="flex-1 text-sm" style={{ color: isDone ? '#999' : '#444', textDecoration: isDone ? 'line-through' : 'none' }}>{sub.title}</span>
                  {assignee ? <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: assignee.color }} title={assignee.name}>{getInitials(assignee.name)}</div> : 
                    <select onChange={(e) => updateSubtaskAssignee(sub.id, e.target.value)} className="text-xs px-1 py-0.5 rounded border opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: '#ddd', color: '#666' }} value=""><option value="">+ Przypisz</option>{TEAM_MEMBERS.filter(m => !m.isManager).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>}
                  <button onClick={() => deleteSubtask(sub.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded" style={{ color: '#ef4444' }}><X size={14} /></button>
                </div>
              ); 
            })}
          </div>
          {showSubtaskForm && (
            <div className="mt-3 p-3 rounded-lg border" style={{ borderColor: '#428BCA', background: '#f8fbff' }}>
              <input type="text" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSubtask()} placeholder="Nazwa subtaska..." className="w-full px-3 py-2 border rounded-lg text-sm mb-2" style={{ borderColor: '#ddd' }} autoFocus />
              <div className="flex items-center gap-2">
                <select value={subtaskAssignee} onChange={(e) => setSubtaskAssignee(e.target.value)} className="flex-1 px-2 py-1.5 border rounded-lg text-sm" style={{ borderColor: '#ddd' }}><option value="">Bez przypisania</option>{TEAM_MEMBERS.filter(m => !m.isManager).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
                <button onClick={addSubtask} className="btn-primary px-3 py-1.5 rounded-lg text-sm">Dodaj</button>
                <button onClick={() => { setShowSubtaskForm(false); setNewSubtask(''); }} className="px-2 py-1.5 rounded-lg text-sm" style={{ color: '#666' }}>Anuluj</button>
              </div>
            </div>
          )}
        </div>
        
        {/* Status */}
        <div>
          <label className="block mb-2 text-xs font-medium" style={{ color: '#999' }}>Status</label>
          <div className="flex flex-wrap gap-2">
            {STATUSES.filter(s => s.id !== 'pending').map(s => (
              <button key={s.id} onClick={() => updateTask(task.id, { status: s.id })} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium" style={{ background: task.status === s.id ? s.bg : '#F5F5F5', color: task.status === s.id ? s.color : '#666', border: task.status === s.id ? `2px solid ${s.color}` : '2px solid transparent' }}>
                <s.icon size={16} /> {s.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Assignees */}
        <div>
          <label className="block mb-2 text-xs font-medium" style={{ color: '#999' }}>Przypisani</label>
          <div className="flex flex-wrap gap-2">
            {task.assignees?.map(aId => { 
              const m = TEAM_MEMBERS.find(x => x.id === aId); 
              return m && (
                <div key={aId} className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: '#F5F5F5' }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: m.color }}>{getInitials(m.name)}</div>
                  <span className="text-sm" style={{ color: '#444' }}>{m.name}</span>
                  {canEdit && <button onClick={() => updateTask(task.id, { assignees: task.assignees.filter(a => a !== aId) })} className="hover:text-red-500" style={{ color: '#999' }}><X size={14} /></button>}
                </div>
              ); 
            })}
            {canEdit && (
              <select onChange={(e) => { if (e.target.value && !task.assignees?.includes(e.target.value)) { updateTask(task.id, { assignees: [...(task.assignees || []), e.target.value] }); const m = TEAM_MEMBERS.find(x => x.id === e.target.value); if (m) sendEmailNotification(m.email, m.name, task.title, me?.name); } e.target.value = ''; }} className="rounded-full px-3 py-1.5 text-sm" style={{ background: '#F5F5F5', border: '1px dashed #ccc', color: '#666' }} defaultValue="">
                <option value="">+ Dodaj osobę</option>
                {TEAM_MEMBERS.filter(m => !task.assignees?.includes(m.id)).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            )}
          </div>
        </div>
        
        {/* Comments with edit */}
        <div>
          <label className="block mb-3 text-xs font-medium" style={{ color: '#999' }}>Komentarze ({task.comments?.length || 0})</label>
          <div className="space-y-3 mb-4">
            {task.comments?.map(c => { 
              const author = TEAM_MEMBERS.find(m => m.id === c.author);
              const isMyComment = c.author === currentUser;
              
              if (editingCommentId === c.id) {
                return (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ background: author?.color || '#999' }}>{getInitials(author?.name || '?')}</div>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={editingCommentText} 
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveCommentEdit()}
                        className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
                        style={{ borderColor: '#428BCA' }}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button onClick={saveCommentEdit} className="text-xs px-2 py-1 rounded" style={{ background: '#428BCA', color: 'white' }}>Zapisz</button>
                        <button onClick={() => { setEditingCommentId(null); setEditingCommentText(''); }} className="text-xs px-2 py-1 rounded" style={{ color: '#666' }}>Anuluj</button>
                      </div>
                    </div>
                  </div>
                );
              }
              
              return (
                <div key={c.id} className="flex gap-3 group">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ background: author?.color || '#999' }}>{getInitials(author?.name || '?')}</div>
                  <div className="flex-1">
                    <div className="rounded-xl p-3" style={{ background: '#F5F5F5' }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: '#444' }}>{author?.name || 'Nieznany'}</span>
                          <span className="text-xs" style={{ color: '#999' }}>{formatDateTime(c.createdAt)}</span>
                          {c.editedAt && <span className="text-xs italic" style={{ color: '#999' }}>(edytowano)</span>}
                        </div>
                        {isMyComment && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => editComment(c.id)} className="p-1 rounded hover:bg-gray-200" style={{ color: '#666' }}><Edit3 size={12} /></button>
                            <button onClick={() => deleteComment(c.id)} className="p-1 rounded hover:bg-red-50" style={{ color: '#ef4444' }}><Trash2 size={12} /></button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: '#555' }}>{c.text}</p>
                    </div>
                  </div>
                </div>
              ); 
            })}
          </div>
          <div className="flex gap-2">
            <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addComment()} placeholder="Napisz komentarz..." className="flex-1 px-4 py-2.5 rounded-xl text-sm" style={{ background: '#F5F5F5', border: '1px solid #eee' }} />
            <button onClick={addComment} className="btn-primary p-2.5 rounded-xl"><Send size={18} /></button>
          </div>
        </div>
        
        <div className="pt-4 border-t text-xs" style={{ borderColor: '#eee', color: '#999' }}>
          <p>Utworzono: {formatDateTime(task.createdAt)}</p>
          {task.createdBy && <p>Przez: {TEAM_MEMBERS.find(m => m.id === task.createdBy)?.name}</p>}
        </div>
      </div>
    </aside>
  );
}

function NewTaskModal({ onClose, onSave, currentUser }) {
  const [form, setForm] = useState({ title: '', description: '', market: 'pl', status: 'open', assignees: [currentUser], comments: [] });
  const toggle = (id) => setForm(p => ({ ...p, assignees: p.assignees.includes(id) ? p.assignees.filter(a => a !== id) : [...p.assignees, id] }));
  const save = () => { if (form.title.trim()) onSave(form); };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#eee' }}><h3 className="text-lg font-semibold" style={{ color: '#232323' }}>Nowe zadanie</h3><button onClick={onClose} style={{ color: '#999' }}><X size={20} /></button></div>
        <div className="p-5 space-y-4">
          <div><label className="text-sm font-medium block mb-1.5" style={{ color: '#444' }}>Tytuł *</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl text-sm" style={{ borderColor: '#ddd' }} placeholder="Co trzeba zrobić?" autoFocus /></div>
          <div><label className="text-sm font-medium block mb-1.5" style={{ color: '#444' }}>Opis</label><RichTextEditor value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Szczegóły zadania..." /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium block mb-1.5" style={{ color: '#444' }}>Rynek</label><select value={form.market} onChange={(e) => setForm({ ...form, market: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl text-sm" style={{ borderColor: '#ddd' }}>{MARKETS.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}</select></div>
            <div><label className="text-sm font-medium block mb-1.5" style={{ color: '#444' }}>Typ</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl text-sm" style={{ borderColor: '#ddd' }}><option value="open">Otwarte</option><option value="longterm">Long-term</option></select></div>
          </div>
          <div><label className="text-sm font-medium block mb-2" style={{ color: '#444' }}>Przypisz do</label><div className="flex flex-wrap gap-2">{TEAM_MEMBERS.map(m => <button key={m.id} onClick={() => toggle(m.id)} className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm" style={{ borderColor: form.assignees.includes(m.id) ? '#428BCA' : '#ddd', background: form.assignees.includes(m.id) ? '#e8f4fc' : 'white', color: form.assignees.includes(m.id) ? '#428BCA' : '#555' }}><div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: m.color }}>{getInitials(m.name)}</div><span>{m.name}</span>{form.assignees.includes(m.id) && <Check size={14} />}</button>)}</div></div>
        </div>
        <div className="p-5 border-t flex justify-end gap-3" style={{ borderColor: '#eee' }}><button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100" style={{ color: '#666' }}>Anuluj</button><button onClick={save} className="btn-primary px-5 py-2.5 rounded-xl text-sm font-medium">Utwórz zadanie</button></div>
      </div>
    </div>
  );
}
