import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navigation() {
  const { user, logout, isAthlete, isTrainer, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      backgroundColor: '#2c3e50',
      padding: '1rem 2rem',
      marginBottom: '2rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link to="/dashboard" style={{
            color: 'white',
            textDecoration: 'none',
            fontSize: '1.25rem',
            fontWeight: 'bold'
          }}>
            Etape Training Hub
          </Link>

          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/dashboard" style={{ color: '#ecf0f1', textDecoration: 'none' }}>
              Dashboard
            </Link>

            {isAthlete && (
              <>
                <Link to="/my-rides" style={{ color: '#ecf0f1', textDecoration: 'none' }}>
                  My Rides
                </Link>
                <Link to="/my-workouts" style={{ color: '#ecf0f1', textDecoration: 'none' }}>
                  My Workouts
                </Link>
                <Link to="/my-goals" style={{ color: '#ecf0f1', textDecoration: 'none' }}>
                  My Goals
                </Link>
                <Link to="/my-training-plan" style={{ color: '#ecf0f1', textDecoration: 'none' }}>
                  My Training Plan
                </Link>
                <Link to="/find-trainer" style={{ color: '#ecf0f1', textDecoration: 'none' }}>
                  Find Trainer
                </Link>
              </>
            )}

            {isTrainer && (
              <>
                <Link to="/trainer-dashboard" style={{ color: '#ecf0f1', textDecoration: 'none' }}>
                  My Athletes
                </Link>
                <Link to="/training-plans" style={{ color: '#ecf0f1', textDecoration: 'none' }}>
                  Training Plans
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link to="/admin" style={{ color: '#ecf0f1', textDecoration: 'none' }}>
                  User Management
                </Link>
                <Link to="/admin/stats" style={{ color: '#ecf0f1', textDecoration: 'none' }}>
                  System Stats
                </Link>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: '#ecf0f1' }}>
            {user?.full_name || user?.email} ({user?.role})
          </span>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
