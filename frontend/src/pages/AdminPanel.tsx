import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import type { User, UserRole, SystemStats } from '../types';
import Layout from '../components/Layout';

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData] = await Promise.all([
        adminAPI.getUsers(0, 100, roleFilter || undefined),
        adminAPI.getStats(),
      ]);
      setUsers(usersData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId: number, newRole: UserRole) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    try {
      await adminAPI.changeUserRole(userId, newRole);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to change user role');
    }
  };

  const handleLockUser = async (userId: number, locked: boolean) => {
    const action = locked ? 'lock' : 'unlock';
    if (!confirm(`Are you sure you want to ${action} this user's account?`)) return;

    try {
      await adminAPI.lockUser(userId, locked);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to ${action} user`);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to DELETE this user? This action cannot be undone!')) return;

    try {
      await adminAPI.deleteUser(userId);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div style={{ color: 'red' }}>{error}</div></Layout>;

  return (
    <Layout>
      <h1>User Management</h1>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ padding: '1.5rem', backgroundColor: '#3498db', color: 'white', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Total Users</h3>
            <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{stats.total_users}</p>
          </div>
          <div style={{ padding: '1.5rem', backgroundColor: '#2ecc71', color: 'white', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Athletes</h3>
            <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{stats.total_athletes}</p>
          </div>
          <div style={{ padding: '1.5rem', backgroundColor: '#9b59b6', color: 'white', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Trainers</h3>
            <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{stats.total_trainers}</p>
          </div>
          <div style={{ padding: '1.5rem', backgroundColor: '#e74c3c', color: 'white', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Admins</h3>
            <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{stats.total_admins}</p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => { setRoleFilter(''); loadData(); }}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: roleFilter === '' ? '2px solid #3498db' : '1px solid #ddd',
            backgroundColor: roleFilter === '' ? '#3498db' : 'white',
            color: roleFilter === '' ? 'white' : '#333',
            cursor: 'pointer',
          }}
        >
          All Users
        </button>
        <button
          onClick={() => { setRoleFilter('athlete'); loadData(); }}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: roleFilter === 'athlete' ? '2px solid #2ecc71' : '1px solid #ddd',
            backgroundColor: roleFilter === 'athlete' ? '#2ecc71' : 'white',
            color: roleFilter === 'athlete' ? 'white' : '#333',
            cursor: 'pointer',
          }}
        >
          Athletes
        </button>
        <button
          onClick={() => { setRoleFilter('trainer'); loadData(); }}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: roleFilter === 'trainer' ? '2px solid #9b59b6' : '1px solid #ddd',
            backgroundColor: roleFilter === 'trainer' ? '#9b59b6' : 'white',
            color: roleFilter === 'trainer' ? 'white' : '#333',
            cursor: 'pointer',
          }}
        >
          Trainers
        </button>
        <button
          onClick={() => { setRoleFilter('admin'); loadData(); }}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: roleFilter === 'admin' ? '2px solid #e74c3c' : '1px solid #ddd',
            backgroundColor: roleFilter === 'admin' ? '#e74c3c' : 'white',
            color: roleFilter === 'admin' ? 'white' : '#333',
            cursor: 'pointer',
          }}
        >
          Admins
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>ID</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Email</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Name</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Role</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '1rem' }}>{user.id}</td>
                <td style={{ padding: '1rem' }}>{user.email}</td>
                <td style={{ padding: '1rem' }}>{user.full_name || '-'}</td>
                <td style={{ padding: '1rem' }}>
                  <select
                    value={user.role}
                    onChange={(e) => handleChangeRole(user.id, e.target.value as UserRole)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                    }}
                  >
                    <option value="athlete">Athlete</option>
                    <option value="trainer">Trainer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      backgroundColor: user.is_locked ? '#fee' : user.is_active ? '#d5f4e6' : '#e8e8e8',
                      color: user.is_locked ? '#c00' : user.is_active ? '#2ecc71' : '#95a5a6',
                    }}
                  >
                    {user.is_locked ? 'Locked' : user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleLockUser(user.id, !user.is_locked)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: user.is_locked ? '#2ecc71' : '#f39c12',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      {user.is_locked ? 'Unlock' : 'Lock'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
