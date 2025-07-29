# WebRTC Testing Guide

This document explains how to test and validate the WebRTC functionality in the application.

## Overview

The WebRTC implementation includes:
- ✅ Socket connection management with session lifecycle
- ✅ WebRTC peer-to-peer connections with proper signaling
- ✅ Audio and video streaming
- ✅ Screen sharing functionality
- ✅ Audio level visualization
- ✅ Connection quality monitoring
- ✅ Automatic cleanup on session end

## Testing Tools

### 1. WebRTC Test Panel (Development)

Access the comprehensive test panel at `/webrtc-test` (development mode only).

**Features:**
- Media access testing (camera/microphone)
- Socket connection validation
- WebRTC peer connection testing
- Audio/video stream validation
- Screen sharing capability check
- Audio level monitoring test
- Connection quality assessment

**Usage:**
1. Navigate to `/webrtc-test` in development mode
2. Click "Run All Tests"
3. Allow browser permissions when prompted
4. Review test results and debug information

### 2. Manual Testing in Session

**Host Testing:**
1. Create a session and start it
2. Verify camera/microphone access
3. Test screen sharing functionality
4. Check audio visualizer is working
5. Monitor connection states in browser console

**Participant Testing:**
1. Join an active session
2. Verify WebRTC connection establishment
3. Test audio/video streaming
4. Verify screen share reception
5. Check connection quality indicators

## Key Features Implemented

### 1. Connection Management
- WebRTC connections only start when host starts session
- Automatic cleanup when session ends or users leave
- Proper socket-to-user ID mapping for signaling

### 2. Screen Sharing
- Fixed screen share display in video grid
- Proper track replacement in peer connections
- Automatic fallback to camera when screen share ends

### 3. Audio Visualization
- Real-time audio level monitoring
- Visual indicators in video grid
- Proper AudioContext management

### 4. Connection Monitoring
- Real-time connection quality assessment
- Automatic reconnection attempts
- Connection state tracking and reporting

### 5. Error Handling
- Comprehensive error recovery
- User-friendly error messages
- Graceful degradation when features unavailable

## Browser Console Logs

Monitor these log patterns for debugging:

**Successful Connection:**
```
🚀 Initializing WebRTC...
✅ WebRTC initialized successfully
🤝 Connecting to user: [userId]
📤 Offer sent to [userId]
✅ Successfully connected to [userId]
```

**Screen Sharing:**
```
🖥️ Starting screen share...
🖥️ Replacing video tracks in peer connections...
✅ Screen share started successfully
```

**Audio Monitoring:**
```
🎤 Audio level monitoring started
📊 Audio level: [level]%
```

## Troubleshooting

### Common Issues

1. **Media Access Denied**
   - Ensure browser permissions are granted
   - Check if camera/microphone are available
   - Try refreshing the page

2. **WebRTC Connection Failed**
   - Check network connectivity
   - Verify STUN servers are accessible
   - Check browser console for ICE connection errors

3. **Screen Share Not Working**
   - Ensure browser supports getDisplayMedia API
   - Check if user granted screen share permission
   - Verify screen share tracks are being replaced properly

4. **Audio Visualizer Not Showing**
   - Check if AudioContext is supported
   - Verify microphone permissions
   - Ensure audio tracks are enabled

### Debug Steps

1. Open browser developer tools
2. Check console for WebRTC-related logs
3. Monitor Network tab for socket connections
4. Use WebRTC internals (chrome://webrtc-internals/)
5. Run the automated test suite

## Performance Considerations

- Connection quality monitoring runs every 5 seconds
- Audio level monitoring uses requestAnimationFrame
- Automatic cleanup prevents memory leaks
- Efficient track replacement for screen sharing

## Browser Compatibility

**Supported Browsers:**
- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

**Required APIs:**
- WebRTC (RTCPeerConnection)
- getUserMedia
- getDisplayMedia (for screen sharing)
- AudioContext (for audio visualization)
- Socket.IO client

## Security Notes

- All WebRTC connections are peer-to-peer
- STUN servers are used for NAT traversal
- No media data passes through the server
- Socket connections use secure WebSocket when available

## Future Enhancements

- [ ] TURN server support for restrictive networks
- [ ] Recording functionality
- [ ] Bandwidth adaptation
- [ ] Advanced audio processing
- [ ] Video quality controls
