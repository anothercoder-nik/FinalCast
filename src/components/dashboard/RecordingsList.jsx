import React, { useState, useEffect } from 'react';
import { getParticipantRecordings, getSessionRecordings, generateDownloadUrl } from '../../api/session.api.js';

export default function RecordingsList({ participantId }) {
  const [recordings, setRecordings] = useState([]);
  const [sessionRecordings, setSessionRecordings] = useState({}); // Grouped by sessionId
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'mine'
  const [downloadingIds, setDownloadingIds] = useState(new Set()); // Track downloading recordings

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        setLoading(true);
        
        // Get all recordings for this participant
        const response = await getParticipantRecordings(participantId);
        const userRecordings = response.recordings || [];
        setRecordings(userRecordings);

        // Group recordings by session and fetch additional session recordings
        const sessionGroups = {};
        const sessionIds = [...new Set(userRecordings.map(r => r.sessionId))];
        
        for (const sessionId of sessionIds) {
          try {
            const sessionRecsResponse = await getSessionRecordings(sessionId);
            sessionGroups[sessionId] = sessionRecsResponse.recordings || [];
          } catch (err) {
            console.error(`Error fetching session recordings for ${sessionId}:`, err);
            // Fall back to user's recordings for this session
            sessionGroups[sessionId] = userRecordings.filter(r => r.sessionId === sessionId);
          }
        }
        
        setSessionRecordings(sessionGroups);
      } catch (err) {
        console.error('Error fetching recordings:', err);
        setError('Failed to fetch recordings');
      } finally {
        setLoading(false);
      }
    };

    if (participantId) {
      fetchRecordings();
    }
  }, [participantId]);

  const handleDownload = async (recording) => {
    const recordingId = recording.id;
    setDownloadingIds(prev => new Set([...prev, recordingId]));
    
    try {
      console.log('🔽 Downloading recording:', recordingId);
      
      // Use the backend API to generate proper download URL
      const downloadResponse = await generateDownloadUrl(recordingId);
      
      if (downloadResponse.success) {
        // Open download URL
        const link = document.createElement('a');
        link.href = downloadResponse.downloadUrl;
        link.download = downloadResponse.filename || recording.filename || 'recording.webm';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Download initiated successfully');
      } else {
        throw new Error('Failed to generate download URL');
      }
    } catch (error) {
      console.error('❌ Download failed:', error);
      
      // Fallback: try direct Cloudinary URL with attachment flag
      try {
        let downloadUrl = recording.url;
        if (downloadUrl.includes('cloudinary.com')) {
          downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
        }
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = recording.filename || 'recording.webm';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Fallback download initiated');
      } catch (fallbackError) {
        console.error('❌ Fallback download also failed:', fallbackError);
        alert('Download failed. Please try the View button to access the video directly.');
      }
    } finally {
      // Remove from downloading set after a short delay
      setTimeout(() => {
        setDownloadingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(recordingId);
          return newSet;
        });
      }, 2000);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Your Session Recordings</h3>
        <div className="text-center py-8">Loading recordings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Your Session Recordings</h3>
        <div className="text-red-500 text-center py-8">{error}</div>
      </div>
    );
  }

  const totalRecordings = Object.values(sessionRecordings).flat().length;
  const userOwnRecordings = recordings.length;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Session Recordings</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({totalRecordings})
          </button>
          <button
            onClick={() => setViewMode('mine')}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === 'mine' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Mine Only ({userOwnRecordings})
          </button>
        </div>
      </div>
      
      {totalRecordings === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No recordings found. Start a session and begin recording to see your videos here.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(sessionRecordings).map(([sessionId, sessionRecs]) => {
            const displayRecordings = viewMode === 'mine' 
              ? sessionRecs.filter(r => r.participantId === participantId)
              : sessionRecs;
            
            if (displayRecordings.length === 0) return null;

            return (
              <div key={sessionId} className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3">
                  Session: {sessionId}
                  <span className="text-sm text-gray-600 ml-2">
                    ({displayRecordings.length} recording{displayRecordings.length !== 1 ? 's' : ''})
                  </span>
                </h4>
                
                <div className="space-y-2">
                  {displayRecordings.map((recording) => (
                    <div key={recording.id} className="border rounded-lg p-3 bg-white shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">
                            {recording.displayName || recording.filename}
                            {recording.participantId === participantId && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">
                                Your Recording
                              </span>
                            )}
                          </h5>
                          <div className="text-xs text-gray-600 mt-1 flex gap-4">
                            <span>Role: {recording.role}</span>
                            <span>Duration: {formatDuration(recording.duration)}</span>
                            <span>Size: {formatFileSize(recording.size)}</span>
                            <span>Uploaded: {formatDate(recording.uploadedAt)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(recording.url, '_blank')}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDownload(recording)}
                            disabled={downloadingIds.has(recording.id)}
                            className={`px-3 py-1 rounded text-sm ${
                              downloadingIds.has(recording.id)
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                          >
                            {downloadingIds.has(recording.id) ? 'Downloading...' : 'Download'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
