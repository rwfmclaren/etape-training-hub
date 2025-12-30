import { useState, useEffect } from 'react';
import { trainerAthleteAPI } from '../services/api';
import type { User, TrainerRequest, TrainerAssignment } from '../types';
import Layout from '../components/Layout';

export default function FindTrainer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [trainers, setTrainers] = useState<User[]>([]);
  const [myRequests, setMyRequests] = useState<TrainerRequest[]>([]);
  const [myTrainers, setMyTrainers] = useState<TrainerAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadMyData();
  }, []);

  const loadMyData = async () => {
    try {
      const [requests, assignments] = await Promise.all([
        trainerAthleteAPI.getRequests(),
        trainerAthleteAPI.getAssignments(),
      ]);
      setMyRequests(requests);
      setMyTrainers(assignments);
    } catch (err: any) {
      console.error('Failed to load data:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search term');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const results = await trainerAthleteAPI.searchTrainers(searchQuery);
      setTrainers(results);
      if (results.length === 0) {
        setError('No trainers found matching your search');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to search trainers');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (trainerId: number) => {
    try {
      setError('');
      setSuccess('');
      await trainerAthleteAPI.sendRequest(trainerId, `I would like to train with you!`);
      setSuccess('Request sent successfully!');
      await loadMyData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send request');
    }
  };

  const handleRemoveTrainer = async (assignmentId: number) => {
    if (!confirm('Are you sure you want to remove this trainer?')) return;

    try {
      await trainerAthleteAPI.deleteAssignment(assignmentId);
      setSuccess('Trainer removed successfully');
      await loadMyData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to remove trainer');
    }
  };

  const isPending = (trainerId: number) => {
    return myRequests.some(r => r.trainer_id === trainerId && r.status === 'pending');
  };

  const isAssigned = (trainerId: number) => {
    return myTrainers.some(a => a.trainer_id === trainerId && a.is_active);
  };

  return (
    <Layout>
      <h1>Find a Trainer</h1>

      {myTrainers.filter(a => a.is_active).length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2>My Trainers</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {myTrainers
              .filter(a => a.is_active)
              .map((assignment) => (
                <div
                  key={assignment.id}
                  style={{
                    padding: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#d5f4e6',
                  }}
                >
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>
                      Trainer ID: {assignment.trainer_id}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                      Connected since: {new Date(assignment.assigned_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveTrainer(assignment.id)}
                    style={{
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {myRequests.filter(r => r.status === 'pending').length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2>Pending Requests</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {myRequests
              .filter(r => r.status === 'pending')
              .map((request) => (
                <div
                  key={request.id}
                  style={{
                    padding: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: '#fff3cd',
                  }}
                >
                  <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>
                    Request to Trainer ID: {request.trainer_id}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                    Sent: {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h2>Search for Trainers</h2>
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
        {success && (
          <div
            style={{
              padding: '1rem',
              marginBottom: '1rem',
              backgroundColor: '#d5f4e6',
              border: '1px solid #2ecc71',
              borderRadius: '4px',
              color: '#1e7e34',
            }}
          >
            {success}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name or email..."
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '1rem',
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {trainers.length > 0 && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {trainers.map((trainer) => (
              <div
                key={trainer.id}
                style={{
                  padding: '1.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>{trainer.full_name || 'Unnamed Trainer'}</h3>
                  <p style={{ margin: '0 0 0.25rem 0', color: '#666' }}>{trainer.email}</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#999' }}>
                    Role: {trainer.role.toUpperCase()}
                  </p>
                </div>
                <div>
                  {isAssigned(trainer.id) ? (
                    <span
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        backgroundColor: '#d5f4e6',
                        color: '#2ecc71',
                      }}
                    >
                      ✓ Connected
                    </span>
                  ) : isPending(trainer.id) ? (
                    <span
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        backgroundColor: '#fff3cd',
                        color: '#f39c12',
                      }}
                    >
                      Request Pending
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(trainer.id)}
                      style={{
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Send Request
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
