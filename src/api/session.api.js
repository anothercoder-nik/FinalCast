// src/api/session.api.js

import api from '../utils/axios.js';

// Create a new session
export const createSession = async (sessionData) => {
  const response = await api.post('/api/sessions', sessionData);
  return response.data;
};

// Get all sessions for the logged-in user (host or participant)
export const getSessions = async () => {
  const response = await api.get('/api/sessions');
  return response.data;
};

// Get session by roomId
export const getSessionByRoomId = async (roomId) => {
  const response = await api.get(`/api/sessions/room/${roomId}`);
  return response.data;
};

// Get session by ID
export const getSessionById = async (sessionId) => {
  const response = await api.get(`/api/sessions/${sessionId}`);
  return response.data;
};

// Join a session by ID
export const joinSession =
 async (sessionId) => {
  const response = await api.post(`/api/sessions/${sessionId}/join`);
  return response.data;
};

// Join a session by roomId
export const joinSessionByRoomId = async (roomId) => {
  const response = await api.post(`/api/sessions/room/${roomId}/join`);
  return response.data;
};

// Leave a session by ID
export const leaveSession = async (sessionId) => {
  const response = await api.post(`/api/sessions/${sessionId}/leave`);
  return response.data;
};

// Update a session status (host only)
export const updateSessionStatus = async (sessionId, status) => {
  const response = await api.patch(`/api/sessions/${sessionId}/status`, { status });
  return response.data;
};

// Get session participants
export const getSessionParticipants = async (sessionId) => {
  const response = await api.get(`/api/sessions/${sessionId}/participants`);
  return response.data;
};

// Delete session
export const deleteSession = async (sessionId) => {
  const response = await api.delete(`/api/sessions/${sessionId}`);
  return response.data;
};

// Get all recordings for a session (host and participants can access)
export const getSessionRecordings = async (sessionId) => {
  const response = await api.get(`/api/session-recordings/${sessionId}`);
  return response.data;
};

// Get recordings for a specific participant
export const getParticipantRecordings = async (participantId) => {
  const response = await api.get(`/api/recordings/${participantId}`);
  return response.data;
};

// Generate download URL for a recording
export const generateDownloadUrl = async (recordingId) => {
  const response = await api.get(`/api/download/${recordingId}`);
  return response.data;
};
