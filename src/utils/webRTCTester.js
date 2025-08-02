/**
 * WebRTC Connection Tester
 * Comprehensive testing utility for WebRTC features
 */

import { getApiUrl, getIceServers } from './config.js';

class WebRTCTester {
  constructor() {
    this.testResults = {
      mediaAccess: { passed: false, details: null },
      socketConnection: { passed: false, details: null },
      webRTCConnection: { passed: false, details: null },
      audioStream: { passed: false, details: null },
      videoStream: { passed: false, details: null },
      screenShare: { passed: false, details: null },
      audioLevels: { passed: false, details: null },
      connectionQuality: { passed: false, details: null }
    };
    this.testSocket = null;
    this.testPeerConnection = null;
  }

  async runAllTests() {
    console.log('🧪 Starting comprehensive WebRTC tests...');
    
    try {
      await this.testMediaAccess();
      await this.testSocketConnection();
      await this.testWebRTCConnection();
      await this.testAudioStream();
      await this.testVideoStream();
      await this.testScreenShare();
      await this.testAudioLevels();
      await this.testConnectionQuality();
      
      this.generateReport();
      return this.testResults;
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async testMediaAccess() {
    console.log('🎥 Testing media access...');
    
    try {
      // Test camera access
      const videoStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      if (videoStream && videoStream.getVideoTracks().length > 0) {
        console.log('✅ Camera access successful');
        videoStream.getTracks().forEach(track => track.stop());
      }
      
      // Test microphone access
      const audioStream = await navigator.mediaDevices.getUserMedia({ 
        video: false, 
        audio: true 
      });
      
      if (audioStream && audioStream.getAudioTracks().length > 0) {
        console.log('✅ Microphone access successful');
        audioStream.getTracks().forEach(track => track.stop());
      }
      
      // Test combined access
      const combinedStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (combinedStream && 
          combinedStream.getVideoTracks().length > 0 && 
          combinedStream.getAudioTracks().length > 0) {
        console.log('✅ Combined media access successful');
        combinedStream.getTracks().forEach(track => track.stop());
      }
      
      this.testResults.mediaAccess = {
        passed: true,
        details: 'All media devices accessible'
      };
      
    } catch (error) {
      console.error('❌ Media access failed:', error);
      this.testResults.mediaAccess = {
        passed: false,
        details: error.message
      };
    }
  }

  async testSocketConnection() {
    console.log('🔌 Testing socket connection...');
    
    try {
      const { io } = await import('socket.io-client');
      
      this.testSocket = io(getApiUrl(), {
        transports: ['websocket'],
        timeout: 5000
      });
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket connection timeout'));
        }, 5000);
        
        this.testSocket.on('connect', () => {
          clearTimeout(timeout);
          console.log('✅ Socket connection successful');
          resolve();
        });
        
        this.testSocket.on('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
      
      this.testResults.socketConnection = {
        passed: true,
        details: 'Socket connection established'
      };
      
    } catch (error) {
      console.error('❌ Socket connection failed:', error);
      this.testResults.socketConnection = {
        passed: false,
        details: error.message
      };
    }
  }

  async testWebRTCConnection() {
    console.log('🤝 Testing WebRTC peer connection...');
    
    try {
      this.testPeerConnection = new RTCPeerConnection({
        iceServers: getIceServers()
      });
      
      // Test ICE gathering
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('ICE gathering timeout'));
        }, 10000);
        
        this.testPeerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('🧊 ICE candidate gathered:', event.candidate.type);
          } else {
            clearTimeout(timeout);
            console.log('✅ ICE gathering complete');
            resolve();
          }
        };
        
        // Create a dummy offer to start ICE gathering
        this.testPeerConnection.createOffer().then(offer => {
          return this.testPeerConnection.setLocalDescription(offer);
        });
      });
      
      this.testResults.webRTCConnection = {
        passed: true,
        details: 'WebRTC peer connection and ICE gathering successful'
      };
      
    } catch (error) {
      console.error('❌ WebRTC connection failed:', error);
      this.testResults.webRTCConnection = {
        passed: false,
        details: error.message
      };
    }
  }

  async testAudioStream() {
    console.log('🎤 Testing audio stream...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack = stream.getAudioTracks()[0];
      
      if (audioTrack && audioTrack.readyState === 'live') {
        console.log('✅ Audio stream active');
        
        // Test audio track properties
        const settings = audioTrack.getSettings();
        console.log('🎤 Audio settings:', settings);
        
        stream.getTracks().forEach(track => track.stop());
        
        this.testResults.audioStream = {
          passed: true,
          details: `Audio stream active with settings: ${JSON.stringify(settings)}`
        };
      } else {
        throw new Error('Audio track not live');
      }
      
    } catch (error) {
      console.error('❌ Audio stream failed:', error);
      this.testResults.audioStream = {
        passed: false,
        details: error.message
      };
    }
  }

  async testVideoStream() {
    console.log('📹 Testing video stream...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = stream.getVideoTracks()[0];
      
      if (videoTrack && videoTrack.readyState === 'live') {
        console.log('✅ Video stream active');
        
        // Test video track properties
        const settings = videoTrack.getSettings();
        console.log('📹 Video settings:', settings);
        
        stream.getTracks().forEach(track => track.stop());
        
        this.testResults.videoStream = {
          passed: true,
          details: `Video stream active with settings: ${JSON.stringify(settings)}`
        };
      } else {
        throw new Error('Video track not live');
      }
      
    } catch (error) {
      console.error('❌ Video stream failed:', error);
      this.testResults.videoStream = {
        passed: false,
        details: error.message
      };
    }
  }

  async testScreenShare() {
    console.log('🖥️ Testing screen share...');
    
    try {
      if (!navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen sharing not supported');
      }
      
      // Note: This will prompt user for screen share permission
      // In a real test environment, this might need to be mocked
      console.log('⚠️ Screen share test requires user interaction');
      
      this.testResults.screenShare = {
        passed: true,
        details: 'Screen share API available (requires user interaction to test fully)'
      };
      
    } catch (error) {
      console.error('❌ Screen share failed:', error);
      this.testResults.screenShare = {
        passed: false,
        details: error.message
      };
    }
  }

  async testAudioLevels() {
    console.log('📊 Testing audio level monitoring...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        throw new Error('AudioContext not supported');
      }
      
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      
      console.log('✅ Audio level monitoring working');
      
      // Cleanup
      audioContext.close();
      stream.getTracks().forEach(track => track.stop());
      
      this.testResults.audioLevels = {
        passed: true,
        details: 'Audio level monitoring functional'
      };
      
    } catch (error) {
      console.error('❌ Audio levels failed:', error);
      this.testResults.audioLevels = {
        passed: false,
        details: error.message
      };
    }
  }

  async testConnectionQuality() {
    console.log('📈 Testing connection quality monitoring...');
    
    try {
      if (this.testPeerConnection) {
        const stats = await this.testPeerConnection.getStats();
        
        if (stats && stats.size > 0) {
          console.log('✅ Connection stats available');
          
          this.testResults.connectionQuality = {
            passed: true,
            details: `Stats available with ${stats.size} reports`
          };
        } else {
          throw new Error('No stats available');
        }
      } else {
        throw new Error('No peer connection available for testing');
      }
      
    } catch (error) {
      console.error('❌ Connection quality failed:', error);
      this.testResults.connectionQuality = {
        passed: false,
        details: error.message
      };
    }
  }

  generateReport() {
    console.log('\n📋 WebRTC Test Report:');
    console.log('========================');
    
    let passedTests = 0;
    let totalTests = 0;
    
    for (const [testName, result] of Object.entries(this.testResults)) {
      totalTests++;
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${testName}: ${result.details}`);
      
      if (result.passed) passedTests++;
    }
    
    console.log('========================');
    console.log(`Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All WebRTC tests passed!');
    } else {
      console.log('⚠️ Some tests failed. Check the details above.');
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up test resources...');
    
    if (this.testSocket) {
      this.testSocket.disconnect();
      this.testSocket = null;
    }
    
    if (this.testPeerConnection) {
      this.testPeerConnection.close();
      this.testPeerConnection = null;
    }
    
    console.log('✅ Cleanup complete');
  }
}

export default WebRTCTester;
