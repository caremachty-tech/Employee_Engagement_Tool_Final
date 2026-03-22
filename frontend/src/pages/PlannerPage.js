import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  FiCalendar, FiEdit2, FiTrash2, FiDownload, FiSearch,
  FiCheckCircle, FiMenu, FiPlus, FiX
} from 'react-icons/fi';
import { getPlanner, addPlanner, updatePlanner, deletePlanner, getRegions } from '../utils/api';
import { exportToExcel } from '../utils/export';

const emptyForm = {
  region: '', event_type: '', event_category: '', event_date: '', event_name: '',
  timing: '', mode: '', meeting_link: '', plan_of_activity: '',
  hr_spoc: '', mail_to_employees: '', poster_required_date: '', content_mode: '',
  no_of_posters_emails: '',
  requirement_to_marketing: ''
};

const EVENT_TYPES = ['Birthday', 'Special Day', 'Festival', 'Webinar'];
const EVENT_CATEGORIES = ['Activities','Celebrations','Mail','Webinar'];
const MODES = ['Online', 'Offline'];

const eventBadgeClass = {
  Birthday: 'badge-blue',
  'Special Day': 'badge-purple',
  Festival: 'badge-yellow',
  Webinar: 'badge-green'
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function PlannerFormModal({ open, onClose, onSave, editData, regions }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(editData ? { ...emptyForm, ...editData } : emptyForm);
      setErrors({});
    }
  }, [open, editData]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.region) e.region = 'Required';
    if (!form.event_type) e.event_type = 'Required';
    if (!form.event_date) e.event_date = 'Required';
    if (!form.event_name.trim()) e.event_name = 'Required';
    if (!form.mode) e.mode = 'Required';
    if (form.mode === 'Online' && !form.meeting_link.trim()) e.meeting_link = 'Required for Online mode';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch {}
    setSaving(false);
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>{editData ? 'Edit Event Plan' : 'Plan New Event'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid form-grid-2">

            {/* Region */}
            <div className="form-group">
              <label>Region <span className="required">*</span></label>
              <select className={errors.region ? 'error' : ''} value={form.region} onChange={e => set('region', e.target.value)}>
                <option value="">Select Region</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors.region && <span className="form-error">{errors.region}</span>}
            </div>

            {/* Event Type */}
            <div className="form-group">
              <label>Event<span className="required">*</span></label>
              <select className={errors.event_type ? 'error' : ''} value={form.event_type} onChange={e => set('event_type', e.target.value)}>
                <option value="">Select Type</option>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.event_type && <span className="form-error">{errors.event_type}</span>}
            </div>

            {/* Event Type (dropdown) */}
            <div className="form-group">
              <label>Event Type</label>
              <select value={form.event_category} onChange={e => set('event_category', e.target.value)}>
                <option value="">Select Event Type</option>
                {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            

            {/* Event Name */}
            <div className="form-group">
              <label>Event Name <span className="required">*</span></label>
              <input className={errors.event_name ? 'error' : ''} value={form.event_name} onChange={e => set('event_name', e.target.value)} placeholder="e.g. Q1 Town Hall" />
              {errors.event_name && <span className="form-error">{errors.event_name}</span>}
            </div>

            {/* Event Date */}
            <div className="form-group">
              <label>Event Date <span className="required">*</span></label>
              <input type="date" className={errors.event_date ? 'error' : ''} value={form.event_date} onChange={e => set('event_date', e.target.value)} />
              {errors.event_date && <span className="form-error">{errors.event_date}</span>}
            </div>

            {/* Timing */}
            <div className="form-group">
              <label>Timing</label>
              <input type="time" value={form.timing} onChange={e => set('timing', e.target.value)} />
            </div>

            {/* Mode */}
            <div className="form-group full">
              <label>Mode <span className="required">*</span></label>
              <select className={errors.mode ? 'error' : ''} value={form.mode} onChange={e => set('mode', e.target.value)}>
                <option value="">Select Mode</option>
                {MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {errors.mode && <span className="form-error">{errors.mode}</span>}
            </div>

            {/* Meeting Link — conditional */}
            {form.mode === 'Online' && (
              <div className="form-group full">
                <label>Meeting Link <span className="required">*</span></label>
                <input
                  className={errors.meeting_link ? 'error' : ''}
                  value={form.meeting_link}
                  onChange={e => set('meeting_link', e.target.value)}
                  placeholder="https://meet.google.com/..."
                />
                {errors.meeting_link && <span className="form-error">{errors.meeting_link}</span>}
              </div>
            )}

            {/* Plan of Activity */}
            <div className="form-group full">
              <label>Activities Planned</label>
              <textarea value={form.plan_of_activity} onChange={e => set('plan_of_activity', e.target.value)} placeholder="Describe the agenda and activities…" />
            </div>

            {/* HR SPOC */}
            <div className="form-group full">
              <label>HR SPOC</label>
              <input value={form.hr_spoc} onChange={e => set('hr_spoc', e.target.value)} placeholder="Name of HR point of contact" />
            </div>

            {/* Mode of Content */}
            <div className="form-group">
              <label>Mode of Content</label>
              <input value={form.content_mode} onChange={e => set('content_mode', e.target.value)} placeholder="e.g. PPT, Video, PDF…" />
            </div>

            {/* Mail to Employees */}
            <div className="form-group">
              <label>Mail to Employees Date</label>
              <input type="date" value={form.mail_to_employees} onChange={e => set('mail_to_employees', e.target.value)} />
            </div>

            {/* Poster Required Date */}
            <div className="form-group">
              <label>Mail / Poster Required Date</label>
              <input type="date" value={form.poster_required_date} onChange={e => set('poster_required_date', e.target.value)} />
            </div>

            {/* No of Posters/Emails */}
            <div className="form-group">
              <label>No of Posters/Emails</label>
              <input type="number" min="0" value={form.no_of_posters_emails} onChange={e => set('no_of_posters_emails', e.target.value)} placeholder="0" />
            </div>

            {/* Requirement to Marketing Team */}
            <div className="form-group full">
              <label>Requirement to Marketing Team</label>
              <textarea value={form.requirement_to_marketing} onChange={e => set('requirement_to_marketing', e.target.value)} placeholder="Describe requirements for the marketing team…" />
            </div>

          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : (editData ? 'Update Event' : 'Save Event')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ open, onClose, onConfirm, loading }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal confirm-dialog">
        <div className="modal-header">
          <h3>⚠️ Delete Event</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to delete this event plan? This cannot be undone.</p>
          <div className="modal-footer" style={{ padding: 0, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
              {loading ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ open, onClose, record }) {
  if (!open || !record) return null;
  const fields = [
    { label: 'Region', value: record.region },
    { label: 'Event Name', value: record.event_name },
    { label: 'Event', value: record.event_type },
    { label: 'Event Type', value: record.event_category },
    { label: 'Date', value: formatDate(record.event_date) },
    { label: 'Timing', value: record.timing },
    { label: 'Mode', value: record.mode },
    { label: 'Meeting Link', value: record.meeting_link },
    { label: 'HR SPOC', value: record.hr_spoc },
    { label: 'Mode of Content', value: record.content_mode },
    { label: 'Mail to Employees Date', value: formatDate(record.mail_to_employees) },
    { label: 'Mail / Poster Required Date', value: formatDate(record.poster_required_date) },
    { label: 'No of Posters/Emails', value: record.no_of_posters_emails != null ? String(record.no_of_posters_emails) : '' },
    { label: 'Requirement to Marketing Team', value: record.requirement_to_marketing, full: true },
    { label: 'Activities Planned', value: record.plan_of_activity, full: true },
  ];
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>Event Details — {record.event_name}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid form-grid-2">
            {fields.map((f, idx) => (
              <div key={idx} className={`form-group ${f.full ? 'full' : ''}`}>
                <label>{f.label}</label>
                <div style={{
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '10px 13px',
                  fontSize: '0.9rem', color: 'var(--text-primary)',
                  whiteSpace: f.full ? 'pre-wrap' : 'normal'
                }}>{f.value || '—'}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function PlannerPage({ onMenuClick }) {
  const [records, setRecords] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [detailRecord, setDetailRecord] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterRegion, setFilterRegion] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [planRes, regRes] = await Promise.all([getPlanner(), getRegions()]);
      setRecords(planRes.data.data || []);
      setRegions(regRes.data.data || []);
    } catch { toast.error('Failed to load data'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSave = async (form) => {
    if (editData) {
      const res = await updatePlanner(editData.id, form);
      setRecords(r => r.map(x => x.id === editData.id ? res.data.data : x));
      toast.success('Event updated!');
    } else {
      const res = await addPlanner(form);
      setRecords(r => [res.data.data, ...r]);
      toast.success('Event saved! 🎉');
    }
    setEditData(null);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePlanner(deleteId);
      setRecords(r => r.filter(x => x.id !== deleteId));
      toast.success('Event deleted');
      setDeleteId(null);
    } catch { toast.error('Delete failed'); }
    setDeleting(false);
  };

  const filtered = records.filter(r => {
    const matchSearch = r.event_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.region?.toLowerCase().includes(search.toLowerCase()) ||
      r.hr_spoc?.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || r.event_type === filterType;
    const matchRegion = !filterRegion || r.region === filterRegion;
    return matchSearch && matchType && matchRegion;
  });

  const upcomingCount = records.filter(r => r.event_date && new Date(r.event_date) >= new Date()).length;
  const uniqueRegions = [...new Set(records.map(r => r.region))].length;

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <h2>Event Planner</h2>
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-success btn-sm" onClick={() => exportToExcel(records, 'planner')}>
            <FiDownload /> Export
          </button>
          <button className="btn btn-primary" onClick={() => { setEditData(null); setModalOpen(true); }}>
            <FiPlus /> Plan Event
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Total Events</div>
            <div className="stat-value">{records.length}</div>
            <div className="stat-sub">All planned events</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Upcoming</div>
            <div className="stat-value">{upcomingCount}</div>
            <div className="stat-sub">From today onwards</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Regions Active</div>
            <div className="stat-value">{uniqueRegions}</div>
            <div className="stat-sub">With planned events</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Event Types</div>
            <div className="stat-value">{[...new Set(records.map(r => r.event_type))].length}</div>
            <div className="stat-sub">Distinct categories</div>
          </div>
        </div>

        {/* Table Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Planned Events</div>
              <div className="card-subtitle">{filtered.length} of {records.length} events</div>
            </div>
          </div>

          {/* Filters */}
          <div className="action-row" style={{ flexWrap: 'wrap', gap: 10 }}>
            <div className="search-bar" style={{ flex: 1, minWidth: 200, maxWidth: 300 }}>
              <FiSearch className="search-icon" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events…" />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 'auto', minWidth: 150 }}>
              <option value="">All Types</option>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} style={{ width: 'auto', minWidth: 150 }}>
              <option value="">All Regions</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {(search || filterType || filterRegion) && (
              <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setFilterType(''); setFilterRegion(''); }}>
                <FiX /> Clear
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading-spinner"><div className="spinner" /><span>Loading…</span></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FiCalendar /></div>
              <h3>{search || filterType || filterRegion ? 'No matching events' : 'No events planned yet'}</h3>
              <p>{search || filterType || filterRegion ? 'Try adjusting your filters' : 'Click "+ Plan Event" to get started'}</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Region</th>
                    <th>Event Name</th>
                    <th>Event</th>
                    <th>Event Type</th>
                    <th>Date</th>
                    <th>Timing</th>
                    <th>Mode</th>
                    <th>HR SPOC</th>
                    <th>Mode of Content</th>
                    <th>Mail to Employees Date</th>
                    <th>Mail / Poster Required Date</th>
                    <th>No of Posters/Emails</th>
                    <th>Requirement to Marketing Team</th>
                    <th>Activities Planned</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const isPast = r.event_date && new Date(r.event_date) < new Date();
                    return (
                      <tr key={r.id} style={isPast ? { opacity: 0.65 } : {}}>
                        <td className="td-mono" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td><span className="td-badge badge-blue">{r.region}</span></td>
                        <td>
                          <button
                            onClick={() => setDetailRecord(r)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 500, textAlign: 'left', padding: 0, fontFamily: 'var(--font)' }}
                          >
                            {r.event_name}
                          </button>
                        </td>
                        <td><span className={`td-badge ${eventBadgeClass[r.event_type] || 'badge-blue'}`}>{r.event_type}</span></td>
                        <td>{r.event_category || '—'}</td>
                        <td className="td-mono">{formatDate(r.event_date)}</td>
                        <td className="td-mono">{r.timing || '—'}</td>
                        <td><span className={`td-badge ${r.mode === 'Online' ? 'badge-green' : 'badge-yellow'}`}>{r.mode || '—'}</span></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{r.hr_spoc || '—'}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{r.content_mode || '—'}</td>
                        <td className="td-mono">{formatDate(r.mail_to_employees)}</td>
                        <td className="td-mono">{formatDate(r.poster_required_date)}</td>
                        <td className="td-mono">{r.no_of_posters_emails ?? '—'}</td>
                        <td style={{ color: 'var(--text-secondary)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.requirement_to_marketing || '—'}</td>
                        <td style={{ color: 'var(--text-secondary)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.plan_of_activity || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-icon btn-secondary btn-sm" title="View" onClick={() => setDetailRecord(r)}>
                              👁
                            </button>
                            <button className="btn btn-icon btn-secondary btn-sm" title="Edit" onClick={() => { setEditData(r); setModalOpen(true); }}>
                              <FiEdit2 />
                            </button>
                            <button className="btn btn-icon btn-danger btn-sm" title="Delete" onClick={() => setDeleteId(r.id)}>
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <PlannerFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        onSave={handleSave}
        editData={editData}
        regions={regions}
      />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} />
      <DetailModal open={!!detailRecord} onClose={() => setDetailRecord(null)} record={detailRecord} />
    </>
  );
}
