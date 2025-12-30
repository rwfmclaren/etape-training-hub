import { useEffect, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ridesAPI, workoutsAPI, goalsAPI } from '../services/api';
import type { Ride, Workout, Goal, RideCreate, WorkoutCreate, GoalCreate } from '../types';
import Layout from '../components/Layout';

export default function Dashboard() {
  const { user, isAthlete, isTrainer, isAdmin } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // Form visibility states
  const [showRideForm, setShowRideForm] = useState(false);
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);

  // Advanced fields toggle
  const [showAdvancedRide, setShowAdvancedRide] = useState(false);
  const [showAdvancedWorkout, setShowAdvancedWorkout] = useState(false);
  const [showAdvancedGoal, setShowAdvancedGoal] = useState(false);

  // Submission states
  const [submittingRide, setSubmittingRide] = useState(false);
  const [submittingWorkout, setSubmittingWorkout] = useState(false);
  const [submittingGoal, setSubmittingGoal] = useState(false);

  // Error states
  const [rideError, setRideError] = useState('');
  const [workoutError, setWorkoutError] = useState('');
  const [goalError, setGoalError] = useState('');

  // Ride form fields (required)
  const [rideTitle, setRideTitle] = useState('');
  const [rideDistance, setRideDistance] = useState('');
  const [rideDuration, setRideDuration] = useState('');
  const [rideDate, setRideDate] = useState('');

  // Ride form fields (optional)
  const [rideDescription, setRideDescription] = useState('');
  const [rideElevation, setRideElevation] = useState('');
  const [rideAvgSpeed, setRideAvgSpeed] = useState('');
  const [rideMaxSpeed, setRideMaxSpeed] = useState('');
  const [rideAvgPower, setRideAvgPower] = useState('');
  const [rideAvgHR, setRideAvgHR] = useState('');
  const [rideMaxHR, setRideMaxHR] = useState('');
  const [rideAvgCadence, setRideAvgCadence] = useState('');
  const [rideRouteName, setRideRouteName] = useState('');
  const [rideType, setRideType] = useState('');

  // Workout form fields (required)
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutType, setWorkoutType] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutDate, setWorkoutDate] = useState('');

  // Workout form fields (optional)
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [workoutIntensity, setWorkoutIntensity] = useState('');
  const [workoutNotes, setWorkoutNotes] = useState('');

  // Goal form fields (required)
  const [goalTitle, setGoalTitle] = useState('');
  const [goalType, setGoalType] = useState('');

  // Goal form fields (optional)
  const [goalDescription, setGoalDescription] = useState('');
  const [goalTargetValue, setGoalTargetValue] = useState('');
  const [goalCurrentValue, setGoalCurrentValue] = useState('');
  const [goalUnit, setGoalUnit] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');

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

  // Form reset functions
  const resetRideForm = () => {
    setRideTitle('');
    setRideDistance('');
    setRideDuration('');
    setRideDate('');
    setRideDescription('');
    setRideElevation('');
    setRideAvgSpeed('');
    setRideMaxSpeed('');
    setRideAvgPower('');
    setRideAvgHR('');
    setRideMaxHR('');
    setRideAvgCadence('');
    setRideRouteName('');
    setRideType('');
    setShowAdvancedRide(false);
    setRideError('');
  };

  const resetWorkoutForm = () => {
    setWorkoutTitle('');
    setWorkoutType('');
    setWorkoutDuration('');
    setWorkoutDate('');
    setWorkoutDescription('');
    setWorkoutIntensity('');
    setWorkoutNotes('');
    setShowAdvancedWorkout(false);
    setWorkoutError('');
  };

  const resetGoalForm = () => {
    setGoalTitle('');
    setGoalType('');
    setGoalDescription('');
    setGoalTargetValue('');
    setGoalCurrentValue('');
    setGoalUnit('');
    setGoalTargetDate('');
    setShowAdvancedGoal(false);
    setGoalError('');
  };

  // Form submission handlers
  const handleRideSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setRideError('');
    setSubmittingRide(true);

    try {
      const rideData: RideCreate = {
        title: rideTitle,
        distance_km: parseFloat(rideDistance),
        duration_minutes: parseInt(rideDuration),
        ride_date: rideDate,
        description: rideDescription || undefined,
        elevation_gain_m: rideElevation ? parseFloat(rideElevation) : undefined,
        avg_speed_kmh: rideAvgSpeed ? parseFloat(rideAvgSpeed) : undefined,
        max_speed_kmh: rideMaxSpeed ? parseFloat(rideMaxSpeed) : undefined,
        avg_power_watts: rideAvgPower ? parseInt(rideAvgPower) : undefined,
        avg_heart_rate: rideAvgHR ? parseInt(rideAvgHR) : undefined,
        max_heart_rate: rideMaxHR ? parseInt(rideMaxHR) : undefined,
        avg_cadence: rideAvgCadence ? parseInt(rideAvgCadence) : undefined,
        route_name: rideRouteName || undefined,
        ride_type: rideType || undefined,
      };

      await ridesAPI.create(rideData);

      // Refresh rides data
      const ridesData = await ridesAPI.getAll();
      setRides(ridesData);

      // Close form and reset
      setShowRideForm(false);
      resetRideForm();
    } catch (error) {
      console.error('Error creating ride:', error);
      setRideError('Failed to create ride. Please try again.');
    } finally {
      setSubmittingRide(false);
    }
  };

  const handleWorkoutSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setWorkoutError('');
    setSubmittingWorkout(true);

    try {
      const workoutData: WorkoutCreate = {
        title: workoutTitle,
        workout_type: workoutType,
        duration_minutes: parseInt(workoutDuration),
        workout_date: workoutDate,
        description: workoutDescription || undefined,
        intensity: workoutIntensity || undefined,
        notes: workoutNotes || undefined,
      };

      await workoutsAPI.create(workoutData);

      // Refresh workouts data
      const workoutsData = await workoutsAPI.getAll();
      setWorkouts(workoutsData);

      // Close form and reset
      setShowWorkoutForm(false);
      resetWorkoutForm();
    } catch (error) {
      console.error('Error creating workout:', error);
      setWorkoutError('Failed to create workout. Please try again.');
    } finally {
      setSubmittingWorkout(false);
    }
  };

  const handleGoalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGoalError('');
    setSubmittingGoal(true);

    try {
      const goalData: GoalCreate = {
        title: goalTitle,
        goal_type: goalType,
        description: goalDescription || undefined,
        target_value: goalTargetValue ? parseFloat(goalTargetValue) : undefined,
        current_value: goalCurrentValue ? parseFloat(goalCurrentValue) : undefined,
        unit: goalUnit || undefined,
        target_date: goalTargetDate ? `${goalTargetDate}T00:00:00` : undefined,
      };

      await goalsAPI.create(goalData);

      // Refresh goals data
      const goalsData = await goalsAPI.getAll();
      setGoals(goalsData);

      // Close form and reset
      setShowGoalForm(false);
      resetGoalForm();
    } catch (error) {
      console.error('Error creating goal:', error);
      setGoalError('Failed to create goal. Please try again.');
    } finally {
      setSubmittingGoal(false);
    }
  };

  const totalDistance = rides.reduce((sum, ride) => sum + ride.distance_km, 0);
  const totalRides = rides.length;
  const totalWorkouts = workouts.length;
  const activeGoals = goals.filter((g) => !g.is_completed).length;

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Training Dashboard</h1>
        <p style={{ color: '#666' }}>Welcome back, {user?.full_name || user?.email}!</p>

        {isTrainer && (
          <div style={{ padding: '1rem', backgroundColor: '#e3f2fd', borderRadius: '8px', marginTop: '1rem' }}>
            <p style={{ margin: 0 }}>
              👥 <Link to="/trainer-dashboard" style={{ color: '#1976d2' }}>View your trainer dashboard</Link> to manage athletes and training plans
            </p>
          </div>
        )}

        {isAdmin && (
          <div style={{ padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '8px', marginTop: '1rem' }}>
            <p style={{ margin: 0 }}>
              ⚙️ <Link to="/admin" style={{ color: '#856404' }}>Access admin panel</Link> to manage users and view system stats
            </p>
          </div>
        )}
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

          {/* Ride Form */}
          <FormSection
            title="Ride"
            isOpen={showRideForm}
            onToggle={() => {
              setShowRideForm(!showRideForm);
              if (showRideForm) resetRideForm();
            }}
          >
            <form onSubmit={handleRideSubmit}>
              {rideError && (
                <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#f8d7da', borderRadius: '4px' }}>
                  {rideError}
                </div>
              )}

              <FormField
                label="Title"
                id="ride-title"
                value={rideTitle}
                onChange={(e) => setRideTitle(e.target.value)}
                required
              />

              <FormField
                label="Distance (km)"
                id="ride-distance"
                type="number"
                value={rideDistance}
                onChange={(e) => setRideDistance(e.target.value)}
                required
                min={0}
                step="0.1"
              />

              <FormField
                label="Duration (minutes)"
                id="ride-duration"
                type="number"
                value={rideDuration}
                onChange={(e) => setRideDuration(e.target.value)}
                required
                min={1}
              />

              <FormField
                label="Ride Date & Time"
                id="ride-date"
                type="datetime-local"
                value={rideDate}
                onChange={(e) => setRideDate(e.target.value)}
                required
              />

              <button
                type="button"
                onClick={() => setShowAdvancedRide(!showAdvancedRide)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginBottom: '15px',
                }}
              >
                {showAdvancedRide ? 'Hide Advanced Fields' : 'Show Advanced Fields'}
              </button>

              {showAdvancedRide && (
                <>
                  <FormField label="Description" id="ride-description">
                    <textarea
                      id="ride-description"
                      value={rideDescription}
                      onChange={(e) => setRideDescription(e.target.value)}
                      rows={3}
                      style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #dee2e6', borderRadius: '4px' }}
                    />
                  </FormField>

                  <FormField
                    label="Elevation Gain (m)"
                    id="ride-elevation"
                    type="number"
                    value={rideElevation}
                    onChange={(e) => setRideElevation(e.target.value)}
                    min={0}
                    step="0.1"
                  />

                  <FormField
                    label="Average Speed (km/h)"
                    id="ride-avg-speed"
                    type="number"
                    value={rideAvgSpeed}
                    onChange={(e) => setRideAvgSpeed(e.target.value)}
                    min={0}
                    step="0.1"
                  />

                  <FormField
                    label="Max Speed (km/h)"
                    id="ride-max-speed"
                    type="number"
                    value={rideMaxSpeed}
                    onChange={(e) => setRideMaxSpeed(e.target.value)}
                    min={0}
                    step="0.1"
                  />

                  <FormField
                    label="Average Power (watts)"
                    id="ride-avg-power"
                    type="number"
                    value={rideAvgPower}
                    onChange={(e) => setRideAvgPower(e.target.value)}
                    min={0}
                  />

                  <FormField
                    label="Average Heart Rate (bpm)"
                    id="ride-avg-hr"
                    type="number"
                    value={rideAvgHR}
                    onChange={(e) => setRideAvgHR(e.target.value)}
                    min={0}
                    max={220}
                  />

                  <FormField
                    label="Max Heart Rate (bpm)"
                    id="ride-max-hr"
                    type="number"
                    value={rideMaxHR}
                    onChange={(e) => setRideMaxHR(e.target.value)}
                    min={0}
                    max={220}
                  />

                  <FormField
                    label="Average Cadence (rpm)"
                    id="ride-avg-cadence"
                    type="number"
                    value={rideAvgCadence}
                    onChange={(e) => setRideAvgCadence(e.target.value)}
                    min={0}
                  />

                  <FormField
                    label="Route Name"
                    id="ride-route"
                    value={rideRouteName}
                    onChange={(e) => setRideRouteName(e.target.value)}
                  />

                  <FormField label="Ride Type" id="ride-type">
                    <select
                      id="ride-type"
                      value={rideType}
                      onChange={(e) => setRideType(e.target.value)}
                      style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #dee2e6', borderRadius: '4px' }}
                    >
                      <option value="">Select type...</option>
                      <option value="training">Training</option>
                      <option value="recovery">Recovery</option>
                      <option value="race">Race</option>
                      <option value="commute">Commute</option>
                      <option value="leisure">Leisure</option>
                    </select>
                  </FormField>
                </>
              )}

              <button
                type="submit"
                disabled={submittingRide}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: submittingRide ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: submittingRide ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                }}
              >
                {submittingRide ? 'Creating...' : 'Create Ride'}
              </button>
            </form>
          </FormSection>

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

          {/* Workout Form and Display */}
          <div style={{ marginBottom: '30px' }}>
            <h2>Workouts</h2>

            <FormSection
              title="Workout"
              isOpen={showWorkoutForm}
              onToggle={() => {
                setShowWorkoutForm(!showWorkoutForm);
                if (showWorkoutForm) resetWorkoutForm();
              }}
            >
              <form onSubmit={handleWorkoutSubmit}>
                {workoutError && (
                  <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#f8d7da', borderRadius: '4px' }}>
                    {workoutError}
                  </div>
                )}

                <FormField
                  label="Title"
                  id="workout-title"
                  value={workoutTitle}
                  onChange={(e) => setWorkoutTitle(e.target.value)}
                  required
                />

                <FormField label="Workout Type" id="workout-type">
                  <select
                    id="workout-type"
                    value={workoutType}
                    onChange={(e) => setWorkoutType(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #dee2e6', borderRadius: '4px' }}
                  >
                    <option value="">Select type...</option>
                    <option value="strength">Strength</option>
                    <option value="yoga">Yoga</option>
                    <option value="stretching">Stretching</option>
                    <option value="cardio">Cardio</option>
                    <option value="swimming">Swimming</option>
                    <option value="running">Running</option>
                  </select>
                </FormField>

                <FormField
                  label="Duration (minutes)"
                  id="workout-duration"
                  type="number"
                  value={workoutDuration}
                  onChange={(e) => setWorkoutDuration(e.target.value)}
                  required
                  min={1}
                />

                <FormField
                  label="Workout Date & Time"
                  id="workout-date"
                  type="datetime-local"
                  value={workoutDate}
                  onChange={(e) => setWorkoutDate(e.target.value)}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowAdvancedWorkout(!showAdvancedWorkout)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginBottom: '15px',
                  }}
                >
                  {showAdvancedWorkout ? 'Hide Advanced Fields' : 'Show Advanced Fields'}
                </button>

                {showAdvancedWorkout && (
                  <>
                    <FormField label="Description" id="workout-description">
                      <textarea
                        id="workout-description"
                        value={workoutDescription}
                        onChange={(e) => setWorkoutDescription(e.target.value)}
                        rows={3}
                        style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #dee2e6', borderRadius: '4px' }}
                      />
                    </FormField>

                    <FormField label="Intensity" id="workout-intensity">
                      <select
                        id="workout-intensity"
                        value={workoutIntensity}
                        onChange={(e) => setWorkoutIntensity(e.target.value)}
                        style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #dee2e6', borderRadius: '4px' }}
                      >
                        <option value="">Select intensity...</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </FormField>

                    <FormField label="Notes" id="workout-notes">
                      <textarea
                        id="workout-notes"
                        value={workoutNotes}
                        onChange={(e) => setWorkoutNotes(e.target.value)}
                        rows={3}
                        style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #dee2e6', borderRadius: '4px' }}
                      />
                    </FormField>
                  </>
                )}

                <button
                  type="submit"
                  disabled={submittingWorkout}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: submittingWorkout ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: submittingWorkout ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                  }}
                >
                  {submittingWorkout ? 'Creating...' : 'Create Workout'}
                </button>
              </form>
            </FormSection>

            {workouts.length === 0 ? (
              <p style={{ marginTop: '15px' }}>No workouts recorded yet. Start tracking your training activities!</p>
            ) : (
              <div style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
                {workouts.slice(0, 5).map((workout) => (
                  <div
                    key={workout.id}
                    style={{
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      padding: '15px',
                      backgroundColor: '#fff',
                    }}
                  >
                    <h3 style={{ margin: '0 0 10px 0' }}>{workout.title}</h3>
                    <p style={{ margin: '5px 0', color: '#6c757d' }}>
                      {workout.workout_type} • {workout.duration_minutes} min
                      {workout.intensity && ` • ${workout.intensity} intensity`}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      {new Date(workout.workout_date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Goal Form and Display */}
          <div style={{ marginBottom: '30px' }}>
            <h2>Goals</h2>

            <FormSection
              title="Goal"
              isOpen={showGoalForm}
              onToggle={() => {
                setShowGoalForm(!showGoalForm);
                if (showGoalForm) resetGoalForm();
              }}
            >
              <form onSubmit={handleGoalSubmit}>
                {goalError && (
                  <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#f8d7da', borderRadius: '4px' }}>
                    {goalError}
                  </div>
                )}

                <FormField
                  label="Title"
                  id="goal-title"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  required
                />

                <FormField label="Goal Type" id="goal-type">
                  <select
                    id="goal-type"
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #dee2e6', borderRadius: '4px' }}
                  >
                    <option value="">Select type...</option>
                    <option value="distance">Distance</option>
                    <option value="time">Time</option>
                    <option value="event">Event</option>
                    <option value="power">Power</option>
                    <option value="weight">Weight</option>
                  </select>
                </FormField>

                <button
                  type="button"
                  onClick={() => setShowAdvancedGoal(!showAdvancedGoal)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginBottom: '15px',
                  }}
                >
                  {showAdvancedGoal ? 'Hide Advanced Fields' : 'Show Advanced Fields'}
                </button>

                {showAdvancedGoal && (
                  <>
                    <FormField label="Description" id="goal-description">
                      <textarea
                        id="goal-description"
                        value={goalDescription}
                        onChange={(e) => setGoalDescription(e.target.value)}
                        rows={3}
                        style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #dee2e6', borderRadius: '4px' }}
                      />
                    </FormField>

                    <FormField
                      label="Target Value"
                      id="goal-target-value"
                      type="number"
                      value={goalTargetValue}
                      onChange={(e) => setGoalTargetValue(e.target.value)}
                      min={0}
                      step="0.1"
                    />

                    <FormField
                      label="Current Value"
                      id="goal-current-value"
                      type="number"
                      value={goalCurrentValue}
                      onChange={(e) => setGoalCurrentValue(e.target.value)}
                      min={0}
                      step="0.1"
                    />

                    <FormField
                      label="Unit"
                      id="goal-unit"
                      value={goalUnit}
                      onChange={(e) => setGoalUnit(e.target.value)}
                    />

                    <FormField
                      label="Target Date"
                      id="goal-target-date"
                      type="date"
                      value={goalTargetDate}
                      onChange={(e) => setGoalTargetDate(e.target.value)}
                    />
                  </>
                )}

                <button
                  type="submit"
                  disabled={submittingGoal}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: submittingGoal ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: submittingGoal ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                  }}
                >
                  {submittingGoal ? 'Creating...' : 'Create Goal'}
                </button>
              </form>
            </FormSection>

            {goals.length === 0 ? (
              <p style={{ marginTop: '15px' }}>No goals set yet. Create your first training goal!</p>
            ) : (
              <div style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
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
    </Layout>
  );
}

// Helper Components
function FormSection({
  title,
  isOpen,
  onToggle,
  children
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '20px', border: '1px solid #dee2e6', borderRadius: '8px', padding: '15px' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px',
          marginBottom: isOpen ? '15px' : '0',
        }}
      >
        {isOpen ? `Cancel ${title}` : `+ Add New ${title}`}
      </button>
      {isOpen && children}
    </div>
  );
}

function FormField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  required = false,
  min,
  max,
  step,
  children,
}: {
  label: string;
  id: string;
  type?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  required?: boolean;
  min?: number;
  max?: number;
  step?: string;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '15px' }}>
      <label htmlFor={id} style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
        {label} {required && <span style={{ color: 'red' }}>*</span>}
      </label>
      {children || (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          min={min}
          max={max}
          step={step}
          style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #dee2e6', borderRadius: '4px' }}
        />
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
