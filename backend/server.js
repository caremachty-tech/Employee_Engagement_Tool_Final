require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL',
  process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'
);

// ─── HEALTH CHECK & ROOT ───────────────────────────────────────────────────

app.get('/health', (req, res) => res.json({ 
  status: 'ok', 
  timestamp: new Date().toISOString(),
  deployment: 'v3-final'
}));
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.get('/', (req, res) => res.json({ 
  message: 'Employee Engagement API is running',
  version: '1.0.0',
  endpoints: ['/master', '/planner', '/regions', '/budget-utilisation', '/reports', '/health']
}));

// ─── MASTER ROUTES ────────────────────────────────────────────────────────────

// GET /master - Fetch all master records
app.get('/master', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('master')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error('GET /master error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /master - Add master record
app.post('/master', async (req, res) => {
  try {
    const { region } = req.body;
    const head_count = parseFloat(req.body.head_count);
    const birthday_budget_per_head = parseFloat(req.body.birthday_budget_per_head);
    const birthday_events = parseFloat(req.body.birthday_events);
    const festival_budget_per_head = parseFloat(req.body.festival_budget_per_head);
    const festival_events = parseFloat(req.body.festival_events);

    if (!region || isNaN(head_count) || isNaN(birthday_budget_per_head) || isNaN(birthday_events) || isNaN(festival_budget_per_head) || isNaN(festival_events)) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const birthday_amount = head_count * birthday_budget_per_head * birthday_events;
    const festival_amount = head_count * festival_budget_per_head * festival_events;
    const total_amount = birthday_amount + festival_amount;

    const { data, error } = await supabase
      .from('master')
      .insert([{ region, head_count, birthday_budget_per_head, birthday_events, festival_budget_per_head, festival_events, birthday_amount, festival_amount, total_amount }])
      .select();

    if (error) throw error;
    res.status(201).json({ success: true, data: data[0] });
  } catch (err) {
    console.error('POST /master error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /master/:id - Update master record
app.put('/master/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { region } = req.body;
    const head_count = parseFloat(req.body.head_count);
    const birthday_budget_per_head = parseFloat(req.body.birthday_budget_per_head);
    const birthday_events = parseFloat(req.body.birthday_events);
    const festival_budget_per_head = parseFloat(req.body.festival_budget_per_head);
    const festival_events = parseFloat(req.body.festival_events);

    const birthday_amount = head_count * birthday_budget_per_head * birthday_events;
    const festival_amount = head_count * festival_budget_per_head * festival_events;
    const total_amount = birthday_amount + festival_amount;

    const { data, error } = await supabase
      .from('master')
      .update({ region, head_count, birthday_budget_per_head, birthday_events, festival_budget_per_head, festival_events, birthday_amount, festival_amount, total_amount })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json({ success: true, data: data[0] });
  } catch (err) {
    console.error('PUT /master/:id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /master/:id - Delete master record
app.delete('/master/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('master').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Record deleted' });
  } catch (err) {
    console.error('DELETE /master/:id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /regions - Fetch distinct regions for dropdown
app.get('/regions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('master')
      .select('region')
      .order('region');

    if (error) throw error;
    const regions = [...new Set(data.map(d => d.region))];
    res.json({ success: true, data: regions });
  } catch (err) {
    console.error('GET /regions error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PLANNER ROUTES ───────────────────────────────────────────────────────────

// GET /planner - Fetch all planner records
app.get('/planner', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('planner')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error('GET /planner error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /planner - Add planner record
app.post('/planner', async (req, res) => {
  try {
    const {
      region, event_type, event_category, event_date, event_name, timing,
      mode, meeting_link, plan_of_activity, hr_spoc,
      mail_to_employees, poster_required_date, content_mode, no_of_posters_emails
    } = req.body;

    if (!region || !event_type || !event_date || !event_name) {
      return res.status(400).json({ success: false, error: 'Required fields missing' });
    }

    const { data, error } = await supabase
      .from('planner')
      .insert([{
        region, event_type, event_category, event_date, event_name, timing,
        mode, meeting_link: mode === 'Online' ? meeting_link : null,
        plan_of_activity, hr_spoc, mail_to_employees,
        poster_required_date, content_mode,
        no_of_posters_emails: no_of_posters_emails ? parseInt(no_of_posters_emails) : null,
        requirement_to_marketing: req.body.requirement_to_marketing || null
      }])
      .select();

    if (error) throw error;
    res.status(201).json({ success: true, data: data[0] });
  } catch (err) {
    console.error('POST /planner error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /planner/:id - Update planner record
app.put('/planner/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };
    if (payload.mode !== 'Online') payload.meeting_link = null;
    if (payload.no_of_posters_emails) payload.no_of_posters_emails = parseInt(payload.no_of_posters_emails);

    const { data, error } = await supabase
      .from('planner')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json({ success: true, data: data[0] });
  } catch (err) {
    console.error('PUT /planner/:id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /planner/:id - Delete planner record
app.delete('/planner/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('planner').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Record deleted' });
  } catch (err) {
    console.error('DELETE /planner/:id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /budget-utilisation - Master records with utilised and balance amounts
app.get('/budget-utilisation', async (req, res) => {
  try {
    const { data: masterData, error: masterError } = await supabase
      .from('master')
      .select('*')
      .order('created_at', { ascending: false });
    if (masterError) throw masterError;

    // Get all planner ids grouped by region
    const { data: plannerData, error: plannerError } = await supabase
      .from('planner')
      .select('id, region');
    if (plannerError) throw plannerError;

    // Get all planned_vs_actual records
    const { data: actualData, error: actualError } = await supabase
      .from('planned_vs_actual')
      .select('planner_id, amount_spent');
    if (actualError) throw actualError;

    // Build a map of planner_id -> region
    const plannerRegionMap = {};
    plannerData.forEach(p => { plannerRegionMap[p.id] = p.region; });

    // Sum amount_spent per region
    const utilisedByRegion = {};
    actualData.forEach(a => {
      const region = plannerRegionMap[a.planner_id];
      if (region && a.amount_spent) {
        utilisedByRegion[region] = (utilisedByRegion[region] || 0) + parseFloat(a.amount_spent);
      }
    });

    const result = masterData.map(m => ({
      ...m,
      utilised_amount: utilisedByRegion[m.region] || 0,
      balance_amount: parseFloat(m.total_amount) - (utilisedByRegion[m.region] || 0)
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('GET /budget-utilisation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /reports - Planner joined with actual data
app.get('/reports', async (req, res) => {
  try {
    const { data: plannerData, error: plannerError } = await supabase
      .from('planner')
      .select('id, region, event_type, event_category, event_name, event_date')
      .order('event_date', { ascending: false });
    if (plannerError) throw plannerError;

    const { data: actualData, error: actualError } = await supabase
      .from('planned_vs_actual')
      .select('planner_id, actual_date, num_participants, amount_spent');
    if (actualError) throw actualError;

    const actualMap = {};
    actualData.forEach(a => { actualMap[a.planner_id] = a; });

    const result = plannerData.map(p => ({
      ...p,
      actual_date: actualMap[p.id]?.actual_date || null,
      num_participants: actualMap[p.id]?.num_participants ?? null,
      amount_spent: actualMap[p.id]?.amount_spent ?? null
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('GET /reports error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Root route
app.get('/', (req, res) => res.json({ 
  message: 'Employee Engagement API is running',
  version: '1.0.0',
  endpoints: ['/master', '/planner', '/regions', '/budget-utilisation', '/reports', '/health']
}));

// ─── PLANNED VS ACTUAL ROUTES ─────────────────────────────────────────────────

// GET /planned-vs-actual/:planner_id - Get actual record for a planner event
app.get('/planned-vs-actual/:planner_id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('planned_vs_actual')
      .select('*')
      .eq('planner_id', req.params.planner_id)
      .maybeSingle();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /planned-vs-actual - Save actual details with file uploads
app.post('/planned-vs-actual', upload.array('files'), async (req, res) => {
  try {
    const { planner_id, actual_date, actual_time, num_participants, amount_spent } = req.body;
    const files = req.files || [];

    // Upload files to Supabase Storage
    const fileUrls = [];
    for (const file of files) {
      const filePath = `${planner_id}/${Date.now()}_${file.originalname}`;
      const { error: uploadError } = await supabase.storage
        .from('supporting-documents')
        .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from('supporting-documents')
        .getPublicUrl(filePath);
      fileUrls.push(urlData.publicUrl);
    }

    // Upsert record
    const { data: existing } = await supabase
      .from('planned_vs_actual')
      .select('id, supporting_docs')
      .eq('planner_id', planner_id)
      .maybeSingle();

    const allDocs = [...(existing?.supporting_docs || []), ...fileUrls];

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('planned_vs_actual')
        .update({ actual_date: actual_date || null, actual_time: actual_time || null, num_participants: num_participants ? parseInt(num_participants) : null, amount_spent: amount_spent ? parseFloat(amount_spent) : null, supporting_docs: allDocs, updated_at: new Date() })
        .eq('planner_id', planner_id)
        .select();
      if (error) throw error;
      result = data[0];
    } else {
      const { data, error } = await supabase
        .from('planned_vs_actual')
        .insert([{ planner_id, actual_date: actual_date || null, actual_time: actual_time || null, num_participants: num_participants ? parseInt(num_participants) : null, amount_spent: amount_spent ? parseFloat(amount_spent) : null, supporting_docs: allDocs }])
        .select();
      if (error) throw error;
      result = data[0];
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('POST /planned-vs-actual error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /planned-vs-actual/doc - Remove a single document
app.delete('/planned-vs-actual/doc', async (req, res) => {
  try {
    const { planner_id, url } = req.body;
    const { data: existing, error: fetchErr } = await supabase
      .from('planned_vs_actual')
      .select('supporting_docs')
      .eq('planner_id', planner_id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    const updatedDocs = (existing?.supporting_docs || []).filter(d => d !== url);
    const { error } = await supabase
      .from('planned_vs_actual')
      .update({ supporting_docs: updatedDocs })
      .eq('planner_id', planner_id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

module.exports = app;
