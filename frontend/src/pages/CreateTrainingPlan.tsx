import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainingPlansAPI, trainerAthleteAPI } from '../services/api';
import type { User } from '../types';
import Layout from '../components/Layout';

export default function CreateTrainingPlan() {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    athlete_id: '',
    title: '',
    description: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadAthletes();
  }, []);

  const loadAthletes = async () => {
    try {
      const data = await trainerAthleteAPI.getMyAthletes();
      setAthletes(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load athletes');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.athlete_id || !formData.title) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const plan = await trainingPlansAPI.create({
        athlete_id: parseInt(formData.athlete_id),
        title: formData.title,
        description: formData.description || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
      });
      navigate(`/training-plans/${plan.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create training plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h1>Create Training Plan</h1>

      {error && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c00',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Athlete *
          </label>
          <select
            value={formData.athlete_id}
            onChange={(e) => setFormData({ ...formData, athlete_id: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '1rem',
            }}
            required
          >
            <option value="">Select an athlete</option>
            {athletes.map((athlete) => (
              <option key={athlete.id} value={athlete.id}>
                {athlete.full_name || athlete.email}
              </option>
            ))}
          </select>
          {athletes.length === 0 && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#999' }}>
              No athletes assigned yet. Athletes need to send you a trainer request first.
            </p>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Plan Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Marathon Training Program"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '1rem',
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the training plan goals and overview..."
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '1rem',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Start Date
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '1rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              End Date
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '1rem',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="submit"
            disabled={loading || athletes.length === 0}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: loading || athletes.length === 0 ? 'not-allowed' : 'pointer',
              opacity: loading || athletes.length === 0 ? 0.6 : 1,
            }}
          >
            {loading ? 'Creating...' : 'Create Plan'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/training-plans')}
            style={{
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </Layout>
  );
}
