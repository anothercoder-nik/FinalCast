import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  Email as EmailIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { sendRegistrationOTP, verifyRegistrationOTP, resendRegistrationOTP } from '../../api/user.api.js';

const RegistrationOTPVerification = ({ 
  email, 
  name, 
  onVerified, 
  onBack,
  redirectTo 
}) => {
  const [otp, setOtp] = useState('');
  const [otpId, setOtpId] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [verified, setVerified] = useState(false);

  // Timer for OTP expiry
  useEffect(() => {
    let interval = null;
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Send initial OTP when component mounts
  useEffect(() => {
    handleSendOTP();
  }, []);

  const handleSendOTP = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('📧 Sending OTP to:', email, 'with name:', name);
      const response = await sendRegistrationOTP(email, name);
      console.log('📧 OTP response:', response);
      setOtpId(response.otpId);
      setTimeLeft(600); // 10 minutes
      setSuccess('OTP sent to your email address');
    } catch (error) {
      console.error('❌ Failed to send OTP:', error);
      console.error('❌ Error response:', error.response?.data);
      setError(error.response?.data?.message || error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');
    try {
      console.log('🔍 Verifying OTP:', otp, 'with ID:', otpId, 'for email:', email);
      const response = await verifyRegistrationOTP(otpId, otp, email);
      console.log('✅ OTP verification response:', response);
      setVerified(true);
      setSuccess('Email verified successfully! Completing registration...');
      
      // Wait a moment to show success message, then proceed with registration
      setTimeout(() => {
        onVerified(otpId); // Pass otpId back to parent for registration
      }, 1500);
    } catch (error) {
      console.error('❌ Failed to verify OTP:', error);
      console.error('❌ Error response:', error.response?.data);
      setError(error.response?.data?.message || error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    setError('');
    setOtp('');
    try {
      const response = await resendRegistrationOTP(otpId, email, name);
      setOtpId(response.otpId);
      setTimeLeft(600); // 10 minutes
      setSuccess('New OTP sent to your email address');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError('');
  };

  return (
    <Card sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <EmailIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Verify Your Email
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We've sent a verification code to
          </Typography>
          <Chip 
            label={email} 
            color="primary" 
            variant="outlined" 
            sx={{ mt: 1 }}
          />
        </Box>

        {loading && !resending && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              {otpId ? 'Verifying OTP...' : 'Sending OTP...'}
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {verified ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" color="success.main" fontWeight="bold">
              Email Verified Successfully!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Completing your registration and redirecting to {redirectTo ? 'your studio room' : 'dashboard'}...
            </Typography>
            {loading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
              </Box>
            )}
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Enter the 6-digit verification code
              </Typography>
              <TextField
                fullWidth
                value={otp}
                onChange={handleOtpChange}
                placeholder="000000"
                inputProps={{
                  maxLength: 6,
                  style: { 
                    textAlign: 'center', 
                    fontSize: '1.5rem',
                    letterSpacing: '0.5rem'
                  }
                }}
                disabled={loading}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && otp.length === 6) {
                    handleVerifyOTP();
                  }
                }}
              />
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              sx={{ mb: 2 }}
            >
              Verify Email
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TimerIcon sx={{ fontSize: 16, mr: 0.5, color: timeLeft > 0 ? 'primary.main' : 'error.main' }} />
                <Typography variant="body2" color={timeLeft > 0 ? 'primary.main' : 'error.main'}>
                  {timeLeft > 0 ? formatTime(timeLeft) : 'Expired'}
                </Typography>
              </Box>
              
              <Button
                size="small"
                startIcon={resending ? null : <RefreshIcon />}
                onClick={handleResendOTP}
                disabled={resending || timeLeft > 540} // Allow resend after 1 minute
                sx={{ textTransform: 'none' }}
              >
                {resending ? 'Sending...' : 'Resend Code'}
              </Button>
            </Box>
          </>
        )}

        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="text"
            onClick={onBack}
            disabled={loading}
            sx={{ textTransform: 'none' }}
          >
            Back to Registration
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
          Didn't receive the email? Check your spam folder or try resending
        </Typography>
      </CardContent>
    </Card>
  );
};

export default RegistrationOTPVerification;
