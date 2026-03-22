import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MasterPage from './pages/MasterPage';
import PlannerPage from './pages/PlannerPage';
import PlannedVsActualPage from './pages/PlannedVsActualPage';
import BudgetUtilisationPage from './pages/BudgetUtilisationPage';
import { FiGrid, FiCalendar, FiBarChart2, FiPieChart, FiFileText, FiMenu, FiX } from 'react-icons/fi';
import { getMaster } from './utils/api';
import ReportsPage from './pages/ReportsPage';

function Sidebar({ isOpen, onClose, totalBudget }) {
  const fmt = (n) => parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} style={{
        position:'fixed',inset:0,zIndex:99,display:'none'
      }}/>}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>EE Tool</h1>
          <span>Employee Engagement</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/master" className={({isActive})=>`nav-link ${isActive?'active':''}`} onClick={onClose}>
            <FiGrid className="nav-icon" />
            <span>
              Budget
              {totalBudget > 0 && <span style={{ display:'block', fontSize:'0.68rem', color:'var(--accent)', fontFamily:'var(--font-mono)', marginTop:2 }}>₹{fmt(totalBudget)}</span>}
            </span>
          </NavLink>
          <NavLink to="/planner" className={({isActive})=>`nav-link ${isActive?'active':''}`} onClick={onClose}>
            <FiCalendar className="nav-icon" />
            Planner
          </NavLink>
          <NavLink to="/planned-vs-actual" className={({isActive})=>`nav-link ${isActive?'active':''}`} onClick={onClose}>
            <FiBarChart2 className="nav-icon" />
            Planned vs Actual
          </NavLink>
          <NavLink to="/budget-utilisation" className={({isActive})=>`nav-link ${isActive?'active':''}`} onClick={onClose}>
            <FiPieChart className="nav-icon" />
            Budget Utilisation
          </NavLink>
          <NavLink to="/reports" className={({isActive})=>`nav-link ${isActive?'active':''}`} onClick={onClose}>
            <FiFileText className="nav-icon" />
            Reports
          </NavLink>
        </nav>
        <div style={{padding:'16px 20px', borderTop:'1px solid var(--border)'}}>
          <p style={{fontSize:'0.72rem',color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>
            v1.0.0 · Built with ♥
          </p>
        </div>
      </aside>
    </>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/master" replace />} />
            <Route path="/master" element={<MasterPage onMenuClick={() => setSidebarOpen(o=>!o)} />} />
            <Route path="/planner" element={<PlannerPage onMenuClick={() => setSidebarOpen(o=>!o)} />} />
            <Route path="/planned-vs-actual" element={<PlannedVsActualPage />} />
            <Route path="/budget-utilisation" element={<BudgetUtilisationPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Routes>
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'custom-toast',
          duration: 3500,
          style: { background:'var(--surface-2)', color:'var(--text-primary)', border:'1px solid var(--border)' }
        }}
      />
    </BrowserRouter>
  );
}
