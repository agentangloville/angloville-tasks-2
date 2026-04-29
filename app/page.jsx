'use client';

// Google-style font injection
if (typeof document !== 'undefined') {
  const existingLink = document.querySelector('link[href*="fonts.googleapis.com/css2?family=Google+Sans"]');
  if (!existingLink) {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@400;500&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    const style = document.createElement('style');
    style.textContent = `
      * { font-family: 'Google Sans', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif !important; }
      input, select, textarea, button, code { font-family: 'Google Sans', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif !important; }
      code { font-family: 'Google Sans Mono', 'Roboto Mono', monospace !important; }
      button { transition: background 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease; }
      button:active:not(:disabled) { transform: scale(0.98); }
      select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235f6368' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; padding-right: 24px !important; }
      input:focus, select:focus, textarea:focus { outline: none; border-color: #1a73e8 !important; box-shadow: 0 0 0 2px rgba(26,115,232,0.2) !important; }
      ::-webkit-scrollbar { width: 8px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #dadce0; border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: #bdc1c6; }
      .animate-pulse { animation: google-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      @keyframes google-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    `;
    document.head.appendChild(style);
  }
}



import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Plus, Check, X, Edit3, Trash2, CheckCircle, Circle, Send, MessageSquare, ChevronDown, ChevronRight, Clock, AlertCircle, ExternalLink, Copy, Languages, Loader2, ListTodo, Square, CheckSquare, Bold, Italic, List, ListOrdered, LogOut, Lock, Filter, Underline, Link2, Undo, Redo, Inbox, Sparkles, Mail, MailCheck, MailX, RefreshCw, Paperclip, File, FileText, Image, FileSpreadsheet, Download, Flag, Users, UserPlus, Globe, EyeOff, ArrowUpDown, ArrowDown, ArrowUp, Activity, Bell, AtSign, Volume2, Pause, Eye, Menu, ThumbsUp, BarChart3, TrendingUp, TrendingDown, Calendar, ChevronUp, Tag, Lightbulb, CalendarClock, ClipboardCheck, Phone, Search } from 'lucide-react';
import { getTasks, createTask, updateTask as updateTaskDb, deleteTask as deleteTaskDb, getQuickLinks, createQuickLink, deleteQuickLink, uploadFile, getTeamMembers, getAllTeamMembers, createTeamMember, updateTeamMember, getCustomTags, createCustomTag, updateCustomTag, deleteCustomTag as deleteCustomTagDb, getReadTimestampsFromDb, setTaskReadInDb, setTaskUnreadInDb, setAllTasksReadInDb } from '../lib/supabase';
import { getScheduledSends, updateScheduledSend, createScheduledSend } from '../lib/supabase-planner';

// XSS sanitizer – strips dangerous tags/attributes without external dependency
function sanitizeHtml(html) {
  if (typeof document === 'undefined') return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, iframe, object, embed, form, input, textarea, button, meta, link, base, svg').forEach(el => el.remove());
  doc.querySelectorAll('*').forEach(el => {
    for (const attr of [...el.attributes]) {
      if (attr.name.startsWith('on') || attr.value.trim().toLowerCase().startsWith('javascript:')) {
        el.removeAttribute(attr.name);
      }
    }
  });
  return doc.body.innerHTML;
}

const FALLBACK_TEAM = [
  { id: 'edyta', name: 'Edyta Kędzior', email: 'e.kedzior@angloville.pl', isManager: true, color: '#3b82f6', language: 'pl', restrictedToMarket: null, seeOnlyAssigned: false, defaultTasksView: 'all', defaultSendsView: 'all' },
];

const MARKETS = [
  { id: 'pl', name: 'Polska', nameEn: 'Poland', icon: '🇵🇱' },
  { id: 'ns', name: 'Native Speakers', nameEn: 'Native Speakers', icon: '🇬🇧' },
  { id: 'it', name: 'Włochy', nameEn: 'Italy', icon: '🇮🇹' },
  { id: 'exchange', name: 'Wymiana', nameEn: 'Exchange', icon: '🎓' },
  { id: 'tefl', name: 'TEFL in Asia', nameEn: 'TEFL in Asia', icon: '🌏' },
  { id: 'brazil', name: 'Brazylia', nameEn: 'Brazil', icon: '🇧🇷' },
];

const PL_SUBCATEGORIES = [
  { id: 'adult', name: 'Adult', color: '#1a73e8', bg: '#e8f0fe' },
  { id: 'junior', name: 'Junior', color: '#ec4899', bg: '#fce7f3' },
];

const PRIORITIES = [
  { id: null, name: 'Brak', nameEn: 'None', color: '#80868b', bg: '#f1f3f4' },
  { id: 'low', name: 'Niski', nameEn: 'Low', color: '#16a34a', bg: '#f0fdf4' },
  { id: 'medium', name: 'Średni', nameEn: 'Medium', color: '#f59e0b', bg: '#fefce8' },
  { id: 'high', name: 'Wysoki', nameEn: 'High', color: '#ef4444', bg: '#fef2f2' },
  { id: 'urgent', name: 'Pilny', nameEn: 'Urgent', color: '#b91c1c', bg: '#fef2f2' },
];

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3, null: 4 };
const TAG_COLORS = ['#3b82f6', '#7c3aed', '#16a34a', '#f59e0b', '#ef4444', '#ec4899', '#0891b2', '#ea580c', '#8d6e63', '#607d8b'];

const STATUSES = [
  { id: 'pending', name: 'Oczekujące', nameEn: 'Pending', icon: AlertCircle, color: '#f59e0b', bg: '#fefce8' },
  { id: 'open', name: 'Otwarte', nameEn: 'Open', icon: Circle, color: '#3b82f6', bg: '#e8f0fe' },
  { id: 'longterm', name: 'Long-term', nameEn: 'Long-term', icon: Clock, color: '#7c3aed', bg: '#f5f3ff' },
  { id: 'paused', name: 'Wstrzymane', nameEn: 'Paused', icon: Pause, color: '#ea580c', bg: '#fff7ed' },
  { id: 'monitoring', name: 'Do obserwacji', nameEn: 'Monitoring', icon: Eye, color: '#0891b2', bg: '#ecfeff' },
  { id: 'approval', name: 'Do akceptacji', nameEn: 'For approval', icon: ClipboardCheck, color: '#0d9488', bg: '#f0fdfa' },
  { id: 'ideas', name: 'Pomysły', nameEn: 'Ideas', icon: Lightbulb, color: '#ca8a04', bg: '#fefce8' },
  { id: 'closed', name: 'Zamknięte', nameEn: 'Closed', icon: CheckCircle, color: '#16a34a', bg: '#f0fdf4' },
];

const COLORS = ['#3b82f6', '#7c3aed', '#16a34a', '#f59e0b', '#ef4444', '#ec4899', '#0891b2', '#ea580c', '#8d6e63', '#607d8b'];

const TRANSLATIONS = {
  pl: {
    marketingTasks: 'Marketing Tasks', loginTitle: 'Zaloguj się do panelu', person: 'Osoba', select: 'Wybierz...', pin: 'PIN', login: 'Zaloguj się', incorrectPin: 'Nieprawidłowy PIN', selectPerson: 'Wybierz osobę', allMarkets: 'Wszystkie rynki', everyone: 'Wszyscy', pending: 'Oczekujące', active: 'Aktywne', open: 'Otwarte', longterm: 'Long-term', paused: 'Wstrzymane', monitoring: 'Do obserwacji', ideas: 'Pomysły', approval: 'Do akceptacji', closed: 'Zamknięte', formEn: 'Formularz EN:', myLinks: '📌 Moje linki', addLink: 'Dodaj link', noLinks: 'Brak linków', manager: 'Manager', pendingApproval: 'Oczekujące na akceptację', activeTasks: 'Aktywne zadania', openTasks: 'Otwarte zadania', longtermTasks: 'Zadania long-term', pausedTasks: 'Wstrzymane', monitoringTasks: 'Do obserwacji', approvalTasks: 'Do akceptacji', ideasTasks: 'Pomysły', closedTasks: 'Zamknięte zadania', allTasks: 'Wszystkie zadania', filter: 'Filtr', newTask: 'Nowe zadanie', noTasksToShow: 'Brak zadań do wyświetlenia', noPending: 'Brak oczekujących', external: 'Zewnętrzne', assignTo: 'Przypisz:', approve: 'Zatwierdź', title: 'Tytuł', description: 'Opis', attachments: 'Załączniki', noAttachments: 'Brak załączników', subtasks: 'Subtaski', add: 'Dodaj', subtaskName: 'Nazwa subtaska...', noAssignment: 'Bez przypisania', cancel: 'Anuluj', status: 'Status', subcategory: 'Podkategoria', none: 'Brak', assigned: 'Przypisani', addPerson: '+ Dodaj', comments: 'Komentarze', markUnread: 'Oznacz nieprzeczytane', edit: 'Edytuj', delete: 'Usuń', writeComment: 'Napisz komentarz... (@ aby oznaczyć, Shift+Enter = nowy wiersz)', emailNotifications: 'Powiadomienia email', submittedBy: 'Zgłaszający', unknown: 'Nieznany', noEmail: 'Brak adresu email', history: 'Historia:', by: 'przez', system: 'System', resend: 'Wyślij ponownie', sendEmail: 'Wyślij email', created: 'Utworzono', byPerson: 'Przez', save: 'Zapisz', taskDetails: 'Szczegóły zadania...', whatToDo: 'Co trzeba zrobić?', market: 'Rynek', type: 'Typ', assignToPerson: 'Przypisz do', createTask: 'Utwórz zadanie', links: 'Linki', copyLink: 'Kopiuj link', copied: 'Skopiowano', from: 'Od', priority: 'Priorytet', clickToAddAttachments: 'Kliknij 📎 aby dodać załączniki', loading: 'Ładowanie...', deleteTask: 'Usunąć zadanie?', lt: 'LT', new: 'Nowy', users: 'Użytkownicy', usersPanel: 'Zarządzanie użytkownikami', addUser: 'Dodaj użytkownika', editUser: 'Edytuj użytkownika', name: 'Imię i nazwisko', email: 'Email', role: 'Rola', language: 'Język', polish: 'Polski', english: 'Angielski', restrictedMarket: 'Ograniczenie do rynku', allMarketsAccess: 'Wszystkie rynki', seeOnlyAssigned: 'Widzi tylko przypisane', seeAll: 'Widzi wszystkie zadania', isManager: 'Administrator', deactivate: 'Dezaktywuj', activate: 'Aktywuj', color: 'Kolor', unread: 'Nieodczytane', newTasks: 'Nowe zadania', sortBy: 'Sortuj', sortNewest: 'Od najnowszych', sortOldest: 'Od najstarszych', sortPriority: 'Po priorytecie', sortActivity: 'Po aktywności', sortDeadline: 'Wg deadline', sortComments: 'Wg komentarzy', onlyLinkedPlanner: 'Z Plannerem', notifications: 'Powiadomienia', noNotifications: 'Brak powiadomień', newComment: 'Nowy komentarz', mentionedYou: 'oznaczył(a) Cię', inTask: 'w zadaniu', markAllRead: 'Oznacz wszystkie jako przeczytane', soundOn: 'Dźwięk włączony', soundOff: 'Dźwięk wyłączony', dashboard: 'Dashboard', dashboardTitle: 'Dashboard zespołu', tasksCreated: 'Utworzone', tasksClosed: 'Zamknięte', tasksOpen: 'Otwarte', period: 'Okres', last7days: 'Ostatnie 7 dni', last14days: 'Ostatnie 14 dni', last30days: 'Ostatnie 30 dni', total: 'Łącznie', perDay: '/dzień', team: 'Zespół', noData: 'Brak danych', editComment: 'Edytuj', saveComment: 'Zapisz', cancelEdit: 'Anuluj', edited: 'edytowano', moveUp: 'W górę', moveDown: 'W dół', tags: 'Tagi', manageTags: 'Zarządzaj', addTag: 'Dodaj tag', tagName: 'Nazwa tagu', noTags: 'Brak tagów', deadline: 'Deadline', withDeadline: 'Z deadline', deadlineToday: 'Dziś!', noDeadline: 'Brak', withDeadlineTasks: 'Z terminem',
    dateFrom: 'Od', dateTo: 'Do', dateFilter: 'Filtr dat', clearDates: 'Wyczyść daty', dateFilterActive: 'Filtr dat aktywny', createdInRange: 'Utworzone w zakresie', closedInRange: 'Zamknięte w zakresie',
    tasksLabel: 'Taski', sendsLabel: 'Wysyłki', defaultTasksView: 'Domyślnie widzi taski', defaultSendsView: 'Domyślnie widzi wysyłki', viewMine: 'Moje', viewAll: 'Wszystkich',
    search: 'Szukaj', searchPlaceholder: 'Szukaj w taskach...', searchNoResults: 'Brak wyników', searchInTitle: 'tytuł', searchInDescription: 'opis', searchInComment: 'komentarz', searchInSubtask: 'subtask', searchResults: 'wyników',
  },
  en: {
    marketingTasks: 'Marketing Tasks', loginTitle: 'Login to panel', person: 'Person', select: 'Select...', pin: 'PIN', login: 'Login', incorrectPin: 'Incorrect PIN', selectPerson: 'Select person', allMarkets: 'All markets', everyone: 'Everyone', pending: 'Pending', active: 'Active', open: 'Open', longterm: 'Long-term', paused: 'Paused', monitoring: 'Monitoring', approval: 'For approval', ideas: 'Ideas', closed: 'Closed', formEn: 'EN Form:', myLinks: '📌 My links', addLink: 'Add link', noLinks: 'No links', manager: 'Manager', pendingApproval: 'Pending approval', activeTasks: 'Active tasks', openTasks: 'Open tasks', longtermTasks: 'Long-term tasks', pausedTasks: 'Paused', monitoringTasks: 'Monitoring', approvalTasks: 'For approval', ideasTasks: 'Ideas', closedTasks: 'Closed tasks', allTasks: 'All tasks', filter: 'Filter', newTask: 'New task', noTasksToShow: 'No tasks to display', noPending: 'No pending tasks', external: 'External', assignTo: 'Assign to:', approve: 'Approve', title: 'Title', description: 'Description', attachments: 'Attachments', noAttachments: 'No attachments', subtasks: 'Subtasks', add: 'Add', subtaskName: 'Subtask name...', noAssignment: 'Unassigned', cancel: 'Cancel', status: 'Status', subcategory: 'Subcategory', none: 'None', assigned: 'Assigned', addPerson: '+ Add', comments: 'Comments', markUnread: 'Mark as unread', edit: 'Edit', delete: 'Delete', writeComment: 'Write a comment... (@ to mention, Shift+Enter = new line)', emailNotifications: 'Email notifications', submittedBy: 'Submitted by', unknown: 'Unknown', noEmail: 'No email address', history: 'History:', by: 'by', system: 'System', resend: 'Resend', sendEmail: 'Send email', created: 'Created', byPerson: 'By', save: 'Save', taskDetails: 'Task details...', whatToDo: 'What needs to be done?', market: 'Market', type: 'Type', assignToPerson: 'Assign to', createTask: 'Create task', links: 'Links', copyLink: 'Copy link', copied: 'Copied', from: 'From', priority: 'Priority', clickToAddAttachments: 'Click 📎 to add attachments', loading: 'Loading...', deleteTask: 'Delete task?', lt: 'LT', new: 'New', users: 'Users', usersPanel: 'User management', addUser: 'Add user', editUser: 'Edit user', name: 'Full name', email: 'Email', role: 'Role', language: 'Language', polish: 'Polish', english: 'English', restrictedMarket: 'Restricted to market', allMarketsAccess: 'All markets', seeOnlyAssigned: 'See only assigned', seeAll: 'See all tasks', isManager: 'Administrator', deactivate: 'Deactivate', activate: 'Activate', color: 'Color', unread: 'Unread', newTasks: 'New tasks', sortBy: 'Sort', sortNewest: 'Newest first', sortOldest: 'Oldest first', sortPriority: 'By priority', sortActivity: 'By activity', sortDeadline: 'By deadline', sortComments: 'By comments', onlyLinkedPlanner: 'With Planner', notifications: 'Notifications', noNotifications: 'No notifications', newComment: 'New comment', mentionedYou: 'mentioned you', inTask: 'in task', markAllRead: 'Mark all as read', soundOn: 'Sound on', soundOff: 'Sound off', dashboard: 'Dashboard', dashboardTitle: 'Team Dashboard', tasksCreated: 'Created', tasksClosed: 'Closed', tasksOpen: 'Open', period: 'Period', last7days: 'Last 7 days', last14days: 'Last 14 days', last30days: 'Last 30 days', total: 'Total', perDay: '/day', team: 'Team', noData: 'No data', editComment: 'Edit', saveComment: 'Save', cancelEdit: 'Cancel', edited: 'edited', moveUp: 'Move up', moveDown: 'Move down', tags: 'Tags', manageTags: 'Manage', addTag: 'Add tag', tagName: 'Tag name', noTags: 'No tags', deadline: 'Deadline', withDeadline: 'With deadline', deadlineToday: 'Today!', noDeadline: 'None', withDeadlineTasks: 'With deadline',
    dateFrom: 'From', dateTo: 'To', dateFilter: 'Date filter', clearDates: 'Clear dates', dateFilterActive: 'Date filter active', createdInRange: 'Created in range', closedInRange: 'Closed in range',
    tasksLabel: 'Tasks', sendsLabel: 'Sends', defaultTasksView: 'Default tasks view', defaultSendsView: 'Default sends view', viewMine: 'Mine', viewAll: 'Everyone',
    search: 'Search', searchPlaceholder: 'Search tasks...', searchNoResults: 'No results', searchInTitle: 'title', searchInDescription: 'description', searchInComment: 'comment', searchInSubtask: 'subtask', searchResults: 'results',
  }
};

const getInitials = (name) => { const parts = name.split(' '); if (parts.length >= 2) return parts[0][0] + parts[1][0]; return name[0]; };
function PriorityBadge({ priority, size = 'normal', lang = 'pl' }) { if (!priority) return null; const p = PRIORITIES.find(pr => pr.id === priority); if (!p || !p.id) return null; const isSmall = size === 'small'; return <span className="inline-flex items-center gap-0.5 rounded-full" style={{ padding: isSmall ? '1px 7px' : '3px 10px', fontSize: isSmall ? '10.5px' : '12px', fontWeight: 500, background: p.bg, color: p.color }}><Flag size={isSmall ? 9 : 12} />{lang === 'en' ? p.nameEn : p.name}</span>; }

// === DEADLINE HELPERS ===
function isDeadlineToday(deadline) {
  if (!deadline) return false;
  const today = new Date().toISOString().split('T')[0];
  return deadline === today;
}
function isDeadlinePast(deadline) {
  if (!deadline) return false;
  const today = new Date().toISOString().split('T')[0];
  return deadline < today;
}
function formatDeadline(deadline, lang) {
  if (!deadline) return '';
  const d = new Date(deadline + 'T00:00:00');
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'pl-PL', { day: 'numeric', month: 'short' });
}
function DeadlineBadge({ deadline, size = 'normal', lang = 'pl', t }) {
  if (!deadline) return null;
  const today = isDeadlineToday(deadline);
  const past = isDeadlinePast(deadline);
  const isSmall = size === 'small';
  const color = today ? '#ef4444' : past ? '#b91c1c' : '#5f6368';
  const bg = today ? '#fef2f2' : past ? '#fef2f2' : '#f1f3f4';
  return <span className="inline-flex items-center gap-0.5 rounded-full" style={{ padding: isSmall ? '1px 7px' : '3px 10px', fontSize: isSmall ? '10.5px' : '12px', fontWeight: 500, background: bg, color }}>
    <Calendar size={isSmall ? 9 : 12} />
    {today ? (t?.deadlineToday || 'Dziś!') : formatDeadline(deadline, lang)}
    {past && !today && '!'}
  </span>;
}

// === TASK AGE BADGE ===
// Pokazuje wiek zadania – ale tylko jak coś jest naprawdę nie tak.
// 0–6d   → ukryty (świeże, nie potrzeba badge)
// 7–13d  → bardzo blady szary tekst
// 14–29d → amber tekst
// 30–59d → czerwony tekst
// 60+    → czerwony pill z tłem (zombie alert)
// Bez ikony, żeby nie zaśmiecać wiersza.
// Aby pokazać wiek dla wszystkich zadań, zmień próg HIDE_AGE_BELOW_DAYS na 0.
const HIDE_AGE_BELOW_DAYS = 7;
function TaskAge({ createdAt, size = 'small', lang = 'pl' }) {
  if (!createdAt) return null;
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  if (days < HIDE_AGE_BELOW_DAYS) return null;

  let label;
  if (days < 60) label = `${days}d`;
  else if (days < 365) label = `${Math.floor(days / 30)}mo`;
  else label = `${Math.floor(days / 365)}y`;

  let color, bg, showBg = false;
  if (days < 14) { color = '#9aa0a6'; }
  else if (days < 30) { color = '#b45309'; }
  else if (days < 60) { color = '#b91c1c'; }
  else { color = '#501313'; bg = '#FCEBEB'; showBg = true; }

  const isSmall = size === 'small';
  const tooltipText = lang === 'en'
    ? `Created ${days} ${days === 1 ? 'day' : 'days'} ago`
    : `Utworzone ${days} ${days === 1 ? 'dzień' : 'dni'} temu`;

  return <span title={tooltipText} style={{
    padding: showBg ? (isSmall ? '1px 7px' : '3px 10px') : '0 3px',
    fontSize: isSmall ? '10.5px' : '12px',
    fontWeight: showBg ? 500 : 450,
    background: showBg ? bg : 'transparent',
    color,
    borderRadius: showBg ? '999px' : '0',
    whiteSpace: 'nowrap',
  }}>
    {label}
  </span>;
}

// === DATE FILTER UI (removed) ===

// === NOTIFICATION SYSTEM (server-backed via Supabase) ===
// Read timestamps are now stored in Supabase `read_timestamps` table.
// In-memory helpers still work on the readTimestamps object passed around,
// but persistence goes through getReadTimestampsFromDb / setTaskReadInDb / etc.
const getUnreadComments = (task, userId, timestamps) => { if (!task.comments?.length) return []; const lastRead = timestamps[task.id]; if (!lastRead) return task.comments.filter(c => c.author !== userId); return task.comments.filter(c => c.author !== userId && new Date(c.createdAt) > new Date(lastRead)); };
const getUnreadCount = (task, userId, timestamps) => getUnreadComments(task, userId, timestamps).length;
const parseMentions = (text) => { const mentionRegex = /@([\w.]+)/g; const mentions = []; let match; while ((match = mentionRegex.exec(text)) !== null) { mentions.push(match[1].toLowerCase()); } return mentions; };
const getMentionsForUser = (task, userId, timestamps, teamMembers) => { const unreadComments = getUnreadComments(task, userId, timestamps); const userMember = teamMembers.find(m => m.id === userId); if (!userMember) return []; const userIdentifiers = [userId.toLowerCase(), userMember.name.split(' ')[0].toLowerCase(), userMember.name.toLowerCase().replace(/\s+/g, '_'), userMember.name.toLowerCase().replace(/\s+/g, '')]; return unreadComments.filter(c => { const mentions = parseMentions(c.text); return mentions.some(m => userIdentifiers.includes(m)); }); };
const getSeenTaskIds = (userId) => { try { return JSON.parse(sessionStorage.getItem(`av_seen_${userId}`) || '[]'); } catch { return []; } };
const markTaskAsSeen = (taskId, userId) => { const seen = getSeenTaskIds(userId); if (!seen.includes(taskId)) { seen.push(taskId); sessionStorage.setItem(`av_seen_${userId}`, JSON.stringify(seen)); } };
const getSoundEnabled = (userId) => { try { return sessionStorage.getItem(`av_sound_${userId}`) !== 'false'; } catch { return true; } };
const setSoundEnabled = (userId, enabled) => { sessionStorage.setItem(`av_sound_${userId}`, enabled ? 'true' : 'false'); };

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
    case 'deadline': return sorted.sort((a, b) => { if (!a.deadline && !b.deadline) return new Date(b.createdAt) - new Date(a.createdAt); if (!a.deadline) return 1; if (!b.deadline) return -1; return a.deadline.localeCompare(b.deadline); });
    case 'comments': return sorted.sort((a, b) => { const lastA = a.comments?.length > 0 ? Math.max(...a.comments.map(c => new Date(c.createdAt).getTime())) : 0; const lastB = b.comments?.length > 0 ? Math.max(...b.comments.map(c => new Date(c.createdAt).getTime())) : 0; return lastB - lastA; });
    default: return sorted;
  }
}

// === NOTIFICATION BELL ===
function NotificationBell({ tasks, currentUser, readTimestamps, teamMembers, onSelectTask, onMarkAllRead, t, lang }) {
  const [open, setOpen] = useState(false); const [soundEnabled, setSoundEnabledState] = useState(true); const ref = useRef(null); const buttonRef = useRef(null);
  useEffect(() => { setSoundEnabledState(getSoundEnabled(currentUser)); }, [currentUser]);
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  const notifications = useMemo(() => { const notifs = []; const cm = teamMembers.find(m => m.id === currentUser); const ui = cm ? [currentUser.toLowerCase(), cm.name.split(' ')[0].toLowerCase(), cm.name.toLowerCase().replace(/\s+/g, '_'), cm.name.toLowerCase().replace(/\s+/g, '')] : [currentUser.toLowerCase()]; tasks.forEach(task => { if (task.status === 'pending' || !task.comments?.length) return; const isA = task.assignees?.includes(currentUser); const isC = task.createdBy === currentUser; const isM = task.comments.some(c => parseMentions(c.text).some(m => ui.includes(m))); if (!isA && !isC && !isM) return; const uc = getUnreadComments(task, currentUser, readTimestamps); const uids = uc.map(c => c.id); const mns = getMentionsForUser(task, currentUser, readTimestamps, teamMembers); const mids = mns.map(m => m.id); task.comments.filter(c => c.author !== currentUser).forEach(comment => { const author = teamMembers.find(m => m.id === comment.author); const isUnread = uids.includes(comment.id); const isMention = mids.includes(comment.id) && isUnread; notifs.push({ id: `${isMention ? 'mention' : 'comment'}-${comment.id}`, type: isMention ? 'mention' : 'comment', task, comment, author, createdAt: comment.createdAt, isRead: !isUnread }); }); }); return notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); }, [tasks, currentUser, readTimestamps, teamMembers]);
  const unreadNotifications = notifications.filter(n => !n.isRead); const totalCount = unreadNotifications.length; const mentionCount = unreadNotifications.filter(n => n.type === 'mention').length;
  const toggleSound = () => { const nv = !soundEnabled; setSoundEnabledState(nv); setSoundEnabled(currentUser, nv); };
  const handleMarkAllRead = () => { if (onMarkAllRead) onMarkAllRead(); };
  const ft = lang === 'en' ? formatTimeAgoEn : formatTimeAgo;
  const getPos = () => { if (!buttonRef.current) return {}; const r = buttonRef.current.getBoundingClientRect(); return { top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) }; };
  return (<div className="relative" ref={ref}><button ref={buttonRef} onClick={() => setOpen(!open)} className="relative p-2 rounded-full hover:bg-gray-100" style={{ color: totalCount > 0 ? '#1a73e8' : '#5f6368' }}><Bell size={22} className={totalCount > 0 ? 'animate-pulse' : ''} />{totalCount > 0 && <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center px-1 rounded-full text-xs font-bold text-white" style={{ background: mentionCount > 0 ? '#ef4444' : '#f59e0b' }}>{totalCount > 99 ? '99+' : totalCount}</span>}</button>{open && <div className="fixed w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 2px 6px 2px rgba(60,64,67,.15)', border: '1px solid #dadce0', maxHeight: '80vh', zIndex: 9999, ...getPos() }}><div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#dadce0', background: '#f6f8fc' }}><div className="flex items-center gap-2"><Bell size={18} style={{ color: '#1a73e8' }} /><h3 className="font-medium" style={{ color: '#202124' }}>{t.notifications}</h3>{totalCount > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#e8f0fe', color: '#1a73e8' }}>{totalCount}</span>}</div><div className="flex items-center gap-1">{totalCount > 0 && <button onClick={handleMarkAllRead} className="text-xs px-2 py-1 rounded hover:bg-gray-200" style={{ color: '#1a73e8' }}>{t.markAllRead}</button>}</div></div><div className="overflow-y-auto" style={{ maxHeight: '400px' }}>{notifications.length === 0 ? <div className="py-12 text-center"><Bell size={32} className="mx-auto mb-3" style={{ color: '#dadce0' }} /><p className="text-sm" style={{ color: '#80868b' }}>{t.noNotifications}</p></div> : <div>{notifications.slice(0, 50).map(n => { const isMn = n.type === 'mention'; const mk = MARKETS.find(m => m.id === n.task.market); return <button key={n.id} onClick={() => { onSelectTask(n.task); setOpen(false); }} className="w-full px-4 py-3 flex gap-3 hover:bg-gray-50 text-left border-b" style={{ borderColor: '#f1f3f4', background: n.isRead ? '#fafafa' : 'white' }}><div className="relative flex-shrink-0"><div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ background: n.author?.color || '#5f6368', opacity: n.isRead ? 0.5 : 1 }}>{n.author ? getInitials(n.author.name) : '?'}</div>{isMn && !n.isRead && <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#ef4444' }}><AtSign size={12} className="text-white" /></div>}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-0.5"><span className="font-medium text-sm" style={{ color: n.isRead ? '#80868b' : '#202124' }}>{n.author?.name || '?'}</span><span className="text-xs" style={{ color: '#80868b' }}>{ft(n.createdAt)}</span></div><p className="text-sm mb-1" style={{ color: n.isRead ? '#bdc1c6' : (isMn ? '#ef4444' : '#5f6368') }}>{isMn ? t.mentionedYou : t.newComment}</p><div className="flex items-center gap-1.5"><span style={{ opacity: n.isRead ? 0.5 : 1 }}>{mk?.icon}</span><span className="text-sm truncate" style={{ color: n.isRead ? '#80868b' : '#202124' }}>{n.task.title}</span></div></div></button>; })}</div>}</div></div>}</div>);
}

// === MENTION INPUT ===
function MentionInput({ value, onChange, onSubmit, placeholder, teamMembers }) {
  const [showS, setShowS] = useState(false); const [suggestions, setSuggestions] = useState([]); const [cp, setCp] = useState(0); const [ms, setMs] = useState(-1); const inputRef = useRef(null);
  const handleChange = (e) => { const nv = e.target.value; const c = e.target.selectionStart; onChange(nv); setCp(c); const tb = nv.substring(0, c); const la = tb.lastIndexOf('@'); if (la !== -1) { const ta = tb.substring(la + 1); const cb = la > 0 ? nv[la - 1] : ' '; if ((cb === ' ' || cb === '\n' || la === 0) && !ta.includes(' ')) { setMs(la); const q = ta.toLowerCase(); const f = teamMembers.filter(m => m.isActive !== false && (m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.name.split(' ')[0].toLowerCase().includes(q))); setSuggestions(f.slice(0, 5)); setShowS(f.length > 0); return; } } setShowS(false); setMs(-1); };
  const insertM = (member) => { if (ms === -1) return; const b = value.substring(0, ms); const a = value.substring(cp); const mt = `@${member.id} `; onChange(b + mt + a); setShowS(false); setMs(-1); setTimeout(() => { if (inputRef.current) { inputRef.current.focus(); inputRef.current.setSelectionRange(ms + mt.length, ms + mt.length); } }, 0); };
  const handleKD = (e) => { if (e.key === 'Enter' && !e.shiftKey && !showS) { e.preventDefault(); onSubmit(); } if (e.key === 'Escape') setShowS(false); if (showS && suggestions.length > 0 && (e.key === 'Tab' || (e.key === 'Enter' && showS))) { e.preventDefault(); insertM(suggestions[0]); } };
  return <div className="relative flex-1"><textarea ref={inputRef} value={value} onChange={handleChange} onKeyDown={handleKD} placeholder={placeholder} rows={2} className="w-full px-4 py-2.5 rounded-xl text-sm resize-none" style={{ background: '#f1f3f4', border: '1px solid #dadce0' }} />{showS && <div className="absolute left-0 bottom-full mb-1 w-64 bg-white rounded-lg overflow-hidden z-50" style={{ boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 2px 6px 2px rgba(60,64,67,.15)', border: '1px solid #dadce0' }}><div className="px-3 py-2 border-b" style={{ borderColor: '#dadce0', background: '#f6f8fc' }}><span className="text-xs font-medium" style={{ color: '#5f6368' }}>Oznacz osobę</span></div>{suggestions.map(m => <button key={m.id} onClick={() => insertM(m)} className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 text-left"><div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: m.color }}>{getInitials(m.name)}</div><div><p className="text-sm font-medium" style={{ color: '#202124' }}>{m.name}</p><p className="text-xs" style={{ color: '#80868b' }}>@{m.id}</p></div></button>)}</div>}</div>;
}

function CommentText({ text, teamMembers }) { const re = /(https?:\/\/[^\s]+|@[\w.]+)/g; const ur = /(https?:\/\/[^\s]+)/g; const parts = text.split(re); return <span>{parts.map((p, i) => { if (p.match(ur)) { let l = p; try { l = new URL(p).hostname.replace('www.', ''); } catch {} return <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-1 py-0.5 rounded hover:bg-blue-50" style={{ color: '#1a73e8', textDecoration: 'underline' }} onClick={e => e.stopPropagation()}><ExternalLink size={12} />{l}</a>; } if (p.startsWith('@')) { const n = p.substring(1).toLowerCase(); const m = teamMembers.find(m => m.id.toLowerCase() === n || m.name.split(' ')[0].toLowerCase() === n || m.name.toLowerCase().replace(/\s+/g, '.') === n || m.name.toLowerCase().replace(/\s+/g, '_') === n); return <span key={i} className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded" style={{ background: '#e8f0fe', color: '#1a73e8', fontWeight: 500 }}><AtSign size={12} />{m ? m.name : p.substring(1)}</span>; } return p; })}</span>; }

function AttachmentUploader({ onUpload, uploading }) { const r = useRef(null); return <><input ref={r} type="file" multiple onChange={async (e) => { const f = Array.from(e.target.files); if (f.length > 0) await onUpload(f); e.target.value = ''; }} className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx" /><button type="button" onClick={() => r.current?.click()} disabled={uploading} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50" style={{ color: '#5f6368' }}>{uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}</button></>; }
function AttachmentList({ attachments, onRemove, showRemove = true }) { if (!attachments?.length) return null; return <div className="mt-2 space-y-1">{attachments.map(att => { const FI = getFileIcon(att.type); const isImg = att.type?.startsWith('image/'); return <div key={att.id} className="flex items-center gap-3 px-3 py-2 rounded-lg group" style={{ background: '#f1f3f4' }}>{isImg ? <img src={att.url} alt={att.name} className="w-10 h-10 rounded object-cover cursor-pointer" onClick={() => window.open(att.url, '_blank')} /> : <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: '#dadce0' }}><FI size={20} style={{ color: '#5f6368' }} /></div>}<div className="flex-1 min-w-0"><p className="text-sm font-medium truncate" style={{ color: '#202124' }}>{att.name}</p><p className="text-xs" style={{ color: '#80868b' }}>{formatFileSize(att.size)}</p></div><a href={att.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-gray-200" style={{ color: '#5f6368' }}><Download size={16} /></a>{showRemove && onRemove && <button onClick={() => onRemove(att.id)} className="p-1.5 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100" style={{ color: '#ef4444' }}><X size={16} /></button>}</div>; })}</div>; }

// === LOGIN ===
function LoginScreen({ onLogin, teamMembers }) { const [su, setSu] = useState(''); const [pin, setPin] = useState(''); const [err, setErr] = useState(''); const [ld, setLd] = useState(false); const hl = async (e) => { e.preventDefault(); if (!su.trim()) { setErr('Wpisz login'); return; } if (!pin || pin.length < 4) { setErr('Wpisz 4-cyfrowy PIN'); return; } setLd(true); setErr(''); try { const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: su.trim().toLowerCase(), pin }) }); const d = await r.json(); if (d.success) { sessionStorage.setItem('av_tasks_user', d.user.id); onLogin(d.user.id); } else { setErr('Nieprawidłowy login lub PIN'); setPin(''); } } catch { setErr('Błąd połączenia'); } setLd(false); }; return <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f6f8fc' }}><div className="bg-white rounded-xl p-8 w-full max-w-sm" style={{ boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 2px 6px 2px rgba(60,64,67,.15)', border: '1px solid #dadce0' }}><div className="text-center mb-8"><img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="Angloville" className="h-10 mx-auto mb-4" /><h1 className="text-xl font-semibold" style={{ color: '#202124' }}>Marketing Tasks</h1></div><form onSubmit={hl} className="space-y-4">{err && <div className="p-3 rounded-lg text-sm text-center" style={{ background: '#fef2f2', color: '#dc2626' }}>{err}</div>}<div><label className="block text-sm font-medium mb-1.5" style={{ color: '#202124' }}>Login</label><input type="text" value={su} onChange={e => { setSu(e.target.value); setErr(''); }} className="w-full px-4 py-3 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }} placeholder="Login" autoComplete="username" autoFocus /></div><div><label className="block text-sm font-medium mb-1.5" style={{ color: '#202124' }}>PIN</label><input type="password" value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setErr(''); }} className="w-full px-4 py-3 border rounded-lg text-sm text-center tracking-widest" style={{ borderColor: '#dadce0' }} placeholder="••••" maxLength={4} inputMode="numeric" autoComplete="current-password" /></div><button type="submit" disabled={ld} className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-70" style={{ background: '#1a73e8', color: 'white' }}>{ld ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}{ld ? 'Logowanie...' : 'Zaloguj się'}</button></form></div></div>; }

// === RICH TEXT ===
function RichTextEditor({ value, onChange, placeholder, minHeight = '150px' }) { const er = useRef(null); useEffect(() => { if (er.current && er.current.innerHTML !== value) er.current.innerHTML = value || ''; }, [value]); const ec = (cmd, v = null) => { document.execCommand(cmd, false, v); er.current?.focus(); hc(); }; const hc = () => { if (er.current) onChange(er.current.innerHTML); }; return <div className="border rounded-lg overflow-hidden bg-white" style={{ borderColor: '#dadce0' }}><div className="flex items-center gap-0.5 px-2 py-1.5 border-b flex-wrap" style={{ background: '#f1f3f4', borderColor: '#dadce0' }}><button type="button" onClick={() => ec('undo')} className="p-1.5 rounded hover:bg-gray-200"><Undo size={18} style={{ color: '#5f6368' }} /></button><button type="button" onClick={() => ec('redo')} className="p-1.5 rounded hover:bg-gray-200"><Redo size={18} style={{ color: '#5f6368' }} /></button><div className="w-px h-5 mx-1.5" style={{ background: '#dadce0' }} /><button type="button" onClick={() => ec('bold')} className="p-1.5 rounded hover:bg-gray-200"><Bold size={18} style={{ color: '#5f6368' }} /></button><button type="button" onClick={() => ec('italic')} className="p-1.5 rounded hover:bg-gray-200"><Italic size={18} style={{ color: '#5f6368' }} /></button><button type="button" onClick={() => ec('underline')} className="p-1.5 rounded hover:bg-gray-200"><Underline size={18} style={{ color: '#5f6368' }} /></button><div className="w-px h-5 mx-1.5" style={{ background: '#dadce0' }} /><button type="button" onClick={() => { const u = prompt('URL:'); if (u) ec('createLink', u); }} className="p-1.5 rounded hover:bg-gray-200"><Link2 size={18} style={{ color: '#5f6368' }} /></button><div className="w-px h-5 mx-1.5" style={{ background: '#dadce0' }} /><button type="button" onClick={() => ec('insertUnorderedList')} className="p-1.5 rounded hover:bg-gray-200"><List size={18} style={{ color: '#5f6368' }} /></button><button type="button" onClick={() => ec('insertOrderedList')} className="p-1.5 rounded hover:bg-gray-200"><ListOrdered size={18} style={{ color: '#5f6368' }} /></button></div><div ref={er} contentEditable onInput={hc} onBlur={hc} className="px-4 py-3 text-sm focus:outline-none overflow-y-auto" style={{ color: '#202124', minHeight, maxHeight: '400px' }} data-placeholder={placeholder} suppressContentEditableWarning /></div>; }
function RichTextDisplay({ html }) { if (!html) return null; let out = html.replace(/<a\s/g, '<a target="_blank" rel="noopener noreferrer" '); out = out.replace(/href="(https?:\/\/[^"]+)"/g, 'href="$1" style="color:#1a73e8;text-decoration:underline"'); out = out.replace(/(>|^|[\s\n])((https?:\/\/[^\s<"']+))/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:underline;word-break:break-all">$2</a>'); const clean = sanitizeHtml(out); return <div className="text-sm leading-relaxed prose prose-sm max-w-none" style={{ color: '#3c4043' }} dangerouslySetInnerHTML={{ __html: clean }} />; }
function ClickableLinks({ text }) { if (!text) return null; const ur = /(https?:\/\/[^\s]+)/gi; return <div className="space-y-1">{text.split('\n').map((line, i) => <div key={i} className="text-sm">{line.split(ur).map((p, j) => p.match(ur) ? <a key={j} href={p} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded-full hover:bg-blue-50" style={{ color: '#1a73e8' }}><ExternalLink size={12} />{(() => { try { return new URL(p).hostname.replace('www.', ''); } catch { return p; } })()}</a> : <span key={j} style={{ color: '#5f6368' }}>{p}</span>)}</div>)}</div>; }
function TranslateButton({ task, size = 'normal' }) { const [sp, setSp] = useState(false); if (task.language !== 'en') return null; return <><button onClick={e => { e.stopPropagation(); setSp(true); }} className="p-1 rounded hover:bg-blue-50" style={{ color: '#1a73e8' }}><Languages size={size === 'small' ? 14 : 16} /></button>{sp && <TranslationPopup title={task.title} description={task.description} onClose={() => setSp(false)} />}</>; }
function TranslationPopup({ title, description, onClose }) { const [tt, setTt] = useState(''); const [td, setTd] = useState(''); const [ld, setLd] = useState(true); useEffect(() => { (async () => { setLd(true); const pt = title?.replace(/<[^>]*>/g, ' ').trim() || ''; const pd = description?.replace(/<[^>]*>/g, ' ').trim() || ''; try { const [a, b] = await Promise.all([fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(pt)}&langpair=en|pl`).then(r => r.json()), pd ? fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(pd.substring(0, 500))}&langpair=en|pl`).then(r => r.json()) : null]); setTt(a?.responseData?.translatedText || pt); setTd(b?.responseData?.translatedText || pd); } catch { setTt(pt); setTd(pd); } setLd(false); })(); }, [title, description]); return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}><div className="bg-white rounded-xl w-full max-w-md" style={{ boxShadow: '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)' }} onClick={e => e.stopPropagation()}><div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#dadce0' }}><div className="flex items-center gap-2"><Languages size={20} style={{ color: '#1a73e8' }} /><h3 className="font-medium" style={{ color: '#202124' }}>🇬🇧 → 🇵🇱</h3></div><button onClick={onClose} className="p-1 rounded hover:bg-gray-100" style={{ color: '#5f6368' }}><X size={18} /></button></div><div className="p-5 space-y-4">{ld ? <div className="flex items-center justify-center py-8"><Loader2 size={24} className="animate-spin" style={{ color: '#1a73e8' }} /></div> : <><div><label className="block text-xs font-medium mb-1" style={{ color: '#5f6368' }}>Tytuł</label><div className="p-3 rounded-lg" style={{ background: '#e8f0fe' }}><p className="text-sm font-medium" style={{ color: '#202124' }}>{tt}</p></div></div>{td && <div><label className="block text-xs font-medium mb-1" style={{ color: '#5f6368' }}>Opis</label><div className="p-3 rounded-lg" style={{ background: '#e8f0fe' }}><p className="text-sm" style={{ color: '#3c4043' }}>{td}</p></div></div>}</>}</div></div></div>; }
function SubtaskProgress({ subtasks }) { if (!subtasks?.length) return null; const d = subtasks.filter(s => s.status === 'closed').length; return <div className="flex items-center gap-1.5"><ListTodo size={12} style={{ color: '#5f6368' }} /><span className="text-xs" style={{ color: '#5f6368' }}>{d}/{subtasks.length}</span></div>; }

// === DASHBOARD === (moved to /dashboard page)

// === USERS PANEL ===
function UsersPanel({ teamMembers, onUpdate, onClose, t }) {
  const [au, setAu] = useState([]); const [ld, setLd] = useState(true); const [eu, setEu] = useState(null); const [sa, setSa] = useState(false);
  useEffect(() => { la(); }, []); const la = async () => { setLd(true); setAu(await getAllTeamMembers()); setLd(false); }; const hs = async (d) => { if (eu) await updateTeamMember(eu.id, d); else await createTeamMember(d); await la(); onUpdate(); setEu(null); setSa(false); }; const ht = async (u) => { await updateTeamMember(u.id, { isActive: !u.isActive }); await la(); onUpdate(); };
  return <aside className="w-full lg:w-[500px] bg-white border-l flex flex-col overflow-hidden flex-shrink-0 fixed lg:static inset-0 z-40 lg:z-auto" style={{ borderColor: '#dadce0' }}><div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#dadce0' }}><div className="flex items-center gap-2"><Users size={20} style={{ color: '#1a73e8' }} /><h2 className="font-medium" style={{ color: '#202124' }}>{t.usersPanel}</h2></div><div className="flex items-center gap-2"><button onClick={() => { setSa(true); setEu(null); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: '#1a73e8', color: 'white' }}><UserPlus size={16} /> {t.addUser}</button><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100" style={{ color: '#5f6368' }}><X size={18} /></button></div></div><div className="flex-1 overflow-y-auto p-4">{ld ? <div className="flex items-center justify-center py-8"><Loader2 size={24} className="animate-spin" style={{ color: '#1a73e8' }} /></div> : (sa || eu) ? <UserForm user={eu} onSave={hs} onCancel={() => { setSa(false); setEu(null); }} t={t} /> : <div className="space-y-2">{au.map(u => <div key={u.id} className="p-4 rounded-lg border" style={{ borderColor: '#dadce0', opacity: u.isActive ? 1 : 0.7 }}><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ background: u.color }}>{getInitials(u.name)}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><h3 className="font-medium" style={{ color: '#202124' }}>{u.name}</h3>{u.isManager && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#e8f0fe', color: '#1a73e8' }}>Admin</span>}{!u.isActive && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#fef2f2', color: '#dc2626' }}>Nieaktywny</span>}</div><p className="text-sm" style={{ color: '#5f6368' }}>{u.email}</p></div><div className="flex items-center gap-1"><button onClick={() => setEu(u)} className="p-2 rounded-full hover:bg-gray-100" style={{ color: '#5f6368' }}><Edit3 size={16} /></button><button onClick={() => ht(u)} className="p-2 rounded-full hover:bg-gray-100" style={{ color: u.isActive ? '#ef4444' : '#16a34a' }}>{u.isActive ? <X size={16} /> : <Check size={16} />}</button></div></div></div>)}</div>}</div></aside>;
}
function UserForm({ user, onSave, onCancel, t }) {
  const ie = !!user?.id;
  const [f, sF] = useState({
    id: user?.id || '',
    name: user?.name || '',
    email: user?.email || '',
    pin: '',
    color: user?.color || COLORS[Math.floor(Math.random()*COLORS.length)],
    role: user?.role || '',
    isManager: user?.isManager || false,
    language: user?.language || 'pl',
    restrictedToMarket: user?.restrictedToMarket || null,
    // Backward-compat: stary seeOnlyAssigned:true → defaultTasksView:'mine'
    defaultTasksView: user?.defaultTasksView || (user?.seeOnlyAssigned ? 'mine' : 'all'),
    defaultSendsView: user?.defaultSendsView || 'all',
  });
  const hs = (e) => {
    e.preventDefault();
    const id = f.id || f.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    // Zachowuję seeOnlyAssigned zsynchronizowany z defaultTasksView dla zgodności z istniejącą logiką backendu
    const d = { ...f, id, seeOnlyAssigned: f.defaultTasksView === 'mine' };
    if (ie && !f.pin) delete d.pin;
    onSave(d);
  };
  return (
    <form onSubmit={hs} className="space-y-4">
      <div><label className="block text-sm font-medium mb-1" style={{ color: '#202124' }}>{t.name} *</label><input type="text" value={f.name} onChange={e => sF({...f, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }} required /></div>
      <div><label className="block text-sm font-medium mb-1" style={{ color: '#202124' }}>{t.email} *</label><input type="email" value={f.email} onChange={e => sF({...f, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }} required /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium mb-1" style={{ color: '#202124' }}>PIN</label><input type="text" value={f.pin} onChange={e => sF({...f, pin: e.target.value.replace(/\D/g,'').slice(0,4)})} className="w-full px-3 py-2 border rounded-lg text-sm text-center tracking-widest" style={{ borderColor: '#dadce0' }} maxLength={4} placeholder={ie ? '••••' : ''} required={!ie} /></div>
        <div><label className="block text-sm font-medium mb-1" style={{ color: '#202124' }}>{t.color}</label><div className="flex gap-1 flex-wrap">{COLORS.map(c => <button key={c} type="button" onClick={() => sF({...f,color:c})} className="w-6 h-6 rounded-full" style={{ background: c, border: f.color === c ? '2px solid #202124' : '2px solid transparent' }} />)}</div></div>
      </div>
      <div><label className="block text-sm font-medium mb-1" style={{ color: '#202124' }}>{t.role}</label><input type="text" value={f.role} onChange={e => sF({...f, role: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium mb-1" style={{ color: '#202124' }}>{t.language}</label><select value={f.language} onChange={e => sF({...f, language: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }}><option value="pl">🇵🇱 {t.polish}</option><option value="en">🇬🇧 {t.english}</option></select></div>
        <div><label className="block text-sm font-medium mb-1" style={{ color: '#202124' }}>{t.restrictedMarket}</label><select value={f.restrictedToMarket || ''} onChange={e => sF({...f, restrictedToMarket: e.target.value || null})} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }}><option value="">{t.allMarketsAccess}</option>{MARKETS.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}</select></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium mb-1" style={{ color: '#202124' }}>{t.defaultTasksView}</label><select value={f.defaultTasksView} onChange={e => sF({...f, defaultTasksView: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }}><option value="all">{t.viewAll}</option><option value="mine">{t.viewMine}</option></select></div>
        <div><label className="block text-sm font-medium mb-1" style={{ color: '#202124' }}>{t.defaultSendsView}</label><select value={f.defaultSendsView} onChange={e => sF({...f, defaultSendsView: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }}><option value="all">{t.viewAll}</option><option value="mine">{t.viewMine}</option></select></div>
      </div>
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={f.isManager} onChange={e => sF({...f, isManager: e.target.checked})} className="w-4 h-4 rounded" /><span className="text-sm">{t.isManager}</span></label>
      </div>
      <div className="flex gap-3 pt-4">
        <button type="submit" className="flex-1 py-2.5 rounded-lg font-medium text-sm" style={{ background: '#1a73e8', color: 'white' }}>{t.save}</button>
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-lg font-medium text-sm" style={{ background: '#f1f3f4', color: '#5f6368' }}>{t.cancel}</button>
      </div>
    </form>
  );
}

// === QUICK LINKS ===
function QuickLinksSection({ currentUser, t }) { const [lk, setLk] = useState([]); const [ld, setLd] = useState(true); const [sa, setSa] = useState(false); const [nl, setNl] = useState({ name: '', url: '' }); const [ex, setEx] = useState(true); useEffect(() => { ll(); }, [currentUser]); const ll = async () => { setLd(true); setLk(await getQuickLinks(currentUser)); setLd(false); }; const ha = async () => { if (!nl.name.trim() || !nl.url.trim()) return; await createQuickLink({ ...nl, userId: currentUser }); setNl({ name: '', url: '' }); setSa(false); ll(); }; const hd = async (id) => { await deleteQuickLink(id); ll(); }; return <div className="mt-4 mx-2"><button onClick={() => setEx(!ex)} className="w-full flex items-center justify-between px-2 py-1 text-xs font-medium rounded hover:bg-gray-100" style={{ color: '#5f6368' }}><span>{t.myLinks}</span><ChevronDown size={14} className={`transition-transform ${ex ? '' : '-rotate-90'}`} /></button>{ex && <div className="mt-2 space-y-1">{ld ? <Loader2 size={14} className="animate-spin mx-auto" style={{ color: '#5f6368' }} /> : <>{lk.map(l => <div key={l.id} className="flex items-center gap-1 group"><a href={l.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-xs px-2 py-1.5 rounded hover:bg-gray-100 truncate" style={{ color: '#1a73e8' }}>{l.name}</a><button onClick={() => hd(l.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50" style={{ color: '#ef4444' }}><X size={12} /></button></div>)}{lk.length === 0 && !sa && <p className="text-xs px-2" style={{ color: '#80868b' }}>{t.noLinks}</p>}{sa ? <div className="p-2 rounded-lg" style={{ background: '#f1f3f4' }}><input type="text" value={nl.name} onChange={e => setNl({...nl, name: e.target.value})} className="w-full px-2 py-1 text-xs rounded border mb-1" style={{ borderColor: '#dadce0' }} placeholder="Nazwa" /><input type="url" value={nl.url} onChange={e => setNl({...nl, url: e.target.value})} className="w-full px-2 py-1 text-xs rounded border mb-2" style={{ borderColor: '#dadce0' }} placeholder="https://..." /><div className="flex gap-1"><button onClick={ha} className="flex-1 py-1 rounded text-xs font-medium" style={{ background: '#1a73e8', color: 'white' }}>{t.add}</button><button onClick={() => { setSa(false); setNl({name:'',url:''}); }} className="px-2 py-1 rounded text-xs" style={{ color: '#5f6368' }}>{t.cancel}</button></div></div> : <button onClick={() => setSa(true)} className="w-full text-xs px-2 py-1.5 rounded hover:bg-gray-100 text-left" style={{ color: '#1a73e8' }}>+ {t.addLink}</button>}</>}</div>}</div>; }

// === SORT DROPDOWN ===
function SortDropdown({ value, onChange, t }) { const [op, setOp] = useState(false); const r = useRef(null); useEffect(() => { const h = e => { if (r.current && !r.current.contains(e.target)) setOp(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []); const opts = [{ id: 'newest', label: t.sortNewest, icon: ArrowDown }, { id: 'oldest', label: t.sortOldest, icon: ArrowUp }, { id: 'priority', label: t.sortPriority, icon: Flag }, { id: 'deadline', label: t.sortDeadline, icon: Calendar }, { id: 'comments', label: t.sortComments, icon: MessageSquare }, { id: 'activity', label: t.sortActivity, icon: Activity }]; const cur = opts.find(o => o.id === value) || opts[0]; return <div className="relative" ref={r}><button onClick={() => setOp(!op)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100" style={{ color: '#5f6368', border: '1px solid #dadce0' }}><ArrowUpDown size={16} /><span className="hidden sm:inline">{cur.label}</span><ChevronDown size={14} className={`transition-transform ${op ? 'rotate-180' : ''}`} /></button>{op && <div className="absolute right-0 top-full mt-1 bg-white rounded-lg py-1 z-20 min-w-[180px]" style={{ boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 2px 6px 2px rgba(60,64,67,.15)', border: '1px solid #dadce0' }}>{opts.map(o => { const I = o.icon; return <button key={o.id} onClick={() => { onChange(o.id); setOp(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-left" style={{ color: value === o.id ? '#1a73e8' : '#202124', background: value === o.id ? '#e8f0fe' : 'transparent' }}><I size={16} /><span>{o.label}</span>{value === o.id && <Check size={16} className="ml-auto" />}</button>; })}</div>}</div>; }

// === PENDING VIEW ===
function PendingView({ tasks, approveTask, deleteTask, currentUser, t, lang, teamMembers }) { const [sel, setSel] = useState({}); const tog = (tid, mid) => { setSel(p => { const c = p[tid] || []; return { ...p, [tid]: c.includes(mid) ? c.filter(x => x !== mid) : [...c, mid] }; }); }; if (!tasks.length) return <div className="max-w-3xl mx-auto text-center py-16"><CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#16a34a', opacity: 0.4 }} /><p style={{ color: '#5f6368' }}>{t.noPending}</p></div>; return <div className="max-w-3xl mx-auto space-y-4">{tasks.map(task => { const mk = MARKETS.find(m => m.id === task.market); const as = sel[task.id] || task.assignees || []; return <div key={task.id} className="bg-white rounded-xl p-5 border" style={{ borderColor: '#dadce0' }}>{task.isExternal && <div className="flex items-center gap-2 mb-3 pb-3 border-b flex-wrap" style={{ borderColor: '#dadce0' }}><ExternalLink size={14} style={{ color: '#f59e0b' }} /><span className="text-xs font-medium" style={{ color: '#b45309' }}>{t.external}</span>{task.language === 'en' && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#e8f0fe', color: '#1a73e8' }}>🇬🇧</span>}<span className="text-xs" style={{ color: '#80868b' }}>{t.from} {task.submittedBy}</span></div>}<div className="flex items-start gap-3 mb-4"><span className="text-xl">{mk?.icon}</span><div className="flex-1"><div className="flex items-center gap-2 flex-wrap"><h3 className="font-medium text-lg" style={{ color: '#202124' }}>{task.title}</h3><TranslateButton task={task} /><PriorityBadge priority={task.priority} lang={lang} /></div>{task.description && <div className="mt-2"><RichTextDisplay html={task.description} /></div>}{task.links && <div className="mt-3 p-3 rounded-lg" style={{ background: '#f6f8fc' }}><ClickableLinks text={task.links} /></div>}<AttachmentList attachments={task.attachments} showRemove={false} /></div></div><div className="mb-4"><p className="text-xs font-medium mb-2" style={{ color: '#5f6368' }}>{t.assignTo}</p><div className="flex flex-wrap gap-2">{teamMembers.filter(m => m.isActive !== false).map(m => <button key={m.id} onClick={() => tog(task.id, m.id)} className="flex items-center gap-2 px-3 py-2 rounded-full border text-sm" style={{ borderColor: as.includes(m.id) ? '#1a73e8' : '#dadce0', background: as.includes(m.id) ? '#e8f0fe' : 'white', color: as.includes(m.id) ? '#1a73e8' : '#202124' }}><div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: m.color }}>{getInitials(m.name)}</div><span>{m.name.split(' ')[0]}</span>{as.includes(m.id) && <Check size={14} />}</button>)}</div></div><div className="flex gap-2 pt-4 border-t" style={{ borderColor: '#dadce0' }}><button onClick={() => approveTask(task, as)} disabled={!as.length} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium disabled:opacity-50" style={{ background: as.length ? '#1a73e8' : '#f1f3f4', color: as.length ? 'white' : '#80868b' }}><Check size={18} /> {t.approve}</button><button onClick={() => deleteTask(task.id)} className="px-4 py-2.5 rounded-lg hover:bg-red-50" style={{ color: '#ef4444', border: '1px solid #f5c6cb' }}><X size={18} /></button></div></div>; })}</div>; }

// === TASK ITEM ===
function TaskItem({ task, isSelected, onClick, onStatusChange, currentUser, readTimestamps, seenTaskIds, lang, t, teamMembers, customTags }) {
  const mk = MARKETS.find(m => m.id === task.market); const st = STATUSES.find(s => s.id === task.status); const Icon = st?.icon || Circle;
  const cycle = (e) => { e.stopPropagation(); onStatusChange(task.status === 'open' ? 'closed' : 'open'); };
  const uc = getUnreadCount(task, currentUser, readTimestamps); const mc = getMentionsForUser(task, currentUser, readTimestamps, teamMembers).length;
  const isNew = task.assignees?.includes(currentUser) && task.createdBy !== currentUser && !seenTaskIds.includes(task.id);
  const hasEP = task.isExternal && task.submitterEmail && task.status === 'closed' && !(task.emailHistory || []).some(e => e.type === 'completed' && e.success);
  const tTags = (task.tags || []).map(tid => (customTags || []).find(ct => ct.id === tid)).filter(Boolean);
  return <div onClick={onClick} className="rounded-lg px-3 py-1.5 cursor-pointer transition-all duration-100" style={{ borderWidth: '0.5px', borderStyle: 'solid', borderColor: isSelected ? '#3b82f6' : isNew ? '#aecbfa' : '#e8eaed', background: isNew ? '#f8faff' : isSelected ? '#fafbff' : 'white', boxShadow: isSelected ? '0 0 0 1px rgba(59,130,246,0.1)' : 'none' }} onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = '#d5d9dd'; e.currentTarget.style.background = '#fafbfc'; }}} onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = isNew ? '#aecbfa' : '#e8eaed'; e.currentTarget.style.background = isNew ? '#f8faff' : 'white'; }}}><div className="flex items-center gap-2">
    <button onClick={cycle} className="hover:scale-110 flex-shrink-0"><Icon size={16} style={{ color: st?.color }} className={task.status === 'closed' ? 'fill-current' : ''} /></button>
    <span className="flex-shrink-0 text-sm">{mk?.icon}</span>
    <h4 className="flex-1 min-w-0 truncate" style={{ fontSize: '13px', fontWeight: 450, letterSpacing: '-0.01em', color: task.status === 'closed' ? '#80868b' : '#202124', textDecoration: task.status === 'closed' ? 'line-through' : 'none' }}>{task.title}</h4>
    <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
      <PriorityBadge priority={task.priority} size="small" lang={lang} />
      <DeadlineBadge deadline={task.deadline} size="small" lang={lang} t={t} />
      {task.status !== 'closed' && <TaskAge createdAt={task.createdAt} size="small" lang={lang} />}
      {tTags.map(tg => <span key={tg.id} className="rounded-full" style={{ fontSize: '10.5px', padding: '1px 7px', background: tg.color + '15', color: tg.color, fontWeight: 500 }}>{tg.name}</span>)}
      {isNew && <span className="flex items-center gap-0.5 rounded-full" style={{ fontSize: '10.5px', padding: '1px 7px', background: '#1a73e8', color: 'white', fontWeight: 500 }}><Sparkles size={9} />{t.new}</span>}
      {mc > 0 && <span className="flex items-center gap-0.5 rounded-full" style={{ fontSize: '10.5px', padding: '1px 7px', background: '#ef4444', color: 'white', fontWeight: 500 }}><AtSign size={9} />{mc}</span>}
      {uc > 0 && mc === 0 && <span className="flex items-center gap-0.5 rounded-full" style={{ fontSize: '10.5px', padding: '1px 7px', background: '#f59e0b', color: 'white', fontWeight: 500 }}><MessageSquare size={9} />{uc}</span>}
      {hasEP && <MailX size={10} style={{ color: '#ef4444' }} />}
      {task.isExternal && <ExternalLink size={11} style={{ color: '#f59e0b' }} />}
      {task.language === 'en' && <TranslateButton task={task} size="small" />}
      {task.status === 'ideas' && <span className="hidden sm:inline" style={{ fontSize: '11px' }}>💡</span>}
      {task.market === 'pl' && task.subcategory && (() => { const sc = PL_SUBCATEGORIES.find(s => s.id === task.subcategory); return sc && <span className="rounded-full hidden sm:inline" style={{ fontSize: '10.5px', padding: '1px 7px', background: sc.bg, color: sc.color, fontWeight: 500 }}>{sc.name}</span>; })()}
      <div className="flex -space-x-1">{task.assignees?.slice(0, 3).map(aId => { const m = teamMembers.find(x => x.id === aId); return m && <div key={aId} className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-white border border-white" style={{ background: m.color, fontSize: '9px', fontWeight: 600 }} title={m.name}>{getInitials(m.name)}</div>; })}{task.assignees?.length > 3 && <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center border border-white" style={{ background: '#dadce0', color: '#5f6368', fontSize: '9px', fontWeight: 500 }}>+{task.assignees.length - 3}</div>}</div>
      {task.comments?.length > 0 && !uc && <div className="flex items-center gap-0.5 hidden sm:flex" style={{ color: '#b0b5bc' }}><MessageSquare size={11} /><span style={{ fontSize: '10.5px' }}>{task.comments.length}</span></div>}
      <SubtaskProgress subtasks={task.subtasks} />
      <ChevronRight size={14} style={{ color: '#dadce0' }} />
    </div>
  </div></div>;
}

// === WORKLOAD BUTTON + POPOVER ===
// Button w headerze. Klik = otwiera dropdown z listą osób i ich obciążeniem.
// Czerwona kropka na buttonie jeśli ktoś jest przeciążony.
// Klik na osobę = filtruje listę po niej (toggle).
// Schowane dla userów z seeOnlyAssigned (bo i tak widzą tylko swoje).
function WorkloadButton({ tasks, teamMembers, currentUser, filterPerson, setFilterPerson, lang }) {
  const me = teamMembers.find(m => m.id === currentUser);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!me?.isManager) return null;

  const restrictedMarket = me?.restrictedToMarket;
  const activeMembers = teamMembers.filter(m => m.isActive !== false);

  const activeTasks = tasks.filter(task =>
    task.status !== 'closed' &&
    task.status !== 'pending' &&
    (!restrictedMarket || task.market === restrictedMarket)
  );

  const counts = {};
  activeMembers.forEach(m => {
    counts[m.id] = activeTasks.filter(t => t.assignees?.includes(m.id)).length;
  });

  const sortedMembers = activeMembers
    .filter(m => counts[m.id] > 0)
    .sort((a, b) => counts[b.id] - counts[a.id]);

  if (sortedMembers.length === 0) return null;

  const allCounts = sortedMembers.map(m => counts[m.id]).sort((a, b) => a - b);
  const median = allCounts[Math.floor(allCounts.length / 2)] || 0;
  const overloadThreshold = Math.max(12, Math.ceil(median * 1.5));
  const overloadedCount = sortedMembers.filter(m => counts[m.id] >= overloadThreshold).length;

  const toggleFilter = (memberId) => {
    if (filterPerson.length === 1 && filterPerson[0] === memberId) {
      setFilterPerson([]);
    } else {
      setFilterPerson([memberId]);
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="p-2 rounded-full hover:bg-gray-100 relative"
        style={{ color: open ? '#1a73e8' : '#5f6368' }}
        title={lang === 'en' ? 'Team workload' : 'Obciążenie zespołu'}
      >
        <Users size={18} />
        {overloadedCount > 0 && (
          <span
            className="absolute"
            style={{
              top: '5px',
              right: '5px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#ef4444',
              border: '1.5px solid white',
            }}
          />
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 rounded-lg shadow-lg z-50"
          style={{
            background: 'white',
            border: '0.5px solid #dadce0',
            boxShadow: '0 4px 12px rgba(60,64,67,.15)',
            minWidth: '240px',
            maxWidth: '320px',
          }}
        >
          <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: '#e8eaed' }}>
            <span style={{ fontSize: '11px', color: '#80868b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              {lang === 'en' ? 'Workload' : 'Obciążenie'}
            </span>
            {overloadedCount > 0 && (
              <span style={{ fontSize: '10.5px', color: '#b91c1c', fontWeight: 600 }}>
                {overloadedCount} {lang === 'en' ? 'overloaded' : 'przeciążonych'}
              </span>
            )}
          </div>
          <div className="py-1 max-h-96 overflow-y-auto">
            {sortedMembers.map(m => {
              const count = counts[m.id];
              const isFiltered = filterPerson.includes(m.id);
              const isOverloaded = count >= overloadThreshold;
              return (
                <button
                  key={m.id}
                  onClick={() => toggleFilter(m.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50 transition-colors"
                  style={{
                    background: isFiltered ? '#e8f0fe' : 'transparent',
                  }}
                >
                  <span
                    className="inline-flex items-center justify-center rounded-full text-white flex-shrink-0"
                    style={{ background: m.color, width: '22px', height: '22px', fontSize: '10px', fontWeight: 600 }}
                  >
                    {getInitials(m.name)}
                  </span>
                  <span
                    className="flex-1 text-left truncate"
                    style={{
                      fontSize: '13px',
                      color: isFiltered ? '#1a73e8' : '#202124',
                      fontWeight: isFiltered ? 500 : 400,
                    }}
                  >
                    {m.name}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: isOverloaded ? '#b91c1c' : '#5f6368',
                      minWidth: '20px',
                      textAlign: 'right',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          {filterPerson.length > 0 && (
            <div className="px-3 py-2 border-t" style={{ borderColor: '#e8eaed' }}>
              <button
                onClick={() => { setFilterPerson([]); setOpen(false); }}
                className="text-xs hover:underline"
                style={{ color: '#5f6368' }}
              >
                {lang === 'en' ? 'Clear filter' : 'Wyczyść filtr'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// === WEEKLY SENDS ACCORDION ===

function WeeklySendsAccordion({ sends, tasks, isOpen, onToggle, onSelectTask, onStatusChange, onCreateTaskForSend, currentUser, readTimestamps, seenTaskIds, lang, t, teamMembers, customTags, selectedTask, label, variant = 'default', filterSendsPerson = [] }) {
  // Filtr osób: pokazujemy wysyłkę jeśli przypisano do niej kogokolwiek z wybranych osób.
  // Pusta lista = brak filtra = wszyscy.
  const filteredSends = useMemo(() => {
    if (!filterSendsPerson || filterSendsPerson.length === 0) return sends;
    return sends.filter(s => filterSendsPerson.some(fp => (s.assignees || []).includes(fp)));
  }, [sends, filterSendsPerson]);

  // Build a map: sendId → task (task.linkedSendId = send.id)
  const taskBySendId = useMemo(() => {
    const m = {};
    tasks.forEach(tk => { if (tk.linkedSendId) m[tk.linkedSendId] = tk; });
    return m;
  }, [tasks]);

  if (!filteredSends.length) return null;

  const isNext = variant === 'next';
  const isWeek3 = variant === 'week3';
  const bgHeader = 'white';
  const bgContent = 'white';
  const borderColor = '#ddd6fe';
  const accentColor = '#7c3aed';

  const todoCount = filteredSends.filter(s => s.status === 'todo').length;
  const fmtD = (ds) => new Date(ds+'T00:00:00').toLocaleDateString(lang==='en'?'en-US':'pl-PL',{weekday:'short',day:'numeric',month:'short'});

  const renderSendAsTask = (send) => {
    const linkedTask = taskBySendId[send.id];
    if (linkedTask) {
      return (
        <TaskItem
          key={`send-${send.id}`}
          task={linkedTask}
          isSelected={selectedTask?.id === linkedTask.id}
          onClick={() => onSelectTask(linkedTask)}
          onStatusChange={s => onStatusChange(linkedTask.id, s)}
          currentUser={currentUser}
          readTimestamps={readTimestamps}
          seenTaskIds={seenTaskIds}
          lang={lang}
          t={t}
          teamMembers={teamMembers}
          customTags={customTags}
        />
      );
    }
    // Fallback: no linked task – create on click
    const mk = MARKETS.find(m => m.id === send.market);
    const assigned = (send.assignees||[]).map(id => teamMembers.find(m => m.id === id)).filter(Boolean);
    return (
      <div key={`send-fallback-${send.id}`}
        onClick={() => onCreateTaskForSend(send)}
        className="rounded-lg px-3 py-1.5 cursor-pointer transition-all duration-100 hover:bg-gray-50"
        style={{ borderWidth: '0.5px', borderStyle: 'solid', borderColor: '#e8eaed' }}>
        <div className="flex items-center gap-2">
          <Circle size={16} style={{ color: '#80868b' }} />
          <span className="flex-shrink-0 text-sm">{mk?.icon}</span>
          <h4 className="flex-1 min-w-0 truncate" style={{ fontSize: '13px', fontWeight: 450, letterSpacing: '-0.01em', color: '#202124' }}>{send.title}</h4>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span style={{ fontSize: '10.5px', color: '#80868b' }}>{fmtD(send.sendDate)}</span>
            <div className="flex -space-x-1">
              {assigned.slice(0, 3).map(m => <div key={m.id} className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-white border border-white" style={{ background: m.color, fontSize: '9px', fontWeight: 600 }}>{getInitials(m.name)}</div>)}
            </div>
            <ChevronRight size={14} style={{ color: '#dadce0' }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto mb-3">
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 transition-colors"
        style={{ fontSize: '12px', fontWeight: 500, background: bgHeader, color: accentColor, border: `1px solid ${borderColor}`, borderBottom: isOpen ? `1px solid ${borderColor}` : `1px solid ${borderColor}`, borderRadius: isOpen ? '10px 10px 0 0' : '10px' }}>
        <div className="flex items-center gap-2">
          <CalendarClock size={14} />
          <span>{label}</span>
          <span className="rounded-full" style={{ fontSize: '10.5px', padding: '1px 7px', background: '#f3f0ff', color: '#7c3aed', fontWeight: 500 }}>{filteredSends.length}</span>
          {todoCount > 0 && <span className="rounded-full" style={{ fontSize: '10.5px', padding: '1px 7px', background: '#fef3c7', color: '#b45309' }}>
            {todoCount} {lang === 'en' ? 'to do' : 'do zrobienia'}
          </span>}
        </div>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {isOpen && (
        <div className="rounded-b-lg overflow-hidden px-2 py-2" style={{ background: bgContent, border: `1px solid ${borderColor}`, borderTop: 'none' }}>
          <div className="space-y-0.5">
            {filteredSends.map(renderSendAsTask)}
          </div>
          <a href="/planner" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs hover:underline rounded-lg transition-colors mt-1"
            style={{ color: '#80868b' }}>
            <CalendarClock size={12} />
            {lang === 'en' ? 'Open Planner' : 'Otwórz Planner'} →
          </a>
        </div>
      )}
    </div>
  );
}

// === TASK DETAIL ===
function TaskDetail({ task, updateTask, deleteTask, onClose, currentUser, isManager, onMarkUnread, readTimestamps, t, lang, teamMembers, customTags, onRefreshTags, allSends }) {
  const [comment, setComment] = useState(''); const [editing, setEditing] = useState(false); const [form, setForm] = useState({ title: '', description: '' }); const [newSubtask, setNewSubtask] = useState(''); const [subtaskAssignee, setSubtaskAssignee] = useState(''); const [showSubtaskForm, setShowSubtaskForm] = useState(false); const [linkCopied, setLinkCopied] = useState(false); const [uploading, setUploading] = useState(false); const [commentAttachments, setCommentAttachments] = useState([]); const [uploadingComment, setUploadingComment] = useState(false); const [editingCommentId, setEditingCommentId] = useState(null); const [editingCommentText, setEditingCommentText] = useState(''); const [showTagManager, setShowTagManager] = useState(false); const [newTagName, setNewTagName] = useState(''); const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

  useEffect(() => { setForm({ title: task.title, description: task.description || '' }); setEditing(false); setComment(''); setNewSubtask(''); setSubtaskAssignee(''); setShowSubtaskForm(false); setLinkCopied(false); setCommentAttachments([]); setEditingCommentId(null); setShowTagManager(false); }, [task.id]);
  
  const market = MARKETS.find(m => m.id === task.market); const me = teamMembers.find(m => m.id === currentUser); const subtasks = task.subtasks || []; const canEdit = isManager || task.createdBy === currentUser; const canContribute = canEdit || task.assignees?.includes(currentUser);
  const publicLink = task.publicToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/task/${task.publicToken}` : null;
  const copyPublicLink = () => { if (publicLink) { navigator.clipboard.writeText(publicLink); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); } };
  const handleTaskAttachmentUpload = async (files) => { setUploading(true); const up = []; for (const file of files) { const r = await uploadFile(file, `tasks/${task.id}`); if (r) { r.uploadedBy = currentUser; up.push(r); } } if (up.length > 0) await updateTask(task.id, { attachments: [...(task.attachments || []), ...up] }); setUploading(false); };
  const handleRemoveTaskAttachment = async (aid) => { await updateTask(task.id, { attachments: (task.attachments || []).filter(a => a.id !== aid) }); };
  const handleCommentAttachmentUpload = async (files) => { setUploadingComment(true); for (const file of files) { const r = await uploadFile(file, `comments/${task.id}`); if (r) { r.uploadedBy = currentUser; setCommentAttachments(prev => [...prev, r]); } } setUploadingComment(false); };
  const addComment = async () => { if (!comment.trim() && commentAttachments.length === 0) return; const nc = { id: generateId(), text: comment.trim(), author: currentUser, createdAt: new Date().toISOString(), attachments: commentAttachments.length > 0 ? commentAttachments : undefined, mentions: parseMentions(comment.trim()), reactions: [] }; updateTask(task.id, { comments: [...(task.comments || []), nc] }); setComment(''); setCommentAttachments([]); };
  const toggleReaction = (cid, emoji = '👍') => { const uc = (task.comments || []).map(c => { if (c.id !== cid) return c; const rx = c.reactions || []; const isOldFormat = rx.length > 0 && typeof rx[0] === 'string'; const normalized = isOldFormat ? rx.map(uid => ({ emoji: '👍', userId: uid })) : rx; const existing = normalized.find(r => r.emoji === emoji && r.userId === currentUser); return { ...c, reactions: existing ? normalized.filter(r => !(r.emoji === emoji && r.userId === currentUser)) : [...normalized, { emoji, userId: currentUser }] }; }); updateTask(task.id, { comments: uc }); };
  const deleteComment = (cid) => { updateTask(task.id, { comments: (task.comments || []).filter(c => c.id !== cid) }); };
  const startEditComment = (c) => { setEditingCommentId(c.id); setEditingCommentText(c.text); };
  const saveEditComment = () => { if (!editingCommentText.trim()) return; updateTask(task.id, { comments: (task.comments || []).map(c => c.id !== editingCommentId ? c : { ...c, text: editingCommentText.trim(), editedAt: new Date().toISOString() }) }); setEditingCommentId(null); setEditingCommentText(''); };
  const cancelEditComment = () => { setEditingCommentId(null); setEditingCommentText(''); };
  const save = () => { updateTask(task.id, { title: form.title, description: form.description }); setEditing(false); };
  const addSubtask = () => { if (!newSubtask.trim()) return; updateTask(task.id, { subtasks: [...subtasks, { id: generateId(), title: newSubtask.trim(), assignee: subtaskAssignee || null, status: 'open', createdAt: new Date().toISOString() }] }); setNewSubtask(''); setSubtaskAssignee(''); setShowSubtaskForm(false); };
  const toggleSubtask = (sid) => { updateTask(task.id, { subtasks: subtasks.map(s => s.id === sid ? { ...s, status: s.status === 'open' ? 'closed' : 'open' } : s) }); };
  const deleteSubtask = (sid) => { updateTask(task.id, { subtasks: subtasks.filter(s => s.id !== sid) }); };
  const updateSubtaskAssignee = (sid, aid) => { updateTask(task.id, { subtasks: subtasks.map(s => s.id === sid ? { ...s, assignee: aid || null } : s) }); };
  const toggleTag = (tagId) => { const cur = task.tags || []; updateTask(task.id, { tags: cur.includes(tagId) ? cur.filter(id => id !== tagId) : [...cur, tagId] }); };
  const handleCreateTag = async () => { if (!newTagName.trim()) return; await createCustomTag({ name: newTagName.trim(), color: newTagColor, createdBy: currentUser }); setNewTagName(''); setNewTagColor(TAG_COLORS[0]); if (onRefreshTags) onRefreshTags(); };
  const handleDeleteTag = async (tagId) => { await deleteCustomTagDb(tagId); const cur = task.tags || []; if (cur.includes(tagId)) updateTask(task.id, { tags: cur.filter(id => id !== tagId) }); if (onRefreshTags) onRefreshTags(); };
  const fd = lang === 'en' ? formatDateTimeEn : formatDateTime;

  return (
    <aside className="w-full lg:w-[640px] bg-white border-l flex flex-col overflow-hidden flex-shrink-0 fixed lg:static inset-0 z-40 lg:z-auto" style={{ borderColor: '#dadce0' }}>
      <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: '#dadce0' }}>
        <div className="flex items-center gap-2"><span className="text-lg">{market?.icon}</span><span className="text-sm font-medium" style={{ color: '#202124' }}>{lang === 'en' ? market?.nameEn : market?.name}</span>{task.isExternal && <ExternalLink size={14} style={{ color: '#f59e0b' }} />}{task.language === 'en' && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#e8f0fe', color: '#1a73e8' }}>🇬🇧</span>}</div>
        <div className="flex items-center gap-1">{task.language === 'en' && <TranslateButton task={task} />}{publicLink && <button onClick={copyPublicLink} className="p-1.5 rounded-full hover:bg-blue-50" style={{ color: linkCopied ? '#16a34a' : '#1a73e8' }}>{linkCopied ? <Check size={16} /> : <Link2 size={16} />}</button>}{canEdit && <><button onClick={() => setEditing(!editing)} className="p-1.5 rounded-full hover:bg-gray-100" style={{ color: '#5f6368' }}><Edit3 size={16} /></button><button onClick={() => deleteTask(task.id)} className="p-1.5 rounded-full hover:bg-red-50" style={{ color: '#5f6368' }}><Trash2 size={16} /></button></>}<button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100" style={{ color: '#5f6368' }}><X size={16} /></button></div>
      </div>
      {publicLink && <div className="px-3 py-1.5 border-b flex items-center gap-2" style={{ background: '#e8f0fe', borderColor: '#aecbfa' }}><Link2 size={12} style={{ color: '#1a73e8' }} /><code className="flex-1 text-xs truncate" style={{ color: '#1a73e8' }}>{publicLink}</code><button onClick={copyPublicLink} className="text-xs px-2 py-0.5 rounded hover:bg-blue-100" style={{ color: '#1a73e8' }}>{linkCopied ? '✓' : t.copyLink}</button></div>}
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {task.isExternal && <div className="p-2 rounded-lg text-sm" style={{ background: '#fefce8', border: '1px solid #fef3c7', color: '#b45309' }}>📨 {t.from}: <strong>{task.submittedBy}</strong> {task.submitterEmail && `(${task.submitterEmail})`}</div>}
        
        {editing ? <div className="space-y-3"><input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-lg font-medium" style={{ borderColor: '#dadce0', color: '#202124' }} /><RichTextEditor value={form.description} onChange={v => setForm({...form, description: v})} placeholder={t.taskDetails} minHeight="150px" /><div className="flex gap-2"><button onClick={save} className="flex-1 py-2 rounded-lg font-medium text-sm" style={{ background: '#1a73e8', color: 'white' }}>{t.save}</button><button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-lg text-sm" style={{ background: '#f1f3f4', color: '#5f6368' }}>{t.cancel}</button></div></div> : <div><div className="flex items-center gap-2 flex-wrap mb-2"><h3 className="font-medium text-lg" style={{ color: '#202124' }}>{task.title}</h3><PriorityBadge priority={task.priority} lang={lang} /><DeadlineBadge deadline={task.deadline} lang={lang} t={t} /></div><RichTextDisplay html={task.description} /></div>}

        {(() => { const ls = task.linkedSendId && allSends?.find(s => s.id === task.linkedSendId); return ls?.subjectLine ? <div className="rounded-lg p-2.5" style={{ background: '#f5f3ff', border: '1px solid #e9d5ff' }}><div className="flex items-center gap-1.5"><span style={{ color: '#7c3aed', fontSize: '13px', fontWeight: 600 }}>✉ {lang === 'en' ? 'Subject:' : 'Temat:'}</span><span className="text-sm" style={{ color: '#3c4043' }}>{ls.subjectLine}</span></div></div> : null; })()}

        <div className="flex flex-wrap gap-2 items-center p-3 rounded-lg" style={{ background: '#f6f8fc', border: '1px solid #dadce0' }}>
          <select value={task.market} onChange={e => updateTask(task.id, { market: e.target.value, subcategory: e.target.value === 'pl' ? task.subcategory : null })} className="text-xs px-2 py-1.5 border rounded-lg font-medium" style={{ borderColor: '#dadce0', color: '#5f6368' }}>
            {MARKETS.map(m => <option key={m.id} value={m.id}>{m.icon} {lang === 'en' ? m.nameEn : m.name}</option>)}
          </select>
          <select value={task.status} onChange={e => updateTask(task.id, { status: e.target.value })} className="text-xs px-2 py-1.5 border rounded-lg font-medium" style={{ borderColor: '#dadce0', color: STATUSES.find(s => s.id === task.status)?.color, background: STATUSES.find(s => s.id === task.status)?.bg }}>
            {STATUSES.filter(s => s.id !== 'pending').map(s => <option key={s.id} value={s.id}>{lang === 'en' ? s.nameEn : s.name}</option>)}
          </select>
          <select value={task.priority || ''} onChange={e => updateTask(task.id, { priority: e.target.value || null })} className="text-xs px-2 py-1.5 border rounded-lg" style={{ borderColor: '#dadce0', color: PRIORITIES.find(p => p.id === (task.priority||null))?.color }}>
            {PRIORITIES.map(p => <option key={p.id||'none'} value={p.id||''}>{lang === 'en' ? p.nameEn : p.name}</option>)}
          </select>
          <div className="flex items-center gap-1">
            <Calendar size={12} style={{ color: '#5f6368' }} />
            <input type="date" value={task.deadline || ''} onChange={e => updateTask(task.id, { deadline: e.target.value || null })} className="text-xs px-1.5 py-1.5 border rounded-lg" style={{ borderColor: '#dadce0', color: task.deadline ? (isDeadlineToday(task.deadline) ? '#ef4444' : isDeadlinePast(task.deadline) ? '#b91c1c' : '#5f6368') : '#80868b' }} />
            {task.deadline && <button onClick={() => updateTask(task.id, { deadline: null })} className="p-0.5 rounded hover:bg-red-50" style={{ color: '#80868b' }}><X size={12} /></button>}
          </div>
          {task.market === 'pl' && <select value={task.subcategory || ''} onChange={e => updateTask(task.id, { subcategory: e.target.value || null })} className="text-xs px-2 py-1.5 border rounded-lg" style={{ borderColor: '#dadce0', color: '#5f6368' }}><option value="">{t.subcategory}: {t.none}</option>{PL_SUBCATEGORIES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}
          {canContribute && <select onChange={e => { if (e.target.value && !task.assignees?.includes(e.target.value)) { updateTask(task.id, { assignees: [...(task.assignees||[]), e.target.value] }); const m = teamMembers.find(x => x.id === e.target.value); if (m) sendEmailNotification(m.email, m.name, task.title, me?.name); } e.target.value = ''; }} className="text-xs px-2 py-1.5 border rounded-lg cursor-pointer" style={{ borderColor: '#dadce0', color: '#5f6368' }} defaultValue=""><option value="">{t.addPerson}</option>{teamMembers.filter(m => m.isActive !== false && !task.assignees?.includes(m.id)).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>}
        </div>

        {task.deadline && isDeadlineToday(task.deadline) && task.status !== 'closed' && <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#fef2f2', border: '1px solid #f5c6cb' }}><AlertCircle size={16} style={{ color: '#ef4444' }} /><span className="text-sm font-medium" style={{ color: '#ef4444' }}>{t.deadline}: {t.deadlineToday}</span></div>}
        {task.deadline && isDeadlinePast(task.deadline) && !isDeadlineToday(task.deadline) && task.status !== 'closed' && <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#fef2f2', border: '1px solid #f5c6cb' }}><AlertCircle size={16} style={{ color: '#b91c1c' }} /><span className="text-sm font-medium" style={{ color: '#b91c1c' }}>{t.deadline}: {formatDeadline(task.deadline, lang)} – {lang === 'en' ? 'overdue!' : 'po terminie!'}</span></div>}

        {task.assignees?.length > 0 && <div className="flex flex-wrap gap-1.5">{task.assignees.map(aId => { const m = teamMembers.find(x => x.id === aId); return m && <div key={aId} className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: '#f1f3f4' }}><div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: m.color }}>{getInitials(m.name)}</div><span className="text-xs" style={{ color: '#202124' }}>{m.name.split(' ')[0]}</span>{canEdit && <button onClick={() => updateTask(task.id, { assignees: task.assignees.filter(a => a !== aId) })} style={{ color: '#80868b' }}><X size={12} /></button>}</div>; })}</div>}

        {task.linkedSendId && (
          <a href="/planner" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs hover:underline" style={{ color: '#7c3aed' }}>
            <CalendarClock size={12} />
            {lang === 'en' ? 'Open Planner →' : 'Otwórz Planner →'}
          </a>
        )}
        {task.links && <div><label className="block mb-1 text-xs font-medium" style={{ color: '#5f6368' }}>{t.links}</label><div className="rounded-lg border p-1" style={{ background: '#f6f8fc', borderColor: '#dadce0' }}><ClickableLinks text={task.links} /></div></div>}
        
        <div><div className="flex items-center justify-between mb-1"><div className="flex items-center gap-2"><Paperclip size={14} style={{ color: '#5f6368' }} /><label className="text-xs font-medium" style={{ color: '#5f6368' }}>{t.attachments} ({task.attachments?.length || 0})</label></div>{canContribute && <AttachmentUploader onUpload={handleTaskAttachmentUpload} uploading={uploading} />}</div><AttachmentList attachments={task.attachments} onRemove={canContribute ? handleRemoveTaskAttachment : undefined} showRemove={canContribute} /></div>
        
        <div><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><ListTodo size={14} style={{ color: '#5f6368' }} /><label className="text-xs font-medium" style={{ color: '#5f6368' }}>{t.subtasks} ({subtasks.filter(s => s.status === 'closed').length}/{subtasks.length})</label></div>{!showSubtaskForm && canContribute && <button onClick={() => setShowSubtaskForm(true)} className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-gray-100" style={{ color: '#1a73e8' }}><Plus size={14} /> {t.add}</button>}</div><div className="space-y-1">{subtasks.map(sub => { const asgn = teamMembers.find(m => m.id === sub.assignee); const done = sub.status === 'closed'; return <div key={sub.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg group hover:bg-gray-50"><button onClick={() => toggleSubtask(sub.id)} className="flex-shrink-0">{done ? <CheckSquare size={16} style={{ color: '#16a34a' }} /> : <Square size={16} style={{ color: '#dadce0' }} />}</button><span className="flex-1 text-sm" style={{ color: done ? '#80868b' : '#202124', textDecoration: done ? 'line-through' : 'none' }}>{sub.title}</span>{asgn ? <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: asgn.color }} title={asgn.name}>{getInitials(asgn.name)}</div> : canContribute && <select onChange={e => updateSubtaskAssignee(sub.id, e.target.value)} className="text-xs px-1 py-0.5 rounded border opacity-0 group-hover:opacity-100" style={{ borderColor: '#dadce0' }} value=""><option value="">+</option>{teamMembers.filter(m => m.isActive !== false).map(m => <option key={m.id} value={m.id}>{m.name.split(' ')[0]}</option>)}</select>}{canContribute && <button onClick={() => deleteSubtask(sub.id)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-50 rounded" style={{ color: '#ef4444' }}><X size={14} /></button>}</div>; })}</div>{showSubtaskForm && <div className="mt-2 p-2 rounded-lg border" style={{ borderColor: '#1a73e8', background: '#f8fbff' }}><input type="text" value={newSubtask} onChange={e => setNewSubtask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSubtask()} placeholder={t.subtaskName} className="w-full px-2 py-1.5 border rounded-lg text-sm mb-2" style={{ borderColor: '#dadce0' }} autoFocus /><div className="flex items-center gap-2"><select value={subtaskAssignee} onChange={e => setSubtaskAssignee(e.target.value)} className="flex-1 px-2 py-1 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }}><option value="">{t.noAssignment}</option>{teamMembers.filter(m => m.isActive !== false).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select><button onClick={addSubtask} className="px-3 py-1 rounded-lg text-sm font-medium" style={{ background: '#1a73e8', color: 'white' }}>{t.add}</button><button onClick={() => { setShowSubtaskForm(false); setNewSubtask(''); }} className="px-2 py-1 rounded-lg text-sm" style={{ color: '#5f6368' }}>{t.cancel}</button></div></div>}</div>
        
        <div>
          <div className="flex items-center justify-between mb-2"><label className="text-xs font-medium" style={{ color: '#5f6368' }}>{t.comments} ({task.comments?.length || 0})</label>{onMarkUnread && getUnreadCount(task, currentUser, readTimestamps) === 0 && task.comments?.length > 0 && <button onClick={() => onMarkUnread(task.id)} className="text-xs px-2 py-0.5 rounded hover:bg-gray-100" style={{ color: '#5f6368' }}>{t.markUnread}</button>}</div>
          <div className="space-y-2 mb-3">{task.comments?.map(c => { const auth = teamMembers.find(m => m.id === c.author); const isExt = c.author === 'external'; const isMy = c.author === currentUser; const rawRx = c.reactions || []; const isOldFormat = rawRx.length > 0 && typeof rawRx[0] === 'string'; const rxNorm = isOldFormat ? rawRx.map(uid => ({ emoji: '👍', userId: uid })) : rawRx; const emojiGroups = {}; rxNorm.forEach(r => { if (!emojiGroups[r.emoji]) emojiGroups[r.emoji] = []; emojiGroups[r.emoji].push(r.userId); }); const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '👀', '🔥']; const hasMention = c.mentions?.some(m => { const myM = teamMembers.find(tm => tm.id === currentUser); if (!myM) return false; return [currentUser.toLowerCase(), myM.name.split(' ')[0].toLowerCase()].includes(m.toLowerCase()); }); const isEd = editingCommentId === c.id; return <div key={c.id} className="flex gap-2 group"><div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ background: isExt ? '#5f6368' : (auth?.color || '#999') }}>{isExt ? '👤' : getInitials(auth?.name || '?')}</div><div className="flex-1 min-w-0"><div className="rounded-lg p-2" style={{ background: hasMention ? '#fef2f2' : '#f1f3f4' }}><div className="flex items-center gap-2 mb-0.5"><span className="text-xs font-medium" style={{ color: '#202124' }}>{isExt ? (c.authorName || task.submittedBy || 'Zewnętrzny') : (auth?.name || t.unknown)}</span><span className="text-xs" style={{ color: '#80868b' }}>{fd(c.createdAt)}</span>{c.editedAt && <span className="text-xs italic" style={{ color: '#80868b' }}>({t.edited})</span>}</div>{isEd ? <div className="space-y-1"><input type="text" value={editingCommentText} onChange={e => setEditingCommentText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveEditComment(); if (e.key === 'Escape') cancelEditComment(); }} className="w-full px-2 py-1 border rounded text-sm" style={{ borderColor: '#1a73e8' }} autoFocus /><div className="flex gap-1"><button onClick={saveEditComment} className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: '#1a73e8', color: 'white' }}>{t.saveComment}</button><button onClick={cancelEditComment} className="text-xs px-2 py-0.5 rounded" style={{ color: '#5f6368' }}>{t.cancelEdit}</button></div></div> : <p className="text-sm whitespace-pre-wrap" style={{ color: '#3c4043' }}><CommentText text={c.text} teamMembers={teamMembers} /></p>}<AttachmentList attachments={c.attachments} showRemove={false} /></div>{Object.keys(emojiGroups).length > 0 && <div className="flex flex-wrap gap-1 mt-1 ml-1">{Object.entries(emojiGroups).map(([emoji, userIds]) => { const isMine = userIds.includes(currentUser); const names = userIds.map(uid => { const m = teamMembers.find(tm => tm.id === uid); return m ? m.name.split(' ')[0] : uid; }); return <button key={emoji} onClick={() => toggleReaction(c.id, emoji)} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs" style={{ background: isMine ? '#d2e3fc' : '#f1f3f4', border: isMine ? '1px solid #8ab4f8' : '1px solid #dadce0' }} title={names.join(', ')}><span>{emoji}</span><span style={{ color: isMine ? '#1a73e8' : '#5f6368', fontSize: '11px' }}>{userIds.length}</span></button>; })}</div>}<div className="flex items-center gap-1 mt-0.5 ml-1">{QUICK_EMOJIS.map(emoji => <button key={emoji} onClick={() => toggleReaction(c.id, emoji)} className="p-0.5 rounded hover:bg-gray-100 text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontSize: '12px', lineHeight: 1 }}>{emoji}</button>)}{isMy && !isEd && <><button onClick={() => startEditComment(c)} className="text-xs px-1.5 py-0.5 rounded-full hover:bg-gray-100" style={{ color: '#80868b' }}>{t.editComment}</button><button onClick={() => deleteComment(c.id)} className="text-xs px-1.5 py-0.5 rounded-full hover:bg-red-50" style={{ color: '#80868b' }}>{t.delete}</button></>}</div></div></div>; })}</div>
          <div className="flex gap-2 items-start"><MentionInput value={comment} onChange={setComment} onSubmit={addComment} placeholder={t.writeComment} teamMembers={teamMembers} /><AttachmentUploader onUpload={handleCommentAttachmentUpload} uploading={uploadingComment} /><button onClick={addComment} className="p-2 rounded-xl" style={{ background: '#1a73e8', color: 'white' }}><Send size={16} /></button></div>
          <AttachmentList attachments={commentAttachments} onRemove={(id) => setCommentAttachments(p => p.filter(a => a.id !== id))} />
        </div>
        
        <div className="pt-3 border-t text-xs" style={{ borderColor: '#dadce0', color: '#80868b' }}><p>{t.created}: {fd(task.createdAt)}</p>{task.createdBy && <p>{t.byPerson}: {teamMembers.find(m => m.id === task.createdBy)?.name}</p>}</div>
      </div>
    </aside>
  );
}

// === NEW TASK MODAL ===
function NewTaskModal({ onClose, onSave, currentUser, restrictedMarket, t, lang, teamMembers }) {
  const [f, sF] = useState({ title: '', description: '', market: restrictedMarket || 'pl', status: 'open', assignees: [currentUser], priority: null, subcategory: null, attachments: [], deadline: null });
  const [uploading, setUploading] = useState(false);
  const [createSend, setCreateSend] = useState(false);
  const tog = (id) => sF(p => ({...p, assignees: p.assignees.includes(id) ? p.assignees.filter(a => a !== id) : [...p.assignees, id]}));
  const sv = () => { if (f.title.trim()) onSave({ ...f, _createSend: createSend }); };
  const hUp = async (files) => { setUploading(true); for (const file of files) { const r = await uploadFile(file, 'tasks/new'); if (r) { r.uploadedBy = currentUser; sF(p => ({...p, attachments: [...p.attachments, r]})); } } setUploading(false); };
  return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}><div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ boxShadow: '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)' }} onClick={e => e.stopPropagation()}><div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#dadce0' }}><h3 className="text-lg font-medium" style={{ color: '#202124' }}>{t.newTask}</h3><button onClick={onClose} style={{ color: '#5f6368' }}><X size={20} /></button></div><div className="p-5 space-y-4"><div><label className="text-sm font-medium block mb-1.5" style={{ color: '#202124' }}>{t.title} *</label><input type="text" value={f.title} onChange={e => sF({...f, title: e.target.value})} className="w-full px-4 py-2.5 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }} placeholder={t.whatToDo} autoFocus /></div><div><label className="text-sm font-medium block mb-1.5" style={{ color: '#202124' }}>{t.description}</label><RichTextEditor value={f.description} onChange={v => sF({...f, description: v})} placeholder={t.taskDetails} minHeight="120px" /></div><div><div className="flex items-center justify-between mb-1.5"><label className="text-sm font-medium" style={{ color: '#202124' }}>{t.attachments}</label><AttachmentUploader onUpload={hUp} uploading={uploading} /></div><AttachmentList attachments={f.attachments} onRemove={id => sF(p => ({...p, attachments: p.attachments.filter(a => a.id !== id)}))} /></div><div><label className="text-sm font-medium block mb-1.5" style={{ color: '#202124' }}>{t.priority}</label><div className="flex flex-wrap gap-2">{PRIORITIES.map(p => <button key={p.id||'none'} type="button" onClick={() => sF({...f, priority: p.id})} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm" style={{ background: f.priority === p.id ? p.bg : '#f1f3f4', color: f.priority === p.id ? p.color : '#5f6368', border: f.priority === p.id ? `2px solid ${p.color}` : '2px solid transparent' }}>{p.id && <Flag size={12} />}{lang === 'en' ? p.nameEn : p.name}</button>)}</div></div><div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-medium block mb-1.5" style={{ color: '#202124' }}>{t.market}</label><select value={f.market} onChange={e => sF({...f, market: e.target.value, subcategory: e.target.value === 'pl' ? f.subcategory : null})} className="w-full px-4 py-2.5 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }} disabled={!!restrictedMarket}>{MARKETS.map(m => <option key={m.id} value={m.id}>{m.icon} {lang === 'en' ? m.nameEn : m.name}</option>)}</select></div><div><label className="text-sm font-medium block mb-1.5" style={{ color: '#202124' }}>{t.type}</label><select value={f.status} onChange={e => sF({...f, status: e.target.value})} className="w-full px-4 py-2.5 border rounded-lg text-sm" style={{ borderColor: '#dadce0' }}><option value="open">{t.open}</option><option value="longterm">{t.longterm}</option><option value="paused">{t.paused}</option><option value="monitoring">{t.monitoring}</option><option value="approval">{t.approval}</option><option value="ideas">{t.ideas}</option></select></div></div><div><label className="text-sm font-medium block mb-1.5" style={{ color: '#202124' }}>{t.deadline}</label><div className="flex items-center gap-2"><Calendar size={16} style={{ color: '#5f6368' }} /><input type="date" value={f.deadline || ''} onChange={e => sF({...f, deadline: e.target.value || null})} className="px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#dadce0', color: '#202124' }} />{f.deadline && <button type="button" onClick={() => sF({...f, deadline: null})} className="p-1 rounded hover:bg-red-50" style={{ color: '#80868b' }}><X size={14} /></button>}<span className="text-xs" style={{ color: '#80868b' }}>{t.noDeadline}</span></div>{f.deadline && <label className="flex items-center gap-2 mt-2 cursor-pointer"><input type="checkbox" checked={createSend} onChange={e => setCreateSend(e.target.checked)} className="w-3.5 h-3.5 rounded" /><span className="text-xs" style={{ color: '#7c3aed' }}>{lang === 'en' ? 'Create send in Planner for this date' : 'Utwórz wysyłkę w Plannerze na ten dzień'}</span></label>}</div>{f.market === 'pl' && <div><label className="text-sm font-medium block mb-1.5" style={{ color: '#202124' }}>{t.subcategory}</label><div className="flex gap-2"><button type="button" onClick={() => sF({...f, subcategory: null})} className="px-3 py-1.5 rounded-full text-sm" style={{ background: !f.subcategory ? '#f1f3f4' : 'white', color: '#5f6368', border: !f.subcategory ? '2px solid #5f6368' : '2px solid #dadce0' }}>{t.none}</button>{PL_SUBCATEGORIES.map(s => <button key={s.id} type="button" onClick={() => sF({...f, subcategory: s.id})} className="px-3 py-1.5 rounded-full text-sm" style={{ background: f.subcategory === s.id ? s.bg : 'white', color: f.subcategory === s.id ? s.color : '#5f6368', border: f.subcategory === s.id ? `2px solid ${s.color}` : '2px solid #dadce0' }}>{s.name}</button>)}</div></div>}<div><label className="text-sm font-medium block mb-2" style={{ color: '#202124' }}>{t.assignToPerson}</label><div className="flex flex-wrap gap-2">{teamMembers.filter(m => m.isActive !== false).map(m => <button key={m.id} type="button" onClick={() => tog(m.id)} className="flex items-center gap-2 px-3 py-2 rounded-full border text-sm" style={{ borderColor: f.assignees.includes(m.id) ? '#1a73e8' : '#dadce0', background: f.assignees.includes(m.id) ? '#e8f0fe' : 'white', color: f.assignees.includes(m.id) ? '#1a73e8' : '#202124' }}><div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: m.color }}>{getInitials(m.name)}</div><span>{m.name.split(' ')[0]}</span>{f.assignees.includes(m.id) && <Check size={14} />}</button>)}</div></div></div><div className="p-5 border-t flex justify-end gap-3" style={{ borderColor: '#dadce0' }}><button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100" style={{ color: '#5f6368' }}>{t.cancel}</button><button onClick={sv} className="px-5 py-2.5 rounded-lg text-sm font-medium" style={{ background: '#1a73e8', color: 'white' }}>{t.createTask}</button></div></div></div>;
}

// === PERSON MULTI-SELECT ===
function PersonMultiSelect({ selected, onChange, teamMembers, t, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  const activeMembers = teamMembers.filter(m => m.isActive !== false);
  const toggle = (id) => { onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]); };
  const selectAll = () => onChange([]);
  const displayLabel = selected.length === 0 ? t.everyone : selected.length === 1 ? teamMembers.find(m => m.id === selected[0])?.name || selected[0] : `${selected.length} ${selected.length > 4 ? 'osób' : 'osoby'}`;
  return (
    <div className="relative" ref={ref}>
      {label && <div style={{ fontSize: '10px', color: '#80868b', marginBottom: '2px', paddingLeft: '2px', fontWeight: 500, letterSpacing: '0.02em' }}>{label}</div>}
      <button onClick={() => setOpen(!open)} className="w-full rounded-md px-2.5 py-1.5 text-xs border text-left flex items-center justify-between" style={{ borderColor: '#dadce0', color: '#3c4043', borderWidth: '0.5px', background: 'white' }}>
        <span className="truncate">{displayLabel}</span>
        <ChevronDown size={12} style={{ color: '#80868b', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-lg overflow-hidden z-50" style={{ boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 2px 6px 2px rgba(60,64,67,.15)', border: '1px solid #dadce0', maxHeight: '260px', overflowY: 'auto' }}>
          <button onClick={selectAll} className="w-full px-2.5 py-1.5 flex items-center gap-2 hover:bg-gray-50 text-left text-xs" style={{ borderBottom: '1px solid #f1f3f4', color: selected.length === 0 ? '#1a73e8' : '#3c4043', fontWeight: selected.length === 0 ? 600 : 400 }}>
            {selected.length === 0 ? <CheckSquare size={13} style={{ color: '#1a73e8' }} /> : <Square size={13} style={{ color: '#80868b' }} />}
            <span>{t.everyone}</span>
          </button>
          {activeMembers.map(m => {
            const isSelected = selected.includes(m.id);
            return (
              <button key={m.id} onClick={() => toggle(m.id)} className="w-full px-2.5 py-1.5 flex items-center gap-2 hover:bg-gray-50 text-left text-xs" style={{ color: isSelected ? '#1a73e8' : '#3c4043', fontWeight: isSelected ? 500 : 400 }}>
                {isSelected ? <CheckSquare size={13} style={{ color: '#1a73e8' }} /> : <Square size={13} style={{ color: '#80868b' }} />}
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ background: m.color, fontSize: '7px', fontWeight: 600 }}>{getInitials(m.name)}</div>
                <span className="truncate">{m.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// === GLOBAL SEARCH ===
// Strip HTML tags from rich text to get plain text for searching
const stripHtml = (html) => {
  if (!html) return '';
  if (typeof document === 'undefined') return html.replace(/<[^>]*>/g, ' ');
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
};

// Escape regex special chars
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Extract short snippet around match, with bolded match
const getSnippet = (text, query, maxLen = 80) => {
  if (!text) return '';
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, maxLen) + (text.length > maxLen ? '…' : '');
  const ctx = Math.floor((maxLen - query.length) / 2);
  const start = Math.max(0, idx - ctx);
  const end = Math.min(text.length, idx + query.length + ctx);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return prefix + text.slice(start, end) + suffix;
};

// Render text with highlighted query occurrences
function HighlightedText({ text, query }) {
  if (!query || !text) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, 'gi'));
  return <>{parts.map((p, i) => p.toLowerCase() === query.toLowerCase()
    ? <mark key={i} style={{ background: '#fef08a', color: '#202124', padding: '0 1px', borderRadius: '2px' }}>{p}</mark>
    : <span key={i}>{p}</span>)}</>;
}

function GlobalSearch({ tasks, onSelectTask, teamMembers, customTags, t, lang }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const resultsRef = useRef(null);

  // Debounce query to avoid re-filtering on every keystroke
  useEffect(() => {
    const tm = setTimeout(() => setDebouncedQuery(query.trim()), 150);
    return () => clearTimeout(tm);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const h = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Focus input when opened
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);

  // Global Ctrl/Cmd+K shortcut to open search
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setOpen(true); }
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open]);

  // Build search index – memoized, only rebuilds when tasks change
  // Each task gets searchable text blobs for: title, description, comments, subtasks
  const searchIndex = useMemo(() => tasks.map(task => ({
    task,
    title: (task.title || '').toLowerCase(),
    description: stripHtml(task.description || '').toLowerCase(),
    comments: (task.comments || []).map(c => ({ text: stripHtml(c.text || '').toLowerCase(), raw: stripHtml(c.text || ''), author: c.author, id: c.id })),
    subtasks: (task.subtasks || []).map(s => ({ text: (s.title || s.name || '').toLowerCase(), raw: s.title || s.name || '', status: s.status })),
  })), [tasks]);

  // Run search – each result carries WHERE the match was found (title/description/comment/subtask)
  const results = useMemo(() => {
    if (debouncedQuery.length < 2) return [];
    const q = debouncedQuery.toLowerCase();
    const out = [];
    for (const entry of searchIndex) {
      const matches = [];
      if (entry.title.includes(q)) matches.push({ type: 'title', text: entry.task.title });
      if (entry.description.includes(q)) matches.push({ type: 'description', text: stripHtml(entry.task.description) });
      for (const c of entry.comments) {
        if (c.text.includes(q)) { matches.push({ type: 'comment', text: c.raw, author: c.author }); break; } // only first comment match
      }
      for (const s of entry.subtasks) {
        if (s.text.includes(q)) { matches.push({ type: 'subtask', text: s.raw }); break; }
      }
      if (matches.length > 0) {
        // Priority: title matches first, then active tasks, then closed
        const titleMatch = matches.some(m => m.type === 'title') ? 0 : 1;
        const closedPenalty = entry.task.status === 'closed' ? 1 : 0;
        out.push({ task: entry.task, matches, sortKey: titleMatch * 10 + closedPenalty });
      }
    }
    out.sort((a, b) => a.sortKey - b.sortKey);
    return out.slice(0, 20);
  }, [searchIndex, debouncedQuery]);

  // Reset active index when results change
  useEffect(() => { setActiveIdx(0); }, [debouncedQuery]);

  // Scroll active result into view
  useEffect(() => {
    if (!resultsRef.current) return;
    const el = resultsRef.current.querySelector(`[data-idx="${activeIdx}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  const handleSelect = (task) => {
    onSelectTask(task);
    setOpen(false);
    setQuery('');
  };

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && results[activeIdx]) { e.preventDefault(); handleSelect(results[activeIdx].task); }
    else if (e.key === 'Escape') { setOpen(false); setQuery(''); }
  };

  const labelFor = (type) => {
    if (type === 'title') return t.searchInTitle;
    if (type === 'description') return t.searchInDescription;
    if (type === 'comment') return t.searchInComment;
    if (type === 'subtask') return t.searchInSubtask;
    return '';
  };

  return (
    <div className="relative" ref={containerRef}>
      <button onClick={() => setOpen(o => !o)} className="p-2 rounded-full hover:bg-gray-100" style={{ color: open ? '#1a73e8' : '#5f6368' }} title={`${t.search} (Ctrl+K)`}>
        <Search size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[420px] max-w-[calc(100vw-2rem)] bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 2px 6px 2px rgba(60,64,67,.15)', border: '1px solid #dadce0', zIndex: 9999 }}>
          <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid #dadce0' }}>
            <Search size={16} style={{ color: '#5f6368', flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder={t.searchPlaceholder}
              className="flex-1 text-sm outline-none"
              style={{ color: '#202124', border: 'none', background: 'transparent' }}
            />
            {query && <button onClick={() => { setQuery(''); inputRef.current?.focus(); }} className="p-0.5 rounded hover:bg-gray-100" style={{ color: '#80868b' }}><X size={14} /></button>}
          </div>
          <div ref={resultsRef} className="overflow-y-auto" style={{ maxHeight: '420px' }}>
            {debouncedQuery.length < 2 ? (
              <div className="py-8 text-center text-xs" style={{ color: '#80868b' }}>
                {lang === 'en' ? 'Type at least 2 characters…' : 'Wpisz min. 2 znaki…'}
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-xs" style={{ color: '#80868b' }}>{t.searchNoResults}</div>
            ) : (
              <>
                <div className="px-3 py-1.5 text-xs" style={{ color: '#80868b', background: '#f8f9fa', borderBottom: '1px solid #f1f3f4' }}>
                  {results.length} {t.searchResults}
                </div>
                {results.map((r, idx) => {
                  const mk = MARKETS.find(m => m.id === r.task.market);
                  const st = STATUSES.find(s => s.id === r.task.status);
                  const StIcon = st?.icon || Circle;
                  const isActive = idx === activeIdx;
                  const primaryMatch = r.matches[0];
                  const snippet = primaryMatch.type === 'title' ? '' : getSnippet(primaryMatch.text, debouncedQuery);
                  return (
                    <button
                      key={r.task.id}
                      data-idx={idx}
                      onClick={() => handleSelect(r.task)}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className="w-full px-3 py-2 flex gap-2 text-left"
                      style={{ background: isActive ? '#f1f3f4' : 'white', borderBottom: '1px solid #f1f3f4' }}
                    >
                      <div className="flex-shrink-0 pt-0.5">
                        <span style={{ fontSize: '14px' }}>{mk?.icon || '📋'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <StIcon size={11} style={{ color: st?.color || '#80868b', flexShrink: 0 }} />
                          <span className="text-xs" style={{ color: st?.color || '#80868b', fontWeight: 500 }}>
                            {lang === 'en' ? st?.nameEn : st?.name}
                          </span>
                          {r.task.priority && <PriorityBadge priority={r.task.priority} size="small" lang={lang} />}
                          {r.matches.length > 1 && (
                            <span className="text-xs px-1.5 rounded-full" style={{ background: '#e8f0fe', color: '#1a73e8', fontSize: '10px' }}>
                              +{r.matches.length - 1}
                            </span>
                          )}
                        </div>
                        <div className="text-sm truncate" style={{ color: '#202124', fontWeight: primaryMatch.type === 'title' ? 500 : 400 }}>
                          <HighlightedText text={r.task.title} query={debouncedQuery} />
                        </div>
                        {snippet && (
                          <div className="text-xs mt-0.5 truncate" style={{ color: '#5f6368' }}>
                            <span style={{ color: '#80868b', fontStyle: 'italic' }}>{labelFor(primaryMatch.type)}: </span>
                            <HighlightedText text={snippet} query={debouncedQuery} />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>
          {results.length > 0 && (
            <div className="px-3 py-1.5 text-xs flex items-center gap-3" style={{ color: '#80868b', background: '#f8f9fa', borderTop: '1px solid #f1f3f4' }}>
              <span>↑↓ {lang === 'en' ? 'navigate' : 'nawiguj'}</span>
              <span>↵ {lang === 'en' ? 'open' : 'otwórz'}</span>
              <span>Esc {lang === 'en' ? 'close' : 'zamknij'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// === MAIN APP ===
export default function TaskApp() {
  const [currentUser, setCurrentUser] = useState(null); const [teamMembers, setTeamMembers] = useState(FALLBACK_TEAM); const [tasks, setTasks] = useState([]); const [loading, setLoading] = useState(true); const [loadingTeam, setLoadingTeam] = useState(true); const [selectedTask, setSelectedTask] = useState(null); const [showNewTask, setShowNewTask] = useState(false); const [showUsersPanel, setShowUsersPanel] = useState(false); const [filterMarket, setFilterMarket] = useState('all'); const [filterPerson, setFilterPerson] = useState([]); const [filterSendsPerson, setFilterSendsPerson] = useState([]); const [filterStatus, setFilterStatus] = useState('active'); const [filterDeadline, setFilterDeadline] = useState(false);
  const [filterLinkedPlanner, setFilterLinkedPlanner] = useState(false);
  const [weeklySends, setWeeklySends] = useState([]);
  const [nextWeekSends, setNextWeekSends] = useState([]);
  const [week3Sends, setWeek3Sends] = useState([]);
  const [allSends, setAllSends] = useState([]);
  const [weekSendsOpen, setWeekSendsOpen] = useState(false);
  const [nextWeekSendsOpen, setNextWeekSendsOpen] = useState(false);
  const [week3SendsOpen, setWeek3SendsOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); const [activeTab, setActiveTab] = useState('tasks'); const [copied, setCopied] = useState(false); const [checkingAuth, setCheckingAuth] = useState(true); const [readTimestamps, setReadTimestamps] = useState({}); const [seenTaskIds, setSeenTaskIds] = useState([]); const [sidebarOpen, setSidebarOpen] = useState(false); const [customTags, setCustomTags] = useState([]); const filtersInitialized = useRef(false);

  useEffect(() => { (async () => { setLoadingTeam(true); const m = await getTeamMembers(); if (m.length > 0) setTeamMembers(m); setLoadingTeam(false); })(); }, []);
  const currentMember = teamMembers.find(m => m.id === currentUser); const lang = currentMember?.language || 'pl'; const t = TRANSLATIONS[lang]; const isManager = currentMember?.isManager || false; const restrictedMarket = currentMember?.restrictedToMarket || null;
  // Backward-compat: stary seeOnlyAssigned:true → defaultTasksView:'mine'. Teraz to tylko domyślne ustawienie filtra, nie twarde ograniczenie – user może przełączyć na „wszystkich”.
  const defaultTasksView = currentMember?.defaultTasksView || (currentMember?.seeOnlyAssigned ? 'mine' : 'all');
  const defaultSendsView = currentMember?.defaultSendsView || 'all';
  useEffect(() => { if (currentUser) { getReadTimestampsFromDb(currentUser).then(ts => setReadTimestamps(ts)); setSeenTaskIds(getSeenTaskIds(currentUser)); } }, [currentUser]);
  useEffect(() => { const su = sessionStorage.getItem('av_tasks_user'); if (su) { (async () => { const m = await getTeamMembers(); if (m.find(x => x.id === su)) { setCurrentUser(su); setTeamMembers(m); } setCheckingAuth(false); })(); } else setCheckingAuth(false); }, []);
  useEffect(() => { if (restrictedMarket) setFilterMarket(restrictedMarket); }, [restrictedMarket]);
  useEffect(() => {
    if (!currentUser || filtersInitialized.current) return;
    filtersInitialized.current = true;
    const sm = sessionStorage.getItem(`av_filter_market_${currentUser}`);
    const sp = sessionStorage.getItem(`av_filter_person_${currentUser}`);
    const ssp = sessionStorage.getItem(`av_filter_sends_person_${currentUser}`);
    if (!restrictedMarket && sm) setFilterMarket(sm);
    // Taski – z sesji, a jak brak → zgodnie z defaultTasksView z profilu
    if (sp) {
      try { const parsed = JSON.parse(sp); setFilterPerson(Array.isArray(parsed) ? parsed : []); }
      catch { setFilterPerson(defaultTasksView === 'mine' ? [currentUser] : []); }
    } else {
      setFilterPerson(defaultTasksView === 'mine' ? [currentUser] : []);
    }
    // Wysyłki – analogicznie
    if (ssp) {
      try { const parsed = JSON.parse(ssp); setFilterSendsPerson(Array.isArray(parsed) ? parsed : []); }
      catch { setFilterSendsPerson(defaultSendsView === 'mine' ? [currentUser] : []); }
    } else {
      setFilterSendsPerson(defaultSendsView === 'mine' ? [currentUser] : []);
    }
  }, [currentUser, isManager, restrictedMarket, defaultTasksView, defaultSendsView]);
  useEffect(() => { if (currentUser && !restrictedMarket) sessionStorage.setItem(`av_filter_market_${currentUser}`, filterMarket); }, [filterMarket, currentUser, restrictedMarket]);
  useEffect(() => { if (currentUser) sessionStorage.setItem(`av_filter_person_${currentUser}`, JSON.stringify(filterPerson)); }, [filterPerson, currentUser]);
  useEffect(() => { if (currentUser) sessionStorage.setItem(`av_filter_sends_person_${currentUser}`, JSON.stringify(filterSendsPerson)); }, [filterSendsPerson, currentUser]);
  const loadTasks = useCallback(async () => { const d = await getTasks(); setTasks(d); setLoading(false); return d; }, []);
  const loadCustomTags = async () => { setCustomTags(await getCustomTags()); };
  const loadWeeklySends = useCallback(async () => {
    try {
      const all = await getScheduledSends();
      setAllSends(all);
      const now = new Date();
      const day = now.getDay();
      const diffMon = day === 0 ? -6 : 1 - day;
      const monday = new Date(now); monday.setDate(now.getDate() + diffMon); monday.setHours(0,0,0,0);
      const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const weekRange = (offset) => {
        const mon = new Date(monday); mon.setDate(monday.getDate() + offset * 7);
        const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
        return [fmt(mon), fmt(sun)];
      };
      const [m1, s1] = weekRange(0), [m2, s2] = weekRange(1), [m3, s3] = weekRange(2);
      const sort = (a, b) => a.sendDate.localeCompare(b.sendDate) || (a.sendTime||'').localeCompare(b.sendTime||'');
      const notCancelled = s => s.status !== 'cancelled';
      setWeeklySends(all.filter(s => s.sendDate >= m1 && s.sendDate <= s1 && notCancelled(s)).sort(sort));
      setNextWeekSends(all.filter(s => s.sendDate >= m2 && s.sendDate <= s2 && notCancelled(s)).sort(sort));
      setWeek3Sends(all.filter(s => s.sendDate >= m3 && s.sendDate <= s3 && notCancelled(s)).sort(sort));
    } catch (e) { console.error('Failed to load weekly sends:', e); }
  }, []);
  useEffect(() => { if (currentUser) { loadTasks(); loadCustomTags(); loadWeeklySends(); } }, [currentUser]);
  useEffect(() => { if (!currentUser) return; const iv = setInterval(() => { loadTasks(); loadWeeklySends(); }, 30000); return () => clearInterval(iv); }, [currentUser]);
  const handleLogout = () => { sessionStorage.removeItem('av_tasks_user'); setCurrentUser(null); setTasks([]); setSelectedTask(null); setShowUsersPanel(false); filtersInitialized.current = false; };
  const handleSelectTask = useCallback((task) => { setSelectedTask(task); setShowUsersPanel(false); setSidebarOpen(false); if (currentUser && task) { const now = new Date().toISOString(); setReadTimestamps(prev => ({...prev, [task.id]: now})); markTaskAsSeen(task.id, currentUser); setSeenTaskIds(prev => prev.includes(task.id) ? prev : [...prev, task.id]); setTaskReadInDb(currentUser, task.id); } }, [currentUser]);
  const handleMarkUnread = useCallback((taskId) => { if (currentUser) { setReadTimestamps(prev => { const n = {...prev}; delete n[taskId]; return n; }); setTaskUnreadInDb(currentUser, taskId); } }, [currentUser]);
  const reloadTeamMembers = async () => { const m = await getTeamMembers(); if (m.length > 0) setTeamMembers(m); };

  if (checkingAuth || loadingTeam) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#f6f8fc' }}><Loader2 className="animate-spin" size={32} style={{ color: '#1a73e8' }} /></div>;
  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} teamMembers={teamMembers} />;

  const pendingTasks = tasks.filter(t => t.status === 'pending' && (!restrictedMarket || t.market === restrictedMarket));
  const canSeeAllTasks = currentMember?.canSeeAllTasks !== false;
  const seeOnlyAssigned = !canSeeAllTasks;
  const visibleTasks = tasks.filter(t => { if (t.status === 'pending') return false; if (restrictedMarket && t.market !== restrictedMarket) return false; if (seeOnlyAssigned && !t.assignees?.includes(currentUser)) return false; if (filterMarket !== 'all' && t.market !== filterMarket) return false; if (filterPerson.length > 0 && !filterPerson.some(fp => t.assignees?.includes(fp))) return false; return true; });
  const visibleWeeklySends = weeklySends.filter(s => !restrictedMarket || s.market === restrictedMarket);
  const visibleNextWeekSends = nextWeekSends.filter(s => !restrictedMarket || s.market === restrictedMarket);
  const visibleWeek3Sends = week3Sends.filter(s => !restrictedMarket || s.market === restrictedMarket);
  const getFilteredByStatus = (sf) => { switch(sf) { case 'active': return visibleTasks.filter(t => t.status === 'open' || t.status === 'longterm'); case 'open': return visibleTasks.filter(t => t.status === 'open'); case 'longterm': return visibleTasks.filter(t => t.status === 'longterm'); case 'paused': return visibleTasks.filter(t => t.status === 'paused'); case 'monitoring': return visibleTasks.filter(t => t.status === 'monitoring'); case 'approval': return visibleTasks.filter(t => t.status === 'approval'); case 'ideas': return visibleTasks.filter(t => t.status === 'ideas'); case 'closed': return visibleTasks.filter(t => t.status === 'closed'); default: return visibleTasks; } };
  let filteredTasks = sortTasks(getFilteredByStatus(filterStatus), sortBy);
  if (filterDeadline) filteredTasks = filteredTasks.filter(t => !!t.deadline);
  if (filterLinkedPlanner) filteredTasks = filteredTasks.filter(t => !!t.linkedSendId);
  
  // Hide all planner-linked tasks from the main list when accordion is visible
  // (this week's are in the accordion, future ones will appear when their week comes)
  const showAccordion = (filterStatus === 'active' || filterStatus === 'open') && (visibleWeeklySends.length > 0 || visibleNextWeekSends.length > 0 || visibleWeek3Sends.length > 0) && !filterLinkedPlanner && !filterDeadline;
  if (showAccordion) {
    filteredTasks = filteredTasks.filter(t => !t.linkedSendId);
  }

  const openTasks = visibleTasks.filter(t => t.status === 'open'); const longtermTasks = visibleTasks.filter(t => t.status === 'longterm'); const pausedTasks = visibleTasks.filter(t => t.status === 'paused'); const monitoringTasks = visibleTasks.filter(t => t.status === 'monitoring'); const approvalTasks = visibleTasks.filter(t => t.status === 'approval'); const ideasTasks = visibleTasks.filter(t => t.status === 'ideas'); const closedTasks = visibleTasks.filter(t => t.status === 'closed');
  const withDeadlineCount = visibleTasks.filter(t => !!t.deadline && t.status !== 'closed').length;

  const updateTask = async (id, updates, options = {}) => { const old = tasks.find(t => t.id === id); const nt = {...old, ...updates}; setTasks(prev => prev.map(t => t.id === id ? nt : t)); if (selectedTask?.id === id) setSelectedTask(nt); if (updates.status === 'closed' && old?.status !== 'closed' && old?.isExternal && old?.submitterEmail && !options.skipEmail) { const r = await sendCompletedEmail(old, currentMember?.name); const ee = { id: generateId(), type: 'completed', sentAt: new Date().toISOString(), sentBy: currentUser, sentTo: old.submitterEmail, success: r.sent }; updates.emailHistory = [...(old.emailHistory||[]), ee]; nt.emailHistory = updates.emailHistory; setTasks(prev => prev.map(t => t.id === id ? nt : t)); if (selectedTask?.id === id) setSelectedTask(nt); }
    // Sync: when closing a task linked to a planner send, mark send as done
    if (updates.status === 'closed' && old?.linkedSendId) {
      try {
        await updateScheduledSend(old.linkedSendId, { status: 'done' });
        loadWeeklySends();
      } catch (e) { console.error('Sync send status failed:', e); }
    }
    // Sync: when reopening a task linked to a planner send, revert send status to 'todo'
    if (old?.status === 'closed' && updates.status && updates.status !== 'closed' && old?.linkedSendId) {
      try {
        await updateScheduledSend(old.linkedSendId, { status: 'todo' });
        loadWeeklySends();
      } catch (e) { console.error('Sync send status failed:', e); }
    }
    // Sync: title, description, deadline, assignees, market → planner
    if (old?.linkedSendId && (updates.title || updates.description !== undefined || updates.deadline || updates.assignees || updates.market)) {
      const sendUpdates = {};
      if (updates.title) sendUpdates.title = updates.title;
      if (updates.description !== undefined) sendUpdates.description = updates.description;
      if (updates.deadline) sendUpdates.sendDate = updates.deadline;
      if (updates.assignees) sendUpdates.assignees = updates.assignees;
      if (updates.market) sendUpdates.market = updates.market;
      try { await updateScheduledSend(old.linkedSendId, sendUpdates); } catch (e) { console.error('Sync task→planner failed:', e); }
    }
    await updateTaskDb(id, updates); };
  const deleteTask = async (id) => { if (confirm(t.deleteTask)) { setTasks(prev => prev.filter(t => t.id !== id)); setSelectedTask(null); await deleteTaskDb(id); } };
  const approveTask = async (task, assignees) => { await updateTask(task.id, { status: 'open', assignees, approvedAt: new Date().toISOString(), approvedBy: currentUser }); for (const aId of assignees) { const m = teamMembers.find(x => x.id === aId); if (m) await sendEmailNotification(m.email, m.name, task.title, currentMember?.name); } setActiveTab('tasks'); };
  const addTask = async (task) => { const wantSend = task._createSend; const { _createSend, ...taskData } = task; const nt = {...taskData, createdAt: new Date().toISOString(), createdBy: currentUser, isExternal: false, subtasks: []}; const c = await createTask(nt); if (c) { if (wantSend && c.deadline) { try { const send = await createScheduledSend({ title: c.title, description: '', channel: 'email', tools: ['hubspot'], market: c.market, segment: '', sendDate: c.deadline, sendTime: '10:00', status: 'todo', assignees: c.assignees || [], linkedTaskId: c.id, createdBy: currentUser }); if (send) await updateTaskDb(c.id, { linkedSendId: send.id }); } catch (e) { console.error('Failed to create linked send:', e); } } await loadTasks(); await loadWeeklySends(); } setShowNewTask(false); for (const aId of task.assignees||[]) { const m = teamMembers.find(x => x.id === aId); if (m && m.id !== currentUser) await sendEmailNotification(m.email, m.name, task.title, currentMember?.name); } };

  // Auto-create task for a planner send that doesn't have one yet
  const createTaskForSend = async (send) => {
    const newTask = await createTask({
      title: send.title,
      description: send.description || '',
      market: send.market,
      status: 'open',
      deadline: send.sendDate || null,
      assignees: send.assignees || [],
      createdBy: currentUser,
      language: 'pl',
      linkedSendId: send.id,
    });
    if (newTask) {
      // Update the send with the linked task id
      try { await updateScheduledSend(send.id, { linkedTaskId: newTask.id }); } catch (e) { console.error('Failed to link send to task:', e); }
      await loadTasks();
      await loadWeeklySends();
      handleSelectTask(newTask);
    }
  };

  const formUrl = typeof window !== 'undefined' ? `${window.location.origin}/request` : '/request';
  const copyLink = () => { navigator.clipboard.writeText(formUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#f6f8fc', color: '#5f6368' }}>{t.loading}</div>;

  return (
    <div className="min-h-screen flex" style={{ background: '#f6f8fc' }}>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`w-52 flex flex-col min-h-screen flex-shrink-0 bg-white fixed lg:static z-30 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ borderRight: '1px solid #dadce0' }}>
        <div className="px-4 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid #dadce0' }}><div><img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="Angloville" className="h-6" /><p className="mt-0.5 text-xs" style={{ color: '#80868b', letterSpacing: '0.02em' }}>{t.marketingTasks}</p></div><button onClick={() => setSidebarOpen(false)} className="p-1 rounded hover:bg-gray-100 lg:hidden" style={{ color: '#80868b' }}><X size={16} /></button></div>
        <div className="px-3 py-2.5 space-y-1.5" style={{ borderBottom: '1px solid #dadce0' }}>
          {!restrictedMarket && <select value={filterMarket} onChange={e => setFilterMarket(e.target.value)} className="w-full rounded-md px-2.5 py-1.5 text-xs border" style={{ borderColor: '#dadce0', color: '#3c4043', borderWidth: '0.5px' }}><option value="all">{t.allMarkets}</option>{MARKETS.map(m => <option key={m.id} value={m.id}>{m.icon} {lang === 'en' ? m.nameEn : m.name}</option>)}</select>}
          <PersonMultiSelect selected={filterPerson} onChange={setFilterPerson} teamMembers={teamMembers} t={t} label={t.tasksLabel} />
          <PersonMultiSelect selected={filterSendsPerson} onChange={setFilterSendsPerson} teamMembers={teamMembers} t={t} label={t.sendsLabel} />
        </div>
        <div className="p-2 flex-1 overflow-y-auto"><div className="space-y-0.5">
          {[
            ...(pendingTasks.length > 0 ? [{ key: 'pending', label: t.pending, icon: AlertCircle, color: '#f59e0b', bg: '#fefce8', count: pendingTasks.length, pl: 0 }] : []),
            { key: 'active', label: t.active, icon: Filter, color: '#1a73e8', bg: '#e8f0fe', count: openTasks.length + longtermTasks.length, pl: 0 },
            { key: 'open', label: t.open, icon: Circle, color: '#3b82f6', bg: '#e8f0fe', count: openTasks.length, pl: 2 },
            { key: 'longterm', label: t.longterm, icon: Clock, color: '#7c3aed', bg: '#f5f3ff', count: longtermTasks.length, pl: 2 },
            { key: 'paused', label: t.paused, icon: Pause, color: '#ea580c', bg: '#fff7ed', count: pausedTasks.length, pl: 2 },
            { key: 'monitoring', label: t.monitoring, icon: Eye, color: '#0891b2', bg: '#ecfeff', count: monitoringTasks.length, pl: 2 },
            { key: 'approval', label: t.approval, icon: ClipboardCheck, color: '#0d9488', bg: '#f0fdfa', count: approvalTasks.length, pl: 2 },
            { key: 'ideas', label: t.ideas, icon: Lightbulb, color: '#ca8a04', bg: '#fefce8', count: ideasTasks.length, pl: 2 },
            { key: 'closed', label: t.closed, icon: CheckCircle, color: '#16a34a', bg: '#f0fdf4', count: closedTasks.length, pl: 2 },
          ].map(item => { const I = item.icon; const isActive = (item.key === 'pending' ? activeTab === 'pending' : activeTab === 'tasks' && filterStatus === item.key) && !showUsersPanel && !filterDeadline && !filterLinkedPlanner; return <button key={item.key} onClick={() => { if (item.key === 'pending') { setActiveTab('pending'); } else { setActiveTab('tasks'); setFilterStatus(item.key); } setFilterDeadline(false); setFilterLinkedPlanner(false); setShowUsersPanel(false); setSidebarOpen(false); }} className="w-full flex items-center justify-between px-2.5 py-1 rounded-md text-xs" style={{ background: isActive ? item.bg : 'transparent', color: isActive ? item.color : '#374151', fontWeight: isActive ? 500 : 400 }}><div className={`flex items-center gap-1.5 ${item.pl ? 'pl-1.5' : ''}`}>{item.pl ? <div style={{ width: 5, height: 5, borderRadius: '50%', background: item.color, flexShrink: 0, opacity: isActive ? 1 : 0.5 }} /> : <I size={13} style={{ color: item.color }} />}<span>{item.label}</span></div><span className="text-xs tabular-nums" style={{ color: isActive ? item.color : '#80868b', fontWeight: item.key === 'pending' ? 600 : 400, fontSize: '11px' }}>{item.count}</span></button>; })}
          
          {withDeadlineCount > 0 && <button onClick={() => { setActiveTab('tasks'); setFilterStatus('active'); setFilterDeadline(!filterDeadline); setFilterLinkedPlanner(false); setShowUsersPanel(false); setSidebarOpen(false); }} className="w-full flex items-center justify-between px-2.5 py-1 rounded-md text-xs mt-1" style={{ background: filterDeadline ? '#fef2f2' : 'transparent', color: filterDeadline ? '#ef4444' : '#374151', fontWeight: filterDeadline ? 500 : 400 }}><div className="flex items-center gap-1.5 pl-1.5"><div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', flexShrink: 0, opacity: filterDeadline ? 1 : 0.5 }} /><span>{t.withDeadline}</span></div><span style={{ color: '#ef4444', fontSize: '11px' }}>{withDeadlineCount}</span></button>}
        </div>
        <div className="mt-4 space-y-0.5">
  <a href="/planner" target="_blank" className="w-full flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs" style={{ color: '#3c4043' }}><CalendarClock size={13} style={{ color: '#7c3aed' }} /><span>Planner</span><ExternalLink size={10} style={{ color: '#80868b' }} /></a>
  <a href="/collabs" target="_blank" className="w-full flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs" style={{ color: '#3c4043' }}><UserPlus size={13} style={{ color: '#ec4899' }} /><span>Collabs</span><ExternalLink size={10} style={{ color: '#80868b' }} /></a>
  {isManager && <><a href="/dashboard" target="_blank" className="w-full flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs" style={{ color: '#3c4043' }}><BarChart3 size={13} style={{ color: '#1a73e8' }} /><span>{t.dashboard}</span><ExternalLink size={10} style={{ color: '#80868b' }} /></a><button onClick={() => { setShowUsersPanel(true); setSelectedTask(null); setFilterDeadline(false); setFilterLinkedPlanner(false); setSidebarOpen(false); }} className="w-full flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs" style={{ background: showUsersPanel ? '#e8f0fe' : 'transparent', color: showUsersPanel ? '#1a73e8' : '#374151', fontWeight: showUsersPanel ? 500 : 400 }}><Users size={13} style={{ color: '#1a73e8' }} /><span>{t.users}</span></button></>}
</div>
          <div className="mt-4 mx-2 p-3 rounded-lg text-xs hidden lg:block" style={{ background: '#f1f3f4' }}><p className="mb-1.5" style={{ color: '#5f6368' }}>{t.formEn}</p><button onClick={copyLink} className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200"><code className="flex-1 text-xs truncate" style={{ color: '#1a73e8' }}>/request</code>{copied ? <Check size={14} style={{ color: '#16a34a' }} /> : <Copy size={14} style={{ color: '#5f6368' }} />}</button></div>
          <QuickLinksSection currentUser={currentUser} t={t} />
        </div>
        <div className="px-3 py-2.5" style={{ borderTop: '0.5px solid #dadce0' }}><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: currentMember?.color, fontSize: '9px' }}>{getInitials(currentMember?.name || '')}</div><div className="flex-1 min-w-0"><div className="text-xs font-medium truncate" style={{ color: '#3c4043' }}>{currentMember?.name?.split(' ')[0]}</div>{isManager && <div style={{ fontSize: '10px', color: '#80868b' }}>{t.manager}</div>}</div><button onClick={handleLogout} className="p-1 rounded-full hover:bg-gray-100" style={{ color: '#80868b' }}><LogOut size={15} /></button></div></div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white px-4 lg:px-6 py-2.5 flex items-center justify-between gap-2" style={{ borderBottom: '1px solid #dadce0' }}>
          <div className="flex items-center gap-2 min-w-0"><button onClick={() => setSidebarOpen(true)} className="p-2 rounded-full hover:bg-gray-100 lg:hidden flex-shrink-0" style={{ color: '#80868b' }}><Menu size={20} /></button><div className="min-w-0"><h2 className="text-sm lg:text-base font-medium truncate" style={{ color: '#202124' }}>{showUsersPanel ? t.usersPanel : activeTab === 'pending' ? t.pendingApproval : filterDeadline ? t.withDeadlineTasks : filterStatus === 'active' ? t.activeTasks : filterStatus === 'open' ? t.openTasks : filterStatus === 'longterm' ? t.longtermTasks : filterStatus === 'paused' ? t.pausedTasks : filterStatus === 'monitoring' ? t.monitoringTasks : filterStatus === 'approval' ? t.approvalTasks : filterStatus === 'ideas' ? t.ideasTasks : t.closedTasks}</h2>{filterPerson.length > 0 && !showUsersPanel && <p style={{ fontSize: '11px', color: '#80868b' }}>{t.filter}: {filterPerson.map(fp => teamMembers.find(m => m.id === fp)?.name?.split(' ')[0]).filter(Boolean).join(', ')}</p>}</div></div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <NotificationBell tasks={tasks} currentUser={currentUser} readTimestamps={readTimestamps} teamMembers={teamMembers} onSelectTask={handleSelectTask} onMarkAllRead={async () => { const taskIds = tasks.map(t => t.id); const now = await setAllTasksReadInDb(currentUser, taskIds); const newTs = {}; taskIds.forEach(id => { newTs[id] = now; }); setReadTimestamps(newTs); }} t={t} lang={lang} />
            {!showUsersPanel && <GlobalSearch tasks={tasks} onSelectTask={handleSelectTask} teamMembers={teamMembers} customTags={customTags} t={t} lang={lang} />}
            {!showUsersPanel && activeTab === 'tasks' && <SortDropdown value={sortBy} onChange={setSortBy} t={t} />}
            {!showUsersPanel && activeTab === 'tasks' && <WorkloadButton tasks={tasks} teamMembers={teamMembers} currentUser={currentUser} filterPerson={filterPerson} setFilterPerson={setFilterPerson} lang={lang} />}
            {!showUsersPanel && <><button onClick={loadTasks} className="p-2 rounded-full hover:bg-gray-100" style={{ color: '#5f6368' }}><Loader2 size={18} className={loading ? 'animate-spin' : ''} /></button>{activeTab === 'tasks' && <button onClick={() => setShowNewTask(true)} className="flex items-center gap-1.5 px-4 lg:px-5 py-2 rounded-full font-medium text-sm shadow-sm hover:shadow-md transition-shadow" style={{ background: '#1a73e8', color: 'white' }}><Plus size={16} /> <span className="hidden sm:inline">{t.newTask}</span></button>}</>}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 lg:p-4">
          {showUsersPanel ? null : activeTab === 'pending' && isManager ? <PendingView tasks={pendingTasks} approveTask={approveTask} deleteTask={deleteTask} currentUser={currentUser} t={t} lang={lang} teamMembers={teamMembers} /> : (
            <>{showAccordion && (<>
              <WeeklySendsAccordion
                sends={visibleWeeklySends}
                tasks={tasks}
                isOpen={weekSendsOpen}
                onToggle={() => setWeekSendsOpen(o => !o)}
                onSelectTask={handleSelectTask}
                onStatusChange={(id, s) => updateTask(id, { status: s })}
                onCreateTaskForSend={createTaskForSend}
                currentUser={currentUser}
                readTimestamps={readTimestamps}
                seenTaskIds={seenTaskIds}
                lang={lang}
                t={t}
                teamMembers={teamMembers}
                customTags={customTags}
                selectedTask={selectedTask}
                label={lang === 'en' ? 'Sends this week' : 'Wysyłki ten tydzień'}
                variant="default"
                filterSendsPerson={filterSendsPerson}
              />
              <WeeklySendsAccordion
                sends={visibleNextWeekSends}
                tasks={tasks}
                isOpen={nextWeekSendsOpen}
                onToggle={() => setNextWeekSendsOpen(o => !o)}
                onSelectTask={handleSelectTask}
                onStatusChange={(id, s) => updateTask(id, { status: s })}
                onCreateTaskForSend={createTaskForSend}
                currentUser={currentUser}
                readTimestamps={readTimestamps}
                seenTaskIds={seenTaskIds}
                lang={lang}
                t={t}
                teamMembers={teamMembers}
                customTags={customTags}
                selectedTask={selectedTask}
                label={lang === 'en' ? 'Next week' : 'Następny tydzień'}
                variant="next"
                filterSendsPerson={filterSendsPerson}
              />
              <WeeklySendsAccordion
                sends={visibleWeek3Sends}
                tasks={tasks}
                isOpen={week3SendsOpen}
                onToggle={() => setWeek3SendsOpen(o => !o)}
                onSelectTask={handleSelectTask}
                onStatusChange={(id, s) => updateTask(id, { status: s })}
                onCreateTaskForSend={createTaskForSend}
                currentUser={currentUser}
                readTimestamps={readTimestamps}
                seenTaskIds={seenTaskIds}
                lang={lang}
                t={t}
                teamMembers={teamMembers}
                customTags={customTags}
                selectedTask={selectedTask}
                label={lang === 'en' ? 'In 2 weeks' : 'Za 2 tygodnie'}
                variant="week3"
                filterSendsPerson={filterSendsPerson}
              />
            </>)}
            <div className="max-w-4xl mx-auto">{filteredTasks.length === 0 ? <div className="text-center py-16"><CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#16a34a', opacity: 0.4 }} /><p style={{ color: '#5f6368' }}>{t.noTasksToShow}</p></div> : <div className="space-y-px">{filteredTasks.map(task => <TaskItem key={task.id} task={task} isSelected={selectedTask?.id === task.id} onClick={() => handleSelectTask(task)} onStatusChange={s => updateTask(task.id, { status: s })} currentUser={currentUser} readTimestamps={readTimestamps} seenTaskIds={seenTaskIds} lang={lang} t={t} teamMembers={teamMembers} customTags={customTags} />)}</div>}</div></>
          )}
        </div>
      </main>
      
      {showUsersPanel && <UsersPanel teamMembers={teamMembers} onUpdate={reloadTeamMembers} onClose={() => setShowUsersPanel(false)} t={t} />}
      {selectedTask && !showUsersPanel && <TaskDetail task={selectedTask} updateTask={updateTask} deleteTask={deleteTask} onClose={() => setSelectedTask(null)} currentUser={currentUser} isManager={isManager} onMarkUnread={handleMarkUnread} readTimestamps={readTimestamps} t={t} lang={lang} teamMembers={teamMembers} customTags={customTags} onRefreshTags={loadCustomTags} allSends={allSends} />}
      {showNewTask && <NewTaskModal onClose={() => setShowNewTask(false)} onSave={addTask} currentUser={currentUser} restrictedMarket={restrictedMarket} t={t} lang={lang} teamMembers={teamMembers} />}
    </div>
  );
}
