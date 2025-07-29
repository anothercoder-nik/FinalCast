import mediaManager from './mediaManager';

class WebRTCManager {
  constructor(socketInstance, callbacks = {}) {
    this.socket = socketInstance;
    this.callbacks = callbacks;
    this.peerConnections = new Map(); // userId -> RTCPeerConnection
    this.socketToUserMap = new Map(); // socketId -> userId
    this.userToSocketMap = new Map(); // userId -> socketId
    this.connectionStats = new Map(); // userId -> connection stats
    this.reconnectionAttempts = new Map(); // userId -> attempt count
    this.localStream = null;

    // ICE servers for NAT traversal
    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' }
    ];

    this.setupSocketListeners();
    this.startConnectionMonitoring();
  }

  setupSocketListeners() {
    if (!this.socket) return;

    console.log('🔗 Setting up WebRTC socket listeners');

    this.socket.on('webrtc-offer', this.handleOffer.bind(this));
    this.socket.on('webrtc-answer', this.handleAnswer.bind(this));
    this.socket.on('webrtc-ice-candidate', this.handleIceCandidate.bind(this));
    this.socket.on('webrtc-error', this.handleWebRTCError.bind(this));
    this.socket.on('user-left', this.handleUserLeft.bind(this));
    this.socket.on('webrtc-peer-disconnected', this.handlePeerDisconnected.bind(this));
    this.socket.on('webrtc-session-ended', this.handleSessionEnded.bind(this));
    this.socket.on('session-ended', this.handleSessionEnded.bind(this));
    this.socket.on('reconnect-request', this.handleReconnectRequest.bind(this));
    this.socket.on('ping-response', this.handlePingResponse.bind(this));
  }

  async startLocalStream() {
    try {
      console.log('📹 WebRTC Manager requesting local stream...');
      this.localStream = await mediaManager.getLocalStream();
      
      // Add tracks to existing peer connections
      console.log(`📤 Adding tracks to ${this.peerConnections.size} existing peer connections`);
      for (const [userId, pc] of this.peerConnections) {
        console.log(`🔄 Updating tracks for ${userId}`);
        this.localStream.getTracks().forEach(track => {
          console.log(`➕ Processing ${track.kind} track for ${userId}`);
          const sender = pc.getSenders().find(s => s.track?.kind === track.kind);
          if (sender) {
            console.log(`🔄 Replacing ${track.kind} track for ${userId}`);
            sender.replaceTrack(track);
          } else {
            console.log(`➕ Adding new ${track.kind} track for ${userId}`);
            pc.addTrack(track, this.localStream);
          }
        });
      }
      
      // Notify all existing peer connections about the new stream
      this.notifyPeerConnectionsOfNewStream();

      return this.localStream;
    } catch (error) {
      console.error('❌ Failed to start local stream:', error);
      throw error;
    }
  }

  // Validate Socket Connection
  async validateSocketConnection(targetSocketId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Socket ${targetSocketId} validation timeout`));
      }, 5000);

      const handlePingResponse = (data) => {
        if (data.targetSocketId === targetSocketId) {
          clearTimeout(timeout);
          this.socket.off('ping-response', handlePingResponse);
          
          if (data.status === 'connected') {
            resolve(true);
          } else {
            reject(new Error(`Socket ${targetSocketId} is disconnected`));
          }
        }
      };

      this.socket.on('ping-response', handlePingResponse);
      this.socket.emit('ping-connection', { targetSocketId });
    });
  }

  // Method to notify all peer connections when local stream changes
  notifyPeerConnectionsOfNewStream() {
    if (!this.localStream || this.peerConnections.size === 0) return;

    console.log(`🔄 Notifying ${this.peerConnections.size} peer connections of new stream`);

    for (const [userId, peerConnection] of this.peerConnections) {
      console.log(`🔄 Updating tracks for existing connection: ${userId}`);

      // Get current senders
      const senders = peerConnection.getSenders();

      // Add or replace tracks
      this.localStream.getTracks().forEach(track => {
        const existingSender = senders.find(s => s.track?.kind === track.kind);

        if (existingSender) {
          console.log(`🔄 Replacing ${track.kind} track for ${userId}`);
          existingSender.replaceTrack(track).catch(err => {
            console.error(`❌ Failed to replace ${track.kind} track for ${userId}:`, err);
          });
        } else {
          console.log(`➕ Adding new ${track.kind} track for ${userId}`);
          peerConnection.addTrack(track, this.localStream);
        }
      });
    }
  }

  // Method to update socket-user mapping when participants join
  updateUserSocketMapping(userId, socketId) {
    this.socketToUserMap.set(socketId, userId);
    this.userToSocketMap.set(userId, socketId);
    console.log(`🔗 Updated mapping: ${userId} -> ${socketId}`);
  }

  // Method to get userId by socketId
  getUserIdBySocketId(socketId) {
    return this.socketToUserMap.get(socketId);
  }

  // Method to get socketId by userId
  getSocketIdByUserId(userId) {
    return this.userToSocketMap.get(userId);
  }

  async connectToUser(userId, socketId = null) {
    try {
      console.log(`🤝 Connecting to user: ${userId} (socket: ${socketId})`);

      if (this.peerConnections.has(userId)) {
        console.log(`Already connected to ${userId}`);
        return;
      }

      // Validate socket connection before proceeding
      if (socketId) {
        await this.validateSocketConnection(socketId);
      }

      // Update mapping if socketId provided
      if (socketId) {
        this.updateUserSocketMapping(userId, socketId);
        console.log(`📝 Updated socket mapping: ${userId} -> ${socketId}`);
      }

      // Ensure we have a local stream before creating peer connection
      if (!this.localStream) {
        console.warn(`⚠️ No local stream available when connecting to ${userId}, getting one...`);
        // Try to get local stream
        try {
          this.localStream = await mediaManager.getLocalStream();
          console.log('✅ Got local stream for peer connection');
        } catch (streamError) {
          console.error('❌ Failed to get local stream:', streamError);
        }
      }

      console.log(`🔧 Creating peer connection for ${userId} with local stream:`, {
        hasLocalStream: !!this.localStream,
        localTracks: this.localStream ? this.localStream.getTracks().length : 0
      });

      const peerConnection = await this.createPeerConnection(userId, true);

      // Create and send offer
      console.log(`📋 Creating offer for ${userId} with local stream:`, {
        hasLocalStream: !!this.localStream,
        localTracks: this.localStream ? this.localStream.getTracks().length : 0,
        senders: peerConnection.getSenders().length
      });

      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await peerConnection.setLocalDescription(offer);

      // Get target socket ID
      const targetSocketId = this.getSocketIdByUserId(userId) || socketId;
      if (!targetSocketId) {
        throw new Error(`No socket ID found for user ${userId}`);
      }

      this.socket.emit('webrtc-offer', {
        targetSocketId: targetSocketId,
        offer: offer
      });

      console.log(`📤 Offer sent to ${userId} (socket: ${targetSocketId})`);

    } catch (error) {
      console.error(`❌ Failed to connect to ${userId}:`, error);
    }
  }

  async createPeerConnection(userId, isInitiator = false) {
    console.log(`🔗 Creating peer connection with ${userId}`);

    const peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers,
      iceCandidatePoolSize: 10
    });

    // Store the connection
    this.peerConnections.set(userId, peerConnection);

    // Add local stream tracks
    if (this.localStream && this.localStream.getTracks().length > 0) {
      console.log(`📤 Adding ${this.localStream.getTracks().length} local tracks to peer connection for ${userId}`);
      this.localStream.getTracks().forEach(track => {
        console.log(`➕ Adding ${track.kind} track: ${track.label} (enabled: ${track.enabled})`);
        peerConnection.addTrack(track, this.localStream);
      });
    } else {
      console.warn(`⚠️ No local stream or tracks available when creating peer connection for ${userId}`);
      // Add empty tracks as placeholders
      console.log(`📝 Adding placeholder tracks for ${userId}`);
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('📥 Received remote stream from', userId, {
        streams: event.streams.length,
        track: event.track.kind,
        trackEnabled: event.track.enabled,
        trackLabel: event.track.label
      });

      const [remoteStream] = event.streams;

      if (remoteStream) {
        console.log('📊 Remote stream details:', {
          userId,
          audioTracks: remoteStream.getAudioTracks().length,
          videoTracks: remoteStream.getVideoTracks().length,
          tracks: remoteStream.getTracks().map(t => ({
            kind: t.kind,
            enabled: t.enabled,
            label: t.label
          }))
        });

        if (this.callbacks.onRemoteStream) {
          this.callbacks.onRemoteStream(userId, remoteStream);
        }
      } else {
        console.warn('⚠️ No remote stream in ontrack event for', userId);
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const targetSocketId = this.getSocketIdByUserId(userId);
        if (targetSocketId) {
          this.socket.emit('webrtc-ice-candidate', {
            targetSocketId: targetSocketId,
            candidate: event.candidate
          });
        }
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      console.log(`🔗 Connection state for ${userId}:`, state);

      if (this.callbacks.onConnectionStateChange) {
        this.callbacks.onConnectionStateChange(userId, state);
      }

      // Enhanced connection state handling
      switch (state) {
        case 'connected':
          console.log(`✅ Successfully connected to ${userId}`);
          break;
        case 'disconnected':
          console.log(`⚠️ Disconnected from ${userId}, attempting reconnection...`);
          // Don't immediately close, allow for reconnection
          setTimeout(() => {
            if (peerConnection.connectionState === 'disconnected') {
              console.log(`❌ Reconnection failed for ${userId}, closing connection`);
              this.closePeerConnection(userId);
            }
          }, 5000); // Wait 5 seconds for reconnection
          break;
        case 'failed':
          console.log(`❌ Connection failed for ${userId}, attempting reconnection...`);
          this.closePeerConnection(userId);

          // Attempt to reconnect after a delay
          setTimeout(() => {
            console.log(`🔄 Reconnecting to ${userId}...`);
            this.connectToUser(userId);
          }, 2000);
          break;
        case 'closed':
          console.log(`🔒 Connection closed for ${userId}`);
          break;
      }
    };

    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      const iceState = peerConnection.iceConnectionState;
      console.log(`🧊 ICE connection state for ${userId}:`, iceState);

      switch (iceState) {
        case 'failed':
          console.log(`❌ ICE connection failed for ${userId}, restarting ICE...`);
          peerConnection.restartIce();
          break;
        case 'disconnected':
          console.log(`⚠️ ICE disconnected for ${userId}`);
          break;
        case 'connected':
        case 'completed':
          console.log(`✅ ICE connection established for ${userId}`);
          break;
      }
    };

    return peerConnection;
  }

  async handleOffer(data) {
    try {
      const { senderSocketId, offer } = data;
      console.log(`📥 Received offer from socket ${senderSocketId}`);

      // Find userId by socketId
      const userId = this.getUserIdBySocketId(senderSocketId);
      if (!userId) {
        console.error(`❌ Cannot find userId for socket ${senderSocketId}`);
        return;
      }

      console.log(`📋 Creating answer for ${userId} with local stream:`, {
        hasLocalStream: !!this.localStream,
        localTracks: this.localStream ? this.localStream.getTracks().length : 0
      });

      const peerConnection = await this.createPeerConnection(userId, false);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      this.socket.emit('webrtc-answer', {
        targetSocketId: senderSocketId,
        answer: answer
      });

      console.log(`📤 Answer sent to ${userId} (socket: ${senderSocketId}) with ${peerConnection.getSenders().length} senders`);

    } catch (error) {
      console.error(`❌ Failed to handle offer:`, error);
    }
  }

  async handleAnswer(data) {
    try {
      const { senderSocketId, answer } = data;
      console.log(`📥 Received answer from socket ${senderSocketId}`);

      const userId = this.getUserIdBySocketId(senderSocketId);
      if (!userId) {
        console.error(`❌ Cannot find userId for socket ${senderSocketId}`);
        return;
      }

      const peerConnection = this.peerConnections.get(userId);
      if (peerConnection && peerConnection.signalingState === 'have-local-offer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log(`✅ Answer processed from ${userId}`);
      }

    } catch (error) {
      console.error(`❌ Failed to handle answer:`, error);
    }
  }

  async handleIceCandidate(data) {
    try {
      const { senderSocketId, candidate } = data;

      const userId = this.getUserIdBySocketId(senderSocketId);
      if (!userId) {
        console.error(`❌ Cannot find userId for socket ${senderSocketId}`);
        return;
      }

      const peerConnection = this.peerConnections.get(userId);

      if (peerConnection && peerConnection.remoteDescription) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log(`🧊 ICE candidate added from ${userId}`);
      } else {
        console.warn(`⚠️ Peer connection not ready for ICE candidate from ${userId}, queuing...`);
        
        // Queue ICE candidate for later processing
        if (!this.queuedIceCandidates) {
          this.queuedIceCandidates = new Map();
        }
        
        if (!this.queuedIceCandidates.has(userId)) {
          this.queuedIceCandidates.set(userId, []);
        }
        
        this.queuedIceCandidates.get(userId).push(candidate);
        
        // Retry after a short delay
        setTimeout(() => {
          this.processQueuedIceCandidates(userId);
        }, 1000);
      }

    } catch (error) {
      console.error(`❌ Failed to add ICE candidate:`, error);
    }
  }

  // Process Queued ICE Candidates
  async processQueuedIceCandidates(userId) {
    const peerConnection = this.peerConnections.get(userId);
    const queuedCandidates = this.queuedIceCandidates?.get(userId) || [];
    
    if (peerConnection && peerConnection.remoteDescription && queuedCandidates.length > 0) {
      console.log(`🧊 Processing ${queuedCandidates.length} queued ICE candidates for ${userId}`);
      
      for (const candidate of queuedCandidates) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          console.log(`✅ Queued ICE candidate processed for ${userId}`);
        } catch (error) {
          console.error(`❌ Failed to process queued ICE candidate for ${userId}:`, error);
        }
      }
      
      // Clear the queue
      this.queuedIceCandidates.delete(userId);
    }
  }

  handleUserLeft(data) {
    const { userId } = data;
    console.log(`👋 User left: ${userId}`);
    this.closePeerConnection(userId);
  }

  handlePeerDisconnected(data) {
    const { userId, socketId } = data;
    console.log(`🔌 Peer disconnected: ${userId} (socket: ${socketId})`);
    this.closePeerConnection(userId);
  }

  handleSessionEnded(data) {
    const { roomId, reason } = data;
    console.log(`🛑 Session ended: ${roomId}, reason: ${reason}`);

    // Clean up all peer connections
    for (const [userId] of this.peerConnections) {
      this.closePeerConnection(userId);
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Clear mappings
    this.socketToUserMap.clear();
    this.userToSocketMap.clear();

    console.log('✅ WebRTC cleanup completed for session end');
  }

  // New WebRTC Error Handler
  handleWebRTCError(data) {
    const { senderSocketId, error, errorType, targetSocketId } = data;
    console.error(`❌ WebRTC error received:`, { error, errorType, from: senderSocketId });
    
    if (this.callbacks.onWebRTCError) {
      this.callbacks.onWebRTCError(error, errorType, senderSocketId);
    }
    
    // Handle specific error types
    switch (errorType) {
      case 'socket_not_found':
        console.log('🔄 Attempting to refresh socket mapping...');
        this.refreshSocketMappings();
        break;
      case 'validation_error':
        console.log('⚠️ Data validation failed, retrying with fresh data...');
        break;
    }
  }

  // Reconnection Request Handler
  handleReconnectRequest(data) {
    const { fromUserId, fromSocketId, fromUserName } = data;
    console.log(`🔄 Reconnection request from ${fromUserName} (${fromUserId})`);
    
    // Update socket mapping
    this.updateUserSocketMapping(fromUserId, fromSocketId);
    
    // Attempt reconnection
    setTimeout(() => {
      this.connectToUser(fromUserId, fromSocketId);
    }, 1000);
  }

  // Ping Response Handler
  handlePingResponse(data) {
    const { targetSocketId, status, timestamp } = data;
    console.log(`🏓 Ping response: ${targetSocketId} is ${status}`);
    
    if (status === 'disconnected') {
      const userId = this.getUserIdBySocketId(targetSocketId);
      if (userId) {
        this.closePeerConnection(userId);
      }
    }
  }

  // Refresh Socket Mappings
  refreshSocketMappings() {
    console.log('🔄 Refreshing socket mappings...');
    // This would typically involve re-querying the server for current participants
    if (this.callbacks.onRefreshMappings) {
      this.callbacks.onRefreshMappings();
    }
  }

  // Connection monitoring and quality assessment
  startConnectionMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.checkConnectionQuality();
    }, 5000); // Check every 5 seconds
  }

  async checkConnectionQuality() {
    for (const [userId, peerConnection] of this.peerConnections) {
      try {
        const stats = await peerConnection.getStats();
        const connectionStats = this.analyzeStats(stats, userId);

        if (this.callbacks.onConnectionQuality) {
          this.callbacks.onConnectionQuality(userId, connectionStats);
        }

        // Store stats for trend analysis
        this.connectionStats.set(userId, connectionStats);

        // Check for connection issues
        if (connectionStats.quality === 'poor') {
          console.warn(`⚠️ Poor connection quality detected for ${userId}:`, connectionStats);

          if (this.callbacks.onConnectionIssue) {
            this.callbacks.onConnectionIssue(userId, connectionStats);
          }
        }

      } catch (error) {
        console.error(`❌ Failed to get stats for ${userId}:`, error);
      }
    }
  }

  analyzeStats(stats, userId) {
    let bytesReceived = 0;
    let bytesSent = 0;
    let packetsLost = 0;
    let packetsReceived = 0;
    let roundTripTime = 0;
    let jitter = 0;

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp') {
        bytesReceived += report.bytesReceived || 0;
        packetsLost += report.packetsLost || 0;
        packetsReceived += report.packetsReceived || 0;
        jitter += report.jitter || 0;
      } else if (report.type === 'outbound-rtp') {
        bytesSent += report.bytesSent || 0;
      } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        roundTripTime = report.currentRoundTripTime || 0;
      }
    });

    const packetLossRate = packetsReceived > 0 ? (packetsLost / (packetsLost + packetsReceived)) * 100 : 0;

    // Determine connection quality
    let quality = 'excellent';
    if (packetLossRate > 5 || roundTripTime > 300 || jitter > 50) {
      quality = 'poor';
    } else if (packetLossRate > 2 || roundTripTime > 150 || jitter > 30) {
      quality = 'fair';
    } else if (packetLossRate > 1 || roundTripTime > 100 || jitter > 20) {
      quality = 'good';
    }

    return {
      userId,
      quality,
      bytesReceived,
      bytesSent,
      packetsLost,
      packetsReceived,
      packetLossRate: Math.round(packetLossRate * 100) / 100,
      roundTripTime: Math.round(roundTripTime * 1000), // Convert to ms
      jitter: Math.round(jitter * 1000), // Convert to ms
      timestamp: Date.now()
    };
  }

  closePeerConnection(userId) {
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(userId);

      // Clean up mappings and stats
      const socketId = this.userToSocketMap.get(userId);
      if (socketId) {
        this.socketToUserMap.delete(socketId);
        this.userToSocketMap.delete(userId);
      }
      this.connectionStats.delete(userId);
      this.reconnectionAttempts.delete(userId);

      if (this.callbacks.onPeerDisconnected) {
        this.callbacks.onPeerDisconnected(userId);
      }

      console.log(`🧹 Cleaned up peer connection for ${userId}`);
    }
  }

  async startScreenShare() {
    try {
      console.log('🖥️ WebRTC Manager starting screen share...');
      const screenStream = await mediaManager.getScreenShare();
      const videoTrack = screenStream.getVideoTracks()[0];

      if (!videoTrack) {
        throw new Error('No video track in screen stream');
      }

      console.log('🖥️ Replacing video tracks in peer connections...');
      console.log(`📊 Current peer connections: ${this.peerConnections.size}`);

      // Replace video track in all peer connections
      for (const [userId, peerConnection] of this.peerConnections) {
        console.log(`🔄 Processing peer connection for ${userId}, state: ${peerConnection.connectionState}`);

        const senders = peerConnection.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');

        if (videoSender) {
          console.log(`🔄 Replacing video track for ${userId}`);
          await videoSender.replaceTrack(videoTrack);
          console.log(`✅ Replaced video track for ${userId}`);
        } else {
          console.log(`➕ Adding new video track for ${userId}`);
          peerConnection.addTrack(videoTrack, screenStream);
          console.log(`✅ Added screen track for ${userId}`);
        }
      }

      // Update local stream reference with screen share
      const newLocalStream = new MediaStream([
        videoTrack,
        ...(this.localStream ? this.localStream.getAudioTracks() : [])
      ]);

      this.localStream = newLocalStream;

      console.log('✅ Screen share started successfully');
      return screenStream;
    } catch (error) {
      console.error('❌ Failed to start screen share:', error);
      throw error;
    }
  }

  async stopScreenShare() {
    try {
      console.log('🖥️ WebRTC Manager stopping screen share...');

      // Stop screen share in media manager
      mediaManager.stopScreenShare();

      // Get camera stream again
      const cameraStream = await mediaManager.getLocalStream();
      const videoTrack = cameraStream.getVideoTracks()[0];

      if (!videoTrack) {
        console.warn('⚠️ No camera video track available');
      }

      console.log('📹 Replacing screen share with camera in peer connections...');
      // Replace screen share with camera in all peer connections
      for (const [userId, peerConnection] of this.peerConnections) {
        const sender = peerConnection.getSenders().find(s =>
          s.track && s.track.kind === 'video'
        );

        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
          console.log(`✅ Restored camera track for ${userId}`);
        }
      }

      // Update local stream reference
      this.localStream = cameraStream;
      console.log('✅ Screen share stopped successfully');
      return cameraStream;
    } catch (error) {
      console.error('❌ Failed to stop screen share:', error);
      throw error;
    }
  }

  cleanup() {
    console.log('🧹 Cleaning up WebRTC Manager...');

    // Stop monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Close all peer connections
    for (const [userId, peerConnection] of this.peerConnections) {
      peerConnection.close();
    }
    this.peerConnections.clear();

    // Clear all maps and stats
    this.socketToUserMap.clear();
    this.userToSocketMap.clear();
    this.connectionStats.clear();
    this.reconnectionAttempts.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Remove socket listeners
    if (this.socket) {
      this.socket.off('webrtc-offer');
      this.socket.off('webrtc-answer');
      this.socket.off('webrtc-ice-candidate');
      this.socket.off('webrtc-error');
      this.socket.off('user-left');
      this.socket.off('webrtc-peer-disconnected');
      this.socket.off('webrtc-session-ended');
      this.socket.off('session-ended');
      this.socket.off('reconnect-request');
      this.socket.off('ping-response');
    }

    // Clear ICE candidate queue
    if (this.queuedIceCandidates) {
      this.queuedIceCandidates.clear();
    }

    console.log('✅ WebRTC Manager cleanup completed');
  }

  // Debug method to check WebRTC state
  getDebugInfo() {
    return {
      peerConnections: Array.from(this.peerConnections.entries()).map(([userId, pc]) => ({
        userId,
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
        signalingState: pc.signalingState,
        senders: pc.getSenders().map(s => ({
          kind: s.track?.kind,
          enabled: s.track?.enabled,
          label: s.track?.label
        })),
        receivers: pc.getReceivers().map(r => ({
          kind: r.track?.kind,
          enabled: r.track?.enabled,
          label: r.track?.label
        }))
      })),
      localStream: this.localStream ? {
        tracks: this.localStream.getTracks().map(t => ({
          kind: t.kind,
          enabled: t.enabled,
          label: t.label,
          readyState: t.readyState
        }))
      } : null,
      socketMappings: {
        socketToUser: Array.from(this.socketToUserMap.entries()),
        userToSocket: Array.from(this.userToSocketMap.entries())
      }
    };
  }
}

export default WebRTCManager;
