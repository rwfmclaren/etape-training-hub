import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import TrainingPlans from './pages/TrainingPlans';
import CreateTrainingPlan from './pages/CreateTrainingPlan';
import TrainingPlanDetail from './pages/TrainingPlanDetail';
import AdminPanel from './pages/AdminPanel';
import MyTrainingPlan from './pages/MyTrainingPlan';
import FindTrainer from './pages/FindTrainer';
import MyRides from './pages/MyRides';
import MyWorkouts from './pages/MyWorkouts';
import MyGoals from './pages/MyGoals';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainer-dashboard"
        element={
          <ProtectedRoute>
            <TrainerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/training-plans"
        element={
          <ProtectedRoute>
            <TrainingPlans />
          </ProtectedRoute>
        }
      />
      <Route
        path="/training-plans/create"
        element={
          <ProtectedRoute>
            <CreateTrainingPlan />
          </ProtectedRoute>
        }
      />
      <Route
        path="/training-plans/:id"
        element={
          <ProtectedRoute>
            <TrainingPlanDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-training-plan"
        element={
          <ProtectedRoute>
            <MyTrainingPlan />
          </ProtectedRoute>
        }
      />
      <Route
        path="/find-trainer"
        element={
          <ProtectedRoute>
            <FindTrainer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-rides"
        element={
          <ProtectedRoute>
            <MyRides />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-workouts"
        element={
          <ProtectedRoute>
            <MyWorkouts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-goals"
        element={
          <ProtectedRoute>
            <MyGoals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPanel />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
