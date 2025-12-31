import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainingPlansAPI, trainerAthleteAPI } from '../services/api';
import type { User } from '../types';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { HiPlus, HiTrash, HiDocumentText } from 'react-icons/hi';
import toast from 'react-hot-toast';

interface WorkoutTemplate {
  id: string;
  title: string;
  workout_type: string;
  day_of_week: number;
  duration_minutes: number;
  intensity: string;
  description: string;
}

interface NutritionGuideline {
  id: string;
  day_of_week: number;
  meal_type: string;
  description: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WORKOUT_TYPES = ['cycling', 'strength', 'running', 'recovery', 'hiit', 'yoga', 'rest'];
const INTENSITIES = ['low', 'medium', 'high'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'pre_workout', 'post_workout', 'snack'];

export default function CreateTrainingPlan() {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Plan basics
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [selectedAthletes, setSelectedAthletes] = useState<number[]>([]);

  // Weekly structure
  const [weeklyStructure, setWeeklyStructure] = useState<Record<number, string>>({
    0: 'cycling', 1: 'strength', 2: 'cycling', 3: 'rest',
    4: 'cycling', 5: 'strength', 6: 'rest'
  });

  // Workouts
  const [workouts, setWorkouts] = useState<WorkoutTemplate[]>([]);

  // Nutrition
  const [nutritionGuidelines, setNutritionGuidelines] = useState<NutritionGuideline[]>([]);

  useEffect(() => {
    loadAthletes();
  }, []);

  const loadAthletes = async () => {
    try {
      const data = await trainerAthleteAPI.getMyAthletes();
      setAthletes(data);
    } catch (err: any) {
      toast.error('Failed to load athletes');
    }
  };

  const addWorkout = () => {
    setWorkouts([...workouts, {
      id: Date.now().toString(),
      title: '',
      workout_type: 'cycling',
      day_of_week: 0,
      duration_minutes: 60,
      intensity: 'medium',
      description: ''
    }]);
  };

  const updateWorkout = (id: string, field: keyof WorkoutTemplate, value: any) => {
    setWorkouts(workouts.map(w => w.id === id ? { ...w, [field]: value } : w));
  };

  const removeWorkout = (id: string) => {
    setWorkouts(workouts.filter(w => w.id !== id));
  };

  const addNutrition = () => {
    setNutritionGuidelines([...nutritionGuidelines, {
      id: Date.now().toString(),
      day_of_week: 0,
      meal_type: 'breakfast',
      description: ''
    }]);
  };

  const updateNutrition = (id: string, field: keyof NutritionGuideline, value: any) => {
    setNutritionGuidelines(nutritionGuidelines.map(n => n.id === id ? { ...n, [field]: value } : n));
  };

  const removeNutrition = (id: string) => {
    setNutritionGuidelines(nutritionGuidelines.filter(n => n.id !== id));
  };

  const toggleAthlete = (id: number) => {
    setSelectedAthletes(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a plan title');
      return;
    }
    if (selectedAthletes.length === 0) {
      toast.error('Please select at least one athlete');
      return;
    }

    setLoading(true);
    try {
      // Create a plan for each selected athlete
      for (const athleteId of selectedAthletes) {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + durationWeeks * 7);

        const plan = await trainingPlansAPI.create({
          athlete_id: athleteId,
          title,
          description,
          start_date: startDate,
          end_date: endDate.toISOString().split('T')[0],
        });

        // Add workouts for each week
        for (let week = 1; week <= durationWeeks; week++) {
          for (const workout of workouts) {
            const scheduledDate = new Date(startDate);
            scheduledDate.setDate(scheduledDate.getDate() + (week - 1) * 7 + workout.day_of_week);

            await trainingPlansAPI.addWorkout(plan.id, {
              training_plan_id: plan.id,
              title: workout.title || "Week " + week + " " + DAYS[workout.day_of_week] + " " + workout.workout_type,
              workout_type: workout.workout_type,
              scheduled_date: scheduledDate.toISOString().split('T')[0],
              duration_minutes: workout.duration_minutes,
              description: workout.description,
              intensity: workout.intensity,
            });
          }
        }

        // Add nutrition guidelines
        for (const nutrition of nutritionGuidelines) {
          await trainingPlansAPI.addNutrition(plan.id, {
            training_plan_id: plan.id,
            day_of_week: nutrition.day_of_week,
            meal_type: nutrition.meal_type,
            description: nutrition.description,
          });
        }
      }

      toast.success("Training plan created for " + selectedAthletes.length + " athlete(s)!");
      navigate('/training-plans');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create plan');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create Training Plan</h1>
        <p className="text-gray-600 mt-1">Build a comprehensive training plan for your athletes</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <button
              onClick={() => setStep(s)}
              className={"w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all " +
                (step === s ? "bg-primary-600 text-white" : step > s ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600")}
            >
              {s}
            </button>
            <span className={"ml-2 font-medium " + (step === s ? "text-primary-600" : "text-gray-500")}>
              {s === 1 && "Basics"}
              {s === 2 && "Workouts"}
              {s === 3 && "Nutrition"}
              {s === 4 && "Assign"}
            </span>
            {s < 4 && <div className="w-12 h-0.5 bg-gray-200 mx-4" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6 max-w-3xl">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Details</h3>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Plan Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., 8-Week Cycling Program"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the goals and focus of this training plan..."
                    rows={3}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Duration (weeks)</label>
                    <input
                      type="number"
                      min="1"
                      max="52"
                      value={durationWeeks}
                      onChange={(e) => setDurationWeeks(parseInt(e.target.value) || 4)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Structure</h3>
              <p className="text-sm text-gray-500 mb-4">Set the default activity type for each day of the week</p>
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day, idx) => (
                  <div key={day} className="text-center">
                    <label className="block text-xs font-medium text-gray-600 mb-1">{day.slice(0, 3)}</label>
                    <select
                      value={weeklyStructure[idx]}
                      onChange={(e) => setWeeklyStructure({ ...weeklyStructure, [idx]: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                    >
                      {WORKOUT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex justify-end">
              <Button variant="primary" type="button" onClick={() => setStep(2)}>
                Next: Workouts
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Workouts */}
        {step === 2 && (
          <div className="space-y-6 max-w-4xl">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Weekly Workouts</h3>
                <Button variant="secondary" type="button" onClick={addWorkout}>
                  <HiPlus className="w-5 h-5 mr-1" /> Add Workout
                </Button>
              </div>

              {workouts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No workouts added yet. Click "Add Workout" to create one.</p>
                  <p className="text-sm mt-2">These workouts will repeat each week of the plan.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workouts.map((workout) => (
                    <div key={workout.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 grid grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Day</label>
                            <select
                              value={workout.day_of_week}
                              onChange={(e) => updateWorkout(workout.id, 'day_of_week', parseInt(e.target.value))}
                              className="w-full px-2 py-1 text-sm border rounded"
                            >
                              {DAYS.map((day, idx) => (
                                <option key={day} value={idx}>{day}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                            <select
                              value={workout.workout_type}
                              onChange={(e) => updateWorkout(workout.id, 'workout_type', e.target.value)}
                              className="w-full px-2 py-1 text-sm border rounded"
                            >
                              {WORKOUT_TYPES.filter(t => t !== 'rest').map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Duration (min)</label>
                            <input
                              type="number"
                              value={workout.duration_minutes}
                              onChange={(e) => updateWorkout(workout.id, 'duration_minutes', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Intensity</label>
                            <select
                              value={workout.intensity}
                              onChange={(e) => updateWorkout(workout.id, 'intensity', e.target.value)}
                              className="w-full px-2 py-1 text-sm border rounded"
                            >
                              {INTENSITIES.map(i => (
                                <option key={i} value={i}>{i}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeWorkout(workout.id)}
                          className="ml-3 p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <HiTrash className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Title (optional)</label>
                          <input
                            type="text"
                            value={workout.title}
                            onChange={(e) => updateWorkout(workout.id, 'title', e.target.value)}
                            placeholder="e.g., Endurance Ride"
                            className="w-full px-2 py-1 text-sm border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                          <input
                            type="text"
                            value={workout.description}
                            onChange={(e) => updateWorkout(workout.id, 'description', e.target.value)}
                            placeholder="Workout details..."
                            className="w-full px-2 py-1 text-sm border rounded"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <div className="flex justify-between">
              <Button variant="secondary" type="button" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="primary" type="button" onClick={() => setStep(3)}>
                Next: Nutrition
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Nutrition */}
        {step === 3 && (
          <div className="space-y-6 max-w-4xl">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Nutrition Guidelines</h3>
                <Button variant="secondary" type="button" onClick={addNutrition}>
                  <HiPlus className="w-5 h-5 mr-1" /> Add Guideline
                </Button>
              </div>

              {nutritionGuidelines.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No nutrition guidelines added yet.</p>
                  <p className="text-sm mt-2">Add meal recommendations for different days.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {nutritionGuidelines.map((nutrition) => (
                    <div key={nutrition.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-32">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Day</label>
                        <select
                          value={nutrition.day_of_week}
                          onChange={(e) => updateNutrition(nutrition.id, 'day_of_week', parseInt(e.target.value))}
                          className="w-full px-2 py-1 text-sm border rounded"
                        >
                          {DAYS.map((day, idx) => (
                            <option key={day} value={idx}>{day}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-32">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Meal</label>
                        <select
                          value={nutrition.meal_type}
                          onChange={(e) => updateNutrition(nutrition.id, 'meal_type', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded"
                        >
                          {MEAL_TYPES.map(type => (
                            <option key={type} value={type}>{type.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Recommendation</label>
                        <input
                          type="text"
                          value={nutrition.description}
                          onChange={(e) => updateNutrition(nutrition.id, 'description', e.target.value)}
                          placeholder="e.g., High-carb meal 2 hours before training"
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNutrition(nutrition.id)}
                        className="mt-5 p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <HiTrash className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <div className="flex justify-between">
              <Button variant="secondary" type="button" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button variant="primary" type="button" onClick={() => setStep(4)}>
                Next: Assign Athletes
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Assign Athletes */}
        {step === 4 && (
          <div className="space-y-6 max-w-3xl">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Athletes</h3>
              {athletes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No athletes assigned to you yet.</p>
                  <p className="text-sm mt-2">Athletes need to send you a trainer request first.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {athletes.map((athlete) => (
                    <label
                      key={athlete.id}
                      className={"flex items-center p-3 rounded-lg cursor-pointer transition-all " +
                        (selectedAthletes.includes(athlete.id) ? "bg-primary-50 border-2 border-primary-500" : "bg-gray-50 border-2 border-transparent hover:bg-gray-100")}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAthletes.includes(athlete.id)}
                        onChange={() => toggleAthlete(athlete.id)}
                        className="w-5 h-5 text-primary-600 rounded"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{athlete.full_name || 'Unnamed'}</p>
                        <p className="text-sm text-gray-500">{athlete.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </Card>

            {/* Summary */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Title:</span> <span className="font-medium">{title || '-'}</span></div>
                <div><span className="text-gray-500">Duration:</span> <span className="font-medium">{durationWeeks} weeks</span></div>
                <div><span className="text-gray-500">Start Date:</span> <span className="font-medium">{startDate}</span></div>
                <div><span className="text-gray-500">Workouts/Week:</span> <span className="font-medium">{workouts.length}</span></div>
                <div><span className="text-gray-500">Nutrition Guidelines:</span> <span className="font-medium">{nutritionGuidelines.length}</span></div>
                <div><span className="text-gray-500">Athletes:</span> <span className="font-medium">{selectedAthletes.length} selected</span></div>
              </div>
            </Card>

            <div className="flex justify-between">
              <Button variant="secondary" type="button" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={loading || selectedAthletes.length === 0 || !title.trim()}
                isLoading={loading}
              >
                <HiDocumentText className="w-5 h-5 mr-2 inline" />
                Create Training Plan
              </Button>
            </div>
          </div>
        )}
      </form>
    </Layout>
  );
}
