import React, { useState, useEffect } from 'react';

const WebRTCDebugPanel = ({ webRTCManager, localStream, remoteStreams, connectionStates }) => {
  const [debugInfo, setDebugInfo] = useState({});
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    const updateDebugInfo = () => {
      if (!webRTCManager) return;

      const info = {
        localStream: {
          hasStream: !!localStream,
          audioTracks: localStream?.getAudioTracks().length || 0,
          videoTracks: localStream?.getVideoTracks().length || 0,
          audioEnabled: localStream?.getAudioTracks()[0]?.enabled || false,
          videoEnabled: localStream?.getVideoTracks()[0]?.enabled || false
        },
        manager: {
          hasLocalStream: !!webRTCManager.localStream,
          managerAudioTracks: webRTCManager.localStream?.getAudioTracks().length || 0,
          managerVideoTracks: webRTCManager.localStream?.getVideoTracks().length || 0,
          peerConnections: webRTCManager.peerConnections.size,
          socketMappings: webRTCManager.socketToUserMap.size
        },
        remoteStreams: Array.from(remoteStreams.entries()).map(([userId, stream]) => ({
          userId,
          audioTracks: stream.getAudioTracks().length,
          videoTracks: stream.getVideoTracks().length,
          audioEnabled: stream.getAudioTracks()[0]?.enabled || false,
          videoEnabled: stream.getVideoTracks()[0]?.enabled || false
        })),
        connections: Array.from(connectionStates.entries()).map(([userId, state]) => ({
          userId,
          state,
          hasPeerConnection: webRTCManager.peerConnections.has(userId)
        }))
      };

      setDebugInfo(info);
    };

    updateDebugInfo();

    // Update every 2 seconds
    const interval = setInterval(updateDebugInfo, 2000);
    setRefreshInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [webRTCManager, localStream, remoteStreams, connectionStates]);

  const testLocalStream = async () => {
    if (webRTCManager) {
      try {
        console.log('🧪 Testing local stream...');
        const stream = await webRTCManager.startLocalStream();
        console.log('✅ Local stream test successful:', stream);
      } catch (error) {
        console.error('❌ Local stream test failed:', error);
      }
    }
  };

  const testPeerConnections = () => {
    if (webRTCManager) {
      console.log('🧪 Testing peer connections...');
      webRTCManager.peerConnections.forEach((pc, userId) => {
        console.log(`Peer ${userId}:`, {
          connectionState: pc.connectionState,
          iceConnectionState: pc.iceConnectionState,
          signalingState: pc.signalingState,
          senders: pc.getSenders().length,
          receivers: pc.getReceivers().length
        });
      });
    }
  };

  if (!webRTCManager) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-900 text-white p-4 rounded-lg max-w-sm">
        <h3 className="font-bold mb-2">WebRTC Debug</h3>
        <p>No WebRTC Manager Available</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg max-w-md text-xs max-h-96 overflow-y-auto">
      <h3 className="font-bold mb-2 text-sm">WebRTC Debug Panel</h3>
      
      <div className="mb-4">
        <h4 className="font-semibold text-yellow-400">Local Stream</h4>
        <div className="ml-2">
          <div>Hook Stream: {debugInfo.localStream?.hasStream ? '✅' : '❌'}</div>
          <div>Manager Stream: {debugInfo.manager?.hasLocalStream ? '✅' : '❌'}</div>
          <div>Audio Tracks: {debugInfo.localStream?.audioTracks} / {debugInfo.manager?.managerAudioTracks}</div>
          <div>Video Tracks: {debugInfo.localStream?.videoTracks} / {debugInfo.manager?.managerVideoTracks}</div>
          <div>Audio Enabled: {debugInfo.localStream?.audioEnabled ? '✅' : '❌'}</div>
          <div>Video Enabled: {debugInfo.localStream?.videoEnabled ? '✅' : '❌'}</div>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold text-green-400">Peer Connections</h4>
        <div className="ml-2">
          <div>Count: {debugInfo.manager?.peerConnections}</div>
          <div>Socket Mappings: {debugInfo.manager?.socketMappings}</div>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold text-blue-400">Remote Streams</h4>
        {debugInfo.remoteStreams?.length > 0 ? (
          debugInfo.remoteStreams.map((stream, index) => (
            <div key={index} className="ml-2 mb-1">
              <div>User: {stream.userId}</div>
              <div>Audio: {stream.audioEnabled ? '✅' : '❌'} ({stream.audioTracks})</div>
              <div>Video: {stream.videoEnabled ? '✅' : '❌'} ({stream.videoTracks})</div>
            </div>
          ))
        ) : (
          <div className="ml-2">No remote streams</div>
        )}
      </div>

      <div className="mb-4">
        <h4 className="font-semibold text-purple-400">Connections</h4>
        {debugInfo.connections?.length > 0 ? (
          debugInfo.connections.map((conn, index) => (
            <div key={index} className="ml-2 mb-1">
              <div>User: {conn.userId}</div>
              <div>State: <span className={conn.state === 'connected' ? 'text-green-400' : 'text-yellow-400'}>{conn.state}</span></div>
              <div>Peer Conn: {conn.hasPeerConnection ? '✅' : '❌'}</div>
            </div>
          ))
        ) : (
          <div className="ml-2">No connections</div>
        )}
      </div>

      <div className="flex gap-2">
        <button 
          onClick={testLocalStream}
          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
        >
          Test Stream
        </button>
        <button 
          onClick={testPeerConnections}
          className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
        >
          Test Peers
        </button>
      </div>
    </div>
  );
};

export default WebRTCDebugPanel;
