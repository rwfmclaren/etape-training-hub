import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiHome,
  HiUsers,
  HiClipboardList,
  HiUserGroup,
  HiCog,
  HiChartBar,
  HiSearch,
  HiDocumentText,
  HiTrendingUp,
  HiTarget,
  HiLogout,
  HiMenu,
  HiX
} from 'react-icons/hi';
import { BiCycling } from 'react-icons/bi';
import { GiMuscleUp } from 'react-icons/gi';
import { useState } from 'react';

export default function Sidebar() {
  const { user, logout, isAthlete, isTrainer, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const athleteLinks = [
    { path: '/dashboard', icon: HiHome, label: 'Dashboard' },
    { path: '/my-rides', icon: BiCycling, label: 'My Rides' },
    { path: '/my-workouts', icon: GiMuscleUp, label: 'My Workouts' },
    { path: '/my-goals', icon: HiTarget, label: 'My Goals' },
    { path: '/my-training-plan', icon: HiDocumentText, label: 'Training Plan' },
    { path: '/find-trainer', icon: HiSearch, label: 'Find Trainer' },
  ];

  const trainerLinks = [
    { path: '/dashboard', icon: HiHome, label: 'Dashboard' },
    { path: '/trainer-dashboard', icon: HiUsers, label: 'My Athletes' },
    { path: '/training-plans', icon: HiClipboardList, label: 'Training Plans' },
  ];

  const adminLinks = [
    { path: '/dashboard', icon: HiHome, label: 'Dashboard' },
    { path: '/admin', icon: HiUserGroup, label: 'User Management' },
    { path: '/admin/stats', icon: HiChartBar, label: 'System Stats' },
  ];

  const links = isAdmin ? adminLinks : isTrainer ? trainerLinks : athleteLinks;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'trainer':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg hover:bg-gray-50"
      >
        {isOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and Brand */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <BiCycling className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Etape</h1>
                <p className="text-xs text-gray-500">Training Hub</p>
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.full_name || user?.email}
                </p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(user?.role || 'athlete')}`}>
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-primary-700' : 'text-gray-500'}`} />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
            >
              <HiLogout className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
