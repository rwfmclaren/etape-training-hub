import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trainingPlansAPI } from '../services/api';
import type { TrainingPlanSummary } from '../types';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { HiDocumentText, HiCalendar, HiPlus } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function TrainingPlans() {
  const [plans, setPlans] = useState<TrainingPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await trainingPlansAPI.getAll();
      setPlans(data);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load training plans');
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = plans.filter((plan) => {
    if (filter === 'active') return plan.is_active;
    if (filter === 'inactive') return !plan.is_active;
    return true;
  });

  if (loading) return <Layout><Loading text="Loading training plans..." /></Layout>;

  const getEmptyDescription = () => {
    if (filter === 'all') return "Create your first training plan to get started.";
    return "No " + filter + " training plans found.";
  };

  const formatDateRange = (plan: TrainingPlanSummary) => {
    if (!plan.start_date) return "No dates set";
    const start = new Date(plan.start_date).toLocaleDateString();
    if (!plan.end_date) return start;
    return start + " - " + new Date(plan.end_date).toLocaleDateString();
  };

  const getStatusClass = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-600';
  };
  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Training Plans</h1>
          <p className="text-gray-600 mt-1">Manage and view your training programs</p>
        </div>
        <Link to="/training-plans/create">
          <Button variant="primary">
            <HiPlus className="w-5 h-5 mr-2 inline" />
            Create New Plan
          </Button>
        </Link>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({plans.length})
        </Button>
        <Button
          variant={filter === 'active' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('active')}
        >
          Active ({plans.filter(p => p.is_active).length})
        </Button>
        <Button
          variant={filter === 'inactive' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('inactive')}
        >
          Inactive ({plans.filter(p => !p.is_active).length})
        </Button>
      </div>

      {/* Plans List */}
      {filteredPlans.length === 0 ? (
        <EmptyState
          icon={HiDocumentText}
          title="No training plans found"
          description={getEmptyDescription()}
          action={
            filter === 'all' ? (
              <div className="mt-6">
                <Link to="/training-plans/create">
                  <Button variant="primary">Create Training Plan</Button>
                </Link>
              </div>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredPlans.map((plan) => (
            <Link key={plan.id} to={"/training-plans/" + plan.id}>
              <Card hover className="transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {plan.title}
                    </h3>
                    {plan.description && (
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {plan.description}
                      </p>
                    )}
                    <div className="flex items-center text-sm text-gray-500">
                      <HiCalendar className="w-4 h-4 mr-1" />
                      <span>{formatDateRange(plan)}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className={"px-3 py-1 rounded-full text-sm font-medium " + getStatusClass(plan.is_active)}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
