import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { createSession } from '../../api/session.api';
import { FloatingShapes } from '../utils/floating-shapers';

const defaultSettings = {
  allowRecording: true,
  requireApproval: true,
  muteOnJoin: true,
  videoOnJoin: true,
};

const StudioForm = ({ onCreated }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    maxParticipants: 3,
    settings: { ...defaultSettings },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdSession, setCreatedSession] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name in defaultSettings) {
      setForm({ ...form, settings: { ...form.settings, [name]: checked } });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !form.title.trim()) {
      setError('Studio title is required');
      return;
    }
    setError(null);
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      console.log('Submitting form data:', form); // Debug log
      const session = await createSession(form);
      console.log('Session created:', session); // Debug log
      setCreatedSession(session);
      setCurrentStep(3);
      if (onCreated) onCreated(session);
    } catch (err) {
      console.error('Session creation error:', err); // Debug log
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinStudio = () => {
    console.log('Joining studio with roomId:', createdSession?.roomId);
    if (createdSession?.roomId) {
      navigate({ to: `/studio/${createdSession.roomId}` });
    } else {
      console.error('No roomId found in created session:', createdSession);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setForm({
      title: '',
      description: '',
      scheduledAt: '',
      maxParticipants: 3,
      settings: { ...defaultSettings },
    });

    setCreatedSession(null);
    setError(null);
  };

  // Step 1: Basic Information
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue
        -400 to-purple-400 bg-clip-text text-transparent mb-2">
          Create Your Studio
        </h2>
        <p className="text-gray-400">Let's start with the basics</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Studio Title *
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g., Tech Talk Podcast"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Tell us about your podcast..."
            rows={3}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none placeholder-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Schedule (Optional)
          </label>
          <input
            type="datetime-local"
            name="scheduledAt"
            value={form.scheduledAt}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>
    </div>
  );

  // Step 2: Settings & Participants
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
          Studio Settings
        </h2>
        <p className="text-gray-400">Configure your recording preferences</p>
      </div>

      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-gray-700 rounded-xl p-6">
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            Maximum Participants
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              name="maxParticipants"
              value={form.maxParticipants}
              min={2}
              max={10}
              onChange={handleChange}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider accent-blue-500"
            />
            <span className="bg-gray-800 border border-gray-600 px-3 py-1 rounded-lg font-semibold text-blue-400 min-w-[3rem] text-center">
              {form.maxParticipants}
            </span>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Recording Settings</h3>
          <div className="space-y-4">
            {[
              { key: 'allowRecording', label: 'Allow Recording', icon: '🎥' },
              { key: 'requireApproval', label: 'Require Approval to Join', icon: '✋' },
              { key: 'muteOnJoin', label: 'Mute Participants on Join', icon: '🔇' },
              { key: 'videoOnJoin', label: 'Video On by Default', icon: '📹' }
            ].map(setting => (
              <label key={setting.key} className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    name={setting.key}
                    checked={form.settings[setting.key]}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded-lg border-2 transition-all ${
                    form.settings[setting.key] 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'border-gray-600 group-hover:border-blue-400'
                  }`}>
                    {form.settings[setting.key] && (
                      <svg className="w-4 h-4 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-2xl">{setting.icon}</span>
                <span className="text-gray-300 font-medium">{setting.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Step 3: Success
  const renderStep3 = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h2 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
        Welcome to {createdSession?.title}!
      </h2>
      
      <p className="text-xl text-gray-400 max-w-md mx-auto">
        Your studio is ready! You can now start recording your podcast.
      </p>

      <div className="bg-gray-800/50 border border-gray-600 rounded-xl p-6 max-w-md mx-auto">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Room ID:</span>
            <span className="font-mono text-blue-400 font-bold">{createdSession?.roomId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Max Participants:</span>
            <span className="text-white">{createdSession?.maxParticipants}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Status:</span>
            <span className="text-green-400 capitalize">{createdSession?.status}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button 
          onClick={handleJoinStudio}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-8 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
        >
          🎙️ Join Studio
        </button>

    
        
        <button 
          onClick={resetForm}
          className="w-full bg-gray-800 border border-gray-600 text-gray-300 font-semibold py-3 px-6 rounded-xl hover:bg-gray-700 transition-all"
        >
          Create Another Studio
        </button>
      </div>
    </div>
  );

  // Progress Steps
  const renderProgressSteps = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
            currentStep >= step 
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
              : 'bg-gray-700 text-gray-400 border border-gray-600'
          }`}>
            {currentStep > step ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              step
            )}
          </div>
          {step < 3 && (
            <div className={`w-16 h-1 mx-2 transition-all ${
              currentStep > step ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-700'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-gradient-to-b from-stone-950 to-slate-950 py-12 px-4">
      
      <div className="max-w-2xl mx-auto h-full flex items-center">
        <div className="bg-slate-900 border border-gray-800 rounded-2xl shadow-2xl p-8 w-full max-h-[90vh] overflow-y-auto">
          {currentStep < 3 && renderProgressSteps()}
          
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {currentStep < 3 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-700">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  currentStep === 1
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600'
                }`}
              >
                ← Back
              </button>

              {currentStep === 1 ? (
                <button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-8 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`font-bold py-3 px-8 rounded-xl transition-all transform hover:scale-105 ${
                    loading
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 shadow-lg'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    '🚀 Create Studio'
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudioForm;
