import React, { useState, useRef, useEffect } from 'react';
import useMediaRecorder from '../hooks/userMediaRecorder';
import { Play, Square, Download } from 'lucide-react';
import { getApiUrl } from '../../utils/config.js';

const RecordingTest = () => {
  const [localStream, setLocalStream] = useState(null);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const videoRef = useRef(null);

  // Mock session data for testing
  const mockSession = {
    _id: 'test-session-123',
    roomId: 'test-room'
  };

  const mockUser = {
    _id: 'test-user-456'
  };

  const {
    startRecording,
    stopRecording,
    isRecording,
    error: recordingError,
    chunkCount
  } = useMediaRecorder({
    stream: localStream,
    sessionId: mockSession._id,
    role: 'host',
    participantId: mockUser._id
  });

  useEffect(() => {
    initializeStream();
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (localStream && videoRef.current) {
      videoRef.current.srcObject = localStream;
      setIsStreamReady(true);
    }
  }, [localStream]);

  const initializeStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      setLocalStream(stream);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Unable to access camera/microphone. Please ensure permissions are granted.');
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const fetchSessionVideos = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/session/${mockSession._id}/videos`);
      const data = await response.json();
      console.log('Session videos:', data.videos);
      
      if (data.videos && data.videos.length > 0) {
        alert(`Found ${data.videos.length} recorded videos. Check console for details.`);
      } else {
        alert('No recorded videos found for this session.');
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      alert('Error fetching videos. Check console for details.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Recording System Test</h1>
        
        {/* Video Preview */}
        <div className="mb-8">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-64 object-cover"
            />
            
            {!isStreamReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-400">Initializing camera...</p>
              </div>
            )}
            
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Recording</span>
              </div>
            )}
          </div>
        </div>

        {/* Recording Controls */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={handleToggleRecording}
            disabled={!isStreamReady}
            className={`
              flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all
              ${isRecording 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600'
              }
            `}
          >
            {isRecording ? (
              <>
                <Square className="w-5 h-5" />
                <span>Stop Recording</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Start Recording</span>
              </>
            )}
          </button>

          <button
            onClick={fetchSessionVideos}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all"
          >
            <Download className="w-5 h-5" />
            <span>Check Videos</span>
          </button>
        </div>

        {/* Recording Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Recording Status</h2>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Status:</span>
              <span className={`ml-2 font-medium ${isRecording ? 'text-red-400' : 'text-gray-300'}`}>
                {isRecording ? 'Recording' : 'Stopped'}
              </span>
            </div>
            
            <div>
              <span className="text-gray-400">Chunks Uploaded:</span>
              <span className="ml-2 font-medium text-blue-400">{chunkCount}</span>
            </div>
            
            <div>
              <span className="text-gray-400">Stream Ready:</span>
              <span className={`ml-2 font-medium ${isStreamReady ? 'text-green-400' : 'text-yellow-400'}`}>
                {isStreamReady ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div>
              <span className="text-gray-400">Session ID:</span>
              <span className="ml-2 font-medium text-gray-300">{mockSession._id}</span>
            </div>
          </div>

          {recordingError && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded">
              <p className="text-red-400 text-sm">
                <strong>Recording Error:</strong> {recordingError}
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
          
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
            <li>Ensure your camera and microphone permissions are granted</li>
            <li>Click "Start Recording" to begin recording 3-second chunks</li>
            <li>Let it record for at least 10-15 seconds to generate multiple chunks</li>
            <li>Click "Stop Recording" to trigger the merge process</li>
            <li>Wait a moment, then click "Check Videos" to see if the final video was created</li>
            <li>Check the browser console and backend logs for detailed information</li>
          </ol>

          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded">
            <p className="text-blue-400 text-sm">
              <strong>Note:</strong> This test uses mock session data. For full functionality, 
              integrate the recording controls into your actual studio room component.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordingTest;
