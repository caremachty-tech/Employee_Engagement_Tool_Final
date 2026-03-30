import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiCalendar, FiSearch, FiX, FiUpload, FiFile, FiTrash2, FiDownload } from 'react-icons/fi';
import { getPlanner, getPoster, savePoster, deletePosterDoc } from '../utils/api';
import { exportToExcel } from '../utils/export';

const eventBadgeClass = {
  Birthday: 'badge-blue',
  'Special Day': 'badge-purple',
  Festival: 'badge-yellow',
  Webinar: 'badge-green'
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const emptyPoster = {
  new_files: [], existing_docs: []
};

function PosterDetailModal({ open, onClose, record }) {
  const [poster, setPoster] = useState(emptyPoster);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPosterData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPoster(record.id);
      if (res.data.success && res.data.data) {
        setPoster({
          new_files: [],
          existing_docs: res.data.data.poster_docs || []
        });
      } else {
        setPoster(emptyPoster);
      }
    } catch (err) {
      console.error('Error fetching poster data:', err);
      setPoster(emptyPoster);
    } finally {
      setLoading(false);
    }
  }, [record?.id]);

  useEffect(() => {
    if (open && record) {
      fetchPosterData();
    }
  }, [open, record, fetchPosterData]);

  if (!open || !record) return null;

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    setPoster(p => ({ ...p, new_files: [...p.new_files, ...files] }));
  };

  const removeNewFile = (idx) => setPoster(p => ({ ...p, new_files: p.new_files.filter((_, i) => i !== idx) }));

  const removeExistingDoc = async (url) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await deletePosterDoc(record.id, url);
      setPoster(p => ({ ...p, existing_docs: p.existing_docs.filter(d => d !== url) }));
      toast.success('Document removed');
    } catch { toast.error('Failed to remove document'); }
  };

  const handleSave = async () => {
    if (poster.new_files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('planner_id', record.id);
      poster.new_files.forEach(f => formData.append('files', f));
      const res = await savePoster(formData);
      if (res.data.success) {
        toast.success('Posters uploaded successfully!');
        fetchPosterData(); // Refresh list
      }
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
          <h3>Planner vs Poster — {record.event_name}</h3>
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

          {/* Poster Upload Section */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Poster Documents</div>
            
            <div className="form-group full">
              <label>Upload Posters</label>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                background: 'var(--surface-2)', border: '1px dashed var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '10px 13px',
                fontSize: '0.9rem', color: 'var(--text-secondary)'
              }}>
                <FiUpload /> Click to upload posters
                <input type="file" multiple style={{ display: 'none' }} onChange={handleFiles} />
              </label>

              {/* Existing Docs */}
              {poster.existing_docs.length > 0 && (
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {poster.existing_docs.map((url, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '0.85rem'
                    }}>
                      <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                        <FiFile className="flex-shrink-0" />
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Document {i + 1}</span>
                      </a>
                      <button onClick={() => removeExistingDoc(url)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New Files Preview */}
              {poster.new_files.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {poster.new_files.map((f, i) => (
                    <span key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: 'var(--accent-light)', color: 'var(--accent)', border: '1px dashed var(--accent)',
                      borderRadius: 'var(--radius-sm)', padding: '4px 8px', fontSize: '0.8rem'
                    }}>
                      {f.name}
                      <button onClick={() => removeNewFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || poster.new_files.length === 0}>
            {saving ? 'Uploading...' : 'Upload New Posters'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PlannerVsPosterPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailRecord, setDetailRecord] = useState(null);
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  const months = [
    { value: '0', label: 'January' }, { value: '1', label: 'February' }, { value: '2', label: 'March' },
    { value: '3', label: 'April' }, { value: '4', label: 'May' }, { value: '5', label: 'June' },
    { value: '6', label: 'July' }, { value: '7', label: 'August' }, { value: '8', label: 'September' },
    { value: '9', label: 'October' }, { value: '10', label: 'November' }, { value: '11', label: 'December' }
  ];

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
      r.region?.toLowerCase().includes(search.toLowerCase());
    const matchMonth = !filterMonth || (r.event_date && new Date(r.event_date).getMonth() === parseInt(filterMonth));
    return matchSearch && matchMonth;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Planner vs Poster</h1>
          <p className="subtitle">View planned details and upload posters</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-success btn-sm" onClick={() => exportToExcel(records, 'planner_vs_poster')}>
            <FiDownload /> Export
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Event List</div>
              <div className="card-subtitle">{filtered.length} of {records.length} events</div>
            </div>
          </div>

          <div className="action-row" style={{ flexWrap: 'wrap', gap: 10 }}>
            <div className="search-bar" style={{ flex: 1, minWidth: 200, maxWidth: 300 }}>
              <FiSearch className="search-icon" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events…" />
            </div>
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ width: 'auto', minWidth: 150 }}>
              <option value="">All Months</option>
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            {(search || filterMonth) && (
              <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setFilterMonth(''); }}>
                <FiX /> Clear
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading-spinner"><div className="spinner" /><span>Loading…</span></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FiCalendar /></div>
              <h3>No matching events</h3>
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
                    <th>Poster Uploaded</th>
                    <th>Requirement to Marketing Team</th>
                    <th>Activities Planned</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r.id}>
                      <td className="td-mono">{i + 1}</td>
                      <td><span className="td-badge badge-blue">{r.region}</span></td>
                      <td style={{ fontWeight: 500 }}>{r.event_name}</td>
                      <td><span className={`td-badge ${eventBadgeClass[r.event_type] || 'badge-blue'}`}>{r.event_type}</span></td>
                      <td>{r.event_category || '—'}</td>
                      <td className="td-mono">{formatDate(r.event_date)}</td>
                      <td className="td-mono">{r.timing || '—'}</td>
                      <td><span className={`td-badge ${r.mode === 'Online' ? 'badge-green' : 'badge-yellow'}`}>{r.mode || '—'}</span></td>
                      <td>{r.hr_spoc || '—'}</td>
                      <td>{r.content_mode || '—'}</td>
                      <td className="td-mono">{formatDate(r.mail_to_employees)}</td>
                      <td className="td-mono">{formatDate(r.poster_required_date)}</td>
                      <td className="td-mono">{r.no_of_posters_emails ?? '—'}</td>
                      <td>
                        {r.has_posters ? (
                          <span className="badge badge-green">Yes</span>
                        ) : (
                          <span className="badge badge-red">No</span>
                        )}
                      </td>
                      <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.requirement_to_marketing || '—'}</td>
                      <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.plan_of_activity || '—'}</td>
                      <td>
                        <button className="btn btn-icon btn-secondary btn-sm" title="View Details & Upload" onClick={() => setDetailRecord(r)}>
                          👁
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <PosterDetailModal 
        open={!!detailRecord} 
        onClose={() => { setDetailRecord(null); fetchAll(); }} 
        record={detailRecord} 
      />
    </div>
  );
}
