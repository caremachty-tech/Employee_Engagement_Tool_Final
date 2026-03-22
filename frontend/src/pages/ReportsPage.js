import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiDownload, FiX, FiFileText } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { getReports } from '../utils/api';

const fmtExcelDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return '';
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmt = (n) => n != null ? parseFloat(n).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—';

export default function ReportsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReports();
      setRecords(res.data.data || []);
    } catch { toast.error('Failed to load reports'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = records.filter(r => {
    if (!r.actual_date) return false;
    if (!fromDate && !toDate) return true;
    const d = r.actual_date.slice(0, 10);
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  });

  const handleExport = () => {
    const rows = filtered.map((r, i) => ({
      '#': i + 1,
      'Region': r.region || '',
      'Event': r.event_type || '',
      'Event Type': r.event_category || '',
      'Event Name': r.event_name || '',
      'Event Date': fmtExcelDate(r.event_date),
      'Actual Date': fmtExcelDate(r.actual_date),
      'No of Participants': r.num_participants ?? '',
      'Amount Spent (₹)': r.amount_spent != null ? parseFloat(r.amount_spent) : ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reports');
    XLSX.writeFile(wb, 'reports.xlsx', { bookType: 'xlsx' });
  };

  const clearFilters = () => { setFromDate(''); setToDate(''); };

  return (
    <>
      <div className="page-header">
        <div><h2>Reports</h2></div>
      </div>

      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Event Reports</div>
              <div className="card-subtitle">{filtered.length} record{filtered.length !== 1 ? 's' : ''} with actual date</div>
            </div>
            <button className="btn btn-secondary" onClick={handleExport} disabled={filtered.length === 0}>
              <FiDownload /> Export Excel
            </button>
          </div>

          <div className="action-row" style={{ flexWrap: 'wrap', gap: 10 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>From Date</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ width: 160 }} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>To Date</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ width: 160 }} />
            </div>
            {(fromDate || toDate) && (
              <button className="btn btn-secondary btn-sm" onClick={clearFilters} style={{ alignSelf: 'flex-end' }}>
                <FiX /> Clear
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading-spinner"><div className="spinner" /><span>Loading…</span></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FiFileText /></div>
              <h3>{fromDate || toDate ? 'No records in this date range' : 'No records found'}</h3>
              <p>{fromDate || toDate ? 'Try adjusting the date filters' : 'Add events in the Planner page first'}</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Region</th>
                    <th>Event</th>
                    <th>Event Type</th>
                    <th>Event Name</th>
                    <th>Event Date</th>
                    <th>Actual Date</th>
                    <th>No of Participants</th>
                    <th>Amount Spent (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r.id}>
                      <td className="td-mono" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td><span className="td-badge badge-blue">{r.region}</span></td>
                      <td><span className="td-badge badge-purple">{r.event_type || '—'}</span></td>
                      <td>{r.event_category || '—'}</td>
                      <td style={{ fontWeight: 500 }}>{r.event_name}</td>
                      <td className="td-mono">{formatDate(r.event_date)}</td>
                      <td className="td-mono">{formatDate(r.actual_date)}</td>
                      <td className="td-mono">{r.num_participants ?? '—'}</td>
                      <td className="td-mono" style={{ color: 'var(--warning)', fontWeight: 600 }}>
                        {r.amount_spent != null ? `₹${fmt(r.amount_spent)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
