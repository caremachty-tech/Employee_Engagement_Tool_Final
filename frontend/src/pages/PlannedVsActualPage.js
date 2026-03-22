import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiCalendar, FiSearch, FiX, FiUpload } from 'react-icons/fi';
import { getPlanner, getActual, saveActual, deleteActualDoc } from '../utils/api';

const EVENT_TYPES = ['Birthday', 'Special Day', 'Festival', 'Webinar'];

const eventBadgeClass = {
  Birthday: 'badge-blue',
  'Special Day': 'badge-purple',
  Festival: 'badge-yellow',
  Webinar: 'badge-green'
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const emptyActual = {
  actual_date: '', actual_time: '', num_participants: '', amount_spent: '', new_files: [], existing_docs: []
};

function DetailModal({ open, onClose, record }) {
  const [actual, setActual] = useState(emptyActual);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && record) {
      getActual(record.id).then(res => {
        const d = res.data.data;
        if (d) {
          setActual({
            actual_date: d.actual_date || '',
            actual_time: d.actual_time || '',
            num_participants: d.num_participants ?? '',
            amount_spent: d.amount_spent ?? '',
            new_files: [],
            existing_docs: d.supporting_docs || []
          });
        } else {
          setActual(emptyActual);
        }
      }).catch(() => setActual(emptyActual));
    }
  }, [open, record]);

  if (!open || !record) return null;

  const set = (k, v) => setActual(p => ({ ...p, [k]: v }));

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    set('new_files', [...actual.new_files, ...files]);
  };

  const removeNewFile = (idx) => set('new_files', actual.new_files.filter((_, i) => i !== idx));

  const removeExistingDoc = async (url) => {
    try {
      await deleteActualDoc(record.id, url);
      set('existing_docs', actual.existing_docs.filter(d => d !== url));
      toast.success('Document removed');
    } catch { toast.error('Failed to remove document'); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('planner_id', record.id);
      formData.append('actual_date', actual.actual_date);
      formData.append('actual_time', actual.actual_time);
      formData.append('num_participants', actual.num_participants);
      formData.append('amount_spent', actual.amount_spent);
      actual.new_files.forEach(f => formData.append('files', f));
      await saveActual(formData);
      toast.success('Actual details saved!');
      onClose();
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  };

  const planFields = [
    { label: 'Region', value: record.region },
    { label: 'Event Name', value: record.event_name },
    { label: 'Event', value: record.event_type },
    { label: 'Event Type', value: record.event_category },
    { label: 'Proposed Date', value: formatDate(record.event_date) },
    { label: 'Proposed Timing', value: record.timing },
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
          <h3>Planned vs Actual — {record.event_name}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">

          {/* Planned Details (read-only) */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Planned Details</div>
            <div className="form-grid form-grid-2">
              {planFields.map((f, idx) => (
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

          {/* Actual Details (editable) */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Actual Details</div>
            <div className="form-grid form-grid-2">

              <div className="form-group">
                <label>Actual Date</label>
                <input type="date" value={actual.actual_date} onChange={e => set('actual_date', e.target.value)} />
              </div>

              <div className="form-group">
                <label>Actual Time</label>
                <input type="time" value={actual.actual_time} onChange={e => set('actual_time', e.target.value)} />
              </div>

              <div className="form-group">
                <label>Number of Participants</label>
                <input type="number" min="0" value={actual.num_participants} onChange={e => set('num_participants', e.target.value)} placeholder="0" />
              </div>

              <div className="form-group">
                <label>Amount Spent (₹)</label>
                <input type="number" min="0" value={actual.amount_spent} onChange={e => set('amount_spent', e.target.value)} placeholder="0" />
              </div>

              <div className="form-group full">
                <label>Supporting Documents</label>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  background: 'var(--surface-2)', border: '1px dashed var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '10px 13px',
                  fontSize: '0.9rem', color: 'var(--text-secondary)'
                }}>
                  <FiUpload /> Click to upload files
                  <input type="file" multiple style={{ display: 'none' }} onChange={handleFiles} />
                </label>
                {actual.existing_docs.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {actual.existing_docs.map((url, i) => (
                      <span key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: 'var(--surface-2)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)', padding: '4px 8px', fontSize: '0.8rem'
                      }}>
                        <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>{url.split('/').pop()}</a>
                        <button onClick={() => removeExistingDoc(url)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
                {actual.new_files.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {actual.new_files.map((f, i) => (
                      <span key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: 'var(--surface-2)', border: '1px dashed var(--border)',
                        borderRadius: 'var(--radius-sm)', padding: '4px 8px', fontSize: '0.8rem'
                      }}>
                        {f.name}
                        <button onClick={() => removeNewFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Actual'}</button>
        </div>
      </div>
    </div>
  );
}

export default function PlannedVsActualPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailRecord, setDetailRecord] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPlanner();
      setRecords(res.data.data || []);
    } catch { toast.error('Failed to load data'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = records.filter(r => {
    const matchSearch = r.event_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.region?.toLowerCase().includes(search.toLowerCase()) ||
      r.hr_spoc?.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || r.event_type === filterType;
    return matchSearch && matchType;
  });

  return (
    <>
      <div className="page-header">
        <div><h2>Planned vs Actual</h2></div>
      </div>

      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Events</div>
              <div className="card-subtitle">{filtered.length} of {records.length} events</div>
            </div>
          </div>

          <div className="action-row" style={{ flexWrap: 'wrap', gap: 10 }}>
            <div className="search-bar" style={{ flex: 1, minWidth: 200, maxWidth: 300 }}>
              <FiSearch className="search-icon" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events…" />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 'auto', minWidth: 150 }}>
              <option value="">All Types</option>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {(search || filterType) && (
              <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setFilterType(''); }}>
                <FiX /> Clear
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading-spinner"><div className="spinner" /><span>Loading…</span></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FiCalendar /></div>
              <h3>{search || filterType ? 'No matching events' : 'No events found'}</h3>
              <p>{search || filterType ? 'Try adjusting your filters' : 'Add events in the Planner page first'}</p>
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
                    <th>Proposed Date</th>
                    <th>Proposed Timing</th>
                    <th>Mode</th>
                    <th>HR SPOC</th>
                    <th>Mode of Content</th>
                    <th>Mail to Employees Date</th>
                    <th>Mail / Poster Required Date</th>
                    <th>No of Posters/Emails</th>
                    <th>Requirement to Marketing Team</th>
                    <th>Activities Planned</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const isPast = r.event_date && new Date(r.event_date) < new Date();
                    return (
                      <tr key={r.id} style={isPast ? { opacity: 0.65 } : {}}>
                        <td className="td-mono" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td><span className="td-badge badge-blue">{r.region}</span></td>
                        <td style={{ fontWeight: 500 }}>{r.event_name}</td>
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
                          <button className="btn btn-icon btn-secondary btn-sm" title="View" onClick={() => setDetailRecord(r)}>👁</button>
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

      <DetailModal open={!!detailRecord} onClose={() => setDetailRecord(null)} record={detailRecord} />
    </>
  );
}
