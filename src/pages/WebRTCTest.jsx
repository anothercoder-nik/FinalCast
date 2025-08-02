import React from 'react';
import WebRTCTestPanel from '../components/debug/WebRTCTestPanel';

const WebRTCTest = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            WebRTC Connection Testing
          </h1>
          <p className="text-gray-600">
            Test and validate all WebRTC features for real-time communication
          </p>
        </div>
        
        <WebRTCTestPanel />
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This page is available in development mode for testing WebRTC functionality.</p>
          <p>Access it at: <code>/webrtc-test</code></p>
        </div>
      </div>
    </div>
  );
};

export default WebRTCTest;
