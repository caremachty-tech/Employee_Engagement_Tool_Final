import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../utils/api';
import { toast } from 'react-hot-toast';
import { FiUserPlus, FiEdit2, FiTrash2, FiShield, FiX, FiCheck, FiSearch } from 'react-icons/fi';

const PAGES = [
  { id: 'master', label: 'Budget (Master)' },
  { id: 'planner', label: 'Planner' },
  { id: 'planned_vs_actual', label: 'Planned vs Actual' },
  { id: 'budget_utilisation', label: 'Budget Utilisation' },
  { id: 'reports', label: 'Reports' },
  { id: 'planner_vs_poster', label: 'Planner vs Poster' },
  { id: 'planned_vs_scheduled', label: 'Planned vs Scheduled' },
  { id: 'scheduled_mails', label: 'Scheduled Mails' }
];

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [permissions, setPermissions] = useState(
    PAGES.reduce((acc, p) => ({ ...acc, [p.id]: false }), {})
  );

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUsername(user.username);
      setPassword('');
      setRole(user.role);
      setPermissions(user.permissions || PAGES.reduce((acc, p) => ({ ...acc, [p.id]: false }), {}));
    } else {
      setEditingUser(null);
      setUsername('');
      setPassword('');
      setRole('user');
      setPermissions(PAGES.reduce((acc, p) => ({ ...acc, [p.id]: false }), {}));
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = { username, role, permissions };
      if (password) userData.password = password;

      if (editingUser) {
        await updateUser(editingUser.id, userData);
        toast.success('User updated successfully');
      } else {
        if (!password) {
          toast.error('Password is required for new users');
          return;
        }
        await createUser(userData);
        toast.success('User created successfully');
      }
      fetchUsers();
      handleCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const togglePermission = (pageId) => {
    setPermissions(prev => ({ ...prev, [pageId]: !prev[pageId] }));
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page" style={{ padding: '32px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '4px' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage users and access permissions</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          style={{
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FiUserPlus /> Add User
        </button>
      </header>

      <div style={{ 
        background: 'var(--surface-1)', 
        borderRadius: '12px', 
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Username</th>
              <th style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Role</th>
              <th style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Permissions</th>
              <th style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Created</th>
              <th style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '32px', textAlign: 'center' }}>Loading users...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '32px', textAlign: 'center' }}>No users found</td></tr>
            ) : filteredUsers.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px', fontWeight: 500 }}>{user.username}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '100px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: user.role === 'admin' ? 'rgba(255,107,0,0.1)' : 'rgba(100,100,100,0.1)',
                    color: user.role === 'admin' ? 'var(--accent)' : 'var(--text-muted)'
                  }}>
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  {user.role === 'admin' ? (
                    <span style={{ color: 'var(--success)', fontSize: '0.875rem' }}>Full Access</span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {PAGES.filter(p => user.permissions?.[p.id]).length === 0 ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>None</span>
                      ) : PAGES.filter(p => user.permissions?.[p.id]).map(p => (
                        <span key={p.id} style={{
                          fontSize: '0.65rem',
                          padding: '2px 6px',
                          background: 'var(--surface-2)',
                          borderRadius: '4px',
                          border: '1px solid var(--border)'
                        }}>{p.label}</span>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => handleOpenModal(user)}
                      style={{
                        padding: '6px',
                        background: 'none',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      disabled={user.username === 'admin'}
                      style={{
                        padding: '6px',
                        background: 'none',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: user.username === 'admin' ? 'var(--border)' : 'var(--error)'
                      }}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface-1)',
            width: '100%',
            maxWidth: '600px',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.25rem' }}>{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX size={24} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Username</label>
                  <input 
                    type="text" 
                    required 
                    value={username} 
                    onChange={e => setUsername(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface-2)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Password {editingUser && '(Leave blank to keep current)'}</label>
                  <input 
                    type="password" 
                    required={!editingUser} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface-2)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Role</label>
                  <select 
                    value={role} 
                    onChange={e => setRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface-2)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="user">Normal User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {role === 'user' && (
                <div style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', marginBottom: '16px', fontSize: '0.875rem', fontWeight: 600 }}>Page Access Permissions</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {PAGES.map(page => (
                      <div 
                        key={page.id} 
                        onClick={() => togglePermission(page.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          background: 'var(--surface-2)',
                          borderRadius: '8px',
                          border: `1px solid ${permissions[page.id] ? 'var(--accent)' : 'var(--border)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ fontSize: '0.875rem' }}>{page.label}</span>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: permissions[page.id] ? 'var(--accent)' : 'transparent',
                          borderColor: permissions[page.id] ? 'var(--accent)' : 'var(--border)'
                        }}>
                          {permissions[page.id] && <FiCheck color="white" size={14} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'none',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--accent)',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
