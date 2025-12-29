import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ridesAPI, workoutsAPI, goalsAPI } from '../services/api';
import type { Ride, Workout, Goal } from '../types';

export default function Dashboard() {
  const { user, logout } = useAuth();
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
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalDistance = rides.reduce((sum, ride) => sum + ride.distance_km, 0);
  const totalRides = rides.length;
  const totalWorkouts = workouts.length;
  const activeGoals = goals.filter((g) => !g.is_completed).length;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
        }}
      >
        <h1>Training Dashboard</h1>
        <div>
          <span style={{ marginRight: '20px' }}>Welcome, {user?.full_name || user?.email}</span>
          <button
            onClick={logout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '30px',
            }}
          >
            <StatCard title="Total Distance" value={`${totalDistance.toFixed(1)} km`} />
            <StatCard title="Total Rides" value={totalRides.toString()} />
            <StatCard title="Workouts" value={totalWorkouts.toString()} />
            <StatCard title="Active Goals" value={activeGoals.toString()} />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h2>Recent Rides</h2>
            {rides.length === 0 ? (
              <p>No rides recorded yet. Start tracking your cycling activities!</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={tableHeaderStyle}>Date</th>
                      <th style={tableHeaderStyle}>Title</th>
                      <th style={tableHeaderStyle}>Distance</th>
                      <th style={tableHeaderStyle}>Duration</th>
                      <th style={tableHeaderStyle}>Avg Speed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rides.slice(0, 5).map((ride) => (
                      <tr key={ride.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={tableCellStyle}>
                          {new Date(ride.ride_date).toLocaleDateString()}
                        </td>
                        <td style={tableCellStyle}>{ride.title}</td>
                        <td style={tableCellStyle}>{ride.distance_km} km</td>
                        <td style={tableCellStyle}>{ride.duration_minutes} min</td>
                        <td style={tableCellStyle}>
                          {ride.avg_speed_kmh ? `${ride.avg_speed_kmh.toFixed(1)} km/h` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h2>Goals</h2>
            {goals.length === 0 ? (
              <p>No goals set yet. Create your first training goal!</p>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    style={{
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      padding: '15px',
                      backgroundColor: goal.is_completed ? '#d4edda' : '#fff',
                    }}
                  >
                    <h3 style={{ margin: '0 0 10px 0' }}>
                      {goal.title} {goal.is_completed && '✓'}
                    </h3>
                    <p style={{ margin: '5px 0', color: '#6c757d' }}>{goal.description}</p>
                    <div style={{ marginTop: '10px', fontSize: '14px' }}>
                      <span>
                        Target: {goal.target_value} {goal.unit}
                      </span>
                      {goal.current_value !== null && (
                        <span style={{ marginLeft: '20px' }}>
                          Current: {goal.current_value} {goal.unit}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div
      style={{
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
      }}
    >
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6c757d' }}>{title}</h3>
      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#007bff' }}>{value}</div>
    </div>
  );
}

const tableHeaderStyle: React.CSSProperties = {
  padding: '12px',
  textAlign: 'left',
  fontWeight: 'bold',
  borderBottom: '2px solid #dee2e6',
};

const tableCellStyle: React.CSSProperties = {
  padding: '12px',
};
