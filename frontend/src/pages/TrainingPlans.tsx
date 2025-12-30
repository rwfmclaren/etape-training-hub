import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trainingPlansAPI } from '../services/api';
import type { TrainingPlanSummary } from '../types';
import Layout from '../components/Layout';

export default function TrainingPlans() {
  const [plans, setPlans] = useState<TrainingPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      setError(err.response?.data?.detail || 'Failed to load training plans');
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = plans.filter((plan) => {
    if (filter === 'active') return plan.is_active;
    if (filter === 'inactive') return !plan.is_active;
    return true;
  });

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div style={{ color: 'red' }}>{error}</div></Layout>;

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Training Plans</h1>
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
          Create New Plan
        </Link>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: filter === 'all' ? '2px solid #3498db' : '1px solid #ddd',
            backgroundColor: filter === 'all' ? '#3498db' : 'white',
            color: filter === 'all' ? 'white' : '#333',
            cursor: 'pointer',
          }}
        >
          All ({plans.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: filter === 'active' ? '2px solid #2ecc71' : '1px solid #ddd',
            backgroundColor: filter === 'active' ? '#2ecc71' : 'white',
            color: filter === 'active' ? 'white' : '#333',
            cursor: 'pointer',
          }}
        >
          Active ({plans.filter(p => p.is_active).length})
        </button>
        <button
          onClick={() => setFilter('inactive')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: filter === 'inactive' ? '2px solid #95a5a6' : '1px solid #ddd',
            backgroundColor: filter === 'inactive' ? '#95a5a6' : 'white',
            color: filter === 'inactive' ? 'white' : '#333',
            cursor: 'pointer',
          }}
        >
          Inactive ({plans.filter(p => !p.is_active).length})
        </button>
      </div>

      {filteredPlans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <p>No training plans found.</p>
          <Link to="/training-plans/create" style={{ color: '#3498db' }}>
            Create your first training plan
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filteredPlans.map((plan) => (
            <Link
              key={plan.id}
              to={`/training-plans/${plan.id}`}
              style={{
                display: 'block',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '1.5rem',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>{plan.title}</h3>
                  {plan.description && (
                    <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>{plan.description}</p>
                  )}
                  <div style={{ fontSize: '0.875rem', color: '#999' }}>
                    {plan.start_date && (
                      <span>
                        {new Date(plan.start_date).toLocaleDateString()}
                        {plan.end_date && ` - ${new Date(plan.end_date).toLocaleDateString()}`}
                      </span>
                    )}
                    {!plan.start_date && <span>No dates set</span>}
                  </div>
                </div>
                <div>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      backgroundColor: plan.is_active ? '#d5f4e6' : '#e8e8e8',
                      color: plan.is_active ? '#2ecc71' : '#95a5a6',
                    }}
                  >
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
