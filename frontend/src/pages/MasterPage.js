import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiDownload, FiSearch, FiUsers, FiDollarSign, FiMenu } from 'react-icons/fi';
import { getMaster, addMaster, updateMaster, deleteMaster } from '../utils/api';
import { exportToExcel } from '../utils/export';

const emptyForm = { region:'', head_count:'', birthday_budget_per_head:'', birthday_events:'', festival_budget_per_head:'', festival_events:'' };

function calcTotal(f) {
  const hc = parseFloat(f.head_count)||0;
  const bbph = parseFloat(f.birthday_budget_per_head)||0;
  const be = parseFloat(f.birthday_events)||0;
  const fbph = parseFloat(f.festival_budget_per_head)||0;
  const fe = parseFloat(f.festival_events)||0;
  const birthday_amount = hc * bbph * be;
  const festival_amount = hc * fbph * fe;
  return { birthday_amount, festival_amount, total: birthday_amount + festival_amount };
}

function MasterModal({ open, onClose, onSave, editData }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(editData ? { ...editData } : emptyForm);
      setErrors({});
    }
  }, [open, editData]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.region.trim()) e.region = 'Required';
    if (!form.head_count || form.head_count <= 0) e.head_count = 'Must be > 0';
    if (form.birthday_budget_per_head === '' || form.birthday_budget_per_head < 0) e.birthday_budget_per_head = 'Required';
    if (form.birthday_events === '' || form.birthday_events < 0) e.birthday_events = 'Required';
    if (form.festival_budget_per_head === '' || form.festival_budget_per_head < 0) e.festival_budget_per_head = 'Required';
    if (form.festival_events === '' || form.festival_events < 0) e.festival_events = 'Required';
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

  const { birthday_amount, festival_amount, total } = calcTotal(form);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{editData ? 'Edit Record' : 'Add Master Record'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid form-grid-2">
            <div className="form-group full">
              <label>Region <span className="required">*</span></label>
              <input className={errors.region?'error':''} value={form.region} onChange={e=>set('region',e.target.value)} placeholder="e.g. North, South, East…" />
              {errors.region && <span className="form-error">{errors.region}</span>}
            </div>
            <div className="form-group full">
              <label>Head Count <span className="required">*</span></label>
              <input type="number" min="1" className={errors.head_count?'error':''} value={form.head_count} onChange={e=>set('head_count',e.target.value)} placeholder="0" />
              {errors.head_count && <span className="form-error">{errors.head_count}</span>}
            </div>
            <div className="form-group">
              <label>Birthday Budget/Head (₹) <span className="required">*</span></label>
              <input type="number" min="0" className={errors.birthday_budget_per_head?'error':''} value={form.birthday_budget_per_head} onChange={e=>set('birthday_budget_per_head',e.target.value)} placeholder="0.00" />
              {errors.birthday_budget_per_head && <span className="form-error">{errors.birthday_budget_per_head}</span>}
            </div>
            <div className="form-group">
              <label>Birthday Events <span className="required">*</span></label>
              <input type="number" min="0" className={errors.birthday_events?'error':''} value={form.birthday_events} onChange={e=>set('birthday_events',e.target.value)} placeholder="0" />
              {errors.birthday_events && <span className="form-error">{errors.birthday_events}</span>}
            </div>
            <div className="form-group">
              <label>Festival Budget/Head (₹) <span className="required">*</span></label>
              <input type="number" min="0" className={errors.festival_budget_per_head?'error':''} value={form.festival_budget_per_head} onChange={e=>set('festival_budget_per_head',e.target.value)} placeholder="0.00" />
              {errors.festival_budget_per_head && <span className="form-error">{errors.festival_budget_per_head}</span>}
            </div>
            <div className="form-group">
              <label>Festival Events <span className="required">*</span></label>
              <input type="number" min="0" className={errors.festival_events?'error':''} value={form.festival_events} onChange={e=>set('festival_events',e.target.value)} placeholder="0" />
              {errors.festival_events && <span className="form-error">{errors.festival_events}</span>}
            </div>
            <div className="form-group">
              <label>Birthday Amount (Auto-calculated)</label>
              <div className="calc-field">₹ {birthday_amount.toLocaleString('en-IN', {minimumFractionDigits:2})}</div>
              <span className="form-hint">HC × Birthday Budget/Head × Birthday Events</span>
            </div>
            <div className="form-group">
              <label>Festival Amount (Auto-calculated)</label>
              <div className="calc-field">₹ {festival_amount.toLocaleString('en-IN', {minimumFractionDigits:2})}</div>
              <span className="form-hint">HC × Festival Budget/Head × Festival Events</span>
            </div>
            <div className="form-group full">
              <label>Total Amount (Auto-calculated)</label>
              <div className="calc-field">₹ {total.toLocaleString('en-IN', {minimumFractionDigits:2})}</div>
              <span className="form-hint">Birthday Amount + Festival Amount</span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : (editData ? 'Update' : 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ open, onClose, onConfirm, loading }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal confirm-dialog">
        <div className="modal-header"><h3>⚠️ Delete Record</h3><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <p>This action cannot be undone. Are you sure you want to delete this region record?</p>
          <div className="modal-footer" style={{padding:0,justifyContent:'center'}}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>{loading?'Deleting…':'Delete'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MasterPage({ onMenuClick }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMaster();
      setRecords(res.data.data || []);
    } catch { toast.error('Failed to load records'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSave = async (form) => {
    if (editData) {
      const res = await updateMaster(editData.id, form);
      setRecords(r => r.map(x => x.id===editData.id ? res.data.data : x));
      toast.success('Record updated!');
    } else {
      const res = await addMaster(form);
      setRecords(r => [res.data.data, ...r]);
      toast.success('Record added!');
    }
    setEditData(null);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMaster(deleteId);
      setRecords(r => r.filter(x => x.id !== deleteId));
      toast.success('Record deleted');
      setDeleteId(null);
    } catch { toast.error('Delete failed'); }
    setDeleting(false);
  };

  const filtered = records.filter(r =>
    r.region?.toLowerCase().includes(search.toLowerCase())
  );

  const totalBudget = records.reduce((s,r) => s + parseFloat(r.total_amount||0), 0);
  const totalHeads = records.reduce((s,r) => s + parseInt(r.head_count||0), 0);

  return (
    <>
      <div className="page-header">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button className="btn btn-icon btn-secondary" style={{display:'none'}} onClick={onMenuClick}><FiMenu/></button>
          <div>
            <h2>Budget</h2>
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-success btn-sm" onClick={() => exportToExcel(records, 'master')}>
            <FiDownload /> Export
          </button>
          <button className="btn btn-primary" onClick={() => { setEditData(null); setModalOpen(true); }}>
            <FiPlus /> Add Region
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Total Regions</div>
            <div className="stat-value">{records.length}</div>
            <div className="stat-sub">Configured regions</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Head Count</div>
            <div className="stat-value">{totalHeads.toLocaleString('en-IN')}</div>
            <div className="stat-sub">Across all regions</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Budget</div>
            <div className="stat-value" style={{fontSize:'1.1rem'}}>₹{totalBudget.toLocaleString('en-IN', {minimumFractionDigits:2})}</div>
            <div className="stat-sub">Combined allocation</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Region Records</div>
              <div className="card-subtitle">{filtered.length} of {records.length} records</div>
            </div>
          </div>

          <div className="action-row">
            <div className="search-bar" style={{flex:1,maxWidth:320}}>
              <FiSearch className="search-icon"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by region…"/>
            </div>
          </div>

          {loading ? (
            <div className="loading-spinner"><div className="spinner"/><span>Loading…</span></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FiUsers/></div>
              <h3>{search ? 'No matching records' : 'No records yet'}</h3>
              <p>{search ? 'Try a different search term' : 'Click "+ Add Region" to get started'}</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Region</th>
                    <th>Head Count</th>
                    <th>Birthday Budget/Head (₹)</th>
                    <th>Birthday Events</th>
                    <th>Festival Budget/Head (₹)</th>
                    <th>Festival Events</th>
                    <th>Birthday Amount (₹)</th>
                    <th>Festival Amount (₹)</th>
                    <th>Total Amount (₹)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r.id}>
                      <td className="td-mono" style={{color:'var(--text-muted)'}}>{i+1}</td>
                      <td>
                        <span className="td-badge badge-blue">{r.region}</span>
                      </td>
                      <td className="td-mono">{parseInt(r.head_count).toLocaleString('en-IN')}</td>
                      <td className="td-mono">{parseFloat(r.birthday_budget_per_head).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                      <td className="td-mono">{parseInt(r.birthday_events)}</td>
                      <td className="td-mono">{parseFloat(r.festival_budget_per_head).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                      <td className="td-mono">{parseInt(r.festival_events)}</td>
                      <td className="td-mono">{parseFloat(r.birthday_amount).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                      <td className="td-mono">{parseFloat(r.festival_amount).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                      <td className="td-mono" style={{color:'var(--success)',fontWeight:600}}>
                        ₹{parseFloat(r.total_amount).toLocaleString('en-IN', {minimumFractionDigits:2})}
                      </td>
                      <td>
                        <div style={{display:'flex',gap:6}}>
                          <button className="btn btn-icon btn-secondary btn-sm" title="Edit" onClick={() => { setEditData(r); setModalOpen(true); }}>
                            <FiEdit2/>
                          </button>
                          <button className="btn btn-icon btn-danger btn-sm" title="Delete" onClick={() => setDeleteId(r.id)}>
                            <FiTrash2/>
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

      <MasterModal open={modalOpen} onClose={() => { setModalOpen(false); setEditData(null); }} onSave={handleSave} editData={editData} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} />
    </>
  );
}
