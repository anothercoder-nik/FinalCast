// src/api/session.api.js

import api from '../utils/api';

// Create a new session
export const createSession = async (sessionData) => {
  const response = await api.post('/sessions/create', sessionData);
  return response.data;
};

// Get all sessions for the logged-in user (host or participant)
export const getSessions = async () => {
  const response = await api.get('/sessions');
  return response.data;
};

// Get one session by its ID
export const getSessionById = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}`);
  return response.data;
};

// Join a session by ID
export const joinSession = async (sessionId) => {
  const response = await api.post(`/sessions/${sessionId}/join`);
  return response.data;
};

// Leave a session by ID
export const leaveSession = async (sessionId) => {
  const response = await api.post(`/sessions/${sessionId}/leave`);
  return response.data;
};

// Update a session status (host only)
export const updateSessionStatus = async (sessionId, status) => {
  const response = await api.patch(`/sessions/${sessionId}/status`, { status });
  return response.data;
};
