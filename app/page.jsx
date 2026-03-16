'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Plus, Check, X, Edit3, Trash2, CheckCircle, Circle, Send, MessageSquare, ChevronDown, ChevronRight, Clock, AlertCircle, ExternalLink, Copy, Languages, Loader2, ListTodo, Square, CheckSquare, Bold, Italic, List, ListOrdered, LogOut, Lock, GripVertical, Filter, Underline, Link2, Undo, Redo, Bell, BellOff, Inbox, Sparkles, Mail, MailCheck, MailX, RefreshCw, Paperclip, File, FileText, Image, FileSpreadsheet, Download, Eye, Flag } from 'lucide-react';
import { getTasks, createTask, updateTask as updateTaskDb, deleteTask as deleteTaskDb, getQuickLinks, createQuickLink, updateQuickLink, deleteQuickLink, uploadFile } from '../lib/supabase';

const TEAM_MEMBERS = [
  { id: 'edyta', name: 'Edyta Kędzior', email: 'e.kedzior@angloville.pl', isManager: true, color: '#4285f4', pin: '1234' },
  { id: 'aleksandra', name: 'Aleksandra Witkowska', email: 'a.witkowska@angloville.com', color: '#a142f4', pin: '2345' },
  { id: 'damian_l', name: 'Damian Ładak', email: 'd.ladak@angloville.pl', color: '#34a853', pin: '3456' },
  { id: 'damian_w', name: 'Damian Wójcicki', email: 'd.wojcicki@angloville.com', color: '#fbbc04', pin: '4567' },
  { id: 'wojciech', name: 'Wojciech Pisarski', email: 'w.pisarski@angloville.com', color: '#ea4335', pin: '5678' },
  { id: 'klaudia', name: 'Klaudia Gołembiowska', email: 'k.golembiowska@angloville.com', color: '#e91e63', pin: '6789' },
  { id: 'rohan', name: 'Raj Patel', email: 'r.patel@angloville.com', color: '#00acc1', pin: '7890', restrictedToMarket: 'ns', language: 'en' },
];

const MARKETS = [
  { id: 'pl', name: 'Polska', nameEn: 'Poland', icon: '🇵🇱' },
  { id: 'ns', name: 'Native Speakers', nameEn: 'Native Speakers', icon: '🇬🇧' },
  { id: 'it', name: 'Włochy', nameEn: 'Italy', icon: '🇮🇹' },
  { id: 'exchange', name: 'Wymiana', nameEn: 'Exchange', icon: '🎓' },
];

const PL_SUBCATEGORIES = [
  { id: 'adult', name: 'Adult', color: '#1a73e8', bg: '#e8f0fe' },
  { id: 'junior', name: 'Junior', color: '#e91e63', bg: '#fce4ec' },
];

const PRIORITIES = [
  { id: null, name: 'Brak', nameEn: 'None', color: '#9aa0a6', bg: '#f1f3f4' },
  { id: 'low', name: 'Niski', nameEn: 'Low', color: '#34a853', bg: '#e6f4ea' },
  { id: 'medium', name: 'Średni', nameEn: 'Medium', color: '#fbbc04', bg: '#fef7e0' },
  { id: 'high', name: 'Wysoki', nameEn: 'High', color: '#ea4335', bg: '#fce8e6' },
  { id: 'urgent', name: 'Pilny', nameEn: 'Urgent', color: '#d93025', bg: '#fce8e6' },
];

const STATUSES = [
  { id: 'pending', name: 'Oczekujące', nameEn: 'Pending', icon: AlertCircle, color: '#fbbc04', bg: '#fef7e0' },
  { id: 'open', name: 'Otwarte', nameEn: 'Open', icon: Circle, color: '#4285f4', bg: '#e8f0fe' },
  { id: 'longterm', name: 'Long-term', nameEn: 'Long-term', icon: Clock, color: '#a142f4', bg: '#f3e8fd' },
  { id: 'closed', name: 'Zamknięte', nameEn: 'Closed', icon: CheckCircle, color: '#34a853', bg: '#e6f4ea' },
];

const EMAIL_TYPES = {
  completed: { label: 'Zakończenie', icon: CheckCircle, color: '#34a853' },
  comment: { label: 'Komentarz', icon: MessageSquare, color: '#1a73e8' },
  assigned: { label: 'Przypisanie', icon: Mail, color: '#fbbc04' },
};

// =============================================
// TRANSLATIONS
// =============================================
const TRANSLATIONS = {
  pl: {
    marketingTasks: 'Marketing Tasks',
    loginTitle: 'Zaloguj się do panelu',
    person: 'Osoba',
    select: 'Wybierz...',
    pin: 'PIN',
    login: 'Zaloguj się',
    incorrectPin: 'Nieprawidłowy PIN',
    selectPerson: 'Wybierz osobę',
    allMarkets: 'Wszystkie rynki',
    everyone: 'Wszyscy',
    newTasks: 'Nowe zadania',
    unread: 'Nieodczytane',
    pending: 'Oczekujące',
    active: 'Aktywne',
    open: 'Otwarte',
    longterm: 'Long-term',
    closed: 'Zamknięte',
    formEn: 'Formularz EN:',
    myLinks: '📌 Moje linki',
    addLink: 'Dodaj link',
    noLinks: 'Brak linków',
    manager: 'Manager',
    pendingApproval: 'Oczekujące na akceptację',
    activeTasks: 'Aktywne zadania',
    openTasks: 'Otwarte zadania',
    longtermTasks: 'Zadania long-term',
    closedTasks: 'Zamknięte zadania',
    allTasks: 'Wszystkie zadania',
    filter: 'Filtr',
    newTask: 'Nowe zadanie',
    noTasksToShow: 'Brak zadań do wyświetlenia',
    noPending: 'Brak oczekujących',
    external: 'Zewnętrzne',
    assignTo: 'Przypisz:',
    approve: 'Zatwierdź',
    title: 'Tytuł',
    description: 'Opis',
    attachments: 'Załączniki',
    noAttachments: 'Brak załączników',
    subtasks: 'Subtaski',
    add: 'Dodaj',
    subtaskName: 'Nazwa subtaska...',
    noAssignment: 'Bez przypisania',
    cancel: 'Anuluj',
    status: 'Status',
    subcategory: 'Podkategoria',
    none: 'Brak',
    assigned: 'Przypisani',
    addPerson: '+ Dodaj',
    comments: 'Komentarze',
    markUnread: 'Oznacz nieprzeczytane',
    edit: 'Edytuj',
    delete: 'Usuń',
    writeComment: 'Napisz komentarz...',
    emailNotifications: 'Powiadomienia email',
    submittedBy: 'Zgłaszający',
    unknown: 'Nieznany',
    noEmail: 'Brak adresu email',
    history: 'Historia:',
    by: 'przez',
    system: 'System',
    resend: 'Wyślij ponownie',
    sendEmail: 'Wyślij email',
    created: 'Utworzono',
    byPerson: 'Przez',
    save: 'Zapisz',
    taskDetails: 'Szczegóły zadania...',
    whatToDo: 'Co trzeba zrobić?',
    market: 'Rynek',
    type: 'Typ',
    assignToPerson: 'Przypisz do',
    createTask: 'Utwórz zadanie',
    links: 'Linki',
    copyLink: 'Kopiuj link',
    copied: 'Skopiowano',
    from: 'Od',
    priority: 'Priorytet',
    clickToAddAttachments: 'Kliknij 📎 aby dodać załączniki',
    loading: 'Ładowanie...',
    deleteTask: 'Usunąć zadanie?',
    lt: 'LT',
    new: 'Nowy',
  },
  en: {
    marketingTasks: 'Marketing Tasks',
    loginTitle: 'Login to panel',
    person: 'Person',
    select: 'Select...',
    pin: 'PIN',
    login: 'Login',
    incorrectPin: 'Incorrect PIN',
    selectPerson: 'Select person',
    allMarkets: 'All markets',
    everyone: 'Everyone',
    newTasks: 'New tasks',
    unread: 'Unread',
    pending: 'Pending',
    active: 'Active',
    open: 'Open',
    longterm: 'Long-term',
    closed: 'Closed',
    formEn: 'EN Form:',
    myLinks: '📌 My links',
    addLink: 'Add link',
    noLinks: 'No links',
    manager: 'Manager',
    pendingApproval: 'Pending approval',
    activeTasks: 'Active tasks',
    openTasks: 'Open tasks',
    longtermTasks: 'Long-term tasks',
    closedTasks: 'Closed tasks',
    allTasks: 'All tasks',
    filter: 'Filter',
    newTask: 'New task',
    noTasksToShow: 'No tasks to display',
    noPending: 'No pending tasks',
    external: 'External',
    assignTo: 'Assign to:',
    approve: 'Approve',
    title: 'Title',
    description: 'Description',
    attachments: 'Attachments',
    noAttachments: 'No attachments',
    subtasks: 'Subtasks',
    add: 'Add',
    subtaskName: 'Subtask name...',
    noAssignment: 'Unassigned',
    cancel: 'Cancel',
    status: 'Status',
    subcategory: 'Subcategory',
    none: 'None',
    assigned: 'Assigned',
    addPerson: '+ Add',
    comments: 'Comments',
    markUnread: 'Mark as unread',
    edit: 'Edit',
    delete: 'Delete',
    writeComment: 'Write a comment...',
    emailNotifications: 'Email notifications',
    submittedBy: 'Submitted by',
    unknown: 'Unknown',
    noEmail: 'No email address',
    history: 'History:',
    by: 'by',
    system: 'System',
    resend: 'Resend',
    sendEmail: 'Send email',
    created: 'Created',
    byPerson: 'By',
    save: 'Save',
    taskDetails: 'Task details...',
    whatToDo: 'What needs to be done?',
    market: 'Market',
    type: 'Type',
    assignToPerson: 'Assign to',
    createTask: 'Create task',
    links: 'Links',
    copyLink: 'Copy link',
    copied: 'Copied',
    from: 'From',
    priority: 'Priority',
    clickToAddAttachments: 'Click 📎 to add attachments',
    loading: 'Loading...',
    deleteTask: 'Delete task?',
    lt: 'LT',
    new: 'New',
  }
};

const getInitials = (name) => {
  const parts = name.split(' ');
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return name[0];
};

// =============================================
// PRIORITY BADGE
// =============================================
function PriorityBadge({ priority, size = 'normal', lang = 'pl' }) {
  if (!priority) return null;
  const p = PRIORITIES.find(pr => pr.id === priority);
  if (!p || !p.id) return null;
  
  const isSmall = size === 'small';
  
  return (
    <span 
      className={`inline-flex items-center gap-1 ${isSmall ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'} rounded-full font-medium`}
      style={{ background: p.bg, color: p.color }}
    >
      <Flag size={isSmall ? 10 : 12} />
      {lang === 'en' ? p.nameEn : p.name}
    </span>
  );
}

// =============================================
// LINKIFY TEXT - zamienia URL-e na klikalne linki
// =============================================
function LinkifiedText({ text, className = '', style = {} }) {
  if (!text) return null;
  
  const urlRegex = /(https?:\/\/[^\s<]+[^\s<.,;:!?'"\])>])/gi;
  const parts = text.split(urlRegex);
  
  return (
    <span className={className} style={style}>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          let label = part;
          try {
            const urlObj = new URL(part);
            if (urlObj.hostname.includes('docs.google.com')) label = 'Google Docs';
            else if (urlObj.hostname.includes('drive.google.com')) label = 'Google Drive';
            else if (urlObj.hostname.includes('sheets.google.com')) label = 'Google Sheets';
            else if (urlObj.hostname.includes('slides.google.com')) label = 'Google Slides';
            else label = urlObj.hostname.replace('www.', '');
          } catch {}
          
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:underline"
              style={{ color: '#1a73e8' }}
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={12} className="inline flex-shrink-0" />
              <span>{label}</span>
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

// =============================================
// FILE HELPERS
// =============================================
const getFileIcon = (type) => {
  if (type?.startsWith('image/')) return Image;
  if (type?.includes('spreadsheet') || type?.includes('excel') || type?.includes('csv')) return FileSpreadsheet;
  if (type?.includes('pdf') || type?.includes('document') || type?.includes('word')) return FileText;
  return File;
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const isImageFile = (type) => type?.startsWith('image/');

// =============================================
// ATTACHMENT COMPONENTS
// =============================================
function AttachmentUploader({ onUpload, uploading, multiple = true }) {
  const fileInputRef = useRef(null);
  
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      await onUpload(files);
    }
    e.target.value = '';
  };
  
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
        style={{ color: '#5f6368' }}
        title="Dodaj załącznik"
      >
        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
      </button>
    </>
  );
}

function AttachmentPreview({ attachment, onRemove, showRemove = true }) {
  const [showPreview, setShowPreview] = useState(false);
  const FileIcon = getFileIcon(attachment.type);
  const isImage = isImageFile(attachment.type);
  
  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg group" style={{ background: '#f1f3f4' }}>
        {isImage ? (
          <img 
            src={attachment.url} 
            alt={attachment.name}
            className="w-8 h-8 rounded object-cover cursor-pointer hover:opacity-80"
            onClick={() => setShowPreview(true)}
          />
        ) : (
          <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: '#e8eaed' }}>
            <FileIcon size={16} style={{ color: '#5f6368' }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: '#202124' }}>{attachment.name}</p>
          <p className="text-xs" style={{ color: '#9aa0a6' }}>{formatFileSize(attachment.size)}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isImage && (
            <button onClick={() => setShowPreview(true)} className="p-1 rounded hover:bg-gray-200" title="Podgląd">
              <Eye size={14} style={{ color: '#5f6368' }} />
            </button>
          )}
          <a href={attachment.url} download={attachment.name} className="p-1 rounded hover:bg-gray-200" title="Pobierz">
            <Download size={14} style={{ color: '#5f6368' }} />
          </a>
          {showRemove && onRemove && (
            <button onClick={() => onRemove(attachment.id)} className="p-1 rounded hover:bg-red-50" title="Usuń">
              <X size={14} style={{ color: '#ea4335' }} />
            </button>
          )}
        </div>
      </div>
      
      {showPreview && isImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <button onClick={() => setShowPreview(false)} className="absolute -top-10 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20" style={{ color: 'white' }}>
              <X size={24} />
            </button>
            <img src={attachment.url} alt={attachment.name} className="max-w-full max-h-[85vh] rounded-lg object-contain" />
            <p className="text-center mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{attachment.name}</p>
          </div>
        </div>
      )}
    </>
  );
}

function AttachmentList({ attachments, onRemove, showRemove = true, compact = false }) {
  if (!attachments || attachments.length === 0) return null;
  
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {attachments.map(att => (
          <AttachmentChip key={att.id} attachment={att} onRemove={onRemove} showRemove={showRemove} />
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-1 mt-2">
      {attachments.map(att => (
        <AttachmentPreview key={att.id} attachment={att} onRemove={onRemove} showRemove={showRemove} />
      ))}
    </div>
  );
}

function AttachmentChip({ attachment, onRemove, showRemove = true }) {
  const [showPreview, setShowPreview] = useState(false);
  const FileIcon = getFileIcon(attachment.type);
  const isImage = isImageFile(attachment.type);
  
  return (
    <>
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs group" style={{ background: '#e8f0fe', color: '#1a73e8' }}>
        {isImage ? (
          <img 
            src={attachment.url} 
            alt=""
            className="w-4 h-4 rounded-sm object-cover cursor-pointer"
            onClick={() => setShowPreview(true)}
          />
        ) : (
          <FileIcon size={12} />
        )}
        <span className="max-w-[100px] truncate cursor-pointer hover:underline" onClick={() => isImage ? setShowPreview(true) : window.open(attachment.url, '_blank')}>
          {attachment.name}
        </span>
        {showRemove && onRemove && (
          <button onClick={() => onRemove(attachment.id)} className="hover:text-red-500 ml-0.5">
            <X size={12} />
          </button>
        )}
      </div>
      
      {showPreview && isImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <button onClick={() => setShowPreview(false)} className="absolute -top-10 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20" style={{ color: 'white' }}>
              <X size={24} />
            </button>
            <img src={attachment.url} alt={attachment.name} className="max-w-full max-h-[85vh] rounded-lg object-contain" />
          </div>
        </div>
      )}
    </>
  );
}

// =============================================
// UNREAD COMMENTS SYSTEM
// =============================================
const getReadTimestamps = (userId) => {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(`av_tasks_read_${userId}`) || '{}'); } catch { return {}; }
};

const setTaskRead = (taskId, userId) => {
  if (typeof window === 'undefined') return;
  const key = `av_tasks_read_${userId}`;
  try { const timestamps = JSON.parse(localStorage.getItem(key) || '{}'); timestamps[taskId] = new Date().toISOString(); localStorage.setItem(key, JSON.stringify(timestamps)); } catch {}
};

const setTaskUnread = (taskId, userId) => {
  if (typeof window === 'undefined') return;
  const key = `av_tasks_read_${userId}`;
  try { const timestamps = JSON.parse(localStorage.getItem(key) || '{}'); delete timestamps[taskId]; localStorage.setItem(key, JSON.stringify(timestamps)); } catch {}
};

const getUnreadComments = (task, userId, readTimestamps = null) => {
  if (!task.comments || task.comments.length === 0) return [];
  if (typeof window === 'undefined') return [];
  try {
    const timestamps = readTimestamps || getReadTimestamps(userId);
    const lastRead = timestamps[task.id];
    if (!lastRead) return task.comments.filter(c => c.author !== userId);
    const lastReadDate = new Date(lastRead);
    return task.comments.filter(c => { if (c.author === userId) return false; return new Date(c.createdAt) > lastReadDate; });
  } catch { return []; }
};

const getUnreadCount = (task, userId, readTimestamps = null) => getUnreadComments(task, userId, readTimestamps).length;

// =============================================
// NEW TASKS NOTIFICATIONS
// =============================================
const getSeenTaskIds = (userId) => {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(`av_tasks_seen_${userId}`) || '[]'); } catch { return []; }
};

const markTaskAsSeen = (taskId, userId) => {
  if (typeof window === 'undefined') return;
  const key = `av_tasks_seen_${userId}`;
  try { const seen = JSON.parse(localStorage.getItem(key) || '[]'); if (!seen.includes(taskId)) { seen.push(taskId); localStorage.setItem(key, JSON.stringify(seen)); } } catch {}
};

// =============================================
// HELPERS
// =============================================
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
            else label = urlObj.hostname.replace('www.', '');
          } catch {}
          return <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors" style={{ color: '#1a73e8' }}><ExternalLink size={14} /><span className="text-sm hover:underline truncate">{label}</span></a>;
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
  const handleLogin = (e) => { e.preventDefault(); const member = TEAM_MEMBERS.find(m => m.id === selectedUser); if (!member) { setError('Wybierz osobę'); return; } if (member.pin !== pin) { setError('Nieprawidłowy PIN'); setPin(''); return; } localStorage.setItem('av_tasks_user', selectedUser); onLogin(selectedUser); };
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f8f9fa' }}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm" style={{ boxShadow: '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)' }}>
        <div className="text-center mb-8"><img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="Angloville" className="h-10 mx-auto mb-4" /><h1 className="text-xl font-semibold" style={{ color: '#202124' }}>Marketing Tasks</h1><p className="text-sm mt-1" style={{ color: '#5f6368' }}>Zaloguj się do panelu</p></div>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="p-3 rounded-lg text-sm text-center" style={{ background: '#fce8e6', color: '#c5221f' }}>{error}</div>}
          <div><label className="block text-sm font-medium mb-1.5" style={{ color: '#202124' }}>Osoba</label><select value={selectedUser} onChange={(e) => { setSelectedUser(e.target.value); setError(''); }} className="w-full px-4 py-3 border rounded-lg text-sm" style={{ borderColor: '#dadce0', color: '#202124' }}><option value="">Wybierz...</option>{TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1.5" style={{ color: '#202124' }}>PIN</label><input type="password" value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }} className="w-full px-4 py-3 border rounded-lg text-sm text-center tracking-widest" style={{ borderColor: '#dadce0' }} placeholder="••••" maxLength={4} inputMode="numeric" /></div>
          <button type="submit" className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:shadow-md" style={{ background: '#1a73e8', color: 'white' }}><Lock size={18} />Zaloguj się</button>
        </form>
      </div>
    </div>
  );
}

function RichTextEditor({ value, onChange, placeholder, minHeight = '150px' }) {
  const editorRef = useRef(null);
  useEffect(() => { if (editorRef.current && editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value || ''; }, [value]);
  const execCommand = (command, val = null) => { document.execCommand(command, false, val); editorRef.current?.focus(); handleChange(); };
  const handleChange = () => { if (editorRef.current) onChange(editorRef.current.innerHTML); };
  const insertLink = () => { const url = prompt('Podaj URL:'); if (url) execCommand('createLink', url); };
  return (
    <div className="border rounded-lg overflow-hidden bg-white" style={{ borderColor: '#dadce0' }}>
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b flex-wrap" style={{ background: '#f1f3f4', borderColor: '#dadce0' }}>
        <button type="button" onClick={() => execCommand('undo')} className="p-1.5 rounded hover:bg-gray-200" title="Cofnij"><Undo size={18} style={{ color: '#444746' }} /></button>
        <button type="button" onClick={() => execCommand('redo')} className="p-1.5 rounded hover:bg-gray-200" title="Ponów"><Redo size={18} style={{ color: '#444746' }} /></button>
        <div className="w-px h-5 mx-1.5" style={{ background: '#dadce0' }} />
        <button type="button" onClick={() => execCommand('bold')} className="p-1.5 rounded hover:bg-gray-200" title="Pogrubienie"><Bold size={18} style={{ color: '#444746' }} /></button>
        <button type="button" onClick={() => execCommand('italic')} className="p-1.5 rounded hover:bg-gray-200" title="Kursywa"><Italic size={18} style={{ color: '#444746' }} /></button>
        <button type="button" onClick={() => execCommand('underline')} className="p-1.5 rounded hover:bg-gray-200" title="Podkreślenie"><Underline size={18} style={{ color: '#444746' }} /></button>
        <div className="w-px h-5 mx-1.5" style={{ background: '#dadce0' }} />
        <button type="button" onClick={insertLink} className="p-1.5 rounded hover:bg-gray-200" title="Wstaw link"><Link2 size={18} style={{ color: '#444746' }} /></button>
        <div className="w-px h-5 mx-1.5" style={{ background: '#dadce0' }} />
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-1.5 rounded hover:bg-gray-200" title="Lista punktowana"><List size={18} style={{ color: '#444746' }} /></button>
        <button type="button" onClick={() => execCommand('insertOrderedList')} className="p-1.5 rounded hover:bg-gray-200" title="Lista numerowana"><ListOrdered size={18} style={{ color: '#444746' }} /></button>
        <button type="button" onClick={() => execCommand('removeFormat')} className="p-1.5 rounded hover:bg-gray-200 ml-auto" title="Usuń formatowanie"><X size={18} style={{ color: '#9aa0a6' }} /></button>
      </div>
      <div ref={editorRef} contentEditable onInput={handleChange} onBlur={handleChange} className="px-4 py-3 text-sm focus:outline-none overflow-y-auto" style={{ color: '#202124', minHeight, maxHeight: '400px', lineHeight: '1.6' }} data-placeholder={placeholder} suppressContentEditableWarning />
    </div>
  );
}

function RichTextDisplay({ html }) { 
  if (!html) return null; 
  
  const linkifyHtml = (htmlContent) => {
    if (htmlContent.includes('<a ')) return htmlContent;
    const urlRegex = /(https?:\/\/[^\s<]+[^\s<.,;:!?'"\])>])/gi;
    
    return htmlContent.replace(urlRegex, (url) => {
      let label = url;
      try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('docs.google.com')) label = '📄 Google Docs';
        else if (urlObj.hostname.includes('drive.google.com')) label = '📁 Google Drive';
        else if (urlObj.hostname.includes('sheets.google.com')) label = '📊 Google Sheets';
        else if (urlObj.hostname.includes('slides.google.com')) label = '📽️ Google Slides';
        else label = urlObj.hostname.replace('www.', '');
      } catch {}
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #1a73e8; text-decoration: none;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${label}</a>`;
    });
  };
  
  const processedHtml = linkifyHtml(html);
  
  return (
    <div 
      className="text-sm leading-relaxed prose-docs" 
      style={{ color: '#3c4043' }} 
      dangerouslySetInnerHTML={{ __html: processedHtml }} 
    />
  ); 
}

const translationCache = {};
async function translateToPolish(text) { if (!text) return ''; const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); if (!plainText) return ''; if (translationCache[plainText]) return translationCache[plainText]; try { const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(plainText)}&langpair=en|pl`); const data = await response.json(); if (data.responseStatus === 200 && data.responseData?.translatedText) { translationCache[plainText] = data.responseData.translatedText; return data.responseData.translatedText; } return plainText; } catch { return plainText; } }

function TranslationPopup({ title, description, onClose }) {
  const [translatedTitle, setTranslatedTitle] = useState('');
  const [translatedDesc, setTranslatedDesc] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { async function translate() { setLoading(true); const [tTitle, tDesc] = await Promise.all([translateToPolish(title), description ? translateToPolish(description) : Promise.resolve('')]); setTranslatedTitle(tTitle); setTranslatedDesc(tDesc); setLoading(false); } translate(); }, [title, description]);
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md" style={{ boxShadow: '0 24px 38px 3px rgba(0,0,0,.14)' }} onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#e8eaed' }}><div className="flex items-center gap-2"><Languages size={20} style={{ color: '#1a73e8' }} /><h3 className="font-medium" style={{ color: '#202124' }}>Tłumaczenie na polski</h3></div><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100" style={{ color: '#5f6368' }}><X size={20} /></button></div>
        <div className="p-5 space-y-4">{loading ? <div className="flex items-center justify-center py-8"><Loader2 size={24} className="animate-spin" style={{ color: '#1a73e8' }} /></div> : <><div><label className="block text-xs font-medium mb-1" style={{ color: '#5f6368' }}>Tytuł</label><div className="p-3 rounded-lg" style={{ background: '#e8f0fe' }}><p className="text-sm font-medium" style={{ color: '#202124' }}>{translatedTitle}</p></div></div>{translatedDesc && <div><label className="block text-xs font-medium mb-1" style={{ color: '#5f6368' }}>Opis</label><div className="p-3 rounded-lg" style={{ background: '#e8f0fe' }}><p className="text-sm" style={{ color: '#3c4043' }}>{translatedDesc}</p></div></div>}</>}</div>
      </div>
    </div>
  );
}

function TranslateButton({ task, size = 'normal' }) { const [showPopup, setShowPopup] = useState(false); if (task.language !== 'en') return null; return <><button onClick={(e) => { e.stopPropagation(); setShowPopup(true); }} className={`${size === 'small' ? 'p-0.5' : 'p-1.5'} rounded-full hover:bg-blue-50`} style={{ color: '#1a73e8' }} title="Przetłumacz"><Languages size={size === 'small' ? 14 : 16} /></button>{showPopup && <TranslationPopup title={task.title} description={task.description} onClose={() => setShowPopup(false)} />}</>; }
function SubtaskProgress({ subtasks }) { if (!subtasks || subtasks.length === 0) return null; const done = subtasks.filter(s => s.status === 'closed').length; const total = subtasks.length; return <div className="flex items-center gap-1.5" title={`${done}/${total} subtasków`}><ListTodo size={12} style={{ color: '#5f6368' }} /><span className="text-xs" style={{ color: '#5f6368' }}>{done}/{total}</span></div>; }

const generateId = () => Math.random().toString(36).substr(2, 9);
const formatDateTime = (date) => new Date(date).toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const formatDateTimeEn = (date) => new Date(date).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const formatTimeAgo = (date) => { const now = new Date(); const d = new Date(date); const diffMs = now - d; const diffMins = Math.floor(diffMs / 60000); const diffHours = Math.floor(diffMs / 3600000); const diffDays = Math.floor(diffMs / 86400000); if (diffMins < 1) return 'teraz'; if (diffMins < 60) return `${diffMins} min`; if (diffHours < 24) return `${diffHours} godz.`; if (diffDays < 7) return `${diffDays} dni`; return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }); };
async function sendEmailNotification(to, assigneeName, taskTitle, assignedBy) { try { await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, assigneeName, taskTitle, assignedBy }) }); } catch (e) { console.log('Email skipped:', e); } }
async function sendCompletedEmail(task, completedByName) { if (!task.submitterEmail || !task.isExternal) return { sent: false, error: 'Brak emaila' }; try { const response = await fetch('/api/notify-completed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: task.submitterEmail, requesterName: task.submittedBy, taskTitle: task.title, completedBy: completedByName, publicToken: task.publicToken }) }); const data = await response.json(); return { sent: data.success || false, messageId: data.messageId, error: data.error }; } catch (e) { return { sent: false, error: e.message }; } }

function EmailHistorySection({ task, currentUser, onResendEmail, t }) {
  const [resending, setResending] = useState(false);
  const emailHistory = task.emailHistory || [];
  const hasEmail = task.submitterEmail && task.isExternal;
  const completedEmails = emailHistory.filter(e => e.type === 'completed');
  const lastCompletedEmail = completedEmails[completedEmails.length - 1];
  const handleResend = async () => { setResending(true); await onResendEmail(); setResending(false); };
  if (!task.isExternal) return null;
  return (
    <div className="border-t pt-4 mt-4" style={{ borderColor: '#e8eaed' }}>
      <div className="flex items-center gap-2 mb-3"><Mail size={16} style={{ color: '#5f6368' }} /><label className="text-sm font-medium" style={{ color: '#202124' }}>{t.emailNotifications}</label></div>
      <div className="p-3 rounded-lg mb-3" style={{ background: '#f8f9fa' }}><p className="text-xs font-medium" style={{ color: '#5f6368' }}>{t.submittedBy}: {task.submittedBy || t.unknown}</p>{task.submitterEmail ? <p className="text-xs" style={{ color: '#1a73e8' }}>{task.submitterEmail}</p> : <p className="text-xs" style={{ color: '#ea4335' }}>{t.noEmail}</p>}</div>
      {emailHistory.length > 0 && <div className="space-y-2 mb-3"><p className="text-xs font-medium" style={{ color: '#5f6368' }}>{t.history}</p>{emailHistory.map((email, idx) => { const sender = TEAM_MEMBERS.find(m => m.id === email.sentBy); return <div key={email.id || idx} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: email.success ? '#e6f4ea' : '#fce8e6' }}>{email.success ? <MailCheck size={16} style={{ color: '#34a853' }} /> : <MailX size={16} style={{ color: '#ea4335' }} />}<div className="flex-1 min-w-0"><p className="text-xs" style={{ color: '#5f6368' }}>{formatDateTime(email.sentAt)} {t.by} {sender?.name?.split(' ')[0] || t.system}</p></div></div>; })}</div>}
      {hasEmail && task.status === 'closed' && <div className="flex items-center gap-2"><button onClick={handleResend} disabled={resending} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50" style={{ background: lastCompletedEmail?.success ? '#f1f3f4' : '#34a853', color: lastCompletedEmail?.success ? '#202124' : 'white' }}>{resending ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}{lastCompletedEmail?.success ? t.resend : t.sendEmail}</button></div>}
    </div>
  );
}

function NewTasksSection({ tasks, currentUser, onSelectTask, seenTaskIds, t }) {
  const [expanded, setExpanded] = useState(true);
  const newTasks = useMemo(() => tasks.filter(task => { const isAssigned = task.assignees?.includes(currentUser); if (!isAssigned) return false; if (task.createdBy === currentUser) return false; if (task.status === 'pending') return false; return !seenTaskIds.includes(task.id); }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [tasks, currentUser, seenTaskIds]);
  if (newTasks.length === 0) return null;
  return (
    <div className="mx-2 mt-3 rounded-lg overflow-hidden" style={{ background: '#e8f0fe', border: '1px solid #c6dafc' }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium hover:bg-blue-100" style={{ color: '#1a73e8' }}><div className="flex items-center gap-2"><Sparkles size={14} /><span>{t.newTasks}</span><span className="px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: '#1a73e8', color: 'white' }}>{newTasks.length}</span></div><ChevronDown size={14} className={`transition-transform ${expanded ? '' : '-rotate-90'}`} /></button>
      {expanded && <div className="px-2 pb-2 max-h-48 overflow-y-auto"><div className="space-y-1">{newTasks.map(task => { const creator = TEAM_MEMBERS.find(m => m.id === task.createdBy); const market = MARKETS.find(m => m.id === task.market); return <button key={task.id} onClick={() => onSelectTask(task)} className="w-full text-left p-2 rounded-lg bg-white hover:bg-blue-50" style={{ border: '1px solid #c6dafc' }}><div className="flex items-start gap-2"><span className="text-base">{market?.icon}</span><div className="flex-1 min-w-0"><p className="text-xs font-medium truncate" style={{ color: '#202124' }}>{task.title}</p><p className="text-xs" style={{ color: '#5f6368' }}>{t.from} {creator?.name?.split(' ')[0] || 'Ktoś'} • {formatTimeAgo(task.createdAt)}</p></div></div></button>; })}</div></div>}
    </div>
  );
}

function UnreadCommentsSection({ tasks, currentUser, onSelectTask, readTimestamps, t }) {
  const [expanded, setExpanded] = useState(true);
  const tasksWithUnread = useMemo(() => tasks.filter(task => { const isInvolved = task.assignees?.includes(currentUser) || task.createdBy === currentUser; if (!isInvolved) return false; return getUnreadCount(task, currentUser, readTimestamps) > 0; }).map(task => ({ ...task, unreadComments: getUnreadComments(task, currentUser, readTimestamps), unreadCount: getUnreadCount(task, currentUser, readTimestamps) })).sort((a, b) => { const aLatest = a.unreadComments[a.unreadComments.length - 1]?.createdAt || ''; const bLatest = b.unreadComments[b.unreadComments.length - 1]?.createdAt || ''; return new Date(bLatest) - new Date(aLatest); }), [tasks, currentUser, readTimestamps]);
  const totalUnread = tasksWithUnread.reduce((sum, t) => sum + t.unreadCount, 0);
  if (totalUnread === 0) return null;
  return (
    <div className="mx-2 mt-3 rounded-lg overflow-hidden" style={{ background: '#fef7e0', border: '1px solid #feefc3' }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium hover:bg-yellow-100" style={{ color: '#b06000' }}><div className="flex items-center gap-2"><Inbox size={14} /><span>{t.unread}</span><span className="px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: '#fbbc04', color: 'white' }}>{totalUnread}</span></div><ChevronDown size={14} className={`transition-transform ${expanded ? '' : '-rotate-90'}`} /></button>
      {expanded && <div className="px-2 pb-2 max-h-64 overflow-y-auto"><div className="space-y-1">{tasksWithUnread.map(task => { const latestComment = task.unreadComments[task.unreadComments.length - 1]; const author = TEAM_MEMBERS.find(m => m.id === latestComment?.author); const authorName = latestComment?.author === 'external' ? (latestComment?.authorName || task.submittedBy || 'Zewnętrzny') : (author?.name?.split(' ')[0] || 'Ktoś'); return <button key={task.id} onClick={() => onSelectTask(task)} className="w-full text-left p-2 rounded-lg bg-white hover:bg-yellow-50" style={{ border: '1px solid #feefc3' }}><div className="flex items-start gap-2"><div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: author?.color || '#5f6368' }}>{latestComment?.author === 'external' ? '👤' : getInitials(author?.name || '?')}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-1 mb-0.5"><span className="text-xs font-medium truncate" style={{ color: '#202124' }}>{task.title}</span>{task.unreadCount > 1 && <span className="text-xs px-1 rounded" style={{ background: '#fef7e0', color: '#b06000' }}>+{task.unreadCount}</span>}</div><p className="text-xs truncate" style={{ color: '#5f6368' }}><span className="font-medium">{authorName}:</span> {latestComment?.text?.substring(0, 50)}{latestComment?.text?.length > 50 ? '...' : ''}</p></div></div></button>; })}</div></div>}
    </div>
  );
}

function QuickLinksSection({ currentUser, t }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', url: '' });
  const [expanded, setExpanded] = useState(true);
  const loadLinks = async () => { const data = await getQuickLinks(currentUser); setLinks(data); setLoading(false); };
  useEffect(() => { loadLinks(); }, [currentUser]);
  const addLink = async () => { if (!form.name.trim() || !form.url.trim()) return; let url = form.url.trim(); if (!url.startsWith('http')) url = 'https://' + url; const newLink = await createQuickLink({ name: form.name.trim(), url, userId: currentUser }); if (newLink) setLinks([...links, newLink]); setForm({ name: '', url: '' }); setShowAddForm(false); };
  const updateLinkItem = async () => { if (!form.name.trim() || !form.url.trim()) return; let url = form.url.trim(); if (!url.startsWith('http')) url = 'https://' + url; const updated = await updateQuickLink(editingId, { name: form.name.trim(), url }); if (updated) setLinks(links.map(l => l.id === editingId ? { ...l, name: form.name.trim(), url } : l)); setForm({ name: '', url: '' }); setEditingId(null); };
  const removeLink = async (id) => { const success = await deleteQuickLink(id); if (success) setLinks(links.filter(l => l.id !== id)); };
  const startEdit = (link) => { setForm({ name: link.name, url: link.url }); setEditingId(link.id); setShowAddForm(false); };
  const getLinkIcon = (url) => { try { const hostname = new URL(url).hostname; if (hostname.includes('docs.google.com')) return '📄'; if (hostname.includes('sheets.google.com')) return '📊'; if (hostname.includes('slides.google.com')) return '📽️'; if (hostname.includes('drive.google.com')) return '📁'; if (hostname.includes('lookerstudio')) return '📈'; return '🔗'; } catch { return '🔗'; } };
  return (
    <div className="mx-2 mt-3 rounded-lg overflow-hidden" style={{ background: '#f8f9fa', border: '1px solid #e8eaed' }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium hover:bg-gray-100" style={{ color: '#5f6368' }}><span>{t.myLinks}</span><ChevronDown size={14} className={`transition-transform ${expanded ? '' : '-rotate-90'}`} /></button>
      {expanded && <div className="px-2 pb-2">{loading ? <div className="py-3 text-center"><Loader2 size={16} className="animate-spin mx-auto" style={{ color: '#9aa0a6' }} /></div> : <div className="space-y-0.5 mb-2 max-h-64 overflow-y-auto">{links.map(link => <div key={link.id} className="group flex items-center gap-1 rounded hover:bg-white">{editingId === link.id ? <div className="flex-1 p-1.5 space-y-1"><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nazwa" className="w-full px-2 py-1 text-xs rounded border" style={{ borderColor: '#dadce0' }} autoFocus /><input type="text" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="URL" className="w-full px-2 py-1 text-xs rounded border font-mono" style={{ borderColor: '#dadce0' }} /><div className="flex gap-1"><button onClick={updateLinkItem} className="flex-1 py-1 rounded text-xs font-medium" style={{ background: '#1a73e8', color: 'white' }}>{t.save}</button><button onClick={() => { setEditingId(null); setForm({ name: '', url: '' }); }} className="px-2 py-1 rounded text-xs" style={{ color: '#5f6368' }}>✕</button></div></div> : <><a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center gap-1.5 px-2 py-1.5 text-xs rounded hover:underline truncate" style={{ color: '#1a73e8' }} title={link.url}><span>{getLinkIcon(link.url)}</span><span className="truncate">{link.name}</span></a><div className="flex items-center opacity-0 group-hover:opacity-100"><button onClick={() => startEdit(link)} className="p-1 rounded hover:bg-gray-200" style={{ color: '#5f6368' }}><Edit3 size={12} /></button><button onClick={() => removeLink(link.id)} className="p-1 rounded hover:bg-red-50" style={{ color: '#ea4335' }}><X size={12} /></button></div></>}</div>)}{links.length === 0 && !loading && <p className="text-xs text-center py-2" style={{ color: '#9aa0a6' }}>{t.noLinks}</p>}</div>}{showAddForm ? <div className="p-2 rounded-lg space-y-1.5" style={{ background: 'white', border: '1px solid #dadce0' }}><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nazwa" className="w-full px-2 py-1.5 text-xs rounded border" style={{ borderColor: '#dadce0' }} autoFocus /><input type="text" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="Link" className="w-full px-2 py-1.5 text-xs rounded border font-mono" style={{ borderColor: '#dadce0' }} onKeyDown={(e) => e.key === 'Enter' && addLink()} /><div className="flex gap-1"><button onClick={addLink} className="flex-1 py-1.5 rounded text-xs font-medium" style={{ background: '#1a73e8', color: 'white' }}>{t.add}</button><button onClick={() => { setShowAddForm(false); setForm({ name: '', url: '' }); }} className="px-3 py-1.5 rounded text-xs" style={{ background: '#f1f3f4', color: '#5f6368' }}>{t.cancel}</button></div></div> : <button onClick={() => { setShowAddForm(true); setEditingId(null); }} className="w-full py-1.5 rounded text-xs flex items-center justify-center gap-1 hover:bg-white" style={{ color: '#1a73e8', border: '1px dashed #dadce0' }}><Plus size={12} /> {t.addLink}</button>}</div>}
    </div>
  );
}

// =============================================
// MAIN APP
// =============================================
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
  const [readTimestamps, setReadTimestamps] = useState({});
  const [seenTaskIds, setSeenTaskIds] = useState([]);

  const currentMember = TEAM_MEMBERS.find(m => m.id === currentUser);
  const lang = currentMember?.language || 'pl';
  const t = TRANSLATIONS[lang];
  const isManager = currentMember?.isManager || false;
  const restrictedMarket = currentMember?.restrictedToMarket || null;

  useEffect(() => { if (currentUser) { setReadTimestamps(getReadTimestamps(currentUser)); setSeenTaskIds(getSeenTaskIds(currentUser)); } }, [currentUser]);
  useEffect(() => { const savedUser = localStorage.getItem('av_tasks_user'); if (savedUser && TEAM_MEMBERS.find(m => m.id === savedUser)) setCurrentUser(savedUser); setCheckingAuth(false); }, []);
  
  // Set default market filter for restricted users
  useEffect(() => {
    if (restrictedMarket) {
      setFilterMarket(restrictedMarket);
    }
  }, [restrictedMarket]);
  
  const loadTasks = async () => { const data = await getTasks(); const sorted = data.sort((a, b) => { if (a.order !== undefined && b.order !== undefined) return a.order - b.order; return new Date(b.createdAt) - new Date(a.createdAt); }); setTasks(sorted); setLoading(false); };
  useEffect(() => { if (currentUser) loadTasks(); }, [currentUser]);
  const handleLogout = () => { localStorage.removeItem('av_tasks_user'); setCurrentUser(null); setTasks([]); setSelectedTask(null); };
  const handleSelectTask = useCallback((task) => { setSelectedTask(task); if (currentUser && task) { setTaskRead(task.id, currentUser); setReadTimestamps(prev => ({ ...prev, [task.id]: new Date().toISOString() })); markTaskAsSeen(task.id, currentUser); setSeenTaskIds(prev => prev.includes(task.id) ? prev : [...prev, task.id]); } }, [currentUser]);
  const handleMarkUnread = useCallback((taskId) => { if (currentUser) { setTaskUnread(taskId, currentUser); setReadTimestamps(prev => { const newState = { ...prev }; delete newState[taskId]; return newState; }); } }, [currentUser]);

  if (checkingAuth) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fa' }}><Loader2 className="animate-spin" size={32} style={{ color: '#1a73e8' }} /></div>;
  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />;

  const pendingTasks = tasks.filter(task => {
    if (task.status !== 'pending') return false;
    if (restrictedMarket && task.market !== restrictedMarket) return false;
    return true;
  });
  
  const visibleTasks = tasks.filter(task => { 
    if (task.status === 'pending') return false; 
    if (restrictedMarket && task.market !== restrictedMarket) return false;
    if (filterMarket !== 'all' && task.market !== filterMarket) return false; 
    if (filterPerson !== 'all' && !task.assignees?.includes(filterPerson)) return false; 
    return true; 
  });
  
  const getFilteredByStatus = (statusFilter) => { switch (statusFilter) { case 'all': return visibleTasks; case 'active': return visibleTasks.filter(t => t.status === 'open' || t.status === 'longterm'); case 'open': return visibleTasks.filter(t => t.status === 'open'); case 'longterm': return visibleTasks.filter(t => t.status === 'longterm'); case 'closed': return visibleTasks.filter(t => t.status === 'closed'); default: return visibleTasks; } };
  const filteredTasks = getFilteredByStatus(filterStatus);
  const openTasks = visibleTasks.filter(t => t.status === 'open');
  const longtermTasks = visibleTasks.filter(t => t.status === 'longterm');
  const closedTasks = visibleTasks.filter(t => t.status === 'closed');

  const updateTask = async (id, updates, options = {}) => { 
    const oldTask = tasks.find(t => t.id === id);
    const newTask = { ...oldTask, ...updates };
    setTasks(prev => prev.map(t => t.id === id ? newTask : t)); 
    if (selectedTask?.id === id) setSelectedTask(newTask);
    if (updates.status === 'closed' && oldTask?.status !== 'closed' && oldTask?.isExternal && oldTask?.submitterEmail && !options.skipEmail) {
      const result = await sendCompletedEmail(oldTask, currentMember?.name);
      const emailEntry = { id: generateId(), type: 'completed', sentAt: new Date().toISOString(), sentBy: currentUser, sentTo: oldTask.submitterEmail, success: result.sent, messageId: result.messageId || null, error: result.error || null };
      updates.emailHistory = [...(oldTask.emailHistory || []), emailEntry];
      newTask.emailHistory = updates.emailHistory;
      setTasks(prev => prev.map(t => t.id === id ? newTask : t)); 
      if (selectedTask?.id === id) setSelectedTask(newTask);
    }
    await updateTaskDb(id, updates); 
  };
  
  const deleteTask = async (id) => { if (confirm(t.deleteTask)) { setTasks(prev => prev.filter(t => t.id !== id)); setSelectedTask(null); await deleteTaskDb(id); } };
  const approveTask = async (task, assignees) => { await updateTask(task.id, { status: 'open', assignees, approvedAt: new Date().toISOString(), approvedBy: currentUser }); for (const aId of assignees) { const m = TEAM_MEMBERS.find(x => x.id === aId); if (m) await sendEmailNotification(m.email, m.name, task.title, currentMember?.name); } setActiveTab('tasks'); };
  const addTask = async (task) => { const newTask = { ...task, createdAt: new Date().toISOString(), createdBy: currentUser, isExternal: false, subtasks: [], status: task.status || 'open', order: 0, emailHistory: [] }; const created = await createTask(newTask); if (created) await loadTasks(); setShowNewTask(false); for (const aId of task.assignees || []) { const m = TEAM_MEMBERS.find(x => x.id === aId); if (m && m.id !== currentUser) await sendEmailNotification(m.email, m.name, task.title, currentMember?.name); } };

  const handleDragStart = (e, task) => { setDraggedTask(task); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e, targetTask) => { e.preventDefault(); if (draggedTask && targetTask.id !== draggedTask.id && targetTask.status === draggedTask.status) setDragOverId(targetTask.id); };
  const handleDrop = async (e, targetTask) => { e.preventDefault(); setDragOverId(null); if (!draggedTask || draggedTask.id === targetTask.id || draggedTask.status !== targetTask.status) { setDraggedTask(null); return; } const statusTasks = filteredTasks.filter(t => t.status === draggedTask.status); const draggedIndex = statusTasks.findIndex(t => t.id === draggedTask.id); const targetIndex = statusTasks.findIndex(t => t.id === targetTask.id); if (draggedIndex === -1 || targetIndex === -1) { setDraggedTask(null); return; } const newStatusTasks = [...statusTasks]; newStatusTasks.splice(draggedIndex, 1); newStatusTasks.splice(targetIndex, 0, draggedTask); const updates = newStatusTasks.map((t, idx) => ({ id: t.id, order: idx })); setTasks(prev => { const otherTasks = prev.filter(t => t.status !== draggedTask.status); const reorderedTasks = newStatusTasks.map((t, idx) => ({ ...t, order: idx })); return [...otherTasks, ...reorderedTasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); }); for (const u of updates) { await updateTaskDb(u.id, { order: u.order }); } setDraggedTask(null); };
  const handleDragEnd = () => { setDraggedTask(null); setDragOverId(null); };

  const formUrl = typeof window !== 'undefined' ? `${window.location.origin}/request` : '/request';
  const copyLink = () => { navigator.clipboard.writeText(formUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  // Get available markets for filter (restricted users see only their market)
  const availableMarkets = restrictedMarket 
    ? MARKETS.filter(m => m.id === restrictedMarket)
    : MARKETS;

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fa', color: '#5f6368' }}>{t.loading}</div>;

  return (
    <div className="min-h-screen flex" style={{ background: '#f8f9fa' }}>
      <aside className="w-56 flex flex-col min-h-screen flex-shrink-0 border-r bg-white" style={{ borderColor: '#e8eaed' }}>
        <div className="p-4 border-b" style={{ borderColor: '#e8eaed' }}><img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="Angloville" className="h-7" /><p className="mt-1 text-xs" style={{ color: '#5f6368' }}>{t.marketingTasks}</p></div>
        <div className="p-3 border-b space-y-2" style={{ borderColor: '#e8eaed' }}>
          {!restrictedMarket && (
            <select value={filterMarket} onChange={(e) => setFilterMarket(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm border" style={{ borderColor: '#dadce0', color: '#202124' }}>
              <option value="all">{t.allMarkets}</option>
              {availableMarkets.map(m => <option key={m.id} value={m.id}>{m.icon} {lang === 'en' ? m.nameEn : m.name}</option>)}
            </select>
          )}
          <select value={filterPerson} onChange={(e) => setFilterPerson(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm border" style={{ borderColor: '#dadce0', color: '#202124' }}>
            <option value="all">{t.everyone}</option>
            {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <NewTasksSection tasks={tasks.filter(task => !restrictedMarket || task.market === restrictedMarket)} currentUser={currentUser} onSelectTask={handleSelectTask} seenTaskIds={seenTaskIds} t={t} />
        <UnreadCommentsSection tasks={tasks.filter(task => !restrictedMarket || task.market === restrictedMarket)} currentUser={currentUser} onSelectTask={handleSelectTask} readTimestamps={readTimestamps} t={t} />
        <div className="p-2 flex-1">
          <div className="space-y-0.5">
            {isManager && pendingTasks.length > 0 && <button onClick={() => setActiveTab('pending')} className="w-full flex items-center justify-between px-3 py-2 rounded-full text-sm" style={{ background: activeTab === 'pending' ? '#fef7e0' : 'transparent', color: activeTab === 'pending' ? '#b06000' : '#202124' }}><div className="flex items-center gap-3"><AlertCircle size={18} style={{ color: '#fbbc04' }} /><span>{t.pending}</span></div><span className="font-medium" style={{ color: '#fbbc04' }}>{pendingTasks.length}</span></button>}
            <button onClick={() => { setActiveTab('tasks'); setFilterStatus('active'); }} className="w-full flex items-center justify-between px-3 py-2 rounded-full text-sm" style={{ background: activeTab === 'tasks' && filterStatus === 'active' ? '#e8f0fe' : 'transparent', color: activeTab === 'tasks' && filterStatus === 'active' ? '#1a73e8' : '#202124' }}><div className="flex items-center gap-3"><Filter size={18} style={{ color: '#1a73e8' }} /><span>{t.active}</span></div><span className="font-medium">{openTasks.length + longtermTasks.length}</span></button>
            <button onClick={() => { setActiveTab('tasks'); setFilterStatus('open'); }} className="w-full flex items-center justify-between px-3 py-2 rounded-full text-sm" style={{ background: activeTab === 'tasks' && filterStatus === 'open' ? '#e8f0fe' : 'transparent', color: '#202124' }}><div className="flex items-center gap-3 pl-2"><Circle size={16} style={{ color: '#4285f4' }} /><span>{t.open}</span></div><span style={{ color: '#5f6368' }}>{openTasks.length}</span></button>
            <button onClick={() => { setActiveTab('tasks'); setFilterStatus('longterm'); }} className="w-full flex items-center justify-between px-3 py-2 rounded-full text-sm" style={{ background: activeTab === 'tasks' && filterStatus === 'longterm' ? '#f3e8fd' : 'transparent', color: '#202124' }}><div className="flex items-center gap-3 pl-2"><Clock size={16} style={{ color: '#a142f4' }} /><span>{t.longterm}</span></div><span style={{ color: '#5f6368' }}>{longtermTasks.length}</span></button>
            <button onClick={() => { setActiveTab('tasks'); setFilterStatus('closed'); }} className="w-full flex items-center justify-between px-3 py-2 rounded-full text-sm" style={{ background: activeTab === 'tasks' && filterStatus === 'closed' ? '#e6f4ea' : 'transparent', color: '#202124' }}><div className="flex items-center gap-3 pl-2"><CheckCircle size={16} style={{ color: '#34a853' }} /><span>{t.closed}</span></div><span style={{ color: '#5f6368' }}>{closedTasks.length}</span></button>
          </div>
          <div className="mt-4 mx-2 p-3 rounded-lg text-xs" style={{ background: '#f1f3f4' }}><p className="mb-1.5" style={{ color: '#5f6368' }}>{t.formEn}</p><button onClick={copyLink} className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200"><code className="flex-1 text-xs truncate" style={{ color: '#1a73e8' }}>/request</code>{copied ? <Check size={14} style={{ color: '#34a853' }} /> : <Copy size={14} style={{ color: '#5f6368' }} />}</button></div>
          <QuickLinksSection currentUser={currentUser} t={t} />
        </div>
        <div className="p-3 border-t" style={{ borderColor: '#e8eaed' }}><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: currentMember?.color }}>{getInitials(currentMember?.name || '')}</div><div className="flex-1 min-w-0"><div className="text-sm font-medium truncate" style={{ color: '#202124' }}>{currentMember?.name?.split(' ')[0]}</div>{isManager && <div className="text-xs" style={{ color: '#5f6368' }}>{t.manager}</div>}</div><button onClick={handleLogout} className="p-1.5 rounded-full hover:bg-gray-100" style={{ color: '#5f6368' }}><LogOut size={18} /></button></div></div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between" style={{ borderColor: '#e8eaed' }}>
          <div><h2 className="text-lg font-medium" style={{ color: '#202124' }}>{activeTab === 'pending' ? t.pendingApproval : filterStatus === 'active' ? t.activeTasks : filterStatus === 'open' ? t.openTasks : filterStatus === 'longterm' ? t.longtermTasks : filterStatus === 'closed' ? t.closedTasks : t.allTasks}</h2>{filterPerson !== 'all' && <p className="text-xs" style={{ color: '#5f6368' }}>{t.filter}: {TEAM_MEMBERS.find(m => m.id === filterPerson)?.name}</p>}</div>
          <div className="flex items-center gap-2"><button onClick={loadTasks} className="p-2 rounded-full hover:bg-gray-100" style={{ color: '#5f6368' }}><Loader2 size={18} className={loading ? 'animate-spin' : ''} /></button>{activeTab === 'tasks' && <button onClick={() => setShowNewTask(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm hover:shadow-md" style={{ background: '#1a73e8', color: 'white' }}><Plus size={18} /> {t.newTask}</button>}</div>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'pending' && isManager ? <PendingView tasks={pendingTasks} approveTask={approveTask} deleteTask={deleteTask} currentUser={currentUser} t={t} lang={lang} /> : (
            <div className="max-w-4xl mx-auto">{filteredTasks.length === 0 ? <div className="text-center py-16"><CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#34a853', opacity: 0.4 }} /><p style={{ color: '#5f6368' }}>{t.noTasksToShow}</p></div> : <div className="space-y-1">{filteredTasks.map(task => <TaskItem key={task.id} task={task} isSelected={selectedTask?.id === task.id} onClick={() => handleSelectTask(task)} onStatusChange={(s) => updateTask(task.id, { status: s })} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onDragEnd={handleDragEnd} isDragging={draggedTask?.id === task.id} dragOverId={dragOverId} currentUser={currentUser} readTimestamps={readTimestamps} seenTaskIds={seenTaskIds} lang={lang} t={t} />)}</div>}</div>
          )}
        </div>
      </main>
      
      {selectedTask && <TaskDetail task={selectedTask} updateTask={updateTask} deleteTask={deleteTask} onClose={() => setSelectedTask(null)} currentUser={currentUser} isManager={isManager} onMarkUnread={handleMarkUnread} readTimestamps={readTimestamps} t={t} lang={lang} />}
      {showNewTask && <NewTaskModal onClose={() => setShowNewTask(false)} onSave={addTask} currentUser={currentUser} restrictedMarket={restrictedMarket} t={t} lang={lang} />}
    </div>
  );
}

// =============================================
// PENDING VIEW
// =============================================
function PendingView({ tasks, approveTask, deleteTask, currentUser, t, lang }) {
  const [selected, setSelected] = useState({});
  const toggle = (taskId, memberId) => { setSelected(p => { const curr = p[taskId] || []; return { ...p, [taskId]: curr.includes(memberId) ? curr.filter(x => x !== memberId) : [...curr, memberId] }; }); };
  if (!tasks.length) return <div className="max-w-3xl mx-auto text-center py-16"><CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#34a853', opacity: 0.4 }} /><p style={{ color: '#5f6368' }}>{t.noPending}</p></div>;
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {tasks.map(task => { const market = MARKETS.find(m => m.id === task.market); const assignees = selected[task.id] || task.assignees || []; return (
        <div key={task.id} className="bg-white rounded-xl p-5 border" style={{ borderColor: '#e8eaed' }}>
          {task.isExternal && <div className="flex items-center gap-2 mb-3 pb-3 border-b" style={{ borderColor: '#e8eaed' }}><ExternalLink size={14} style={{ color: '#fbbc04' }} /><span className="text-xs font-medium" style={{ color: '#b06000' }}>{t.external}</span>{task.language === 'en' && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#e8f0fe', color: '#1a73e8' }}>🇬🇧</span>}<span className="text-xs" style={{ color: '#9aa0a6' }}>{t.from} {task.submittedBy}</span></div>}
          <div className="flex items-start gap-3 mb-4"><span className="text-xl">{market?.icon}</span><div className="flex-1"><div className="flex items-center gap-2 flex-wrap"><h3 className="font-medium text-lg" style={{ color: '#202124' }}>{task.title}</h3><TranslateButton task={task} /><PriorityBadge priority={task.priority} lang={lang} /></div>{task.description && <div className="mt-2"><RichTextDisplay html={task.description} /></div>}{task.links && <div className="mt-3 p-3 rounded-lg" style={{ background: '#f8f9fa' }}><ClickableLinks text={task.links} /></div>}<AttachmentList attachments={task.attachments} showRemove={false} /></div></div>
          <div className="mb-4"><p className="text-xs font-medium mb-2" style={{ color: '#5f6368' }}>{t.assignTo}</p><div className="flex flex-wrap gap-2">{TEAM_MEMBERS.map(m => <button key={m.id} onClick={() => toggle(task.id, m.id)} className="flex items-center gap-2 px-3 py-2 rounded-full border text-sm" style={{ borderColor: assignees.includes(m.id) ? '#1a73e8' : '#dadce0', background: assignees.includes(m.id) ? '#e8f0fe' : 'white', color: assignees.includes(m.id) ? '#1a73e8' : '#202124' }}><div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: m.color }}>{getInitials(m.name)}</div><span>{m.name.split(' ')[0]}</span>{assignees.includes(m.id) && <Check size={14} />}</button>)}</div></div>
          <div className="flex gap-2 pt-4 border-t" style={{ borderColor: '#e8eaed' }}><button onClick={() => approveTask(task, assignees)} disabled={!assignees.length} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium disabled:opacity-50" style={{ background: assignees.length ? '#1a73e8' : '#f1f3f4', color: assignees.length ? 'white' : '#9aa0a6' }}><Check size={18} /> {t.approve}</button><button onClick={() => deleteTask(task.id)} className="px-4 py-2.5 rounded-lg hover:bg-red-50" style={{ color: '#ea4335', border: '1px solid #f5c6cb' }}><X size={18} /></button></div>
        </div>
      ); })}
    </div>
  );
}

// =============================================
// TASK ITEM
// =============================================
function TaskItem({ task, isSelected, onClick, onStatusChange, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, dragOverId, currentUser, readTimestamps, seenTaskIds, lang, t }) {
  const market = MARKETS.find(m => m.id === task.market);
  const status = STATUSES.find(s => s.id === task.status);
  const Icon = status?.icon || Circle;
  const cycle = (e) => { e.stopPropagation(); onStatusChange(task.status === 'open' ? 'closed' : 'open'); };
  const isDropTarget = dragOverId === task.id;
  const unreadCount = getUnreadCount(task, currentUser, readTimestamps);
  const isNewTask = task.assignees?.includes(currentUser) && task.createdBy !== currentUser && !seenTaskIds.includes(task.id);
  const hasEmailPending = task.isExternal && task.submitterEmail && task.status === 'closed' && !(task.emailHistory || []).some(e => e.type === 'completed' && e.success);
  const hasAttachments = task.attachments && task.attachments.length > 0;
  
  return (
    <div onClick={onClick} draggable onDragStart={(e) => onDragStart(e, task)} onDragOver={(e) => onDragOver(e, task)} onDrop={(e) => onDrop(e, task)} onDragEnd={onDragEnd} className="bg-white rounded-lg px-3 py-2.5 cursor-pointer hover:shadow-sm border" style={{ borderColor: isSelected ? '#1a73e8' : isDropTarget ? '#4285f4' : isNewTask ? '#c6dafc' : '#e8eaed', opacity: isDragging ? 0.4 : 1, borderTopWidth: isDropTarget ? '3px' : '1px', background: isNewTask ? '#f8fbff' : 'white' }}>
      <div className="flex items-center gap-2">
        <GripVertical size={14} style={{ color: '#dadce0' }} className="cursor-grab flex-shrink-0" />
        <button onClick={cycle} className="hover:scale-110 flex-shrink-0"><Icon size={18} style={{ color: status?.color }} className={task.status === 'closed' ? 'fill-current' : ''} /></button>
        <span className="flex-shrink-0">{market?.icon}</span>
        <h4 className="font-medium text-sm flex-1 min-w-0 truncate" style={{ color: task.status === 'closed' ? '#9aa0a6' : '#202124', textDecoration: task.status === 'closed' ? 'line-through' : 'none' }}>{task.title}</h4>
        <div className="flex items-center gap-2 flex-shrink-0">
          <PriorityBadge priority={task.priority} size="small" lang={lang} />
          {isNewTask && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium" style={{ background: '#1a73e8', color: 'white' }}><Sparkles size={10} />{t.new}</span>}
          {unreadCount > 0 && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium" style={{ background: '#fbbc04', color: 'white' }}><MessageSquare size={10} />{unreadCount}</span>}
          {hasEmailPending && <span className="px-1.5 py-0.5 rounded-full text-xs font-medium" style={{ background: '#ea4335', color: 'white' }} title="Email nie wysłany"><MailX size={10} /></span>}
          {hasAttachments && <span className="flex items-center gap-1 text-xs" style={{ color: '#5f6368' }} title={`${task.attachments.length} załącznik(ów)`}><Paperclip size={12} />{task.attachments.length}</span>}
          {task.isExternal && <ExternalLink size={12} style={{ color: '#fbbc04' }} />}
          {task.language === 'en' && <TranslateButton task={task} size="small" />}
          {task.status === 'longterm' && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#f3e8fd', color: '#a142f4' }}>{t.lt}</span>}
          {task.market === 'pl' && task.subcategory && (() => { const subcat = PL_SUBCATEGORIES.find(s => s.id === task.subcategory); return subcat && <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: subcat.bg, color: subcat.color }}>{subcat.name}</span>; })()}
          <div className="flex -space-x-1">{task.assignees?.slice(0, 3).map(aId => { const m = TEAM_MEMBERS.find(x => x.id === aId); return m && <div key={aId} className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium border border-white" style={{ background: m.color }} title={m.name}>{getInitials(m.name)}</div>; })}{task.assignees?.length > 3 && <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium border border-white" style={{ background: '#e8eaed', color: '#5f6368' }}>+{task.assignees.length - 3}</div>}</div>
          {task.comments?.length > 0 && !unreadCount && <div className="flex items-center gap-0.5" style={{ color: '#9aa0a6' }}><MessageSquare size={12} /><span className="text-xs">{task.comments.length}</span></div>}
          <SubtaskProgress subtasks={task.subtasks} />
          <ChevronRight size={16} style={{ color: '#dadce0' }} />
        </div>
      </div>
    </div>
  );
}

// =============================================
// TASK DETAIL
// =============================================
function TaskDetail({ task, updateTask, deleteTask, onClose, currentUser, isManager, onMarkUnread, readTimestamps, t, lang }) {
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [newSubtask, setNewSubtask] = useState('');
  const [subtaskAssignee, setSubtaskAssignee] = useState('');
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [uploadingComment, setUploadingComment] = useState(false);

  useEffect(() => { setForm({ title: task.title, description: task.description || '' }); setEditing(false); setComment(''); setNewSubtask(''); setSubtaskAssignee(''); setShowSubtaskForm(false); setEditingCommentId(null); setEditingCommentText(''); setLinkCopied(false); setCommentAttachments([]); }, [task.id]);
  
  const market = MARKETS.find(m => m.id === task.market);
  const me = TEAM_MEMBERS.find(m => m.id === currentUser);
  const subtasks = task.subtasks || [];
  const canEdit = isManager || task.createdBy === currentUser;
  const hasUnread = getUnreadCount(task, currentUser, readTimestamps) > 0;
  const publicLink = task.publicToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/task/${task.publicToken}` : null;

  const copyPublicLink = () => { if (publicLink) { navigator.clipboard.writeText(publicLink); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); } };

  const handleResendEmail = async () => { const result = await sendCompletedEmail(task, me?.name); const emailEntry = { id: generateId(), type: 'completed', sentAt: new Date().toISOString(), sentBy: currentUser, sentTo: task.submitterEmail, success: result.sent, messageId: result.messageId || null, error: result.error || null }; await updateTask(task.id, { emailHistory: [...(task.emailHistory || []), emailEntry] }, { skipEmail: true }); };

  const handleTaskAttachmentUpload = async (files) => {
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const result = await uploadFile(file, `tasks/${task.id}`);
      if (result) {
        result.uploadedBy = currentUser;
        uploaded.push(result);
      }
    }
    if (uploaded.length > 0) {
      await updateTask(task.id, { attachments: [...(task.attachments || []), ...uploaded] });
    }
    setUploading(false);
  };

  const handleRemoveTaskAttachment = async (attachmentId) => {
    const updated = (task.attachments || []).filter(a => a.id !== attachmentId);
    await updateTask(task.id, { attachments: updated });
  };

  const handleCommentAttachmentUpload = async (files) => {
    setUploadingComment(true);
    for (const file of files) {
      const result = await uploadFile(file, `comments/${task.id}`);
      if (result) {
        result.uploadedBy = currentUser;
        setCommentAttachments(prev => [...prev, result]);
      }
    }
    setUploadingComment(false);
  };

  const removeCommentAttachment = (id) => {
    setCommentAttachments(prev => prev.filter(a => a.id !== id));
  };

  const addComment = async () => { 
    if (!comment.trim() && commentAttachments.length === 0) return; 
    const newCommentObj = { 
      id: generateId(), 
      text: comment.trim(), 
      author: currentUser, 
      createdAt: new Date().toISOString(),
      attachments: commentAttachments.length > 0 ? commentAttachments : undefined
    };
    updateTask(task.id, { comments: [...(task.comments || []), newCommentObj] }); 
    setComment(''); 
    setCommentAttachments([]);
  };
  
  const editComment = (commentId) => { const c = task.comments?.find(x => x.id === commentId); if (c) { setEditingCommentId(commentId); setEditingCommentText(c.text); } };
  const saveCommentEdit = () => { if (!editingCommentText.trim()) return; updateTask(task.id, { comments: (task.comments || []).map(c => c.id === editingCommentId ? { ...c, text: editingCommentText.trim(), editedAt: new Date().toISOString() } : c) }); setEditingCommentId(null); setEditingCommentText(''); };
  const deleteComment = (commentId) => { if (confirm(t.delete + '?')) updateTask(task.id, { comments: (task.comments || []).filter(c => c.id !== commentId) }); };
  const save = () => { updateTask(task.id, { title: form.title, description: form.description }); setEditing(false); };
  const addSubtask = () => { if (!newSubtask.trim()) return; updateTask(task.id, { subtasks: [...subtasks, { id: generateId(), title: newSubtask.trim(), assignee: subtaskAssignee || null, status: 'open', createdAt: new Date().toISOString() }] }); setNewSubtask(''); setSubtaskAssignee(''); setShowSubtaskForm(false); };
  const toggleSubtask = (subId) => { updateTask(task.id, { subtasks: subtasks.map(s => s.id === subId ? { ...s, status: s.status === 'open' ? 'closed' : 'open' } : s) }); };
  const deleteSubtask = (subId) => { updateTask(task.id, { subtasks: subtasks.filter(s => s.id !== subId) }); };
  const updateSubtaskAssignee = (subId, assigneeId) => { updateTask(task.id, { subtasks: subtasks.map(s => s.id === subId ? { ...s, assignee: assigneeId || null } : s) }); };

  const formatDate = lang === 'en' ? formatDateTimeEn : formatDateTime;

  return (
    <aside className="w-[640px] bg-white border-l flex flex-col overflow-hidden flex-shrink-0" style={{ borderColor: '#e8eaed' }}>
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#e8eaed' }}>
        <div className="flex items-center gap-2"><span className="text-xl">{market?.icon}</span><span className="text-sm font-medium" style={{ color: '#202124' }}>{lang === 'en' ? market?.nameEn : market?.name}</span>{task.isExternal && <ExternalLink size={14} style={{ color: '#fbbc04' }} />}{task.language === 'en' && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#e8f0fe', color: '#1a73e8' }}>🇬🇧</span>}</div>
        <div className="flex items-center gap-1">
          {task.language === 'en' && <TranslateButton task={task} />}
          {publicLink && <button onClick={copyPublicLink} className="p-2 rounded-full hover:bg-blue-50" style={{ color: linkCopied ? '#34a853' : '#1a73e8' }} title={t.copyLink}>{linkCopied ? <Check size={18} /> : <Link2 size={18} />}</button>}
          {canEdit && <><button onClick={() => setEditing(!editing)} className="p-2 rounded-full hover:bg-gray-100" style={{ color: '#5f6368' }}><Edit3 size={18} /></button><button onClick={() => deleteTask(task.id)} className="p-2 rounded-full hover:bg-red-50" style={{ color: '#5f6368' }}><Trash2 size={18} /></button></>}
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100" style={{ color: '#5f6368' }}><X size={18} /></button>
        </div>
      </div>
      
      {publicLink && <div className="px-4 py-2 border-b flex items-center gap-2" style={{ background: '#e8f0fe', borderColor: '#c6dafc' }}><Link2 size={14} style={{ color: '#1a73e8' }} /><code className="flex-1 text-xs truncate" style={{ color: '#1a73e8' }}>{publicLink}</code><button onClick={copyPublicLink} className="text-xs px-2 py-1 rounded hover:bg-blue-100" style={{ color: '#1a73e8' }}>{linkCopied ? `✓ ${t.copied}` : t.copyLink}</button></div>}
      
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {task.isExternal && <div className="p-3 rounded-lg" style={{ background: '#fef7e0', border: '1px solid #feefc3' }}><p className="text-sm" style={{ color: '#b06000' }}>📨 {t.from}: <strong>{task.submittedBy}</strong> {task.submitterEmail && `(${task.submitterEmail})`}</p></div>}
        
        {editing ? (
          <div className="space-y-3">
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-lg font-medium" style={{ borderColor: '#dadce0', color: '#202124' }} />
            <RichTextEditor value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder={t.taskDetails} minHeight="200px" />
            <div className="flex gap-2"><button onClick={save} className="flex-1 py-2 rounded-lg font-medium text-sm" style={{ background: '#1a73e8', color: 'white' }}>{t.save}</button><button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-lg text-sm" style={{ background: '#f1f3f4', color: '#5f6368' }}>{t.cancel}</button></div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <h3 className="font-medium text-xl" style={{ color: '#202124' }}>{task.title}</h3>
              <PriorityBadge priority={task.priority} lang={lang} />
            </div>
            <RichTextDisplay html={task.description} />
          </div>
        )}
        
        {/* Priority selector */}
        <div>
          <label className="block mb-2 text-sm font-medium" style={{ color: '#202124' }}>{t.priority}</label>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map(p => (
              <button 
                key={p.id || 'none'} 
                onClick={() => updateTask(task.id, { priority: p.id })} 
                className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium"
                style={{ 
                  background: task.priority === p.id ? p.bg : '#f1f3f4', 
                  color: task.priority === p.id ? p.color : '#5f6368',
                  border: task.priority === p.id ? `2px solid ${p.color}` : '2px solid transparent'
                }}
              >
                {p.id && <Flag size={14} />}
                {lang === 'en' ? p.nameEn : p.name}
              </button>
            ))}
          </div>
        </div>
        
        {task.links && <div><label className="block mb-2 text-xs font-medium" style={{ color: '#5f6368' }}>{t.links}</label><div className="rounded-lg border p-1" style={{ background: '#f8f9fa', borderColor: '#e8eaed' }}><ClickableLinks text={task.links} /></div></div>}
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><Paperclip size={16} style={{ color: '#5f6368' }} /><label className="text-sm font-medium" style={{ color: '#202124' }}>{t.attachments} ({task.attachments?.length || 0})</label></div>
            {canEdit && <AttachmentUploader onUpload={handleTaskAttachmentUpload} uploading={uploading} />}
          </div>
          <AttachmentList attachments={task.attachments} onRemove={canEdit ? handleRemoveTaskAttachment : undefined} showRemove={canEdit} />
          {(!task.attachments || task.attachments.length === 0) && <p className="text-xs" style={{ color: '#9aa0a6' }}>{t.noAttachments}</p>}
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><ListTodo size={18} style={{ color: '#5f6368' }} /><label className="text-sm font-medium" style={{ color: '#202124' }}>{t.subtasks} ({subtasks.filter(s => s.status === 'closed').length}/{subtasks.length})</label></div>{!showSubtaskForm && <button onClick={() => setShowSubtaskForm(true)} className="text-sm flex items-center gap-1 px-3 py-1 rounded-full hover:bg-gray-100" style={{ color: '#1a73e8' }}><Plus size={16} /> {t.add}</button>}</div>
          <div className="space-y-1">{subtasks.map(sub => { const assignee = TEAM_MEMBERS.find(m => m.id === sub.assignee); const isDone = sub.status === 'closed'; return <div key={sub.id} className="flex items-center gap-2 px-3 py-2 rounded-lg group hover:bg-gray-50"><button onClick={() => toggleSubtask(sub.id)} className="flex-shrink-0">{isDone ? <CheckSquare size={20} style={{ color: '#34a853' }} /> : <Square size={20} style={{ color: '#dadce0' }} />}</button><span className="flex-1 text-sm" style={{ color: isDone ? '#9aa0a6' : '#202124', textDecoration: isDone ? 'line-through' : 'none' }}>{sub.title}</span>{assignee ? <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: assignee.color }} title={assignee.name}>{getInitials(assignee.name)}</div> : <select onChange={(e) => updateSubtaskAssignee(sub.id, e.target.value)} className="text-xs px-2 py-1 rounded border opacity-0 group-hover:opacity-100" style={{ borderColor: '#dadce0', color: '#5f6368' }} value=""><option value="">+ {lang === 'en' ? 'Assign' : 'Przypisz'}</option>{TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>}<button onClick={() => deleteSubtask(sub.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-full" style={{ color: '#ea4335' }}><X size={16} /></button></div>; })}</div>
          {showSubtaskForm && <div className="mt-3 p-3 rounded-lg border" style={{ borderColor: '#1a73e8', background: '#f8fbff' }}><input type="text" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSubtask()} placeholder={t.subtaskName} className="w-full px-3 py-2 border rounded-lg text-sm mb-2" style={{ borderColor: '#dadce0' }} autoFocus /><div className="flex items-center gap-2"><select value={subtaskAssignee} onChange={(e) => setSubtaskAssignee(e.target.value)} className="flex-1 px-2 py-1.5 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }}><option value="">{t.noAssignment}</option>{TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select><button onClick={addSubtask} className="px-4 py-1.5 rounded-lg text-sm font-medium" style={{ background: '#1a73e8', color: 'white' }}>{t.add}</button><button onClick={() => { setShowSubtaskForm(false); setNewSubtask(''); }} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: '#5f6368' }}>{t.cancel}</button></div></div>}
        </div>
        
        <div><label className="block mb-2 text-sm font-medium" style={{ color: '#202124' }}>{t.status}</label><div className="flex flex-wrap gap-2">{STATUSES.filter(s => s.id !== 'pending').map(s => <button key={s.id} onClick={() => updateTask(task.id, { status: s.id })} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ background: task.status === s.id ? s.bg : '#f1f3f4', color: task.status === s.id ? s.color : '#5f6368', border: task.status === s.id ? `2px solid ${s.color}` : '2px solid transparent' }}><s.icon size={16} /> {lang === 'en' ? s.nameEn : s.name}</button>)}</div></div>
        
        {task.market === 'pl' && <div><label className="block mb-2 text-sm font-medium" style={{ color: '#202124' }}>{t.subcategory}</label><div className="flex flex-wrap gap-2"><button onClick={() => updateTask(task.id, { subcategory: null })} className="px-4 py-2 rounded-full text-sm font-medium" style={{ background: !task.subcategory ? '#f1f3f4' : 'white', color: '#5f6368', border: !task.subcategory ? '2px solid #5f6368' : '2px solid #dadce0' }}>{t.none}</button>{PL_SUBCATEGORIES.map(s => <button key={s.id} onClick={() => updateTask(task.id, { subcategory: s.id })} className="px-4 py-2 rounded-full text-sm font-medium" style={{ background: task.subcategory === s.id ? s.bg : 'white', color: task.subcategory === s.id ? s.color : '#5f6368', border: task.subcategory === s.id ? `2px solid ${s.color}` : '2px solid #dadce0' }}>{s.name}</button>)}</div></div>}
        
        <div><label className="block mb-2 text-sm font-medium" style={{ color: '#202124' }}>{t.assigned}</label><div className="flex flex-wrap gap-2">{task.assignees?.map(aId => { const m = TEAM_MEMBERS.find(x => x.id === aId); return m && <div key={aId} className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: '#f1f3f4' }}><div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: m.color }}>{getInitials(m.name)}</div><span className="text-sm" style={{ color: '#202124' }}>{m.name}</span>{canEdit && <button onClick={() => updateTask(task.id, { assignees: task.assignees.filter(a => a !== aId) })} className="hover:text-red-500" style={{ color: '#9aa0a6' }}><X size={14} /></button>}</div>; })}{canEdit && <select onChange={(e) => { if (e.target.value && !task.assignees?.includes(e.target.value)) { updateTask(task.id, { assignees: [...(task.assignees || []), e.target.value] }); const m = TEAM_MEMBERS.find(x => x.id === e.target.value); if (m) sendEmailNotification(m.email, m.name, task.title, me?.name); } e.target.value = ''; }} className="rounded-full px-3 py-1.5 text-sm cursor-pointer" style={{ background: '#f1f3f4', border: '1px dashed #dadce0', color: '#5f6368' }} defaultValue=""><option value="">{t.addPerson}</option>{TEAM_MEMBERS.filter(m => !task.assignees?.includes(m.id)).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>}</div></div>
        
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium" style={{ color: '#202124' }}>{t.comments} ({task.comments?.length || 0})</label>
            {!hasUnread && task.comments?.length > 0 && <button onClick={() => onMarkUnread(task.id)} className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-yellow-50" style={{ color: '#b06000' }}><Inbox size={14} />{t.markUnread}</button>}
          </div>
          <div className="space-y-3 mb-4">{task.comments?.map(c => { 
            const author = TEAM_MEMBERS.find(m => m.id === c.author); 
            const isMyComment = c.author === currentUser; 
            const isExternal = c.author === 'external' || c.isExternal; 
            
            if (editingCommentId === c.id) return (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ background: author?.color || '#9aa0a6' }}>{getInitials(author?.name || '?')}</div>
                <div className="flex-1">
                  <input type="text" value={editingCommentText} onChange={(e) => setEditingCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveCommentEdit()} className="w-full px-3 py-2 border rounded-lg text-sm mb-2" style={{ borderColor: '#1a73e8' }} autoFocus />
                  <div className="flex gap-2"><button onClick={saveCommentEdit} className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: '#1a73e8', color: 'white' }}>{t.save}</button><button onClick={() => { setEditingCommentId(null); setEditingCommentText(''); }} className="text-xs px-3 py-1 rounded-full" style={{ color: '#5f6368' }}>{t.cancel}</button></div>
                </div>
              </div>
            );
            
            return (
              <div key={c.id} className="flex gap-3 group">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ background: isExternal ? '#5f6368' : (author?.color || '#9aa0a6') }}>{isExternal ? '👤' : getInitials(author?.name || '?')}</div>
                <div className="flex-1">
                  <div className="rounded-xl p-3" style={{ background: '#f1f3f4' }}>
                    <div className="flex items-center gap-2 mb-1"><span className="text-sm font-medium" style={{ color: '#202124' }}>{isExternal ? (c.authorName || task.submittedBy || 'External') : (author?.name || t.unknown)}</span><span className="text-xs" style={{ color: '#9aa0a6' }}>{formatDate(c.createdAt)}</span>{c.editedAt && <span className="text-xs" style={{ color: '#9aa0a6' }}>(edited)</span>}</div>
                    <LinkifiedText text={c.text} className="text-sm" style={{ color: '#3c4043' }} />
                    {c.attachments && c.attachments.length > 0 && <AttachmentList attachments={c.attachments} showRemove={false} compact />}
                  </div>
                  {isMyComment && <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100"><button onClick={() => editComment(c.id)} className="text-xs px-2 py-0.5 rounded hover:bg-gray-100" style={{ color: '#5f6368' }}>{t.edit}</button><button onClick={() => deleteComment(c.id)} className="text-xs px-2 py-0.5 rounded hover:bg-red-50" style={{ color: '#ea4335' }}>{t.delete}</button></div>}
                </div>
              </div>
            );
          })}</div>
          
          {commentAttachments.length > 0 && (
            <div className="mb-2 p-2 rounded-lg" style={{ background: '#f8f9fa' }}>
              <AttachmentList attachments={commentAttachments} onRemove={removeCommentAttachment} compact />
            </div>
          )}
          
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addComment()} placeholder={t.writeComment} className="w-full px-4 py-2.5 rounded-xl text-sm" style={{ background: '#f1f3f4', border: '1px solid #e8eaed' }} />
            </div>
            <AttachmentUploader onUpload={handleCommentAttachmentUpload} uploading={uploadingComment} />
            <button onClick={addComment} disabled={!comment.trim() && commentAttachments.length === 0} className="p-2.5 rounded-xl disabled:opacity-50" style={{ background: '#1a73e8', color: 'white' }}><Send size={18} /></button>
          </div>
        </div>

        <EmailHistorySection task={task} currentUser={currentUser} onResendEmail={handleResendEmail} t={t} />

        <div className="pt-4 border-t text-xs space-y-1" style={{ borderColor: '#e8eaed', color: '#9aa0a6' }}><p>{t.created}: {formatDate(task.createdAt)}</p>{task.createdBy && <p>{t.byPerson}: {TEAM_MEMBERS.find(m => m.id === task.createdBy)?.name || task.createdBy}</p>}{task.publicToken && <p>ID: {task.publicToken}</p>}</div>
      </div>
    </aside>
  );
}

// =============================================
// NEW TASK MODAL
// =============================================
function NewTaskModal({ onClose, onSave, currentUser, restrictedMarket, t, lang }) {
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    market: restrictedMarket || 'pl', 
    status: 'open', 
    assignees: [currentUser], 
    comments: [], 
    attachments: [],
    priority: null
  });
  const [uploading, setUploading] = useState(false);
  
  const toggle = (id) => setForm(p => ({ ...p, assignees: p.assignees.includes(id) ? p.assignees.filter(a => a !== id) : [...p.assignees, id] }));
  
  const handleUpload = async (files) => {
    setUploading(true);
    for (const file of files) {
      const result = await uploadFile(file, 'tasks/new');
      if (result) {
        result.uploadedBy = currentUser;
        setForm(prev => ({ ...prev, attachments: [...prev.attachments, result] }));
      }
    }
    setUploading(false);
  };
  
  const removeAttachment = (id) => {
    setForm(prev => ({ ...prev, attachments: prev.attachments.filter(a => a.id !== id) }));
  };
  
  const save = () => { if (form.title.trim()) onSave(form); };

  const availableMarkets = restrictedMarket 
    ? MARKETS.filter(m => m.id === restrictedMarket)
    : MARKETS;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ boxShadow: '0 24px 38px 3px rgba(0,0,0,.14)' }} onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#e8eaed' }}><h3 className="text-lg font-medium" style={{ color: '#202124' }}>{t.newTask}</h3><button onClick={onClose} style={{ color: '#5f6368' }}><X size={20} /></button></div>
        <div className="p-5 space-y-4">
          <div><label className="text-sm font-medium block mb-1.5" style={{ color: '#202124' }}>{t.title} *</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }} placeholder={t.whatToDo} autoFocus /></div>
          <div><label className="text-sm font-medium block mb-1.5" style={{ color: '#202124' }}>{t.description}</label><RichTextEditor value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder={t.taskDetails} /></div>
          
          {/* Priority w nowym zadaniu */}
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: '#202124' }}>{t.priority}</label>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map(p => (
                <button 
                  key={p.id || 'none'} 
                  type="button"
                  onClick={() => setForm({ ...form, priority: p.id })} 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{ 
                    background: form.priority === p.id ? p.bg : '#f1f3f4', 
                    color: form.priority === p.id ? p.color : '#5f6368',
                    border: form.priority === p.id ? `2px solid ${p.color}` : '2px solid transparent'
                  }}
                >
                  {p.id && <Flag size={12} />}
                  {lang === 'en' ? p.nameEn : p.name}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: '#202124' }}>{t.attachments}</label>
              <AttachmentUploader onUpload={handleUpload} uploading={uploading} />
            </div>
            <AttachmentList attachments={form.attachments} onRemove={removeAttachment} />
            {form.attachments.length === 0 && <p className="text-xs" style={{ color: '#9aa0a6' }}>{t.clickToAddAttachments}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#202124' }}>{t.market}</label>
              <select 
                value={form.market} 
                onChange={(e) => setForm({ ...form, market: e.target.value })} 
                className="w-full px-4 py-2.5 border rounded-lg text-sm" 
                style={{ borderColor: '#dadce0' }}
                disabled={!!restrictedMarket}
              >
                {availableMarkets.map(m => <option key={m.id} value={m.id}>{m.icon} {lang === 'en' ? m.nameEn : m.name}</option>)}
              </select>
            </div>
            <div><label className="text-sm font-medium block mb-1.5" style={{ color: '#202124' }}>{t.type}</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }}><option value="open">{lang === 'en' ? 'Open' : 'Otwarte'}</option><option value="longterm">Long-term</option></select></div>
          </div>
          <div><label className="text-sm font-medium block mb-2" style={{ color: '#202124' }}>{t.assignToPerson}</label><div className="flex flex-wrap gap-2">{TEAM_MEMBERS.map(m => <button key={m.id} type="button" onClick={() => toggle(m.id)} className="flex items-center gap-2 px-3 py-2 rounded-full border text-sm" style={{ borderColor: form.assignees.includes(m.id) ? '#1a73e8' : '#dadce0', background: form.assignees.includes(m.id) ? '#e8f0fe' : 'white', color: form.assignees.includes(m.id) ? '#1a73e8' : '#202124' }}><div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: m.color }}>{getInitials(m.name)}</div><span>{m.name.split(' ')[0]}</span>{form.assignees.includes(m.id) && <Check size={14} />}</button>)}</div></div>
        </div>
        <div className="p-5 border-t flex justify-end gap-3" style={{ borderColor: '#e8eaed' }}><button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100" style={{ color: '#5f6368' }}>{t.cancel}</button><button onClick={save} className="px-5 py-2.5 rounded-lg text-sm font-medium hover:shadow-md" style={{ background: '#1a73e8', color: 'white' }}>{t.createTask}</button></div>
      </div>
    </div>
  );
}
