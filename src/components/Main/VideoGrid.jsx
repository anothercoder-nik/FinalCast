import React, { useEffect, memo, useRef, useCallback, useState, forwardRef } from 'react';
import { Users, Pin, PinOff, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '../ui/button';
import AudioVisualizer from '../ui/AudioVisualizer';

const VideoGrid = forwardRef(({
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
  isAudioEnabled = false,
  // Pin/unpin props
  pinnedVideo,
  onPinVideo,
  onUnpinVideo,
  // Sidebar collapse prop
  isSidebarCollapsed
}, ref) => {
  const remoteVideoRefs = useRef(new Map());
  const [hoveredVideo, setHoveredVideo] = useState(null);
  
  // Add debugging for video element access
  useEffect(() => {
    const logVideoElements = () => {
      console.log('🔍 VideoGrid video element debugging:', {
        localVideo: localVideoRef.current ? 'exists' : 'missing',
        localVideoReady: localVideoRef.current?.readyState || 'N/A',
        localVideoDimensions: localVideoRef.current ? `${localVideoRef.current.videoWidth}x${localVideoRef.current.videoHeight}` : 'N/A',
        remoteVideos: Array.from(remoteVideoRefs.current.entries()).map(([userId, element]) => ({
          userId,
          exists: !!element,
          hasStream: element?.srcObject ? 'yes' : 'no',
          readyState: element?.readyState,
          dimensions: element ? `${element.videoWidth}x${element.videoHeight}` : 'N/A',
          streamActive: element?.srcObject?.active,
          videoTracks: element?.srcObject?.getVideoTracks().length || 0
        }))
      });
    };
    
    // Log every 3 seconds
    const interval = setInterval(logVideoElements, 3000);
    return () => clearInterval(interval);
  }, []);

  // Pin button component
  const PinButton = ({ userId, userName, type, isPinned, className = "" }) => (
    <Button
      size="sm"
      variant="ghost"
      className={`absolute top-2 left-2 p-1 bg-black/50 hover:bg-black/70 text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        if (isPinned) {
          onUnpinVideo();
        } else {
          onPinVideo(userId, userName, type);
        }
      }}
    >
      {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
    </Button>
  );

  // Simple video play function - like other websites do it
  const playVideoSafely = useCallback(async (videoElement, userId) => {
    if (!videoElement || !videoElement.srcObject) return;

    try {
      // Check if autoplay is allowed
      const promise = videoElement.play();
      
      if (promise !== undefined) {
        await promise;
        console.log(`✅ Video playing for ${userId}`);
      }
    } catch (error) {
      console.warn(`⚠️ Video play failed for ${userId}:`, error.message);
      
      // Handle autoplay policy violations
      if (error.name === 'NotAllowedError') {
        console.log(`🔇 Autoplay blocked for ${userId}, user interaction required`);
        // You could add a click handler here to resume playback
      } else {
        // For other errors, try again with different settings
        try {
          videoElement.muted = true; // Ensure muted for autoplay
          await videoElement.play();
          console.log(`✅ Video playing (muted) for ${userId}`);
        } catch (retryError) {
          console.error(`❌ Video play retry failed for ${userId}:`, retryError.message);
        }
      }
    }
  }, []);

  // Simple remote video update - like other websites
  useEffect(() => {
    if (!remoteStreams) return;

    remoteStreams.forEach((stream, userId) => {
      const videoElement = remoteVideoRefs.current.get(userId);
      if (videoElement && videoElement.srcObject !== stream) {
        console.log(`📺 Setting remote video stream for ${userId}`);
        videoElement.srcObject = stream;
        videoElement.play().catch(e => 
          console.warn(`Remote video play failed for ${userId}:`, e.message)
        );
      }
    });
  }, [remoteStreams]);

  // Cleanup effect
  useEffect(() => {
    const videoRefs = remoteVideoRefs.current;
    return () => {
      // Clear all video element references on unmount
      videoRefs.clear();
    };
  }, []);

  // Get grid layout based on participant count and pinned state
  const getGridLayout = (participantCount) => {
    // Special layout for pinned video
    if (pinnedVideo) {
      return 'flex flex-col'; // Change layout for pinned mode
    }

    if (participantCount <= 1) return 'grid-cols-1';
    if (participantCount <= 4) return 'grid-cols-2';
    if (participantCount <= 6) return 'grid-cols-3'; // Better layout for 5-6 participants
    if (participantCount <= 9) return 'grid-cols-3';
    return 'grid-cols-4'; // Handle 10+ participants
  };

  // Enhanced effect to update local video when stream changes or layout changes
  useEffect(() => {
    if (!localStream) return;

    // Setup function that works for any video element
    const setupLocalVideo = (videoElement) => {
      if (videoElement && localStream) {
        console.log('📺 VideoGrid: Setting up local video element');
        
        // Always ensure the video element has the stream
        if (videoElement.srcObject !== localStream) {
          videoElement.srcObject = localStream;
        }
        
        // Set properties
        videoElement.muted = true;
        videoElement.autoplay = true;
        videoElement.playsInline = true;

        // Play the video
        videoElement.play().catch(e => 
          console.warn('Local video play failed:', e.message)
        );
      }
    };

    // Initial setup - immediate without timeout for faster pin/unpin
    if (localVideoRef.current) {
      setupLocalVideo(localVideoRef.current);
    }

    // Quick follow-up setup for pin/unpin transitions
    const timeoutId = setTimeout(() => {
      if (localVideoRef.current) {
        setupLocalVideo(localVideoRef.current);
      }
    }, 50); // Reduced from 100ms to 50ms for faster transitions

    return () => clearTimeout(timeoutId);
  }, [localStream, pinnedVideo]); // Added pinnedVideo as dependency to re-run when pinning changes

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

  // Calculate total participants (including current user if online)
  const totalParticipants = onlineParticipants.length + (onlineParticipants.some(p => p.userId === currentUser._id) ? 0 : 1);

  return (
    <div ref={ref} className={`flex-1 p-4 ${isFullScreen ? 'p-8' : ''} ${isSidebarCollapsed ? 'mr-0' : ''}`}>
      <div className={`
        ${pinnedVideo ? 'flex flex-col h-full' : `grid ${getGridLayout(totalParticipants)} gap-4 h-full`}
      `}>
        
        {/* Pinned Layout */}
        {pinnedVideo && (
          <>
            {/* Main pinned video - takes 70% height */}
            <div className="flex-1 mb-2 relative bg-stone-800 rounded-lg overflow-hidden group">
              {pinnedVideo.type === 'local' && pinnedVideo.userId === currentUser._id ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ backgroundColor: '#1a1a1a' }}
                />
              ) : (
                <video
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ backgroundColor: '#1a1a1a' }}
                  ref={(videoElement) => {
                    if (videoElement && remoteStreams.get(pinnedVideo.userId)) {
                      console.log(`📺 Setting up pinned remote video for ${pinnedVideo.userId}`);
                      remoteVideoRefs.current.set(pinnedVideo.userId, videoElement);
                      
                      if (videoElement.srcObject !== remoteStreams.get(pinnedVideo.userId)) {
                        const stream = remoteStreams.get(pinnedVideo.userId);
                        console.log(`📡 Setting pinned stream for ${pinnedVideo.userId}:`, {
                          streamId: stream.id,
                          active: stream.active,
                          videoTracks: stream.getVideoTracks().length
                        });
                        
                        videoElement.srcObject = stream;
                        videoElement.play().catch(e => {
                          console.warn('Pinned video play failed:', e);
                          // Retry
                          setTimeout(() => videoElement.play().catch(() => {}), 1000);
                        });
                      }
                    }
                  }}
                />
              )}
              <div className="absolute bottom-2 left-2 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-medium">
                📌 {pinnedVideo.userName}
                {pinnedVideo.type === 'local' && ' (You)'}
              </div>
              <PinButton
                userId={pinnedVideo.userId}
                userName={pinnedVideo.userName}
                type={pinnedVideo.type}
                isPinned={true}
                className="top-2 right-2 left-auto"
              />
              
              {/* Enhanced pinned video controls */}
              <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/70 text-white px-2 py-1 rounded text-xs">
                  Pinned View
                </div>
              </div>
            </div>

            {/* Thumbnail strip - takes remaining height with better spacing */}
            <div className="h-32 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {/* Local video thumbnail (if not pinned) */}
              {pinnedVideo.userId !== currentUser._id && (
                <div className="flex-none w-48 h-full relative bg-stone-800 rounded-lg overflow-hidden border border-stone-700 group hover:border-stone-500 transition-colors">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ backgroundColor: '#1a1a1a' }}
                  />
                  <div className="absolute bottom-1 left-1 bg-black/70 text-white px-2 py-0.5 rounded text-xs">
                    You
                  </div>
                  <PinButton
                    userId={currentUser._id}
                    userName={currentUser.name}
                    type="local"
                    isPinned={false}
                  />
                </div>
              )}
              
              {/* Remote participants thumbnails */}
              {Array.from(remoteStreams.entries()).map(([userId, stream]) => {
                if (userId === pinnedVideo.userId) return null;
                const participant = onlineParticipants.find(p => p.userId === userId);
                
                return (
                  <div 
                    key={userId}
                    className="flex-none w-48 h-full relative bg-stone-800 rounded-lg overflow-hidden border border-stone-700 group hover:border-stone-500 transition-colors"
                  >
                    <video
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ backgroundColor: '#1a1a1a' }}
                      ref={(videoElement) => {
                        if (videoElement && stream) {
                          console.log(`📺 Setting up thumbnail video for ${userId}`);
                          remoteVideoRefs.current.set(userId, videoElement);
                          
                          if (videoElement.srcObject !== stream) {
                            console.log(`📡 Setting thumbnail stream for ${userId}`);
                            videoElement.srcObject = stream;
                            videoElement.play().catch(e => {
                              console.warn('Thumbnail video play failed:', e);
                              setTimeout(() => videoElement.play().catch(() => {}), 1000);
                            });
                          }
                        }
                      }}
                    />
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white px-2 py-0.5 rounded text-xs">
                      {participant?.userName || 'Unknown'}
                    </div>
                    <PinButton
                      userId={userId}
                      userName={participant?.userName || 'Unknown'}
                      type="remote"
                      isPinned={false}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Normal Grid Layout */}
        {!pinnedVideo && (
          <>
        {/* Local video (current user) */}
        <div className="relative bg-stone-800 rounded-lg overflow-hidden group">
            {hasVideo ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{
                  backgroundColor: '#1a1a1a'
                }}
                onLoadedMetadata={() => {
                  console.log('📺 Local video metadata loaded in normal layout');
                }}
                onError={(e) => {
                  console.error('❌ Local video error:', e.target.error);
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
            
            <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
              {currentUser.name} (You)
            </div>
            <PinButton
              userId={currentUser._id}
              userName={currentUser.name}
              type="local"
              isPinned={pinnedVideo?.userId === currentUser._id}
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <AudioVisualizer
                audioLevel={audioLevel}
                isAudioEnabled={hasAudio}
                size="sm"
              />
              {hasVideo && <div className="w-3 h-3 bg-blue-500 rounded-full" title="Video"></div>}
            </div>
          </div>

        {/* Remote videos */}
        {remoteStreams && Array.from(remoteStreams.entries()).map(([userId, stream]) => {
          const participant = onlineParticipants.find(p => p.userId === userId);
          const connectionState = connectionStates?.get(userId) || 'connecting';
          const hasRemoteVideo = stream?.getVideoTracks().some(track => track.enabled) || false;
          const hasRemoteAudio = stream?.getAudioTracks().some(track => track.enabled) || false;
          
          return (
            <div key={userId} className="relative bg-stone-800 rounded-lg overflow-hidden group">
              {stream ? (
                <video
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{
                    backgroundColor: '#1a1a1a'
                  }}
                  ref={(videoElement) => {
                    if (videoElement) {
                      console.log(`📺 Setting up remote video element for ${userId}`);
                      remoteVideoRefs.current.set(userId, videoElement);
                      
                      if (videoElement.srcObject !== stream) {
                        console.log(`📡 Setting stream for ${userId}:`, {
                          streamId: stream.id,
                          active: stream.active,
                          videoTracks: stream.getVideoTracks().length,
                          audioTracks: stream.getAudioTracks().length
                        });
                        
                        videoElement.srcObject = stream;
                        
                        // Add event listeners for debugging
                        videoElement.onloadedmetadata = () => {
                          console.log(`✅ Remote video metadata loaded for ${userId}:`, {
                            width: videoElement.videoWidth,
                            height: videoElement.videoHeight,
                            duration: videoElement.duration
                          });
                        };
                        
                        videoElement.onerror = (e) => {
                          console.error(`❌ Remote video error for ${userId}:`, e.target.error);
                        };
                        
                        videoElement.oncanplay = () => {
                          console.log(`▶️ Remote video can play for ${userId}`);
                        };
                        
                        videoElement.play().catch(e => {
                          console.warn(`⚠️ Remote video play failed for ${userId}:`, e.message);
                          // Try playing again after a short delay
                          setTimeout(() => {
                            videoElement.play().catch(retryError => {
                              console.error(`❌ Remote video retry failed for ${userId}:`, retryError.message);
                            });
                          }, 1000);
                        });
                      }
                    } else {
                      console.log(`🗑️ Removing video element reference for ${userId}`);
                      remoteVideoRefs.current.delete(userId);
                    }
                  }}
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
              
              <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                {participant?.userName || 'Unknown'}
              </div>
              
              <PinButton
                userId={userId}
                userName={participant?.userName || 'Unknown'}
                type="remote"
                isPinned={pinnedVideo?.userId === userId}
              />
              
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
              <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
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
        </>
        )}
      </div>
    </div>
  );
});

export default memo(VideoGrid);
