import { useState, useEffect } from 'react';
import { workoutsAPI } from '../services/api';
import type { Workout } from '../types';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { GiWeightLiftingUp } from 'react-icons/gi';
import { HiClock, HiCalendar } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function MyWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      const data = await workoutsAPI.getAll();
      setWorkouts(data);
    } catch (err: any) {
      toast.error('Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><Loading text="Loading your workouts..." /></Layout>;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Workouts</h1>
        <p className="text-gray-600 mt-1">Track your training sessions and exercises</p>
      </div>

      {workouts.length === 0 ? (
        <EmptyState
          icon={GiWeightLiftingUp}
          title="No workouts yet"
          description="Start logging your training sessions to see them here."
        />
      ) : (
        <div className="grid gap-4">
          {workouts.map((workout) => (
            <Card key={workout.id} hover>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{workout.title}</h3>
                  {workout.description && (
                    <p className="text-gray-600 mt-1">{workout.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 mt-4">
                    {workout.workout_type && (
                      <div className="flex items-center text-gray-700">
                        <GiWeightLiftingUp className="w-5 h-5 mr-1 text-primary-600" />
                        <span className="font-medium">{workout.workout_type}</span>
                      </div>
                    )}

                    {workout.duration_minutes && (
                      <div className="flex items-center text-gray-700">
                        <HiClock className="w-5 h-5 mr-1 text-primary-600" />
                        <span className="font-medium">{workout.duration_minutes} min</span>
                      </div>
                    )}

                    {workout.intensity && (
                      <div className="flex items-center text-gray-700">
                        <span className="mr-1">🔥</span>
                        <span className="font-medium capitalize">{workout.intensity} intensity</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-4 text-sm">
                    <div className="flex items-center text-gray-500">
                      <HiCalendar className="w-4 h-4 mr-1" />
                      <span>
                        {new Date(workout.workout_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
