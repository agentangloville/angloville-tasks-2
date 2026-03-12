'use client';

import React, { useState, useRef } from 'react';
import { CheckCircle, Send, Bold, Italic, List, Link2, ChevronDown } from 'lucide-react';
import { createTask } from '../../lib/supabase';

const TEAM_MEMBERS = [
  { id: 'edyta', name: 'Edyta Kędzior', role: 'Manager', color: '#428BCA' },
  { id: 'aleksandra', name: 'Aleksandra Witkowska', role: 'Analytics', color: '#8b5cf6' },
  { id: 'damian_l', name: 'Damian Ładak', role: 'Tech', color: '#10b981' },
  { id: 'damian_w', name: 'Damian Wójcicki', role: 'Content', color: '#f59e0b' },
  { id: 'wojciech', name: 'Wojciech Pisarski', role: 'Ads', color: '#ef4444' },
  { id: 'klaudia', name: 'Klaudia Gołembiowska', role: 'Influencers', color: '#ec4899' },
];

const MARKETS = [
  { id: 'ns', name: 'Native Speakers', icon: '🇬🇧' },
  { id: 'pl', name: 'Poland', icon: '🇵🇱' },
  { id: 'it', name: 'Italy', icon: '🇮🇹' },
  { id: 'exchange', name: 'Exchange', icon: '🇺🇸' },
];

export default function RequestPage() {
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    links: '', 
    submittedBy: '', 
    email: '', 
    market: 'ns',
    assignTo: '' 
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLinks, setShowLinks] = useState(false);
  const editorRef = useRef(null);

  const execCommand = (command) => {
    document.execCommand(command, false, null);
    editorRef.current?.focus();
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
        assignees: form.assignTo ? [form.assignTo] : [],
        comments: [],
        subtasks: [],
        submittedBy: form.submittedBy.trim(),
        submitterEmail: form.email.trim(),
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

  const selectedMember = TEAM_MEMBERS.find(m => m.id === form.assignTo);
  const selectedMarket = MARKETS.find(m => m.id === form.market);

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

          {/* To field */}
          <div className="px-5 py-3 flex items-center gap-3 border-b" style={{ borderColor: '#f0f0f0' }}>
            <span className="text-sm w-12" style={{ color: '#666' }}>To</span>
            <select 
              value={form.assignTo} 
              onChange={(e) => setForm({ ...form, assignTo: e.target.value })} 
              className="flex-1 text-sm bg-transparent border-0 focus:outline-none cursor-pointer"
              style={{ color: '#333' }}
            >
              <option value="">Marketing Team</option>
              {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name} — {m.role}</option>)}
            </select>
            {selectedMember && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: selectedMember.color }}>
                {selectedMember.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
          </div>

          {/* From field */}
          <div className="px-5 py-3 flex items-center gap-3 border-b" style={{ borderColor: '#f0f0f0' }}>
            <span className="text-sm w-12" style={{ color: '#666' }}>From</span>
            <input 
              type="text" 
              value={form.submittedBy} 
              onChange={(e) => setForm({ ...form, submittedBy: e.target.value })} 
              className="flex-1 text-sm bg-transparent border-0 focus:outline-none"
              style={{ color: '#333' }}
              placeholder="Your name"
              required 
            />
            <input 
              type="email" 
              value={form.email} 
              onChange={(e) => setForm({ ...form, email: e.target.value })} 
              className="w-48 text-sm bg-transparent border-0 focus:outline-none text-right"
              style={{ color: '#666' }}
              placeholder="your@email.com"
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
            className="px-5 py-4 min-h-[280px] text-sm leading-relaxed"
            style={{ color: '#333' }}
            data-placeholder="Describe your request...

• What do you need?
• What's the goal?
• Any deadline?"
            suppressContentEditableWarning
          />

          {/* Links section */}
          {showLinks && (
            <div className="px-5 pb-4">
              <textarea 
                value={form.links} 
                onChange={(e) => setForm({ ...form, links: e.target.value })} 
                className="w-full px-3 py-2 rounded-lg text-sm font-mono resize-none focus:outline-none"
                style={{ background: '#f9f9f9', border: '1px solid #e5e5e5', color: '#666' }}
                rows={2}
                placeholder="Paste links here (Google Drive, Docs, etc.)"
              />
            </div>
          )}

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
              <button type="button" onClick={() => setShowLinks(!showLinks)} className="p-2 rounded-full hover:bg-gray-200" title="Add links" style={{ background: showLinks ? '#e5e5e5' : 'transparent' }}>
                <Link2 size={18} style={{ color: '#666' }} />
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
