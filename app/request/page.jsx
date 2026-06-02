'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, Send, Bold, Italic, Underline, List, ListOrdered, Link2, Undo, Redo, X, Check, Copy, ExternalLink, Paperclip, File, FileText, Image, FileSpreadsheet, Loader2, Flag } from 'lucide-react';
import { createTask, uploadFile, getTeamMembers } from '../../lib/supabase';

const MARKETS = [
  { id: 'pl', name: 'Poland', icon: '🇵🇱' },
  { id: 'ns', name: 'Native Speakers', icon: '🇬🇧' },
  { id: 'it', name: 'Italy', icon: '🇮🇹' },
  { id: 'exchange', name: 'Exchange', icon: '🎓' },
  { id: 'tefl', name: 'TEFL in Asia', icon: '🌏' },
  { id: 'brazil', name: 'Brazil', icon: '🇧🇷' },
];

const PRIORITIES = [
  { id: null, name: 'None', color: '#9aa0a6', bg: '#f1f3f4' },
  { id: 'low', name: 'Low', color: '#34a853', bg: '#e6f4ea' },
  { id: 'medium', name: 'Medium', color: '#fbbc04', bg: '#fef7e0' },
  { id: 'high', name: 'High', color: '#ea4335', bg: '#fce8e6' },
  { id: 'urgent', name: 'Urgent', color: '#d93025', bg: '#fce8e6' },
];

// Nazwy wyświetlane na chipach "To": inicjał + nazwisko (bez zgadywania imion).
// Klucz musi być dokładnie taki jak id członka zespołu w tabeli team_members.
// Tu trzymamy tylko poprawną pisownię nazwiska (np. polskie znaki).
const FULL_NAMES = {
  'e.kedzior': 'E. Kędzior',
  'd.wojcicki': 'D. Wójcicki',
  'c.bonaccorsi': 'C. Bonaccorsi',
  'k.golembiowska': 'K. Gołębiowska',
  'v.aguiar': 'V. Aguiar',
};

// Fallback: jeśli kogoś nie ma w mapie, a id ma format "x.nazwisko",
// zbuduj "X. Nazwisko" automatycznie; w ostateczności pokaż m.name lub id.
const formatFromId = (id) => {
  if (!id || !id.includes('.')) return null;
  const [first, ...rest] = id.split('.');
  const last = rest.join('.');
  if (!first || !last) return null;
  return first.charAt(0).toUpperCase() + '. ' + last.charAt(0).toUpperCase() + last.slice(1);
};

const getDisplayName = (m) => FULL_NAMES[m.id] || formatFromId(m.id) || m.name || m.id;

const getInitials = (name) => {
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return name[0];
};

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

async function sendEmailNotification(to, assigneeName, taskTitle, assignedBy) {
  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, assigneeName, taskTitle, assignedBy }),
    });
  } catch (e) {
    console.log('Email skipped:', e);
  }
}

export default function RequestPage() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    links: '',
    submittedBy: '',
    email: '',
    market: 'ns',
    assignees: [],
    attachments: [],
    priority: null
  });
  const [submitted, setSubmitted] = useState(false);
  const [publicToken, setPublicToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getTeamMembers()
      .then(members => {
        setTeamMembers((members || []).filter(m => m.isActive !== false));
      })
      .catch(err => {
        console.error('Failed to load team members:', err);
        setTeamMembers([]);
      })
      .finally(() => setTeamLoading(false));
  }, []);

  const execCommand = (command, val = null) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) execCommand('createLink', url);
  };

  const toggleAssignee = (id) => {
    setForm(prev => ({
      ...prev,
      assignees: prev.assignees.includes(id)
        ? prev.assignees.filter(a => a !== id)
        : [...prev.assignees, id]
    }));
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    for (const file of files) {
      const result = await uploadFile(file, 'requests');
      if (result) {
        result.uploadedBy = 'external';
        setForm(prev => ({ ...prev, attachments: [...prev.attachments, result] }));
      }
    }
    setUploading(false);
    e.target.value = '';
  };

  const removeAttachment = (id) => {
    setForm(prev => ({ ...prev, attachments: prev.attachments.filter(a => a.id !== id) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.submittedBy.trim()) return;

    const description = editorRef.current?.innerHTML || '';
    if (!description.replace(/<[^>]*>/g, '').trim()) {
      setError('Please describe your request');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newTask = {
        title: form.title.trim(),
        description: description,
        links: form.links.trim(),
        market: form.market,
        status: 'pending',
        assignees: form.assignees,
        comments: [],
        subtasks: [],
        attachments: form.attachments,
        priority: form.priority,
        submittedBy: form.submittedBy.trim(),
        submitterEmail: form.email.trim(),
        isExternal: true,
        language: 'en',
      };

      const result = await createTask(newTask);

      if (result) {
        const token = result.publicToken || result.public_token || '';
        setPublicToken(token);
        setSubmitted(true);

        if (form.email.trim() && token) {
          try {
            await fetch('/api/confirm-submission', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: form.email.trim(),
                name: form.submittedBy.trim(),
                taskTitle: form.title.trim(),
                publicToken: token,
              }),
            });
          } catch (emailErr) {
            console.log('Confirmation email skipped:', emailErr);
          }
        }

        const submitterName = form.submittedBy.trim();
        for (const aId of form.assignees) {
          const m = teamMembers.find(x => x.id === aId);
          if (m && m.email) {
            await sendEmailNotification(m.email, getDisplayName(m), form.title.trim(), submitterName);
          }
        }
      } else {
        setError('Failed to submit. Please try again.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to submit. Please try again.');
    }

    setLoading(false);
  };

  const selectedMarket = MARKETS.find(m => m.id === form.market);
  const trackingUrl = typeof window !== 'undefined' && publicToken
    ? `${window.location.origin}/task/${publicToken}`
    : '';

  const copyTrackingLink = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f8f9fa' }}>
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center" style={{ boxShadow: '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#e6f4ea' }}>
            <CheckCircle size={32} style={{ color: '#34a853' }} />
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#202124' }}>Request Submitted!</h2>
          <p className="text-sm mb-5" style={{ color: '#5f6368' }}>
            The marketing team will review your request and get back to you soon.
          </p>

          {publicToken && (
            <div className="mb-6 p-4 rounded-lg text-left" style={{ background: '#e8f0fe', border: '1px solid #c2d7f7' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <ExternalLink size={14} style={{ color: '#1a73e8' }} />
                <p className="text-sm font-medium" style={{ color: '#1a73e8' }}>Track Your Request</p>
              </div>
              <p className="text-xs mb-2" style={{ color: '#5f6368' }}>
                Bookmark this link to check status and reply:
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={trackingUrl}
                  className="flex-1 px-2.5 py-1.5 rounded-md text-xs font-mono"
                  style={{ background: 'white', border: '1px solid #dadce0', color: '#202124' }}
                />
                <button
                  onClick={copyTrackingLink}
                  className="px-3 py-1.5 rounded-md font-medium text-xs flex items-center gap-1 transition-colors"
                  style={{ background: '#1a73e8', color: 'white' }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              {form.email && (
                <p className="text-xs mt-2" style={{ color: '#5f6368' }}>
                  📧 Sent to <strong>{form.email}</strong>
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-center">
            <a
              href={trackingUrl || '#'}
              className="px-4 py-2 rounded-full text-xs font-medium transition-colors hover:shadow-md"
              style={{ background: '#1a73e8', color: 'white' }}
            >
              View Status
            </a>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-full text-xs font-medium transition-colors hover:bg-gray-200"
              style={{ background: '#f1f3f4', color: '#202124' }}
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8f9fa' }}>
      <header className="bg-white border-b px-6 py-2.5" style={{ borderColor: '#e8eaed' }}>
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="Angloville" className="h-6" />
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ background: '#e8f0fe', color: '#1a73e8' }}>Marketing Request</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-5 px-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg overflow-hidden" style={{ boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)' }}>

          {error && (
            <div className="px-4 py-2.5 text-xs flex items-center gap-2" style={{ background: '#fce8e6', color: '#c5221f', borderBottom: '1px solid #f5c6cb' }}>
              <X size={14} />
              {error}
            </div>
          )}

          {/* Assignees */}
          <div className="px-4 py-3 border-b" style={{ borderColor: '#e8eaed' }}>
            <label className="text-xs font-medium block mb-2" style={{ color: '#5f6368' }}>To</label>
            {teamLoading ? (
              <div className="flex items-center gap-2 text-xs" style={{ color: '#9aa0a6' }}>
                <Loader2 size={12} className="animate-spin" />
                Loading team...
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {teamMembers.map(m => {
                  const selected = form.assignees.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleAssignee(m.id)}
                      className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border text-xs transition-all"
                      style={{
                        borderColor: selected ? '#1a73e8' : '#dadce0',
                        background: selected ? '#e8f0fe' : 'white',
                        color: selected ? '#1a73e8' : '#202124'
                      }}
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-medium"
                        style={{ background: m.color }}
                      >
                        {getInitials(getDisplayName(m))}
                      </div>
                      <span>{getDisplayName(m)}</span>
                      {selected && <Check size={12} />}
                    </button>
                  );
                })}
              </div>
            )}
            {!teamLoading && form.assignees.length === 0 && (
              <p className="text-[11px] mt-1.5" style={{ color: '#9aa0a6' }}>No selection = entire Marketing Team</p>
            )}
          </div>

          {/* From + Email */}
          <div className="px-4 py-3 grid grid-cols-2 gap-3 border-b" style={{ borderColor: '#e8eaed' }}>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#5f6368' }}>From *</label>
              <input
                type="text"
                value={form.submittedBy}
                onChange={(e) => setForm({ ...form, submittedBy: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                style={{ borderColor: '#dadce0', color: '#202124' }}
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#5f6368' }}>
                Email <span className="font-normal" style={{ color: '#9aa0a6' }}>(tracking link)</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                style={{ borderColor: '#dadce0', color: '#202124' }}
                placeholder="your@email.com"
              />
            </div>
          </div>

          {/* Subject + Market */}
          <div className="px-4 py-3 flex items-end gap-3 border-b" style={{ borderColor: '#e8eaed' }}>
            <div className="flex-1">
              <label className="text-xs font-medium block mb-1" style={{ color: '#5f6368' }}>Subject *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm font-medium"
                style={{ borderColor: '#dadce0', color: '#202124' }}
                placeholder="What do you need?"
                required
              />
            </div>
            <div className="w-56">
              <label className="text-xs font-medium block mb-1" style={{ color: '#5f6368' }}>Market</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-base pointer-events-none">{selectedMarket?.icon}</span>
                <select
                  value={form.market}
                  onChange={(e) => setForm({ ...form, market: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border rounded-md text-sm cursor-pointer"
                  style={{ borderColor: '#dadce0', color: '#202124' }}
                >
                  {MARKETS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Priority */}
          <div className="px-4 py-3 border-b" style={{ borderColor: '#e8eaed' }}>
            <label className="text-xs font-medium block mb-2" style={{ color: '#5f6368' }}>Priority</label>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITIES.map(p => {
                const selected = form.priority === p.id;
                return (
                  <button
                    key={p.id || 'none'}
                    type="button"
                    onClick={() => setForm({ ...form, priority: p.id })}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: selected ? p.bg : '#f1f3f4',
                      color: selected ? p.color : '#5f6368',
                      border: selected ? `1.5px solid ${p.color}` : '1.5px solid transparent'
                    }}
                  >
                    {p.id && <Flag size={11} />}
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor toolbar */}
          <div className="px-2 py-1 flex items-center gap-0.5 flex-wrap border-b" style={{ background: '#f8f9fa', borderColor: '#e8eaed' }}>
            <button type="button" onClick={() => execCommand('undo')} className="p-1.5 rounded hover:bg-gray-200" title="Undo"><Undo size={14} style={{ color: '#444746' }} /></button>
            <button type="button" onClick={() => execCommand('redo')} className="p-1.5 rounded hover:bg-gray-200" title="Redo"><Redo size={14} style={{ color: '#444746' }} /></button>
            <div className="w-px h-4 mx-1" style={{ background: '#dadce0' }} />
            <button type="button" onClick={() => execCommand('bold')} className="p-1.5 rounded hover:bg-gray-200" title="Bold"><Bold size={14} style={{ color: '#444746' }} /></button>
            <button type="button" onClick={() => execCommand('italic')} className="p-1.5 rounded hover:bg-gray-200" title="Italic"><Italic size={14} style={{ color: '#444746' }} /></button>
            <button type="button" onClick={() => execCommand('underline')} className="p-1.5 rounded hover:bg-gray-200" title="Underline"><Underline size={14} style={{ color: '#444746' }} /></button>
            <div className="w-px h-4 mx-1" style={{ background: '#dadce0' }} />
            <button type="button" onClick={insertLink} className="p-1.5 rounded hover:bg-gray-200" title="Insert link"><Link2 size={14} style={{ color: '#444746' }} /></button>
            <div className="w-px h-4 mx-1" style={{ background: '#dadce0' }} />
            <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-1.5 rounded hover:bg-gray-200" title="Bullet list"><List size={14} style={{ color: '#444746' }} /></button>
            <button type="button" onClick={() => execCommand('insertOrderedList')} className="p-1.5 rounded hover:bg-gray-200" title="Numbered list"><ListOrdered size={14} style={{ color: '#444746' }} /></button>
            <button type="button" onClick={() => execCommand('removeFormat')} className="p-1.5 rounded hover:bg-gray-200 ml-auto" title="Clear formatting"><X size={14} style={{ color: '#9aa0a6' }} /></button>
          </div>

          {/* Editor body */}
          <div
            ref={editorRef}
            contentEditable
            className="px-4 py-3 text-sm overflow-y-auto border-b"
            style={{ color: '#202124', minHeight: '160px', maxHeight: '320px', lineHeight: '1.55', borderColor: '#e8eaed' }}
            data-placeholder="Describe your request..."
            suppressContentEditableWarning
          />

          {/* Attachments */}
          <div className="px-4 py-3 border-b" style={{ borderColor: '#e8eaed' }}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: '#5f6368' }}>
                Attachments
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors hover:bg-gray-100 disabled:opacity-50"
                style={{ color: '#1a73e8' }}
              >
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />}
                {uploading ? 'Uploading...' : 'Add files'}
              </button>
            </div>

            {form.attachments.length > 0 ? (
              <div className="space-y-1.5">
                {form.attachments.map(att => {
                  const FileIcon = getFileIcon(att.type);
                  const isImage = att.type?.startsWith('image/');
                  return (
                    <div key={att.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md group" style={{ background: '#f1f3f4' }}>
                      {isImage ? (
                        <img src={att.url} alt={att.name} className="w-7 h-7 rounded object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: '#e8eaed' }}>
                          <FileIcon size={14} style={{ color: '#5f6368' }} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: '#202124' }}>{att.name}</p>
                        <p className="text-[10px]" style={{ color: '#9aa0a6' }}>{formatFileSize(att.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="p-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: '#ea4335' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs" style={{ color: '#9aa0a6' }}>No files attached.</p>
            )}
          </div>

          {/* Links */}
          <div className="px-4 py-3 border-b" style={{ borderColor: '#e8eaed' }}>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#5f6368' }}>
              Links <span className="font-normal" style={{ color: '#9aa0a6' }}>(Drive, Docs, references)</span>
            </label>
            <textarea
              value={form.links}
              onChange={(e) => setForm({ ...form, links: e.target.value })}
              className="w-full px-3 py-2 rounded-md text-xs font-mono resize-none"
              style={{ background: '#f8f9fa', border: '1px solid #dadce0', color: '#202124' }}
              rows={2}
              placeholder="Paste links here, one per line..."
            />
          </div>

          {/* Footer */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#f8f9fa' }}>
            <p className="text-[11px]" style={{ color: '#9aa0a6' }}>
              Fields marked with * are required
            </p>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full font-medium text-sm disabled:opacity-50 transition-all hover:shadow-md"
              style={{ background: '#1a73e8', color: 'white' }}
            >
              <Send size={14} />
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>

        <p className="text-center mt-4 text-xs" style={{ color: '#9aa0a6' }}>
          Need help? Contact <a href="mailto:e.kedzior@angloville.pl" className="hover:underline" style={{ color: '#1a73e8' }}>e.kedzior@angloville.pl</a>
        </p>
      </main>
    </div>
  );
}
