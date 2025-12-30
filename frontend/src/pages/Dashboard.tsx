import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ridesAPI, workoutsAPI, goalsAPI } from '../services/api';
import type { Ride, Workout, Goal } from '../types';
import Layout from '../components/Layout';
import { StatCard } from '../components/ui/Card';
import Card from '../components/ui/Card';
import Loading from '../components/ui/Loading';
import Button from '../components/ui/Button';
import { BiCycling } from 'react-icons/bi';
import { GiWeightLiftingUp } from 'react-icons/gi';
import { HiOutlineFlag, HiClock, HiArrowRight } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, isTrainer, isAdmin } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ridesData, workoutsData, goalsData] = await Promise.all([
          ridesAPI.getAll(),
          workoutsAPI.getAll(),
          goalsAPI.getAll(),
        ]);
        setRides(ridesData);
        setWorkouts(workoutsData);
        setGoals(goalsData);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <Layout><Loading text="Loading dashboard..." /></Layout>;

  const totalDistance = rides.reduce((sum, ride) => sum + ride.distance_km, 0);
  const totalRides = rides.length;
  const totalWorkouts = workouts.length;
  const activeGoals = goals.filter((g) => !g.is_completed).length;

  return (
    <Layout>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.full_name || user?.email}!
        </h1>
        <p className="text-gray-600">Here's your training overview</p>
      </div>

      {/* Role-specific banners */}
      {isTrainer && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-3">👥</span>
              <div>
                <h3 className="font-semibold text-gray-900">Trainer Dashboard</h3>
                <p className="text-sm text-gray-600">Manage your athletes and training plans</p>
              </div>
            </div>
            <Link to="/trainer-dashboard">
              <Button variant="primary" size="sm">
                View Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {isAdmin && (
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚙️</span>
              <div>
                <h3 className="font-semibold text-gray-900">Admin Panel</h3>
                <p className="text-sm text-gray-600">Manage users and view system stats</p>
              </div>
            </div>
            <Link to="/admin">
              <Button variant="primary" size="sm">
                Access Panel
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Distance"
          value={`${totalDistance.toFixed(1)} km`}
          icon={BiCycling}
          color="blue"
        />
        <StatCard
          title="Total Rides"
          value={totalRides.toString()}
          icon={BiCycling}
          color="green"
        />
        <StatCard
          title="Workouts"
          value={totalWorkouts.toString()}
          icon={GiWeightLiftingUp}
          color="purple"
        />
        <StatCard
          title="Active Goals"
          value={activeGoals.toString()}
          icon={HiOutlineFlag}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/my-rides">
            <Card hover className="text-center p-6">
              <BiCycling className="w-12 h-12 mx-auto mb-3 text-primary-600" />
              <h3 className="font-semibold text-gray-900 mb-1">My Rides</h3>
              <p className="text-sm text-gray-600">View all cycling activities</p>
            </Card>
          </Link>
          <Link to="/my-workouts">
            <Card hover className="text-center p-6">
              <GiWeightLiftingUp className="w-12 h-12 mx-auto mb-3 text-primary-600" />
              <h3 className="font-semibold text-gray-900 mb-1">My Workouts</h3>
              <p className="text-sm text-gray-600">Track training sessions</p>
            </Card>
          </Link>
          <Link to="/my-goals">
            <Card hover className="text-center p-6">
              <HiOutlineFlag className="w-12 h-12 mx-auto mb-3 text-primary-600" />
              <h3 className="font-semibold text-gray-900 mb-1">My Goals</h3>
              <p className="text-sm text-gray-600">Set and achieve targets</p>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
        </div>

        <div className="space-y-6">
          {/* Recent Rides */}
          {rides.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BiCycling className="w-5 h-5 mr-2 text-primary-600" />
                  Recent Rides
                </h3>
                <Link to="/my-rides" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
                  View all <HiArrowRight className="ml-1" />
                </Link>
              </div>
              <div className="grid gap-3">
                {rides.slice(0, 3).map((ride) => (
                  <Card key={ride.id} hover className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{ride.title}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>{ride.distance_km} km</span>
                          <span className="flex items-center">
                            <HiClock className="w-4 h-4 mr-1" />
                            {ride.duration_minutes} min
                          </span>
                          <span className="text-gray-500">
                            {new Date(ride.ride_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recent Workouts */}
          {workouts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <GiWeightLiftingUp className="w-5 h-5 mr-2 text-primary-600" />
                  Recent Workouts
                </h3>
                <Link to="/my-workouts" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
                  View all <HiArrowRight className="ml-1" />
                </Link>
              </div>
              <div className="grid gap-3">
                {workouts.slice(0, 3).map((workout) => (
                  <Card key={workout.id} hover className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{workout.title}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span className="capitalize">{workout.workout_type}</span>
                          {workout.duration_minutes && (
                            <span className="flex items-center">
                              <HiClock className="w-4 h-4 mr-1" />
                              {workout.duration_minutes} min
                            </span>
                          )}
                          <span className="text-gray-500">
                            {new Date(workout.workout_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Active Goals */}
          {goals.filter(g => !g.is_completed).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <HiOutlineFlag className="w-5 h-5 mr-2 text-primary-600" />
                  Active Goals
                </h3>
                <Link to="/my-goals" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
                  View all <HiArrowRight className="ml-1" />
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {goals.filter(g => !g.is_completed).slice(0, 4).map((goal) => (
                  <Card key={goal.id} className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{goal.title}</h4>
                    {goal.target_value && goal.current_value !== null && goal.current_value !== undefined && (
                      <div>
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
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {rides.length === 0 && workouts.length === 0 && goals.length === 0 && (
            <Card className="p-8 text-center">
              <div className="mb-4">
                <BiCycling className="w-16 h-16 mx-auto text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Started!</h3>
              <p className="text-gray-600 mb-6">
                Start tracking your rides, workouts, and goals to see your progress here.
              </p>
              <div className="flex gap-3 justify-center">
                <Link to="/my-rides">
                  <Button variant="primary">Log a Ride</Button>
                </Link>
                <Link to="/my-goals">
                  <Button variant="secondary">Set a Goal</Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
