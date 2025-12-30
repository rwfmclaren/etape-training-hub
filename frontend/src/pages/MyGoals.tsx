import { useState, useEffect } from 'react';
import { goalsAPI } from '../services/api';
import type { Goal } from '../types';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { HiOutlineFlag } from 'react-icons/hi';
import { HiCalendar } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function MyGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await goalsAPI.getAll();
      setGoals(data);
    } catch (err: any) {
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><Loading text="Loading your goals..." /></Layout>;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Goals</h1>
        <p className="text-gray-600 mt-1">Set and track your training objectives</p>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={HiOutlineFlag}
          title="No goals yet"
          description="Set your training goals to track your progress and stay motivated."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => (
            <Card
              key={goal.id}
              hover
              className={goal.is_achieved ? 'border-l-4 border-green-500 bg-green-50' : ''}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                    {goal.is_achieved && (
                      <span className="text-2xl ml-2">🎯</span>
                    )}
                  </div>

                  {goal.description && (
                    <p className="text-gray-600 mb-3">{goal.description}</p>
                  )}

                  <div className="space-y-2">
                    {goal.goal_type && (
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-700 mr-2">Type:</span>
                        <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-md text-xs font-medium capitalize">
                          {goal.goal_type}
                        </span>
                      </div>
                    )}

                    {goal.target_value && (
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-700 mr-2">Target:</span>
                        <span className="text-gray-600">
                          {goal.target_value} {goal.unit || ''}
                        </span>
                      </div>
                    )}

                    {goal.current_value !== null && goal.current_value !== undefined && (
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-700 mr-2">Current:</span>
                        <span className="text-gray-600">
                          {goal.current_value} {goal.unit || ''}
                        </span>
                      </div>
                    )}

                    {goal.target_value && goal.current_value !== null && goal.current_value !== undefined && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((goal.current_value / goal.target_value) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {goal.target_date && (
                      <div className="flex items-center text-sm text-gray-500 mt-3">
                        <HiCalendar className="w-4 h-4 mr-1" />
                        <span>
                          Target: {new Date(goal.target_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
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
    </Layout>
  );
}
