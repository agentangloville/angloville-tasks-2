'use client';

import React, { useState, useRef } from 'react';
import { CheckCircle, Send, Bold, Italic, Underline, List, ListOrdered, Link2, Undo, Redo, X, Check, Copy, ExternalLink, Paperclip, File, FileText, Image, FileSpreadsheet, Loader2, Flag } from 'lucide-react';
import { createTask, uploadFile } from '../../lib/supabase';

const TEAM_MEMBERS = [
  { id: 'edyta', name: 'Edyta Kędzior', color: '#4285f4' },
  { id: 'aleksandra', name: 'Aleksandra Witkowska', color: '#a142f4' },
  { id: 'damian_l', name: 'Damian Ładak', color: '#34a853' },
  { id: 'damian_w', name: 'Damian Wójcicki', color: '#fbbc04' },
  { id: 'wojciech', name: 'Wojciech Pisarski', color: '#ea4335' },
  { id: 'klaudia', name: 'Klaudia Gołembiowska', color: '#e91e63' },
  { id: 'rohan', name: 'Raj Patel', color: '#00acc1' },
];

const MARKETS = [
  { id: 'ns', name: 'Native Speakers', icon: '🇬🇧' },
  { id: 'pl', name: 'Poland', icon: '🇵🇱' },
  { id: 'it', name: 'Italy', icon: '🇮🇹' },
  { id: 'exchange', name: 'Exchange', icon: '🇺🇸' },
];

const PRIORITIES = [
  { id: null, name: 'None', color: '#9aa0a6', bg: '#f1f3f4' },
  { id: 'low', name: 'Low', color: '#34a853', bg: '#e6f4ea' },
  { id: 'medium', name: 'Medium', color: '#fbbc04', bg: '#fef7e0' },
  { id: 'high', name: 'High', color: '#ea4335', bg: '#fce8e6' },
  { id: 'urgent', name: 'Urgent', color: '#d93025', bg: '#fce8e6' },
];

const getInitials = (name) => {
  const parts = name.split(' ');
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

export default function RequestPage() {
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
        setPublicToken(result.publicToken || result.public_token || '');
        setSubmitted(true);
        
        if (form.email.trim() && result.public_token) {
          try {
            await fetch('/api/confirm-submission', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: form.email.trim(),
                name: form.submittedBy.trim(),
                taskTitle: form.title.trim(),
                publicToken: result.public_token,
              }),
            });
          } catch (emailErr) {
            console.log('Confirmation email skipped:', emailErr);
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
  const selectedPriority = PRIORITIES.find(p => p.id === form.priority);
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
        <div className="bg-white rounded-2xl p-10 max-w-lg w-full text-center" style={{ boxShadow: '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: '#e6f4ea' }}>
            <CheckCircle size={44} style={{ color: '#34a853' }} />
          </div>
          <h2 className="text-2xl font-semibold mb-3" style={{ color: '#202124' }}>Request Submitted!</h2>
          <p className="text-base mb-6" style={{ color: '#5f6368' }}>
            The marketing team will review your request and get back to you soon.
          </p>
          
          {publicToken && (
            <div className="mb-8 p-5 rounded-xl text-left" style={{ background: '#e8f0fe', border: '1px solid #c2d7f7' }}>
              <div className="flex items-center gap-2 mb-3">
                <ExternalLink size={18} style={{ color: '#1a73e8' }} />
                <p className="font-medium" style={{ color: '#1a73e8' }}>Track Your Request</p>
              </div>
              <p className="text-sm mb-3" style={{ color: '#5f6368' }}>
                Bookmark this link to check status and reply to the team:
              </p>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={trackingUrl}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
                  style={{ background: 'white', border: '1px solid #dadce0', color: '#202124' }}
                />
                <button 
                  onClick={copyTrackingLink}
                  className="px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                  style={{ background: '#1a73e8', color: 'white' }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              {form.email && (
                <p className="text-xs mt-3" style={{ color: '#5f6368' }}>
                  📧 We also sent this link to <strong>{form.email}</strong>
                </p>
              )}
            </div>
          )}
          
          <div className="flex gap-3 justify-center">
            <a 
              href={trackingUrl || '#'}
              className="px-6 py-3 rounded-full text-sm font-medium transition-colors hover:shadow-md"
              style={{ background: '#1a73e8', color: 'white' }}
            >
              View Request Status
            </a>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 rounded-full text-sm font-medium transition-colors hover:bg-gray-200"
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
      <header className="bg-white border-b px-8 py-4" style={{ borderColor: '#e8eaed' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="Angloville" className="h-8" />
            <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ background: '#e8f0fe', color: '#1a73e8' }}>Marketing Request</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)' }}>
          
          {error && (
            <div className="px-6 py-4 text-sm flex items-center gap-2" style={{ background: '#fce8e6', color: '#c5221f', borderBottom: '1px solid #f5c6cb' }}>
              <X size={16} />
              {error}
            </div>
          )}

          <div className="border-b" style={{ borderColor: '#e8eaed' }}>
            <div className="px-6 py-5 border-b" style={{ borderColor: '#e8eaed' }}>
              <label className="text-sm font-medium block mb-3" style={{ color: '#202124' }}>To (select team members)</label>
              <div className="flex flex-wrap gap-2">
                {TEAM_MEMBERS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleAssignee(m.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition-all hover:shadow-sm"
                    style={{ 
                      borderColor: form.assignees.includes(m.id) ? '#1a73e8' : '#dadce0',
                      background: form.assignees.includes(m.id) ? '#e8f0fe' : 'white',
                      color: form.assignees.includes(m.id) ? '#1a73e8' : '#202124'
                    }}
                  >
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                      style={{ background: m.color }}
                    >
                      {getInitials(m.name)}
                    </div>
                    <span>{m.name}</span>
                    {form.assignees.includes(m.id) && <Check size={14} />}
                  </button>
                ))}
              </div>
              {form.assignees.length === 0 && (
                <p className="text-xs mt-2" style={{ color: '#9aa0a6' }}>No selection = entire Marketing Team</p>
              )}
            </div>

            <div className="px-6 py-4 grid grid-cols-2 gap-6 border-b" style={{ borderColor: '#e8eaed' }}>
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: '#202124' }}>From *</label>
                <input 
                  type="text" 
                  value={form.submittedBy} 
                  onChange={(e) => setForm({ ...form, submittedBy: e.target.value })} 
                  className="w-full px-4 py-3 border rounded-lg text-sm transition-all"
                  style={{ borderColor: '#dadce0', color: '#202124' }}
                  placeholder="Your name"
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: '#202124' }}>
                  Email <span className="font-normal" style={{ color: '#5f6368' }}>(for tracking link)</span>
                </label>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })} 
                  className="w-full px-4 py-3 border rounded-lg text-sm transition-all"
                  style={{ borderColor: '#dadce0', color: '#202124' }}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="px-6 py-4 flex items-end gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium block mb-2" style={{ color: '#202124' }}>Subject *</label>
                <input 
                  type="text" 
                  value={form.title} 
                  onChange={(e) => setForm({ ...form, title: e.target.value })} 
                  className="w-full px-4 py-3 border rounded-lg text-sm font-medium transition-all"
                  style={{ borderColor: '#dadce0', color: '#202124' }}
                  placeholder="What do you need?"
                  required 
                />
              </div>
              <div className="w-48">
                <label className="text-sm font-medium block mb-2" style={{ color: '#202124' }}>Market</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">{selectedMarket?.icon}</span>
                  <select 
                    value={form.market} 
                    onChange={(e) => setForm({ ...form, market: e.target.value })} 
                    className="w-full pl-10 pr-4 py-3 border rounded-lg text-sm appearance-none cursor-pointer transition-all"
                    style={{ borderColor: '#dadce0', color: '#202124' }}
                  >
                    {MARKETS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Priority selector */}
            <div className="px-6 py-4 border-t" style={{ borderColor: '#e8eaed' }}>
              <label className="text-sm font-medium block mb-3" style={{ color: '#202124' }}>Priority</label>
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map(p => (
                  <button
                    key={p.id || 'none'}
                    type="button"
                    onClick={() => setForm({ ...form, priority: p.id })}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all"
                    style={{ 
                      background: form.priority === p.id ? p.bg : '#f1f3f4', 
                      color: form.priority === p.id ? p.color : '#5f6368',
                      border: form.priority === p.id ? `2px solid ${p.color}` : '2px solid transparent'
                    }}
                  >
                    {p.id && <Flag size={14} />}
                    {p.name}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: '#9aa0a6' }}>
                Select priority only if this is urgent. Default is none.
              </p>
            </div>
          </div>

          <div className="border-b" style={{ borderColor: '#e8eaed' }}>
            <div className="px-3 py-2 flex items-center gap-0.5 flex-wrap border-b" style={{ background: '#f1f3f4', borderColor: '#e8eaed' }}>
              <button type="button" onClick={() => execCommand('undo')} className="p-2 rounded hover:bg-gray-200" title="Undo"><Undo size={18} style={{ color: '#444746' }} /></button>
              <button type="button" onClick={() => execCommand('redo')} className="p-2 rounded hover:bg-gray-200" title="Redo"><Redo size={18} style={{ color: '#444746' }} /></button>
              
              <div className="w-px h-6 mx-2" style={{ background: '#dadce0' }} />
              
              <button type="button" onClick={() => execCommand('bold')} className="p-2 rounded hover:bg-gray-200" title="Bold"><Bold size={18} style={{ color: '#444746' }} /></button>
              <button type="button" onClick={() => execCommand('italic')} className="p-2 rounded hover:bg-gray-200" title="Italic"><Italic size={18} style={{ color: '#444746' }} /></button>
              <button type="button" onClick={() => execCommand('underline')} className="p-2 rounded hover:bg-gray-200" title="Underline"><Underline size={18} style={{ color: '#444746' }} /></button>
              
              <div className="w-px h-6 mx-2" style={{ background: '#dadce0' }} />
              
              <button type="button" onClick={insertLink} className="p-2 rounded hover:bg-gray-200" title="Insert link"><Link2 size={18} style={{ color: '#444746' }} /></button>
              
              <div className="w-px h-6 mx-2" style={{ background: '#dadce0' }} />
              
              <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-2 rounded hover:bg-gray-200" title="Bullet list"><List size={18} style={{ color: '#444746' }} /></button>
              <button type="button" onClick={() => execCommand('insertOrderedList')} className="p-2 rounded hover:bg-gray-200" title="Numbered list"><ListOrdered size={18} style={{ color: '#444746' }} /></button>
              
              <button type="button" onClick={() => execCommand('removeFormat')} className="p-2 rounded hover:bg-gray-200 ml-auto" title="Clear formatting"><X size={18} style={{ color: '#9aa0a6' }} /></button>
            </div>

            <div 
              ref={editorRef}
              contentEditable
              className="px-6 py-6 text-base overflow-y-auto"
              style={{ color: '#202124', minHeight: '250px', maxHeight: '400px', lineHeight: '1.6' }}
              data-placeholder="Describe your request...

- What do you need?
- What's the goal?
- Any deadline or priority?"
              suppressContentEditableWarning
            />
          </div>

          {/* Attachments section */}
          <div className="px-6 py-5 border-b" style={{ borderColor: '#e8eaed' }}>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium" style={{ color: '#202124' }}>
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
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100 disabled:opacity-50"
                style={{ color: '#1a73e8' }}
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                {uploading ? 'Uploading...' : 'Add files'}
              </button>
            </div>
            
            {form.attachments.length > 0 ? (
              <div className="space-y-2">
                {form.attachments.map(att => {
                  const FileIcon = getFileIcon(att.type);
                  const isImage = att.type?.startsWith('image/');
                  return (
                    <div key={att.id} className="flex items-center gap-3 px-3 py-2 rounded-lg group" style={{ background: '#f1f3f4' }}>
                      {isImage ? (
                        <img src={att.url} alt={att.name} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: '#e8eaed' }}>
                          <FileIcon size={20} style={{ color: '#5f6368' }} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#202124' }}>{att.name}</p>
                        <p className="text-xs" style={{ color: '#9aa0a6' }}>{formatFileSize(att.size)}</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeAttachment(att.id)} 
                        className="p-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: '#ea4335' }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm" style={{ color: '#9aa0a6' }}>No files attached. Click "Add files" to upload.</p>
            )}
          </div>

          <div className="px-6 py-5 border-b" style={{ borderColor: '#e8eaed' }}>
            <label className="text-sm font-medium block mb-2" style={{ color: '#202124' }}>
              Links (Google Drive, Docs, references)
            </label>
            <textarea 
              value={form.links} 
              onChange={(e) => setForm({ ...form, links: e.target.value })} 
              className="w-full px-4 py-3 rounded-lg text-sm font-mono resize-none transition-all"
              style={{ background: '#f8f9fa', border: '1px solid #dadce0', color: '#202124' }}
              rows={3}
              placeholder="Paste links here, one per line..."
            />
          </div>

          <div className="px-6 py-5 flex items-center justify-between" style={{ background: '#f8f9fa' }}>
            <p className="text-sm" style={{ color: '#9aa0a6' }}>
              Fields marked with * are required
            </p>
            <button 
              type="submit" 
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 rounded-full font-medium text-base disabled:opacity-50 transition-all hover:shadow-lg"
              style={{ background: '#1a73e8', color: 'white' }}
            >
              <Send size={18} />
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>

        <p className="text-center mt-8 text-sm" style={{ color: '#9aa0a6' }}>
          Need help? Contact <a href="mailto:e.kedzior@angloville.pl" className="hover:underline" style={{ color: '#1a73e8' }}>e.kedzior@angloville.pl</a>
        </p>
      </main>
    </div>
  );
}
