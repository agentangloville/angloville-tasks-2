'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock, AlertCircle, Send, MessageSquare, ExternalLink, Loader2, ArrowLeft, User } from 'lucide-react';
import { useParams } from 'next/navigation';

const STATUSES = {
  pending: { name: 'Pending Review', icon: AlertCircle, color: '#fbbc04', bg: '#fef7e0' },
  open: { name: 'In Progress', icon: Circle, color: '#4285f4', bg: '#e8f0fe' },
  longterm: { name: 'Long-term', icon: Clock, color: '#a142f4', bg: '#f3e8fd' },
  closed: { name: 'Completed', icon: CheckCircle, color: '#34a853', bg: '#e6f4ea' },
};

const TEAM_MEMBERS = [
  { id: 'edyta', name: 'Edyta Kędzior', color: '#4285f4' },
  { id: 'aleksandra', name: 'Aleksandra Witkowska', color: '#a142f4' },
  { id: 'damian_l', name: 'Damian Ładak', color: '#34a853' },
  { id: 'damian_w', name: 'Damian Wójcicki', color: '#fbbc04' },
  { id: 'wojciech', name: 'Wojciech Pisarski', color: '#ea4335' },
  { id: 'klaudia', name: 'Klaudia Gołembiowska', color: '#e91e63' },
];

const MARKETS = {
  pl: { name: 'Poland', icon: '🇵🇱' },
  ns: { name: 'Native Speakers', icon: '🇬🇧' },
  it: { name: 'Italy', icon: '🇮🇹' },
  exchange: { name: 'Exchange', icon: '🇺🇸' },
};

const getInitials = (name) => {
  const parts = name.split(' ');
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return name[0];
};

const formatDateTime = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

function RichTextDisplay({ html }) {
  if (!html) return null;
  return (
    <div 
      className="text-sm leading-relaxed"
      style={{ color: '#3c4043' }}
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}

function ClickableLinks({ text }) {
  if (!text) return null;
  const cleanText = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
  
  const lines = cleanText.split('\n');
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
            else label = urlObj.hostname.replace('www.', '');
          } catch {}
          return (
            <a 
              key={i}
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              style={{ color: '#1a73e8' }}
            >
              <ExternalLink size={14} />
              <span className="text-sm hover:underline">{label}</span>
            </a>
          );
        }
        return line ? <span key={i} className="text-sm block" style={{ color: '#5f6368' }}>{line}</span> : null;
      })}
    </div>
  );
}

export default function PublicTaskPage() {
  const params = useParams();
  const token = params.token;
  
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadTask = async () => {
    try {
      const res = await fetch(`/api/task/${token}`);
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setTask(data);
      }
    } catch (err) {
      setError('Failed to load task');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) loadTask();
  }, [token]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/task/${token}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: comment.trim() }),
      });
      
      const data = await res.json();
      if (data.success) {
        setComment('');
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
        loadTask(); // Reload to show new comment
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fa' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#1a73e8' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f8f9fa' }}>
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center" style={{ boxShadow: '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)' }}>
          <AlertCircle size={48} className="mx-auto mb-4" style={{ color: '#ea4335' }} />
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#202124' }}>Task Not Found</h2>
          <p style={{ color: '#5f6368' }}>This link may be invalid or the task may have been removed.</p>
          <a href="/request" className="inline-block mt-6 px-6 py-2.5 rounded-full text-sm font-medium transition-colors" style={{ background: '#1a73e8', color: 'white' }}>
            Submit New Request
          </a>
        </div>
      </div>
    );
  }

  const status = STATUSES[task.status] || STATUSES.open;
  const StatusIcon = status.icon;
  const market = MARKETS[task.market];

  return (
    <div className="min-h-screen" style={{ background: '#f8f9fa' }}>
      {/* Header */}
      <header className="bg-white border-b px-6 py-4" style={{ borderColor: '#e8eaed' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="Angloville" className="h-8" />
            <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ background: '#e8f0fe', color: '#1a73e8' }}>Task Tracker</span>
          </div>
          <a href="/request" className="text-sm flex items-center gap-1 hover:underline" style={{ color: '#1a73e8' }}>
            <ArrowLeft size={16} /> New Request
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-8 px-4">
        {/* Task Card */}
        <div className="bg-white rounded-xl overflow-hidden mb-6" style={{ boxShadow: '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)' }}>
          {/* Status Bar */}
          <div className="px-6 py-4 flex items-center justify-between" style={{ background: status.bg }}>
            <div className="flex items-center gap-3">
              <StatusIcon size={24} style={{ color: status.color }} />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: status.color }}>Status</p>
                <p className="font-semibold" style={{ color: status.color }}>{status.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{market?.icon}</span>
              <span className="text-sm font-medium" style={{ color: '#5f6368' }}>{market?.name}</span>
            </div>
          </div>

          {/* Task Content */}
          <div className="p-6">
            <h1 className="text-2xl font-semibold mb-4" style={{ color: '#202124' }}>{task.title}</h1>
            
            {task.description && (
              <div className="mb-6">
                <RichTextDisplay html={task.description} />
              </div>
            )}

            {task.links && (
              <div className="mb-6 p-4 rounded-lg" style={{ background: '#f8f9fa' }}>
                <p className="text-xs font-medium mb-2" style={{ color: '#5f6368' }}>Attached Links</p>
                <ClickableLinks text={task.links} />
              </div>
            )}

            {/* Assigned Team */}
            {task.assignees && task.assignees.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium mb-2" style={{ color: '#5f6368' }}>Assigned Team</p>
                <div className="flex flex-wrap gap-2">
                  {task.assignees.map(aId => {
                    const member = TEAM_MEMBERS.find(m => m.id === aId);
                    if (!member) return null;
                    return (
                      <div key={aId} className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: '#f1f3f4' }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: member.color }}>
                          {getInitials(member.name)}
                        </div>
                        <span className="text-sm" style={{ color: '#202124' }}>{member.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="pt-4 border-t text-xs" style={{ borderColor: '#e8eaed', color: '#9aa0a6' }}>
              <p>Submitted: {formatDateTime(task.createdAt)}</p>
              {task.submittedBy && <p>By: {task.submittedBy}</p>}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)' }}>
          <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: '#e8eaed' }}>
            <MessageSquare size={20} style={{ color: '#5f6368' }} />
            <h2 className="font-medium" style={{ color: '#202124' }}>
              Conversation ({task.comments?.length || 0})
            </h2>
          </div>

          <div className="p-6">
            {/* Comments List */}
            {task.comments && task.comments.length > 0 ? (
              <div className="space-y-4 mb-6">
                {task.comments.map((c, index) => {
                  const isExternal = c.author === 'external' || c.isExternal;
                  const member = !isExternal ? TEAM_MEMBERS.find(m => m.id === c.author) : null;
                  
                  return (
                    <div key={c.id || index} className={`flex gap-3 ${isExternal ? 'flex-row-reverse' : ''}`}>
                      {/* Avatar */}
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                        style={{ background: isExternal ? '#5f6368' : (member?.color || '#9aa0a6') }}
                      >
                        {isExternal ? <User size={20} /> : getInitials(member?.name || '?')}
                      </div>
                      
                      {/* Message */}
                      <div className={`flex-1 ${isExternal ? 'text-right' : ''}`}>
                        <div 
                          className={`inline-block rounded-2xl px-4 py-3 max-w-[85%] ${isExternal ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                          style={{ 
                            background: isExternal ? '#1a73e8' : '#f1f3f4',
                            color: isExternal ? 'white' : '#202124'
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium" style={{ color: isExternal ? 'rgba(255,255,255,0.9)' : '#202124' }}>
                              {isExternal ? (c.authorName || task.submittedBy || 'You') : (member?.name || 'Team')}
                            </span>
                            {!isExternal && (
                              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.1)', color: isExternal ? 'rgba(255,255,255,0.7)' : '#5f6368' }}>
                                Team
                              </span>
                            )}
                          </div>
                          <p className="text-sm" style={{ color: isExternal ? 'white' : '#3c4043' }}>{c.text}</p>
                        </div>
                        <p className="text-xs mt-1" style={{ color: '#9aa0a6' }}>
                          {formatDateTime(c.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 mb-6">
                <MessageSquare size={32} className="mx-auto mb-2" style={{ color: '#dadce0' }} />
                <p className="text-sm" style={{ color: '#9aa0a6' }}>No messages yet</p>
                <p className="text-xs" style={{ color: '#9aa0a6' }}>The team may reach out if they have questions</p>
              </div>
            )}

            {/* Reply Form */}
            <form onSubmit={handleSubmitComment}>
              <div className="flex gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: '#5f6368' }}
                >
                  <User size={20} />
                </div>
                <div className="flex-1">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Type your reply..."
                    className="w-full px-4 py-3 border rounded-xl text-sm resize-none transition-colors focus:border-blue-500 focus:outline-none"
                    style={{ borderColor: '#dadce0', color: '#202124' }}
                    rows={3}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs" style={{ color: '#9aa0a6' }}>
                      The team will be notified of your reply
                    </p>
                    <button
                      type="submit"
                      disabled={!comment.trim() || submitting}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm disabled:opacity-50 transition-all hover:shadow-md"
                      style={{ background: '#1a73e8', color: 'white' }}
                    >
                      {submitting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                      {submitting ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Success Message */}
            {submitted && (
              <div className="mt-4 p-3 rounded-lg flex items-center gap-2" style={{ background: '#e6f4ea' }}>
                <CheckCircle size={18} style={{ color: '#34a853' }} />
                <span className="text-sm" style={{ color: '#137333' }}>Reply sent successfully!</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-8 text-sm" style={{ color: '#9aa0a6' }}>
          Questions? Contact <a href="mailto:e.kedzior@angloville.pl" className="hover:underline" style={{ color: '#1a73e8' }}>e.kedzior@angloville.pl</a>
        </p>
      </main>
    </div>
  );
}
