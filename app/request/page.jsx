'use client';

import React, { useState, useRef } from 'react';
import { CheckCircle, Send, Bold, Italic, Underline, List, ListOrdered, Link2, AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Undo, Redo, X, Check } from 'lucide-react';
import { createTask } from '../../lib/supabase';

const TEAM_MEMBERS = [
  { id: 'edyta', name: 'Edyta Kędzior', color: '#4285f4' },
  { id: 'aleksandra', name: 'Aleksandra Witkowska', color: '#a142f4' },
  { id: 'damian_l', name: 'Damian Ładak', color: '#34a853' },
  { id: 'damian_w', name: 'Damian Wójcicki', color: '#fbbc04' },
  { id: 'wojciech', name: 'Wojciech Pisarski', color: '#ea4335' },
  { id: 'klaudia', name: 'Klaudia Gołembiowska', color: '#e91e63' },
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
    links: '', 
    submittedBy: '', 
    email: '', 
    market: 'ns',
    assignees: []
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const editorRef = useRef(null);

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

  const selectedMarket = MARKETS.find(m => m.id === form.market);

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f8f9fa' }}>
        <div className="bg-white rounded-2xl p-10 max-w-lg w-full text-center" style={{ boxShadow: '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: '#e6f4ea' }}>
            <CheckCircle size={44} style={{ color: '#34a853' }} />
          </div>
          <h2 className="text-2xl font-semibold mb-3" style={{ color: '#202124' }}>Request sent!</h2>
          <p className="text-base" style={{ color: '#5f6368' }}>The marketing team will review your request and get back to you soon.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-8 px-8 py-3 rounded-full text-sm font-medium transition-colors hover:bg-gray-200"
            style={{ background: '#f1f3f4', color: '#202124' }}
          >
            Submit another request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8f9fa' }}>
      {/* Header - Google style */}
      <header className="bg-white border-b px-8 py-4" style={{ borderColor: '#e8eaed' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="Angloville" className="h-8" style={{ filter: 'brightness(0)' }} />
            <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ background: '#e8f0fe', color: '#1a73e8' }}>Marketing Request</span>
          </div>
        </div>
      </header>

      {/* Main - Google Docs inspired layout */}
      <main className="max-w-4xl mx-auto py-8 px-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)' }}>
          
          {error && (
            <div className="px-6 py-4 text-sm flex items-center gap-2" style={{ background: '#fce8e6', color: '#c5221f', borderBottom: '1px solid #f5c6cb' }}>
              <X size={16} />
              {error}
            </div>
          )}

          {/* Header fields - clean Google style */}
          <div className="border-b" style={{ borderColor: '#e8eaed' }}>
            {/* To field with multi-select */}
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

            {/* From + Email row */}
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
                <label className="text-sm font-medium block mb-2" style={{ color: '#202124' }}>Email (optional)</label>
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

            {/* Subject + Market */}
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
          </div>

          {/* Google Docs style editor */}
          <div className="border-b" style={{ borderColor: '#e8eaed' }}>
            {/* Toolbar - Google Docs style */}
            <div className="px-3 py-2 flex items-center gap-0.5 flex-wrap border-b" style={{ background: '#f1f3f4', borderColor: '#e8eaed' }}>
              <button type="button" onClick={() => execCommand('undo')} className="p-2 rounded hover:bg-gray-200" title="Undo"><Undo size={18} style={{ color: '#444746' }} /></button>
              <button type="button" onClick={() => execCommand('redo')} className="p-2 rounded hover:bg-gray-200" title="Redo"><Redo size={18} style={{ color: '#444746' }} /></button>
              
              <div className="w-px h-6 mx-2" style={{ background: '#dadce0' }} />
              
              <select onChange={(e) => execCommand('fontSize', e.target.value)} className="text-sm px-2 py-1.5 rounded bg-transparent hover:bg-gray-200 cursor-pointer" style={{ color: '#444746' }} defaultValue="3">
                <option value="1">Small</option>
                <option value="2">Smaller</option>
                <option value="3">Normal</option>
                <option value="4">Larger</option>
                <option value="5">Large</option>
              </select>
              
              <div className="w-px h-6 mx-2" style={{ background: '#dadce0' }} />
              
              <button type="button" onClick={() => execCommand('bold')} className="p-2 rounded hover:bg-gray-200" title="Bold"><Bold size={18} style={{ color: '#444746' }} /></button>
              <button type="button" onClick={() => execCommand('italic')} className="p-2 rounded hover:bg-gray-200" title="Italic"><Italic size={18} style={{ color: '#444746' }} /></button>
              <button type="button" onClick={() => execCommand('underline')} className="p-2 rounded hover:bg-gray-200" title="Underline"><Underline size={18} style={{ color: '#444746' }} /></button>
              
              <div className="w-px h-6 mx-2" style={{ background: '#dadce0' }} />
              
              {/* Text color - Google palette */}
              <div className="relative group">
                <button type="button" className="p-2 rounded hover:bg-gray-200 flex items-center" title="Text color">
                  <span style={{ color: '#444746', fontSize: '16px', fontWeight: '600', borderBottom: '3px solid #000' }}>A</span>
                </button>
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border p-2 hidden group-hover:grid grid-cols-5 gap-1 z-20" style={{ borderColor: '#dadce0' }}>
                  {['#000000', '#434343', '#666666', '#1a73e8', '#ea4335', '#fbbc04', '#34a853', '#ff6d01', '#46bdc6', '#7baaf7', '#f07b72', '#fdd663', '#57bb8a', '#9b59b6', '#e91e63'].map(color => (
                    <button key={color} type="button" onClick={() => execCommand('foreColor', color)} className="w-6 h-6 rounded hover:scale-110 transition-transform" style={{ background: color }} />
                  ))}
                </div>
              </div>

              {/* Highlight */}
              <div className="relative group">
                <button type="button" className="p-2 rounded hover:bg-gray-200 flex items-center" title="Highlight">
                  <span style={{ background: '#fcf3cf', color: '#444746', fontSize: '16px', fontWeight: '600', padding: '0 3px' }}>A</span>
                </button>
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border p-2 hidden group-hover:grid grid-cols-4 gap-1 z-20" style={{ borderColor: '#dadce0' }}>
                  {['#ffffff', '#fcf3cf', '#d9ead3', '#c9daf8', '#fce5cd', '#f4cccc', '#d9d2e9', '#cfe2f3'].map(color => (
                    <button key={color} type="button" onClick={() => execCommand('hiliteColor', color)} className="w-6 h-6 rounded border hover:scale-110 transition-transform" style={{ background: color, borderColor: '#dadce0' }} />
                  ))}
                </div>
              </div>
              
              <div className="w-px h-6 mx-2" style={{ background: '#dadce0' }} />
              
              <button type="button" onClick={insertLink} className="p-2 rounded hover:bg-gray-200" title="Insert link"><Link2 size={18} style={{ color: '#444746' }} /></button>
              
              <div className="w-px h-6 mx-2" style={{ background: '#dadce0' }} />
              
              <button type="button" onClick={() => execCommand('formatBlock', 'h1')} className="p-2 rounded hover:bg-gray-200" title="Heading 1"><Heading1 size={18} style={{ color: '#444746' }} /></button>
              <button type="button" onClick={() => execCommand('formatBlock', 'h2')} className="p-2 rounded hover:bg-gray-200" title="Heading 2"><Heading2 size={18} style={{ color: '#444746' }} /></button>
              
              <div className="w-px h-6 mx-2" style={{ background: '#dadce0' }} />
              
              <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-2 rounded hover:bg-gray-200" title="Bullet list"><List size={18} style={{ color: '#444746' }} /></button>
              <button type="button" onClick={() => execCommand('insertOrderedList')} className="p-2 rounded hover:bg-gray-200" title="Numbered list"><ListOrdered size={18} style={{ color: '#444746' }} /></button>
              
              <div className="w-px h-6 mx-2" style={{ background: '#dadce0' }} />
              
              <button type="button" onClick={() => execCommand('justifyLeft')} className="p-2 rounded hover:bg-gray-200" title="Align left"><AlignLeft size={18} style={{ color: '#444746' }} /></button>
              <button type="button" onClick={() => execCommand('justifyCenter')} className="p-2 rounded hover:bg-gray-200" title="Center"><AlignCenter size={18} style={{ color: '#444746' }} /></button>
              <button type="button" onClick={() => execCommand('justifyRight')} className="p-2 rounded hover:bg-gray-200" title="Align right"><AlignRight size={18} style={{ color: '#444746' }} /></button>
              
              <button type="button" onClick={() => execCommand('removeFormat')} className="p-2 rounded hover:bg-gray-200 ml-auto" title="Clear formatting"><X size={18} style={{ color: '#9aa0a6' }} /></button>
            </div>

            {/* Editor content - Google Docs style */}
            <div 
              ref={editorRef}
              contentEditable
              className="px-6 py-6 text-base overflow-y-auto"
              style={{ color: '#202124', minHeight: '350px', maxHeight: '500px', lineHeight: '1.6' }}
              data-placeholder="Describe your request...

• What do you need?
• What's the goal?
• Any deadline or priority?"
              suppressContentEditableWarning
            />
          </div>

          {/* Links section */}
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

          {/* Submit button - Google style */}
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
