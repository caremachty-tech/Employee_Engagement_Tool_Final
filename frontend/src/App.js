import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MasterPage from './pages/MasterPage';
import PlannerPage from './pages/PlannerPage';
import PlannedVsActualPage from './pages/PlannedVsActualPage';
import BudgetUtilisationPage from './pages/BudgetUtilisationPage';
import PlannerVsPosterPage from './pages/PlannerVsPosterPage';
import PlannedVsScheduledPage from './pages/PlannedVsScheduledPage';
import ScheduledMailsPage from './pages/ScheduledMailsPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider, useAuth } from './AuthContext';
import { 
  FiGrid, FiCalendar, FiBarChart2, FiPieChart, 
  FiFileText, FiImage, FiClock, FiSend, 
  FiSettings, FiLogOut, FiUser, FiLock 
} from 'react-icons/fi';
import { getMaster } from './utils/api';
import ChangePasswordModal from './components/ChangePasswordModal';

function Sidebar({ isOpen, onClose }) {
  const { user, logout, hasPagePermission } = useAuth();
  const [totalBudget, setTotalBudget] = useState(0);
  const [showPwdModal, setShowPwdModal] = useState(false);

  useEffect(() => {
    if (user) {
      getMaster().then(res => {
        const total = res.data.data.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
        setTotalBudget(total);
      }).catch(err => console.error('Error fetching budget:', err));
    }
  }, [user]);

  const fmt = (n) => parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  if (!user) return null;

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
        
        <div style={{ padding: '0 20px 16px', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--surface-2)', borderRadius: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <FiUser size={18} />
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.username}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.role.toUpperCase()}</p>
            </div>
            <button 
              onClick={() => setShowPwdModal(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
              title="Change Password"
            >
              <FiLock size={16} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {hasPagePermission('master') && (
            <NavLink to="/master" className={({isActive})=>`nav-link ${isActive?'active':''}`} onClick={onClose}>
              <FiGrid className="nav-icon" />
              <span>
                Budget
                {totalBudget > 0 && <span style={{ display:'block', fontSize:'0.68rem', color:'var(--accent)', fontFamily:'var(--font-mono)', marginTop:2 }}>₹{fmt(totalBudget)}</span>}
              </span>
            </NavLink>
          )}
          {hasPagePermission('planner') && (
            <NavLink to="/planner" className={({isActive})=>`nav-link ${isActive?'active':''}`} onClick={onClose}>
              <FiCalendar className="nav-icon" />
              Planner
            </NavLink>
          )}
          {hasPagePermission('planned_vs_actual') && (
            <NavLink to="/planned-vs-actual" className={({isActive})=>`nav-link ${isActive?'active':''}`} onClick={onClose}>
              <FiBarChart2 className="nav-icon" />
              Planned vs Actual
            </NavLink>
          )}
          {hasPagePermission('budget_utilisation') && (
            <NavLink to="/budget-utilisation" className={({isActive})=>`nav-link ${isActive?'active':''}`} onClick={onClose}>
              <FiPieChart className="nav-icon" />
              Budget Utilisation
            </NavLink>
          )}
          {hasPagePermission('reports') && (
            <NavLink to="/reports" className={({isActive})=>`nav-link ${isActive?'active':''}`} onClick={onClose}>
              <FiFileText className="nav-icon" />
              Reports
            </NavLink>
          )}
          {hasPagePermission('planner_vs_poster') && (
            <NavLink to="/planner-vs-poster" className={({isActive})=>`nav-link ${isActive?'active':''}`} onClick={onClose}>
              <FiImage className="nav-icon" />
              Planner vs Poster
            </NavLink>
          )}
          {hasPagePermission('planned_vs_scheduled') && (
            <NavLink to="/planned-vs-scheduled" className={({isActive})=>`nav-link ${isActive?'active':''}`} onClick={onClose}>
              <FiClock className="nav-icon" />
              Planned vs Scheduled
            </NavLink>
          )}
          {hasPagePermission('scheduled_mails') && (
            <NavLink to="/scheduled-mails" className={({isActive})=>`nav-link ${isActive?'active':''}`} onClick={onClose}>
              <FiSend className="nav-icon" />
              Scheduled Mails
            </NavLink>
          )}

          {user.role === 'admin' && (
            <NavLink to="/admin" className={({isActive})=>`nav-link ${isActive?'active':''}`} onClick={onClose} style={{ marginTop: 'auto' }}>
              <FiSettings className="nav-icon" />
              Admin Settings
            </NavLink>
          )}
        </nav>

        <div style={{padding:'16px 20px', borderTop:'1px solid var(--border)'}}>
          <button 
            onClick={() => { logout(); onClose(); }}
            className="nav-link"
            style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', padding: '12px 16px', color: 'var(--error)' }}
          >
            <FiLogOut className="nav-icon" />
            <span>Logout</span>
          </button>
          <p style={{fontSize:'0.72rem',color:'var(--text-muted)',fontFamily:'var(--font-mono)', marginTop: '16px'}}>
            v1.1.0 · Built with ♥
          </p>
        </div>
      </aside>

      <ChangePasswordModal open={showPwdModal} onClose={() => setShowPwdModal(false)} />
    </>
  );
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (loading) return null;

  return (
    <div className={`app-layout ${!user || isLoginPage ? 'no-sidebar' : ''}`}>
      {user && !isLoginPage && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      <main className="main-content">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/master" replace /> : <LoginPage />} />
          
          <Route path="/" element={<Navigate to="/master" replace />} />
          
          <Route path="/master" element={
            <ProtectedRoute requiredPermission="master">
              <MasterPage onMenuClick={() => setSidebarOpen(o=>!o)} />
            </ProtectedRoute>
          } />
          
          <Route path="/planner" element={
            <ProtectedRoute requiredPermission="planner">
              <PlannerPage onMenuClick={() => setSidebarOpen(o=>!o)} />
            </ProtectedRoute>
          } />
          
          <Route path="/planned-vs-actual" element={
            <ProtectedRoute requiredPermission="planned_vs_actual">
              <PlannedVsActualPage />
            </ProtectedRoute>
          } />
          
          <Route path="/budget-utilisation" element={
            <ProtectedRoute requiredPermission="budget_utilisation">
              <BudgetUtilisationPage />
            </ProtectedRoute>
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute requiredPermission="reports">
              <ReportsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/planner-vs-poster" element={
            <ProtectedRoute requiredPermission="planner_vs_poster">
              <PlannerVsPosterPage />
            </ProtectedRoute>
          } />
          
          <Route path="/planned-vs-scheduled" element={
            <ProtectedRoute requiredPermission="planned_vs_scheduled">
              <PlannedVsScheduledPage />
            </ProtectedRoute>
          } />
          
          <Route path="/scheduled-mails" element={
            <ProtectedRoute requiredPermission="scheduled_mails">
              <ScheduledMailsPage />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute>
              {user?.role === 'admin' ? <AdminPage /> : <Navigate to="/master" replace />}
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/master" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'custom-toast',
            duration: 3500,
            style: { background:'var(--surface-2)', color:'var(--text-primary)', border:'1px solid var(--border)' }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
