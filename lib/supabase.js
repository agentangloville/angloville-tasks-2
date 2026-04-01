import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// =============================================
// GENERATE PUBLIC TOKEN
// =============================================
function generatePublicToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// =============================================
// TEAM MEMBERS
// =============================================

export async function getTeamMembers() {
  const { data, error } = await supabase
    .from('team_members_public')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
  
  return (data || []).map(m => ({
    id: m.id,
    name: m.name,
    email: m.email,
    color: m.color,
    role: m.role,
    isManager: m.is_manager,
    language: m.language,
    restrictedToMarket: m.restricted_to_market,
    seeOnlyAssigned: m.see_only_assigned,
    isActive: m.is_active,
    createdAt: m.created_at,
  }));
}

export async function getAllTeamMembers() {
  const { data, error } = await supabase
    .from('team_members_public')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Error fetching all team members:', error);
    return [];
  }
  
  return (data || []).map(m => ({
    id: m.id,
    name: m.name,
    email: m.email,
    color: m.color,
    role: m.role,
    isManager: m.is_manager,
    language: m.language,
    restrictedToMarket: m.restricted_to_market,
    seeOnlyAssigned: m.see_only_assigned,
    isActive: m.is_active,
    createdAt: m.created_at,
  }));
}

export async function createTeamMember(member) {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...member }),
    });
    const data = await response.json();
    if (!data.success) {
      console.error('Error creating team member:', data.error);
      return null;
    }
    return data.user;
  } catch (error) {
    console.error('Error creating team member:', error);
    return null;
  }
}

export async function updateTeamMember(id, updates) {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id, ...updates }),
    });
    const data = await response.json();
    if (!data.success) {
      console.error('Error updating team member:', data.error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error updating team member:', error);
    return null;
  }
}

export async function deleteTeamMember(id) {
  return updateTeamMember(id, { isActive: false });
}

// =============================================
// FILE UPLOAD
// =============================================

export async function uploadFile(file, folder = 'tasks') {
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('attachments')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    console.error('Error uploading file:', error);
    return null;
  }
  
  const { data: urlData } = supabase.storage
    .from('attachments')
    .getPublicUrl(fileName);
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    name: file.name,
    url: urlData.publicUrl,
    path: fileName,
    type: file.type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };
}

export async function deleteFile(path) {
  const { error } = await supabase.storage
    .from('attachments')
    .remove([path]);
  
  if (error) {
    console.error('Error deleting file:', error);
    return false;
  }
  return true;
}

// =============================================
// CUSTOM TAGS
// =============================================

export async function getCustomTags() {
  const { data, error } = await supabase
    .from('custom_tags')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Error fetching custom tags:', error);
    return [];
  }
  
  return (data || []).map(t => ({
    id: t.id,
    name: t.name,
    color: t.color,
    createdBy: t.created_by,
    createdAt: t.created_at,
  }));
}

export async function createCustomTag(tag) {
  const { data, error } = await supabase
    .from('custom_tags')
    .insert([{
      name: tag.name,
      color: tag.color || '#4285f4',
      created_by: tag.createdBy,
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating custom tag:', error);
    return null;
  }
  
  return data ? {
    id: data.id,
    name: data.name,
    color: data.color,
    createdBy: data.created_by,
    createdAt: data.created_at,
  } : null;
}

export async function updateCustomTag(id, updates) {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.color !== undefined) dbUpdates.color = updates.color;
  
  const { data, error } = await supabase
    .from('custom_tags')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating custom tag:', error);
    return null;
  }
  return data;
}

export async function deleteCustomTag(id) {
  const { error } = await supabase
    .from('custom_tags')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting custom tag:', error);
    return false;
  }
  return true;
}

// =============================================
// TASKS
// =============================================

export async function getTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
  
  return (data || []).map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    links: t.links,
    market: t.market,
    subcategory: t.subcategory,
    status: t.status,
    priority: t.priority || null,
    deadline: t.deadline || null,
    assignees: t.assignees || [],
    comments: t.comments || [],
    subtasks: t.subtasks || [],
    attachments: t.attachments || [],
    tags: t.tags || [],
    createdBy: t.created_by,
    submittedBy: t.submitted_by,
    submitterEmail: t.submitter_email,
    isExternal: t.is_external,
    language: t.language,
    approvedBy: t.approved_by,
    approvedAt: t.approved_at,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    order: t.order,
    publicToken: t.public_token,
   emailHistory: t.email_history || [],
    linkedSendId: t.linked_send_id || null,
  }));
}

export async function getTaskByToken(token) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('public_token', token)
    .single();
  
  if (error) {
    console.error('Error fetching task by token:', error);
    return null;
  }
  
  return data ? {
    id: data.id,
    title: data.title,
    description: data.description,
    links: data.links,
    market: data.market,
    status: data.status,
    priority: data.priority || null,
    deadline: data.deadline || null,
    assignees: data.assignees || [],
    comments: data.comments || [],
    attachments: data.attachments || [],
    tags: data.tags || [],
    submittedBy: data.submitted_by,
    submitterEmail: data.submitter_email,
    createdAt: data.created_at,
    publicToken: data.public_token,
    emailHistory: data.email_history || [],
  } : null;
}

export async function createTask(task) {
  const publicToken = generatePublicToken();
  
  const { data, error } = await supabase
    .from('tasks')
    .insert([{
      title: task.title,
      description: task.description,
      links: task.links,
      market: task.market,
      subcategory: task.subcategory || null,
      status: task.status,
      priority: task.priority || null,
      deadline: task.deadline || null,
      assignees: task.assignees || [],
      comments: task.comments || [],
      subtasks: task.subtasks || [],
      attachments: task.attachments || [],
      tags: task.tags || [],
      created_by: task.createdBy,
      submitted_by: task.submittedBy,
      submitter_email: task.submitterEmail,
      is_external: task.isExternal,
      language: task.language,
      order: task.order || 0,
      public_token: publicToken,
     email_history: task.emailHistory || [],
      linked_send_id: task.linkedSendId || null,
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating task:', error);
    return null;
  }
  
  return data ? { ...data, publicToken: data.public_token } : null;
}

export async function updateTask(id, updates) {
  const dbUpdates = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.links !== undefined) dbUpdates.links = updates.links;
  if (updates.market !== undefined) dbUpdates.market = updates.market;
  if (updates.subcategory !== undefined) dbUpdates.subcategory = updates.subcategory;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
  if (updates.assignees !== undefined) dbUpdates.assignees = updates.assignees;
  if (updates.comments !== undefined) dbUpdates.comments = updates.comments;
  if (updates.subtasks !== undefined) dbUpdates.subtasks = updates.subtasks;
  if (updates.attachments !== undefined) dbUpdates.attachments = updates.attachments;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
  if (updates.approvedBy !== undefined) dbUpdates.approved_by = updates.approvedBy;
  if (updates.approvedAt !== undefined) dbUpdates.approved_at = updates.approvedAt;
  if (updates.order !== undefined) dbUpdates.order = updates.order;
  if (updates.emailHistory !== undefined) dbUpdates.email_history = updates.emailHistory;
  if (updates.linkedSendId !== undefined) dbUpdates.linked_send_id = updates.linkedSendId;
  
  const { data, error } = await supabase
    .from('tasks')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating task:', error);
    return null;
  }
  return data;
}

export async function deleteTask(id) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting task:', error);
    return false;
  }
  return true;
}

// =============================================
// QUICK LINKS
// =============================================

export async function getQuickLinks(userId) {
  const { data, error } = await supabase
    .from('quick_links')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching quick links:', error);
    return [];
  }
  
  return (data || []).map(l => ({
    id: l.id,
    name: l.name,
    url: l.url,
    userId: l.user_id,
    createdAt: l.created_at,
  }));
}

export async function createQuickLink(link) {
  const { data, error } = await supabase
    .from('quick_links')
    .insert([{
      name: link.name,
      url: link.url,
      user_id: link.userId,
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating quick link:', error);
    return null;
  }
  
  return data ? {
    id: data.id,
    name: data.name,
    url: data.url,
    userId: data.user_id,
    createdAt: data.created_at,
  } : null;
}

export async function updateQuickLink(id, updates) {
  const { data, error } = await supabase
    .from('quick_links')
    .update({
      name: updates.name,
      url: updates.url,
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating quick link:', error);
    return null;
  }
  return data;
}

export async function deleteQuickLink(id) {
  const { error } = await supabase
    .from('quick_links')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting quick link:', error);
    return false;
  }
  return true;
}
