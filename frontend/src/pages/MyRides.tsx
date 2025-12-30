import { useState, useEffect } from 'react';
import { ridesAPI } from '../services/api';
import type { Ride } from '../types';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { BiCycling } from 'react-icons/bi';
import { HiClock, HiLocationMarker } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function MyRides() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      setLoading(true);
      const data = await ridesAPI.getAll();
      setRides(data);
    } catch (err: any) {
      toast.error('Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><Loading text="Loading your rides..." /></Layout>;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Rides</h1>
        <p className="text-gray-600 mt-1">Track and review your cycling activities</p>
      </div>

      {rides.length === 0 ? (
        <EmptyState
          icon={BiCycling}
          title="No rides yet"
          description="Start tracking your cycling activities to see them here."
        />
      ) : (
        <div className="grid gap-4">
          {rides.map((ride) => (
            <Card key={ride.id} hover>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{ride.title}</h3>
                  {ride.description && (
                    <p className="text-gray-600 mt-1">{ride.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center text-gray-700">
                      <HiLocationMarker className="w-5 h-5 mr-1 text-primary-600" />
                      <span className="font-medium">{ride.distance_km} km</span>
                    </div>

                    <div className="flex items-center text-gray-700">
                      <HiClock className="w-5 h-5 mr-1 text-primary-600" />
                      <span className="font-medium">{ride.duration_minutes} min</span>
                    </div>

                    {ride.avg_speed_kmh && (
                      <div className="flex items-center text-gray-700">
                        <BiCycling className="w-5 h-5 mr-1 text-primary-600" />
                        <span className="font-medium">{ride.avg_speed_kmh.toFixed(1)} km/h</span>
                      </div>
                    )}

                    {ride.elevation_gain_m && (
                      <div className="flex items-center text-gray-700">
                        <span className="mr-1">⛰️</span>
                        <span className="font-medium">{ride.elevation_gain_m} m</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-4 text-sm">
                    <span className="text-gray-500">
                      {new Date(ride.ride_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {ride.ride_type && (
                      <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-md text-xs font-medium">
                        {ride.ride_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
