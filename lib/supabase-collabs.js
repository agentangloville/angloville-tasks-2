import { supabase } from './supabase';

export async function getCollabs() {
  const { data, error } = await supabase
    .from('influencer_collabs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('Error fetching collabs:', error); return []; }
  return (data || []).map(mapCollab);
}

export async function createCollab(collab) {
  const { data, error } = await supabase
    .from('influencer_collabs')
    .insert([toDb(collab)])
    .select().single();
  if (error) { console.error('Error creating collab:', error); return null; }
  return data ? mapCollab(data) : null;
}

export async function updateCollab(id, updates) {
  const db = toDb(updates);
  const { data, error } = await supabase
    .from('influencer_collabs')
    .update(db).eq('id', id).select().single();
  if (error) { console.error('Error updating collab:', error); return null; }
  return data ? mapCollab(data) : null;
}

export async function deleteCollab(id) {
  const { error } = await supabase.from('influencer_collabs').delete().eq('id', id);
  if (error) { console.error('Error deleting collab:', error); return false; }
  return true;
}

function toDb(c) {
  const db = {};
  if (c.influencerName !== undefined) db.influencer_name = c.influencerName;
  if (c.instagramHandle !== undefined) db.instagram_handle = c.instagramHandle;
  if (c.instagramUrl !== undefined) db.instagram_url = c.instagramUrl;
  if (c.tiktokUrl !== undefined) db.tiktok_url = c.tiktokUrl;
  if (c.youtubeUrl !== undefined) db.youtube_url = c.youtubeUrl;
  if (c.followers !== undefined) db.followers = c.followers;
  if (c.avgEngagement !== undefined) db.avg_engagement = c.avgEngagement;
  if (c.avgViews !== undefined) db.avg_views = c.avgViews;
  if (c.market !== undefined) db.market = c.market;
  if (c.collabType !== undefined) db.collab_type = c.collabType;
  if (c.paymentAmount !== undefined) db.payment_amount = c.paymentAmount;
  if (c.discountCode !== undefined) db.discount_code = c.discountCode;
  if (c.landingPageUrl !== undefined) db.landing_page_url = c.landingPageUrl;
  if (c.deliverables !== undefined) db.deliverables = c.deliverables;
  if (c.status !== undefined) db.status = c.status;
  if (c.product !== undefined) db.product = c.product;
  if (c.campDates !== undefined) db.camp_dates = c.campDates;
  if (c.contactDate !== undefined) db.contact_date = c.contactDate;
  if (c.agreedDate !== undefined) db.agreed_date = c.agreedDate;
  if (c.publishDeadline !== undefined) db.publish_deadline = c.publishDeadline;
  if (c.publishedDate !== undefined) db.published_date = c.publishedDate;
  if (c.publicationLinks !== undefined) db.publication_links = c.publicationLinks;
  if (c.contractUrl !== undefined) db.contract_url = c.contractUrl;
  if (c.contractStatus !== undefined) db.contract_status = c.contractStatus;
  if (c.adLicense !== undefined) db.ad_license = c.adLicense;
  if (c.adLicenseDays !== undefined) db.ad_license_days = c.adLicenseDays;
  if (c.adPlatforms !== undefined) db.ad_platforms = c.adPlatforms;
  if (c.assignedTo !== undefined) db.assigned_to = c.assignedTo;
  if (c.createdBy !== undefined) db.created_by = c.createdBy;
  if (c.notes !== undefined) db.notes = c.notes;
  if (c.rejectionReason !== undefined) db.rejection_reason = c.rejectionReason;
  if (c.tags !== undefined) db.tags = c.tags;
  if (c.comments !== undefined) db.comments = c.comments;
  return db;
}

function mapCollab(row) {
  return {
    id: row.id,
    influencerName: row.influencer_name,
    instagramHandle: row.instagram_handle,
    instagramUrl: row.instagram_url,
    tiktokUrl: row.tiktok_url,
    youtubeUrl: row.youtube_url,
    followers: row.followers,
    avgEngagement: row.avg_engagement ? parseFloat(row.avg_engagement) : null,
    avgViews: row.avg_views,
    market: row.market,
    collabType: row.collab_type,
    paymentAmount: row.payment_amount ? parseFloat(row.payment_amount) : null,
    discountCode: row.discount_code,
    landingPageUrl: row.landing_page_url,
    deliverables: row.deliverables || [],
    status: row.status,
    product: row.product,
    campDates: row.camp_dates,
    contactDate: row.contact_date,
    agreedDate: row.agreed_date,
    publishDeadline: row.publish_deadline,
    publishedDate: row.published_date,
    publicationLinks: row.publication_links || [],
    contractUrl: row.contract_url,
    contractStatus: row.contract_status,
    adLicense: row.ad_license,
    adLicenseDays: row.ad_license_days,
    adPlatforms: row.ad_platforms,
    assignedTo: row.assigned_to || [],
    createdBy: row.created_by,
    notes: row.notes,
    rejectionReason: row.rejection_reason,
    tags: row.tags || [],
    comments: row.comments || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
