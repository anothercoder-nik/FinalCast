import React, { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useSelector } from 'react-redux'
import UserAvatar from '../ui/UserAvatar'
import { joinSessionByRoomId, getSessionByRoomId } from '../../api/session.api.js'

const JoinForm = () => {
  const [roomId, setRoomId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const user = useSelector(state => state.auth.user)

  // Add loading state if user is not loaded yet
  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!roomId.trim()) {
      setError('Room ID is required')
      return
    }

    setError('')
    setLoading(true)
    
    try {
      // First check if session exists and is joinable
      const sessionData = await getSessionByRoomId(roomId.trim())
      
      if (sessionData.status === 'ended') {
        setError('This session has ended and cannot be joined')
        return
      }
      
      if (sessionData.status === 'cancelled') {
        setError('This session has been cancelled')
        return
      }
      
      const session = await joinSessionByRoomId(roomId.trim())
      console.log('Joining session:', session)
      navigate({ to: `/studio/${roomId.trim()}` })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to join session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="-mt-36 overflow-hidden bg-gradient-to-b from-stone-950 to-slate-950">
      {/* Header */}
      <header className='sticky top-0 z-50 backdrop-blur-xl'>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <h1 className="text-3xl font-extrabold tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              FinalCast
            </h1>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="text-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-xl font-bold hover:text-white transition-colors duration-300">
                Welcome, {user.name.toUpperCase()} 
              </button>
            </Link>
            <UserAvatar />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12 bg-gradient-to-b from-stone-950 to-slate-950">
        <div className="w-full max-w-md">
          {/* Form Container */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-3xl blur-xl"></div>
            <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
              
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  Join Studio Session
                </h2>
                <p className="text-slate-400 text-lg">
                  Enter the room ID to join an ongoing podcast session
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Room ID Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Room ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      placeholder="Enter room ID (e.g., ABC123)"
                      className="w-full px-4 py-4 bg-slate-800/50 border border-slate-600/50 text-white rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 placeholder-slate-400 shadow-lg backdrop-blur-sm text-lg font-mono tracking-wider"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="relative p-4 bg-gradient-to-r from-red-900/40 to-red-800/40 border border-red-500/30 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <span className="text-red-200 text-sm font-medium">{error}</span>
                    </div>
                  </div>
                )}

                {/* Join Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Joining...
                      </>
                    ) : (
                      <>
                        🎙️ Join Session
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </form>

              {/* Additional Info */}
              <div className="mt-8 pt-6 border-t border-slate-700/50">
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-4">
                    Don't have a room ID? Ask the host to share it with you.
                  </p>
                  <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Secure Connection</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>HD Audio</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JoinForm
