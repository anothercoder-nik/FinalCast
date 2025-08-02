import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  Wifi,
  Mic,
  Video,
  Monitor,
  BarChart3,
  Activity
} from 'lucide-react';
import WebRTCTester from '../../utils/webRTCTester';

const WebRTCTestPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [currentTest, setCurrentTest] = useState('');

  const testIcons = {
    mediaAccess: Video,
    socketConnection: Wifi,
    webRTCConnection: Activity,
    audioStream: Mic,
    videoStream: Video,
    screenShare: Monitor,
    audioLevels: BarChart3,
    connectionQuality: Activity
  };

  const testNames = {
    mediaAccess: 'Media Access',
    socketConnection: 'Socket Connection',
    webRTCConnection: 'WebRTC Connection',
    audioStream: 'Audio Stream',
    videoStream: 'Video Stream',
    screenShare: 'Screen Share',
    audioLevels: 'Audio Levels',
    connectionQuality: 'Connection Quality'
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults(null);
    setCurrentTest('Initializing...');

    try {
      const tester = new WebRTCTester();
      
      // Mock progress updates
      const testOrder = [
        'mediaAccess',
        'socketConnection', 
        'webRTCConnection',
        'audioStream',
        'videoStream',
        'screenShare',
        'audioLevels',
        'connectionQuality'
      ];

      for (const test of testOrder) {
        setCurrentTest(`Running ${testNames[test]}...`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Visual delay
      }

      const results = await tester.runAllTests();
      setTestResults(results);
      setCurrentTest('Tests completed');
      
    } catch (error) {
      console.error('Test execution failed:', error);
      setCurrentTest('Tests failed');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (result) => {
    if (!result) return Clock;
    return result.passed ? CheckCircle : XCircle;
  };

  const getStatusColor = (result) => {
    if (!result) return 'text-gray-400';
    return result.passed ? 'text-green-500' : 'text-red-500';
  };

  const getStatusBadge = (result) => {
    if (!result) return <Badge variant="secondary">Pending</Badge>;
    return result.passed ? 
      <Badge className="bg-green-100 text-green-800">Pass</Badge> : 
      <Badge className="bg-red-100 text-red-800">Fail</Badge>;
  };

  const getOverallStatus = () => {
    if (!testResults) return null;
    
    const totalTests = Object.keys(testResults).length;
    const passedTests = Object.values(testResults).filter(r => r.passed).length;
    
    return {
      total: totalTests,
      passed: passedTests,
      percentage: Math.round((passedTests / totalTests) * 100)
    };
  };

  const overallStatus = getOverallStatus();

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          WebRTC Connection Tester
        </CardTitle>
        <p className="text-sm text-gray-600">
          Comprehensive testing of WebRTC features including audio, video, and screen sharing
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Test Controls */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run All Tests
              </>
            )}
          </Button>
          
          {isRunning && (
            <div className="text-sm text-gray-600">
              {currentTest}
            </div>
          )}
        </div>

        {/* Overall Status */}
        {overallStatus && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Overall Results</h3>
              <Badge 
                className={
                  overallStatus.percentage === 100 
                    ? "bg-green-100 text-green-800" 
                    : overallStatus.percentage >= 75 
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {overallStatus.passed}/{overallStatus.total} Passed ({overallStatus.percentage}%)
              </Badge>
            </div>
          </div>
        )}

        {/* Test Results */}
        <div className="grid gap-4">
          {Object.entries(testNames).map(([testKey, testName]) => {
            const result = testResults?.[testKey];
            const IconComponent = testIcons[testKey];
            const StatusIcon = getStatusIcon(result);
            
            return (
              <div 
                key={testKey}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <IconComponent className="w-5 h-5 text-gray-500" />
                  <div>
                    <h4 className="font-medium">{testName}</h4>
                    {result && (
                      <p className="text-sm text-gray-600 mt-1">
                        {result.details}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <StatusIcon className={`w-5 h-5 ${getStatusColor(result)}`} />
                  {getStatusBadge(result)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Test Instructions */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Test Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Ensure you have a camera and microphone connected</li>
            <li>• Allow browser permissions for camera and microphone access</li>
            <li>• Screen share test requires user interaction (will show as available)</li>
            <li>• Tests will run automatically once started</li>
            <li>• Check browser console for detailed logs</li>
          </ul>
        </div>

        {/* Debug Information */}
        {process.env.NODE_ENV === 'development' && testResults && (
          <details className="p-4 bg-gray-50 rounded-lg">
            <summary className="cursor-pointer font-medium">Debug Information</summary>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
};

export default WebRTCTestPanel;
