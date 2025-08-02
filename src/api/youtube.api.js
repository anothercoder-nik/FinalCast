import api from '../utils/axios.js';

/**
 * Start YouTube RTMP streaming
 * @param {Object} streamConfig - Stream configuration
 * @param {string} streamConfig.sessionId - Session ID
 * @param {string} streamConfig.rtmpUrl - YouTube RTMP URL
 * @param {string} streamConfig.streamKey - YouTube stream key
 * @param {string} streamConfig.title - Stream title (optional)
 */
export const startYouTubeStream = async (streamConfig) => {
  try {
    const response = await api.post('/api/youtube/start-stream', {
      sessionId: streamConfig.sessionId,
      rtmpUrl: streamConfig.rtmpUrl,
      streamKey: streamConfig.streamKey,
      title: streamConfig.title,
      hasVideoCapture: streamConfig.hasVideoCapture,
      videoConfig: {
        width: 1280,
        height: 720,
        framerate: 30,
        videoBitrate: '2500k',
        audioBitrate: '128k'
      }
    });

    return response.data;
  } catch (error) {
    console.error('❌ Start YouTube stream API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to start YouTube stream');
  }
};

/**
 * Stop YouTube RTMP streaming
 * @param {string} sessionId - Session ID
 */
export const stopYouTubeStream = async (sessionId) => {
  try {
    const response = await api.post('/api/youtube/stop-stream', {
      sessionId
    });

    return response.data;
  } catch (error) {
    console.error('❌ Stop YouTube stream API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to stop YouTube stream');
  }
};

/**
 * Get YouTube stream status
 * @param {string} sessionId - Session ID
 */
export const getYouTubeStreamStatus = async (sessionId) => {
  try {
    const response = await api.get(`/api/youtube/stream-status/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get YouTube stream status API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get stream status');
  }
};

/**
 * Get all active YouTube streams
 */
export const getActiveYouTubeStreams = async () => {
  try {
    const response = await api.get('/api/youtube/active-streams');
    return response.data;
  } catch (error) {
    console.error('❌ Get active streams API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get active streams');
  }
};
