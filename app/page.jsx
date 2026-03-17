'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Plus, Check, X, Edit3, Trash2, CheckCircle, Circle, Send, MessageSquare, ChevronDown, ChevronRight, Clock, AlertCircle, ExternalLink, Copy, Languages, Loader2, ListTodo, Square, CheckSquare, Bold, Italic, List, ListOrdered, LogOut, Lock, GripVertical, Filter, Underline, Link2, Undo, Redo, Inbox, Sparkles, Mail, MailCheck, MailX, RefreshCw, Paperclip, File, FileText, Image, FileSpreadsheet, Download, Flag, Users, UserPlus, Globe, EyeOff, ArrowUpDown, ArrowDown, ArrowUp, Activity, Bell, AtSign, Volume2, Pause, Eye } from 'lucide-react';
import { getTasks, createTask, updateTask as updateTaskDb, deleteTask as deleteTaskDb, getQuickLinks, createQuickLink, deleteQuickLink, uploadFile, getTeamMembers, getAllTeamMembers, createTeamMember, updateTeamMember } from '../lib/supabase';

const FALLBACK_TEAM = [
  { id: 'edyta', name: 'Edyta Kędzior', email: 'e.kedzior@angloville.pl', isManager: true, color: '#4285f4', language: 'pl', restrictedToMarket: null, seeOnlyAssigned: false },
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

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3, null: 4 };

const SORT_OPTIONS = [
  { id: 'newest', icon: ArrowDown },
  { id: 'oldest', icon: ArrowUp },
  { id: 'priority', icon: Flag },
  { id: 'activity', icon: Activity },
];

const STATUSES = [
  { id: 'pending', name: 'Oczekujące', nameEn: 'Pending', icon: AlertCircle, color: '#fbbc04', bg: '#fef7e0' },
  { id: 'open', name: 'Otwarte', nameEn: 'Open', icon: Circle, color: '#4285f4', bg: '#e8f0fe' },
  { id: 'longterm', name: 'Long-term', nameEn: 'Long-term', icon: Clock, color: '#a142f4', bg: '#f3e8fd' },
  { id: 'paused', name: 'Wstrzymane', nameEn: 'Paused', icon: Pause, color: '#ff7043', bg: '#fff3e0' },
  { id: 'monitoring', name: 'Do obserwacji', nameEn: 'Monitoring', icon: Eye, color: '#00acc1', bg: '#e0f7fa' },
  { id: 'closed', name: 'Zamknięte', nameEn: 'Closed', icon: CheckCircle, color: '#34a853', bg: '#e6f4ea' },
];

const COLORS = ['#4285f4', '#a142f4', '#34a853', '#fbbc04', '#ea4335', '#e91e63', '#00acc1', '#ff7043', '#8d6e63', '#607d8b'];

// Notification sound - base64 encoded short beep
const NOTIFICATION_SOUND = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2DgoODg4ODgoJ/fHl2c3BtamhlYl9cWVZTUE1KR0RBOQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';

const TRANSLATIONS = {
  pl: {
    marketingTasks: 'Marketing Tasks', loginTitle: 'Zaloguj się do panelu', person: 'Osoba', select: 'Wybierz...', pin: 'PIN', login: 'Zaloguj się', incorrectPin: 'Nieprawidłowy PIN', selectPerson: 'Wybierz osobę', allMarkets: 'Wszystkie rynki', everyone: 'Wszyscy', pending: 'Oczekujące', active: 'Aktywne', open: 'Otwarte', longterm: 'Long-term', paused: 'Wstrzymane', monitoring: 'Do obserwacji', closed: 'Zamknięte', formEn: 'Formularz EN:', myLinks: '📌 Moje linki', addLink: 'Dodaj link', noLinks: 'Brak linków', manager: 'Manager', pendingApproval: 'Oczekujące na akceptację', activeTasks: 'Aktywne zadania', openTasks: 'Otwarte zadania', longtermTasks: 'Zadania long-term', pausedTasks: 'Wstrzymane', monitoringTasks: 'Do obserwacji', closedTasks: 'Zamknięte zadania', allTasks: 'Wszystkie zadania', filter: 'Filtr', newTask: 'Nowe zadanie', noTasksToShow: 'Brak zadań do wyświetlenia', noPending: 'Brak oczekujących', external: 'Zewnętrzne', assignTo: 'Przypisz:', approve: 'Zatwierdź', title: 'Tytuł', description: 'Opis', attachments: 'Załączniki', noAttachments: 'Brak załączników', subtasks: 'Subtaski', add: 'Dodaj', subtaskName: 'Nazwa subtaska...', noAssignment: 'Bez przypisania', cancel: 'Anuluj', status: 'Status', subcategory: 'Podkategoria', none: 'Brak', assigned: 'Przypisani', addPerson: '+ Dodaj', comments: 'Komentarze', markUnread: 'Oznacz nieprzeczytane', edit: 'Edytuj', delete: 'Usuń', writeComment: 'Napisz komentarz... (użyj @ aby oznaczyć)', emailNotifications: 'Powiadomienia email', submittedBy: 'Zgłaszający', unknown: 'Nieznany', noEmail: 'Brak adresu email', history: 'Historia:', by: 'przez', system: 'System', resend: 'Wyślij ponownie', sendEmail: 'Wyślij email', created: 'Utworzono', byPerson: 'Przez', save: 'Zapisz', taskDetails: 'Szczegóły zadania...', whatToDo: 'Co trzeba zrobić?', market: 'Rynek', type: 'Typ', assignToPerson: 'Przypisz do', createTask: 'Utwórz zadanie', links: 'Linki', copyLink: 'Kopiuj link', copied: 'Skopiowano', from: 'Od', priority: 'Priorytet', clickToAddAttachments: 'Kliknij 📎 aby dodać załączniki', loading: 'Ładowanie...', deleteTask: 'Usunąć zadanie?', lt: 'LT', new: 'Nowy', users: 'Użytkownicy', usersPanel: 'Zarządzanie użytkownikami', addUser: 'Dodaj użytkownika', editUser: 'Edytuj użytkownika', name: 'Imię i nazwisko', email: 'Email', role: 'Rola', language: 'Język', polish: 'Polski', english: 'Angielski', restrictedMarket: 'Ograniczenie do rynku', allMarketsAccess: 'Wszystkie rynki', seeOnlyAssigned: 'Widzi tylko przypisane', seeAll: 'Widzi wszystkie zadania', isManager: 'Administrator', deactivate: 'Dezaktywuj', activate: 'Aktywuj', color: 'Kolor', unread: 'Nieodczytane', newTasks: 'Nowe zadania',
    sortBy: 'Sortuj', sortNewest: 'Od najnowszych', sortOldest: 'Od najstarszych', sortPriority: 'Po priorytecie', sortActivity: 'Po aktywności',
    notifications: 'Powiadomienia', noNotifications: 'Brak powiadomień', newComment: 'Nowy komentarz', mentionedYou: 'oznaczył(a) Cię', inTask: 'w zadaniu', markAllRead: 'Oznacz wszystkie jako przeczytane', soundOn: 'Dźwięk włączony', soundOff: 'Dźwięk wyłączony',
  },
  en: {
    marketingTasks: 'Marketing Tasks', loginTitle: 'Login to panel', person: 'Person', select: 'Select...', pin: 'PIN', login: 'Login', incorrectPin: 'Incorrect PIN', selectPerson: 'Select person', allMarkets: 'All markets', everyone: 'Everyone', pending: 'Pending', active: 'Active', open: 'Open', longterm: 'Long-term', paused: 'Paused', monitoring: 'Monitoring', closed: 'Closed', formEn: 'EN Form:', myLinks: '📌 My links', addLink: 'Add link', noLinks: 'No links', manager: 'Manager', pendingApproval: 'Pending approval', activeTasks: 'Active tasks', openTasks: 'Open tasks', longtermTasks: 'Long-term tasks', pausedTasks: 'Paused', monitoringTasks: 'Monitoring', closedTasks: 'Closed tasks', allTasks: 'All tasks', filter: 'Filter', newTask: 'New task', noTasksToShow: 'No tasks to display', noPending: 'No pending tasks', external: 'External', assignTo: 'Assign to:', approve: 'Approve', title: 'Title', description: 'Description', attachments: 'Attachments', noAttachments: 'No attachments', subtasks: 'Subtasks', add: 'Add', subtaskName: 'Subtask name...', noAssignment: 'Unassigned', cancel: 'Cancel', status: 'Status', subcategory: 'Subcategory', none: 'None', assigned: 'Assigned', addPerson: '+ Add', comments: 'Comments', markUnread: 'Mark as unread', edit: 'Edit', delete: 'Delete', writeComment: 'Write a comment... (use @ to mention)', emailNotifications: 'Email notifications', submittedBy: 'Submitted by', unknown: 'Unknown', noEmail: 'No email address', history: 'History:', by: 'by', system: 'System', resend: 'Resend', sendEmail: 'Send email', created: 'Created', byPerson: 'By', save: 'Save', taskDetails: 'Task details...', whatToDo: 'What needs to be done?', market: 'Market', type: 'Type', assignToPerson: 'Assign to', createTask: 'Create task', links: 'Links', copyLink: 'Copy link', copied: 'Copied', from: 'From', priority: 'Priority', clickToAddAttachments: 'Click 📎 to add attachments', loading: 'Loading...', deleteTask: 'Delete task?', lt: 'LT', new: 'New', users: 'Users', usersPanel: 'User management', addUser: 'Add user', editUser: 'Edit user', name: 'Full name', email: 'Email', role: 'Role', language: 'Language', polish: 'Polish', english: 'English', restrictedMarket: 'Restricted to market', allMarketsAccess: 'All markets', seeOnlyAssigned: 'See only assigned', seeAll: 'See all tasks', isManager: 'Administrator', deactivate: 'Deactivate', activate: 'Activate', color: 'Color', unread: 'Unread', newTasks: 'New tasks',
    sortBy: 'Sort', sortNewest: 'Newest first', sortOldest: 'Oldest first', sortPriority: 'By priority', sortActivity: 'By activity',
    notifications: 'Notifications', noNotifications: 'No notifications', newComment: 'New comment', mentionedYou: 'mentioned you', inTask: 'in task', markAllRead: 'Mark all as read', soundOn: 'Sound on', soundOff: 'Sound off',
  }
};

const getInitials = (name) => { const parts = name.split(' '); if (parts.length >= 2) return parts[0][0] + parts[1][0]; return name[0]; };
function PriorityBadge({ priority, size = 'normal', lang = 'pl' }) { if (!priority) return null; const p = PRIORITIES.find(pr => pr.id === priority); if (!p || !p.id) return null; const isSmall = size === 'small'; return <span className={`inline-flex items-center gap-1 ${isSmall ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'} rounded-full font-medium`} style={{ background: p.bg, color: p.color }}><Flag size={isSmall ? 10 : 12} />{lang === 'en' ? p.nameEn : p.name}</span>; }

// =============================================
// NOTIFICATION SYSTEM
// =============================================

const getReadTimestamps = (userId) => { try { return JSON.parse(localStorage.getItem(`av_read_${userId}`) || '{}'); } catch { return {}; } };
const setTaskRead = (taskId, userId) => { const ts = getReadTimestamps(userId); ts[taskId] = new Date().toISOString(); localStorage.setItem(`av_read_${userId}`, JSON.stringify(ts)); };
const setTaskUnread = (taskId, userId) => { const ts = getReadTimestamps(userId); delete ts[taskId]; localStorage.setItem(`av_read_${userId}`, JSON.stringify(ts)); };
const setAllTasksRead = (tasks, userId) => { const ts = getReadTimestamps(userId); const now = new Date().toISOString(); tasks.forEach(t => { ts[t.id] = now; }); localStorage.setItem(`av_read_${userId}`, JSON.stringify(ts)); };

const getUnreadComments = (task, userId, timestamps) => { 
  if (!task.comments?.length) return []; 
  const lastRead = timestamps[task.id]; 
  if (!lastRead) return task.comments.filter(c => c.author !== userId);
  return task.comments.filter(c => c.author !== userId && new Date(c.createdAt) > new Date(lastRead));
};

const getUnreadCount = (task, userId, timestamps) => getUnreadComments(task, userId, timestamps).length;

// Parse @mentions from comment text
const parseMentions = (text) => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1].toLowerCase());
  }
  return mentions;
};

// Check if user is mentioned in comments
const getMentionsForUser = (task, userId, timestamps, teamMembers) => {
  const unreadComments = getUnreadComments(task, userId, timestamps);
  const userMember = teamMembers.find(m => m.id === userId);
  if (!userMember) return [];
  
  const userIdentifiers = [
    userId.toLowerCase(),
    userMember.name.split(' ')[0].toLowerCase(),
    userMember.name.toLowerCase().replace(/\s+/g, '_'),
    userMember.name.toLowerCase().replace(/\s+/g, ''),
  ];
  
  return unreadComments.filter(c => {
    const mentions = parseMentions(c.text);
    return mentions.some(m => userIdentifiers.includes(m));
  });
};

const getSeenTaskIds = (userId) => { try { return JSON.parse(localStorage.getItem(`av_seen_${userId}`) || '[]'); } catch { return []; } };
const markTaskAsSeen = (taskId, userId) => { const seen = getSeenTaskIds(userId); if (!seen.includes(taskId)) { seen.push(taskId); localStorage.setItem(`av_seen_${userId}`, JSON.stringify(seen)); } };

const getSoundEnabled = (userId) => { try { return localStorage.getItem(`av_sound_${userId}`) !== 'false'; } catch { return true; } };
const setSoundEnabled = (userId, enabled) => { localStorage.setItem(`av_sound_${userId}`, enabled ? 'true' : 'false'); };

const playNotificationSound = () => {
  try {
    const audio = new Audio(NOTIFICATION_SOUND);
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch (e) {}
};

const getFileIcon = (type) => { if (type?.startsWith('image/')) return Image; if (type?.includes('spreadsheet') || type?.includes('excel')) return FileSpreadsheet; if (type?.includes('pdf') || type?.includes('document')) return FileText; return File; };
const formatFileSize = (bytes) => { if (bytes < 1024) return bytes + ' B'; if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'; return (bytes / (1024 * 1024)).toFixed(1) + ' MB'; };
const generateId = () => Math.random().toString(36).substr(2, 9);
const formatDateTime = (date) => new Date(date).toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const formatDateTimeEn = (date) => new Date(date).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const formatTimeAgo = (date) => { const diffMins = Math.floor((new Date() - new Date(date)) / 60000); if (diffMins < 1) return 'teraz'; if (diffMins < 60) return `${diffMins} min`; if (diffMins < 1440) return `${Math.floor(diffMins/60)} godz.`; return `${Math.floor(diffMins/1440)} dni`; };
const formatTimeAgoEn = (date) => { const diffMins = Math.floor((new Date() - new Date(date)) / 60000); if (diffMins < 1) return 'now'; if (diffMins < 60) return `${diffMins} min`; if (diffMins < 1440) return `${Math.floor(diffMins/60)}h`; return `${Math.floor(diffMins/1440)}d`; };

async function sendEmailNotification(to, assigneeName, taskTitle, assignedBy) { try { await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, assigneeName, taskTitle, assignedBy }) }); } catch (e) { console.log('Email skipped:', e); } }
async function sendCompletedEmail(task, completedByName) { if (!task.submitterEmail || !task.isExternal) return { sent: false }; try { const response = await fetch('/api/notify-completed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: task.submitterEmail, requesterName: task.submittedBy, taskTitle: task.title, completedBy: completedByName, publicToken: task.publicToken }) }); const data = await response.json(); return { sent: data.success || false, messageId: data.messageId }; } catch (e) { return { sent: false, error: e.message }; } }

function sortTasks(tasks, sortBy) {
  const sorted = [...tasks];
  switch (sortBy) {
    case 'newest': return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    case 'oldest': return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    case 'priority': return sorted.sort((a, b) => { const orderA = PRIORITY_ORDER[a.priority] ?? 4; const orderB = PRIORITY_ORDER[b.priority] ?? 4; if (orderA !== orderB) return orderA - orderB; return new Date(b.createdAt) - new Date(a.createdAt); });
    case 'activity': return sorted.sort((a, b) => { const lastActivityA = a.comments?.length > 0 ? Math.max(...a.comments.map(c => new Date(c.createdAt).getTime())) : new Date(a.createdAt).getTime(); const lastActivityB = b.comments?.length > 0 ? Math.max(...b.comments.map(c => new Date(c.createdAt).getTime())) : new Date(b.createdAt).getTime(); return lastActivityB - lastActivityA; });
    default: return sorted;
  }
}

// =============================================
// NOTIFICATION BELL COMPONENT - REPLACEMENT
// =============================================
// Zamień cały komponent NotificationBell (od "function NotificationBell({" do końca komponentu)
// na poniższy kod:

function NotificationBell({ tasks, currentUser, readTimestamps, teamMembers, onSelectTask, t, lang }) {
  const [open, setOpen] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const ref = useRef(null);
  const prevCountRef = useRef(0);
  
  useEffect(() => {
    setSoundEnabledState(getSoundEnabled(currentUser));
  }, [currentUser]);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Collect ALL notifications (read and unread)
  const notifications = useMemo(() => {
    const notifs = [];
    
    tasks.forEach(task => {
      if (task.status === 'pending') return;
      if (!task.comments?.length) return;
      
      const unreadComments = getUnreadComments(task, currentUser, readTimestamps);
      const unreadIds = unreadComments.map(c => c.id);
      const mentions = getMentionsForUser(task, currentUser, readTimestamps, teamMembers);
      const mentionIds = mentions.map(m => m.id);
      
      // Get ALL comments from others (not just unread)
      const allOtherComments = task.comments.filter(c => c.author !== currentUser);
      
      allOtherComments.forEach(comment => {
        const author = teamMembers.find(m => m.id === comment.author);
        const isUnread = unreadIds.includes(comment.id);
        const isMention = mentionIds.includes(comment.id) && isUnread;
        
        notifs.push({
          id: `${isMention ? 'mention' : 'comment'}-${comment.id}`,
          type: isMention ? 'mention' : 'comment',
          task,
          comment,
          author,
          createdAt: comment.createdAt,
          isRead: !isUnread,
        });
      });
    });
    
    // Sort by date, newest first
    return notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [tasks, currentUser, readTimestamps, teamMembers]);
  
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const totalCount = unreadNotifications.length;
  const mentionCount = unreadNotifications.filter(n => n.type === 'mention').length;
  
  // Play sound when new notifications appear
  useEffect(() => {
    if (totalCount > prevCountRef.current && soundEnabled) {
      playNotificationSound();
    }
    prevCountRef.current = totalCount;
  }, [totalCount, soundEnabled]);
  
  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabledState(newValue);
    setSoundEnabled(currentUser, newValue);
  };
  
  const handleMarkAllRead = () => {
    setAllTasksRead(tasks, currentUser);
    window.location.reload();
  };
  
  const handleNotificationClick = (notif) => {
    onSelectTask(notif.task);
    setOpen(false);
  };
  
  const formatTime = lang === 'en' ? formatTimeAgoEn : formatTimeAgo;
  
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        style={{ color: totalCount > 0 ? '#1a73e8' : '#5f6368' }}
      >
        <Bell size={22} className={totalCount > 0 ? 'animate-pulse' : ''} />
        {totalCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center px-1 rounded-full text-xs font-bold text-white"
            style={{ background: mentionCount > 0 ? '#ea4335' : '#fbbc04' }}
          >
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>
      
      {open && (
        <div 
          className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl overflow-hidden z-50"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,.15)', border: '1px solid #e8eaed', maxHeight: '80vh' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#e8eaed', background: '#f8f9fa' }}>
            <div className="flex items-center gap-2">
              <Bell size={18} style={{ color: '#1a73e8' }} />
              <h3 className="font-medium" style={{ color: '#202124' }}>{t.notifications}</h3>
              {totalCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#e8f0fe', color: '#1a73e8' }}>
                  {totalCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleSound}
                className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                style={{ color: soundEnabled ? '#1a73e8' : '#9aa0a6' }}
                title={soundEnabled ? t.soundOn : t.soundOff}
              >
                <Volume2 size={16} />
              </button>
              {totalCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                  style={{ color: '#1a73e8' }}
                >
                  {t.markAllRead}
                </button>
              )}
            </div>
          </div>
          
          {/* Notifications list */}
          <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={32} className="mx-auto mb-3" style={{ color: '#dadce0' }} />
                <p className="text-sm" style={{ color: '#9aa0a6' }}>{t.noNotifications}</p>
              </div>
            ) : (
              <div>
                {notifications.slice(0, 30).map(notif => {
                  const isMention = notif.type === 'mention';
                  const market = MARKETS.find(m => m.id === notif.task.market);
                  const isRead = notif.isRead;
                  
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className="w-full px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors text-left border-b"
                      style={{ 
                        borderColor: '#f1f3f4',
                        background: isRead ? '#fafafa' : 'white',
                        opacity: isRead ? 0.6 : 1,
                      }}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                          style={{ 
                            background: isRead ? '#9aa0a6' : (notif.author?.color || '#5f6368'),
                          }}
                        >
                          {notif.author ? getInitials(notif.author.name) : '?'}
                        </div>
                        {isMention && !isRead && (
                          <div 
                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: '#ea4335' }}
                          >
                            <AtSign size={12} className="text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span 
                            className="font-medium text-sm" 
                            style={{ color: isRead ? '#9aa0a6' : '#202124' }}
                          >
                            {notif.author?.name || 'Unknown'}
                          </span>
                          <span className="text-xs" style={{ color: '#9aa0a6' }}>
                            {formatTime(notif.createdAt)}
                          </span>
                          {isRead && (
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#e8eaed', color: '#9aa0a6' }}>
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-sm mb-1" style={{ color: isRead ? '#9aa0a6' : (isMention ? '#ea4335' : '#5f6368') }}>
                          {isMention ? t.mentionedYou : t.newComment}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span style={{ opacity: isRead ? 0.5 : 1 }}>{market?.icon}</span>
                          <span 
                            className="text-sm truncate" 
                            style={{ color: isRead ? '#9aa0a6' : '#202124' }}
                          >
                            {notif.task.title}
                          </span>
                        </div>
                        {/* Comment preview */}
                        <p className="text-xs mt-1 truncate" style={{ color: '#9aa0a6' }}>
                          "{notif.comment.text.substring(0, 60)}{notif.comment.text.length > 60 ? '...' : ''}"
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// MENTION INPUT COMPONENT
// =============================================

function MentionInput({ value, onChange, onSubmit, placeholder, teamMembers }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(newValue);
    setCursorPosition(cursor);
    
    // Check for @ mention
    const textBeforeCursor = newValue.substring(0, cursor);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's a space before @ (or it's at the start)
      const charBeforeAt = lastAtIndex > 0 ? newValue[lastAtIndex - 1] : ' ';
      
      if ((charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0) && !textAfterAt.includes(' ')) {
        setMentionStart(lastAtIndex);
        const query = textAfterAt.toLowerCase();
        const filtered = teamMembers.filter(m => 
          m.isActive !== false && (
            m.name.toLowerCase().includes(query) ||
            m.id.toLowerCase().includes(query) ||
            m.name.split(' ')[0].toLowerCase().includes(query)
          )
        );
        setSuggestions(filtered.slice(0, 5));
        setShowSuggestions(filtered.length > 0);
        return;
      }
    }
    
    setShowSuggestions(false);
    setMentionStart(-1);
  };
  
  const insertMention = (member) => {
    if (mentionStart === -1) return;
    
    const before = value.substring(0, mentionStart);
    const after = value.substring(cursorPosition);
    const mentionText = `@${member.name.split(' ')[0]} `;
    const newValue = before + mentionText + after;
    
    onChange(newValue);
    setShowSuggestions(false);
    setMentionStart(-1);
    
    // Focus and set cursor position
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newPos = mentionStart + mentionText.length;
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !showSuggestions) {
      e.preventDefault();
      onSubmit();
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'Tab' || (e.key === 'Enter' && showSuggestions)) {
        e.preventDefault();
        insertMention(suggestions[0]);
      }
    }
  };
  
  // Render text with highlighted mentions
  const renderMentions = (text) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} style={{ color: '#1a73e8', fontWeight: 500 }}>{part}</span>;
      }
      return part;
    });
  };
  
  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl text-sm"
        style={{ background: '#f1f3f4', border: '1px solid #e8eaed' }}
      />
      
      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div 
          ref={suggestionsRef}
          className="absolute left-0 bottom-full mb-1 w-64 bg-white rounded-lg overflow-hidden z-50"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,.15)', border: '1px solid #e8eaed' }}
        >
          <div className="px-3 py-2 border-b" style={{ borderColor: '#e8eaed', background: '#f8f9fa' }}>
            <span className="text-xs font-medium" style={{ color: '#5f6368' }}>Oznacz osobę</span>
          </div>
          {suggestions.map(member => (
            <button
              key={member.id}
              onClick={() => insertMention(member)}
              className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors text-left"
            >
              <div 
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
                style={{ background: member.color }}
              >
                {getInitials(member.name)}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#202124' }}>{member.name}</p>
                <p className="text-xs" style={{ color: '#9aa0a6' }}>@{member.name.split(' ')[0].toLowerCase()}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Render comment text with clickable mentions
function CommentText({ text, teamMembers }) {
  const parts = text.split(/(@\w+)/g);
  
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          const name = part.substring(1).toLowerCase();
          const member = teamMembers.find(m => 
            m.name.split(' ')[0].toLowerCase() === name ||
            m.id.toLowerCase() === name ||
            m.name.toLowerCase().replace(/\s+/g, '') === name
          );
          
          return (
            <span 
              key={i} 
              className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded"
              style={{ background: '#e8f0fe', color: '#1a73e8', fontWeight: 500 }}
            >
              <AtSign size={12} />
              {member ? member.name.split(' ')[0] : part.substring(1)}
            </span>
          );
        }
        return part;
      })}
    </span>
  );
}

function AttachmentUploader({ onUpload, uploading }) { const ref = useRef(null); const handleSelect = async (e) => { const files = Array.from(e.target.files); if (files.length > 0) await onUpload(files); e.target.value = ''; }; return <><input ref={ref} type="file" multiple onChange={handleSelect} className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx" /><button type="button" onClick={() => ref.current?.click()} disabled={uploading} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50" style={{ color: '#5f6368' }}>{uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}</button></>; }
function AttachmentList({ attachments, onRemove, showRemove = true }) { if (!attachments?.length) return null; return <div className="mt-3 space-y-2">{attachments.map(att => { const FileIcon = getFileIcon(att.type); const isImage = att.type?.startsWith('image/'); return <div key={att.id} className="flex items-center gap-3 px-3 py-2 rounded-lg group" style={{ background: '#f1f3f4' }}>{isImage ? <img src={att.url} alt={att.name} className="w-10 h-10 rounded object-cover cursor-pointer" onClick={() => window.open(att.url, '_blank')} /> : <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: '#e8eaed' }}><FileIcon size={20} style={{ color: '#5f6368' }} /></div>}<div className="flex-1 min-w-0"><p className="text-sm font-medium truncate" style={{ color: '#202124' }}>{att.name}</p><p className="text-xs" style={{ color: '#9aa0a6' }}>{formatFileSize(att.size)}</p></div><a href={att.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-gray-200" style={{ color: '#5f6368' }}><Download size={16} /></a>{showRemove && onRemove && <button onClick={() => onRemove(att.id)} className="p-1.5 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100" style={{ color: '#ea4335' }}><X size={16} /></button>}</div>; })}</div>; }

function LoginScreen({ onLogin, teamMembers }) { 
  const [selectedUser, setSelectedUser] = useState(''); 
  const [pin, setPin] = useState(''); 
  const [error, setError] = useState(''); 
  const [loading, setLoading] = useState(false);
  const activeMembers = teamMembers.filter(m => m.isActive !== false); 
  
  const handleLogin = async (e) => { 
    e.preventDefault(); 
    if (!selectedUser) { setError('Wybierz osobę'); return; }
    if (!pin || pin.length < 4) { setError('Wpisz 4-cyfrowy PIN'); return; }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser, pin })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('av_tasks_user', selectedUser);
        onLogin(selectedUser);
      } else {
        setError('Nieprawidłowy PIN');
        setPin('');
      }
    } catch (err) {
      setError('Błąd połączenia');
    }
    
    setLoading(false);
  }; 
  
  return <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f8f9fa' }}><div className="bg-white rounded-2xl p-8 w-full max-w-sm" style={{ boxShadow: '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)' }}><div className="text-center mb-8"><img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="Angloville" className="h-10 mx-auto mb-4" /><h1 className="text-xl font-semibold" style={{ color: '#202124' }}>Marketing Tasks</h1></div><form onSubmit={handleLogin} className="space-y-4">{error && <div className="p-3 rounded-lg text-sm text-center" style={{ background: '#fce8e6', color: '#c5221f' }}>{error}</div>}<div><label className="block text-sm font-medium mb-1.5" style={{ color: '#202124' }}>Osoba</label><select value={selectedUser} onChange={(e) => { setSelectedUser(e.target.value); setError(''); }} className="w-full px-4 py-3 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }}><option value="">Wybierz...</option>{activeMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div><div><label className="block text-sm font-medium mb-1.5" style={{ color: '#202124' }}>PIN</label><input type="password" value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }} className="w-full px-4 py-3 border rounded-lg text-sm text-center tracking-widest" style={{ borderColor: '#dadce0' }} placeholder="••••" maxLength={4} inputMode="numeric" /></div><button type="submit" disabled={loading} className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-70" style={{ background: '#1a73e8', color: 'white' }}>{loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}{loading ? 'Logowanie...' : 'Zaloguj się'}</button></form></div></div>; 
}

function RichTextEditor({ value, onChange, placeholder, minHeight = '150px' }) { const editorRef = useRef(null); useEffect(() => { if (editorRef.current && editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value || ''; }, [value]); const execCommand = (command, val = null) => { document.execCommand(command, false, val); editorRef.current?.focus(); handleChange(); }; const handleChange = () => { if (editorRef.current) onChange(editorRef.current.innerHTML); }; return <div className="border rounded-lg overflow-hidden bg-white" style={{ borderColor: '#dadce0' }}><div className="flex items-center gap-0.5 px-2 py-1.5 border-b flex-wrap" style={{ background: '#f1f3f4', borderColor: '#dadce0' }}><button type="button" onClick={() => execCommand('undo')} className="p-1.5 rounded hover:bg-gray-200"><Undo size={18} style={{ color: '#444746' }} /></button><button type="button" onClick={() => execCommand('redo')} className="p-1.5 rounded hover:bg-gray-200"><Redo size={18} style={{ color: '#444746' }} /></button><div className="w-px h-5 mx-1.5" style={{ background: '#dadce0' }} /><button type="button" onClick={() => execCommand('bold')} className="p-1.5 rounded hover:bg-gray-200"><Bold size={18} style={{ color: '#444746' }} /></button><button type="button" onClick={() => execCommand('italic')} className="p-1.5 rounded hover:bg-gray-200"><Italic size={18} style={{ color: '#444746' }} /></button><button type="button" onClick={() => execCommand('underline')} className="p-1.5 rounded hover:bg-gray-200"><Underline size={18} style={{ color: '#444746' }} /></button><div className="w-px h-5 mx-1.5" style={{ background: '#dadce0' }} /><button type="button" onClick={() => { const url = prompt('URL:'); if (url) execCommand('createLink', url); }} className="p-1.5 rounded hover:bg-gray-200"><Link2 size={18} style={{ color: '#444746' }} /></button><div className="w-px h-5 mx-1.5" style={{ background: '#dadce0' }} /><button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-1.5 rounded hover:bg-gray-200"><List size={18} style={{ color: '#444746' }} /></button><button type="button" onClick={() => execCommand('insertOrderedList')} className="p-1.5 rounded hover:bg-gray-200"><ListOrdered size={18} style={{ color: '#444746' }} /></button></div><div ref={editorRef} contentEditable onInput={handleChange} onBlur={handleChange} className="px-4 py-3 text-sm focus:outline-none overflow-y-auto" style={{ color: '#202124', minHeight, maxHeight: '400px' }} data-placeholder={placeholder} suppressContentEditableWarning /></div>; }

function RichTextDisplay({ html }) { if (!html) return null; return <div className="text-sm leading-relaxed prose prose-sm max-w-none" style={{ color: '#3c4043' }} dangerouslySetInnerHTML={{ __html: html }} />; }
function ClickableLinks({ text }) { if (!text) return null; const urlRegex = /(https?:\/\/[^\s]+)/gi; return <div className="space-y-1">{text.split('\n').map((line, idx) => <div key={idx} className="text-sm">{line.split(urlRegex).map((part, i) => part.match(urlRegex) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded-full hover:bg-blue-50" style={{ color: '#1a73e8' }}><ExternalLink size={12} />{(() => { try { return new URL(part).hostname.replace('www.', ''); } catch { return part; } })()}</a> : <span key={i} style={{ color: '#5f6368' }}>{part}</span>)}</div>)}</div>; }
function TranslateButton({ task, size = 'normal' }) { const [showPopup, setShowPopup] = useState(false); if (task.language !== 'en') return null; return <><button onClick={(e) => { e.stopPropagation(); setShowPopup(true); }} className="p-1 rounded hover:bg-blue-50" style={{ color: '#1a73e8' }}><Languages size={size === 'small' ? 14 : 16} /></button>{showPopup && <TranslationPopup title={task.title} description={task.description} onClose={() => setShowPopup(false)} />}</>; }
function TranslationPopup({ title, description, onClose }) { const [translatedTitle, setTranslatedTitle] = useState(''); const [translatedDesc, setTranslatedDesc] = useState(''); const [loading, setLoading] = useState(true); useEffect(() => { async function translate() { setLoading(true); const plainTitle = title?.replace(/<[^>]*>/g, ' ').trim() || ''; const plainDesc = description?.replace(/<[^>]*>/g, ' ').trim() || ''; try { const [tTitle, tDesc] = await Promise.all([ fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(plainTitle)}&langpair=en|pl`).then(r => r.json()), plainDesc ? fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(plainDesc.substring(0, 500))}&langpair=en|pl`).then(r => r.json()) : Promise.resolve(null) ]); setTranslatedTitle(tTitle?.responseData?.translatedText || plainTitle); setTranslatedDesc(tDesc?.responseData?.translatedText || plainDesc); } catch { setTranslatedTitle(plainTitle); setTranslatedDesc(plainDesc); } setLoading(false); } translate(); }, [title, description]); return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}><div className="bg-white rounded-xl w-full max-w-md" style={{ boxShadow: '0 24px 38px 3px rgba(0,0,0,.14)' }} onClick={e => e.stopPropagation()}><div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#e8eaed' }}><div className="flex items-center gap-2"><Languages size={20} style={{ color: '#1a73e8' }} /><h3 className="font-medium" style={{ color: '#202124' }}>🇬🇧 → 🇵🇱</h3></div><button onClick={onClose} className="p-1 rounded hover:bg-gray-100" style={{ color: '#5f6368' }}><X size={18} /></button></div><div className="p-5 space-y-4">{loading ? <div className="flex items-center justify-center py-8"><Loader2 size={24} className="animate-spin" style={{ color: '#1a73e8' }} /></div> : <><div><label className="block text-xs font-medium mb-1" style={{ color: '#5f6368' }}>Tytuł</label><div className="p-3 rounded-lg" style={{ background: '#e8f0fe' }}><p className="text-sm font-medium" style={{ color: '#202124' }}>{translatedTitle}</p></div></div>{translatedDesc && <div><label className="block text-xs font-medium mb-1" style={{ color: '#5f6368' }}>Opis</label><div className="p-3 rounded-lg" style={{ background: '#e8f0fe' }}><p className="text-sm" style={{ color: '#3c4043' }}>{translatedDesc}</p></div></div>}</>}</div></div></div>; }
function SubtaskProgress({ subtasks }) { if (!subtasks?.length) return null; const done = subtasks.filter(s => s.status === 'closed').length; return <div className="flex items-center gap-1.5"><ListTodo size={12} style={{ color: '#5f6368' }} /><span className="text-xs" style={{ color: '#5f6368' }}>{done}/{subtasks.length}</span></div>; }

function UsersPanel({ teamMembers, onUpdate, onClose, t }) {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => { loadAllUsers(); }, []);
  const loadAllUsers = async () => { setLoading(true); const users = await getAllTeamMembers(); setAllUsers(users); setLoading(false); };
  const handleSaveUser = async (userData) => { if (editingUser) { await updateTeamMember(editingUser.id, userData); } else { await createTeamMember(userData); } await loadAllUsers(); onUpdate(); setEditingUser(null); setShowAddForm(false); };
  const handleToggleActive = async (user) => { await updateTeamMember(user.id, { isActive: !user.isActive }); await loadAllUsers(); onUpdate(); };

  return (
    <aside className="w-[500px] bg-white border-l flex flex-col overflow-hidden flex-shrink-0" style={{ borderColor: '#e8eaed' }}>
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#e8eaed' }}>
        <div className="flex items-center gap-2"><Users size={20} style={{ color: '#1a73e8' }} /><h2 className="font-medium" style={{ color: '#202124' }}>{t.usersPanel}</h2></div>
        <div className="flex items-center gap-2"><button onClick={() => { setShowAddForm(true); setEditingUser(null); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: '#1a73e8', color: 'white' }}><UserPlus size={16} /> {t.addUser}</button><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100" style={{ color: '#5f6368' }}><X size={18} /></button></div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? <div className="flex items-center justify-center py-8"><Loader2 size={24} className="animate-spin" style={{ color: '#1a73e8' }} /></div> : (showAddForm || editingUser) ? (
          <UserForm user={editingUser} onSave={handleSaveUser} onCancel={() => { setShowAddForm(false); setEditingUser(null); }} t={t} />
        ) : (
          <div className="space-y-2">{allUsers.map(user => (
            <div key={user.id} className="p-4 rounded-lg border" style={{ borderColor: '#e8eaed', background: user.isActive ? 'white' : '#f8f9fa', opacity: user.isActive ? 1 : 0.7 }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ background: user.color }}>{getInitials(user.name)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><h3 className="font-medium" style={{ color: '#202124' }}>{user.name}</h3>{user.isManager && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#e8f0fe', color: '#1a73e8' }}>Admin</span>}{!user.isActive && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#fce8e6', color: '#c5221f' }}>Nieaktywny</span>}</div>
                  <p className="text-sm" style={{ color: '#5f6368' }}>{user.email}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: '#5f6368' }}><span className="flex items-center gap-1"><Globe size={12} />{user.language === 'en' ? 'EN' : 'PL'}</span>{user.restrictedToMarket && <span>{MARKETS.find(m => m.id === user.restrictedToMarket)?.icon} {MARKETS.find(m => m.id === user.restrictedToMarket)?.name}</span>}{user.seeOnlyAssigned && <span className="flex items-center gap-1"><EyeOff size={12} />Tylko przypisane</span>}</div>
                </div>
                <div className="flex items-center gap-1"><button onClick={() => setEditingUser(user)} className="p-2 rounded-full hover:bg-gray-100" style={{ color: '#5f6368' }}><Edit3 size={16} /></button><button onClick={() => handleToggleActive(user)} className="p-2 rounded-full hover:bg-gray-100" style={{ color: user.isActive ? '#ea4335' : '#34a853' }}>{user.isActive ? <X size={16} /> : <Check size={16} />}</button></div>
              </div>
            </div>
          ))}</div>
        )}
      </div>
    </aside>
  );
}

function UserForm({ user, onSave, onCancel, t }) {
  const isEditing = !!user?.id;
  const [form, setForm] = useState({ id: user?.id || '', name: user?.name || '', email: user?.email || '', pin: '', color: user?.color || COLORS[Math.floor(Math.random() * COLORS.length)], role: user?.role || '', isManager: user?.isManager || false, language: user?.language || 'pl', restrictedToMarket: user?.restrictedToMarket || null, seeOnlyAssigned: user?.seeOnlyAssigned || false });
  const handleSubmit = (e) => { e.preventDefault(); const id = form.id || form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''); const data = { ...form, id }; if (isEditing && !form.pin) delete data.pin; onSave(data); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="block text-sm font-medium mb-1" style={{ color: '#202124' }}>{t.name} *</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }} required /></div>
      <div><label className="block text-sm font-medium mb-1" style={{ color: '#202124' }}>{t.email} *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }} required /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium mb-1" style={{ color: '#202124' }}>PIN {isEditing ? '(zostaw puste = bez zmian)' : '*'}</label><input type="text" value={form.pin} onChange={e => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })} className="w-full px-3 py-2 border rounded-lg text-sm text-center tracking-widest" style={{ borderColor: '#dadce0' }} maxLength={4} placeholder={isEditing ? '••••' : ''} required={!isEditing} /></div>
        <div><label className="block text-sm font-medium mb-1" style={{ color: '#202124' }}>{t.color}</label><div className="flex gap-1 flex-wrap">{COLORS.map(c => <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className="w-6 h-6 rounded-full" style={{ background: c, border: form.color === c ? '2px solid #202124' : '2px solid transparent' }} />)}</div></div>
      </div>
      <div><label className="block text-sm font-medium mb-1" style={{ color: '#202124' }}>{t.role}</label><input type="text" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }} placeholder="np. Content, Ads, Tech..." /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium mb-1" style={{ color: '#202124' }}>{t.language}</label><select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }}><option value="pl">🇵🇱 {t.polish}</option><option value="en">🇬🇧 {t.english}</option></select></div>
        <div><label className="block text-sm font-medium mb-1" style={{ color: '#202124' }}>{t.restrictedMarket}</label><select value={form.restrictedToMarket || ''} onChange={e => setForm({ ...form, restrictedToMarket: e.target.value || null })} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }}><option value="">{t.allMarketsAccess}</option>{MARKETS.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}</select></div>
      </div>
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.seeOnlyAssigned} onChange={e => setForm({ ...form, seeOnlyAssigned: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm" style={{ color: '#202124' }}>{t.seeOnlyAssigned}</span></label>
        <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.isManager} onChange={e => setForm({ ...form, isManager: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm" style={{ color: '#202124' }}>{t.isManager}</span></label>
      </div>
      <div className="flex gap-3 pt-4"><button type="submit" className="flex-1 py-2.5 rounded-lg font-medium text-sm" style={{ background: '#1a73e8', color: 'white' }}>{t.save}</button><button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-lg font-medium text-sm" style={{ background: '#f1f3f4', color: '#5f6368' }}>{t.cancel}</button></div>
    </form>
  );
}

function QuickLinksSection({ currentUser, t }) {
  const [links, setLinks] = useState([]); const [loading, setLoading] = useState(true); const [showAdd, setShowAdd] = useState(false); const [newLink, setNewLink] = useState({ name: '', url: '' }); const [expanded, setExpanded] = useState(true);
  useEffect(() => { loadLinks(); }, [currentUser]);
  const loadLinks = async () => { setLoading(true); const data = await getQuickLinks(currentUser); setLinks(data); setLoading(false); };
  const handleAdd = async () => { if (!newLink.name.trim() || !newLink.url.trim()) return; await createQuickLink({ ...newLink, userId: currentUser }); setNewLink({ name: '', url: '' }); setShowAdd(false); loadLinks(); };
  const handleDelete = async (id) => { await deleteQuickLink(id); loadLinks(); };
  return <div className="mt-4 mx-2"><button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-2 py-1 text-xs font-medium rounded hover:bg-gray-100" style={{ color: '#5f6368' }}><span>{t.myLinks}</span><ChevronDown size={14} className={`transition-transform ${expanded ? '' : '-rotate-90'}`} /></button>{expanded && <div className="mt-2 space-y-1">{loading ? <Loader2 size={14} className="animate-spin mx-auto" style={{ color: '#5f6368' }} /> : <>{links.map(link => <div key={link.id} className="flex items-center gap-1 group"><a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-xs px-2 py-1.5 rounded hover:bg-gray-100 truncate" style={{ color: '#1a73e8' }}>{link.name}</a><button onClick={() => handleDelete(link.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50" style={{ color: '#ea4335' }}><X size={12} /></button></div>)}{links.length === 0 && !showAdd && <p className="text-xs px-2" style={{ color: '#9aa0a6' }}>{t.noLinks}</p>}{showAdd ? <div className="p-2 rounded-lg" style={{ background: '#f1f3f4' }}><input type="text" value={newLink.name} onChange={e => setNewLink({ ...newLink, name: e.target.value })} className="w-full px-2 py-1 text-xs rounded border mb-1" style={{ borderColor: '#dadce0' }} placeholder="Nazwa" /><input type="url" value={newLink.url} onChange={e => setNewLink({ ...newLink, url: e.target.value })} className="w-full px-2 py-1 text-xs rounded border mb-2" style={{ borderColor: '#dadce0' }} placeholder="https://..." /><div className="flex gap-1"><button onClick={handleAdd} className="flex-1 py-1 rounded text-xs font-medium" style={{ background: '#1a73e8', color: 'white' }}>{t.add}</button><button onClick={() => { setShowAdd(false); setNewLink({ name: '', url: '' }); }} className="px-2 py-1 rounded text-xs" style={{ color: '#5f6368' }}>{t.cancel}</button></div></div> : <button onClick={() => setShowAdd(true)} className="w-full text-xs px-2 py-1.5 rounded hover:bg-gray-100 text-left" style={{ color: '#1a73e8' }}>+ {t.addLink}</button>}</>}</div>}</div>;
}

function SortDropdown({ value, onChange, t }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const options = [
    { id: 'newest', label: t.sortNewest, icon: ArrowDown },
    { id: 'oldest', label: t.sortOldest, icon: ArrowUp },
    { id: 'priority', label: t.sortPriority, icon: Flag },
    { id: 'activity', label: t.sortActivity, icon: Activity },
  ];
  
  const current = options.find(o => o.id === value) || options[0];
  const CurrentIcon = current.icon;
  
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100"
        style={{ color: '#5f6368', border: '1px solid #dadce0' }}
      >
        <ArrowUpDown size={16} />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      
      {open && (
        <div 
          className="absolute right-0 top-full mt-1 bg-white rounded-lg py-1 z-20 min-w-[180px]"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,.15)', border: '1px solid #e8eaed' }}
        >
          {options.map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => { onChange(opt.id); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-left"
                style={{ 
                  color: value === opt.id ? '#1a73e8' : '#202124',
                  background: value === opt.id ? '#e8f0fe' : 'transparent'
                }}
              >
                <Icon size={16} />
                <span>{opt.label}</span>
                {value === opt.id && <Check size={16} className="ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PendingView({ tasks, approveTask, deleteTask, currentUser, t, lang, teamMembers }) {
  const [selected, setSelected] = useState({});
  const toggle = (taskId, memberId) => { setSelected(p => { const curr = p[taskId] || []; return { ...p, [taskId]: curr.includes(memberId) ? curr.filter(x => x !== memberId) : [...curr, memberId] }; }); };
  if (!tasks.length) return <div className="max-w-3xl mx-auto text-center py-16"><CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#34a853', opacity: 0.4 }} /><p style={{ color: '#5f6368' }}>{t.noPending}</p></div>;
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {tasks.map(task => { const market = MARKETS.find(m => m.id === task.market); const assignees = selected[task.id] || task.assignees || []; return (
        <div key={task.id} className="bg-white rounded-xl p-5 border" style={{ borderColor: '#e8eaed' }}>
          {task.isExternal && <div className="flex items-center gap-2 mb-3 pb-3 border-b" style={{ borderColor: '#e8eaed' }}><ExternalLink size={14} style={{ color: '#fbbc04' }} /><span className="text-xs font-medium" style={{ color: '#b06000' }}>{t.external}</span>{task.language === 'en' && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#e8f0fe', color: '#1a73e8' }}>🇬🇧</span>}<span className="text-xs" style={{ color: '#9aa0a6' }}>{t.from} {task.submittedBy}</span></div>}
          <div className="flex items-start gap-3 mb-4"><span className="text-xl">{market?.icon}</span><div className="flex-1"><div className="flex items-center gap-2 flex-wrap"><h3 className="font-medium text-lg" style={{ color: '#202124' }}>{task.title}</h3><TranslateButton task={task} /><PriorityBadge priority={task.priority} lang={lang} /></div>{task.description && <div className="mt-2"><RichTextDisplay html={task.description} /></div>}{task.links && <div className="mt-3 p-3 rounded-lg" style={{ background: '#f8f9fa' }}><ClickableLinks text={task.links} /></div>}<AttachmentList attachments={task.attachments} showRemove={false} /></div></div>
          <div className="mb-4"><p className="text-xs font-medium mb-2" style={{ color: '#5f6368' }}>{t.assignTo}</p><div className="flex flex-wrap gap-2">{teamMembers.filter(m => m.isActive !== false).map(m => <button key={m.id} onClick={() => toggle(task.id, m.id)} className="flex items-center gap-2 px-3 py-2 rounded-full border text-sm" style={{ borderColor: assignees.includes(m.id) ? '#1a73e8' : '#dadce0', background: assignees.includes(m.id) ? '#e8f0fe' : 'white', color: assignees.includes(m.id) ? '#1a73e8' : '#202124' }}><div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: m.color }}>{getInitials(m.name)}</div><span>{m.name.split(' ')[0]}</span>{assignees.includes(m.id) && <Check size={14} />}</button>)}</div></div>
          <div className="flex gap-2 pt-4 border-t" style={{ borderColor: '#e8eaed' }}><button onClick={() => approveTask(task, assignees)} disabled={!assignees.length} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium disabled:opacity-50" style={{ background: assignees.length ? '#1a73e8' : '#f1f3f4', color: assignees.length ? 'white' : '#9aa0a6' }}><Check size={18} /> {t.approve}</button><button onClick={() => deleteTask(task.id)} className="px-4 py-2.5 rounded-lg hover:bg-red-50" style={{ color: '#ea4335', border: '1px solid #f5c6cb' }}><X size={18} /></button></div>
        </div>
      ); })}
    </div>
  );
}

function TaskItem({ task, isSelected, onClick, onStatusChange, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, dragOverId, currentUser, readTimestamps, seenTaskIds, lang, t, teamMembers }) {
  const market = MARKETS.find(m => m.id === task.market);
  const status = STATUSES.find(s => s.id === task.status);
  const Icon = status?.icon || Circle;
  const cycle = (e) => { e.stopPropagation(); onStatusChange(task.status === 'open' ? 'closed' : 'open'); };
  const isDropTarget = dragOverId === task.id;
  const unreadCount = getUnreadCount(task, currentUser, readTimestamps);
  const mentionCount = getMentionsForUser(task, currentUser, readTimestamps, teamMembers).length;
  const isNewTask = task.assignees?.includes(currentUser) && task.createdBy !== currentUser && !seenTaskIds.includes(task.id);
  const hasEmailPending = task.isExternal && task.submitterEmail && task.status === 'closed' && !(task.emailHistory || []).some(e => e.type === 'completed' && e.success);
  const hasAttachments = task.attachments?.length > 0;
  
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
          {mentionCount > 0 && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium" style={{ background: '#ea4335', color: 'white' }}><AtSign size={10} />{mentionCount}</span>}
          {unreadCount > 0 && mentionCount === 0 && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium" style={{ background: '#fbbc04', color: 'white' }}><MessageSquare size={10} />{unreadCount}</span>}
          {hasEmailPending && <span className="px-1.5 py-0.5 rounded-full text-xs font-medium" style={{ background: '#ea4335', color: 'white' }}><MailX size={10} /></span>}
          {hasAttachments && <span className="flex items-center gap-1 text-xs" style={{ color: '#5f6368' }}><Paperclip size={12} />{task.attachments.length}</span>}
          {task.isExternal && <ExternalLink size={12} style={{ color: '#fbbc04' }} />}
          {task.language === 'en' && <TranslateButton task={task} size="small" />}
          {task.status === 'longterm' && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#f3e8fd', color: '#a142f4' }}>{t.lt}</span>}
          {task.status === 'paused' && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#fff3e0', color: '#ff7043' }}>⏸️</span>}
          {task.status === 'monitoring' && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#e0f7fa', color: '#00acc1' }}>👁️</span>}
          {task.market === 'pl' && task.subcategory && (() => { const subcat = PL_SUBCATEGORIES.find(s => s.id === task.subcategory); return subcat && <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: subcat.bg, color: subcat.color }}>{subcat.name}</span>; })()}
          <div className="flex -space-x-1">{task.assignees?.slice(0, 3).map(aId => { const m = teamMembers.find(x => x.id === aId); return m && <div key={aId} className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium border border-white" style={{ background: m.color }} title={m.name}>{getInitials(m.name)}</div>; })}{task.assignees?.length > 3 && <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium border border-white" style={{ background: '#e8eaed', color: '#5f6368' }}>+{task.assignees.length - 3}</div>}</div>
          {task.comments?.length > 0 && !unreadCount && <div className="flex items-center gap-0.5" style={{ color: '#9aa0a6' }}><MessageSquare size={12} /><span className="text-xs">{task.comments.length}</span></div>}
          <SubtaskProgress subtasks={task.subtasks} />
          <ChevronRight size={16} style={{ color: '#dadce0' }} />
        </div>
      </div>
    </div>
  );
}

function TaskDetail({ task, updateTask, deleteTask, onClose, currentUser, isManager, onMarkUnread, readTimestamps, t, lang, teamMembers }) {
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [newSubtask, setNewSubtask] = useState('');
  const [subtaskAssignee, setSubtaskAssignee] = useState('');
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [uploadingComment, setUploadingComment] = useState(false);

  useEffect(() => { setForm({ title: task.title, description: task.description || '' }); setEditing(false); setComment(''); setNewSubtask(''); setSubtaskAssignee(''); setShowSubtaskForm(false); setLinkCopied(false); setCommentAttachments([]); }, [task.id]);
  
  const market = MARKETS.find(m => m.id === task.market);
  const me = teamMembers.find(m => m.id === currentUser);
  const subtasks = task.subtasks || [];
  const canEdit = isManager || task.createdBy === currentUser;
  const publicLink = task.publicToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/task/${task.publicToken}` : null;

  const copyPublicLink = () => { if (publicLink) { navigator.clipboard.writeText(publicLink); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); } };

  const handleTaskAttachmentUpload = async (files) => { setUploading(true); const uploaded = []; for (const file of files) { const result = await uploadFile(file, `tasks/${task.id}`); if (result) { result.uploadedBy = currentUser; uploaded.push(result); } } if (uploaded.length > 0) await updateTask(task.id, { attachments: [...(task.attachments || []), ...uploaded] }); setUploading(false); };
  const handleRemoveTaskAttachment = async (attachmentId) => { await updateTask(task.id, { attachments: (task.attachments || []).filter(a => a.id !== attachmentId) }); };
  const handleCommentAttachmentUpload = async (files) => { setUploadingComment(true); for (const file of files) { const result = await uploadFile(file, `comments/${task.id}`); if (result) { result.uploadedBy = currentUser; setCommentAttachments(prev => [...prev, result]); } } setUploadingComment(false); };
  const removeCommentAttachment = (id) => { setCommentAttachments(prev => prev.filter(a => a.id !== id)); };
  
  const addComment = async () => { 
    if (!comment.trim() && commentAttachments.length === 0) return; 
    const newCommentObj = { 
      id: generateId(), 
      text: comment.trim(), 
      author: currentUser, 
      createdAt: new Date().toISOString(), 
      attachments: commentAttachments.length > 0 ? commentAttachments : undefined,
      mentions: parseMentions(comment.trim())
    }; 
    updateTask(task.id, { comments: [...(task.comments || []), newCommentObj] }); 
    setComment(''); 
    setCommentAttachments([]); 
  };
  
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
          <div><div className="flex items-center gap-2 flex-wrap mb-3"><h3 className="font-medium text-xl" style={{ color: '#202124' }}>{task.title}</h3><PriorityBadge priority={task.priority} lang={lang} /></div><RichTextDisplay html={task.description} /></div>
        )}
        
        <div><label className="block mb-2 text-sm font-medium" style={{ color: '#202124' }}>{t.priority}</label><div className="flex flex-wrap gap-2">{PRIORITIES.map(p => <button key={p.id || 'none'} onClick={() => updateTask(task.id, { priority: p.id })} className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium" style={{ background: task.priority === p.id ? p.bg : '#f1f3f4', color: task.priority === p.id ? p.color : '#5f6368', border: task.priority === p.id ? `2px solid ${p.color}` : '2px solid transparent' }}>{p.id && <Flag size={14} />}{lang === 'en' ? p.nameEn : p.name}</button>)}</div></div>
        
        {task.links && <div><label className="block mb-2 text-xs font-medium" style={{ color: '#5f6368' }}>{t.links}</label><div className="rounded-lg border p-1" style={{ background: '#f8f9fa', borderColor: '#e8eaed' }}><ClickableLinks text={task.links} /></div></div>}
        
        <div><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Paperclip size={16} style={{ color: '#5f6368' }} /><label className="text-sm font-medium" style={{ color: '#202124' }}>{t.attachments} ({task.attachments?.length || 0})</label></div>{canEdit && <AttachmentUploader onUpload={handleTaskAttachmentUpload} uploading={uploading} />}</div><AttachmentList attachments={task.attachments} onRemove={canEdit ? handleRemoveTaskAttachment : undefined} showRemove={canEdit} />{(!task.attachments || task.attachments.length === 0) && <p className="text-xs" style={{ color: '#9aa0a6' }}>{t.noAttachments}</p>}</div>
        
        <div><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><ListTodo size={18} style={{ color: '#5f6368' }} /><label className="text-sm font-medium" style={{ color: '#202124' }}>{t.subtasks} ({subtasks.filter(s => s.status === 'closed').length}/{subtasks.length})</label></div>{!showSubtaskForm && <button onClick={() => setShowSubtaskForm(true)} className="text-sm flex items-center gap-1 px-3 py-1 rounded-full hover:bg-gray-100" style={{ color: '#1a73e8' }}><Plus size={16} /> {t.add}</button>}</div><div className="space-y-1">{subtasks.map(sub => { const assignee = teamMembers.find(m => m.id === sub.assignee); const isDone = sub.status === 'closed'; return <div key={sub.id} className="flex items-center gap-2 px-3 py-2 rounded-lg group hover:bg-gray-50"><button onClick={() => toggleSubtask(sub.id)} className="flex-shrink-0">{isDone ? <CheckSquare size={20} style={{ color: '#34a853' }} /> : <Square size={20} style={{ color: '#dadce0' }} />}</button><span className="flex-1 text-sm" style={{ color: isDone ? '#9aa0a6' : '#202124', textDecoration: isDone ? 'line-through' : 'none' }}>{sub.title}</span>{assignee ? <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: assignee.color }} title={assignee.name}>{getInitials(assignee.name)}</div> : <select onChange={(e) => updateSubtaskAssignee(sub.id, e.target.value)} className="text-xs px-2 py-1 rounded border opacity-0 group-hover:opacity-100" style={{ borderColor: '#dadce0', color: '#5f6368' }} value=""><option value="">+ {lang === 'en' ? 'Assign' : 'Przypisz'}</option>{teamMembers.filter(m => m.isActive !== false).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>}<button onClick={() => deleteSubtask(sub.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-full" style={{ color: '#ea4335' }}><X size={16} /></button></div>; })}</div>{showSubtaskForm && <div className="mt-3 p-3 rounded-lg border" style={{ borderColor: '#1a73e8', background: '#f8fbff' }}><input type="text" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSubtask()} placeholder={t.subtaskName} className="w-full px-3 py-2 border rounded-lg text-sm mb-2" style={{ borderColor: '#dadce0' }} autoFocus /><div className="flex items-center gap-2"><select value={subtaskAssignee} onChange={(e) => setSubtaskAssignee(e.target.value)} className="flex-1 px-2 py-1.5 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }}><option value="">{t.noAssignment}</option>{teamMembers.filter(m => m.isActive !== false).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select><button onClick={addSubtask} className="px-4 py-1.5 rounded-lg text-sm font-medium" style={{ background: '#1a73e8', color: 'white' }}>{t.add}</button><button onClick={() => { setShowSubtaskForm(false); setNewSubtask(''); }} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: '#5f6368' }}>{t.cancel}</button></div></div>}</div>
        
        <div><label className="block mb-2 text-sm font-medium" style={{ color: '#202124' }}>{t.status}</label><div className="flex flex-wrap gap-2">{STATUSES.filter(s => s.id !== 'pending').map(s => <button key={s.id} onClick={() => updateTask(task.id, { status: s.id })} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ background: task.status === s.id ? s.bg : '#f1f3f4', color: task.status === s.id ? s.color : '#5f6368', border: task.status === s.id ? `2px solid ${s.color}` : '2px solid transparent' }}><s.icon size={16} /> {lang === 'en' ? s.nameEn : s.name}</button>)}</div></div>
        
        {task.market === 'pl' && <div><label className="block mb-2 text-sm font-medium" style={{ color: '#202124' }}>{t.subcategory}</label><div className="flex flex-wrap gap-2"><button onClick={() => updateTask(task.id, { subcategory: null })} className="px-4 py-2 rounded-full text-sm font-medium" style={{ background: !task.subcategory ? '#f1f3f4' : 'white', color: '#5f6368', border: !task.subcategory ? '2px solid #5f6368' : '2px solid #dadce0' }}>{t.none}</button>{PL_SUBCATEGORIES.map(s => <button key={s.id} onClick={() => updateTask(task.id, { subcategory: s.id })} className="px-4 py-2 rounded-full text-sm font-medium" style={{ background: task.subcategory === s.id ? s.bg : 'white', color: task.subcategory === s.id ? s.color : '#5f6368', border: task.subcategory === s.id ? `2px solid ${s.color}` : '2px solid #dadce0' }}>{s.name}</button>)}</div></div>}
        
        <div><label className="block mb-2 text-sm font-medium" style={{ color: '#202124' }}>{t.assigned}</label><div className="flex flex-wrap gap-2">{task.assignees?.map(aId => { const m = teamMembers.find(x => x.id === aId); return m && <div key={aId} className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: '#f1f3f4' }}><div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: m.color }}>{getInitials(m.name)}</div><span className="text-sm" style={{ color: '#202124' }}>{m.name}</span>{canEdit && <button onClick={() => updateTask(task.id, { assignees: task.assignees.filter(a => a !== aId) })} className="hover:text-red-500" style={{ color: '#9aa0a6' }}><X size={14} /></button>}</div>; })}{canEdit && <select onChange={(e) => { if (e.target.value && !task.assignees?.includes(e.target.value)) { updateTask(task.id, { assignees: [...(task.assignees || []), e.target.value] }); const m = teamMembers.find(x => x.id === e.target.value); if (m) sendEmailNotification(m.email, m.name, task.title, me?.name); } e.target.value = ''; }} className="rounded-full px-3 py-1.5 text-sm cursor-pointer" style={{ background: '#f1f3f4', border: '1px dashed #dadce0', color: '#5f6368' }} defaultValue=""><option value="">{t.addPerson}</option>{teamMembers.filter(m => m.isActive !== false && !task.assignees?.includes(m.id)).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>}</div></div>
        
        {/* Comments with @mentions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium" style={{ color: '#202124' }}>{t.comments} ({task.comments?.length || 0})</label>
            {onMarkUnread && getUnreadCount(task, currentUser, readTimestamps) === 0 && task.comments?.length > 0 && <button onClick={() => onMarkUnread(task.id)} className="text-xs px-2 py-1 rounded hover:bg-gray-100" style={{ color: '#5f6368' }}>{t.markUnread}</button>}
          </div>
          <div className="space-y-3 mb-4">
            {task.comments?.map(c => { 
              const author = teamMembers.find(m => m.id === c.author); 
              const isExternal = c.author === 'external'; 
              const hasMentionOfMe = c.mentions?.some(m => {
                const myMember = teamMembers.find(tm => tm.id === currentUser);
                if (!myMember) return false;
                const myIdentifiers = [
                  currentUser.toLowerCase(),
                  myMember.name.split(' ')[0].toLowerCase(),
                ];
                return myIdentifiers.includes(m.toLowerCase());
              });
              
              return (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ background: isExternal ? '#5f6368' : (author?.color || '#999') }}>
                    {isExternal ? '👤' : getInitials(author?.name || '?')}
                  </div>
                  <div className="flex-1">
                    <div 
                      className="rounded-xl p-3" 
                      style={{ 
                        background: hasMentionOfMe ? '#fce8e6' : '#f1f3f4',
                        border: hasMentionOfMe ? '1px solid #f5c6cb' : 'none'
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium" style={{ color: '#202124' }}>
                          {isExternal ? (c.authorName || task.submittedBy || 'Zewnętrzny') : (author?.name || t.unknown)}
                        </span>
                        <span className="text-xs" style={{ color: '#9aa0a6' }}>{formatDate(c.createdAt)}</span>
                        {hasMentionOfMe && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs" style={{ background: '#ea4335', color: 'white' }}>
                            <AtSign size={10} />
                          </span>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: '#3c4043' }}>
                        <CommentText text={c.text} teamMembers={teamMembers} />
                      </p>
                      <AttachmentList attachments={c.attachments} showRemove={false} />
                    </div>
                  </div>
                </div>
              ); 
            })}
          </div>
          
          {/* Comment input with @mention support */}
          <div className="flex gap-2 items-start">
            <MentionInput 
              value={comment}
              onChange={setComment}
              onSubmit={addComment}
              placeholder={t.writeComment}
              teamMembers={teamMembers}
            />
            <AttachmentUploader onUpload={handleCommentAttachmentUpload} uploading={uploadingComment} />
            <button onClick={addComment} className="p-2.5 rounded-xl" style={{ background: '#1a73e8', color: 'white' }}><Send size={18} /></button>
          </div>
          <AttachmentList attachments={commentAttachments} onRemove={removeCommentAttachment} />
        </div>
        
        <div className="pt-4 border-t text-xs" style={{ borderColor: '#e8eaed', color: '#9aa0a6' }}><p>{t.created}: {formatDate(task.createdAt)}</p>{task.createdBy && <p>{t.byPerson}: {teamMembers.find(m => m.id === task.createdBy)?.name}</p>}</div>
      </div>
    </aside>
  );
}

function NewTaskModal({ onClose, onSave, currentUser, restrictedMarket, t, lang, teamMembers }) {
  const [form, setForm] = useState({ title: '', description: '', market: restrictedMarket || 'pl', status: 'open', assignees: [currentUser], priority: null, subcategory: null, attachments: [] });
  const [uploading, setUploading] = useState(false);
  const toggle = (id) => setForm(p => ({ ...p, assignees: p.assignees.includes(id) ? p.assignees.filter(a => a !== id) : [...p.assignees, id] }));
  const save = () => { if (form.title.trim()) onSave(form); };
  const handleUpload = async (files) => { setUploading(true); for (const file of files) { const result = await uploadFile(file, 'tasks/new'); if (result) { result.uploadedBy = currentUser; setForm(p => ({ ...p, attachments: [...p.attachments, result] })); } } setUploading(false); };
  const removeAttachment = (id) => { setForm(p => ({ ...p, attachments: p.attachments.filter(a => a.id !== id) })); };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ boxShadow: '0 24px 38px 3px rgba(0,0,0,.14)' }} onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#e8eaed' }}><h3 className="text-lg font-medium" style={{ color: '#202124' }}>{t.newTask}</h3><button onClick={onClose} style={{ color: '#5f6368' }}><X size={20} /></button></div>
        <div className="p-5 space-y-4">
          <div><label className="text-sm font-medium block mb-1.5" style={{ color: '#202124' }}>{t.title} *</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }} placeholder={t.whatToDo} autoFocus /></div>
          <div><label className="text-sm font-medium block mb-1.5" style={{ color: '#202124' }}>{t.description}</label><RichTextEditor value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder={t.taskDetails} minHeight="120px" /></div>
          <div><div className="flex items-center justify-between mb-1.5"><label className="text-sm font-medium" style={{ color: '#202124' }}>{t.attachments}</label><AttachmentUploader onUpload={handleUpload} uploading={uploading} /></div><AttachmentList attachments={form.attachments} onRemove={removeAttachment} />{form.attachments.length === 0 && <p className="text-xs" style={{ color: '#9aa0a6' }}>{t.clickToAddAttachments}</p>}</div>
          <div><label className="text-sm font-medium block mb-1.5" style={{ color: '#202124' }}>{t.priority}</label><div className="flex flex-wrap gap-2">{PRIORITIES.map(p => <button key={p.id || 'none'} type="button" onClick={() => setForm({ ...form, priority: p.id })} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm" style={{ background: form.priority === p.id ? p.bg : '#f1f3f4', color: form.priority === p.id ? p.color : '#5f6368', border: form.priority === p.id ? `2px solid ${p.color}` : '2px solid transparent' }}>{p.id && <Flag size={12} />}{lang === 'en' ? p.nameEn : p.name}</button>)}</div></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium block mb-1.5" style={{ color: '#202124' }}>{t.market}</label><select value={form.market} onChange={(e) => setForm({ ...form, market: e.target.value, subcategory: e.target.value === 'pl' ? form.subcategory : null })} className="w-full px-4 py-2.5 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }} disabled={!!restrictedMarket}>{MARKETS.map(m => <option key={m.id} value={m.id}>{m.icon} {lang === 'en' ? m.nameEn : m.name}</option>)}</select></div>
            <div><label className="text-sm font-medium block mb-1.5" style={{ color: '#202124' }}>{t.type}</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }}><option value="open">{t.open}</option><option value="longterm">{t.longterm}</option><option value="paused">{t.paused}</option><option value="monitoring">{t.monitoring}</option></select></div>
          </div>
          {form.market === 'pl' && <div><label className="text-sm font-medium block mb-1.5" style={{ color: '#202124' }}>{t.subcategory}</label><div className="flex gap-2"><button type="button" onClick={() => setForm({ ...form, subcategory: null })} className="px-3 py-1.5 rounded-full text-sm" style={{ background: !form.subcategory ? '#f1f3f4' : 'white', color: '#5f6368', border: !form.subcategory ? '2px solid #5f6368' : '2px solid #dadce0' }}>{t.none}</button>{PL_SUBCATEGORIES.map(s => <button key={s.id} type="button" onClick={() => setForm({ ...form, subcategory: s.id })} className="px-3 py-1.5 rounded-full text-sm" style={{ background: form.subcategory === s.id ? s.bg : 'white', color: form.subcategory === s.id ? s.color : '#5f6368', border: form.subcategory === s.id ? `2px solid ${s.color}` : '2px solid #dadce0' }}>{s.name}</button>)}</div></div>}
          <div><label className="text-sm font-medium block mb-2" style={{ color: '#202124' }}>{t.assignToPerson}</label><div className="flex flex-wrap gap-2">{teamMembers.filter(m => m.isActive !== false).map(m => <button key={m.id} type="button" onClick={() => toggle(m.id)} className="flex items-center gap-2 px-3 py-2 rounded-full border text-sm" style={{ borderColor: form.assignees.includes(m.id) ? '#1a73e8' : '#dadce0', background: form.assignees.includes(m.id) ? '#e8f0fe' : 'white', color: form.assignees.includes(m.id) ? '#1a73e8' : '#202124' }}><div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: m.color }}>{getInitials(m.name)}</div><span>{m.name.split(' ')[0]}</span>{form.assignees.includes(m.id) && <Check size={14} />}</button>)}</div></div>
        </div>
        <div className="p-5 border-t flex justify-end gap-3" style={{ borderColor: '#e8eaed' }}><button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100" style={{ color: '#5f6368' }}>{t.cancel}</button><button onClick={save} className="px-5 py-2.5 rounded-lg text-sm font-medium" style={{ background: '#1a73e8', color: 'white' }}>{t.createTask}</button></div>
      </div>
    </div>
  );
}

export default function TaskApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState(FALLBACK_TEAM);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showUsersPanel, setShowUsersPanel] = useState(false);
  const [filterMarket, setFilterMarket] = useState('all');
  const [filterPerson, setFilterPerson] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [sortBy, setSortBy] = useState('newest');
  const [activeTab, setActiveTab] = useState('tasks');
  const [copied, setCopied] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [readTimestamps, setReadTimestamps] = useState({});
  const [seenTaskIds, setSeenTaskIds] = useState([]);

  useEffect(() => { async function loadTeam() { setLoadingTeam(true); const members = await getTeamMembers(); if (members.length > 0) setTeamMembers(members); setLoadingTeam(false); } loadTeam(); }, []);

  const currentMember = teamMembers.find(m => m.id === currentUser);
  const lang = currentMember?.language || 'pl';
  const t = TRANSLATIONS[lang];
  const isManager = currentMember?.isManager || false;
  const restrictedMarket = currentMember?.restrictedToMarket || null;
  const seeOnlyAssigned = currentMember?.seeOnlyAssigned || false;

  useEffect(() => { if (currentUser) { setReadTimestamps(getReadTimestamps(currentUser)); setSeenTaskIds(getSeenTaskIds(currentUser)); } }, [currentUser]);
  useEffect(() => { const savedUser = localStorage.getItem('av_tasks_user'); if (savedUser) { const checkUser = async () => { const members = await getTeamMembers(); if (members.find(m => m.id === savedUser)) { setCurrentUser(savedUser); setTeamMembers(members); } setCheckingAuth(false); }; checkUser(); } else { setCheckingAuth(false); } }, []);
  useEffect(() => { if (restrictedMarket) setFilterMarket(restrictedMarket); }, [restrictedMarket]);
  
  const loadTasks = async () => { const data = await getTasks(); setTasks(data); setLoading(false); };
  useEffect(() => { if (currentUser) loadTasks(); }, [currentUser]);
  
  // Auto-refresh tasks every 30 seconds to catch new comments
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      loadTasks();
    }, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);
  
  const handleLogout = () => { localStorage.removeItem('av_tasks_user'); setCurrentUser(null); setTasks([]); setSelectedTask(null); setShowUsersPanel(false); };
  const handleSelectTask = useCallback((task) => { setSelectedTask(task); setShowUsersPanel(false); if (currentUser && task) { setTaskRead(task.id, currentUser); setReadTimestamps(prev => ({ ...prev, [task.id]: new Date().toISOString() })); markTaskAsSeen(task.id, currentUser); setSeenTaskIds(prev => prev.includes(task.id) ? prev : [...prev, task.id]); } }, [currentUser]);
  const handleMarkUnread = useCallback((taskId) => { if (currentUser) { setTaskUnread(taskId, currentUser); setReadTimestamps(prev => { const ns = { ...prev }; delete ns[taskId]; return ns; }); } }, [currentUser]);
  const reloadTeamMembers = async () => { const members = await getTeamMembers(); if (members.length > 0) setTeamMembers(members); };

  if (checkingAuth || loadingTeam) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fa' }}><Loader2 className="animate-spin" size={32} style={{ color: '#1a73e8' }} /></div>;
  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} teamMembers={teamMembers} />;

  const pendingTasks = tasks.filter(task => task.status === 'pending' && (!restrictedMarket || task.market === restrictedMarket));
  const visibleTasks = tasks.filter(task => { 
    if (task.status === 'pending') return false; 
    if (restrictedMarket && task.market !== restrictedMarket) return false;
    if (seeOnlyAssigned && !task.assignees?.includes(currentUser)) return false;
    if (filterMarket !== 'all' && task.market !== filterMarket) return false; 
    if (filterPerson !== 'all' && !task.assignees?.includes(filterPerson)) return false; 
    return true; 
  });
  
  const getFilteredByStatus = (sf) => { switch (sf) { case 'active': return visibleTasks.filter(t => t.status === 'open' || t.status === 'longterm'); case 'open': return visibleTasks.filter(t => t.status === 'open'); case 'longterm': return visibleTasks.filter(t => t.status === 'longterm'); case 'paused': return visibleTasks.filter(t => t.status === 'paused'); case 'monitoring': return visibleTasks.filter(t => t.status === 'monitoring'); case 'closed': return visibleTasks.filter(t => t.status === 'closed'); default: return visibleTasks; } };
  
  const filteredTasks = sortTasks(getFilteredByStatus(filterStatus), sortBy);
  
  const openTasks = visibleTasks.filter(t => t.status === 'open');
  const longtermTasks = visibleTasks.filter(t => t.status === 'longterm');
  const pausedTasks = visibleTasks.filter(t => t.status === 'paused');
  const monitoringTasks = visibleTasks.filter(t => t.status === 'monitoring');
  const closedTasks = visibleTasks.filter(t => t.status === 'closed');

  const updateTask = async (id, updates, options = {}) => { 
    const oldTask = tasks.find(t => t.id === id);
    const newTask = { ...oldTask, ...updates };
    setTasks(prev => prev.map(t => t.id === id ? newTask : t)); 
    if (selectedTask?.id === id) setSelectedTask(newTask);
    if (updates.status === 'closed' && oldTask?.status !== 'closed' && oldTask?.isExternal && oldTask?.submitterEmail && !options.skipEmail) {
      const result = await sendCompletedEmail(oldTask, currentMember?.name);
      const emailEntry = { id: generateId(), type: 'completed', sentAt: new Date().toISOString(), sentBy: currentUser, sentTo: oldTask.submitterEmail, success: result.sent };
      updates.emailHistory = [...(oldTask.emailHistory || []), emailEntry];
      newTask.emailHistory = updates.emailHistory;
      setTasks(prev => prev.map(t => t.id === id ? newTask : t)); 
      if (selectedTask?.id === id) setSelectedTask(newTask);
    }
    await updateTaskDb(id, updates);
  };
  const deleteTask = async (id) => { if (confirm(t.deleteTask)) { setTasks(prev => prev.filter(t => t.id !== id)); setSelectedTask(null); await deleteTaskDb(id); } };
  const approveTask = async (task, assignees) => { await updateTask(task.id, { status: 'open', assignees, approvedAt: new Date().toISOString(), approvedBy: currentUser }); for (const aId of assignees) { const m = teamMembers.find(x => x.id === aId); if (m) await sendEmailNotification(m.email, m.name, task.title, currentMember?.name); } setActiveTab('tasks'); };
  const addTask = async (task) => { const newTask = { ...task, createdAt: new Date().toISOString(), createdBy: currentUser, isExternal: false, subtasks: [] }; const created = await createTask(newTask); if (created) await loadTasks(); setShowNewTask(false); for (const aId of task.assignees || []) { const m = teamMembers.find(x => x.id === aId); if (m && m.id !== currentUser) await sendEmailNotification(m.email, m.name, task.title, currentMember?.name); } };

  const handleDragStart = (e, task) => { setDraggedTask(task); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e, targetTask) => { e.preventDefault(); if (draggedTask && targetTask.id !== draggedTask.id && targetTask.status === draggedTask.status) setDragOverId(targetTask.id); };
  const handleDrop = async (e, targetTask) => { e.preventDefault(); setDragOverId(null); if (!draggedTask || draggedTask.id === targetTask.id || draggedTask.status !== targetTask.status) { setDraggedTask(null); return; } const statusTasks = filteredTasks.filter(t => t.status === draggedTask.status); const di = statusTasks.findIndex(t => t.id === draggedTask.id); const ti = statusTasks.findIndex(t => t.id === targetTask.id); if (di === -1 || ti === -1) { setDraggedTask(null); return; } const nst = [...statusTasks]; nst.splice(di, 1); nst.splice(ti, 0, draggedTask); const updates = nst.map((t, idx) => ({ id: t.id, order: idx })); setTasks(prev => { const other = prev.filter(t => t.status !== draggedTask.status); return [...other, ...nst.map((t, idx) => ({ ...t, order: idx }))].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); }); for (const u of updates) await updateTaskDb(u.id, { order: u.order }); setDraggedTask(null); };
  const handleDragEnd = () => { setDraggedTask(null); setDragOverId(null); };

  const formUrl = typeof window !== 'undefined' ? `${window.location.origin}/request` : '/request';
  const copyLink = () => { navigator.clipboard.writeText(formUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fa', color: '#5f6368' }}>{t.loading}</div>;

  return (
    <div className="min-h-screen flex" style={{ background: '#f8f9fa' }}>
      <aside className="w-56 flex flex-col min-h-screen flex-shrink-0 border-r bg-white" style={{ borderColor: '#e8eaed' }}>
        <div className="p-4 border-b" style={{ borderColor: '#e8eaed' }}><img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="Angloville" className="h-7" /><p className="mt-1 text-xs" style={{ color: '#5f6368' }}>{t.marketingTasks}</p></div>
        <div className="p-3 border-b space-y-2" style={{ borderColor: '#e8eaed' }}>
          {!restrictedMarket && <select value={filterMarket} onChange={(e) => setFilterMarket(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm border" style={{ borderColor: '#dadce0', color: '#202124' }}><option value="all">{t.allMarkets}</option>{MARKETS.map(m => <option key={m.id} value={m.id}>{m.icon} {lang === 'en' ? m.nameEn : m.name}</option>)}</select>}
          {!seeOnlyAssigned && <select value={filterPerson} onChange={(e) => setFilterPerson(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm border" style={{ borderColor: '#dadce0', color: '#202124' }}><option value="all">{t.everyone}</option>{teamMembers.filter(m => m.isActive !== false).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>}
        </div>
        <div className="p-2 flex-1">
          <div className="space-y-0.5">
            {isManager && pendingTasks.length > 0 && <button onClick={() => { setActiveTab('pending'); setShowUsersPanel(false); }} className="w-full flex items-center justify-between px-3 py-2 rounded-full text-sm" style={{ background: activeTab === 'pending' ? '#fef7e0' : 'transparent', color: activeTab === 'pending' ? '#b06000' : '#202124' }}><div className="flex items-center gap-3"><AlertCircle size={18} style={{ color: '#fbbc04' }} /><span>{t.pending}</span></div><span className="font-medium" style={{ color: '#fbbc04' }}>{pendingTasks.length}</span></button>}
            <button onClick={() => { setActiveTab('tasks'); setFilterStatus('active'); setShowUsersPanel(false); }} className="w-full flex items-center justify-between px-3 py-2 rounded-full text-sm" style={{ background: activeTab === 'tasks' && filterStatus === 'active' && !showUsersPanel ? '#e8f0fe' : 'transparent', color: activeTab === 'tasks' && filterStatus === 'active' ? '#1a73e8' : '#202124' }}><div className="flex items-center gap-3"><Filter size={18} style={{ color: '#1a73e8' }} /><span>{t.active}</span></div><span className="font-medium">{openTasks.length + longtermTasks.length}</span></button>
            <button onClick={() => { setActiveTab('tasks'); setFilterStatus('open'); setShowUsersPanel(false); }} className="w-full flex items-center justify-between px-3 py-2 rounded-full text-sm" style={{ background: activeTab === 'tasks' && filterStatus === 'open' ? '#e8f0fe' : 'transparent', color: '#202124' }}><div className="flex items-center gap-3 pl-2"><Circle size={16} style={{ color: '#4285f4' }} /><span>{t.open}</span></div><span style={{ color: '#5f6368' }}>{openTasks.length}</span></button>
            <button onClick={() => { setActiveTab('tasks'); setFilterStatus('longterm'); setShowUsersPanel(false); }} className="w-full flex items-center justify-between px-3 py-2 rounded-full text-sm" style={{ background: activeTab === 'tasks' && filterStatus === 'longterm' ? '#f3e8fd' : 'transparent', color: '#202124' }}><div className="flex items-center gap-3 pl-2"><Clock size={16} style={{ color: '#a142f4' }} /><span>{t.longterm}</span></div><span style={{ color: '#5f6368' }}>{longtermTasks.length}</span></button>
            <button onClick={() => { setActiveTab('tasks'); setFilterStatus('paused'); setShowUsersPanel(false); }} className="w-full flex items-center justify-between px-3 py-2 rounded-full text-sm" style={{ background: activeTab === 'tasks' && filterStatus === 'paused' ? '#fff3e0' : 'transparent', color: '#202124' }}><div className="flex items-center gap-3 pl-2"><Pause size={16} style={{ color: '#ff7043' }} /><span>{t.paused}</span></div><span style={{ color: '#5f6368' }}>{pausedTasks.length}</span></button>
            <button onClick={() => { setActiveTab('tasks'); setFilterStatus('monitoring'); setShowUsersPanel(false); }} className="w-full flex items-center justify-between px-3 py-2 rounded-full text-sm" style={{ background: activeTab === 'tasks' && filterStatus === 'monitoring' ? '#e0f7fa' : 'transparent', color: '#202124' }}><div className="flex items-center gap-3 pl-2"><Eye size={16} style={{ color: '#00acc1' }} /><span>{t.monitoring}</span></div><span style={{ color: '#5f6368' }}>{monitoringTasks.length}</span></button>
            <button onClick={() => { setActiveTab('tasks'); setFilterStatus('closed'); setShowUsersPanel(false); }} className="w-full flex items-center justify-between px-3 py-2 rounded-full text-sm" style={{ background: activeTab === 'tasks' && filterStatus === 'closed' ? '#e6f4ea' : 'transparent', color: '#202124' }}><div className="flex items-center gap-3 pl-2"><CheckCircle size={16} style={{ color: '#34a853' }} /><span>{t.closed}</span></div><span style={{ color: '#5f6368' }}>{closedTasks.length}</span></button>
          </div>
          {isManager && <button onClick={() => { setShowUsersPanel(true); setSelectedTask(null); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-full text-sm mt-4" style={{ background: showUsersPanel ? '#e8f0fe' : 'transparent', color: showUsersPanel ? '#1a73e8' : '#202124' }}><Users size={18} style={{ color: '#1a73e8' }} /><span>{t.users}</span></button>}
          <div className="mt-4 mx-2 p-3 rounded-lg text-xs" style={{ background: '#f1f3f4' }}><p className="mb-1.5" style={{ color: '#5f6368' }}>{t.formEn}</p><button onClick={copyLink} className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200"><code className="flex-1 text-xs truncate" style={{ color: '#1a73e8' }}>/request</code>{copied ? <Check size={14} style={{ color: '#34a853' }} /> : <Copy size={14} style={{ color: '#5f6368' }} />}</button></div>
          <QuickLinksSection currentUser={currentUser} t={t} />
        </div>
        <div className="p-3 border-t" style={{ borderColor: '#e8eaed' }}><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: currentMember?.color }}>{getInitials(currentMember?.name || '')}</div><div className="flex-1 min-w-0"><div className="text-sm font-medium truncate" style={{ color: '#202124' }}>{currentMember?.name?.split(' ')[0]}</div>{isManager && <div className="text-xs" style={{ color: '#5f6368' }}>{t.manager}</div>}</div><button onClick={handleLogout} className="p-1.5 rounded-full hover:bg-gray-100" style={{ color: '#5f6368' }}><LogOut size={18} /></button></div></div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between" style={{ borderColor: '#e8eaed' }}>
          <div><h2 className="text-lg font-medium" style={{ color: '#202124' }}>{showUsersPanel ? t.usersPanel : activeTab === 'pending' ? t.pendingApproval : filterStatus === 'active' ? t.activeTasks : filterStatus === 'open' ? t.openTasks : filterStatus === 'longterm' ? t.longtermTasks : filterStatus === 'paused' ? t.pausedTasks : filterStatus === 'monitoring' ? t.monitoringTasks : t.closedTasks}</h2>{filterPerson !== 'all' && !showUsersPanel && <p className="text-xs" style={{ color: '#5f6368' }}>{t.filter}: {teamMembers.find(m => m.id === filterPerson)?.name}</p>}</div>
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <NotificationBell 
              tasks={tasks}
              currentUser={currentUser}
              readTimestamps={readTimestamps}
              teamMembers={teamMembers}
              onSelectTask={handleSelectTask}
              t={t}
              lang={lang}
            />
            
            {!showUsersPanel && activeTab === 'tasks' && (
              <SortDropdown value={sortBy} onChange={setSortBy} t={t} />
            )}
            {!showUsersPanel && <><button onClick={loadTasks} className="p-2 rounded-full hover:bg-gray-100" style={{ color: '#5f6368' }}><Loader2 size={18} className={loading ? 'animate-spin' : ''} /></button>{activeTab === 'tasks' && <button onClick={() => setShowNewTask(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm" style={{ background: '#1a73e8', color: 'white' }}><Plus size={18} /> {t.newTask}</button>}</>}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          {showUsersPanel ? null : activeTab === 'pending' && isManager ? <PendingView tasks={pendingTasks} approveTask={approveTask} deleteTask={deleteTask} currentUser={currentUser} t={t} lang={lang} teamMembers={teamMembers} /> : (
            <div className="max-w-4xl mx-auto">{filteredTasks.length === 0 ? <div className="text-center py-16"><CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#34a853', opacity: 0.4 }} /><p style={{ color: '#5f6368' }}>{t.noTasksToShow}</p></div> : <div className="space-y-1">{filteredTasks.map(task => <TaskItem key={task.id} task={task} isSelected={selectedTask?.id === task.id} onClick={() => handleSelectTask(task)} onStatusChange={(s) => updateTask(task.id, { status: s })} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onDragEnd={handleDragEnd} isDragging={draggedTask?.id === task.id} dragOverId={dragOverId} currentUser={currentUser} readTimestamps={readTimestamps} seenTaskIds={seenTaskIds} lang={lang} t={t} teamMembers={teamMembers} />)}</div>}</div>
          )}
        </div>
      </main>
      
      {showUsersPanel && <UsersPanel teamMembers={teamMembers} onUpdate={reloadTeamMembers} onClose={() => setShowUsersPanel(false)} t={t} />}
      {selectedTask && !showUsersPanel && <TaskDetail task={selectedTask} updateTask={updateTask} deleteTask={deleteTask} onClose={() => setSelectedTask(null)} currentUser={currentUser} isManager={isManager} onMarkUnread={handleMarkUnread} readTimestamps={readTimestamps} t={t} lang={lang} teamMembers={teamMembers} />}
      {showNewTask && <NewTaskModal onClose={() => setShowNewTask(false)} onSave={addTask} currentUser={currentUser} restrictedMarket={restrictedMarket} t={t} lang={lang} teamMembers={teamMembers} />}
    </div>
  );
}
