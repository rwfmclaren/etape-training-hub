import { useState, useEffect, FormEvent } from 'react';
import { adminAPI } from '../services/api';
import type { User, UserRole, SystemStats, InviteToken, TrainerAssignment } from '../types';
import Layout from '../components/Layout';
import Card, { StatCard } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import { HiUsers, HiShieldCheck, HiPlus, HiLink, HiClipboard, HiX, HiUserGroup } from 'react-icons/hi';
import { BiCycling } from 'react-icons/bi';
import { GiWeightLiftingUp } from 'react-icons/gi';
import toast from 'react-hot-toast';

type Tab = 'users' | 'invites' | 'assignments';

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<InviteToken[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [activeTab, setActiveTab] = useState<Tab>('users');
  
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('athlete');
  const [addingUser, setAddingUser] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('athlete');
  const [inviteExpiry, setInviteExpiry] = useState(7);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [assignments, setAssignments] = useState<TrainerAssignment[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<number | ''>('');
  const [selectedAthlete, setSelectedAthlete] = useState<number | ''>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [creatingAssignment, setCreatingAssignment] = useState(false);


  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData, invitesData, assignmentsData] = await Promise.all([
        adminAPI.getUsers(0, 100, roleFilter || undefined),
        adminAPI.getStats(),
        adminAPI.getInvites(),
        adminAPI.getAssignments(false),
      ]);
      setUsers(usersData);
      setStats(statsData);
      setInvites(invitesData);
      setAssignments(assignmentsData);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  
  const trainers = users.filter(u => u.role === 'trainer');
  const athletes = users.filter(u => u.role === 'athlete');

  const handleCreateAssignment = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTrainer || !selectedAthlete) { toast.error('Select both trainer and athlete'); return; }
    setCreatingAssignment(true);
    try {
      await adminAPI.createAssignment(Number(selectedTrainer), Number(selectedAthlete), assignmentNotes || undefined);
      toast.success('Assignment created!');
      setSelectedTrainer(''); setSelectedAthlete(''); setAssignmentNotes('');
      await loadData();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed'); } 
    finally { setCreatingAssignment(false); }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!confirm('Remove this assignment?')) return;
    try { await adminAPI.deleteAssignment(id); toast.success('Removed'); await loadData(); } 
    catch (err: any) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

const handleAddUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword) { toast.error('Email and password required'); return; }
    setAddingUser(true);
    try {
      await adminAPI.createUser({ email: newUserEmail, password: newUserPassword, full_name: newUserName || undefined }, newUserRole);
      toast.success('User created');
      setShowAddUser(false);
      setNewUserEmail(''); setNewUserName(''); setNewUserPassword(''); setNewUserRole('athlete');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create user');
    } finally { setAddingUser(false); }
  };

  const handleCreateInvite = async (e: FormEvent) => {
    e.preventDefault();
    setCreatingInvite(true);
    try {
      const invite = await adminAPI.createInvite({ email: inviteEmail || undefined, role: inviteRole, expires_in_days: inviteExpiry });
      const link = window.location.origin + '/register?invite=' + invite.token;
      setGeneratedInviteLink(link);
      toast.success('Invite link created!');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create invite');
    } finally { setCreatingInvite(false); }
  };

  const copyInviteLink = () => { navigator.clipboard.writeText(generatedInviteLink); toast.success('Copied!'); };

  const handleChangeRole = async (userId: number, newRole: UserRole) => {
    if (!confirm('Change role to ' + newRole + '?')) return;
    try { await adminAPI.changeUserRole(userId, newRole); toast.success('Role updated'); await loadData(); }
    catch (err: any) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const handleLockUser = async (userId: number, locked: boolean) => {
    if (!confirm((locked ? 'Lock' : 'Unlock') + ' this account?')) return;
    try { await adminAPI.lockUser(userId, locked); toast.success('Done'); await loadData(); }
    catch (err: any) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('DELETE this user permanently?')) return;
    try { await adminAPI.deleteUser(userId); toast.success('Deleted'); await loadData(); }
    catch (err: any) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const handleRevokeInvite = async (inviteId: number) => {
    if (!confirm('Revoke this invite?')) return;
    try { await adminAPI.revokeInvite(inviteId); toast.success('Revoked'); await loadData(); }
    catch (err: any) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  if (loading) return <Layout><Loading text="Loading admin panel..." /></Layout>;
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage users, invites, and system</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard title="Total Users" value={stats.total_users.toString()} icon={HiUsers} color="blue" />
          <StatCard title="Athletes" value={stats.total_athletes.toString()} icon={BiCycling} color="green" />
          <StatCard title="Trainers" value={stats.total_trainers.toString()} icon={GiWeightLiftingUp} color="purple" />
          <StatCard title="Admins" value={stats.total_admins.toString()} icon={HiShieldCheck} color="red" />
          <StatCard title="Assignments" value={stats.total_active_assignments.toString()} icon={HiUserGroup} color="orange" />
        </div>
      )}

      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button onClick={() => setActiveTab('users')} className={`pb-3 px-1 font-medium ${activeTab === 'users' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}>Users ({users.length})</button>
        <button onClick={() => setActiveTab('assignments')} className={`pb-3 px-1 font-medium ${activeTab === 'assignments' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}>Assignments ({assignments.filter(a => a.is_active).length})</button>
        <button onClick={() => setActiveTab('invites')} className={`pb-3 px-1 font-medium ${activeTab === 'invites' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}>Invites ({invites.filter(i => i.is_valid).length})</button>
      </div>

      {activeTab === 'users' && (
        <>
          <div className="flex flex-wrap gap-3 mb-6 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <Button variant={roleFilter === '' ? 'primary' : 'secondary'} size="sm" onClick={() => { setRoleFilter(''); loadData(); }}>All</Button>
              <Button variant={roleFilter === 'athlete' ? 'primary' : 'secondary'} size="sm" onClick={() => { setRoleFilter('athlete'); loadData(); }}>Athletes</Button>
              <Button variant={roleFilter === 'trainer' ? 'primary' : 'secondary'} size="sm" onClick={() => { setRoleFilter('trainer'); loadData(); }}>Trainers</Button>
              <Button variant={roleFilter === 'admin' ? 'primary' : 'secondary'} size="sm" onClick={() => { setRoleFilter('admin'); loadData(); }}>Admins</Button>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => setShowAddUser(true)}><HiPlus className="w-4 h-4 mr-1 inline" />Add User</Button>
              <Button variant="secondary" onClick={() => setShowInviteModal(true)}><HiLink className="w-4 h-4 mr-1 inline" />Invite</Button>
            </div>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{user.full_name || 'Unnamed'}</div><div className="text-sm text-gray-500">{user.email}</div></td>
                      <td className="px-6 py-4">
                        <select value={user.role} onChange={(e) => handleChangeRole(user.id, e.target.value as UserRole)} className="text-sm border rounded px-2 py-1">
                          <option value="athlete">Athlete</option><option value="trainer">Trainer</option><option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.is_locked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{user.is_locked ? 'Locked' : 'Active'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => handleLockUser(user.id, !user.is_locked)}>{user.is_locked ? 'Unlock' : 'Lock'}</Button>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteUser(user.id)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
      
      {activeTab === 'assignments' && (
        <>
          <Card className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Assign Athlete to Trainer</h3>
            <form onSubmit={handleCreateAssignment} className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="block text-sm font-medium mb-1">Trainer</label>
                <select value={selectedTrainer} onChange={(e) => setSelectedTrainer(e.target.value ? Number(e.target.value) : '')} className="input w-full">
                  <option value="">Select trainer...</option>
                  {trainers.map(t => <option key={t.id} value={t.id}>{t.full_name || t.email}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Athlete</label>
                <select value={selectedAthlete} onChange={(e) => setSelectedAthlete(e.target.value ? Number(e.target.value) : '')} className="input w-full">
                  <option value="">Select athlete...</option>
                  {athletes.map(a => <option key={a.id} value={a.id}>{a.full_name || a.email}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <input type="text" value={assignmentNotes} onChange={(e) => setAssignmentNotes(e.target.value)} className="input w-full" placeholder="Optional..." />
              </div>
              <div className="flex items-end">
                <Button variant="primary" type="submit" isLoading={creatingAssignment} className="w-full"><HiPlus className="w-4 h-4 mr-1 inline" />Assign</Button>
              </div>
            </form>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold mb-4">Current Assignments</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trainer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Athlete</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assignments.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No assignments yet.</td></tr>
                  ) : assignments.map((a) => {
                    const trainer = users.find(u => u.id === a.trainer_id);
                    const athlete = users.find(u => u.id === a.athlete_id);
                    return (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4"><div className="text-sm font-medium">{trainer?.full_name || trainer?.email || 'Unknown'}</div></td>
                        <td className="px-6 py-4"><div className="text-sm font-medium">{athlete?.full_name || athlete?.email || 'Unknown'}</div></td>
                        <td className="px-6 py-4 text-sm">{new Date(a.assigned_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${a.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{a.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td className="px-6 py-4"><Button variant="danger" size="sm" onClick={() => handleDeleteAssignment(a.id)}>Remove</Button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
      {activeTab === 'invites' && (
        <>
          <div className="mb-6">
            <Button variant="primary" onClick={() => setShowInviteModal(true)}><HiPlus className="w-4 h-4 mr-1 inline" />Create Invite</Button>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invites.map((invite) => (
                    <tr key={invite.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{invite.email || 'Any'}</td>
                      <td className="px-6 py-4 text-sm capitalize">{invite.role}</td>
                      <td className="px-6 py-4 text-sm">{new Date(invite.expires_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${invite.is_valid ? 'bg-green-100 text-green-800' : invite.used_at ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {invite.used_at ? 'Used' : invite.is_valid ? 'Active' : 'Expired'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {invite.is_valid && (
                          <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={() => { navigator.clipboard.writeText(window.location.origin + '/register?invite=' + invite.token); toast.success('Copied!'); }}><HiClipboard className="w-4 h-4" /></Button>
                            <Button variant="danger" size="sm" onClick={() => handleRevokeInvite(invite.id)}>Revoke</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New User</h2>
              <button onClick={() => setShowAddUser(false)}><HiX className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Email *</label><input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} className="input w-full" required /></div>
              <div><label className="block text-sm font-medium mb-1">Full Name</label><input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className="input w-full" /></div>
              <div><label className="block text-sm font-medium mb-1">Password *</label><input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} className="input w-full" required /></div>
              <div><label className="block text-sm font-medium mb-1">Role</label><select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as UserRole)} className="input w-full"><option value="athlete">Athlete</option><option value="trainer">Trainer</option><option value="admin">Admin</option></select></div>
              <div className="flex gap-2 justify-end"><Button variant="secondary" type="button" onClick={() => setShowAddUser(false)}>Cancel</Button><Button variant="primary" type="submit" isLoading={addingUser}>Create User</Button></div>
            </form>
          </div>
        </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create Invite Link</h2>
              <button onClick={() => { setShowInviteModal(false); setGeneratedInviteLink(''); }}><HiX className="w-6 h-6" /></button>
            </div>
            {generatedInviteLink ? (
              <div className="space-y-4">
                <p className="text-green-600 font-medium">Invite link created!</p>
                <div className="flex gap-2">
                  <input type="text" value={generatedInviteLink} readOnly className="input w-full text-sm" />
                  <Button variant="primary" onClick={copyInviteLink}><HiClipboard className="w-5 h-5" /></Button>
                </div>
                <Button variant="secondary" className="w-full" onClick={() => { setShowInviteModal(false); setGeneratedInviteLink(''); setInviteEmail(''); }}>Done</Button>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">Email (optional)</label><input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="input w-full" placeholder="Leave empty for any email" /></div>
                <div><label className="block text-sm font-medium mb-1">Role</label><select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as UserRole)} className="input w-full"><option value="athlete">Athlete</option><option value="trainer">Trainer</option><option value="admin">Admin</option></select></div>
                <div><label className="block text-sm font-medium mb-1">Expires in (days)</label><input type="number" value={inviteExpiry} onChange={(e) => setInviteExpiry(parseInt(e.target.value))} className="input w-full" min="1" max="30" /></div>
                <div className="flex gap-2 justify-end"><Button variant="secondary" type="button" onClick={() => setShowInviteModal(false)}>Cancel</Button><Button variant="primary" type="submit" isLoading={creatingInvite}>Create Invite</Button></div>
              </form>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
