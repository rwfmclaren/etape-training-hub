import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trainingPlansAPI } from '../services/api';
import type { TrainingPlan } from '../types';
import Layout from '../components/Layout';

export default function TrainingPlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadPlan();
    }
  }, [id]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const data = await trainingPlansAPI.getById(parseInt(id!));
      setPlan(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load training plan');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!plan || !confirm('Are you sure you want to delete this training plan?')) return;

    try {
      await trainingPlansAPI.delete(plan.id);
      navigate('/training-plans');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete training plan');
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div style={{ color: 'red' }}>{error}</div></Layout>;
  if (!plan) return <Layout><div>Training plan not found</div></Layout>;

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0' }}>{plan.title}</h1>
            <p style={{ margin: 0, color: '#666' }}>
              {plan.start_date && `${new Date(plan.start_date).toLocaleDateString()} - `}
              {plan.end_date ? new Date(plan.end_date).toLocaleDateString() : 'Ongoing'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                backgroundColor: plan.is_active ? '#d5f4e6' : '#e8e8e8',
                color: plan.is_active ? '#2ecc71' : '#95a5a6',
              }}
            >
              {plan.is_active ? 'Active' : 'Inactive'}
            </span>
            <button
              onClick={handleDelete}
              style={{
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Delete Plan
            </button>
          </div>
        </div>

        {plan.description && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              marginBottom: '1rem',
            }}
          >
            <p style={{ margin: 0 }}>{plan.description}</p>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.875rem' }}>Workouts</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            {plan.workouts?.length || 0}
          </p>
        </div>
        <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.875rem' }}>Goals</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            {plan.goals?.length || 0}
          </p>
        </div>
        <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.875rem' }}>Nutrition Plans</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            {plan.nutrition_plans?.length || 0}
          </p>
        </div>
        <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.875rem' }}>Documents</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            {plan.documents?.length || 0}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Workouts</h2>
        {(!plan.workouts || plan.workouts.length === 0) ? (
          <p style={{ color: '#666' }}>No workouts added yet.</p>
        ) : (
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
            {plan.workouts.map((workout) => (
              <div
                key={workout.id}
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid #ddd',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0' }}>{workout.title}</h4>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666' }}>
                      {workout.workout_type}
                      {workout.duration_minutes && ` • ${workout.duration_minutes} min`}
                      {workout.intensity && ` • ${workout.intensity}`}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#999' }}>
                      Scheduled: {new Date(workout.scheduled_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      backgroundColor: workout.is_completed ? '#d5f4e6' : '#fff3cd',
                      color: workout.is_completed ? '#2ecc71' : '#f39c12',
                    }}
                  >
                    {workout.is_completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
                {workout.description && (
                  <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.875rem' }}>
                    {workout.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Goals</h2>
        {(!plan.goals || plan.goals.length === 0) ? (
          <p style={{ color: '#666' }}>No goals added yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {plan.goals.map((goal) => (
              <div
                key={goal.id}
                style={{
                  padding: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0' }}>{goal.title}</h4>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666' }}>
                      {goal.goal_type}
                      {goal.target_value && ` • Target: ${goal.target_value}${goal.unit || ''}`}
                    </p>
                    {goal.target_date && (
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#999' }}>
                        Target Date: {new Date(goal.target_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      backgroundColor: goal.is_achieved ? '#d5f4e6' : '#e8e8e8',
                      color: goal.is_achieved ? '#2ecc71' : '#95a5a6',
                    }}
                  >
                    {goal.is_achieved ? 'Achieved' : 'In Progress'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {plan.documents && plan.documents.length > 0 && (
        <div>
          <h2>Documents</h2>
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
            {plan.documents.map((doc) => (
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
                  <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>{doc.filename}</p>
                  {doc.description && (
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>{doc.description}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    trainingPlansAPI.downloadDocument(plan.id, doc.id).then((blob) => {
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
