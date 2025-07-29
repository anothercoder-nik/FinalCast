import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'react-toastify';

const StudioCard = ({ session, currentUser, onDelete, onStatusUpdate }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!currentUser || !session) {
    return <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6">Loading...</div>;
  }

  
  
  const isHost = session?.host?._id === currentUser?._id;
  const isParticipant = session?.participants?.some(p => p.user?._id === currentUser?._id && p.isActive) || false;
  
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'live': return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'ended': return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-400/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return '📅';
      case 'live': return '🔴';
      case 'ended': return '✅';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setLoading(true);
    try {
      await onStatusUpdate(session._id, newStatus);
      setShowMenu(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete(session._id);
    } finally {
      setLoading(false);
    }
  };

  const activeParticipants = session.participants.filter(p => p.isActive);

  return (
    <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all group">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
            {session.title}
          </h3>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-md border ${getStatusColor(session.status)}`}>
            <span>{getStatusIcon(session.status)}</span>
            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </div>
        </div>

        {/* Menu */}
        {isHost && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              disabled={loading}
            >
              <svg className="w-5 h-5 text-white/70" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-xl z-10">
                <div className="p-2">
                  {session.status === 'scheduled' && (
                    <button
                      onClick={() => handleStatusUpdate('live')}
                      className="w-full text-left px-3 py-2 text-green-300 hover:bg-green-500/20 rounded-lg transition-colors"
                    >
                      🔴 Start Live
                    </button>
                  )}
                  {session.status === 'live' && (
                    <button
                      onClick={() => handleStatusUpdate('ended')}
                      className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-500/20 rounded-lg transition-colors"
                    >
                      ✅ End Session
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusUpdate('cancelled')}
                    className="w-full text-left px-3 py-2 text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    ❌ Cancel
                  </button>
                  <hr className="border-white/20 my-2" />
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {session.description && (
        <p className="text-white/70 text-sm mb-4 line-clamp-2">
          {session.description}
        </p>
      )}

      {/* Participants */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-sm">👥</span>
          <span className="text-white/80 text-sm">
            {activeParticipants.length}/{session.maxParticipants} participants
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-sm">👑</span>
          <span className="text-white/80 text-sm">
            {isHost ? 'You' : session.host.name}
          </span>
        </div>
      </div>

      {/* Timing */}
      <div className="space-y-2 mb-6">
        {session.scheduledAt && (
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span>📅</span>
            <span>Scheduled: {format(new Date(session.scheduledAt), 'MMM dd, yyyy HH:mm')}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-white/60">
          <span>🕒</span>
          <span>Created {formatDistanceToNow(new Date(session.createdAt))} ago</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {session.status === 'live' ? (
          <Link to={`/studio/${session.roomId}`} className="flex-1">
            <button className="w-full backdrop-blur-md bg-gradient-to-r from-red-600/80 to-red-700/80 text-white font-semibold py-2 px-4 rounded-xl hover:from-red-700/90 hover:to-red-800/90 transition-all transform hover:scale-105 border border-red-400/30">
              🔴 Join Live
            </button>
          </Link>
        ) : session.status === 'ended' ? (
          <Link to={`/session-details/${session.roomId}`} className="flex-1">
            <button className="w-full backdrop-blur-md bg-gradient-to-r from-blue-600/80 to-purple-600/80 text-white font-semibold py-2 px-4 rounded-xl hover:from-blue-700/90 hover:to-purple-700/90 transition-all transform hover:scale-105 border border-blue-400/30">
              📊 View Details
            </button>
          </Link>
        ) : (
          <Link to={`/studio/${session.roomId}`} className="flex-1">
            <button className="w-full backdrop-blur-md bg-gradient-to-r from-blue-600/80 to-purple-600/80 text-white font-semibold py-2 px-4 rounded-xl hover:from-blue-700/90 hover:to-purple-700/90 transition-all transform hover:scale-105 border border-blue-400/30">
              👁️ View Session
            </button>
          </Link>
        )}
        
        {session.roomId && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(session.roomId);
              toast.success('Room ID copied to clipboard');
            }}
            className="backdrop-blur-md bg-white/10 border border-white/20 text-white p-2 rounded-xl hover:bg-white/20 transition-all hover:scale-105"
            title="Copy Room ID"
          >
            📋
          </button>
        )}
      </div>
    </div>
  );
};

export default StudioCard;
