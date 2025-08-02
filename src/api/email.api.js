import api from '../utils/axios.js';

// Send single room invitation
export const sendRoomInvitation = async (invitationData) => {
  try {
    const response = await api.post('/api/email/send-invitation', invitationData);
    return response.data;
  } catch (error) {
    console.error('Failed to send room invitation:', error);
    throw error;
  }
};

// Send bulk room invitations
export const sendBulkInvitations = async (bulkInvitationData) => {
  try {
    const response = await api.post('/api/email/send-bulk-invitations', bulkInvitationData);
    return response.data;
  } catch (error) {
    console.error('Failed to send bulk invitations:', error);
    throw error;
  }
};

// Test email service
export const testEmailService = async () => {
  try {
    const response = await api.get('/api/email/test');
    return response.data;
  } catch (error) {
    console.error('Failed to test email service:', error);
    throw error;
  }
};
