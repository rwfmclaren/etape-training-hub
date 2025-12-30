import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { trainerDashboardAPI } from '../services/api';
import Layout from '../components/Layout';
import Card, { StatCard } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import { BiCycling } from 'react-icons/bi';
import { GiWeightLiftingUp } from 'react-icons/gi';
import { HiOutlineFlag, HiArrowLeft } from 'react-icons/hi';
import toast from 'react-hot-toast';

interface AthleteStats {
  athlete: { id: number; email: string; full_name: string; created_at: string };
  rides: { total: number; this_week: number; total_distance_km: number };
  workouts: { total: number; this_week: number };
  goals: { total: number; completed: number };
  training_plans: { active_count: number; compliance_rate: number; planned_workouts: number; completed_workouts: number };
  last_activity: string | null;
}

interface Activity {
  type: 'ride' | 'workout';
  id: number;
  title: string;
  date: string;
  details: any;
}

interface Plan {
  id: number;
  title: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

export default function AthleteDetailView() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const [stats, setStats] = useState<AthleteStats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (athleteId) loadData(parseInt(athleteId));
  }, [athleteId]);

  const loadData = async (id: number) => {
    try {
      setLoading(true);
      const [statsData, activityData, plansData] = await Promise.all([
        trainerDashboardAPI.getAthleteStats(id),
        trainerDashboardAPI.getAthleteActivity(id, 10),
        trainerDashboardAPI.getAthletePlans(id),
      ]);
      setStats(statsData);
      setActivity(activityData);
      setPlans(plansData);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load athlete data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><Loading text="Loading athlete data..." /></Layout>;
  if (!stats) return <Layout><p>Athlete not found</p></Layout>;
  return (
    <Layout>
      <div className="mb-6">
        <Link to="/trainer-dashboard" className="text-primary-600 hover:text-primary-700 flex items-center mb-4">
          <HiArrowLeft className="w-5 h-5 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{stats.athlete.full_name || 'Athlete'}</h1>
        <p className="text-gray-600">{stats.athlete.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Rides" value={stats.rides.total.toString()} icon={BiCycling} color="blue" />
        <StatCard title="Total Distance" value={stats.rides.total_distance_km + ' km'} icon={BiCycling} color="green" />
        <StatCard title="Workouts" value={stats.workouts.total.toString()} icon={GiWeightLiftingUp} color="purple" />
        <StatCard title="Compliance" value={stats.training_plans.compliance_rate + '%'} icon={HiOutlineFlag} color="orange" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {activity.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.type + '-' + item.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  {item.type === 'ride' ? (
                    <BiCycling className="w-8 h-8 text-blue-500 mr-3" />
                  ) : (
                    <GiWeightLiftingUp className="w-8 h-8 text-purple-500 mr-3" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500">
                      {item.date && new Date(item.date).toLocaleDateString()}
                      {item.details?.duration_minutes && ' - ' + item.details.duration_minutes + ' min'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Training Plans */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Training Plans</h3>
            <Link to="/training-plans/builder">
              <Button variant="primary" size="sm">Create Plan</Button>
            </Link>
          </div>
          {plans.length === 0 ? (
            <p className="text-gray-500 text-sm">No training plans yet</p>
          ) : (
            <div className="space-y-2">
              {plans.map((plan) => (
                <Link key={plan.id} to={"/training-plans/" + plan.id} className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{plan.title}</p>
                      <p className="text-sm text-gray-500">
                        {plan.start_date && new Date(plan.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={"px-2 py-1 rounded text-xs font-medium " + (plan.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600')}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Goals Progress */}
      <Card className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Goals Progress</h3>
        <div className="flex items-center">
          <div className="w-1/2 bg-gray-200 rounded-full h-4">
            <div
              className="bg-primary-600 h-4 rounded-full"
              style={{ width: (stats.goals.total > 0 ? (stats.goals.completed / stats.goals.total * 100) : 0) + '%' }}
            />
          </div>
          <span className="ml-4 text-gray-600">
            {stats.goals.completed} / {stats.goals.total} completed
          </span>
        </div>
      </Card>
    </Layout>
  );
}
