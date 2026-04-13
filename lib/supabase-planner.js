import { supabase } from './supabase';

export async function getScheduledSends() {
  const { data, error } = await supabase
    .from('scheduled_sends')
    .select('*')
    .order('send_date', { ascending: true })
    .order('send_time', { ascending: true });
  if (error) { console.error('Error fetching sends:', error); return []; }
  return (data || []).map(mapSend);
}

export async function createScheduledSend(send) {
  const { data, error } = await supabase
    .from('scheduled_sends')
    .insert([{
      title: send.title,
      description: send.description || null,
      channel: send.channel || 'email',
      tools: send.tools || [],
      market: send.market || 'pl',
      segment: send.segment || null,
      send_date: send.sendDate,
      send_time: send.sendTime || '10:00',
      recurrence: send.recurrence || null,
      recurrence_end_date: send.recurrenceEndDate || null,
      parent_id: send.parentId || null,
      status: send.status || 'scheduled',
      subject_line: send.subjectLine || null,
      links: send.links || [],
      task_link: send.taskLink || null,
      created_by: send.createdBy || null,
      assignees: send.assignees || [],
      linked_task_id: send.linkedTaskId || null,
      series_name: send.seriesName || null,
    }])
    .select().single();
  if (error) { console.error('Error creating send:', error); return null; }
  return data ? mapSend(data) : null;
}

export async function updateScheduledSend(id, updates) {
  const db = {};
  if (updates.title !== undefined) db.title = updates.title;
  if (updates.description !== undefined) db.description = updates.description;
  if (updates.channel !== undefined) db.channel = updates.channel;
  if (updates.tools !== undefined) db.tools = updates.tools;
  if (updates.market !== undefined) db.market = updates.market;
  if (updates.segment !== undefined) db.segment = updates.segment;
  if (updates.sendDate !== undefined) db.send_date = updates.sendDate;
  if (updates.sendTime !== undefined) db.send_time = updates.sendTime;
  if (updates.recurrence !== undefined) db.recurrence = updates.recurrence;
  if (updates.recurrenceEndDate !== undefined) db.recurrence_end_date = updates.recurrenceEndDate;
  if (updates.status !== undefined) db.status = updates.status;
  if (updates.subjectLine !== undefined) db.subject_line = updates.subjectLine;
  if (updates.links !== undefined) db.links = updates.links;
  if (updates.taskLink !== undefined) db.task_link = updates.taskLink;
  if (updates.assignees !== undefined) db.assignees = updates.assignees;
  if (updates.linkedTaskId !== undefined) db.linked_task_id = updates.linkedTaskId;
  if (updates.seriesName !== undefined) db.series_name = updates.seriesName;

  const { data, error } = await supabase.from('scheduled_sends').update(db).eq('id', id).select().single();
  if (error) { console.error('Error updating send:', error); return null; }
  return data ? mapSend(data) : null;
}

export async function deleteScheduledSend(id) {
  const { error } = await supabase.from('scheduled_sends').delete().eq('id', id);
  if (error) { console.error('Error deleting send:', error); return false; }
  return true;
}

// Bulk update status for multiple sends at once
export async function bulkUpdateStatus(ids, status) {
  const { error } = await supabase
    .from('scheduled_sends')
    .update({ status })
    .in('id', ids);
  if (error) { console.error('Error bulk updating sends:', error); return false; }
  return true;
}

// Update all sends in a series (parent + children) – shared fields only, NOT per-send content (subject/description)
export async function updateSeries(parentId, updates) {
  const db = {};
  if (updates.title !== undefined) db.title = updates.title;
  if (updates.channel !== undefined) db.channel = updates.channel;
  if (updates.tools !== undefined) db.tools = updates.tools;
  if (updates.market !== undefined) db.market = updates.market;
  if (updates.segment !== undefined) db.segment = updates.segment;
  if (updates.sendTime !== undefined) db.send_time = updates.sendTime;
  if (updates.links !== undefined) db.links = updates.links;
  if (updates.taskLink !== undefined) db.task_link = updates.taskLink;
  if (updates.assignees !== undefined) db.assignees = updates.assignees;
  if (updates.seriesName !== undefined) db.series_name = updates.seriesName;

  await supabase.from('scheduled_sends').update(db).eq('id', parentId);
  await supabase.from('scheduled_sends').update(db).eq('parent_id', parentId);
  return true;
}

// Delete entire series
export async function deleteSeries(parentId) {
  await supabase.from('scheduled_sends').delete().eq('parent_id', parentId);
  await supabase.from('scheduled_sends').delete().eq('id', parentId);
  return true;
}

// Delete this and all future occurrences
export async function deleteThisAndFuture(send) {
  const pid = send.parentId || send.id;
  const { error } = await supabase.from('scheduled_sends').delete()
    .eq('parent_id', pid).gte('send_date', send.sendDate);
  if (send.id === pid) {
    await supabase.from('scheduled_sends').delete().eq('id', pid);
  }
  return !error;
}

export async function generateRecurrences(parentSend) {
  if (!parentSend.recurrence) return [];

  const occurrences = [];
  const [sY, sM, sD] = parentSend.sendDate.split('-').map(Number);
  let cur = new Date(sY, sM - 1, sD);

  let end;
  if (parentSend.recurrenceEndDate) {
    const [eY, eM, eD] = parentSend.recurrenceEndDate.split('-').map(Number);
    end = new Date(eY, eM - 1, eD);
  } else {
    end = new Date(sY, sM - 1, sD);
    end.setMonth(end.getMonth() + 12);
  }

  const step = (d, type) => {
    const n = new Date(d);
    if (type === 'weekly') n.setDate(n.getDate() + 7);
    else if (type === 'biweekly') n.setDate(n.getDate() + 14);
    else if (type === 'monthly') n.setMonth(n.getMonth() + 1);
    return n;
  };

  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  cur = step(cur, parentSend.recurrence);

  while (cur <= end) {
    const occ = await createScheduledSend({
      title: parentSend.title, description: parentSend.description,
      channel: parentSend.channel, tools: parentSend.tools,
      market: parentSend.market, segment: parentSend.segment,
      sendDate: fmt(cur), sendTime: parentSend.sendTime,
      status: 'scheduled', subjectLine: parentSend.subjectLine,
      links: parentSend.links, taskLink: parentSend.taskLink,
      createdBy: parentSend.createdBy, assignees: parentSend.assignees,
      parentId: parentSend.id, recurrence: null, recurrenceEndDate: null,
      seriesName: parentSend.seriesName || null,
    });
    if (occ) occurrences.push(occ);
    cur = step(cur, parentSend.recurrence);
  }

  return occurrences;
}

function mapSend(row) {
  return {
    id: row.id, title: row.title, description: row.description,
    channel: row.channel, tools: row.tools || [], market: row.market,
    segment: row.segment, sendDate: row.send_date, sendTime: row.send_time,
    recurrence: row.recurrence, recurrenceEndDate: row.recurrence_end_date,
    parentId: row.parent_id, status: row.status, subjectLine: row.subject_line,
    links: row.links || [], taskLink: row.task_link || '',
    createdBy: row.created_by, assignees: row.assignees || [],
    linkedTaskId: row.linked_task_id || null,
    seriesName: row.series_name || null,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}
