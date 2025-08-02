import React, { useState, useEffect } from 'react';
import { Download, Play, Eye, Calendar, Clock, HardDrive, User, AlertCircle } from 'lucide-react';
import { getApiUrl } from '../../utils/config.js';

const SessionRecordings = ({ sessionId, isHost, compact = false }) => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sessionId && isHost) {
      fetchRecordings();
    }
  }, [sessionId, isHost]);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${getApiUrl()}/api/session/${sessionId}/videos`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recordings: ${response.statusText}`);
      }

      const data = await response.json();
      setRecordings(data.videos || []);
    } catch (err) {
      console.error('Error fetching recordings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (publicId, filename) => {
    try {
      // Get download URL from backend
      const response = await fetch(`${getApiUrl()}/api/download/${encodeURIComponent(publicId)}`);
      
      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }

      const { downloadUrl } = await response.json();
      
      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading video:', err);
      alert('Failed to download video. Please try again.');
    }
  };

  const handleBulkDownload = () => {
    recordings.forEach((recording, index) => {
      setTimeout(() => {
        handleDownload(recording.publicId, recording.filename);
      }, index * 1000); // Stagger downloads by 1 second
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown duration';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleDisplayName = (role, participant) => {
    if (role === 'host') return 'Host';
    return participant?.name || 'Participant';
  };

  const getRoleColor = (role) => {
    return role === 'host' ? 'text-yellow-400' : 'text-blue-400';
  };

  if (!isHost) {
    return null; // Only hosts can see recordings
  }

  if (loading) {
    return (
      <div className={`${compact ? 'p-4' : 'mt-6 p-4'} bg-gray-900/50 rounded-lg border border-gray-700`}>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Play className="w-5 h-5 mr-2" />
          Session Recordings
        </h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${compact ? 'p-4' : 'mt-6 p-4'} bg-red-900/20 rounded-lg border border-red-700`}>
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
          <Play className="w-5 h-5 mr-2" />
          Session Recordings
        </h3>
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 text-sm">Error loading recordings: {error}</p>
            <button 
              onClick={fetchRecordings}
              className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${compact ? 'p-4' : 'mt-6 p-4'} bg-gray-900/50 rounded-lg border border-gray-700`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Play className="w-5 h-5 mr-2" />
          Session Recordings
          {recordings.length > 0 && (
            <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
              {recordings.length}
            </span>
          )}
        </h3>
        
        {recordings.length > 1 && (
          <button
            onClick={handleBulkDownload}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-1" />
            Download All
          </button>
        )}
      </div>

      {recordings.length === 0 ? (
        <div className="text-center py-8">
          <Eye className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No recordings available</p>
          <p className="text-gray-500 text-sm">
            Recordings will appear here after participants record during the session
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recordings.map((recording, index) => (
            <div
              key={recording.publicId}
              className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      recording.role === 'host' 
                        ? 'bg-gradient-to-br from-yellow-500 to-orange-600' 
                        : 'bg-gradient-to-br from-blue-500 to-purple-600'
                    }`}>
                      {recording.role === 'host' ? (
                        <Play className="w-5 h-5 text-white" />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-white font-medium">
                        {getRoleDisplayName(recording.role, recording.participant)}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded-full bg-gray-700 ${getRoleColor(recording.role)}`}>
                        {recording.role}
                      </span>
                    </div>
                    
                    <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-3'} gap-4 mt-1 text-sm text-gray-400`}>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDuration(recording.duration)}
                      </div>
                      <div className="flex items-center">
                        <HardDrive className="w-4 h-4 mr-1" />
                        {formatFileSize(recording.size)}
                      </div>
                      {!compact && (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(recording.createdAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.open(recording.url, '_blank')}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title="Preview video"
                >
                  <Eye className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleDownload(recording.publicId, recording.filename)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-blue-600 rounded-lg transition-colors"
                  title="Download video"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {recordings.length > 0 && !compact && (
        <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between text-sm text-gray-400">
          <span>
            Total: {recordings.length} recording{recordings.length !== 1 ? 's' : ''} • {' '}
            {formatFileSize(recordings.reduce((total, rec) => total + (rec.size || 0), 0))}
          </span>
          
          <button
            onClick={fetchRecordings}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};

export default SessionRecordings;
