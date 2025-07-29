import React, { useEffect, memo, useRef, useCallback } from 'react';
import { Users } from 'lucide-react';
import AudioVisualizer from '../ui/AudioVisualizer';

const VideoGrid = ({
  participants,
  onlineParticipants,
  isFullScreen,
  layout,
  currentUser,
  session,
  localStream,
  remoteStreams,
  localVideoRef,
  connectionStates,
  audioLevel = 0,
  isAudioEnabled = false
}) => {
  const remoteVideoRefs = useRef(new Map());

  // Safe video play function with AbortError handling
  const playVideoSafely = useCallback(async (videoElement, userId) => {
    if (!videoElement || !videoElement.srcObject) return;

    try {
      // Check if already playing to avoid unnecessary calls
      if (!videoElement.paused && !videoElement.seeking) {
        return;
      }

      await videoElement.play();
      console.log(`✅ Remote video playing for ${userId}`);
    } catch (error) {
      // Ignore AbortError as it's expected when video elements are updated rapidly
      if (error.name === 'AbortError') {
        console.log(`🔄 Video play aborted for ${userId} (expected during updates)`);
        return;
      }
      
      console.warn(`⚠️ Remote video play failed for ${userId}:`, error.message);
      
      // Retry for other errors after a delay
      if (error.name !== 'NotAllowedError') {
        setTimeout(() => {
          if (videoElement.srcObject) {
            playVideoSafely(videoElement, userId);
          }
        }, 500);
      }
    }
  }, []);

  // Update remote video elements when streams change
  useEffect(() => {
    if (!remoteStreams) return;

    remoteStreams.forEach((stream, userId) => {
      const videoElement = remoteVideoRefs.current.get(userId);
      if (videoElement && videoElement.srcObject !== stream) {
        console.log(`📺 Updating remote video source for ${userId}`);
        videoElement.srcObject = stream;
        
        // Play after metadata is loaded
        videoElement.onloadedmetadata = () => {
          playVideoSafely(videoElement, userId);
        };
      }
    });
  }, [remoteStreams, playVideoSafely]);

  // Cleanup effect
  useEffect(() => {
    const videoRefs = remoteVideoRefs.current;
    return () => {
      // Clear all video element references on unmount
      videoRefs.clear();
    };
  }, []);

  const getGridLayout = () => {
    const totalParticipants = onlineParticipants.length;
    if (totalParticipants <= 1) return 'grid-cols-1';
    if (totalParticipants <= 4) return 'grid-cols-2';
    if (totalParticipants <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  // Effect to update local video when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log('📺 VideoGrid: Updating local video element');
      localVideoRef.current.srcObject = localStream;

      // Ensure video properties are set
      localVideoRef.current.muted = true;
      localVideoRef.current.autoplay = true;
      localVideoRef.current.playsInline = true;

      // Play the video
      localVideoRef.current.play().then(() => {
        console.log('✅ VideoGrid: Local video playing');
      }).catch(error => {
        console.warn('⚠️ VideoGrid: Local video play failed:', error);
      });
    }
  }, [localStream, localVideoRef]);

  const hasVideo = localStream?.getVideoTracks().some(track => track.enabled) || false;
  const hasAudio = localStream?.getAudioTracks().some(track => track.enabled) || false;

  // Replace the direct console.log with this useEffect
  useEffect(() => {
    console.log('📺 VideoGrid state changed:', {
      localStream: !!localStream,
      hasVideo,
      hasAudio,
      onlineParticipants: onlineParticipants.length,
      remoteStreams: remoteStreams?.size || 0
    });
  }, [localStream, hasVideo, hasAudio, onlineParticipants.length, remoteStreams?.size]);

  return (
    <div className={`flex-1 p-4 ${isFullScreen ? 'p-8' : ''}`}>
      <div className={`grid ${getGridLayout()} gap-4 h-full`}>
        {/* Local video (current user) */}
        {onlineParticipants.some(p => p.userId === currentUser._id) && (
          <div className="relative bg-stone-800 rounded-lg overflow-hidden">
            {localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                onLoadedMetadata={() => {
                  console.log('📺 Local video loaded');
                  // Force play
                  if (localVideoRef.current) {
                    localVideoRef.current.play().catch(e => console.warn('Play failed:', e));
                  }
                }}
                onCanPlay={() => {
                  console.log('📺 Local video can play');
                  if (localVideoRef.current) {
                    localVideoRef.current.play().catch(e => console.warn('Play failed:', e));
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-stone-400">
                  <div className="w-16 h-16 bg-stone-700 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <p className="text-sm">{currentUser.name}</p>
                  <p className="text-xs text-stone-500">
                    {localStream ? (hasAudio ? 'Audio only' : 'No media') : 'No stream'}
                  </p>
                </div>
              </div>
            )}
            
            <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {currentUser.name} (You)
            </div>
            
            <div className="absolute top-2 right-2 flex gap-2">
              <AudioVisualizer
                audioLevel={audioLevel}
                isAudioEnabled={hasAudio}
                size="sm"
              />
              {hasVideo && <div className="w-3 h-3 bg-blue-500 rounded-full" title="Video"></div>}
            </div>
          </div>
        )}

        {/* Remote videos */}
        {remoteStreams && Array.from(remoteStreams.entries()).map(([userId, stream]) => {
          const participant = onlineParticipants.find(p => p.userId === userId);
          const connectionState = connectionStates?.get(userId) || 'connecting';
          const hasRemoteVideo = stream?.getVideoTracks().some(track => track.enabled) || false;
          const hasRemoteAudio = stream?.getAudioTracks().some(track => track.enabled) || false;
          
          return (
            <div key={userId} className="relative bg-stone-800 rounded-lg overflow-hidden">
              {stream ? (
                <video
                  autoPlay
                  playsInline
                  muted={false}
                  className="w-full h-full object-cover"
                  ref={(videoElement) => {
                    if (videoElement) {
                      // Store the video element reference
                      remoteVideoRefs.current.set(userId, videoElement);
                      
                      // Only set srcObject if it's different to prevent AbortError
                      if (videoElement.srcObject !== stream) {
                        console.log(`📺 Set remote video for ${userId}`);
                        videoElement.srcObject = stream;
                        
                        // Use onloadedmetadata instead of immediate play
                        videoElement.onloadedmetadata = () => {
                          playVideoSafely(videoElement, userId);
                        };
                      }
                    } else {
                      // Clean up when element is removed
                      remoteVideoRefs.current.delete(userId);
                    }
                  }}
                  onLoadedMetadata={() => console.log(`📺 Remote video metadata loaded for ${userId}`)}
                  onCanPlay={() => console.log(`📺 Remote video can play for ${userId}`)}
                  onError={(e) => console.warn(`❌ Remote video error for ${userId}:`, e.target.error)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-stone-400">
                    <div className="w-16 h-16 bg-stone-700 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <span className="text-2xl font-bold">
                        {participant?.userName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <p className="text-sm">{participant?.userName || 'Unknown'}</p>
                    <p className="text-xs text-stone-500">
                      {hasRemoteAudio ? 'Audio only' : 'Connecting...'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Audio element for remote audio */}
              {hasRemoteAudio && (
                <audio
                  autoPlay
                  ref={(audioElement) => {
                    if (audioElement && stream && audioElement.srcObject !== stream) {
                      audioElement.srcObject = stream;
                      audioElement.play().catch(e => 
                        console.warn(`Audio play failed for ${userId}:`, e.message)
                      );
                    }
                  }}
                />
              )}
              
              <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                {participant?.userName || 'Unknown'}
              </div>
              
              <div className="absolute top-2 right-2 flex gap-1">
                <div className={`w-3 h-3 rounded-full ${
                  connectionState === 'connected' ? 'bg-green-500' : 
                  connectionState === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`} title={`Connection: ${connectionState}`}></div>
                {hasRemoteAudio && <div className="w-2 h-2 bg-green-400 rounded-full" title="Audio"></div>}
                {hasRemoteVideo && <div className="w-2 h-2 bg-blue-400 rounded-full" title="Video"></div>}
              </div>
            </div>
          );
        })}

        {/* Placeholder for participants without video */}
        {onlineParticipants
          .filter(p => p.userId !== currentUser._id && !remoteStreams?.has(p.userId))
          .map((participant) => (
            <div key={participant.userId} className="relative bg-stone-800 rounded-lg overflow-hidden flex items-center justify-center">
              <div className="text-center text-stone-400">
                <div className="w-16 h-16 bg-stone-700 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {participant.userName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <p className="text-sm">{participant.userName}</p>
                <p className="text-xs text-stone-500">Connecting...</p>
              </div>
              <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                {participant.userName}
              </div>
            </div>
          ))}
        
        {/* Show message when no participants are online */}
        {onlineParticipants.length === 0 && (
          <div className="col-span-full flex items-center justify-center h-full">
            <div className="text-center text-stone-500">
              <div className="w-16 h-16 bg-stone-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8" />
              </div>
              <p className="text-lg">No participants online</p>
              <p className="text-sm">Waiting for participants to join...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(VideoGrid);
