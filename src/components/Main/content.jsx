import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from '@tanstack/react-router';
import { getSessions } from '../../api/session.api';
import { FloatingShapes } from '../utils/floating-shapers.jsx';
import Navbar from '../utils/Navbar';
import SessionRecordings from '../studio/SessionRecordings';
import { getApiUrl } from '../../utils/config.js';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  Play,
  Download,
  Eye,
  RadioIcon,
  CheckCircle,
  XCircle,
  HardDrive,
  Video,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const Content = () => {
  const currentUser = useSelector(state => state.auth.user);
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    hasRecordings: 'all'
  });
  const [expandedSession, setExpandedSession] = useState(null);
  const [sessionVideos, setSessionVideos] = useState({});
  const [loadingVideos, setLoadingVideos] = useState({});

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sessions, filters]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await getSessions();
      // Only show sessions where the current user is the host
      const hostSessions = data.filter(session => session.host._id === currentUser._id);
      setSessions(hostSessions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionVideos = async (sessionId) => {
    if (sessionVideos[sessionId] || loadingVideos[sessionId]) return;

    try {
      setLoadingVideos(prev => ({ ...prev, [sessionId]: true }));

      const response = await fetch(`${getApiUrl()}/api/session/${sessionId}/videos`);
      
      if (response.ok) {
        const data = await response.json();
        setSessionVideos(prev => ({ ...prev, [sessionId]: data.videos || [] }));
      } else {
        console.warn(`Failed to fetch videos for session ${sessionId}`);
        setSessionVideos(prev => ({ ...prev, [sessionId]: [] }));
      }
    } catch (error) {
      console.error('Error fetching session videos:', error);
      setSessionVideos(prev => ({ ...prev, [sessionId]: [] }));
    } finally {
      setLoadingVideos(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  const applyFilters = () => {
    let filtered = [...sessions];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(session => session.status === filters.status);
    }

    // Filter by search
    if (filters.search) {
      filtered = filtered.filter(session =>
        session.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        session.description?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredSessions(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-600 text-blue-100';
      case 'live': return 'bg-red-600 text-red-100 animate-pulse';
      case 'ended': return 'bg-green-600 text-green-100';
      case 'cancelled': return 'bg-gray-600 text-gray-100';
      default: return 'bg-gray-600 text-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      case 'live': return <RadioIcon className="w-4 h-4" />;
      case 'ended': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const toggleSessionExpansion = (sessionId) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
    } else {
      setExpandedSession(sessionId);
      fetchSessionVideos(sessionId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
        <FloatingShapes />
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
        <FloatingShapes />
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Error Loading Content</h1>
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={fetchSessions}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <FloatingShapes />
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Your Content
            </h1>
            <p className="text-gray-400 mt-2">
              Manage your sessions and download recordings
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchSessions}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="ended">Ended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <div className="text-center py-16">
            <Video className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Sessions Found</h3>
            <p className="text-gray-500 mb-6">
              {sessions.length === 0 
                ? "You haven't created any sessions yet." 
                : "No sessions match your current filters."
              }
            </p>
            <Link
              to="/create"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              <Play className="w-5 h-5 mr-2" />
              Create Your First Session
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSessions.map((session) => (
              <div
                key={session._id}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors"
              >
                {/* Session Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-semibold text-white">{session.title}</h3>
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {getStatusIcon(session.status)}
                          <span className="capitalize">{session.status}</span>
                        </div>
                      </div>
                      
                      {session.description && (
                        <p className="text-gray-400 mb-4">{session.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {session.scheduledAt 
                              ? format(new Date(session.scheduledAt), 'MMM dd, yyyy HH:mm')
                              : 'No schedule'
                            }
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{session.participants?.length || 0} participants</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>Created {formatDistanceToNow(new Date(session.createdAt))} ago</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleSessionExpansion(session._id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        <Video className="w-4 h-4" />
                        <span>
                          {expandedSession === session._id ? 'Hide' : 'Show'} Recordings
                        </span>
                      </button>
                      
                      <Link
                        to={`/session-details/${session.roomId}`}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Recordings Section */}
                {expandedSession === session._id && (
                  <div className="border-t border-gray-700 bg-gray-900/30">
                    <SessionRecordings 
                      sessionId={session._id} 
                      isHost={true}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Content;