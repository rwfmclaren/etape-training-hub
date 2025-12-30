import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trainerAthleteAPI, trainingPlansAPI } from '../services/api';
import type { User, TrainerRequest, TrainingPlanSummary } from '../types';
import Layout from '../components/Layout';

export default function TrainerDashboard() {
  const [athletes, setAthletes] = useState<User[]>([]);
  const [requests, setRequests] = useState<TrainerRequest[]>([]);
  const [plans, setPlans] = useState<TrainingPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId: number, approve: boolean) => {
    try {
      await trainerAthleteAPI.respondToRequest(requestId, approve);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to respond to request');
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div style={{ color: 'red' }}>{error}</div></Layout>;

  return (
    <Layout>
      <h1>Trainer Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', backgroundColor: '#3498db', color: 'white', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Total Athletes</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{athletes.length}</p>
        </div>
        <div style={{ padding: '1.5rem', backgroundColor: '#2ecc71', color: 'white', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Active Plans</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>
            {plans.filter(p => p.is_active).length}
          </p>
        </div>
        <div style={{ padding: '1.5rem', backgroundColor: '#e67e22', color: 'white', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Pending Requests</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{requests.length}</p>
        </div>
      </div>

      {requests.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2>Pending Trainer Requests</h2>
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
            {requests.map((request) => (
              <div
                key={request.id}
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid #ddd',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
                    Request #{request.id}
                  </p>
                  {request.message && (
                    <p style={{ margin: 0, color: '#666' }}>{request.message}</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleRespondToRequest(request.id, true)}
                    style={{
                      backgroundColor: '#2ecc71',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespondToRequest(request.id, false)}
                    style={{
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>My Athletes ({athletes.length})</h2>
          <Link
            to="/training-plans/create"
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              textDecoration: 'none',
            }}
          >
            Create Training Plan
          </Link>
        </div>

        {athletes.length === 0 ? (
          <p style={{ color: '#666' }}>No athletes assigned yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {athletes.map((athlete) => (
              <div
                key={athlete.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '1rem',
                }}
              >
                <h3 style={{ margin: '0 0 0.5rem 0' }}>{athlete.full_name || 'Unnamed'}</h3>
                <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>{athlete.email}</p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#999' }}>
                  Member since: {new Date(athlete.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2>Recent Training Plans ({plans.length})</h2>
        {plans.length === 0 ? (
          <p style={{ color: '#666' }}>No training plans created yet.</p>
        ) : (
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
            {plans.slice(0, 5).map((plan) => (
              <Link
                key={plan.id}
                to={`/training-plans/${plan.id}`}
                style={{
                  display: 'block',
                  padding: '1rem',
                  borderBottom: '1px solid #ddd',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <h4 style={{ margin: '0 0 0.5rem 0' }}>{plan.title}</h4>
                <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
                  {plan.start_date && `${new Date(plan.start_date).toLocaleDateString()} - `}
                  {plan.end_date ? new Date(plan.end_date).toLocaleDateString() : 'Ongoing'}
                  {' • '}
                  <span style={{ color: plan.is_active ? '#2ecc71' : '#95a5a6' }}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </Link>
            ))}
          </div>
        )}
        {plans.length > 5 && (
          <Link
            to="/training-plans"
            style={{
              display: 'block',
              marginTop: '1rem',
              textAlign: 'center',
              color: '#3498db',
            }}
          >
            View All Plans →
          </Link>
        )}
      </div>
    </Layout>
  );
}
