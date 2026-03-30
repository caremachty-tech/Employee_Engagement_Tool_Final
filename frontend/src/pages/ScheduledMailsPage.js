import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiMail, FiCalendar, FiClock, FiTrash2, FiEdit2, FiX, FiCheck, FiDownload } from 'react-icons/fi';
import { getScheduledJobs, updateScheduledJob, deleteScheduledJob } from '../utils/api';
import { exportToExcel } from '../utils/export';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function EditJobModal({ open, onClose, job, onSave }) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (job) {
      setTo(job.to || '');
      setSubject(job.subject || '');
      setEmailContent(job.email_content || '');
      setDate(job.date || '');
      setTime(job.time || '');
    }
  }, [job]);

  if (!open || !job) return null;

  const handleSave = async () => {
    if (!to || !subject || !date || !time) {
      toast.error('All fields are required');
      return;
    }
    setSaving(true);
    try {
      const res = await updateScheduledJob(job.id, { to, subject, date, time, email_content: emailContent });
      if (res.data.success) {
        toast.success('Scheduled mail updated');
        onSave();
        onClose();
      }
    } catch (err) {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Edit Scheduled Mail</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Recipient Email</label>
            <input type="email" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Subject</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email Content (Optional)</label>
            <textarea 
              value={emailContent} 
              onChange={e => setEmailContent(e.target.value)} 
              placeholder="Enter email content..."
              style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontFamily: 'inherit' }}
            />
          </div>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label>Mail Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Mail Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ScheduledMailsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editJob, setEditJob] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getScheduledJobs();
      if (res.data.success) {
        setJobs(res.data.data || []);
      }
    } catch {
      toast.error('Failed to load scheduled mails');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scheduled mail?')) return;
    try {
      const res = await deleteScheduledJob(id);
      if (res.data.success) {
        toast.success('Scheduled mail deleted');
        setJobs(prev => prev.filter(j => j.id !== id));
      }
    } catch {
      toast.error('Failed to delete mail');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Scheduled Mails</h1>
          <p className="subtitle">Manage all active scheduled reminder emails</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-success btn-sm" onClick={() => exportToExcel(jobs, 'scheduled_mails')}>
            <FiDownload /> Export
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="card">
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /><span>Loading…</span></div>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FiMail /></div>
              <h3>No scheduled mails found</h3>
              <p>Mails you schedule in 'Planned vs Scheduled' will appear here.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Recipient (To)</th>
                    <th>Subject</th>
                    <th>Mail Date</th>
                    <th>Mail Time</th>
                    <th>Event Data</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td><div style={{ fontWeight: 500 }}>{job.to}</div></td>
                      <td>{job.subject}</td>
                      <td>
                        <div className="flex items-center text-muted">
                          <FiCalendar className="mr-2" />
                          {formatDate(job.date)}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center text-muted">
                          <FiClock className="mr-2" />
                          {job.time}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          {job.events?.map(e => e.event_name).join(', ')}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-icon btn-secondary btn-sm" title="Edit" onClick={() => setEditJob(job)}>
                            <FiEdit2 size={14} />
                          </button>
                          <button className="btn btn-icon btn-danger btn-sm" title="Delete" onClick={() => handleDelete(job.id)}>
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <EditJobModal 
        open={!!editJob} 
        onClose={() => setEditJob(null)} 
        job={editJob} 
        onSave={fetchJobs} 
      />
    </div>
  );
}
