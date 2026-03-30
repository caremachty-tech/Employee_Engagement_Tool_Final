require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL',
  process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'
);

// ─── AUTH MIDDLEWARE ────────────────────────────────────────────────────────

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, error: 'Invalid token.' });
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
  }
};

const hasPermission = (pages) => {
  const pageList = Array.isArray(pages) ? pages : [pages];
  return (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || (req.user.permissions && pageList.some(p => req.user.permissions[p])))) {
      next();
    } else {
      res.status(403).json({ success: false, error: `Access denied. No permission for ${pageList.join(' or ')}.` });
    }
  };
};

// ─── AUTH ROUTES ────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`Login attempt for username: ${username}`);
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      console.error(`Login query error for ${username}:`, error);
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    if (!user) {
      console.warn(`User not found: ${username}`);
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    console.log(`Password check for ${username}: ${validPassword ? 'SUCCESS' : 'FAILED'}`);
    
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, permissions: user.permissions },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Old and new passwords are required' });
    }

    // 1. Fetch user from DB
    const { data: user, error } = await supabase
      .from('users')
      .select('password')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // 2. Verify old password
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Incorrect old password' });
    }

    // 3. Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', userId);

    if (updateError) throw updateError;

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ADMIN ROUTES (USER MANAGEMENT) ───────────────────────────────────────────

app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, role, permissions, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { username, password, role, permissions } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([{ username, password: hashedPassword, role: role || 'user', permissions: permissions || {} }])
      .select('id, username, role, permissions, created_at');

    if (error) throw error;
    res.status(201).json({ success: true, data: data[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, permissions } = req.body;
    
    const updateData = {};
    if (username) updateData.username = username;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = permissions;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, username, role, permissions, created_at');

    if (error) throw error;
    res.json({ success: true, data: data[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to initialize admin user if it doesn't exist
const initAdmin = async () => {
  try {
    console.log('Checking for admin user...');
    const { data, error } = await supabase.from('users').select('id, username').eq('username', 'admin').maybeSingle();
    
    if (error) {
      console.error('Error checking for admin user:', error.message);
      if (error.code === '42P01') {
        console.error('TABLE "users" DOES NOT EXIST. Please run the SQL in schema.sql in your Supabase SQL Editor.');
      }
      return;
    }

    if (!data) {
      console.log('Admin user not found. Creating default admin...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const allPermissions = {
        master: true,
        planner: true,
        planned_vs_actual: true,
        budget_utilisation: true,
        reports: true,
        planner_vs_poster: true,
        planned_vs_scheduled: true,
        scheduled_mails: true
      };
      const { error: insertError } = await supabase.from('users').insert([{
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        permissions: allPermissions
      }]);
      
      if (insertError) {
        console.error('Failed to create admin user:', insertError.message);
      } else {
        console.log('Admin user created successfully: admin / admin123');
      }
    } else {
      console.log('Admin user already exists.');
    }
  } catch (err) {
    console.error('Error in initAdmin:', err);
  }
};
initAdmin();

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
app.get('/master', authenticateToken, hasPermission('master'), async (req, res) => {
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
app.post('/master', authenticateToken, hasPermission('master'), async (req, res) => {
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
app.put('/master/:id', authenticateToken, hasPermission('master'), async (req, res) => {
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
app.delete('/master/:id', authenticateToken, hasPermission('master'), async (req, res) => {
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
app.get('/regions', authenticateToken, async (req, res) => {
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

// GET /planner - Fetch all planner records with poster status
app.get('/planner', authenticateToken, hasPermission(['planner', 'planned_vs_actual', 'planner_vs_poster', 'planned_vs_scheduled']), async (req, res) => {
  try {
    const { data: plannerData, error: plannerError } = await supabase
      .from('planner')
      .select('*, posters(poster_docs)')
      .order('created_at', { ascending: false });

    if (plannerError) throw plannerError;

    // Map the data to include a has_posters boolean
    const result = plannerData.map(p => ({
      ...p,
      has_posters: p.posters && p.posters.length > 0 && p.posters[0].poster_docs && p.posters[0].poster_docs.length > 0,
      posters: undefined // Remove the joined data if not needed in full
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('GET /planner error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /planner - Add planner record
app.post('/planner', authenticateToken, hasPermission('planner'), async (req, res) => {
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
app.put('/planner/:id', authenticateToken, hasPermission('planner'), async (req, res) => {
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
app.delete('/planner/:id', authenticateToken, hasPermission('planner'), async (req, res) => {
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
app.get('/budget-utilisation', authenticateToken, hasPermission('budget_utilisation'), async (req, res) => {
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
app.get('/reports', authenticateToken, hasPermission('reports'), async (req, res) => {
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
app.get('/planned-vs-actual/:planner_id', authenticateToken, hasPermission('planned_vs_actual'), async (req, res) => {
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
app.post('/planned-vs-actual', authenticateToken, hasPermission('planned_vs_actual'), upload.array('files'), async (req, res) => {
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
app.delete('/planned-vs-actual/doc', authenticateToken, hasPermission('planned_vs_actual'), async (req, res) => {
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

// ─── POSTER ROUTES ────────────────────────────────────────────────────────────

// GET /poster/:planner_id - Fetch poster docs for a specific planner
app.get('/poster/:planner_id', authenticateToken, hasPermission(['planner_vs_poster', 'planned_vs_scheduled']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('posters')
      .select('*')
      .eq('planner_id', req.params.planner_id)
      .maybeSingle();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /poster - Save poster documents
app.post('/poster', authenticateToken, hasPermission('planner_vs_poster'), upload.array('files'), async (req, res) => {
  try {
    const { planner_id } = req.body;
    const files = req.files || [];

    // Upload files to Supabase Storage
    const fileUrls = [];
    for (const file of files) {
      const filePath = `posters/${planner_id}/${Date.now()}_${file.originalname}`;
      const { error: uploadError } = await supabase.storage
        .from('supporting-documents')
        .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from('supporting-documents')
        .getPublicUrl(filePath);
      fileUrls.push(urlData.publicUrl);
    }

    // Upsert record in posters table
    const { data: existing } = await supabase
      .from('posters')
      .select('id, poster_docs')
      .eq('planner_id', planner_id)
      .maybeSingle();

    const allDocs = [...(existing?.poster_docs || []), ...fileUrls];

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('posters')
        .update({ poster_docs: allDocs, updated_at: new Date() })
        .eq('planner_id', planner_id)
        .select();
      if (error) throw error;
      result = data[0];
    } else {
      const { data, error } = await supabase
        .from('posters')
        .insert([{ planner_id, poster_docs: allDocs }])
        .select();
      if (error) throw error;
      result = data[0];
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('POST /poster error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /poster/doc - Remove a single poster document
app.delete('/poster/doc', authenticateToken, hasPermission('planner_vs_poster'), async (req, res) => {
  try {
    const { planner_id, url } = req.body;
    const { data: existing, error: fetchErr } = await supabase
      .from('posters')
      .select('poster_docs')
      .eq('planner_id', planner_id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    const updatedDocs = (existing?.poster_docs || []).filter(d => d !== url);
    const { error } = await supabase
      .from('posters')
      .update({ poster_docs: updatedDocs })
      .eq('planner_id', planner_id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── MAIL SEND ROUTES ─────────────────────────────────────────────────────────

// Transporter for Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: (process.env.EMAIL_USER || '').trim(),
    pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, '').trim()
  }
});

// Verify transporter
transporter.verify((error, success) => {
  if (error) {
    console.error('Nodemailer verification error:', error);
  } else {
    console.log('Nodemailer is ready to take our messages');
  }
});

// Store active cron jobs to allow cancellation
const scheduledJobs = new Map();

// Helper to reschedule all pending jobs from database on startup
const rescheduleAllJobs = async () => {
  try {
    console.log('Rescheduling pending jobs from database...');
    const { data: pendingJobs, error } = await supabase
      .from('scheduled_mails')
      .select('*, planner(*)')
      .eq('status', 'pending');

    if (error) throw error;

    pendingJobs.forEach(jobData => {
      const { id, recipient_email, subject, schedule_date, schedule_time, posters, planner, email_content } = jobData;
      
      const sDate = new Date(schedule_date);
      const sTimeParts = schedule_time.split(':').map(Number);
      
      // cron format: min hour day month day-of-week
      const cronTime = `${sTimeParts[1]} ${sTimeParts[0]} ${sDate.getDate()} ${sDate.getMonth() + 1} *`;
      
      const job = cron.schedule(cronTime, async () => {
        const mailOptions = {
          from: process.env.EMAIL_USER || 'caremachty@gmail.com',
          to: recipient_email,
          subject: `Reminder: ${subject}`,
          html: formatEventsHtml(planner ? [planner] : [], posters, email_content)
        };

        try {
          await transporter.sendMail(mailOptions);
          console.log(`Scheduled reminder sent to ${recipient_email} for job ${id}`);
          
          // Update status in DB
          await supabase
            .from('scheduled_mails')
            .update({ status: 'sent', updated_at: new Date() })
            .eq('id', id);
            
          scheduledJobs.delete(id);
        } catch (mailErr) {
          console.error(`Error sending scheduled reminder for job ${id}:`, mailErr);
        }
      });

      scheduledJobs.set(id, { 
        job, 
        to: recipient_email, 
        subject, 
        date: schedule_date, 
        time: schedule_time,
        posters,
        events: planner ? [planner] : []
      });
    });
    console.log(`Rescheduled ${pendingJobs.length} jobs.`);
  } catch (err) {
    console.error('Error rescheduling jobs:', err);
  }
};

// Helper to format events for email
const formatEventsHtml = (events, posters = [], emailContent = '') => {
  // Replace all newlines (\n or \r\n) with <br /> for reliable email formatting
  const formattedContent = emailContent ? emailContent.replace(/\r?\n/g, '<br />') : '';

  const contentHtml = formattedContent 
    ? `<div style="margin-bottom: 25px; color: #333; font-size: 1.1rem; line-height: 1.6;">${formattedContent}</div>`
    : '';

  const posterHtml = posters.length > 0 
    ? `<div style="margin-top: 20px; text-align: center;">
         <div style="display: block;">
           ${posters.map((url, i) => `
             <div style="margin-bottom: 30px;">
               <img src="${url}" alt="Event Poster" style="max-width: 800px; width: 100%; border: 1px solid #eee; border-radius: 12px; shadow: 0 4px 10px rgba(0,0,0,0.1);" />
             </div>
           `).join('')}
         </div>
       </div>`
    : (emailContent ? '' : `<div style="text-align: center; padding: 40px;">
         <p>No posters available for this event.</p>
       </div>`);

  const footerHtml = `
    <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; color: #555; font-size: 0.95rem;">
      Best Regards<br />
      Human Resource
    </div>`;

  return `
    <div style="font-family: sans-serif; max-width: 900px; margin: 0 auto; padding: 20px;">
      ${contentHtml}
      ${posterHtml}
      ${footerHtml}
    </div>
  `;
};

// POST /send-events-mail - Send immediately and/or schedule
app.post('/send-events-mail', authenticateToken, hasPermission(['scheduled_mails', 'planned_vs_scheduled']), async (req, res) => {
  try {
    const { to, events, schedule_date, schedule_time, subject, posters, email_content } = req.body;
    const record = events[0]; // For job key
    console.log(`Attempting to send mail to: ${to} for ${events?.length} events with subject: ${subject}`);
    
    if (!to || !events || !events.length) {
      console.warn('Mail send failed: Missing parameters', { to, eventCount: events?.length });
      return res.status(400).json({ success: false, error: 'Recipient email and events are required' });
    }

    // 1. Send immediate email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'caremachty@gmail.com',
      to,
      subject: subject || 'Upcoming Employee Engagement Events',
      html: formatEventsHtml(events, posters, email_content)
    };

    console.log('Sending initial email...');
    const info = await transporter.sendMail(mailOptions);
    console.log(`Initial email sent successfully: ${info.messageId}`);

    // 2. Schedule reminders
    if (schedule_date) {
      const sDate = new Date(schedule_date);
      let sTimeParts = [8, 0]; // Default 8:00 AM
      if (schedule_time) {
        sTimeParts = schedule_time.split(':').map(Number);
      }

      // Save to database
      const { data: jobData, error: dbError } = await supabase
        .from('scheduled_mails')
        .insert([{
          planner_id: record.id,
          recipient_email: to,
          subject: subject || 'Upcoming Employee Engagement Events',
          schedule_date: schedule_date,
          schedule_time: schedule_time || '08:00',
          posters: posters || [],
          email_content: email_content || null,
          status: 'pending'
        }])
        .select();

      if (dbError) throw dbError;
      const dbJob = jobData[0];

      // cron format: min hour day month day-of-week
      const cronTime = `${sTimeParts[1]} ${sTimeParts[0]} ${sDate.getDate()} ${sDate.getMonth() + 1} *`;
      
      const job = cron.schedule(cronTime, async () => {
        const reminderOptions = {
          from: process.env.EMAIL_USER || 'caremachty@gmail.com',
          to,
          subject: `Reminder: ${subject || 'Upcoming Events Schedule'}`,
          html: formatEventsHtml(events, posters, email_content)
        };
        try {
          await transporter.sendMail(reminderOptions);
          console.log(`Scheduled reminder sent to ${to} for job ${dbJob.id}`);
          
          // Update status in DB
          await supabase
            .from('scheduled_mails')
            .update({ status: 'sent', updated_at: new Date() })
            .eq('id', dbJob.id);

          scheduledJobs.delete(dbJob.id);
        } catch (mailErr) {
          console.error(`Error sending scheduled reminder for job ${dbJob.id}:`, mailErr);
        }
      });

      scheduledJobs.set(dbJob.id, { 
        job, 
        to, 
        subject, 
        date: schedule_date, 
        time: schedule_time,
        events,
        posters,
        email_content: email_content || null
      });
      console.log(`Scheduled reminder at ${cronTime} with DB ID ${dbJob.id}`);
      return res.json({ success: true, message: 'Initial email sent and reminders scheduled', job_id: dbJob.id });
    } else {
      // Original logic: Schedule for each event date if no specific schedule date provided
      events.forEach(event => {
        const eventDate = new Date(event.event_date);
        const cronTime = `0 8 ${eventDate.getDate()} ${eventDate.getMonth() + 1} *`;
        
        cron.schedule(cronTime, async () => {
          const reminderOptions = {
            from: process.env.EMAIL_USER || 'caremachty@gmail.com',
            to,
            subject: `Reminder: ${event.event_name} is happening today!`,
            html: `
              <p>Hello,</p>
              <p>This is a reminder that the event <strong>${event.event_name}</strong> is scheduled for today, ${eventDate.toLocaleDateString()}.</p>
              <p>Region: ${event.region}</p>
              <p>Type: ${event.event_type}</p>
              ${posters && posters.length > 0 ? `<p>Related documents:</p>${posters.map((u, i) => `<img src="${u}" style="max-width:400px; display:block; margin-bottom:10px;" />`).join('')}` : ''}
            `
          };
          try {
            await transporter.sendMail(reminderOptions);
            console.log(`Reminder sent for event: ${event.event_name} to ${to}`);
          } catch (mailErr) {
            console.error(`Error sending reminder for ${event.event_name}:`, mailErr);
          }
        });
      });
    }

    res.json({ success: true, message: 'Initial email sent and reminders scheduled' });
  } catch (err) {
    console.error('POST /send-events-mail error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /cancel-mail - Cancel a scheduled job
app.post('/cancel-mail', authenticateToken, hasPermission(['scheduled_mails', 'planned_vs_scheduled']), async (req, res) => {
  try {
    const { job_id } = req.body;
    
    // Stop cron job if running in memory
    if (scheduledJobs.has(job_id)) {
      const { job } = scheduledJobs.get(job_id);
      job.stop();
      scheduledJobs.delete(job_id);
    }

    // Update DB
    const { error } = await supabase
      .from('scheduled_mails')
      .update({ status: 'cancelled', updated_at: new Date() })
      .eq('id', job_id);

    if (error) throw error;

    console.log(`Cancelled job: ${job_id}`);
    res.json({ success: true, message: 'Scheduled mail cancelled' });
  } catch (err) {
    console.error('POST /cancel-mail error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /scheduled-jobs - Fetch all scheduled jobs
app.get('/scheduled-jobs', authenticateToken, hasPermission(['scheduled_mails', 'planned_vs_scheduled']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scheduled_mails')
      .select('*, planner(event_name, region, event_type)')
      .eq('status', 'pending')
      .order('schedule_date', { ascending: true });

    if (error) throw error;

    const jobs = data.map(job => ({
      id: job.id,
      to: job.recipient_email,
      subject: job.subject,
      date: job.schedule_date,
      time: job.schedule_time,
      events: job.planner ? [job.planner] : [],
      planner_id: job.planner_id,
      email_content: job.email_content
    }));

    res.json({ success: true, data: jobs });
  } catch (err) {
    console.error('GET /scheduled-jobs error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /scheduled-jobs/:id - Edit an active scheduled job
app.put('/scheduled-jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { to, subject, date, time, email_content } = req.body;

    // 1. Update DB
    const { data, error } = await supabase
      .from('scheduled_mails')
      .update({
        recipient_email: to,
        subject,
        schedule_date: date,
        schedule_time: time,
        email_content: email_content || null,
        updated_at: new Date()
      })
      .eq('id', id)
      .select('*, planner(*)');

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const updatedJobData = data[0];

    // 2. Reschedule in memory
    if (scheduledJobs.has(id)) {
      scheduledJobs.get(id).job.stop();
    }

    const sDate = new Date(date);
    const sTimeParts = time.split(':').map(Number);
    const cronTime = `${sTimeParts[1]} ${sTimeParts[0]} ${sDate.getDate()} ${sDate.getMonth() + 1} *`;

    const newJob = cron.schedule(cronTime, async () => {
      const reminderOptions = {
        from: process.env.EMAIL_USER || 'caremachty@gmail.com',
        to: to,
        subject: `Reminder: ${subject}`,
        html: formatEventsHtml(updatedJobData.planner ? [updatedJobData.planner] : [], updatedJobData.posters, email_content)
      };
      try {
        await transporter.sendMail(reminderOptions);
        console.log(`Updated scheduled reminder sent to ${to} for job ${id}`);
        
        await supabase
          .from('scheduled_mails')
          .update({ status: 'sent', updated_at: new Date() })
          .eq('id', id);

        scheduledJobs.delete(id);
      } catch (mailErr) {
        console.error(`Error sending updated scheduled reminder for job ${id}:`, mailErr);
      }
    });

    scheduledJobs.set(id, {
      job: newJob,
      to,
      subject,
      date,
      time,
      posters: updatedJobData.posters,
      email_content: email_content || null
    });

    res.json({ success: true, message: 'Scheduled mail updated successfully' });
  } catch (err) {
    console.error('PUT /scheduled-jobs/:id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /scheduled-jobs/:id - Delete an active scheduled job
app.delete('/scheduled-jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Stop job if in memory
    if (scheduledJobs.has(id)) {
      scheduledJobs.get(id).job.stop();
      scheduledJobs.delete(id);
    }

    // 2. Delete from DB
    const { error } = await supabase
      .from('scheduled_mails')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Scheduled mail deleted' });
  } catch (err) {
    console.error('DELETE /scheduled-jobs/:id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    // Reschedule all pending jobs on startup
    await rescheduleAllJobs();
  });
}

module.exports = app;
