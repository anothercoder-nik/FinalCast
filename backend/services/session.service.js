import * as sessionDAO from "../DAO/session.dao.js";

export const createSessionService = async (sessionData, hostId) => {
  const session = await sessionDAO.createSessionDAO({
    ...sessionData,
    host: hostId
  });
  return session;
};

export const getUserSessionsService = async (userId) => {
  return await sessionDAO.findUserSessions(userId);
};


export const joinSessionService = async (sessionId, userId) => {
  const session = await sessionDAO.findSessionById(sessionId);
  if (!session) throw new Error("Session not found");

  // Check if session is ended or cancelled
  if (session.status === 'ended') {
    throw new Error("This session has ended and cannot be joined");
  }
  
  if (session.status === 'cancelled') {
    throw new Error("This session has been cancelled");
  }

  // Check if user is the host
  if (session.host._id.toString() === userId.toString()) {
    throw new Error("Host cannot join their own session - you're already the host");
  }

  const activeCount = session.participants.filter(p => p.isActive).length;
  if (activeCount >= session.maxParticipants) {
    throw new Error("Session is full");
  }

  const alreadyParticipant = session.participants.some(
    p => p.user._id.toString() === userId.toString() && p.isActive
  );
  if (alreadyParticipant) {
    throw new Error("Already joined");
  }

  session.participants.push({ user: userId });
  return await session.save();
};

export const joinSessionByRoomIdService = async (roomId, userId) => {
  console.log('Joining session by room ID:', roomId, 'User ID:', userId);
  const session = await sessionDAO.findSessionByRoomId(roomId);
  
  if (!session) throw new Error("Session not found");

  // Check if session is ended or cancelled
  if (session.status === 'ended') {
    throw new Error("This session has ended and cannot be joined");
  }
  
  if (session.status === 'cancelled') {
    throw new Error("This session has been cancelled");
  }

  // Check if user is the host
  if (session.host._id.toString() === userId.toString()) {
    throw new Error("Host cannot join their own session - you're already the host");
  }

  // Count only non-host participants
  const activeCount = session.participants.filter(p => 
    p.isActive && p.user._id.toString() !== session.host._id.toString()
  ).length;
  
  if (activeCount >= session.maxParticipants - 1) { // -1 because host takes one slot
    throw new Error("Session is full");
  }

  const alreadyParticipant = session.participants.some(
    p => p.user._id.toString() === userId.toString() && p.isActive
  );
  if (alreadyParticipant) {
    throw new Error("Already joined");
  }

  session.participants.push({ user: userId });
  return await session.save();
};

export const leaveSessionService = async (sessionId, userId) => {
  const session = await sessionDAO.findSessionById(sessionId);
  if (!session) throw new Error("Session not found");

  // Check if user is the host
  if (session.host._id.toString() === userId.toString()) {
    
    
    // Host is leaving - end the session
    session.status = 'ended';
    session.endedAt = new Date();
    if (session.startedAt) {
      session.duration = Math.floor((session.endedAt - session.startedAt) / 60000);
    }
    // Mark all participants as inactive
    
    
    session.participants.forEach(p => {
      if (p.isActive) {
        p.isActive = false;
        p.leftAt = new Date();
      }
    });
    await session.save();
    return { message: "Session ended - host left", isHost: true };
  }

  // Regular participant leaving
  const participant = session.participants.find(
    p => p.user._id.toString() === userId.toString() && p.isActive
  );
  if (!participant) {
    throw new Error("You are not an active participant");
  }

  participant.isActive = false;
  participant.leftAt = new Date();
  await session.save();
  return { message: "Left the session", isHost: false };
};

export const updateSessionStatusService = async (sessionId, status, hostId) => {
  if (!["scheduled", "live", "ended", "cancelled"].includes(status)) {
    throw new Error("Invalid status");
  }

  const session = await sessionDAO.findSessionByIdAndHost(sessionId, hostId);
  if (!session) {
    throw new Error("Session not found or you are not authorized to update this session");
  }

  const updateData = { status };
  if (status === "live") updateData.startedAt = new Date();
  if (status === "ended") {
    updateData.endedAt = new Date();
    if (session.startedAt) {
      updateData.duration = Math.floor((updateData.endedAt - session.startedAt) / 60000);
    }
  }

  return await sessionDAO.updateSessionById(sessionId, updateData);
};

export const getSessionParticipantsService = async (sessionId, userId) => {
  const session = await sessionDAO.findSessionForParticipants(sessionId);
  if (!session) throw new Error("Session not found");

  const isHost = session.host._id.toString() === userId.toString();
  const isParticipant = session.participants.some(
    p => p.user._id.toString() === userId.toString()
  );

  // Allow both host and participants (including those who left) to view details
  if (!isHost && !isParticipant) {
    throw new Error("Not authorized to view participants");
  }

  return {
    session: {
      _id: session._id,
      title: session.title,
      host: session.host,
      participants: session.participants, // Return ALL participants, not just active ones
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      duration: session.duration,
      scheduledAt: session.scheduledAt,
      maxParticipants: session.maxParticipants
    },
    isHost
  };
};

export const updateParticipantRoleService = async (sessionId, participantId, role, hostId) => {
  if (!['participant', 'moderator'].includes(role)) {
    throw new Error("Invalid role. Must be 'participant' or 'moderator'");
  }

  const session = await sessionDAO.findSessionByIdAndHost(sessionId, hostId);
  if (!session) {
    throw new Error("Session not found or you are not authorized to manage this session");
  }

  const participant = session.participants.find(
    p => p.user.toString() === participantId && p.isActive
  );
  if (!participant) {
    throw new Error("Participant not found");
  }

  participant.role = role;
  await session.save();
  
  return {
    message: `Participant role updated to ${role}`,
    participant
  };
};

export const removeParticipantService = async (sessionId, participantId, hostId) => {
  const session = await sessionDAO.findSessionByIdAndHost(sessionId, hostId);
  if (!session) {
    throw new Error("Session not found or you are not authorized to manage this session");
  }

  const participant = session.participants.find(
    p => p.user.toString() === participantId && p.isActive
  );
  if (!participant) {
    throw new Error("Participant not found");
  }

  participant.isActive = false;
  participant.leftAt = new Date();
  await session.save();
  
  return { message: "Participant removed from session" };
};

export const deleteSessionService = async (sessionId, hostId) => {
  const session = await sessionDAO.findSessionByIdAndHost(sessionId, hostId);
  if (!session) {
    throw new Error("Session not found or you are not authorized to delete this session");
  }

  await sessionDAO.deleteSessionById(sessionId);
  return { message: "Session deleted successfully" };
};

export const getSessionByRoomIdService = async (roomId) => {
  const session = await sessionDAO.findSessionByRoomId(roomId);
  if (!session) throw new Error("Session not found");
  
  return session;
};

export const endSessionService = async (sessionId, hostId) => {
  const session = await sessionDAO.findSessionByIdAndHost(sessionId, hostId);
  if (!session) {
    throw new Error("Session not found or you are not authorized to end this session");
  }

  session.status = 'ended';
  session.endedAt = new Date();
  if (session.startedAt) {
    session.duration = Math.floor((session.endedAt - session.startedAt) / 60000);
  }
  
  // Mark all participants as inactive
  session.participants.forEach(p => {
    if (p.isActive) {
      p.isActive = false;
      p.leftAt = new Date();
    }
  });
  
  await session.save();
  return { message: "Session ended successfully" };
};
