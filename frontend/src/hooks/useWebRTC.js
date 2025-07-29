import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import WebRTCManager from '../utils/webRTCManager';
import { toast } from 'sonner';

export const useWebRTC = (roomId, isJoined, currentUser) => {
  const { socket, isConnected } = useSocket();
  
  // Local state
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [connectionStates, setConnectionStates] = useState(new Map());
  const [connectionQuality, setConnectionQuality] = useState(new Map());
  const [audioLevel, setAudioLevel] = useState(0);
  
  const webRTCManagerRef = useRef(null);
  const localVideoRef = useRef(null);
  const originalVideoTrack = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize WebRTC when conditions are met
  useEffect(() => {
    if (isConnected && socket && currentUser && !isInitialized) {
      initializeWebRTC();
    }
    
    return () => {
      if (webRTCManagerRef.current) {
        webRTCManagerRef.current.cleanup();
        webRTCManagerRef.current = null;
      }

      // Cleanup audio monitoring
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      analyserRef.current = null;
    };
  }, [isConnected, socket, currentUser]);

  // Handle socket events for peer connections
  useEffect(() => {
    if (!socket || !webRTCManagerRef.current) return;

    const handleCurrentParticipants = async (participants) => {
      console.log('🤝 Setting up WebRTC with existing participants:', participants.length);

      // Ensure WebRTC manager is initialized
      if (!webRTCManagerRef.current) {
        console.warn('⚠️ WebRTC manager not initialized, skipping connections');
        return;
      }

      for (const participant of participants) {
        if (participant.userId !== currentUser._id) {
          console.log(`🔗 Connecting to existing participant: ${participant.userName} (${participant.userId})`);
          // Update socket mapping and connect
          webRTCManagerRef.current.updateUserSocketMapping(participant.userId, participant.socketId);
          await webRTCManagerRef.current.connectToUser(participant.userId, participant.socketId);
        }
      }
    };

    const handleUserJoined = async (userData) => {
      if (userData.userId !== currentUser._id && userData.shouldConnect) {
        console.log('🤝 New user joined, establishing WebRTC connection:', userData.userId);

        // Ensure WebRTC manager is initialized
        if (!webRTCManagerRef.current) {
          console.warn('⚠️ WebRTC manager not initialized, skipping connection');
          return;
        }

        // Update socket mapping and connect
        webRTCManagerRef.current.updateUserSocketMapping(userData.userId, userData.socketId);
        await webRTCManagerRef.current.connectToUser(userData.userId, userData.socketId);
      }
    };

    const handleUserLeft = (userData) => {
      console.log('👋 User left, cleaning up WebRTC:', userData.userId);
      setRemoteStreams(prev => {
        const newStreams = new Map(prev);
        newStreams.delete(userData.userId);
        return newStreams;
      });
      setConnectionStates(prev => {
        const newStates = new Map(prev);
        newStates.delete(userData.userId);
        return newStates;
      });
    };

    socket.on('current-participants', handleCurrentParticipants);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('current-participants', handleCurrentParticipants);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, currentUser, isInitialized]);

  // Audio level monitoring functions - define early to avoid circular dependencies
  const stopAudioLevelMonitoring = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setAudioLevel(0);
    console.log('🎤 Audio level monitoring stopped');
  }, []);

  const startAudioLevelMonitoring = useCallback((stream) => {
    if (!stream || !stream.getAudioTracks().length) return;

    try {
      // Stop previous monitoring
      stopAudioLevelMonitoring();

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn('AudioContext not supported');
        return;
      }
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateAudioLevel = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalizedLevel = Math.min(100, Math.round((average / 255) * 100));
        setAudioLevel(normalizedLevel);

        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();
      console.log('🎤 Audio level monitoring started');
    } catch (error) {
      console.warn('Audio level monitoring failed:', error);
    }
  }, [stopAudioLevelMonitoring]);

  // Screen share helper function - define early to avoid circular dependencies
  const handleStopScreenShare = useCallback(async () => {
    try {
      console.log('🖥️ Stopping screen share...');

      if (webRTCManagerRef.current) {
        const cameraStream = await webRTCManagerRef.current.stopScreenShare();

        // Update local stream with camera stream
        setLocalStream(cameraStream);

        // Force update the video element
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = cameraStream;
          console.log('📺 Restored camera video in local element');

          // Ensure video plays
          try {
            await localVideoRef.current.play();
            console.log('✅ Camera video playing after screen share stop');
          } catch (playError) {
            console.warn('⚠️ Camera video play failed:', playError);
          }
        }
      }

      setIsScreenSharing(false);
      toast.info('Screen sharing stopped');

    } catch (error) {
      console.error('❌ Failed to stop screen share:', error);
      toast.error('Failed to stop screen share');
    }
  }, []);

  const initializeWebRTC = async () => {
    try {
      setIsInitializing(true);
      console.log('🚀 Initializing WebRTC...');
      
      webRTCManagerRef.current = new WebRTCManager(socket, {
        onRemoteStream: (userId, stream) => {
          console.log('📥 Received remote stream from:', userId);
          setRemoteStreams(prev => new Map(prev.set(userId, stream)));
        },
        onConnectionStateChange: (userId, state) => {
          console.log(`🔗 Connection state changed for ${userId}:`, state);
          setConnectionStates(prev => new Map(prev.set(userId, state)));
        },
        onConnectionQuality: (userId, quality) => {
          setConnectionQuality(prev => new Map(prev.set(userId, quality)));
        },
        onConnectionIssue: (userId, issue) => {
          console.warn(`⚠️ Connection issue for ${userId}:`, issue);
          toast.warning(`Connection issue with ${userId}: ${issue.quality} quality`);
        },
        onPeerDisconnected: (userId) => {
          console.log('❌ Peer disconnected:', userId);
          setRemoteStreams(prev => {
            const newStreams = new Map(prev);
            newStreams.delete(userId);
            return newStreams;
          });
          setConnectionStates(prev => {
            const newStates = new Map(prev);
            newStates.delete(userId);
            return newStates;
          });
          setConnectionQuality(prev => {
            const newQuality = new Map(prev);
            newQuality.delete(userId);
            return newQuality;
          });
        }
      });
      
      setIsInitialized(true);
      console.log('✅ WebRTC initialized successfully');
      
    } catch (error) {
      console.error('❌ WebRTC initialization failed:', error);
      setMediaError(error);
    } finally {
      setIsInitializing(false);
    }
  };

  const startLocalStream = useCallback(async () => {
    try {
      console.log('📹 Starting local stream...');
      setMediaError(null);
      
      if (!webRTCManagerRef.current) {
        throw new Error('WebRTC not initialized');
      }
      
      const stream = await webRTCManagerRef.current.startLocalStream();
      setLocalStream(stream);

      // Set local video element and ensure it plays
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('📺 Set local video srcObject');

        // Force video to play
        try {
          await localVideoRef.current.play();
          console.log('✅ Local video playing');
        } catch (playError) {
          console.warn('⚠️ Local video play failed:', playError);
        }
      }
      
      // Store original video track
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        originalVideoTrack.current = videoTrack;
      }
      
      // Update states
      setIsVideoEnabled(stream.getVideoTracks().length > 0);
      setIsAudioEnabled(stream.getAudioTracks().length > 0);

      // Start audio level monitoring
      if (stream.getAudioTracks().length > 0) {
        startAudioLevelMonitoring(stream);
      }

      toast.success('Media ready');
      return stream;
      
    } catch (error) {
      console.error('❌ Failed to start local stream:', error);
      setMediaError(error);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Permission denied - please allow camera/microphone access');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera/microphone found');
      } else {
        toast.error('Failed to access media: ' + error.message);
      }
      throw error;
    }
  }, [startAudioLevelMonitoring]);

  const toggleAudio = useCallback(() => {
    if (!localStream) return;
    
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    
    localStream.getAudioTracks().forEach(track => {
      track.enabled = newState;
    });
    
    toast.info(newState ? 'Microphone enabled' : 'Microphone disabled');
  }, [isAudioEnabled, localStream]);

  const toggleVideo = useCallback(() => {
    if (!localStream) return;
    
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    
    localStream.getVideoTracks().forEach(track => {
      track.enabled = newState;
    });
    
    toast.info(newState ? 'Camera enabled' : 'Camera disabled');
  }, [isVideoEnabled, localStream]);

  const startScreenShare = useCallback(async () => {
    try {
      console.log('🖥️ Starting screen share...');

      if (!webRTCManagerRef.current) {
        throw new Error('WebRTC not initialized');
      }

      const screenStream = await webRTCManagerRef.current.startScreenShare();

      // Create new stream with screen video + original audio
      const newStream = new MediaStream([
        screenStream.getVideoTracks()[0],
        ...(localStream ? localStream.getAudioTracks() : [])
      ]);

      // Update local stream state
      setLocalStream(newStream);

      // Force update the video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream;
        console.log('📺 Updated local video element with screen share');

        // Ensure video plays
        localVideoRef.current.play().catch(e => {
          console.warn('Video play failed:', e);
        });
      }

      // Handle screen share end
      const videoTrack = screenStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          console.log('🖥️ Screen share ended by user');
          handleStopScreenShare();
        };
      }

      setIsScreenSharing(true);
      setIsVideoEnabled(true); // Ensure video is marked as enabled
      toast.success('Screen sharing started');

    } catch (error) {
      console.error('❌ Screen share failed:', error);
      toast.error('Screen share failed: ' + error.message);
    }
  }, [localStream, handleStopScreenShare]);

  // Public stopScreenShare function
  const stopScreenShare = useCallback(async () => {
    await handleStopScreenShare();
  }, [handleStopScreenShare]);

  const connectToUser = useCallback(async (userId) => {
    if (webRTCManagerRef.current && localStream) {
      await webRTCManagerRef.current.connectToUser(userId);
    }
  }, [localStream]);

  const cleanupWebRTC = useCallback(() => {
    if (webRTCManagerRef.current) {
      webRTCManagerRef.current.cleanup();
    }

    // Stop audio monitoring
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setAudioLevel(0);

    setLocalStream(null);
    setRemoteStreams(new Map());
    setConnectionStates(new Map());
    setIsInitialized(false);
  }, []);

  return {
    // State
    isInitialized,
    isInitializing,
    localStream,
    remoteStreams,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    mediaError,
    connectionStates,
    connectionQuality,
    localVideoRef,
    audioLevel,
    
    // Actions
    startLocalStream,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    connectToUser,
    cleanupWebRTC,
    startAudioLevelMonitoring,
    stopAudioLevelMonitoring,

    // Debug function
    getDebugInfo: useCallback(() => {
      if (webRTCManagerRef.current) {
        return webRTCManagerRef.current.getDebugInfo();
      }
      return null;
    }, [])
  };
};
