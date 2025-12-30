import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import type { User, UserRole, SystemStats } from '../types';
import Layout from '../components/Layout';
import Card, { StatCard } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import { HiUsers, HiShieldCheck, HiLockClosed, HiLockOpen, HiTrash } from 'react-icons/hi';
import { BiCycling } from 'react-icons/bi';
import { GiWeightLiftingUp } from 'react-icons/gi';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
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
      toast.error(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId: number, newRole: UserRole) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    try {
      await adminAPI.changeUserRole(userId, newRole);
      toast.success('User role updated successfully');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to change user role');
    }
  };

  const handleLockUser = async (userId: number, locked: boolean) => {
    const action = locked ? 'lock' : 'unlock';
    if (!confirm(`Are you sure you want to ${action} this user's account?`)) return;

    try {
      await adminAPI.lockUser(userId, locked);
      toast.success(`User ${action}ed successfully`);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || `Failed to ${action} user`);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to DELETE this user? This action cannot be undone!')) return;

    try {
      await adminAPI.deleteUser(userId);
      toast.success('User deleted successfully');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  if (loading) return <Layout><Loading text="Loading admin panel..." /></Layout>;

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage users and view system statistics</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.total_users.toString()}
            icon={HiUsers}
            color="blue"
          />
          <StatCard
            title="Athletes"
            value={stats.total_athletes.toString()}
            icon={BiCycling}
            color="green"
          />
          <StatCard
            title="Trainers"
            value={stats.total_trainers.toString()}
            icon={GiWeightLiftingUp}
            color="purple"
          />
          <StatCard
            title="Admins"
            value={stats.total_admins.toString()}
            icon={HiShieldCheck}
            color="red"
          />
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Button
          variant={roleFilter === '' ? 'primary' : 'secondary'}
          onClick={() => { setRoleFilter(''); loadData(); }}
        >
          All Users
        </Button>
        <Button
          variant={roleFilter === 'athlete' ? 'primary' : 'secondary'}
          onClick={() => { setRoleFilter('athlete'); loadData(); }}
        >
          Athletes
        </Button>
        <Button
          variant={roleFilter === 'trainer' ? 'primary' : 'secondary'}
          onClick={() => { setRoleFilter('trainer'); loadData(); }}
        >
          Trainers
        </Button>
        <Button
          variant={roleFilter === 'admin' ? 'primary' : 'secondary'}
          onClick={() => { setRoleFilter('admin'); loadData(); }}
        >
          Admins
        </Button>
      </div>

      {/* User Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.full_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user.id, e.target.value as UserRole)}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="athlete">Athlete</option>
                      <option value="trainer">Trainer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_locked
                          ? 'bg-red-100 text-red-800'
                          : user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.is_locked ? 'Locked' : user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <Button
                        variant={user.is_locked ? 'primary' : 'warning'}
                        size="sm"
                        onClick={() => handleLockUser(user.id, !user.is_locked)}
                      >
                        {user.is_locked ? (
                          <>
                            <HiLockOpen className="w-4 h-4 mr-1 inline" />
                            Unlock
                          </>
                        ) : (
                          <>
                            <HiLockClosed className="w-4 h-4 mr-1 inline" />
                            Lock
                          </>
                        )}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <HiTrash className="w-4 h-4 mr-1 inline" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No users found
          </div>
        )}
      </Card>
    </Layout>
  );
}
