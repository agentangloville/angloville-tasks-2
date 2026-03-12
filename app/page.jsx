'use client';

import React, { useState, useRef } from 'react';
import { CheckCircle, Send, Bold, Italic, List, Check, X } from 'lucide-react';
import { createTask } from '../../lib/supabase';

const TEAM_MEMBERS = [
  { id: 'edyta', name: 'Edyta Kędzior', color: '#428BCA' },
  { id: 'aleksandra', name: 'Aleksandra Witkowska', color: '#8b5cf6' },
  { id: 'damian_l', name: 'Damian Ładak', color: '#10b981' },
  { id: 'damian_w', name: 'Damian Wójcicki', color: '#f59e0b' },
  { id: 'wojciech', name: 'Wojciech Pisarski', color: '#ef4444' },
  { id: 'klaudia', name: 'Klaudia Gołembiowska', color: '#ec4899' },
];

const MARKETS = [
  { id: 'ns', name: 'Native Speakers', icon: '🇬🇧' },
  { id: 'pl', name: 'Poland', icon: '🇵🇱' },
  { id: 'it', name: 'Italy', icon: '🇮🇹' },
  { id: 'exchange', name: 'Exchange', icon: '🇺🇸' },
];

const getInitials = (name) => {
  const parts = name.split(' ');
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return name[0];
};

export default function RequestPage() {
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    links: '', 
    submittedBy: '', 
    email: '', 
    market: 'ns',
    assignees: [] 
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const editorRef = useRef(null);

  const execCommand = (command) => {
    document.execCommand(command, false, null);
    editorRef.current?.focus();
  };

  const toggleAssignee = (id) => {
    setForm(prev => ({
      ...prev,
      assignees: prev.assignees.includes(id) 
        ? prev.assignees.filter(a => a !== id)
        : [...prev.assignees, id]
    }));
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
        submittedBy: form.submittedBy.trim(),
        submitterEmail: form.email.trim() || null,
        isExternal: true,
        language: 'en',
      };
      
      const result = await createTask(newTask);
      
      if (result) {
        setSubmitted(true);
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
  const selectedMembers = TEAM_MEMBERS.filter(m => form.assignees.includes(m.id));

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F5F5F5' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); * { font-family: 'Inter', sans-serif; box-sizing: border-box; }`}</style>
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: '#ecfdf5' }}>
            <CheckCircle size={40} style={{ color: '#22c55e' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#232323' }}>Request sent!</h2>
          <p className="text-base" style={{ color: '#666' }}>The marketing team will review your request and get back to you soon.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-6 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: '#F5F5F5', color: '#666' }}
          >
            Submit another request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F5F5F5' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); 
        * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        [contenteditable]:empty:before { content: attr(data-placeholder); color: #999; }
        [contenteditable]:focus { outline: none; }
        [contenteditable] ul { list-style-type: disc; padding-left: 1.5rem; }
        [contenteditable] ol { list-style-type: decimal; padding-left: 1.5rem; }
      `}</style>
      
      {/* Header */}
      <header className="bg-white border-b px-6 py-4" style={{ borderColor: '#e5e5e5' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="Angloville" className="h-7" style={{ filter: 'brightness(0)' }} />
            <span className="text-sm font-medium" style={{ color: '#666' }}>Marketing Request</span>
          </div>
        </div>
      </header>

      {/* Main compose area */}
      <main className="max-w-2xl mx-auto py-6 px-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg overflow-hidden">
          
          {error && (
            <div className="px-5 py-3 text-sm" style={{ background: '#fef2f2', color: '#dc2626', borderBottom: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          {/* To field - multi-select */}
          <div className="px-5 py-3 border-b" style={{ borderColor: '#f0f0f0' }}>
            <div className="flex items-center gap-3">
              <span className="text-sm w-12" style={{ color: '#666' }}>To</span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-1.5 px-2 py-1 rounded-full text-sm" style={{ background: '#e8f4fc', color: '#428BCA' }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: m.color }}>
                        {getInitials(m.name)}
                      </div>
                      <span>{m.name.split(' ')[0]}</span>
                      <button type="button" onClick={() => toggleAssignee(m.id)} className="hover:text-red-500">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                      className="px-3 py-1 rounded-full text-sm border border-dashed hover:bg-gray-50"
                      style={{ borderColor: '#ccc', color: '#666' }}
                    >
                      {selectedMembers.length === 0 ? 'Select team members...' : '+ Add'}
                    </button>
                    {showAssigneeDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border z-10 py-1 min-w-[220px]" style={{ borderColor: '#eee' }}>
                        {TEAM_MEMBERS.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleAssignee(m.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                          >
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: m.color }}>
                              {getInitials(m.name)}
                            </div>
                            <span className="flex-1 text-sm" style={{ color: '#333' }}>{m.name}</span>
                            {form.assignees.includes(m.id) && <Check size={16} style={{ color: '#428BCA' }} />}
                          </button>
                        ))}
                        <div className="border-t mt-1 pt-1" style={{ borderColor: '#eee' }}>
                          <button
                            type="button"
                            onClick={() => setShowAssigneeDropdown(false)}
                            className="w-full px-3 py-2 text-sm text-center hover:bg-gray-50"
                            style={{ color: '#666' }}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {selectedMembers.length === 0 && (
                  <p className="text-xs mt-1" style={{ color: '#999' }}>Leave empty to send to entire team</p>
                )}
              </div>
            </div>
          </div>

          {/* From field - only name required */}
          <div className="px-5 py-3 flex items-center gap-3 border-b" style={{ borderColor: '#f0f0f0' }}>
            <span className="text-sm w-12" style={{ color: '#666' }}>From</span>
            <input 
              type="text" 
              value={form.submittedBy} 
              onChange={(e) => setForm({ ...form, submittedBy: e.target.value })} 
              className="flex-1 text-sm bg-transparent border-0 focus:outline-none"
              style={{ color: '#333' }}
              placeholder="Your name *"
              required 
            />
            <input 
              type="email" 
              value={form.email} 
              onChange={(e) => setForm({ ...form, email: e.target.value })} 
              className="w-48 text-sm bg-transparent border-0 focus:outline-none text-right"
              style={{ color: '#666' }}
              placeholder="email (optional)"
            />
          </div>

          {/* Subject field */}
          <div className="px-5 py-3 flex items-center gap-3 border-b" style={{ borderColor: '#f0f0f0' }}>
            <span className="text-sm w-12" style={{ color: '#666' }}>Subject</span>
            <input 
              type="text" 
              value={form.title} 
              onChange={(e) => setForm({ ...form, title: e.target.value })} 
              className="flex-1 text-sm bg-transparent border-0 focus:outline-none font-medium"
              style={{ color: '#333' }}
              placeholder="What do you need?"
              required 
            />
            <div className="flex items-center gap-1 px-2 py-1 rounded-md" style={{ background: '#f5f5f5' }}>
              <span>{selectedMarket?.icon}</span>
              <select 
                value={form.market} 
                onChange={(e) => setForm({ ...form, market: e.target.value })} 
                className="text-xs bg-transparent border-0 focus:outline-none cursor-pointer pr-1"
                style={{ color: '#666' }}
              >
                {MARKETS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          {/* Message body */}
          <div 
            ref={editorRef}
            contentEditable
            className="px-5 py-4 min-h-[200px] text-sm leading-relaxed"
            style={{ color: '#333' }}
            data-placeholder="Describe your request...

• What do you need?
• What's the goal?
• Any deadline?"
            suppressContentEditableWarning
          />

          {/* Links section - always visible */}
          <div className="px-5 pb-4">
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#999' }}>Links (Google Drive, Docs, etc.)</label>
            <textarea 
              value={form.links} 
              onChange={(e) => setForm({ ...form, links: e.target.value })} 
              className="w-full px-3 py-2 rounded-lg text-sm font-mono resize-none focus:outline-none"
              style={{ background: '#f9f9f9', border: '1px solid #e5e5e5', color: '#666' }}
              rows={2}
              placeholder="Paste links here..."
            />
          </div>

          {/* Toolbar */}
          <div className="px-4 py-3 flex items-center justify-between border-t" style={{ borderColor: '#f0f0f0', background: '#fafafa' }}>
            <div className="flex items-center gap-1">
              <button 
                type="submit" 
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm disabled:opacity-50"
                style={{ background: '#428BCA', color: 'white' }}
              >
                <Send size={16} />
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>
            
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => execCommand('bold')} className="p-2 rounded-full hover:bg-gray-200" title="Bold">
                <Bold size={18} style={{ color: '#666' }} />
              </button>
              <button type="button" onClick={() => execCommand('italic')} className="p-2 rounded-full hover:bg-gray-200" title="Italic">
                <Italic size={18} style={{ color: '#666' }} />
              </button>
              <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-2 rounded-full hover:bg-gray-200" title="Bullet list">
                <List size={18} style={{ color: '#666' }} />
              </button>
            </div>
          </div>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: '#999' }}>
          Need help? Contact <a href="mailto:e.kedzior@angloville.pl" style={{ color: '#428BCA' }}>e.kedzior@angloville.pl</a>
        </p>
      </main>
    </div>
  );
}
