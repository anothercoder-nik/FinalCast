class MediaManager {
  constructor() {
    this.localStream = null;
    this.screenStream = null;

    // Detect mobile device
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    // Mobile-optimized constraints
    this.mobileConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000 // Lower sample rate for mobile
      },
      video: {
        width: { min: 320, ideal: 640, max: 1280 },
        height: { min: 240, ideal: 480, max: 720 },
        frameRate: { min: 10, ideal: 15, max: 30 }, // Lower fps for mobile
        facingMode: 'user',
        aspectRatio: { ideal: 16/9 }
      }
    };

    // Primary constraints - high quality for desktop
    this.constraints = this.isMobile ? this.mobileConstraints : {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      },
      video: {
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
        frameRate: { min: 15, ideal: 30, max: 60 },
        facingMode: 'user',
        aspectRatio: { ideal: 16/9 }
      }
    };

    // Fallback constraints - basic quality
    this.fallbackConstraints = {
      audio: true,
      video: this.isMobile ? {
        width: { ideal: 320 },
        height: { ideal: 240 },
        frameRate: { ideal: 10 }
      } : {
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 15 }
      }
    };

    // Minimal constraints - last resort
    this.minimalConstraints = {
      audio: true,
      video: true
    };

    console.log(`📱 Device detected: ${this.isMobile ? 'Mobile' : 'Desktop'} ${this.isIOS ? '(iOS)' : ''}`);
  }

  async requestMediaPermissions() {
    try {
      console.log('🎤 Requesting media permissions...');

      // Check if permissions are already granted
      const permissions = await this.checkPermissions();
      if (permissions.audio && permissions.video) {
        console.log('✅ Permissions already granted');
        return { granted: true, audio: true, video: true };
      }

      // Request permissions by trying to get user media with minimal constraints
      console.log('📋 Requesting user permission for camera and microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      
      // Stop the test stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      console.log('✅ Media permissions granted');
      return { granted: true, audio: true, video: true };
      
    } catch (error) {
      console.error('❌ Media permissions denied:', error);
      return {
        granted: false,
        audio: false,
        video: false,
        error: this.handleMediaError(error)
      };
    }
  }

  async checkPermissions() {
    try {
      if (!navigator.permissions) {
        return { audio: false, video: false };
      }

      const [audioPermission, videoPermission] = await Promise.all([
        navigator.permissions.query({ name: 'microphone' }),
        navigator.permissions.query({ name: 'camera' })
      ]);

      return {
        audio: audioPermission.state === 'granted',
        video: videoPermission.state === 'granted'
      };
    } catch (error) {
      console.warn('Permissions API not supported:', error);
      return { audio: false, video: false };
    }
  }

  async getLocalStream(constraints = this.constraints) {
    const constraintLevels = [
      { name: 'primary', constraints: constraints },
      { name: 'fallback', constraints: this.fallbackConstraints },
      { name: 'minimal', constraints: this.minimalConstraints }
    ];

    for (const level of constraintLevels) {
      try {
        console.log(`📹 Trying ${level.name} constraints...`, level.constraints);

        this.localStream = await navigator.mediaDevices.getUserMedia(level.constraints);

        console.log(`✅ Local stream acquired with ${level.name} quality`, {
          audio: this.localStream.getAudioTracks().length > 0,
          video: this.localStream.getVideoTracks().length > 0,
          audioTrack: this.localStream.getAudioTracks()[0]?.label,
          videoTrack: this.localStream.getVideoTracks()[0]?.label
        });

        return this.localStream;

      } catch (error) {
        console.warn(`⚠️ ${level.name} constraints failed:`, error.message);

        // If this is the last attempt, throw the error
        if (level === constraintLevels[constraintLevels.length - 1]) {
          console.error('❌ All constraint levels failed');
          throw this.handleMediaError(error);
        }

        // Continue to next constraint level
        continue;
      }
    }
  }

  async getScreenShare() {
    try {
      console.log('🖥️ Starting screen share...');
      
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
          width: { max: 1920 },
          height: { max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      
      console.log('✅ Screen share started');
      
      // Handle screen share end event
      this.screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('🛑 Screen share ended by user');
        this.screenStream = null;
      });
      
      return this.screenStream;
    } catch (error) {
      console.error('❌ Screen share failed:', error);
      throw this.handleMediaError(error);
    }
  }

  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
      console.log(`🔊 Audio ${enabled ? 'enabled' : 'disabled'}`);
      return true;
    }
    return false;
  }

  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
      console.log(`📹 Video ${enabled ? 'enabled' : 'disabled'}`);
      return true;
    }
    return false;
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
      console.log('🛑 Local stream stopped');
    }
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => {
        track.stop();
      });
      this.screenStream = null;
      console.log('🛑 Screen share stopped');
    }
  }

  replaceVideoTrack(newStream) {
    const videoTrack = newStream.getVideoTracks()[0];
    if (this.localStream && videoTrack) {
      const audioTracks = this.localStream.getAudioTracks();
      
      // Create new stream with new video track and existing audio
      this.localStream = new MediaStream([
        ...audioTracks,
        videoTrack
      ]);
      
      return this.localStream;
    }
    return null;
  }

  cleanup() {
    console.log('🧹 Cleaning up media manager');
    this.stopLocalStream();
    this.stopScreenShare();
  }

  handleMediaError(error) {
    const errorMessages = {
      'NotAllowedError': 'Camera/microphone access denied. Please allow permissions and refresh.',
      'NotFoundError': 'No camera/microphone found. Please connect a device.',
      'NotReadableError': 'Camera/microphone is already in use by another application.',
      'OverconstrainedError': 'Camera/microphone doesn\'t meet the required constraints.',
      'SecurityError': 'Media access blocked due to security restrictions.',
      'AbortError': 'Media access was aborted.',
      'TypeError': 'Invalid media constraints provided.'
    };

    return {
      name: error.name,
      message: errorMessages[error.name] || `Media error: ${error.message}`,
      originalError: error
    };
  }

  async getAvailableDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      return {
        cameras: devices.filter(device => device.kind === 'videoinput'),
        microphones: devices.filter(device => device.kind === 'audioinput'),
        speakers: devices.filter(device => device.kind === 'audiooutput')
      };
    } catch (error) {
      console.error('Failed to get devices:', error);
      return { cameras: [], microphones: [], speakers: [] };
    }
  }
}

export default new MediaManager();
