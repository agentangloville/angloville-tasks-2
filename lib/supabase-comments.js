import { supabase } from './supabase';

// Atomowe operacje na jsonb `comments`.
// Wszystko idzie przez funkcje Postgresa, dzięki czemu równoległe zapisy
// dwóch osób nie nadpisują się nawzajem (koniec ze znikającymi komentarzami).

const ENTITIES = {
  task: {
    idKey: 'p_task_id',
    append: 'append_task_comment',
    patch: 'update_task_comment',
    remove: 'delete_task_comment',
    react: 'toggle_task_comment_reaction',
  },
  send: {
    idKey: 'p_send_id',
    append: 'append_send_comment',
    patch: 'update_send_comment',
    remove: 'delete_send_comment',
    react: 'toggle_send_comment_reaction',
  },
};

function cfgFor(entity) {
  const cfg = ENTITIES[entity];
  if (!cfg) console.error('supabase-comments: nieznany typ encji:', entity);
  return cfg || null;
}

async function call(fnName, args, label) {
  const { data, error } = await supabase.rpc(fnName, args);
  if (error) {
    console.error(`Error ${label}:`, error);
    return null;
  }
  return data || [];
}

// Dopisuje komentarz na końcu tablicy. Zwraca AKTUALNĄ pełną tablicę
// komentarzy z bazy (razem z tym, co w międzyczasie dodali inni) albo null.
export async function appendComment(entity, id, comment) {
  const cfg = cfgFor(entity);
  if (!cfg) return null;
  return call(cfg.append, { [cfg.idKey]: id, p_comment: comment }, 'appending comment');
}

// Nadpisuje wybrane pola jednego komentarza (merge, nie podmiana całości).
export async function patchComment(entity, id, commentId, patch) {
  const cfg = cfgFor(entity);
  if (!cfg) return null;
  return call(cfg.patch, { [cfg.idKey]: id, p_comment_id: commentId, p_patch: patch }, 'updating comment');
}

export async function removeComment(entity, id, commentId) {
  const cfg = cfgFor(entity);
  if (!cfg) return null;
  return call(cfg.remove, { [cfg.idKey]: id, p_comment_id: commentId }, 'deleting comment');
}

// Przełącza reakcję. Stary format (tablica stringów) jest normalizowany
// po stronie bazy do { emoji, userId }.
export async function toggleCommentReaction(entity, id, commentId, emoji, userId) {
  const cfg = cfgFor(entity);
  if (!cfg) return null;
  return call(cfg.react, { [cfg.idKey]: id, p_comment_id: commentId, p_emoji: emoji, p_user_id: userId }, 'toggling reaction');
}
