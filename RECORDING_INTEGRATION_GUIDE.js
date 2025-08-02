/* 
ADD THIS TO YOUR STUDIOROOMCOMPLETE.JSX COMPONENT

1. Import the UploadStatus component at the top:
*/
import UploadStatus from '../studio/UploadStatus';

/*
2. Add this recording state and hook setup after your existing state declarations:
*/

// Recording state and functionality
const [isRecordingActive, setIsRecordingActive] = useState(false);

// Initialize recording hook - add this where you initialize other hooks
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
  stream: localStream, // or whatever your video stream variable is called
  sessionId: session?._id, // your session ID
  role: user?.role || 'participant', // 'host' or 'participant'
  participantId: user?._id // your user/participant ID
});

// Recording toggle handler
const handleToggleRecording = async () => {
  try {
    if (isRecording) {
      await stopRecording();
      setIsRecordingActive(false);
    } else {
      await startRecording();
      setIsRecordingActive(true);
    }
  } catch (error) {
    console.error('Recording error:', error);
    alert('Failed to toggle recording: ' + error.message);
  }
};

/*
3. Add this recording button to your control bar (wherever your other control buttons are):
*/

<Button
  onClick={handleToggleRecording}
  variant={isRecording ? "destructive" : "default"}
  className={`${
    isRecording 
      ? "bg-red-600 hover:bg-red-700 animate-pulse" 
      : "bg-gray-600 hover:bg-gray-700"
  } font-medium`}
  disabled={isUploading}
>
  <div className="flex items-center">
    {isRecording ? (
      <>
        <Square className="w-4 h-4 mr-2" />
        Stop Recording
      </>
    ) : (
      <>
        <Play className="w-4 h-4 mr-2" />
        Start Recording
      </>
    )}
    {isRecording && chunkCount > 0 && (
      <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded">
        {chunkCount} chunks
      </span>
    )}
  </div>
</Button>

/*
4. Add the UploadStatus component in your main return JSX (add this near the top level):
*/

return (
  <div className="studio-room-container">
    {/* Add this upload status overlay */}
    <UploadStatus 
      isUploading={isUploading}
      uploadProgress={uploadProgress}
      uploadTimer={uploadTimer}
    />
    
    {/* Your existing JSX content */}
    {/* ... */}
  </div>
);

/*
5. Optional: Add recording error display somewhere in your UI:
*/

{recordingError && (
  <div className="bg-red-500 text-white px-4 py-2 rounded-lg mb-4">
    Recording Error: {recordingError}
  </div>
)}

/*
6. Optional: Add recording status indicator in your header:
*/

{isRecording && (
  <div className="flex items-center gap-2 text-red-400">
    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
    <span className="text-sm font-medium">Recording in progress...</span>
    <span className="text-xs">({chunkCount} chunks)</span>
  </div>
)}

{isUploading && (
  <div className="flex items-center gap-2 text-blue-400">
    <div className="w-3 h-3 bg-blue-500 rounded-full animate-spin"></div>
    <span className="text-sm font-medium">Uploading... {uploadTimer}</span>
  </div>
)}
