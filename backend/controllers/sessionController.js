
import wrapAsync from "../utils/trycatchwrapper.js";
import * as sessionService from "../services/session.service.js";

export const createSession = wrapAsync(async (req, res) => {
  const { title, description, scheduledAt, maxParticipants, settings } = req.body;
  
  const session = await sessionService.createSessionService({
    title,
    description,
    scheduledAt,
    maxParticipants,
    settings
  }, req.user._id);
  
  res.status(201).json(session);
});

export const getAllSessions = wrapAsync(async (req, res) => {
  const sessions = await sessionService.getUserSessionsService(req.user._id);
  res.json(sessions);
});

export const joinSession = wrapAsync(async (req, res) => {
  const session = await sessionService.joinSessionService(req.params.id, req.user._id);
  res.json(session);
});

export const joinSessionByRoomId = async (req, res) => {
  try {
    console.log('Joining session by room ID:', req.params.roomId, 'User ID:', req.user._id);
    
    const session = await sessionService.joinSessionByRoomIdService(req.params.roomId, req.user._id);
    res.json(session);
  } catch (error) {
    console.error('Join session error:', error);
    res.status(400).json({ message: error.message });
  }
};

export const leaveSession = wrapAsync(async (req, res) => {
  const result = await sessionService.leaveSessionService(req.params.id, req.user._id);
  res.json(result);
});

export const updateSession = wrapAsync(async (req, res) => {
  const { status } = req.body;
  const session = await sessionService.updateSessionStatusService(req.params.id, status, req.user._id);
  res.json(session);
});

export const getSessionParticipants = wrapAsync(async (req, res) => {
  const result = await sessionService.getSessionParticipantsService(req.params.id, req.user._id);
  res.json(result);
});

export const updateParticipantRole = wrapAsync(async (req, res) => {
  const { participantId, role } = req.body;
  const result = await sessionService.updateParticipantRoleService(req.params.id, participantId, role, req.user._id);
  res.json(result);
});

export const removeParticipant = wrapAsync(async (req, res) => {
  const { participantId } = req.body;
  const result = await sessionService.removeParticipantService(req.params.id, participantId, req.user._id);
  res.json(result);
});

export const deleteSession = wrapAsync(async (req, res) => {
  const result = await sessionService.deleteSessionService(req.params.id, req.user._id);
  res.json(result);
});


export const getSessionByRoomId = async (req, res) => {
  try {
    const session = await sessionService.getSessionByRoomIdService(req.params.roomId);
    res.json(session);
  } catch (error) {
    console.error('Get session error:', error);
    res.status(404).json({ message: error.message });
  }
};

