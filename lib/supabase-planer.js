import { supabase } from './supabase';

// =============================================
// SCHEDULED SENDS (Planner)
// =============================================

export async function getScheduledSends() {
  const { data, error } = await supabase
    .from('scheduled_sends')
    .select('*')
    .order('send_date', { ascending: true })
    .order('send_time', { ascending: true });

  if (error) {
    console.error('Error fetching scheduled sends:', error);
    return [];
  }

  return (data || []).map(mapSend);
}

export async function getScheduledSendsByRange(startDate, endDate) {
  const { data, error } = await supabase
    .from('scheduled_sends')
    .select('*')
    .gte('send_date', startDate)
    .lte('send_date', endDate)
    .order('send_date', { ascending: true })
    .order('send_time', { ascending: true });

  if (error) {
    console.error('Error fetching sends by range:', error);
    return [];
  }

  return (data || []).map(mapSend);
}

export async function createScheduledSend(send) {
  const { data, error } = await supabase
    .from('scheduled_sends')
    .insert([{
      title: send.title,
      description: send.description || null,
      channel: send.channel || 'email',
      tool: send.tool || 'hubspot',
      market: send.market || 'pl',
      segment: send.segment || null,
      send_date: send.sendDate,
      send_time: send.sendTime || '10:00',
      recurrence: send.recurrence || null,
      recurrence_end_date: send.recurrenceEndDate || null,
      parent_id: send.parentId || null,
      status: send.status || 'scheduled',
      subject_line: send.subjectLine || null,
      notes: send.notes || null,
      created_by: send.createdBy || null,
      assigned_to: send.assignedTo || null,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating scheduled send:', error);
    return null;
  }

  return data ? mapSend(data) : null;
}

export async function updateScheduledSend(id, updates) {
  const dbUpdates = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.channel !== undefined) dbUpdates.channel = updates.channel;
  if (updates.tool !== undefined) dbUpdates.tool = updates.tool;
  if (updates.market !== undefined) dbUpdates.market = updates.market;
  if (updates.segment !== undefined) dbUpdates.segment = updates.segment;
  if (updates.sendDate !== undefined) dbUpdates.send_date = updates.sendDate;
  if (updates.sendTime !== undefined) dbUpdates.send_time = updates.sendTime;
  if (updates.recurrence !== undefined) dbUpdates.recurrence = updates.recurrence;
  if (updates.recurrenceEndDate !== undefined) dbUpdates.recurrence_end_date = updates.recurrenceEndDate;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.subjectLine !== undefined) dbUpdates.subject_line = updates.subjectLine;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;

  const { data, error } = await supabase
    .from('scheduled_sends')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating scheduled send:', error);
    return null;
  }

  return data ? mapSend(data) : null;
}

export async function deleteScheduledSend(id) {
  const { error } = await supabase
    .from('scheduled_sends')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting scheduled send:', error);
    return false;
  }
  return true;
}

export async function generateRecurrences(parentSend) {
  if (!parentSend.recurrence || !parentSend.recurrenceEndDate) return [];

  const occurrences = [];
  let currentDate = new Date(parentSend.sendDate);
  const endDate = new Date(parentSend.recurrenceEndDate);

  const addInterval = (date, type) => {
    const d = new Date(date);
    switch (type) {
      case 'weekly': d.setDate(d.getDate() + 7); break;
      case 'biweekly': d.setDate(d.getDate() + 14); break;
      case 'monthly': d.setMonth(d.getMonth() + 1); break;
    }
    return d;
  };

  currentDate = addInterval(currentDate, parentSend.recurrence);

  while (currentDate <= endDate) {
    const occ = await createScheduledSend({
      ...parentSend,
      sendDate: currentDate.toISOString().split('T')[0],
      parentId: parentSend.id,
      recurrence: null,
      recurrenceEndDate: null,
    });
    if (occ) occurrences.push(occ);
    currentDate = addInterval(currentDate, parentSend.recurrence);
  }

  return occurrences;
}

function mapSend(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    channel: row.channel,
    tool: row.tool,
    market: row.market,
    segment: row.segment,
    sendDate: row.send_date,
    sendTime: row.send_time,
    recurrence: row.recurrence,
    recurrenceEndDate: row.recurrence_end_date,
    parentId: row.parent_id,
    status: row.status,
    subjectLine: row.subject_line,
    notes: row.notes,
    createdBy: row.created_by,
    assignedTo: row.assigned_to,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
