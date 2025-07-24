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

// Get one session by its ID
export const getSessionById = async (sessionId) => {
  const response = await api.get(`/api/sessions/${sessionId}`);
  return response.data;
};

// Join a session by ID
export const joinSession = async (sessionId) => {
  const response = await api.post(`/api/sessions/${sessionId}/join`);
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

// Update participant role (host only)
export const updateParticipantRole = async (sessionId, participantId, role) => {
  const response = await api.patch(`/api/sessions/${sessionId}/participants/role`, {
    participantId,
    role
  });
  return response.data;
};

// Remove participant (host only)
export const removeParticipant = async (sessionId, participantId) => {
  const response = await api.delete(`/api/sessions/${sessionId}/participants/remove`, {
    data: { participantId }
  });
  return response.data;
};
