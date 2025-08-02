import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from '@tanstack/react-router';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MuiCard from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { getApiUrl } from '../../../utils/config.js';
import ForgotPassword from './ForgotPassword';
import { GoogleIcon, FacebookIcon, SitemarkIcon } from './CustomIcons';
import { loginUser } from '../../../api/user.api.js';
import { login } from '../../../store/slice/authslice.js';
import TwoFactorLogin from '../../auth/TwoFactorLogin.jsx';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: {
    width: '450px',
  },
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

export default function SignInCard({ redirectTo }) {
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [showTwoFactor, setShowTwoFactor] = React.useState(false);
  const [loginCredentials, setLoginCredentials] = React.useState({ email: '', password: '' });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    const data = new FormData(event.currentTarget);
    const email = data.get('email');
    const password = data.get('password');
    
    try {
      const response = await loginUser(email, password);
      
      // Check if 2FA is required
      if (response.requires2FA) {
        setLoginCredentials({ email, password });
        setShowTwoFactor(true);
        setLoading(false);
        return;
      }
      
      // Store token in localStorage for persistence
      if (response.token) {
        localStorage.setItem('accessToken', response.token);
      }
      
      dispatch(login({
        user: response.user,
        token: response.token
      }));
      
      // Use redirect parameter if provided, otherwise go to dashboard
      const destination = redirectTo || '/dashboard';
      console.log('🎯 Redirecting user to:', destination);
      navigate({ to: destination });
    } catch (error) {
      console.error('Login failed:', error);
      setEmailError(true);
      setEmailErrorMessage(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASuccess = (response, redirectTarget) => {
    // Store token in localStorage for persistence
    if (response.token) {
      localStorage.setItem('accessToken', response.token);
    }
    
    dispatch(login({
      user: response.user,
      token: response.token
    }));
    
    // Use the passed redirect target or fallback to redirectTo prop or dashboard
    const destination = redirectTarget || redirectTo || '/dashboard';
    console.log('🎯 Redirecting user after 2FA to:', destination);
    navigate({ to: destination });
  };

  const handle2FABack = () => {
    setShowTwoFactor(false);
    setLoginCredentials({ email: '', password: '' });
  };

  const handleGoogleLogin = () => {
    // Include redirect parameter in Google OAuth flow
    let oauthUrl = `${getApiUrl()}/api/auth/google`;
    if (redirectTo) {
      oauthUrl += `?redirect=${encodeURIComponent(redirectTo)}`;
    }
    
    window.location.href = oauthUrl;
  };

  const validateInputs = () => {
    const email = document.getElementById('email');
    const password = document.getElementById('password');

    let isValid = true;

    if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  return (
    <>
      {showTwoFactor ? (
        <TwoFactorLogin 
          email={loginCredentials.email}
          password={loginCredentials.password}
          onSuccess={handle2FASuccess}
          onBack={handle2FABack}
          redirectTo={redirectTo}
        />
      ) : (
        <Card variant="outlined">
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <SitemarkIcon />
          </Box>
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            Sign in
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}
          >
            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField
                error={emailError}
                helperText={emailErrorMessage}
                id="email"
                type="email"
                name="email"
                placeholder="your@email.com"
                autoComplete="email"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={emailError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <FormLabel htmlFor="password">Password</FormLabel>
                <Link
                  component="button"
                  type="button"
                  onClick={handleClickOpen}
                  variant="body2"
                  sx={{ alignSelf: 'baseline' }}
                >
                  Forgot your password?
                </Link>
              </Box>
              <TextField
                error={passwordError}
                helperText={passwordErrorMessage}
                name="password"
                placeholder="••••••"
                type="password"
                id="password"
                autoComplete="current-password"
                required
                fullWidth
                variant="outlined"
                color={passwordError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControlLabel
              control={<Checkbox value="remember" color="primary" />}
              label="Remember me"
            />
            <ForgotPassword open={open} handleClose={handleClose} />
            <Button 
              type="submit" 
              fullWidth 
              variant="contained" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
            <Typography sx={{ textAlign: 'center' }}>
              Don&apos;t have an account?{' '}
              <span>
                <Link
                  component="button"
                  type="button"
                  onClick={() => navigate({ 
                    to: '/auth', 
                    search: { 
                      mode: 'signup', 
                      redirect: redirectTo 
                    } 
                  })}
                  
                  variant="body2"
                  sx={{ alignSelf: 'center' }}
                >
                  Sign up
                </Link>
              </span>
            </Typography>
          </Box>
          <Divider>or</Divider>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleLogin}
              startIcon={<GoogleIcon />}
            >
              Sign in with Google
            </Button>
          </Box>
        </Card>
      )}
    </>
  );
}
