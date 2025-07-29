// socket/socketHandlers.js

import Session from "../models/session.model.js";

export const setupSocketHandlers = (io) => {
  console.log('🔌 Setting up Socket.IO handlers...');

  // Store active sessions and their participants
  const activeSessions = new Map(); // roomId -> { hostId, participants, sessionStatus, sessionId }

  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    // HOST STARTS SESSION
    socket.on('start-session', async (data) => {
      try {
        const { roomId, userId, userName, sessionId } = data;
        console.log(`🔴 Starting session ${roomId} by ${userName}`);
        
        // Verify user is the host
        const session = await Session.findOne({ 
          $or: [{ _id: sessionId }, { roomId: roomId }],
          host: userId 
        });
        
        if (!session) {
          socket.emit('error', { message: 'Unauthorized: Only host can start session' });
          return;
        }

        // Update session status in database with actual start time
        session.status = 'live';
        session.startedAt = new Date();
        await session.save();

        // Store active session info with start time
        activeSessions.set(roomId, {
          hostId: userId,
          hostSocketId: socket.id,
          participants: new Set([userId]),
          sessionStatus: 'live',
          sessionId: sessionId,
          startedAt: new Date() // Store actual start time
        });

        // Join the room
        socket.join(roomId);
        socket.userId = userId;
        socket.userName = userName;
        socket.roomId = roomId;
        socket.isHost = true;

        // Notify that session has started
        io.to(roomId).emit('session-started', {
          roomId,
          hostName: userName,
          hostSocketId: socket.id,
          startedAt: new Date(),
          message: 'Session is now live!'
        });

        // Send current participants to host
        const participants = await getCurrentParticipants(io, roomId);
        socket.emit('current-participants', participants);

        socket.emit('session-start-success', {
          roomId,
          sessionId,
          participants
        });

        console.log(`✅ Session ${roomId} started successfully at ${new Date()}`);
        
      } catch (error) {
        console.error('❌ Error starting session:', error);
        socket.emit('error', { message: 'Failed to start session' });
      }
    });

    // PARTICIPANTS JOIN LIVE SESSION
    socket.on('join-live-session', async (data) => {
      try {
        const { roomId, userId, userName, sessionId } = data;
        console.log(`🚪 ${userName} joining session ${roomId}`);
        
        // Check room capacity (adjust as needed)
        const MAX_PARTICIPANTS = 8;
        const currentParticipants = io.sockets.adapter.rooms.get(roomId)?.size || 0;
        if (currentParticipants >= MAX_PARTICIPANTS) {
          socket.emit('error', { 
            message: 'Room is full. Maximum participants reached.',
            code: 'ROOM_FULL'
          });
          return;
        }
        
        // Check if session is active
        const activeSession = activeSessions.get(roomId);
        if (!activeSession || activeSession.sessionStatus !== 'live') {
          socket.emit('error', { message: 'Session is not active or has ended' });
          return;
        }

        // Verify session exists in database
        const session = await Session.findById(sessionId || activeSession.sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Add participant to database if not already there
        const existingParticipant = session.participants.find(
          p => p.user._id.toString() === userId.toString()
        );
        
        if (!existingParticipant) {
          session.participants.push({ 
            user: userId, 
            joinedAt: new Date(),
            isActive: true 
          });
          await session.save();
        } else if (!existingParticipant.isActive) {
          // Reactivate participant
          existingParticipant.isActive = true;
          existingParticipant.joinedAt = new Date();
          existingParticipant.leftAt = undefined;
          await session.save();
        }

        // Join the room
        socket.join(roomId);
        socket.userId = userId;
        socket.userName = userName;
        socket.roomId = roomId;
        socket.isHost = false;

        // Add to active participants
        activeSession.participants.add(userId);

        // Notify others in the room with socket mapping info
        socket.to(roomId).emit('user-joined', {
          userId,
          userName,
          socketId: socket.id,
          timestamp: new Date(),
          isHost: false,
          shouldConnect: true // Flag to trigger WebRTC connection
        });

        // Send current participants to new user
        const participants = await getCurrentParticipants(io, roomId);
        socket.emit('current-participants', participants);

        socket.emit('join-success', {
          roomId,
          sessionTitle: session.title,
          hostName: participants.find(p => p.isHost)?.userName || 'Unknown',
          participants
        });

        // Update room stats
        const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
        io.to(roomId).emit('room-stats', { 
          participantCount: roomSize,
          activeParticipants: activeSession.participants.size
        });

        console.log(`✅ ${userName} joined session ${roomId} successfully`);
        
      } catch (error) {
        console.error('❌ Error joining session:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // HOST ENDS SESSION
    socket.on('end-session', async (data) => {
      try {
        const { roomId, userId, sessionId } = data;
        console.log(`⏹️ Ending session ${roomId} by user ${userId}`);
        
        const activeSession = activeSessions.get(roomId);
        if (!activeSession) {
          console.log(`❌ No active session found for room ${roomId}`);
          socket.emit('error', { message: 'No active session found' });
          return;
        }
        
        if (activeSession.hostId !== userId) {
          console.log(`❌ Unauthorized end session attempt by ${userId}, host is ${activeSession.hostId}`);
          socket.emit('error', { message: 'Unauthorized: Only host can end session' });
          return;
        }

        // Calculate actual duration from start time
        const endTime = new Date();
        const startTime = activeSession.startedAt || new Date();
        const actualDuration = Math.floor((endTime - startTime) / 60000); // minutes

        // Update session in database
        const session = await Session.findById(sessionId || activeSession.sessionId);
        if (session) {
          session.status = 'ended';
          session.endedAt = endTime;
          session.duration = actualDuration;
          
          // Mark all participants as inactive
          session.participants.forEach(p => {
            if (p.isActive) {
              p.isActive = false;
              p.leftAt = endTime;
            }
          });
          
          await session.save();
          console.log(`✅ Session ${sessionId} ended. Duration: ${actualDuration} minutes`);
        }

        // Notify all participants that session ended
        io.to(roomId).emit('session-ended', {
          roomId,
          endedBy: socket.userName,
          endedAt: endTime,
          duration: actualDuration,
          message: 'The host has ended the session',
          reason: 'host_ended'
        });

        // Emit WebRTC cleanup for all participants
        io.to(roomId).emit('webrtc-session-ended', {
          roomId,
          reason: 'session_ended'
        });

        // Disconnect all sockets in this room
        const roomSockets = io.sockets.adapter.rooms.get(roomId);
        if (roomSockets) {
          for (const socketId of roomSockets) {
            const participantSocket = io.sockets.sockets.get(socketId);
            if (participantSocket) {
              participantSocket.leave(roomId);
            }
          }
        }

        // Clean up session data
        activeSessions.delete(roomId);
        
        console.log(`✅ Session ${roomId} ended successfully`);
        
      } catch (error) {
        console.error('❌ Error ending session:', error);
        socket.emit('error', { message: 'Failed to end session: ' + error.message });
      }
    });

    // USER LEAVES SESSION
    socket.on('leave-session', (data = {}) => {
      console.log(`🚪 User ${socket.userId} leaving session ${socket.roomId}`);
      
      if (socket.roomId) {
        handleUserLeave(socket, io, activeSessions);
      } else {
        console.log('❌ No room to leave');
        socket.emit('error', { message: 'Not in any session' });
      }
    });

    // CHAT MESSAGES
    socket.on('send-message', (data) => {
      try {
        const { roomId, message, userName, userId } = data;
        
        // Validate session is active
        const activeSession = activeSessions.get(roomId);
        if (!activeSession || activeSession.sessionStatus !== 'live') {
          socket.emit('error', { message: 'Cannot send message: Session is not active' });
          return;
        }

        // Validate message data
        if (!roomId || !message || !message.trim() || !userName) {
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }
        
        const messageData = {
          id: generateMessageId(),
          message: message.trim(),
          userName,
          userId,
          timestamp: new Date(),
          socketId: socket.id
        };
        
        // Broadcast to all users in the room (including sender)
        io.to(roomId).emit('receive-message', messageData);
        console.log(`💬 Message in ${roomId}: ${userName}: ${message.substring(0, 50)}...`);
        
      } catch (error) {
        console.error('❌ Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // PARTICIPANT STATUS UPDATES (mute/unmute, video on/off)
    socket.on('participant-status-update', (data) => {
      try {
        const { roomId, userId, status } = data;
        
        if (!roomId || !userId || !status) {
          socket.emit('error', { message: 'Invalid status update data' });
          return;
        }
        
        // Broadcast status change to room
        socket.to(roomId).emit('participant-status-changed', {
          userId,
          status, // { audioEnabled: true/false, videoEnabled: true/false }
          updatedBy: socket.userId,
          timestamp: new Date()
        });
        
        console.log(`🔧 Status update in ${roomId}: ${userId} -> ${JSON.stringify(status)}`);
        
      } catch (error) {
        console.error('❌ Error updating participant status:', error);
        socket.emit('error', { message: 'Failed to update status' });
      }
    });

    // HOST ACTIONS (mute participant, kick, promote, etc.)
    socket.on('host-action', (data) => {
      try {
        const { roomId, action, targetUserId, hostId } = data;
        
        // Validate host permissions
        const activeSession = activeSessions.get(roomId);
        if (!activeSession || activeSession.hostId !== socket.userId) {
          socket.emit('error', { message: 'Unauthorized: Host privileges required' });
          return;
        }
        
        // Broadcast host action to room
        io.to(roomId).emit('host-action-broadcast', {
          action, // 'mute', 'unmute', 'kick', 'promote', etc.
          targetUserId,
          hostId,
          hostName: socket.userName,
          timestamp: new Date()
        });
        
        // Handle specific actions
        if (action === 'kick') {
          // Find and disconnect the target user
          const roomSockets = io.sockets.adapter.rooms.get(roomId);
          if (roomSockets) {
            for (const socketId of roomSockets) {
              const targetSocket = io.sockets.sockets.get(socketId);
              if (targetSocket && targetSocket.userId === targetUserId) {
                targetSocket.emit('kicked-from-session', {
                  message: `You have been removed from the session by ${socket.userName}`,
                  hostName: socket.userName
                });
                targetSocket.leave(roomId);
                break;
              }
            }
          }
        }
        
        console.log(`👑 Host action in ${roomId}: ${action} on ${targetUserId} by ${hostId}`);
        
      } catch (error) {
        console.error('❌ Error executing host action:', error);
        socket.emit('error', { message: 'Failed to execute host action' });
      }
    });

    // TYPING INDICATORS
    socket.on('typing-start', (data) => {
      const { roomId } = data;
      if (!roomId) {
        console.warn('⚠️ No roomId provided for typing-start');
        return;
      }
      socket.to(roomId).emit('user-typing', {
        userId: socket.userId,
        userName: socket.userName,
        isTyping: true
      });
    });

    socket.on('typing-stop', (data) => {
      const { roomId } = data;
      socket.to(roomId).emit('user-typing', {
        userId: socket.userId,
        userName: socket.userName,
        isTyping: false
      });
    });

    // WebRTC Signaling Handlers
    socket.on('webrtc-offer', (data) => {
      const { targetSocketId, offer } = data;
      
      if (!targetSocketId || !offer) {
        console.warn('⚠️ Invalid offer data received');
        socket.emit('webrtc-error', { 
          error: 'Invalid offer data', 
          errorType: 'validation_error' 
        });
        return;
      }
      
      console.log(`📤 Relaying WebRTC offer from ${socket.id} to ${targetSocketId}`);
      
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.emit('webrtc-offer', {
          senderSocketId: socket.id,
          offer: offer
        });
        console.log(`✅ Offer relayed successfully: ${socket.id} -> ${targetSocketId}`);
      } else {
        console.warn(`⚠️ Target socket ${targetSocketId} not found for offer`);
        socket.emit('webrtc-error', { 
          error: 'Target socket not found', 
          errorType: 'socket_not_found',
          targetSocketId 
        });
      }
    });

    socket.on('webrtc-answer', (data) => {
      const { targetSocketId, answer } = data;
      
      if (!targetSocketId || !answer) {
        console.warn('⚠️ Invalid answer data received');
        socket.emit('webrtc-error', { 
          error: 'Invalid answer data', 
          errorType: 'validation_error' 
        });
        return;
      }
      
      console.log(`📤 Relaying WebRTC answer from ${socket.id} to ${targetSocketId}`);
      
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.emit('webrtc-answer', {
          senderSocketId: socket.id,
          answer: answer
        });
        console.log(`✅ Answer relayed successfully: ${socket.id} -> ${targetSocketId}`);
      } else {
        console.warn(`⚠️ Target socket ${targetSocketId} not found for answer`);
        socket.emit('webrtc-error', { 
          error: 'Target socket not found', 
          errorType: 'socket_not_found',
          targetSocketId 
        });
      }
    });

socket.on('webrtc-ice-candidate', (data) => {
  const { targetSocketId, candidate } = data;
  
  if (!targetSocketId || !candidate) {
    console.warn('⚠️ Invalid ICE candidate data received');
    return;
  }
  
  const targetSocket = io.sockets.sockets.get(targetSocketId);
  if (targetSocket) {
    targetSocket.emit('webrtc-ice-candidate', {
      senderSocketId: socket.id,
      candidate: candidate
    });
    console.log(`🧊 ICE candidate relayed: ${socket.id} -> ${targetSocketId}`);
  } else {
    console.warn(`⚠️ Target socket ${targetSocketId} not found for ICE candidate`);
  }
});

    // WebRTC Connection State Management 
    socket.on('webrtc-connection-state', (data) => {
      const { targetSocketId, connectionState, userId } = data;
      console.log(`🔗 WebRTC connection state: ${socket.id} -> ${targetSocketId}: ${connectionState}`);
      
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.emit('webrtc-connection-state', {
          senderSocketId: socket.id,
          senderUserId: socket.userId,
          connectionState
        });
      }
      
      // Broadcast to room for UI updates
      if (socket.roomId) {
        socket.to(socket.roomId).emit('peer-connection-update', {
          userId: socket.userId,
          targetUserId: userId,
          state: connectionState
        });
      }
    });

    // Stream State Management
    socket.on('stream-state-change', (data) => {
      const { hasVideo, hasAudio } = data;
      
      if (socket.roomId) {
        socket.to(socket.roomId).emit('participant-stream-update', {
          userId: socket.userId,
          userName: socket.userName,
          hasVideo,
          hasAudio,
          timestamp: new Date()
        });
        
        console.log(`📹 Stream update: ${socket.userName} - video: ${hasVideo}, audio: ${hasAudio}`);
      }
    });

    // WebRTC Error Handling
    socket.on('webrtc-error', (data) => {
      const { targetSocketId, error, errorType } = data;
      console.error(`❌ WebRTC error from ${socket.id} to ${targetSocketId}:`, error);
      
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.emit('webrtc-error', {
          senderSocketId: socket.id,
          error,
          errorType
        });
      }
      
      // Broadcast connection failure to room
      if (socket.roomId) {
        socket.to(socket.roomId).emit('peer-connection-failed', {
          userId: socket.userId,
          targetSocketId,
          error: errorType
        });
      }
    });

    // Socket Connection Health Check
    socket.on('ping-connection', (data) => {
      const { targetSocketId } = data;
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      
      if (targetSocket) {
        socket.emit('ping-response', { 
          targetSocketId, 
          status: 'connected',
          timestamp: new Date()
        });
      } else {
        socket.emit('ping-response', { 
          targetSocketId, 
          status: 'disconnected',
          timestamp: new Date()
        });
      }
    });

    // WebRTC Reconnection Request
    socket.on('request-reconnect', (data) => {
      const { targetUserId } = data;
      const targetSocket = findSocketByUserId(targetUserId);
      
      if (targetSocket) {
        targetSocket.emit('reconnect-request', {
          fromUserId: socket.userId,
          fromSocketId: socket.id,
          fromUserName: socket.userName
        });
        
        console.log(`🔄 Reconnect request: ${socket.userName} -> ${targetUserId}`);
      } else {
        socket.emit('webrtc-error', {
          error: 'Target user not found for reconnection',
          errorType: 'user_not_found',
          targetUserId
        });
      }
    });

    // Helper function to find socket by userId
    function findSocketByUserId(userId) {
      for (const [socketId, socket] of io.sockets.sockets) {
        if (socket.userId === userId) {
          return socket;
        }
      }
      return null;
    }

    // DISCONNECT HANDLING
    socket.on('disconnect', (reason) => {
      console.log(`❌ User disconnected: ${socket.id}, reason: ${reason}`);
      
      if (socket.roomId && socket.userId) {
        const activeSession = activeSessions.get(socket.roomId);
        
        // Broadcast WebRTC cleanup to all room participants
        socket.to(socket.roomId).emit('webrtc-peer-disconnected', {
          userId: socket.userId,
          socketId: socket.id,
          reason: 'socket_disconnect'
        });
        
        // If host disconnects, end the session
        if (activeSession && activeSession.hostId === socket.userId) {
          console.log(`👑 Host disconnected, ending session ${socket.roomId}`);
          
          // Notify participants and end session
          socket.to(socket.roomId).emit('session-ended', {
            roomId: socket.roomId,
            endedBy: socket.userName,
            endedAt: new Date(),
            message: 'Session ended: Host disconnected',
            reason: 'host_disconnect'
          });

      
      
          // Update database
          Session.findById(activeSession.sessionId).then(session => {
            if (session) {
              session.status = 'ended';
              session.endedAt = new Date();
              if (session.startedAt) {
                session.duration = Math.floor((session.endedAt - session.startedAt) / 60000);
              }
              session.save();
            }
          }).catch(console.error);

          // Clean up
          activeSessions.delete(socket.roomId);
        } else {
          // Regular participant disconnect
          handleUserLeave(socket, io, activeSessions);
        }
      }
    });

    // ERROR HANDLING
    socket.on('error', (error) => {
      console.error('🚨 Socket error:', error);
    });
  });

  // HELPER FUNCTIONS
  
  // Get current participants in a room
  const getCurrentParticipants = async (io, roomId) => {
    const roomSockets = io.sockets.adapter.rooms.get(roomId);
    const participants = [];
    
    if (roomSockets) {
      for (const socketId of roomSockets) {
        const participantSocket = io.sockets.sockets.get(socketId);
        if (participantSocket && participantSocket.userId) {
          participants.push({
            userId: participantSocket.userId,
            userName: participantSocket.userName,
            socketId: participantSocket.id,
            isHost: participantSocket.isHost || false,
            joinedAt: new Date()
          });
        }
      }
    }
    
    return participants;
  };

  // Handle user leaving session
  const handleUserLeave = (socket, io, activeSessions) => {
    const { roomId, userId, userName, isHost } = socket;
    
    if (isHost) {
      // Host is leaving - end session for everyone
      const activeSession = activeSessions.get(roomId);
      if (activeSession) {
        io.to(roomId).emit('session-ended', {
          roomId,
          endedBy: userName,
          endedAt: new Date(),
          message: 'Session ended: Host left the session',
          reason: 'host_left'
        });
        activeSessions.delete(roomId);
      }
    } else {
      // Regular participant leaving
      const activeSession = activeSessions.get(roomId);
      if (activeSession) {
        activeSession.participants.delete(userId);
      }
      
      // Notify others that user left (for WebRTC cleanup)
      socket.to(roomId).emit('user-left', {
        userId,
        userName,
        socketId: socket.id,
        timestamp: new Date()
      });

      // Also emit WebRTC cleanup event
      socket.to(roomId).emit('webrtc-peer-disconnected', {
        userId,
        socketId: socket.id
      });
      

      // Update room stats
      const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
      io.to(roomId).emit('room-stats', { 
        participantCount: roomSize - 1, // -1 because socket hasn't left yet
        activeParticipants: activeSession?.participants.size || 0
      });
    }
    
    socket.leave(roomId);
    console.log(`👋 ${userName} left session: ${roomId}`);
  };

  // Generate unique message ID
  const generateMessageId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

  };

  console.log('✅ Socket.IO handlers setup complete');
};
