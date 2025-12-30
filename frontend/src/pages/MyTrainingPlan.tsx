import { useState, useEffect } from 'react';
import { trainingPlansAPI } from '../services/api';
import type { TrainingPlan } from '../types';
import Layout from '../components/Layout';

export default function MyTrainingPlan() {
  const [activePlan, setActivePlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      setError(err.response?.data?.detail || 'Failed to load training plan');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div style={{ color: 'red' }}>{error}</div></Layout>;

  if (!activePlan) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>No Training Plan Assigned</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            You don't have an active training plan yet. Your trainer will create one for you.
          </p>
          <p style={{ color: '#666' }}>
            Don't have a trainer?{' '}
            <a href="/find-trainer" style={{ color: '#3498db' }}>
              Find one here
            </a>
          </p>
        </div>
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
      <div style={{ marginBottom: '2rem' }}>
        <h1>{activePlan.title}</h1>
        <p style={{ color: '#666', marginBottom: '0.5rem' }}>
          {activePlan.start_date && `${new Date(activePlan.start_date).toLocaleDateString()} - `}
          {activePlan.end_date ? new Date(activePlan.end_date).toLocaleDateString() : 'Ongoing'}
        </p>
        {activePlan.description && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              marginTop: '1rem',
            }}
          >
            <p style={{ margin: 0 }}>{activePlan.description}</p>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', backgroundColor: '#3498db', color: 'white', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Overall Progress</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{progress}%</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
            {completedWorkouts} of {totalWorkouts} workouts completed
          </p>
        </div>
        <div style={{ padding: '1.5rem', backgroundColor: '#2ecc71', color: 'white', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Goals Achieved</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>
            {achievedGoals}/{totalGoals}
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
            {totalGoals > 0 ? Math.round((achievedGoals / totalGoals) * 100) : 0}% complete
          </p>
        </div>
        <div style={{ padding: '1.5rem', backgroundColor: '#9b59b6', color: 'white', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Resources</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>
            {activePlan.documents?.length || 0}
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
            documents available
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Upcoming Workouts</h2>
        {(!activePlan.workouts || activePlan.workouts.length === 0) ? (
          <p style={{ color: '#666' }}>No workouts scheduled yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {activePlan.workouts
              .filter(w => !w.is_completed)
              .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
              .slice(0, 5)
              .map((workout) => (
                <div
                  key={workout.id}
                  style={{
                    padding: '1.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.5rem 0' }}>{workout.title}</h3>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
                        {workout.workout_type}
                        {workout.duration_minutes && ` • ${workout.duration_minutes} min`}
                        {workout.intensity && ` • ${workout.intensity} intensity`}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#999' }}>
                        📅 {new Date(workout.scheduled_date).toLocaleDateString()}
                      </p>
                      {workout.description && (
                        <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
                          {workout.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Goals</h2>
        {(!activePlan.goals || activePlan.goals.length === 0) ? (
          <p style={{ color: '#666' }}>No goals set yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {activePlan.goals.map((goal) => (
              <div
                key={goal.id}
                style={{
                  padding: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: goal.is_achieved ? '#d5f4e6' : 'white',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{goal.title}</h4>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666' }}>
                      {goal.goal_type}
                      {goal.target_value && ` • ${goal.target_value}${goal.unit || ''}`}
                    </p>
                    {goal.target_date && (
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#999' }}>
                        Target: {new Date(goal.target_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {goal.is_achieved && (
                    <span style={{ fontSize: '1.5rem' }}>✅</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activePlan.documents && activePlan.documents.length > 0 && (
        <div>
          <h2>Training Documents</h2>
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
            {activePlan.documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid #ddd',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>📄 {doc.filename}</p>
                  {doc.description && (
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>{doc.description}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    trainingPlansAPI.downloadDocument(activePlan.id, doc.id).then((blob) => {
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = doc.filename;
                      a.click();
                    });
                  }}
                  style={{
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
