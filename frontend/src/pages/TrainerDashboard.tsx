import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trainerAthleteAPI, trainingPlansAPI, trainerDashboardAPI } from '../services/api';
import type { TrainerRequest, TrainingPlanSummary } from '../types';
import Layout from '../components/Layout';
import Card, { StatCard } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { HiUsers, HiDocumentText, HiClock, HiCheckCircle, HiXCircle, HiExclamation, HiUpload } from 'react-icons/hi';
import { GiWeightLiftingUp } from 'react-icons/gi';
import toast from 'react-hot-toast';

interface AthleteSummary {
  id: number;
  full_name: string;
  email: string;
  compliance_rate: number;
  last_activity: string | null;
  active_plans: number;
}

interface DashboardStats {
  total_athletes: number;
  active_plans: number;
  athletes_needing_attention: number;
  attention_list: Array<{ id: number; full_name: string; email: string }>;
  athlete_summaries: AthleteSummary[];
}

export default function TrainerDashboard() {
  const [requests, setRequests] = useState<TrainerRequest[]>([]);
  const [plans, setPlans] = useState<TrainingPlanSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsData, plansData, statsData] = await Promise.all([
        trainerAthleteAPI.getRequests(),
        trainingPlansAPI.getAll(),
        trainerDashboardAPI.getStats(),
      ]);
      setRequests(requestsData.filter(r => r.status === 'pending'));
      setPlans(plansData);
      setStats(statsData);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId: number, approve: boolean) => {
    try {
      await trainerAthleteAPI.respondToRequest(requestId, approve);
      toast.success(approve ? 'Request accepted' : 'Request rejected');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to respond');
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return diff + ' days ago';
    return d.toLocaleDateString();
  };

  if (loading) return <Layout><Loading text="Loading trainer dashboard..." /></Layout>;
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Trainer Dashboard</h1>
        <p className="text-gray-600">Manage your athletes and training plans</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Athletes"
          value={(stats?.total_athletes || 0).toString()}
          icon={HiUsers}
          color="blue"
        />
        <StatCard
          title="Active Plans"
          value={(stats?.active_plans || 0).toString()}
          icon={HiDocumentText}
          color="green"
        />
        <StatCard
          title="Need Attention"
          value={(stats?.athletes_needing_attention || 0).toString()}
          icon={HiExclamation}
          color="orange"
        />
        <StatCard
          title="Pending Requests"
          value={requests.length.toString()}
          icon={HiClock}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex gap-4">
          <Link to="/training-plans/builder">
            <Button variant="primary">
              <HiUpload className="w-5 h-5 mr-2 inline" />
              AI Plan Builder
            </Button>
          </Link>
          <Link to="/training-plans/create">
            <Button variant="secondary">
              <HiDocumentText className="w-5 h-5 mr-2 inline" />
              Manual Plan
            </Button>
          </Link>
        </div>
      </div>

      {/* Pending Requests */}
      {requests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Requests</h2>
          <Card>
            <div className="divide-y divide-gray-200">
              {requests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">Request #{req.id}</p>
                    {req.message && <p className="text-sm text-gray-600">{req.message}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={() => handleRespondToRequest(req.id, true)}>
                      <HiCheckCircle className="w-4 h-4 mr-1 inline" /> Accept
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleRespondToRequest(req.id, false)}>
                      <HiXCircle className="w-4 h-4 mr-1 inline" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Athletes with Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">My Athletes</h2>
        {!stats?.athlete_summaries?.length ? (
          <EmptyState
            icon={HiUsers}
            title="No athletes yet"
            description="When athletes send you requests and you accept them, they will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Athlete</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compliance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active Plans</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.athlete_summaries.map((athlete) => (
                  <tr key={athlete.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">{athlete.full_name || 'Unnamed'}</p>
                        <p className="text-sm text-gray-500">{athlete.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={"h-2 rounded-full " + (athlete.compliance_rate >= 80 ? 'bg-green-500' : athlete.compliance_rate >= 50 ? 'bg-yellow-500' : 'bg-red-500')}
                            style={{ width: athlete.compliance_rate + '%' }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{athlete.compliance_rate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(athlete.last_activity)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {athlete.active_plans}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={"/trainer/athletes/" + athlete.id}>
                        <Button variant="secondary" size="sm">View Details</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Plans */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Training Plans</h2>
        {plans.length === 0 ? (
          <EmptyState
            icon={GiWeightLiftingUp}
            title="No training plans yet"
            description="Create your first training plan to get started."
            action={
              <div className="mt-6 flex gap-4">
                <Link to="/training-plans/builder">
                  <Button variant="primary">AI Plan Builder</Button>
                </Link>
              </div>
            }
          />
        ) : (
          <Card>
            <div className="divide-y divide-gray-200">
              {plans.slice(0, 5).map((plan) => (
                <Link key={plan.id} to={"/training-plans/" + plan.id} className="block p-4 hover:bg-gray-50">
                  <h4 className="font-semibold text-gray-900 mb-1">{plan.title}</h4>
                  <p className="text-sm text-gray-600">
                    {plan.start_date && new Date(plan.start_date).toLocaleDateString()}
                    <span className="mx-2">-</span>
                    <span className={plan.is_active ? 'text-green-600 font-medium' : 'text-gray-500'}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
