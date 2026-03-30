import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiCalendar, FiSearch, FiX, FiMail, FiClock, FiFile, FiSlash, FiDownload } from 'react-icons/fi';
import { getPlanner, sendEventsMail, getPoster, cancelScheduledMail, getScheduledJobs } from '../utils/api';
import { exportToExcel } from '../utils/export';

const eventBadgeClass = {
  Birthday: 'badge-blue',
  'Special Day': 'badge-purple',
  Festival: 'badge-yellow',
  Webinar: 'badge-green'
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function ScheduleMailModal({ open, onClose, record, scheduledJobs }) {
  const [mailId, setMailId] = useState('');
  const [mailDate, setMailDate] = useState('');
  const [mailTime, setMailTime] = useState('');
  const [mailSubject, setMailSubject] = useState('');
  const [mailContent, setMailContent] = useState('');
  const [sending, setSending] = useState(false);
  const [posters, setPosters] = useState([]);
  const [loadingPosters, setLoadingPosters] = useState(false);
  const [activeJobId, setActiveJobId] = useState(null);

  useEffect(() => {
    if (open && record) {
      setMailSubject(`Schedule for ${record.event_name}`);
      
      // Check for existing job
      const existingJob = scheduledJobs.find(j => String(j.planner_id) === String(record.id));
      if (existingJob) {
        setActiveJobId(existingJob.id);
        setMailId(existingJob.to || '');
        setMailDate(existingJob.date || '');
        setMailTime(existingJob.time || '');
        setMailSubject(existingJob.subject || '');
        setMailContent(existingJob.email_content || '');
      } else {
        setActiveJobId(null);
        setMailId('');
        setMailDate('');
        setMailTime('');
        setMailContent('');
      }

      setLoadingPosters(true);
      getPoster(record.id)
        .then(res => {
          if (res.data.success && res.data.data) {
            setPosters(res.data.data.poster_docs || []);
          } else {
            setPosters([]);
          }
        })
        .catch(err => {
          console.error('Error fetching posters:', err);
          setPosters([]);
        })
        .finally(() => setLoadingPosters(false));
    }
  }, [open, record, scheduledJobs]);

  if (!open || !record) return null;

  const handleScheduleMail = async () => {
    if (!mailId || !mailDate || !mailTime) {
      toast.error('Please fill in all fields (Mail ID, Date, and Time)');
      return;
    }

    setSending(true);
    try {
      const res = await sendEventsMail({
        to: mailId,
        events: [record],
        schedule_date: mailDate,
        schedule_time: mailTime,
        subject: mailSubject,
        email_content: mailContent,
        posters: posters
      });

      if (res.data.success) {
        toast.success('Email sent immediately and reminder scheduled successfully!');
        setActiveJobId(res.data.job_id);
      } else {
        toast.error(res.data.error || 'Failed to schedule mail');
      }
    } catch (err) {
      console.error('Schedule mail error:', err);
      const errorMsg = err.response?.data?.error || 'Error scheduling mail';
      toast.error(errorMsg);
    } finally {
      setSending(false);
    }
  };

  const handleCancelMail = async () => {
    if (!activeJobId) return;
    try {
      const res = await cancelScheduledMail(activeJobId);
      if (res.data.success) {
        toast.success('Scheduled mail cancelled');
        setActiveJobId(null);
      }
    } catch (err) {
      toast.error('Failed to cancel mail');
    }
  };

  const planFields = [
    { label: 'Region', value: record.region },
    { label: 'Event Name', value: record.event_name },
    { label: 'Event', value: record.event_type },
    { label: 'Event Type', value: record.event_category },
    { label: 'Proposed Date', value: formatDate(record.event_date) },
    { label: 'Proposed Timing', value: record.timing },
    { label: 'Mode', value: record.mode },
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
          <h3>Planned vs Scheduled — {record.event_name}</h3>
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

          {/* Poster Preview Section */}
          {posters.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginBottom: 20 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Uploaded Posters</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {posters.map((url, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '0.85rem'
                  }}>
                    <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                      <FiFile className="flex-shrink-0" />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Poster {i + 1}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mail Scheduling Section */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Schedule Mail</div>
            <div className="form-group" style={{ marginBottom: 15 }}>
              <label>Subject of the mail</label>
              <input 
                type="text" 
                value={mailSubject} 
                onChange={e => setMailSubject(e.target.value)} 
                placeholder="Enter email subject" 
              />
            </div>
            <div className="form-group" style={{ marginBottom: 15 }}>
              <label>Email Content (Optional)</label>
              <textarea 
                value={mailContent} 
                onChange={e => setMailContent(e.target.value)} 
                placeholder="Enter additional email body text..."
                style={{ width: '100%', minHeight: '100px', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontFamily: 'inherit' }}
              />
            </div>
            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label>Mail ID (To)</label>
                <input 
                  type="email" 
                  value={mailId} 
                  onChange={e => setMailId(e.target.value)} 
                  placeholder="recipient@example.com" 
                />
              </div>
              <div className="form-group">
                <label>Mail Date</label>
                <input 
                  type="date" 
                  value={mailDate} 
                  onChange={e => setMailDate(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Mail Time</label>
                <input 
                  type="time" 
                  value={mailTime} 
                  onChange={e => setMailTime(e.target.value)} 
                />
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          {activeJobId ? (
            <button className="btn btn-danger" onClick={handleCancelMail}>
              <FiSlash className="mr-2" /> Cancel Scheduled Mail
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleScheduleMail} disabled={sending}>
              <FiMail className="mr-2" /> {sending ? 'Scheduling...' : 'Schedule Mail'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlannedVsScheduledPage() {
  const [records, setRecords] = useState([]);
  const [scheduledJobs, setScheduledJobs] = useState([]);
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const plannerRes = await getPlanner().catch(err => {
        console.error('Error fetching planner:', err);
        return { data: { success: false, data: [] } };
      });
      setRecords(plannerRes.data.data || []);

      const jobsRes = await getScheduledJobs().catch(err => {
        console.error('Error fetching scheduled jobs:', err);
        return { data: { success: false, data: [] } };
      });
      setScheduledJobs(jobsRes.data.data || []);
    } catch (err) { 
      console.error('Fetch data error:', err);
      // Removed the generic toast error to prevent misleading popups if only one part fails
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isScheduled = (id) => {
    return scheduledJobs.some(job => String(job.planner_id) === String(id));
  };

  const recordsWithStatus = records.map(r => ({
    ...r,
    is_scheduled: isScheduled(r.id)
  }));

  const filtered = recordsWithStatus.filter(r => {
    const matchSearch = r.event_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.region?.toLowerCase().includes(search.toLowerCase());
    const matchMonth = !filterMonth || (r.event_date && new Date(r.event_date).getMonth() === parseInt(filterMonth));
    return matchSearch && matchMonth;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Planned vs Scheduled</h1>
          <p className="subtitle">View planned details and schedule reminder emails</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-success btn-sm" onClick={() => exportToExcel(recordsWithStatus, 'planned_vs_scheduled')}>
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
                    <th>Scheduled</th>
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
                      <td>
                        {isScheduled(r.id) ? (
                          <span className="badge badge-green">Yes</span>
                        ) : (
                          <span className="badge badge-red">No</span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-icon btn-secondary btn-sm" title="View Details & Schedule" onClick={() => setDetailRecord(r)}>
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

      <ScheduleMailModal 
        open={!!detailRecord} 
        onClose={() => { setDetailRecord(null); fetchData(); }} 
        record={detailRecord} 
        scheduledJobs={scheduledJobs}
      />
    </div>
  );
}
