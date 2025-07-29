import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useSocket } from '../../context/SocketContext';
import { 
  getSessionByRoomId, 
  joinSessionByRoomId, 
  leaveSession, 
  getSessionParticipants,
  updateSessionStatus 
} from '../../api/session.api';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Volume2,
  Monitor, 
  MonitorOff,
  Square,
  Play,
  Pause,
  Phone,
  PhoneOff,
  Maximize,
  Minimize,
  Settings,
  MoreHorizontal,
  RadioIcon, 
  Users,
  MessageCircle,
  Send, 
  Clock,
  VolumeX,
  UserPlus,
  Wifi,
  WifiOff,
  MoreVertical,
  Download,
  Upload
} from 'lucide-react';
import { toast } from "sonner";

// UI Components
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useWebRTC } from '../../hooks/useWebRTC';
import VideoGrid from './VideoGrid';
import MediaPermissionDialog from '../ui/MediaPermissionDialog';



// TopBar Component
const TopBar = ({ isLive, sessionTime, onToggleLive, session, participantCount, connectionStatus }) => {
  return (
    <div className="bg-stone-900 border-b border-stone-700 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white">{session?.title || 'Studio Session'}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-stone-400 text-sm">
              <Users className="w-4 h-4" />
              <span>{participantCount}</span>
            </div>
            <div className="flex items-center gap-2 text-stone-400 text-sm">
              {connectionStatus ? (
                <>
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-400" />
                  <span className="text-red-400">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-stone-300">
            {sessionTime}
          </div>
          
          <Button
            onClick={onToggleLive}
            variant={isLive ? "destructive" : "default"}
            className={`${
              isLive 
                ? "bg-red-600 hover:bg-red-700 animate-pulse" 
                : "bg-red-600 hover:bg-red-700"
            } font-medium`}
          >
            <RadioIcon className="w-4 h-4 mr-2" />
            {isLive ? "LIVE" : "Go Live"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ControlBar Component with improved hover effects
const ControlBar = ({ 
  isFullScreen, 
  onToggleFullScreen,
  onLeaveSession,
  onStartSession,
  isHost,
  isJoined,
  onJoinSession,
  joinError,
  sessionStatus,
  isConnected,
  // WebRTC props
  isMuted,
  isVideoOff,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  mediaError
}) => {
  return (
    <div className="bg-stone-900 border-t border-stone-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Microphone control */}
          <Button
            onClick={onToggleAudio}
            variant={isMuted ? "destructive" : "default"}
            size="sm"
            className={`${isMuted ? "bg-red-600 hover:bg-red-700" : "bg-stone-700 hover:bg-stone-600"} transition-all duration-200 hover:scale-105`}
            disabled={!isJoined}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>

          {/* Video control */}
          <Button
            onClick={onToggleVideo}
            variant={isVideoOff ? "destructive" : "default"}
            size="sm"
            className={`${isVideoOff ? "bg-red-600 hover:bg-red-700" : "bg-stone-700 hover:bg-stone-600"} transition-all duration-200 hover:scale-105`}
            disabled={!isJoined}
          >
            {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </Button>

          {/* Screen share control */}
          <Button
            onClick={onToggleScreenShare}
            variant={isScreenSharing ? "destructive" : "default"}
            size="sm"
            className={`${isScreenSharing ? "bg-blue-600 hover:bg-blue-700" : "bg-stone-700 hover:bg-stone-600"} transition-all duration-200 hover:scale-105`}
            disabled={!isJoined}
          >
            {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          </Button>

          {/* Media error indicator */}
          {mediaError && (
            <div className="text-red-400 text-sm">
              Media Error: {mediaError.message}
            </div>
          )}

          {/* Fullscreen toggle */}
          <Button
            onClick={onToggleFullScreen}
            variant="ghost"
            size="sm"
            className="text-stone-400 hover:text-white hover:bg-stone-700 transition-all duration-200 hover:scale-105"
          >
            {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Host Controls */}
          {isHost && sessionStatus === 'scheduled' && (
            <Button
              onClick={onStartSession}
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700 transition-all duration-200 hover:scale-105 hover:shadow-lg"
              disabled={!isConnected}
            >
              <Play className="w-4 h-4" />
              <span className="ml-2 text-sm">Start Session</span>
            </Button>
          )}

          {/* Debug button for testing */}
          {process.env.NODE_ENV === 'development' && (
            <Button
              onClick={() => {
                console.log('🔍 Debug Info:', getDebugInfo());
                console.log('📊 Local Stream:', localStream);
                console.log('📊 Remote Streams:', remoteStreams);
                console.log('📊 Online Participants:', onlineParticipants);
              }}
              variant="outline"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Debug
            </Button>
          )}

          {/* Join/Leave button with improved hover */}
          {isJoined ? (
            <Button
              onClick={onLeaveSession}
              variant="destructive"
              size="sm"
              className="bg-red-600 hover:bg-red-700 transition-all duration-200 hover:scale-105 hover:shadow-lg group relative"
            >
              <PhoneOff className="w-4 h-4 group-hover:animate-pulse" />
              <span className="ml-2 text-sm">{isHost ? 'End Session' : 'Leave'}</span>
              
              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                {isHost ? 'End session for everyone' : 'Leave this session'}
              </div>
            </Button>
          ) : sessionStatus === 'live' ? (
            <Button
              onClick={onJoinSession}
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-lg"
              disabled={!isConnected}
            >
              <Phone className="w-4 h-4" />
              <span className="ml-2 text-sm">Join Session</span>
            </Button>
          ) : (
            <div className="text-sm text-stone-400 px-4 py-2">
              Waiting for host to start...
            </div>
          )}
        </div>
      </div>
      
      {/* Error Message */}
      {joinError && (
        <div className="mt-2 p-2 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-sm text-center">
          {joinError}
        </div>
      )}
    </div>
  );
};

// ChatPanel Component
const ChatPanel = ({ messages, onSendMessage, currentUser, isJoined }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && isJoined) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className={`${message.type === 'system' ? 'text-center' : ''}`}>
            {message.type === 'system' ? (
              <div className="text-xs text-stone-500 bg-stone-800/50 rounded px-2 py-1 inline-block">
                {message.message}
              </div>
            ) : (
              <div className={`rounded-lg p-3 ${
                message.userId === currentUser?._id 
                  ? 'bg-blue-600/20 border border-blue-500/30 ml-4' 
                  : 'bg-stone-800/50'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-white text-sm">
                    {message.userName}
                    {message.userId === currentUser?._id && ' (You)'}
                  </span>
                  <span className="text-xs text-stone-500">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-stone-300 text-sm">{message.message}</p>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-stone-700">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isJoined ? "Type a message..." : "Join session to chat"}
            className="flex-1 bg-stone-800 border-stone-600 text-white"
            disabled={!isJoined}
          />
          <Button 
            type="submit" 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!newMessage.trim() || !isJoined}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

// ParticipantsPanel Component
const ParticipantsPanel = ({ onlineParticipants, session, currentUser }) => {
  const totalCount = onlineParticipants.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-stone-700">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-white">
            Online ({totalCount}/{session?.maxParticipants || 3})
          </h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {/* Online Participants (from socket) */}
          {onlineParticipants.map((participant) => (
            <div 
              key={participant.socketId} 
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                participant.isHost 
                  ? 'bg-blue-600/20 border border-blue-500/30' 
                  : 'bg-stone-800 hover:bg-stone-750'
              }`}
            >
              <Avatar className="w-10 h-10">
                <AvatarFallback className={`text-white ${
                  participant.isHost ? 'bg-blue-600' : 'bg-green-600'
                }`}>
                  {participant.userName?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">
                    {participant.userName} 
                    {participant.userId === currentUser?._id && ' (You)'}
                  </p>
                  <Badge variant="secondary" className={`text-xs ${
                    participant.isHost ? 'bg-blue-600' : 'bg-green-600'
                  }`}>
                    {participant.isHost ? 'Host' : 'Guest'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-stone-400">Online</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Mic className="w-4 h-4 text-green-400" />
                <Video className="w-4 h-4 text-green-400" />
              </div>
            </div>
          ))}

          {onlineParticipants.length === 0 && (
            <div className="text-center text-stone-500 py-8">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No participants online</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// SettingsPanel Component (Host Only)
const SettingsPanel = ({ settings, onUpdateSettings }) => {
  const updateSetting = (key, value) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-stone-700">
        <h3 className="font-medium text-white">Session Settings</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Recording Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-stone-200 flex items-center gap-2">
            <Square className="w-4 h-4 text-red-400" />
            Recording
          </h4>
          
          <div className="space-y-3 pl-6">
            <div className="flex items-center justify-between">
              <label htmlFor="allowRecording" className="text-sm text-stone-300">
                Allow Recording
              </label>
              <button
                onClick={() => updateSetting('allowRecording', !settings.allowRecording)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.allowRecording ? 'bg-blue-600' : 'bg-stone-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.allowRecording ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="h-px bg-stone-700" />

        {/* Audio Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-stone-200 flex items-center gap-2">
            <Mic className="w-4 h-4 text-green-400" />
            Audio
          </h4>
          
          <div className="space-y-3 pl-6">
            <div className="flex items-center justify-between">
              <label htmlFor="muteOnJoin" className="text-sm text-stone-300">
                Mute participants on join
              </label>
              <button
                onClick={() => updateSetting('muteOnJoin', !settings.muteOnJoin)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.muteOnJoin ? 'bg-blue-600' : 'bg-stone-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.muteOnJoin ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="h-px bg-stone-700" />

        {/* Video Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-stone-200 flex items-center gap-2">
            <Video className="w-4 h-4 text-blue-400" />
            Video
          </h4>
          
          <div className="space-y-3 pl-6">
            <div className="flex items-center justify-between">
              <label htmlFor="videoOnJoin" className="text-sm text-stone-300">
                Enable video on join
              </label>
              <button
                onClick={() => updateSetting('videoOnJoin', !settings.videoOnJoin)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.videoOnJoin ? 'bg-blue-600' : 'bg-stone-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.videoOnJoin ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="h-px bg-stone-700" />

        {/* Session Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-stone-200 flex items-center gap-2">
            <Settings className="w-4 h-4 text-orange-400" />
            Session
          </h4>
          
          <div className="space-y-3 pl-6">
            <div className="flex items-center justify-between">
              <label htmlFor="requireApproval" className="text-sm text-stone-300">
                Require approval to join
              </label>
              <button
                onClick={() => updateSetting('requireApproval', !settings.requireApproval)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.requireApproval ? 'bg-blue-600' : 'bg-stone-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.requireApproval ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sidebar Component
const Sidebar = ({ 
  onlineParticipants,
  messages, 
  settings, 
  onSendMessage, 
  onUpdateSettings,
  session,
  currentUser,
  isHost,
  isJoined
}) => {
  return (
    <div className="w-80 bg-stone-900 border-l border-stone-700 flex flex-col">
      <Tabs defaultValue="participants" className="flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-3 bg-stone-800 border-b border-stone-700 rounded-none">
          <TabsTrigger 
            value="participants" 
            className="data-[state=active]:bg-stone-700 data-[state=active]:text-white flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Members
          </TabsTrigger>
          <TabsTrigger 
            value="chat" 
            className="data-[state=active]:bg-stone-700 data-[state=active]:text-white flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Chat
          </TabsTrigger>
          {isHost && (
            <TabsTrigger 
              value="settings" 
              className="data-[state=active]:bg-stone-700 data-[state=active]:text-white flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="participants" className="flex-1 m-0">
          <ParticipantsPanel 
            onlineParticipants={onlineParticipants}
            session={session}
            currentUser={currentUser}
          />
        </TabsContent>

        <TabsContent value="chat" className="flex-1 m-0">
          <ChatPanel 
            messages={messages}
            onSendMessage={onSendMessage}
            currentUser={currentUser}
            isJoined={isJoined}
          />
        </TabsContent>

        {isHost && (
          <TabsContent value="settings" className="flex-1 m-0">
            <SettingsPanel 
              settings={settings}
              onUpdateSettings={onUpdateSettings}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

// Add a device check button and better error handling
const DeviceCheckButton = ({ onCheck, isChecking }) => (
  <Button
    onClick={onCheck}
    disabled={isChecking}
    className="bg-blue-600 hover:bg-blue-700"
    size="sm"
  >
    {isChecking ? 'Checking...' : 'Check Devices'}
  </Button>
);

// Main StudioRoomComplete Component
export const StudioRoomComplete = () => {
  const { roomId } = useParams({ from: '/studio/$roomId' });
  const navigate = useNavigate();
  const currentUser = useSelector(state => state?.auth?.user);
  
  // Socket context
  const {
    isConnected,
    startSession: socketStartSession,
    joinLiveSession: socketJoinSession,
    endSession: socketEndSession,
    leaveSession: socketLeaveSession,
    sendMessage: socketSendMessage,
    addEventListener,
    removeEventListener
  } = useSocket();
  
  // State declarations FIRST
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [onlineParticipants, setOnlineParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [settings, setSettings] = useState({
    allowChat: true,
    allowScreenShare: true,
    recordSession: false,
    maxParticipants: 10
  });
  const [sessionStatus, setSessionStatus] = useState('scheduled');
  const [sessionTime, setSessionTime] = useState('00:00:00');
  const [isHost, setIsHost] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isCheckingDevices, setIsCheckingDevices] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [permissionAction, setPermissionAction] = useState(null); // 'start' or 'join'

  // WebRTC integration - NOW isJoined is available
  const {
    isInitialized,
    isInitializing,
    localStream,
    localVideoRef,
    remoteStreams,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    mediaError,
    connectionStates,
    audioLevel,
    startLocalStream,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    connectToUser,
    cleanupWebRTC,
    getDebugInfo,
    initializeWebRTC
  } = useWebRTC(roomId, isJoined, currentUser);

  // Expose debug function to window for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.debugWebRTC = () => {
        const debugInfo = getDebugInfo();
        console.log('🔍 WebRTC Debug Info:', debugInfo);
        return debugInfo;
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.debugWebRTC;
      }
    };
  }, [getDebugInfo]);

  // Add device check function
  const checkDevices = async () => {
    setIsCheckingDevices(true);
    try {
      const devices = await webrtcManager.mediaManager.getAvailableDevices();
      console.log('Device check result:', devices);
      
      if (devices.cameras.length === 0 && devices.microphones.length === 0) {
        toast.error('No devices found', {
          description: 'Please connect a camera or microphone and try again'
        });
      } else {
        const deviceList = [];
        if (devices.cameras.length > 0) deviceList.push(`${devices.cameras.length} camera(s)`);
        if (devices.microphones.length > 0) deviceList.push(`${devices.microphones.length} microphone(s)`);
        
        toast.success('Devices found', {
          description: deviceList.join(', ')
        });
      }
    } catch (error) {
      console.error('Device check failed:', error);
      toast.error('Device check failed', {
        description: error.message
      });
    } finally {
      setIsCheckingDevices(false);
    }
  };

  // Auto-start media when user joins
  useEffect(() => {
    const initializeMedia = async () => {
      if (isJoined && isInitialized && !localStream) {
        try {
          console.log('🎥 Starting media for joined user...');
          await startLocalStream();
        } catch (error) {
          console.error('❌ Failed to start media:', error);
          setJoinError('Failed to access camera/microphone');
        }
      }
    };

    initializeMedia();
  }, [isJoined, isInitialized, localStream, startLocalStream]);

  // Request media permissions immediately when component mounts
  useEffect(() => {
    const requestMediaOnMount = async () => {
      if (isInitialized && !localStream && !mediaError) {
        try {
          console.log('🎥 Requesting media permissions on mount...');
          await startLocalStream();
        } catch (error) {
          console.error('❌ Failed to get media on mount:', error);
          // Don't set join error here, just log it
        }
      }
    };

    // Small delay to ensure WebRTC is initialized
    const timer = setTimeout(requestMediaOnMount, 1000);
    return () => clearTimeout(timer);
  }, [isInitialized, localStream, mediaError, startLocalStream]);

  // Handle WebRTC connections when users join
  useEffect(() => {
    if (!isConnected) return;

    const handleUserJoined = (data) => {
      console.log('👤 User joined for WebRTC:', data);
      
      // Add to online participants
      setOnlineParticipants(prev => {
        const exists = prev.some(p => p.userId === data.userId);
        if (!exists) {
          return [...prev, data];
        }
        return prev;
      });

      // Connect via WebRTC if we have local stream and it's not ourselves
      if (data.shouldConnect && currentUser && data.userId !== currentUser._id && localStream && isInitialized) {
        console.log(`🔗 Connecting to ${data.userName} via WebRTC`);
        connectToUser(data.userId);
      }

      // Add system message
      setMessages(prev => [...prev, {
        id: Date.now(),
        user: 'System',
        message: `${data.userName} joined the session`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'system'
      }]);
    };

    const handleCurrentParticipants = (participants) => {
      console.log('👥 Current participants for WebRTC:', participants);
      setOnlineParticipants(participants);
      
      // Connect to all existing participants via WebRTC hook
      if (isInitialized) {
        participants.forEach(participant => {
          if (currentUser && participant.userId !== currentUser._id) {
            console.log(`🔗 Connecting to existing participant: ${participant.userName} (${participant.userId})`);
            // The useWebRTC hook will handle this connection
          }
        });
      }
    };

    addEventListener('user-joined', handleUserJoined);
    addEventListener('current-participants', handleCurrentParticipants);

    return () => {
      removeEventListener('user-joined', handleUserJoined);
      removeEventListener('current-participants', handleCurrentParticipants);
    };
  }, [isConnected, currentUser?._id, localStream, isInitialized, connectToUser, addEventListener, removeEventListener]);

  // Event handlers for WebRTC controls
  const handleToggleAudio = () => {
    console.log('🔊 Toggling audio...');
    toggleAudio();
  };

  const handleToggleVideo = () => {
    console.log('📹 Toggling video...');
    toggleVideo();
  };

  const handleToggleScreenShare = () => {
    console.log('🖥️ Toggling screen share...');
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  // Socket event handlers
  useEffect(() => {
    if (!isConnected) return;

    const handleSessionStarted = (data) => {
      console.log('Session started:', data);
      setSessionStatus('live');
      setMessages(prev => [...prev, {
        id: Date.now(),
        user: 'System',
        message: `Session started by ${data.hostName}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'system'
      }]);
    };

    const handleSessionEnded = (data) => {
      console.log('Session ended:', data);
      setSessionStatus('ended');
      setOnlineParticipants([]);
      setMessages(prev => [...prev, {
        id: Date.now(),
        user: 'System',
        message: data.message || 'Session has ended',
        timestamp: new Date().toLocaleTimeString(),
        type: 'system'
      }]);
      
      // Show alert and redirect
      setTimeout(() => {
        alert(data.message || 'Session has ended');
        if (!isHost) {
          navigate({ to: '/studios' });
        }
      }, 1000);
    };

    const handleUserJoined = (userData) => {
      console.log('User joined:', userData);
      setOnlineParticipants(prev => {
        const exists = prev.find(p => p.socketId === userData.socketId);
        if (!exists) {
          return [...prev, userData];
        }
        return prev;
      });
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        user: 'System',
        message: `${userData.userName} joined the session`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'system'
      }]);
    };

    const handleUserLeft = (userData) => {
      console.log('User left:', userData);
      setOnlineParticipants(prev => 
        prev.filter(p => p.socketId !== userData.socketId)
      );
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        user: 'System',
        message: `${userData.userName} left the session`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'system'
      }]);
    };

    const handleCurrentParticipants = (currentParticipants) => {
      console.log('Current participants:', currentParticipants);
      setOnlineParticipants(currentParticipants);
    };

    const handleReceiveMessage = (messageData) => {
      console.log('Received message:', messageData);
      setMessages(prev => [...prev, {
        id: messageData.id,
        user: messageData.userName,
        userId: messageData.userId,
        message: messageData.message,
        timestamp: messageData.timestamp,
        type: 'user'
      }]);
    };

    const handleJoinSuccess = (data) => {
      console.log('Join success:', data);
      setIsJoined(true);
      setJoinError(null);
      
      // If this is the host starting session, add them to participants immediately
      if (isHost && data.participants) {
        setOnlineParticipants(data.participants);
      }
    };

    const handleError = (error) => {
      console.error('Socket error:', error);
      setJoinError(error.message);
    };

    // Add event listeners
    addEventListener('session-started', handleSessionStarted);
    addEventListener('session-ended', handleSessionEnded);
    addEventListener('user-joined', handleUserJoined);
    addEventListener('user-left', handleUserLeft);
    addEventListener('current-participants', handleCurrentParticipants);
    addEventListener('receive-message', handleReceiveMessage);
    addEventListener('join-success', handleJoinSuccess);
    addEventListener('error', handleError);

    // Cleanup function
    return () => {
      removeEventListener('session-started', handleSessionStarted);
      removeEventListener('session-ended', handleSessionEnded);
      removeEventListener('user-joined', handleUserJoined);
      removeEventListener('user-left', handleUserLeft);
      removeEventListener('current-participants', handleCurrentParticipants);
      removeEventListener('receive-message', handleReceiveMessage);
      removeEventListener('join-success', handleJoinSuccess);
      removeEventListener('error', handleError);
    };
  }, [isConnected, isHost, navigate, addEventListener, removeEventListener]);

  // Fetch session data
  useEffect(() => {
    const fetchSessionData = async () => {
      if (!roomId?.trim() || !currentUser) return;
      
      try {
        setLoading(true);
        setError(null);
        const sessionData = await getSessionByRoomId(roomId.trim());
        setSession(sessionData);
        setSessionStatus(sessionData.status);
        
        // Check if current user is host
        const userIsHost = sessionData?.host?._id === currentUser?._id;
        setIsHost(userIsHost);
        
        // Check if user is already a participant
        const userIsParticipant = sessionData?.participants?.some(
          p => p?.user?._id === currentUser?._id && p?.isActive
        ) ?? false;
        
        // If session is live and user is host or participant, automatically join socket
        if (sessionData.status === 'live' && (userIsHost || userIsParticipant)) {
          setIsJoined(true);

          // Initialize WebRTC first if not already initialized
          if (!isInitialized && !isInitializing) {
            console.log('🎥 Initializing WebRTC for live session...');
            try {
              await startLocalStream();
            } catch (err) {
              console.error('❌ Failed to initialize media for live session:', err);
              setJoinError('Failed to initialize media: ' + err.message);
            }
          }

          if (userIsHost) {
            // Host rejoining live session
            socketStartSession({
              roomId,
              userId: currentUser._id,
              userName: currentUser.name,
              sessionId: sessionData._id
            });
          } else {
            // Participant rejoining live session
            socketJoinSession({
              roomId,
              userId: currentUser._id,
              userName: currentUser.name,
              sessionId: sessionData._id
            });
          }
        }
        
        // Get participants
        if (userIsHost || userIsParticipant) {
          const participantsData = await getSessionParticipants(sessionData._id);
          setParticipants(participantsData?.session?.participants ?? []);
        }
        
        // Update settings from session
        if (sessionData.settings) {
          setSettings(sessionData.settings);
        }
        
      } catch (err) {
        console.error('fetchSessionData error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [roomId, currentUser, isInitialized, isInitializing, socketJoinSession, socketStartSession, startLocalStream]);

  // Session timer
  useEffect(() => {
    if (sessionStatus !== 'live') return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;
      
      setSessionTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStatus]);

  // Event handlers
  const handleStartSession = async () => {
    if (!isHost || !isConnected) return;

    // Show permission dialog first
    setPermissionAction('start');
    setShowPermissionDialog(true);
  };

  const handleJoinSession = async () => {
    if (!isConnected) return;

    // Show permission dialog first
    setPermissionAction('join');
    setShowPermissionDialog(true);
  };

  const handlePermissionGranted = async () => {
    setShowPermissionDialog(false);

    try {
      setJoinError(null);

      if (permissionAction === 'start') {
        console.log('🚀 Starting session with permissions...');

        // Ensure WebRTC is initialized and get media stream
        if (!isInitialized && !isInitializing) {
          console.log('🎥 Initializing WebRTC for host...');
          await initializeWebRTC();
        }

        if (!localStream) {
          console.log('🎥 Starting local media stream...');
          await startLocalStream();
        }

        // Start session via socket
        socketStartSession({
          roomId,
          userId: currentUser._id,
          userName: currentUser.name,
          sessionId: session._id
        });

        setIsJoined(true);

        // Immediately add host to online participants for local display
        const hostParticipant = {
          userId: currentUser._id,
          userName: currentUser.name,
          socketId: 'host-temp',
          isHost: true,
          joinedAt: new Date()
        };
        setOnlineParticipants([hostParticipant]);

        console.log('✅ Session started successfully');

      } else if (permissionAction === 'join') {
        console.log('🚀 Joining session with permissions...');

        // Initialize WebRTC first if not already done
        if (!isInitialized && !isInitializing) {
          console.log('🎥 Initializing WebRTC for guest...');
          await initializeWebRTC();
        }

        // Ensure we have local media stream
        if (!localStream) {
          console.log('🎥 Starting local media stream for guest...');
          await startLocalStream();
        }

        // Join via API first
        await joinSessionByRoomId(roomId);

        // Then join socket room
        socketJoinSession({
          roomId,
          userId: currentUser._id,
          userName: currentUser.name,
          sessionId: session._id
        });

        console.log('✅ Session joined successfully');
      }

    } catch (err) {
      console.error('❌ Session action error:', err);
      setJoinError('Failed to ' + permissionAction + ' session: ' + err.message);
    } finally {
      setPermissionAction(null);
    }
  };

  const handlePermissionDenied = () => {
    setShowPermissionDialog(false);
    setJoinError('Media permissions are required to ' + (permissionAction === 'start' ? 'start' : 'join') + ' the session');
    setPermissionAction(null);
  };

  const handleLeaveSession = async () => {
    try {
      setJoinError(null);
      
      if (isHost) {
        // Host ending the session for everyone
        const confirmed = window.confirm('Are you sure you want to end this session for everyone?');
        if (!confirmed) return;

        // End session via socket (will notify all participants)
        socketEndSession({
          roomId,
          userId: currentUser._id
        });

        // Update backend
        await updateSessionStatus(session._id, 'ended');

        // Redirect after delay
        setTimeout(() => {
          navigate({ to: '/studios' });
        }, 2000);
      } else {
        // Participant leaving
        socketLeaveSession();
        await leaveSession(session._id);
        navigate({ to: '/studios' });
      }
      
    } catch (err) {
      console.error('Leave session error:', err);
      setJoinError(err.response?.data?.message || err.message || 'Failed to leave session');
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const toggleLive = () => {
    if (isHost) {
      if (sessionStatus === 'scheduled') {
        handleStartSession();
      } else if (sessionStatus === 'live') {
        handleLeaveSession();
      }
    }
  };

  const sendMessage = (message) => {
    if (!isConnected || !isJoined) return;
    
    socketSendMessage({
      roomId,
      message,
      userName: currentUser.name,
      userId: currentUser._id
    });
  };

  // Cleanup WebRTC on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up WebRTC on unmount...');
      cleanupWebRTC();
    };
  }, [cleanupWebRTC]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-300 font-medium">Loading studio...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => navigate({ to: '/studios' })} className="bg-blue-600 hover:bg-blue-700">
            Back to Studios
          </Button>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-300 mb-4">Please log in to access the studio</p>
          <Button onClick={() => navigate({ to: '/' })} className="bg-blue-600 hover:bg-blue-700">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const participantCount = onlineParticipants.length;

  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col -mt-36">
       {isInitializing && (
        <div className="bg-blue-600/20 border border-blue-500/50 text-blue-300 px-4 py-2 text-center text-sm">
          Initializing camera and microphone...
        </div>
      )}
      {/* WebRTC error indicator */}
      {mediaError && (
        <div className="bg-red-600/20 border border-red-500/50 text-red-300 px-4 py-2 text-center text-sm">
          WebRTC Error: {mediaError.message}
        </div>
      )}
      {/* Connection status indicator */}
      {!isConnected && (
        <div className="bg-yellow-600/20 border border-yellow-500/50 text-yellow-300 px-4 py-2 text-center text-sm">
          Reconnecting to server...
        </div>
      )}
      
      {/* WebRTC status indicator */}
      {!isInitialized && isConnected && (
        <div className="bg-blue-600/20 border border-blue-500/50 text-blue-300 px-4 py-2 text-center text-sm">
          Initializing WebRTC...
        </div>
      )}
      
      {/* Media error indicator with device check */}
      {mediaError && (
        <div className="bg-red-600/20 border border-red-500/50 text-red-300 px-4 py-2 text-center text-sm flex items-center justify-center gap-4">
          <span>Media Error: {mediaError.message}</span>
          <DeviceCheckButton onCheck={checkDevices} isChecking={isCheckingDevices} />
        </div>
      )}
      
      {!isFullScreen && (
        <TopBar
          isLive={sessionStatus === 'live'}
          sessionTime={sessionTime}
          onToggleLive={toggleLive}
          session={session}
          participantCount={participantCount}
          connectionStatus={isConnected}
        />
      )}
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <VideoGrid
            participants={participants}
            onlineParticipants={onlineParticipants}
            isFullScreen={isFullScreen}
            layout={settings.layout}
            currentUser={currentUser}
            session={session}
            localStream={localStream}
            remoteStreams={remoteStreams}
            localVideoRef={localVideoRef}
            connectionStates={connectionStates}
            audioLevel={audioLevel}
            isAudioEnabled={isAudioEnabled}
          />
          
          <ControlBar
            isFullScreen={isFullScreen}
            onToggleFullScreen={toggleFullScreen}
            onLeaveSession={handleLeaveSession}
            onStartSession={handleStartSession}
            isHost={isHost}
            isJoined={isJoined}
            onJoinSession={handleJoinSession}
            joinError={joinError}
            sessionStatus={sessionStatus}
            isConnected={isConnected}
            // WebRTC controls
            isMuted={!isAudioEnabled}
            isVideoOff={!isVideoEnabled}
            isScreenSharing={isScreenSharing}
            onToggleAudio={handleToggleAudio}
            onToggleVideo={handleToggleVideo}
            onToggleScreenShare={handleToggleScreenShare}
            mediaError={mediaError}
          />
        </div>
        
        {!isFullScreen && (
          <Sidebar
            onlineParticipants={onlineParticipants}
            messages={messages}
            settings={settings}
            onSendMessage={sendMessage}
            onUpdateSettings={setSettings}
            session={session}
            currentUser={currentUser}
            isHost={isHost}
            isJoined={isJoined}
          />
        )}
      </div>

      {isFullScreen && (
        <Button
          onClick={toggleFullScreen}
          className="fixed top-4 right-4 bg-stone-800/80 hover:bg-stone-700 border border-stone-600"
          size="sm"
        >
          <Minimize className="w-4 h-4" />
        </Button>
      )}

      {/* Media Permission Dialog */}
      <MediaPermissionDialog
        isVisible={showPermissionDialog}
        title={`Media Permissions Required to ${permissionAction === 'start' ? 'Start' : 'Join'} Session`}
        onPermissionGranted={handlePermissionGranted}
        onPermissionDenied={handlePermissionDenied}
      />
    </div>
  );
};

export default StudioRoomComplete;
