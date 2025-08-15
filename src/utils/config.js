/**
 * Centralized configuration utility for FinalCast frontend
 * Handles environment-specific URLs and settings
 */

/**
 * Get the API base URL for HTTP requests and Socket.IO connections
 * @returns {string} The API base URL
 */
export const getApiUrl = () => {
  // Production API URL from environment variable
  if (import.meta.env.VITE_API_URL) {
    console.log('🔧 Using VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }

  // Development fallback
  if (!import.meta.env.PROD) {
    console.log('🔧 Using development fallback: http://localhost:3000');
    return 'http://localhost:3000';
  }

  // Production fallback - this should NOT be reached if VITE_API_URL is properly set
  console.warn('⚠️ VITE_API_URL not set in production! Using fallback logic.');
  console.warn('⚠️ Please set VITE_API_URL=https://api.finalcast.tech in your deployment environment');

  const protocol = window.location.protocol;
  const hostname = window.location.hostname;

  // For your specific deployment, if frontend is on finalcast.tech and backend is on api.finalcast.tech
  if (hostname.includes('finalcast.tech') && !hostname.startsWith('api.')) {
    return `${protocol}//api.finalcast.tech`;
  }

  // Generic fallback for other domains
  if (!hostname.startsWith('api.')) {
    return `${protocol}//api.${hostname}`;
  }

  // Last resort fallback
  return `${protocol}//${hostname}:3000`;
};

/**
 * Get YouTube RTMP URL for live streaming
 * @returns {string} The YouTube RTMP URL
 */
export const getYouTubeRtmpUrl = () => {
  return import.meta.env.VITE_YOUTUBE_RTMP_URL || 'rtmp://a.rtmp.youtube.com/live2/';
};

/**
 * Get WebRTC STUN server configuration
 * @returns {string} The STUN server URL
 */
export const getStunServer = () => {
  return import.meta.env.VITE_STUN_SERVER || 'stun:stun.l.google.com:19302';
};

/**
 * Get WebRTC TURN server configuration
 * @returns {Object|null} TURN server configuration or null if not configured
 */
export const getTurnServer = () => {
  const turnServer = import.meta.env.VITE_TURN_SERVER;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;
  
  if (turnServer && turnUsername && turnCredential) {
    return {
      urls: turnServer,
      username: turnUsername,
      credential: turnCredential
    };
  }
  
  return null;
};

/**
 * Get complete ICE servers configuration for WebRTC
 * @returns {Array} Array of ICE server configurations
 */
export const getIceServers = () => {
  const iceServers = [
    { urls: getStunServer() }
  ];
  
  const turnConfig = getTurnServer();
  if (turnConfig) {
    iceServers.push(turnConfig);
  }
  
  return iceServers;
};

/**
 * Check if the app is running in production mode
 * @returns {boolean} True if in production
 */
export const isProduction = () => {
  return import.meta.env.PROD;
};

/**
 * Check if the app is running in development mode
 * @returns {boolean} True if in development
 */
export const isDevelopment = () => {
  return import.meta.env.DEV;
};

/**
 * Get environment-specific configuration
 * @returns {Object} Configuration object
 */
export const getConfig = () => {
  return {
    apiUrl: getApiUrl(),
    youtubeRtmpUrl: getYouTubeRtmpUrl(),
    stunServer: getStunServer(),
    turnServer: getTurnServer(),
    iceServers: getIceServers(),
    isProduction: isProduction(),
    isDevelopment: isDevelopment()
  };
};

export default {
  getApiUrl,
  getYouTubeRtmpUrl,
  getStunServer,
  getTurnServer,
  getIceServers,
  isProduction,
  isDevelopment,
  getConfig
};
