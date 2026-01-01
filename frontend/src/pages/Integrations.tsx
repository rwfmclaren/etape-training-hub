import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { integrationsAPI } from '../services/api';
import type { IntegrationStatus, SyncedActivity } from '../types';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import { HiLink, HiRefresh, HiCheck, HiX, HiClock } from 'react-icons/hi';
import { BiCycling } from 'react-icons/bi';
import toast from 'react-hot-toast';

export default function Integrations() {
  const [searchParams] = useSearchParams();
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [activities, setActivities] = useState<SyncedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    loadData();

    // Check if we just connected
    const connected = searchParams.get('connected');
    if (connected === 'strava') {
      toast.success('Strava connected successfully!');
      // Clean up URL
      window.history.replaceState({}, '', '/integrations');
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      const [statusData, activitiesData] = await Promise.all([
        integrationsAPI.getStatus(),
        integrationsAPI.getActivities().catch(() => [])
      ]);
      setIntegrations(statusData);
      setActivities(activitiesData);
    } catch (err) {
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStrava = async () => {
    setConnecting(true);
    try {
      const { auth_url } = await integrationsAPI.connectStrava();
      window.location.href = auth_url;
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to connect Strava');
      setConnecting(false);
    }
  };

  const handleDisconnectStrava = async () => {
    if (!confirm('Are you sure you want to disconnect Strava?')) return;

    try {
      await integrationsAPI.disconnectStrava();
      toast.success('Strava disconnected');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to disconnect Strava');
    }
  };

  const handleSyncStrava = async () => {
    setSyncing(true);
    try {
      const result = await integrationsAPI.syncStrava(30);
      toast.success(result.message);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to sync activities');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const getStravaStatus = () => {
    return integrations.find(i => i.provider === 'strava');
  };

  if (loading) {
    return (
      <Layout>
        <Loading text="Loading integrations..." />
      </Layout>
    );
  }

  const stravaStatus = getStravaStatus();

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600 mt-1">Connect your fitness apps to sync activities</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Strava Card */}
        <Card>
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116zm-4.916-10.172L9.066 10h3.065l1.407 2.772 1.407-2.772h3.065l-4.47-8.828-4.47 8.828h3.065l1.407-2.772z"/>
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Strava</h3>
                <p className="text-sm text-gray-500">Sync your rides and activities</p>
              </div>
            </div>
            {stravaStatus?.connected ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <HiCheck className="w-4 h-4 mr-1" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                <HiX className="w-4 h-4 mr-1" /> Not Connected
              </span>
            )}
          </div>

          {stravaStatus?.connected ? (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Connected:</span>
                  <p className="font-medium">{formatDate(stravaStatus.connected_at!)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Last Sync:</span>
                  <p className="font-medium">
                    {stravaStatus.last_sync ? formatDate(stravaStatus.last_sync) : 'Never'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={handleSyncStrava}
                  disabled={syncing}
                  isLoading={syncing}
                  className="flex-1"
                >
                  <HiRefresh className="w-5 h-5 mr-2" />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleDisconnectStrava}
                  className="text-red-600 hover:bg-red-50"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <Button
                variant="primary"
                onClick={handleConnectStrava}
                disabled={connecting}
                isLoading={connecting}
                className="w-full"
              >
                <HiLink className="w-5 h-5 mr-2" />
                {connecting ? 'Connecting...' : 'Connect Strava'}
              </Button>
            </div>
          )}
        </Card>

        {/* Coming Soon - Garmin */}
        <Card className="opacity-60">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Garmin Connect</h3>
                <p className="text-sm text-gray-500">Coming soon</p>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <HiClock className="w-4 h-4 mr-1" /> Coming Soon
            </span>
          </div>
        </Card>
      </div>

      {/* Synced Activities */}
      {activities.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Synced Activities</h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Elevation</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <BiCycling className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <p className="font-medium text-gray-900">{activity.name}</p>
                            <p className="text-sm text-gray-500 capitalize">{activity.activity_type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(activity.activity_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDuration(activity.duration_minutes)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {activity.distance_km ? `${activity.distance_km.toFixed(1)} km` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {activity.elevation_m ? `${activity.elevation_m.toFixed(0)} m` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 capitalize">
                          {activity.source}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {stravaStatus?.connected && activities.length === 0 && (
        <div className="mt-8">
          <Card>
            <div className="text-center py-8 text-gray-500">
              <BiCycling className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No activities synced yet</p>
              <p className="text-sm mt-1">Click "Sync Now" to import your Strava activities</p>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}
