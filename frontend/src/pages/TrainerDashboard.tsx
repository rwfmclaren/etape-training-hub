import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trainerAthleteAPI, trainingPlansAPI } from '../services/api';
import type { User, TrainerRequest, TrainingPlanSummary } from '../types';
import Layout from '../components/Layout';
import Card, { StatCard } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { HiUsers, HiDocumentText, HiClock, HiCheckCircle, HiXCircle } from 'react-icons/hi';
import { GiWeightLiftingUp } from 'react-icons/gi';
import toast from 'react-hot-toast';

export default function TrainerDashboard() {
  const [athletes, setAthletes] = useState<User[]>([]);
  const [requests, setRequests] = useState<TrainerRequest[]>([]);
  const [plans, setPlans] = useState<TrainingPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [athletesData, requestsData, plansData] = await Promise.all([
        trainerAthleteAPI.getMyAthletes(),
        trainerAthleteAPI.getRequests(),
        trainingPlansAPI.getAll(),
      ]);
      setAthletes(athletesData);
      setRequests(requestsData.filter(r => r.status === 'pending'));
      setPlans(plansData);
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
      toast.error(err.response?.data?.detail || 'Failed to respond to request');
    }
  };

  if (loading) return <Layout><Loading text="Loading trainer dashboard..." /></Layout>;

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Trainer Dashboard</h1>
        <p className="text-gray-600">Manage your athletes and training plans</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Athletes"
          value={athletes.length.toString()}
          icon={HiUsers}
          color="blue"
        />
        <StatCard
          title="Active Plans"
          value={plans.filter(p => p.is_active).length.toString()}
          icon={HiDocumentText}
          color="green"
        />
        <StatCard
          title="Pending Requests"
          value={requests.length.toString()}
          icon={HiClock}
          color="orange"
        />
      </div>

      {/* Pending Requests */}
      {requests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Trainer Requests</h2>
          <Card>
            <div className="divide-y divide-gray-200">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">
                      Request #{request.id}
                    </p>
                    {request.message && (
                      <p className="text-gray-600">{request.message}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleRespondToRequest(request.id, true)}
                    >
                      <HiCheckCircle className="w-4 h-4 mr-1 inline" />
                      Accept
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRespondToRequest(request.id, false)}
                    >
                      <HiXCircle className="w-4 h-4 mr-1 inline" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* My Athletes */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">My Athletes ({athletes.length})</h2>
          <Link to="/training-plans/create">
            <Button variant="primary">
              <HiDocumentText className="w-4 h-4 mr-2 inline" />
              Create Training Plan
            </Button>
          </Link>
        </div>

        {athletes.length === 0 ? (
          <EmptyState
            icon={HiUsers}
            title="No athletes yet"
            description="When athletes send you training requests and you accept them, they will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {athletes.map((athlete) => (
              <Card key={athlete.id} hover>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <HiUsers className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="font-semibold text-gray-900">{athlete.full_name || 'Unnamed'}</h3>
                    <p className="text-sm text-gray-600 mt-1">{athlete.email}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Member since: {new Date(athlete.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Training Plans */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Training Plans ({plans.length})</h2>
        {plans.length === 0 ? (
          <EmptyState
            icon={GiWeightLiftingUp}
            title="No training plans yet"
            description="Create your first training plan to get started."
            action={
              <div className="mt-6">
                <Link to="/training-plans/create">
                  <Button variant="primary">Create Training Plan</Button>
                </Link>
              </div>
            }
          />
        ) : (
          <>
            <Card>
              <div className="divide-y divide-gray-200">
                {plans.slice(0, 5).map((plan) => (
                  <Link
                    key={plan.id}
                    to={`/training-plans/${plan.id}`}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <h4 className="font-semibold text-gray-900 mb-1">{plan.title}</h4>
                    <p className="text-sm text-gray-600">
                      {plan.start_date && `${new Date(plan.start_date).toLocaleDateString()} - `}
                      {plan.end_date ? new Date(plan.end_date).toLocaleDateString() : 'Ongoing'}
                      <span className="mx-2">•</span>
                      <span className={plan.is_active ? 'text-green-600 font-medium' : 'text-gray-500'}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </Link>
                ))}
              </div>
            </Card>
            {plans.length > 5 && (
              <div className="mt-4 text-center">
                <Link to="/training-plans" className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center">
                  View All Plans
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
