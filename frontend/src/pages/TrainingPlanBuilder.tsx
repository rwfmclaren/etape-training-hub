import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiPlanBuilderAPI, trainerAthleteAPI } from '../services/api';
import type { User } from '../types';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import { HiUpload, HiDocumentText, HiCheck, HiX } from 'react-icons/hi';
import toast from 'react-hot-toast';

interface ParsedWorkout {
  title: string;
  workout_type: string;
  day_of_week: number;
  week: number;
  duration_minutes: number | null;
  intensity: string;
  description: string;
  exercises: Array<{ name: string; sets?: number; reps?: number; notes?: string }>;
}

interface ParsedData {
  title: string;
  description: string;
  duration_weeks: number;
  weekly_structure: Array<{ week: number; theme: string; focus: string }>;
  workouts: ParsedWorkout[];
  nutrition_guidance: Array<{ category: string; recommendation: string; details: string }>;
  goals: Array<{ title: string; goal_type: string; target_value: number; unit: string }>;
}

type Step = 'upload' | 'preview' | 'assign';

export default function TrainingPlanBuilder() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [athletes, setAthletes] = useState<User[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadAthletes();
  }, []);

  const loadAthletes = async () => {
    try {
      const data = await trainerAthleteAPI.getMyAthletes();
      setAthletes(data);
    } catch (err) {
      toast.error('Failed to load athletes');
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }
    setUploading(true);
    try {
      const result = await aiPlanBuilderAPI.parsePDF(file);
      if (result.success && result.parsed_data) {
        setParsedData(result.parsed_data);
        setStep('preview');
        toast.success('PDF parsed successfully!');
      } else {
        toast.error('Failed to parse PDF');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to parse PDF');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSavePlan = async () => {
    if (!selectedAthlete || !parsedData) return;
    setSaving(true);
    try {
      const plan = await aiPlanBuilderAPI.createFromParsed(selectedAthlete, parsedData, startDate);
      toast.success('Training plan created!');
      navigate('/training-plans/' + plan.id);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create plan');
    } finally {
      setSaving(false);
    }
  };

  const updateParsedData = (field: keyof ParsedData, value: any) => {
    if (parsedData) {
      setParsedData({ ...parsedData, [field]: value });
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">AI Training Plan Builder</h1>
        <p className="text-gray-600 mt-1">Upload a PDF training plan and let AI extract the structure</p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Steps indicator */}
      <div className="flex items-center mb-8">
        <div className={"flex items-center " + (step === 'upload' ? 'text-primary-600' : 'text-gray-400')}>
          <div className={"w-8 h-8 rounded-full flex items-center justify-center font-bold " + (step === 'upload' ? 'bg-primary-600 text-white' : 'bg-gray-200')}>1</div>
          <span className="ml-2 font-medium">Upload</span>
        </div>
        <div className="w-16 h-0.5 bg-gray-200 mx-2" />
        <div className={"flex items-center " + (step === 'preview' ? 'text-primary-600' : 'text-gray-400')}>
          <div className={"w-8 h-8 rounded-full flex items-center justify-center font-bold " + (step === 'preview' ? 'bg-primary-600 text-white' : 'bg-gray-200')}>2</div>
          <span className="ml-2 font-medium">Preview</span>
        </div>
        <div className="w-16 h-0.5 bg-gray-200 mx-2" />
        <div className={"flex items-center " + (step === 'assign' ? 'text-primary-600' : 'text-gray-400')}>
          <div className={"w-8 h-8 rounded-full flex items-center justify-center font-bold " + (step === 'assign' ? 'bg-primary-600 text-white' : 'bg-gray-200')}>3</div>
          <span className="ml-2 font-medium">Assign</span>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <HiUpload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Training Plan PDF</h3>
            <p className="text-gray-600 mb-6">
              Our AI will extract workouts, exercises, and nutrition guidance
            </p>
            {uploading ? (
              <Loading text="Analyzing PDF with AI..." />
            ) : (
              <Button variant="primary" onClick={handleFileSelect}>
                <HiUpload className="w-5 h-5 mr-2 inline" />
                Choose PDF File
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && parsedData && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={parsedData.title || ''}
                  onChange={(e) => updateParsedData('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (weeks)</label>
                <input
                  type="number"
                  value={parsedData.duration_weeks || 12}
                  onChange={(e) => updateParsedData('duration_weeks', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={parsedData.description || ''}
                onChange={(e) => updateParsedData('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
              />
            </div>
          </Card>

          {/* Workouts */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Workouts ({parsedData.workouts?.length || 0})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {parsedData.workouts?.map((workout, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{workout.title}</h4>
                    <span className="text-sm text-gray-500">Week {workout.week}, Day {workout.day_of_week}</span>
                  </div>
                  <div className="flex gap-3 mt-2 text-sm text-gray-600">
                    <span>{workout.workout_type}</span>
                    {workout.duration_minutes && <span>{workout.duration_minutes} min</span>}
                    <span className="capitalize">{workout.intensity} intensity</span>
                  </div>
                  {workout.exercises?.length > 0 && (
                    <div className="mt-2 text-sm text-gray-500">
                      {workout.exercises.length} exercises
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Goals */}
          {parsedData.goals?.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Goals</h3>
              <div className="space-y-2">
                {parsedData.goals.map((goal, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>{goal.title}</span>
                    <span className="text-sm text-gray-500">
                      {goal.target_value} {goal.unit}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Nutrition */}
          {parsedData.nutrition_guidance?.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutrition Guidance</h3>
              <div className="space-y-2">
                {parsedData.nutrition_guidance.map((nutr, idx) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded">
                    <span className="font-medium capitalize">{nutr.category}: </span>
                    <span className="text-gray-600">{nutr.recommendation}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => { setStep('upload'); setParsedData(null); }}>
              <HiX className="w-5 h-5 mr-2 inline" /> Start Over
            </Button>
            <Button variant="primary" onClick={() => setStep('assign')}>
              <HiCheck className="w-5 h-5 mr-2 inline" /> Continue to Assign
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Assign */}
      {step === 'assign' && parsedData && (
        <div className="max-w-xl mx-auto space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign to Athlete</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Athlete</label>
              {athletes.length === 0 ? (
                <p className="text-gray-500 text-sm">No athletes assigned to you yet.</p>
              ) : (
                <select
                  value={selectedAthlete || ''}
                  onChange={(e) => setSelectedAthlete(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select an athlete...</option>
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.full_name || a.email}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Plan Summary</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Title: {parsedData.title}</p>
                <p>Duration: {parsedData.duration_weeks} weeks</p>
                <p>Workouts: {parsedData.workouts?.length || 0}</p>
                <p>Goals: {parsedData.goals?.length || 0}</p>
              </div>
            </div>
          </Card>

          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep('preview')}>
              Back to Preview
            </Button>
            <Button
              variant="primary"
              onClick={handleSavePlan}
              disabled={!selectedAthlete || saving}
              isLoading={saving}
            >
              <HiDocumentText className="w-5 h-5 mr-2 inline" />
              Create Training Plan
            </Button>
          </div>
        </div>
      )}
    </Layout>
  );
}
