
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
  const mountedRef = useRef(true); // ✅ Added mount check

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ✅ Audio level monitoring functions - moved to useCallback with proper dependencies
  const stopAudioLevelMonitoring = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    if (mountedRef.current) {
      setAudioLevel(0);
    }
    console.log('🎤 Audio level monitoring stopped');
  }, []);

  const startAudioLevelMonitoring = useCallback((stream) => {
    if (!stream || !stream.getAudioTracks().length || !mountedRef.current) return;

    try {
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
        if (!analyserRef.current || !mountedRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalizedLevel = Math.min(100, Math.round((average / 255) * 100));
        
        if (mountedRef.current) {
          setAudioLevel(normalizedLevel);
        }

        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();
      console.log('🎤 Audio level monitoring started');
    } catch (error) {
      console.warn('Audio level monitoring failed:', error);
    }
  }, [stopAudioLevelMonitoring]);

  // ✅ Screen share helper - moved to useCallback
  const handleStopScreenShare = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      console.log('🖥️ Stopping screen share...');

      if (webRTCManagerRef.current) {
        const cameraStream = await webRTCManagerRef.current.stopScreenShare();

        if (!mountedRef.current) return;

        setLocalStream(cameraStream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = cameraStream;
          console.log('📺 Restored camera video in local element');

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
      if (mountedRef.current) {
        toast.error('Failed to stop screen share');
      }
    }
  }, []);

  // ✅ Fixed initializeWebRTC with proper dependencies
  const initializeWebRTC = useCallback(async () => {
    if (!socket || !currentUser || isInitializing) {
      console.log('⏸️ Skipping WebRTC initialization - missing dependencies or already initializing');
      return;
    }

    // Prevent multiple concurrent initializations
    if (isInitializing) {
      console.log('⏸️ WebRTC initialization already in progress');
      return;
    }

    console.log('🚀 Initializing WebRTC...');
    setIsInitializing(true);
    
    try {
      webRTCManagerRef.current = new WebRTCManager(socket, {
        onLocalStreamReady: (stream) => {
          console.log('📥 Local stream ready from WebRTC Manager');
          if (mountedRef.current) {
            setLocalStream(stream);
            
            // Set up local video element immediately
            if (localVideoRef.current) {
              console.log('📺 Setting up local video element with stream');
              localVideoRef.current.srcObject = stream;
              localVideoRef.current.muted = true;
              localVideoRef.current.autoplay = true;
              localVideoRef.current.playsInline = true;

              // Force play immediately
              const playVideo = async () => {
                try {
                  await localVideoRef.current.play();
                  console.log('✅ Local video playing from callback');
                } catch (playError) {
                  console.warn('⚠️ Local video play failed from callback, retrying...', playError);
                  // Retry after a short delay
                  setTimeout(async () => {
                    try {
                      if (localVideoRef.current && mountedRef.current) {
                        await localVideoRef.current.play();
                        console.log('✅ Local video playing (retry from callback)');
                      }
                    } catch (retryError) {
                      console.error('❌ Local video retry failed from callback:', retryError);
                    }
                  }, 500);
                }
              };
              playVideo();
            }
            
            // Set track states
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
              originalVideoTrack.current = videoTrack;
            }
            
            setIsVideoEnabled(stream.getVideoTracks().length > 0);
            setIsAudioEnabled(stream.getAudioTracks().length > 0);

            if (stream.getAudioTracks().length > 0) {
              startAudioLevelMonitoring(stream);
            }
          }
        },
        onRemoteStream: (userId, stream) => {
          console.log('📥 Received remote stream from:', userId);
          if (mountedRef.current) {
            setRemoteStreams(prev => new Map(prev.set(userId, stream)));
          }
        },
        onConnectionStateChange: (userId, state) => {
          console.log(`🔗 Connection state changed for ${userId}:`, state);
          if (mountedRef.current) {
            setConnectionStates(prev => new Map(prev.set(userId, state)));
          }
        },
        onConnectionQuality: (userId, quality) => {
          if (mountedRef.current) {
            setConnectionQuality(prev => new Map(prev.set(userId, quality)));
          }
        },
        onConnectionIssue: (userId, issue) => {
          console.warn(`⚠️ Connection issue for ${userId}:`, issue);
          if (mountedRef.current) {
            toast.warning(`Connection issue with ${userId}: ${issue.quality} quality`);
          }
        },
        onPeerDisconnected: (userId) => {
          console.log('❌ Peer disconnected:', userId);
          if (mountedRef.current) {
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
        }
      });
      
      if (mountedRef.current) {
        setIsInitialized(true);
        console.log('✅ WebRTC initialized successfully');
        
        // Ensure local video is set up if stream is already available
        if (webRTCManagerRef.current?.localStream && localVideoRef.current) {
          console.log('🔄 Setting up local video after initialization');
          const stream = webRTCManagerRef.current.localStream;
          setLocalStream(stream);
          
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.autoplay = true;
          localVideoRef.current.playsInline = true;
          
          // Force play
          localVideoRef.current.play().then(() => {
            console.log('✅ Local video playing after manual setup');
          }).catch(error => {
            console.warn('⚠️ Local video play failed after manual setup:', error);
          });
          
          // Set track states
          setIsVideoEnabled(stream.getVideoTracks().length > 0);
          setIsAudioEnabled(stream.getAudioTracks().length > 0);
        }
      }
      
    } catch (error) {
      console.error('❌ WebRTC initialization failed:', error);
      if (mountedRef.current) {
        setMediaError(error);
      }
    } finally {
      if (mountedRef.current) {
        setIsInitializing(false);
      }
    }
  }, [socket, currentUser, isInitializing, startAudioLevelMonitoring]);

  // ✅ Fixed useEffect with proper dependencies
  useEffect(() => {
    if (isConnected && socket && currentUser && !isInitialized && !isInitializing) {
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

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      analyserRef.current = null;
    };
  }, [isConnected, socket, currentUser, isInitialized, isInitializing, initializeWebRTC]);

  // ✅ Fixed socket event handlers with proper checks
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleCurrentParticipants = async (participants) => {
      if (!participants || !Array.isArray(participants) || !mountedRef.current) return;

      console.log('🤝 Setting up WebRTC with existing participants:', participants.length);

      // Ensure WebRTC is initialized first
      if (!webRTCManagerRef.current) {
        console.log('🚀 WebRTC not initialized, initializing for participants...');
        try {
          await initializeWebRTC();
        } catch (err) {
          console.error('❌ Failed to initialize WebRTC for participants:', err);
          return;
        }
      }

      // Ensure we have local stream before connecting to others
      if (!webRTCManagerRef.current?.localStream) {
        console.log('🎥 No local stream, starting it before connecting to participants...');
        try {
          await webRTCManagerRef.current?.startLocalStream();
        } catch (err) {
          console.error('❌ Failed to start local stream for participant connections:', err);
        }
      }

      for (const participant of participants) {
        if (participant?.userId && participant.userId !== currentUser._id) {
          try {
            console.log(`🔗 Connecting to existing participant: ${participant.userName} (${participant.userId})`);
            webRTCManagerRef.current.updateUserSocketMapping(participant.userId, participant.socketId);
            await webRTCManagerRef.current.connectToUser(participant.userId, participant.socketId);
          } catch (error) {
            console.error('Error connecting to participant:', error);
          }
        }
      }
    };

    const handleUserJoined = async (userData) => {
      if (!userData || !mountedRef.current) return;

      if (userData.userId !== currentUser._id && userData.shouldConnect) {
        console.log('🤝 New user joined, establishing WebRTC connection:', userData.userId);

        // Ensure WebRTC is initialized
        if (!webRTCManagerRef.current) {
          console.log('🚀 WebRTC not initialized for new user, initializing...');
          try {
            await initializeWebRTC();
          } catch (err) {
            console.error('❌ Failed to initialize WebRTC for new user:', err);
            return;
          }
        }

        // Ensure we have local stream
        if (!webRTCManagerRef.current.localStream) {
          console.log('🎥 Starting local stream for new connection...');
          try {
            await webRTCManagerRef.current.startLocalStream();
          } catch (err) {
            console.error('❌ Failed to start local stream:', err);
          }
        }

        try {
          webRTCManagerRef.current.updateUserSocketMapping(userData.userId, userData.socketId);
          await webRTCManagerRef.current.connectToUser(userData.userId, userData.socketId);
        } catch (error) {
          console.error('Error connecting to new user:', error);
        }
      }
    };

    const handleUserLeft = (userData) => {
      if (!userData || !mountedRef.current) return;
      
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
  }, [socket, currentUser, initializeWebRTC]);

  // ✅ Update local video when stream changes
  useEffect(() => {
    if (localStream && localVideoRef.current && mountedRef.current) {
      console.log('🎥 Local stream changed, updating video element');
      localVideoRef.current.srcObject = localStream;
      
      localVideoRef.current.muted = true;
      localVideoRef.current.autoplay = true;
      localVideoRef.current.playsInline = true;

      // Force load and play with retry
      localVideoRef.current.load();

      const playVideo = async () => {
        try {
          await localVideoRef.current.play();
          console.log('✅ Local video playing successfully');
        } catch (error) {
          console.warn('⚠️ Failed to play local video:', error);
          // Retry after a short delay
          setTimeout(async () => {
            try {
              await localVideoRef.current.play();
              console.log('✅ Local video playing after retry');
            } catch (retryError) {
              console.error('❌ Local video play failed after retry:', retryError);
            }
          }, 100);
        }
      };

      playVideo();
    }
  }, [localStream]);

  // ✅ Fixed startLocalStream with proper error handling
  const startLocalStream = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      console.log('📹 Starting local stream...');
      setMediaError(null);

      // Ensure WebRTC is initialized first
      if (!webRTCManagerRef.current) {
        console.log('🚀 WebRTC not initialized, initializing now...');
        await initializeWebRTC();

        // Wait a bit for initialization to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Double check after initialization
        if (!webRTCManagerRef.current) {
          throw new Error('Failed to initialize WebRTC');
        }
      }
      
      console.log('📹 Getting stream from WebRTC manager...');
      const stream = await webRTCManagerRef.current.startLocalStream();
      
      if (!mountedRef.current) return stream;
      
      setLocalStream(stream);

      if (localVideoRef.current) {
        console.log('📺 Setting up local video element');
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.autoplay = true;
        localVideoRef.current.playsInline = true;

        // Enhanced play with multiple retries and increasing delays
        const playVideo = async (retries = 3) => {
          try {
            await localVideoRef.current.play();
            console.log(`✅ Local video playing successfully`);
          } catch (playError) {
            console.warn(`⚠️ Local video play failed (attempt ${4-retries}):`, playError.message);
            if (retries > 0) {
              const delay = 200 * (4-retries); // Increasing delay: 200ms, 400ms, 600ms
              setTimeout(() => {
                if (localVideoRef.current && mountedRef.current) {
                  playVideo(retries - 1);
                }
              }, delay);
            } else {
              console.error('❌ Local video play failed after all retries');
            }
          }
        };

        // Start playing with a small initial delay
        setTimeout(() => {
          if (localVideoRef.current && mountedRef.current) {
            playVideo();
          }
        }, 100);
      }
      
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        originalVideoTrack.current = videoTrack;
      }
      
      setIsVideoEnabled(stream.getVideoTracks().length > 0);
      setIsAudioEnabled(stream.getAudioTracks().length > 0);

      if (stream.getAudioTracks().length > 0) {
        startAudioLevelMonitoring(stream);
      }

      toast.success('Media ready');
      return stream;
      
    } catch (error) {
      console.error('❌ Failed to start local stream:', error);
      if (mountedRef.current) {
        setMediaError(error);
        
        if (error.name === 'NotAllowedError') {
          toast.error('Permission denied - please allow camera/microphone access');
        } else if (error.name === 'NotFoundError') {
          toast.error('No camera/microphone found');
        } else {
          toast.error('Failed to access media: ' + error.message);
        }
      }
      throw error;
    }
  }, [startAudioLevelMonitoring, initializeWebRTC]);

  // ✅ Rest of the functions with mount checks
  const toggleAudio = useCallback(() => {
    if (!localStream || !mountedRef.current) return false;
    
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    
    localStream.getAudioTracks().forEach(track => {
      track.enabled = newState;
    });
    
    toast.info(newState ? 'Microphone enabled' : 'Microphone disabled');
    return true;
  }, [isAudioEnabled, localStream]);

  const toggleVideo = useCallback(() => {
    if (!localStream || !mountedRef.current) return false;
    
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    
    localStream.getVideoTracks().forEach(track => {
      track.enabled = newState;
    });
    
    toast.info(newState ? 'Camera enabled' : 'Camera disabled');
    return true;
  }, [isVideoEnabled, localStream]);

  const startScreenShare = useCallback(async () => {
    if (!mountedRef.current) return false;

    // Ensure WebRTC is initialized
    if (!webRTCManagerRef.current) {
      console.log('🚀 WebRTC not initialized for screen share, initializing...');
      await initializeWebRTC();

      if (!webRTCManagerRef.current) {
        console.error('❌ Failed to initialize WebRTC for screen share');
        return false;
      }
    }

    try {
      console.log('🖥️ Starting screen share...');

      const screenStream = await webRTCManagerRef.current.startScreenShare();

      const newStream = new MediaStream([
        screenStream.getVideoTracks()[0],
        ...(localStream ? localStream.getAudioTracks() : [])
      ]);

      if (!mountedRef.current) return false;

      setLocalStream(newStream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream;
        console.log('📺 Updated local video element with screen share');

        localVideoRef.current.play().catch(e => {
          console.warn('Video play failed:', e);
        });
      }

      const videoTrack = screenStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          console.log('🖥️ Screen share ended by user');
          handleStopScreenShare();
        };
      }

      setIsScreenSharing(true);
      setIsVideoEnabled(true);
      toast.success('Screen sharing started');
      return true;

    } catch (error) {
      console.error('❌ Screen share failed:', error);
      if (mountedRef.current) {
        toast.error('Screen share failed: ' + error.message);
      }
      return false;
    }
  }, [localStream, handleStopScreenShare, initializeWebRTC]);

  const stopScreenShare = useCallback(async () => {
    return await handleStopScreenShare();
  }, [handleStopScreenShare]);

  const connectToUser = useCallback(async (userId) => {
    if (!mountedRef.current) return;

    // Ensure WebRTC is initialized
    if (!webRTCManagerRef.current) {
      console.log('🚀 WebRTC not initialized for connection, initializing...');
      await initializeWebRTC();

      if (!webRTCManagerRef.current) {
        console.error('❌ Failed to initialize WebRTC for connection');
        return;
      }
    }

    if (webRTCManagerRef.current) {
      await webRTCManagerRef.current.connectToUser(userId);
    }
  }, [initializeWebRTC]);

  const cleanupWebRTC = useCallback(() => {
    if (webRTCManagerRef.current) {
      webRTCManagerRef.current.cleanup();
    }

    stopAudioLevelMonitoring();

    if (mountedRef.current) {
      setLocalStream(null);
      setRemoteStreams(new Map());
      setConnectionStates(new Map());
      setIsInitialized(false);
    }
  }, [stopAudioLevelMonitoring]);

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
    
    // Internal refs for debugging
    webRTCManagerRef,
    
    // Actions
    startLocalStream,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    connectToUser,
    cleanupWebRTC,
    initializeWebRTC,
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