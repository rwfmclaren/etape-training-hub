import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import type { InviteTokenPublic } from '../types';
import { BiCycling } from 'react-icons/bi';
import { HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import toast from 'react-hot-toast';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<InviteTokenPublic | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('invite');
    if (token) {
      setInviteToken(token);
      validateInviteToken(token);
    }
  }, [searchParams]);

  const validateInviteToken = async (token: string) => {
    setInviteLoading(true);
    setInviteError(null);
    try {
      const data = await authAPI.validateInviteToken(token);
      setInviteData(data);
      if (data.email) {
        setEmail(data.email);
      }
    } catch (err: any) {
      setInviteError(err.response?.data?.detail || 'Invalid or expired invite link');
      setInviteData(null);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register({
        email,
        password,
        full_name: fullName,
        invite_token: inviteToken || undefined
      });
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'trainer': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <BiCycling className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Etape Training Hub</h1>
          <p className="text-primary-100">Start your cycling journey</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h2>

          {inviteToken && (
            <div className="mb-6">
              {inviteLoading ? (
                <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                  <Loading text="Validating invite..." />
                </div>
              ) : inviteError ? (
                <div className="flex items-start p-4 bg-red-50 rounded-lg border border-red-200">
                  <HiExclamationCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800">Invalid Invite</p>
                    <p className="text-sm text-red-600 mt-1">{inviteError}</p>
                    <p className="text-sm text-gray-600 mt-2">
                      You can still register as a regular athlete below.
                    </p>
                  </div>
                </div>
              ) : inviteData ? (
                <div className="flex items-start p-4 bg-green-50 rounded-lg border border-green-200">
                  <HiCheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-800">Valid Invite</p>
                    <p className="text-sm text-gray-600 mt-1">
                      You have been invited to join as{' '}
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(inviteData.role)}`}>
                        {inviteData.role}
                      </span>
                    </p>
                    {inviteData.email && (
                      <p className="text-sm text-gray-500 mt-1">
                        Invite for: {inviteData.email}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="you@example.com"
                disabled={!!inviteData?.email}
              />
              {inviteData?.email && (
                <p className="mt-1 text-sm text-gray-500">
                  Email is pre-filled from your invite
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
                placeholder="********"
              />
              <p className="mt-1 text-sm text-gray-500">Must be at least 8 characters</p>
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full"
              disabled={inviteLoading}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-primary-100 text-sm mt-8">
          © 2025 Etape Training Hub. All rights reserved.
        </p>
      </div>
    </div>
  );
}
