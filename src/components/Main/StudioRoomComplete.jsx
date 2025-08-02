import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useSocket } from '../../context/SocketContext';
import useMediaRecorder from '../../hooks/userMediaRecorder';
import UploadStatus from '../studio/UploadStatus';
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
  Upload,
  Circle,
  Mail,
  Copy,
  Check,
  X,
  Info,
  AlertTriangle,
  Key
} from 'lucide-react';
import { toast } from "sonner";

// UI Components
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useWebRTC } from '../../hooks/useWebRTC';
import VideoGrid from './VideoGrid';
import MediaPermissionDialog from '../ui/MediaPermissionDialog';
import WebRTCDebugPanel from '../debug/WebRTCDebugPanel';
import YouTubeModal from '../studio/YoutubeModal';
import EmailInvitationModal from '../studio/EmailInvitationModal';
import { startYouTubeStream } from '../../api/youtube.api.js';
import VideoGridStreamManager from '../../utils/videoGridStreamManager.js';
import { getApiUrl } from '../../utils/config.js';




// TopBar Component
const TopBar = ({ isLive, sessionTime, onToggleLive, session, participantCount, connectionStatus, isGridStreaming }) => {
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
            {isGridStreaming && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>Streaming to YouTube</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-stone-300">
            {sessionTime}
          </div>
          
          <Button
            onClick={onToggleLive}
            variant={isGridStreaming ? "destructive" : "default"}
            className={`${
              isGridStreaming 
                ? "bg-red-600 hover:bg-red-700 animate-pulse" 
                : "bg-red-600 hover:bg-red-700"
            } font-medium`}
          >
            <RadioIcon className="w-4 h-4 mr-2" />
            {isGridStreaming ? "Stop Stream" : "Stream to YouTube"}
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
  mediaError,
  // Recording props
  isRecording,
  onToggleRecording,
  recordingError,
  chunkCount,
  isUploading,
  uploadTimer,
  // Sidebar props
  isSidebarCollapsed,
  onToggleSidebar
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

          {/* Recording control */}
          <Button
            onClick={onToggleRecording}
            variant={isRecording ? "destructive" : "default"}
            size="sm"
            className={`${isRecording ? "bg-red-600 hover:bg-red-700 animate-pulse" : "bg-stone-700 hover:bg-stone-600"} transition-all duration-200 hover:scale-105`}
            disabled={!isJoined || isUploading}
            title={isRecording ? `Recording (${chunkCount} chunks)` : "Start Recording"}
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
            {isUploading && <span className="ml-1 text-xs">Uploading...</span>}
          </Button>

          {/* Media error indicator */}
          {mediaError && (
            <div className="text-red-400 text-sm">
              Media Error: {mediaError.message}
            </div>
          )}

          {/* Recording error indicator */}
          {recordingError && (
            <div className="text-red-400 text-sm">
              Recording Error: {recordingError}
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

          {/* Sidebar toggle */}
          {!isFullScreen && (
            <Button
              onClick={onToggleSidebar}
              variant="ghost"
              size="sm"
              className="text-stone-400 hover:text-white hover:bg-stone-700 transition-all duration-200 hover:scale-105"
              title={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
            >
              {isSidebarCollapsed ? <MessageCircle className="w-4 h-4" /> : <MoreHorizontal className="w-4 h-4" />}
            </Button>
          )}
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
        {/* Network drop simulation for testing recovery */}
        <Button
          variant="outline"
          className="ml-2 border-blue-500 text-blue-500 hover:bg-blue-50"
          onClick={() => {
            // Simulate network drop by disconnecting and reconnecting socket
            if (window.socket) {
              window.socket.disconnect();
              setTimeout(() => window.socket.connect(), 2000);
            } else if (typeof socket?.disconnect === 'function') {
              socket.disconnect();
              setTimeout(() => socket.connect(), 2000);
            } else {
              alert('Socket not found for simulation.');
            }
          }}
          title="Simulate network drop and recovery"
        >
          Simulate Network Drop
        </Button>
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
const ParticipantsPanel = ({ onlineParticipants, session, currentUser, isHost }) => {
  const totalCount = onlineParticipants.length;
  const [showEmailModal, setShowEmailModal] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-stone-700">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-white">
            Online ({totalCount}/{session?.maxParticipants || 3})
          </h3>
          {isHost && (
            <Button
              size="sm"
              onClick={() => setShowEmailModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
            >
              <Mail className="w-3 h-3 mr-1" />
              Invite
            </Button>
          )}
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

      {/* Email Invitation Modal */}
      <EmailInvitationModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        session={session}
        currentUser={currentUser}
      />
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
  isJoined,
  localStream,
  remoteStreams,
  isCollapsed,
  onToggleCollapse
}) => {
  // If collapsed, show only a thin bar with expand button
  if (isCollapsed) {
    return (
      <div className="w-12 bg-stone-900 border-l border-stone-700 flex flex-col items-center py-4">
        <Button
          onClick={onToggleCollapse}
          variant="ghost"
          size="sm"
          className="text-stone-400 hover:text-white hover:bg-stone-700 mb-4"
          title="Expand sidebar"
        >
          <MessageCircle className="w-5 h-5" />
        </Button>
        
        {/* Participant count indicator */}
        <div className="text-stone-500 text-xs text-center">
          <Users className="w-4 h-4 mx-auto mb-1" />
          <span>{onlineParticipants.length}</span>
        </div>
        
        {/* Chat indicator - show if there are unread messages */}
        {messages.length > 0 && (
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
        )}
      </div>
    );
  }

  return (
    <div className="w-80 bg-stone-900 border-l border-stone-700 flex flex-col relative">
      {/* Collapse button */}
      <Button
        onClick={onToggleCollapse}
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 text-stone-400 hover:text-white hover:bg-stone-700 z-10"
        title="Collapse sidebar"
      >
        <MoreHorizontal className="w-4 h-4" />
      </Button>
      <Tabs defaultValue="participants" className="flex flex-col h-full">
        <TabsList className={`grid w-full ${isHost ? 'grid-cols-4' : 'grid-cols-3'} bg-stone-800 border-b border-stone-700 rounded-none`}>
          <TabsTrigger 
            value="participants" 
            className="data-[state=active]:bg-stone-700 data-[state=active]:text-white flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            {isHost ? 'Members' : 'Participants'}
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
            isHost={isHost}
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
          <>

            
            <TabsContent value="settings" className="flex-1 m-0">
              <SettingsPanel 
                settings={settings}
                onUpdateSettings={onUpdateSettings}
              />
            </TabsContent>
          </>
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
    socket,
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
  
  // Pin/unpin video state
  const [pinnedVideo, setPinnedVideo] = useState(null); // { userId: string, userName: string, type: 'local' | 'remote' }
  
  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // YouTube streaming state
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const [isGridStreaming, setIsGridStreaming] = useState(false);
  const videoGridStreamManager = useRef(new VideoGridStreamManager());
  const videoGridRef = useRef(null);

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
    webRTCManagerRef,
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

  // Recording integration
  const {
    startRecording,
    stopRecording,
    isRecording,
    error: recordingError,
    chunkCount,
    isUploading,
    uploadProgress,
    uploadTimer
  } = useMediaRecorder({
    stream: localStream,
    sessionId: session?._id,
    role: isHost ? 'host' : 'participant',
    participantId: currentUser?._id,
    participantName: currentUser?.name
  });

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
      
      // Connect to all existing participants via WebRTC with staggered connections for better stability
      if (isInitialized && connectToUser) {
        participants.forEach((participant, index) => {
          if (currentUser && participant.userId !== currentUser._id) {
            console.log(`🔗 Connecting to existing participant: ${participant.userName} (${participant.userId})`);
            // Stagger connections by 100ms each to avoid overwhelming WebRTC
            setTimeout(() => {
              connectToUser(participant.userId);
            }, index * 100);
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
  }, [isConnected, currentUser, localStream, isInitialized, connectToUser, addEventListener, removeEventListener]);

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

  const handleToggleRecording = async () => {
    console.log('🎥 Toggling recording...');
    try {
      if (isRecording) {
        // Stop recording
        stopRecording();
        toast.success('Recording stopped');
      } else {
        if (!localStream) {
          toast.error('No media stream available for recording');
          return;
        }
        
        // Start regular recording
        startRecording();
        toast.success('Recording started');
      }
    } catch (error) {
      console.error('Recording toggle error:', error);
      toast.error(`Recording error: ${error.message}`);
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
      
      // Clean up WebRTC when session ends
      if (webRTCManagerRef?.current) {
        console.log('🧹 Cleaning up WebRTC after session end');
        webRTCManagerRef.current.cleanup();
      }
      
      // Also trigger the useWebRTC cleanup
      cleanupWebRTC();
      
      // Show alert and redirect
      setTimeout(() => {
        alert(data.message || 'Session has ended');
        navigate({ to: '/studios' }); // Navigate all users, not just non-hosts
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

    // YouTube streaming error handler
    const handleYouTubeStreamError = (error) => {
      console.error('YouTube streaming error:', error);
      toast.error('YouTube streaming error', {
        description: error.message
      });
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
    addEventListener('youtube-stream-error', handleYouTubeStreamError);

    // Add custom event listener for WebRTC session end (fallback)
    const handleWebRTCSessionEnded = (event) => {
      console.log('🛑 WebRTC session ended event received:', event.detail);
      handleSessionEnded(event.detail);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('webrtc-session-ended', handleWebRTCSessionEnded);
    }

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
      removeEventListener('youtube-stream-error', handleYouTubeStreamError);
      
      // Remove custom event listener
      if (typeof window !== 'undefined') {
        window.removeEventListener('webrtc-session-ended', handleWebRTCSessionEnded);
      }
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

          // Initialize WebRTC first if not already initialized - enhanced for invitation flows
          if (!isInitialized && !isInitializing) {
            console.log('🎥 Initializing WebRTC for live session (invitation flow)...');
            try {
              await initializeWebRTC(); // Initialize WebRTC first
              await startLocalStream(); // Then start media stream
            } catch (err) {
              console.error('❌ Failed to initialize WebRTC/media for live session:', err);
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

        // Start session via socket - include encryption info
        const startData = {
          roomId,
          userId: currentUser._id,
          userName: currentUser.name,
          sessionId: session._id
        };

        socketStartSession(startData);

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
        const joinData = {
          roomId,
          userId: currentUser._id,
          userName: currentUser.name,
          sessionId: session._id
        };

        // Add encryption public key if available
        socketJoinSession(joinData);

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

        console.log('🛑 Host ending session:', { roomId, userId: currentUser._id, sessionId: session._id });

        // End session via socket (will notify all participants)
        socketEndSession({
          roomId,
          userId: currentUser._id,
          sessionId: session._id
        });

        // Update backend
        await updateSessionStatus(session._id, 'ended');

        // Redirect after delay
        setTimeout(() => {
          navigate({ to: '/studios' });
        }, 2000);
      } else {
        // Participant leaving
        console.log('🚪 Participant leaving session:', { roomId, userId: currentUser._id });
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
      if (isGridStreaming) {
        // If already streaming, stop it
        handleStopYouTubeStream();
      } else {
        // Start new streaming by opening YouTube modal
        setShowYouTubeModal(true);
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

  // Pin/unpin video handlers
  const handlePinVideo = (userId, userName, type = 'remote') => {
    setPinnedVideo({ userId, userName, type });
    console.log(`📌 Pinned video: ${userName} (${type})`);
  };

  const handleUnpinVideo = () => {
    if (pinnedVideo) {
      console.log(`📌 Unpinned video: ${pinnedVideo.userName}`);
      setPinnedVideo(null);
    }
  };

  // Encryption handlers
  const handleJoinEncryptedSession = async (passphrase) => {
    try {
      if (!session.hostPublicKey) {
        throw new Error('Host encryption key not available');
      }

      await joinEncryptedSession(session.hostPublicKey, passphrase);
      
      setShowJoinEncryptedModal(false);
      
      // Now join the actual session
      await joinSessionByRoomId(roomId);
      
      const joinData = {
        roomId,
        userId: currentUser._id,
        userName: currentUser.name,
        sessionId: session._id,
        publicKey: await getPublicKey(),
        encrypted: true
      };

      socketJoinSession(joinData);
      
      toast.success('Joined encrypted session', {
        description: 'Your conversation is now end-to-end encrypted'
      });
      
    } catch (err) {
      throw new Error('Failed to join encrypted session: ' + err.message);
    }
  };

  // Sidebar collapse handlers
  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // YouTube streaming handlers with video grid support
  const handleStartYouTubeStream = async (streamConfig) => {
    try {
      console.log('🎥 Starting Video Grid YouTube streaming with config:', streamConfig);
      
      if (isGridStreaming) {
        toast.error('Grid streaming already active', {
          description: 'Please stop the current stream before starting a new one'
        });
        return;
      }

      // Get the video grid element
      const videoGridElement = videoGridRef.current;
      if (!videoGridElement) {
        toast.error('Video grid not found', {
          description: 'Cannot start streaming without video grid'
        });
        return;
      }

      // Prepare participants data for grid streaming
      const participantsData = {
        localStream,
        remoteStreams,
        onlineParticipants
      };

      // Start backend streaming first
      const response = await startYouTubeStream({
        sessionId: session._id,
        rtmpUrl: streamConfig.rtmpUrl,
        streamKey: streamConfig.streamKey,
        title: streamConfig.title || `${session.title} - Live Stream`,
        hasVideoCapture: true,
        streamType: 'video-grid',
        videoConfig: {
          width: 1280,
          height: 720,
          framerate: 30,
          videoBitrate: '2500k',
          audioBitrate: '128k'
        }
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to start backend streaming');
      }

      // Start video grid streaming
      const gridStreamConfig = {
        ...streamConfig,
        sessionId: session._id
      };

      await videoGridStreamManager.current.startGridStreaming(
        gridStreamConfig,
        videoGridElement,
        participantsData
      );

      setIsGridStreaming(true);

      toast.success('Video Grid Streaming Started!', {
        description: `Streaming all ${onlineParticipants.length + 1} participants to YouTube Live`,
        duration: 5000
      });

      console.log('✅ Video Grid YouTube streaming started successfully');

    } catch (error) {
      console.error('❌ Failed to start video grid streaming:', error);
      toast.error('Failed to start streaming', {
        description: error.message
      });
    }
  };

  // Stop video grid streaming
  const handleStopYouTubeStream = async () => {
    try {
      console.log('🛑 Stopping Video Grid YouTube streaming...');

      if (!isGridStreaming) {
        toast.error('No active streaming', {
          description: 'Video grid streaming is not currently active'
        });
        return;
      }

      // Stop video grid streaming
      await videoGridStreamManager.current.stopGridStreaming();

      // Stop backend streaming
      try {
        const response = await fetch(`${getApiUrl()}/api/youtube/stop-stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            sessionId: session._id
          })
        });

        if (!response.ok) {
          console.warn('⚠️ Backend stream stop failed, but grid streaming stopped');
        }
      } catch (backendError) {
        console.warn('⚠️ Backend stop request failed:', backendError);
      }

      setIsGridStreaming(false);

      toast.success('Video Grid Streaming Stopped', {
        description: 'YouTube Live streaming has been stopped'
      });

      console.log('✅ Video Grid YouTube streaming stopped successfully');

    } catch (error) {
      console.error('❌ Failed to stop video grid streaming:', error);
      toast.error('Failed to stop streaming', {
        description: error.message
      });
    }
  };

  // Legacy YouTube streaming handler (kept for compatibility)
  const handleStartYouTubeStreamLegacy = async (streamConfig) => {
    try {
      console.log('🎥 Starting Enhanced YouTube stream with config:', streamConfig);
      
      // Enhanced stream source selection
      let streamToUse = localStream;
      let useScreenCapture = false;
      
      // Intelligent stream source selection
      if (!localStream || window.confirm('Do you want to stream your entire screen instead of just the camera feed?')) {
        try {
          streamToUse = await navigator.mediaDevices.getDisplayMedia({
            video: {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              frameRate: { ideal: 30, max: 60 },
              cursor: 'always'
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          useScreenCapture = true;
          console.log('✅ Using enhanced screen capture for YouTube streaming');
        } catch (captureError) {
          console.error('❌ Failed to capture display media:', captureError);
          if (!localStream) {
            toast.error('No video source available for streaming', {
              description: 'Please start your camera or allow screen capture'
            });
            return;
          }
          console.log('📹 Falling back to local camera stream');
        }
      }
      
      if (!streamToUse) {
        toast.error('No video stream available', {
          description: 'Please start your camera first'
        });
        return;
      }
      
      // Enhanced MediaRecorder configuration matching FFmpeg settings
      const mimeTypes = [
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm',
        'video/mp4'
      ];
      
      let selectedMimeType = null;
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log('✅ Using MIME type:', mimeType);
          break;
        }
      }
      
      if (!selectedMimeType) {
        throw new Error('No supported video format found for streaming');
      }
      
      // Call backend API first to validate and setup FFmpeg
      const response = await startYouTubeStream({
        sessionId: session._id,
        rtmpUrl: streamConfig.rtmpUrl,
        streamKey: streamConfig.streamKey,
        title: streamConfig.title || `${session.title} - Live Stream`,
        hasVideoCapture: true,
        streamType: useScreenCapture ? 'screen' : 'camera',
        videoConfig: {
          width: 1280,
          height: 720,
          framerate: 30,
          videoBitrate: '2500k',
          audioBitrate: '128k'
        }
      });
      
      // Enhanced MediaRecorder with optimal settings for FFmpeg
      if (useScreenCapture) {
        window.youtubeCapture = streamToUse;
        
        const mediaRecorder = new MediaRecorder(streamToUse, {
          mimeType: selectedMimeType,
          videoBitsPerSecond: 2500000,  // 2.5 Mbps to match FFmpeg target
          audioBitsPerSecond: 128000    // 128 kbps
        });
        
        let isStreaming = true;
        let chunkQueue = [];
        let isProcessingQueue = false;
        let lastChunkTime = 0;
        let chunkCount = 0;
        let totalBytes = 0;
        let startTime = Date.now();
        
        // Enhanced chunk processing with better error recovery
        const processChunkQueue = async () => {
          if (isProcessingQueue || chunkQueue.length === 0) return;
          
          isProcessingQueue = true;
          
          while (chunkQueue.length > 0 && isStreaming) {
            const { chunk, timestamp } = chunkQueue.shift();
            
            // Enhanced chunk validation
            if (chunk.size < 1000) {
              console.warn('⚠️ Skipping small chunk:', chunk.size, 'bytes');
              continue;
            }
            
            // Check socket connection
            if (!socket?.connected) {
              console.warn('⚠️ Socket disconnected, pausing chunk processing');
              // Re-queue the chunk
              chunkQueue.unshift({ chunk, timestamp });
              break;
            }
            
            try {
              const arrayBuffer = await chunk.arrayBuffer();
              
              // Enhanced socket emission with error handling
              socket.emit('youtube-video-chunk', {
                sessionId: session._id,
                chunk: arrayBuffer,
                timestamp,
                chunkIndex: chunkCount++,
                totalBytes: chunk.size
              });
              
              totalBytes += chunk.size;
              
              // Calculate and log effective bitrate every 10 chunks
              if (chunkCount % 10 === 0) {
                const elapsed = (Date.now() - startTime) / 1000;
                const effectiveBitrate = (totalBytes * 8) / 1000 / elapsed; // kbps
                console.log(`📊 Effective bitrate: ${effectiveBitrate.toFixed(2)} kbps, Target: 2500 kbps`);
              }
              
              // Adaptive delay based on queue size and chunk size
              const baseDelay = 100; // Reduced base delay for higher throughput
              const queuePenalty = chunkQueue.length * 10; // Penalty for queue backup
              const sizeBonus = Math.max(0, (chunk.size - 50000) / 10000); // Bonus for larger chunks
              const delay = Math.max(50, Math.min(200, baseDelay + queuePenalty - sizeBonus));
              
              await new Promise(resolve => setTimeout(resolve, delay));
              
            } catch (error) {
              console.error('❌ Error processing video chunk:', error);
              
              // Retry logic for failed chunks
              if (error.message.includes('timeout') || error.message.includes('network')) {
                console.log('🔄 Retrying chunk due to network error...');
                chunkQueue.unshift({ chunk, timestamp }); // Re-queue for retry
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
              } else {
                console.error('💥 Unrecoverable chunk error, skipping...');
              }
            }
          }
          
          isProcessingQueue = false;
          
          // Continue processing if there are more chunks
          if (chunkQueue.length > 0 && isStreaming) {
            setTimeout(processChunkQueue, 100);
          }
        };
        
        // Enhanced MediaRecorder event handlers
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && isStreaming) {
            const now = Date.now();
            
            // Reduced rate limiting for higher bitrate (every 500ms instead of 1s for more granular control)
            if (now - lastChunkTime < 500) {
              return;
            }
            
            lastChunkTime = now;
            
            console.log(`📊 YouTube chunk ${chunkCount}: ${event.data.size} bytes, queue: ${chunkQueue.length}`);
            
            // Enhanced queue management
            chunkQueue.push({
              chunk: event.data,
              timestamp: now
            });
            
            // Dynamic queue size based on performance
            const maxQueueSize = socket?.connected ? 8 : 3; // Larger queue when connected
            if (chunkQueue.length > maxQueueSize) {
              console.warn('⚠️ Chunk queue overflow, dropping oldest chunk');
              chunkQueue.shift();
            }
            
            // Start processing if not already running
            if (!isProcessingQueue) {
              processChunkQueue();
            }
          }
        };
        
        mediaRecorder.onerror = (event) => {
          console.error('❌ MediaRecorder error:', event.error);
          toast.error('Video recording error', {
            description: 'There was an issue capturing video for YouTube streaming'
          });
          
          // Attempt recovery
          if (mediaRecorder.state === 'recording') {
            console.log('🔄 Attempting MediaRecorder recovery...');
            try {
              mediaRecorder.stop();
              setTimeout(() => {
                if (isStreaming && streamToUse.active) {
                  mediaRecorder.start(500); // Restart with smaller chunks
                }
              }, 1000);
            } catch (recoveryError) {
              console.error('❌ MediaRecorder recovery failed:', recoveryError);
            }
          }
        };
        
        mediaRecorder.onstop = () => {
          isStreaming = false;
          chunkQueue = [];
          console.log('📹 MediaRecorder stopped for YouTube streaming');
        };
        
        // Enhanced recording start with optimal chunk timing
        mediaRecorder.start(500); // 500ms chunks for better granularity and bitrate control
        window.youtubeRecorder = mediaRecorder;
        window.youtubeStreamingActive = true;
        
        // Monitor stream health
        const healthMonitor = setInterval(() => {
          if (!isStreaming) {
            clearInterval(healthMonitor);
            return;
          }
          
          // Check if stream is still active
          if (!streamToUse.active || streamToUse.getTracks().every(track => !track.enabled)) {
            console.warn('⚠️ Stream became inactive, stopping YouTube streaming');
            isStreaming = false;
            mediaRecorder.stop();
            clearInterval(healthMonitor);
          }
          
          // Log queue health
          if (chunkQueue.length > 5) {
            console.warn('⚠️ Chunk queue backup detected:', chunkQueue.length, 'chunks');
          }
        }, 5000);
        
        window.youtubeHealthMonitor = healthMonitor;
        
        console.log('📹 Started enhanced streaming to YouTube with health monitoring');
      }
      
      // Success notification with enhanced info
      toast.success('YouTube stream started successfully!', {
        description: `Streaming "${response.streamInfo.title}" with enhanced stability`,
        duration: 5000
      });
      
      console.log('✅ Enhanced YouTube stream started successfully:', response);
      
    } catch (error) {
      console.error('❌ Failed to start YouTube stream:', error);
      
      // Enhanced error handling with specific messages
      if (error.message.includes('FFmpeg')) {
        toast.error('FFmpeg Required', {
          description: 'Please install FFmpeg to enable YouTube streaming. Check the setup guide for instructions.',
          duration: 10000
        });
      } else if (error.message.includes('RTMP')) {
        toast.error('YouTube Connection Failed', {
          description: 'Please check your stream key and ensure YouTube Live is enabled on your account.',
          duration: 8000
        });
      } else if (error.message.includes('network')) {
        toast.error('Network Error', {
          description: 'Please check your internet connection and try again.',
          duration: 6000
        });
      } else {
        toast.error('Streaming Error', {
          description: error.message,
          duration: 6000
        });
      }
      
      // Enhanced cleanup
      if (window.youtubeCapture && window.youtubeCapture !== localStream) {
        window.youtubeCapture.getTracks().forEach(track => track.stop());
        delete window.youtubeCapture;
      }
      if (window.youtubeRecorder) {
        window.youtubeRecorder.stop();
        delete window.youtubeRecorder;
      }
      if (window.youtubeHealthMonitor) {
        clearInterval(window.youtubeHealthMonitor);
        delete window.youtubeHealthMonitor;
      }
      if (window.youtubeStreamingActive) {
        delete window.youtubeStreamingActive;
      }
      
      throw error;
    }
  };

  // Enhanced cleanup for WebRTC and YouTube streaming on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Enhanced cleanup on unmount...');
      cleanupWebRTC();
      
      // Enhanced YouTube streaming cleanup
      if (window.youtubeCapture && window.youtubeCapture !== localStream) {
        console.log('🧹 Cleaning up YouTube capture stream...');
        window.youtubeCapture.getTracks().forEach(track => track.stop());
        delete window.youtubeCapture;
      }
      
      if (window.youtubeRecorder) {
        console.log('🧹 Stopping YouTube recorder...');
        try {
          if (window.youtubeRecorder.state === 'recording') {
            window.youtubeRecorder.stop();
          }
        } catch (e) {
          console.warn('⚠️ Error stopping recorder:', e);
        }
        delete window.youtubeRecorder;
      }
      
      if (window.youtubeHealthMonitor) {
        console.log('🧹 Clearing YouTube health monitor...');
        clearInterval(window.youtubeHealthMonitor);
        delete window.youtubeHealthMonitor;
      }
      
      if (window.youtubeStreamingActive) {
        window.youtubeStreamingActive = false;
        delete window.youtubeStreamingActive;
      }
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
      {/* Upload Status Overlay */}
      <UploadStatus 
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        uploadTimer={uploadTimer}
      />

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
          isLive={isGridStreaming}
          sessionTime={sessionTime}
          onToggleLive={toggleLive}
          session={session}
          participantCount={participantCount}
          connectionStatus={isConnected}
          isGridStreaming={isGridStreaming}
        />
      )}
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <VideoGrid
            ref={videoGridRef}
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
            pinnedVideo={pinnedVideo}
            onPinVideo={handlePinVideo}
            onUnpinVideo={handleUnpinVideo}
            isSidebarCollapsed={isSidebarCollapsed}
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
            // Recording controls
            isRecording={isRecording}
            onToggleRecording={handleToggleRecording}
            recordingError={recordingError}
            chunkCount={chunkCount}
            isUploading={isUploading}
            uploadTimer={uploadTimer}
            // Sidebar controls
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={toggleSidebarCollapse}
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
            localStream={localStream}
            remoteStreams={remoteStreams}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
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

      {/* YouTube Live Modal */}
      <YouTubeModal
        isOpen={showYouTubeModal}
        onClose={() => setShowYouTubeModal(false)}
        onStartStream={handleStartYouTubeStream}
      />

      {/* WebRTC Debug Panel - Development Only */}
      {process.env.NODE_ENV === 'development' && (
        <WebRTCDebugPanel
          webRTCManager={webRTCManagerRef?.current}
          localStream={localStream}
          remoteStreams={remoteStreams}
          connectionStates={connectionStates}
        />
      )}
    </div>
  );
};

export default StudioRoomComplete;
