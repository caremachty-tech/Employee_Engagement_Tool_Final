import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiSearch, FiUsers } from 'react-icons/fi';
import { getBudgetUtilisation } from '../utils/api';

export default function BudgetUtilisationPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBudgetUtilisation();
      setRecords(res.data.data || []);
    } catch { toast.error('Failed to load records'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = records.filter(r =>
    r.region?.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n) => parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const budgetTillDate = (totalAmount) => {
    const today = new Date();
    const apr1 = new Date(today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1, 3, 1);
    const days = Math.floor((today - apr1) / (1000 * 60 * 60 * 24));
    return Math.round((parseFloat(totalAmount || 0) / 365) * days);
  };

  const totalBudget = records.reduce((s, r) => s + parseFloat(r.total_amount || 0), 0);
  const totalUtilised = records.reduce((s, r) => s + parseFloat(r.utilised_amount || 0), 0);
  const totalBudgetTillDate = records.reduce((s, r) => s + budgetTillDate(r.total_amount), 0);
  const totalBalance = totalBudgetTillDate - totalUtilised;

  return (
    <>
      <div className="page-header">
        <div><h2>Budget Utilisation</h2></div>
      </div>

      <div className="page-body">
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Total Regions</div>
            <div className="stat-value">{records.length}</div>
            <div className="stat-sub">Configured regions</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Budget</div>
            <div className="stat-value" style={{ fontSize: '1.2rem' }}>₹{fmt(totalBudget)}</div>
            <div className="stat-sub">Combined allocation</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Utilised</div>
            <div className="stat-value" style={{ fontSize: '1.2rem', color: 'var(--warning)' }}>₹{fmt(totalUtilised)}</div>
            <div className="stat-sub">Amount spent so far</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Balance</div>
            <div className="stat-value" style={{ fontSize: '1.2rem', color: totalBalance < 0 ? 'var(--danger)' : 'var(--success)' }}>₹{fmt(totalBalance)}</div>
            <div className="stat-sub">Remaining budget</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Region-wise Budget Utilisation</div>
              <div className="card-subtitle">{filtered.length} of {records.length} records</div>
            </div>
          </div>

          <div className="action-row">
            <div className="search-bar" style={{ flex: 1, maxWidth: 320 }}>
              <FiSearch className="search-icon" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by region…" />
            </div>
          </div>

          {loading ? (
            <div className="loading-spinner"><div className="spinner" /><span>Loading…</span></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FiUsers /></div>
              <h3>{search ? 'No matching records' : 'No records yet'}</h3>
              <p>{search ? 'Try a different search term' : 'Add regions in the Budget page first'}</p>
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
                    <th>Budget Till Date (₹)</th>
                    <th>Utilised Amount (₹)</th>
                    <th>Balance Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const balance = budgetTillDate(r.total_amount) - parseFloat(r.utilised_amount || 0);
                    return (
                      <tr key={r.id}>
                        <td className="td-mono" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td><span className="td-badge badge-blue">{r.region}</span></td>
                        <td className="td-mono">{parseInt(r.head_count).toLocaleString('en-IN')}</td>
                        <td className="td-mono">{fmt(r.birthday_budget_per_head)}</td>
                        <td className="td-mono">{parseInt(r.birthday_events)}</td>
                        <td className="td-mono">{fmt(r.festival_budget_per_head)}</td>
                        <td className="td-mono">{parseInt(r.festival_events)}</td>
                        <td className="td-mono">{fmt(r.birthday_amount)}</td>
                        <td className="td-mono">{fmt(r.festival_amount)}</td>
                        <td className="td-mono" style={{ color: 'var(--success)', fontWeight: 600 }}>₹{fmt(r.total_amount)}</td>
                        <td className="td-mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>₹{fmt(budgetTillDate(r.total_amount))}</td>
                        <td className="td-mono" style={{ color: 'var(--warning)', fontWeight: 600 }}>₹{fmt(r.utilised_amount)}</td>
                        <td className="td-mono" style={{ color: balance < 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>₹{fmt(balance)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
