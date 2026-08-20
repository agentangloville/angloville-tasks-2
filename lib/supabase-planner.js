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
      comments: send.comments || [],
      subtasks: send.subtasks || [],
      attachments: send.attachments || [],
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
  if (updates.comments !== undefined) db.comments = updates.comments;
  if (updates.subtasks !== undefined) db.subtasks = updates.subtasks;
  if (updates.attachments !== undefined) db.attachments = updates.attachments;

  const { data, error } = await supabase.from('scheduled_sends').update(db).eq('id', id).select().single();
  if (error) { console.error('Error updating send:', error); return null; }
  return data ? mapSend(data) : null;
}

// Przeniesienie pojedynczej wysyłki na inny dzień (drag & drop).
// Zawsze dotyczy TYLKO tej jednej wysyłki – nigdy całej serii.
export async function moveScheduledSend(id, newDate) {
  return updateScheduledSend(id, { sendDate: newDate });
}

// Duplikat wysyłki – zawsze niezależna kopia (bez recurrence i bez parentId),
// żeby duplikat nigdy nie był traktowany jako część serii źródłowej.
export async function duplicateScheduledSend(send, date, createdBy, titleSuffix = '') {
  return createScheduledSend({
    title: (send.title || '') + titleSuffix,
    description: send.description || '',
    channel: send.channel,
    tools: send.tools || [],
    market: send.market,
    segment: send.segment || null,
    sendDate: date || send.sendDate,
    sendTime: send.sendTime || '10:00',
    recurrence: null,
    recurrenceEndDate: null,
    parentId: null,
    status: 'scheduled',
    subjectLine: send.subjectLine || null,
    links: send.links || [],
    taskLink: send.taskLink || null,
    createdBy: createdBy || send.createdBy || null,
    assignees: send.assignees || [],
    seriesName: null,
    comments: [],
    subtasks: send.subtasks || [],
    attachments: [],
  });
}

export async function deleteScheduledSend(id) {
  // Najpierw wyczyść linkedSendId w taskach które wskazują na tę wysyłkę
  // (zapobiega osieroconym referencjom – task by nadal pokazywał link do nieistniejącej wysyłki)
  await supabase.from('tasks').update({ linked_send_id: null }).eq('linked_send_id', id);

  const { error } = await supabase.from('scheduled_sends').delete().eq('id', id);
  if (error) { console.error('Error deleting send:', error); return false; }
  return true;
}

// ── Usuwanie POJEDYNCZEGO wystąpienia z serii ────────────────────────────────
// KLUCZOWA POPRAWKA: przy usuwaniu rodzica serii jego dzieci znikały razem z nim
// (FK parent_id z ON DELETE CASCADE) lub zostawały osierocone. Dlatego przed
// usunięciem rodzica promujemy najwcześniejsze dziecko na nowego rodzica serii
// i przepinamy pod nie pozostałe wystąpienia.
export async function deleteSingleOccurrence(send) {
  const isParent = !send.parentId;

  if (isParent) {
    const { data: children } = await supabase
      .from('scheduled_sends')
      .select('id, send_date')
      .eq('parent_id', send.id)
      .order('send_date', { ascending: true });

    if (children && children.length > 0) {
      const newRoot = children[0];
      const rest = children.slice(1).map(c => c.id);

      // 1. Nowy rodzic serii – przejmuje reguły powtarzania
      const { error: promoteError } = await supabase
        .from('scheduled_sends')
        .update({
          parent_id: null,
          recurrence: send.recurrence || null,
          recurrence_end_date: send.recurrenceEndDate || null,
        })
        .eq('id', newRoot.id);
      if (promoteError) { console.error('Error promoting new series root:', promoteError); return false; }

      // 2. Pozostałe wystąpienia przepięte pod nowego rodzica
      if (rest.length > 0) {
        const { error: repointError } = await supabase
          .from('scheduled_sends')
          .update({ parent_id: newRoot.id })
          .in('id', rest);
        if (repointError) { console.error('Error repointing series children:', repointError); return false; }
      }
    }
  }

  // Dopiero teraz kasujemy – żadne dziecko nie wskazuje już na tę wysyłkę
  return deleteScheduledSend(send.id);
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

// Update tej wysyłki i wszystkich PRZYSZŁYCH z serii – wcześniejsze zostają nietknięte.
// Pola wspólne lecą na całą przyszłość serii, treść per-wysyłka (opis/temat/data)
// zmienia się tylko dla edytowanej wysyłki.
export async function updateSeriesFromDate(send, updates) {
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

  const pid = send.parentId || send.id;

  // Dzieci serii od daty tej wysyłki w przód
  await supabase.from('scheduled_sends').update(db)
    .eq('parent_id', pid).gte('send_date', send.sendDate);

  // Rodzic serii aktualizowany tylko wtedy, gdy edytujemy właśnie jego (pierwsza wysyłka)
  if (!send.parentId) {
    await supabase.from('scheduled_sends').update(db).eq('id', pid);
  }

  // Treść indywidualna edytowanej wysyłki
  await updateScheduledSend(send.id, {
    description: updates.description,
    subjectLine: updates.subjectLine,
    sendDate: updates.sendDate,
    status: updates.status,
  });

  return true;
}

// Delete entire series
export async function deleteSeries(parentId) {
  // Zbierz wszystkie ID wysyłek z serii (parent + children)
  const { data: children } = await supabase
    .from('scheduled_sends')
    .select('id')
    .eq('parent_id', parentId);
  const allIds = [parentId, ...(children || []).map(c => c.id)];

  // Wyczyść linkedSendId w taskach które wskazują na którąkolwiek wysyłkę z serii
  await supabase.from('tasks').update({ linked_send_id: null }).in('linked_send_id', allIds);

  await supabase.from('scheduled_sends').delete().eq('parent_id', parentId);
  await supabase.from('scheduled_sends').delete().eq('id', parentId);
  return true;
}

// ── Usuń tę i wszystkie przyszłe wysyłki z serii ─────────────────────────────
// Jeśli usuwana wysyłka jest rodzicem (pierwsza w serii) – znika cała seria.
// Jeśli jest dzieckiem – kasujemy ją i późniejsze, a rodzicowi skracamy
// recurrence_end_date do dnia poprzedzającego, żeby seria realnie się kończyła.
export async function deleteThisAndFuture(send) {
  const pid = send.parentId || send.id;

  if (!send.parentId) {
    return deleteSeries(pid);
  }

  const { data: futureChildren } = await supabase
    .from('scheduled_sends')
    .select('id')
    .eq('parent_id', pid)
    .gte('send_date', send.sendDate);
  const idsToDelete = (futureChildren || []).map(c => c.id);

  if (idsToDelete.length > 0) {
    await supabase.from('tasks').update({ linked_send_id: null }).in('linked_send_id', idsToDelete);
  }

  const { error } = await supabase.from('scheduled_sends').delete()
    .eq('parent_id', pid).gte('send_date', send.sendDate);
  if (error) { console.error('Error deleting this and future:', error); return false; }

  // Skróć okres powtarzania rodzica do dnia przed usuniętym wystąpieniem
  const d = new Date(send.sendDate + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  const newEnd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  await supabase.from('scheduled_sends')
    .update({ recurrence_end_date: newEnd })
    .eq('id', pid);

  return true;
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
    publicToken: row.public_token || null,
    comments: row.comments || [],
    subtasks: row.subtasks || [],
    attachments: row.attachments || [],
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}
