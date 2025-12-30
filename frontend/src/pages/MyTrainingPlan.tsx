import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trainingPlansAPI } from '../services/api';
import type { TrainingPlan } from '../types';
import Layout from '../components/Layout';
import Card, { StatCard } from '../components/ui/Card';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { HiOutlineFlag, HiCalendar, HiDocument } from 'react-icons/hi';
import { GiWeightLiftingUp } from 'react-icons/gi';
import toast from 'react-hot-toast';

export default function MyTrainingPlan() {
  const [activePlan, setActivePlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await trainingPlansAPI.getAll();

      // Find the active plan or most recent one
      const active = data.find(p => p.is_active);
      if (active) {
        const fullPlan = await trainingPlansAPI.getById(active.id);
        setActivePlan(fullPlan);
      } else if (data.length > 0) {
        const fullPlan = await trainingPlansAPI.getById(data[0].id);
        setActivePlan(fullPlan);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load training plan');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><Loading text="Loading training plan..." /></Layout>;

  if (!activePlan) {
    return (
      <Layout>
        <EmptyState
          icon={GiWeightLiftingUp}
          title="No Training Plan Assigned"
          description="You don't have an active training plan yet. Your trainer will create one for you."
        >
          <div className="mt-6">
            <p className="text-gray-600 mb-4">
              Don't have a trainer?{' '}
              <Link to="/find-trainer" className="text-primary-600 hover:text-primary-700 font-medium">
                Find one here
              </Link>
            </p>
          </div>
        </EmptyState>
      </Layout>
    );
  }

  const completedWorkouts = activePlan.workouts?.filter(w => w.is_completed).length || 0;
  const totalWorkouts = activePlan.workouts?.length || 0;
  const achievedGoals = activePlan.goals?.filter(g => g.is_achieved).length || 0;
  const totalGoals = activePlan.goals?.length || 0;
  const progress = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{activePlan.title}</h1>
        <p className="text-gray-600">
          {activePlan.start_date && `${new Date(activePlan.start_date).toLocaleDateString()} - `}
          {activePlan.end_date ? new Date(activePlan.end_date).toLocaleDateString() : 'Ongoing'}
        </p>
        {activePlan.description && (
          <Card className="mt-4 bg-gray-50">
            <p className="text-gray-700">{activePlan.description}</p>
          </Card>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Overall Progress"
          value={`${progress}%`}
          subtitle={`${completedWorkouts} of ${totalWorkouts} workouts`}
          color="blue"
        />
        <StatCard
          title="Goals Achieved"
          value={`${achievedGoals}/${totalGoals}`}
          subtitle={`${totalGoals > 0 ? Math.round((achievedGoals / totalGoals) * 100) : 0}% complete`}
          color="green"
        />
        <StatCard
          title="Resources"
          value={activePlan.documents?.length || 0}
          subtitle="documents available"
          color="purple"
          icon={HiDocument}
        />
      </div>

      {/* Upcoming Workouts */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Workouts</h2>
        {(!activePlan.workouts || activePlan.workouts.length === 0) ? (
          <Card className="p-6 text-center">
            <p className="text-gray-600">No workouts scheduled yet.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activePlan.workouts
              .filter(w => !w.is_completed)
              .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
              .slice(0, 5)
              .map((workout) => (
                <Card key={workout.id} hover>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{workout.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                        <span className="capitalize">{workout.workout_type}</span>
                        {workout.duration_minutes && <span>• {workout.duration_minutes} min</span>}
                        {workout.intensity && <span>• {workout.intensity} intensity</span>}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <HiCalendar className="w-4 h-4 mr-1" />
                        <span>{new Date(workout.scheduled_date).toLocaleDateString()}</span>
                      </div>
                      {workout.description && (
                        <p className="mt-3 text-gray-700">{workout.description}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Goals */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Goals</h2>
        {(!activePlan.goals || activePlan.goals.length === 0) ? (
          <Card className="p-6 text-center">
            <p className="text-gray-600">No goals set yet.</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {activePlan.goals.map((goal) => (
              <Card
                key={goal.id}
                className={goal.is_achieved ? 'border-l-4 border-green-500 bg-green-50' : ''}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{goal.title}</h4>
                      {goal.is_achieved && (
                        <span className="text-2xl">🎯</span>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-700">
                        <span className="font-medium mr-2">Type:</span>
                        <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-md text-xs font-medium capitalize">
                          {goal.goal_type}
                        </span>
                      </div>
                      {goal.target_value && (
                        <div className="flex items-center text-gray-700">
                          <span className="font-medium mr-2">Target:</span>
                          <span>{goal.target_value} {goal.unit || ''}</span>
                        </div>
                      )}
                      {goal.target_date && (
                        <div className="flex items-center text-gray-500">
                          <HiCalendar className="w-4 h-4 mr-1" />
                          <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {goal.is_achieved && (
                        <div className="mt-3">
                          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            ✓ Achieved
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Training Documents */}
      {activePlan.documents && activePlan.documents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Training Documents</h2>
          <Card>
            <div className="divide-y divide-gray-200">
              {activePlan.documents.map((doc, index) => (
                <div
                  key={doc.id}
                  className={`flex items-center justify-between p-4 ${index === 0 ? '' : ''}`}
                >
                  <div className="flex items-center flex-1">
                    <HiDocument className="w-6 h-6 text-primary-600 mr-3" />
                    <div>
                      <p className="font-semibold text-gray-900">{doc.filename}</p>
                      {doc.description && (
                        <p className="text-sm text-gray-600">{doc.description}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      trainingPlansAPI.downloadDocument(activePlan.id, doc.id).then((blob) => {
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = doc.filename;
                        a.click();
                      });
                    }}
                  >
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}
