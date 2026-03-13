import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Generate a random public token - KAŻDE zadanie dostaje unikalny token
function generatePublicToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
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
    assignees: t.assignees || [],
    comments: t.comments || [],
    subtasks: t.subtasks || [],
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
    assignees: data.assignees || [],
    comments: data.comments || [],
    submittedBy: data.submitted_by,
    submitterEmail: data.submitter_email,
    createdAt: data.created_at,
    emailHistory: data.email_history || [],
  } : null;
}

export async function createTask(task) {
  // KAŻDE zadanie dostaje unikalny publicToken przy tworzeniu
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
      assignees: task.assignees || [],
      comments: task.comments || [],
      subtasks: task.subtasks || [],
      created_by: task.createdBy,
      submitted_by: task.submittedBy,
      submitter_email: task.submitterEmail,
      is_external: task.isExternal,
      language: task.language,
      order: task.order || 0,
      public_token: publicToken,
      email_history: [],
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
  if (updates.assignees !== undefined) dbUpdates.assignees = updates.assignees;
  if (updates.comments !== undefined) dbUpdates.comments = updates.comments;
  if (updates.subtasks !== undefined) dbUpdates.subtasks = updates.subtasks;
  if (updates.approvedBy !== undefined) dbUpdates.approved_by = updates.approvedBy;
  if (updates.approvedAt !== undefined) dbUpdates.approved_at = updates.approvedAt;
  if (updates.order !== undefined) dbUpdates.order = updates.order;
  if (updates.emailHistory !== undefined) dbUpdates.email_history = updates.emailHistory;
  // NIE aktualizujemy public_token - jest stały od momentu utworzenia
  
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
// QUICK LINKS (per user - each user has their own links)
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
