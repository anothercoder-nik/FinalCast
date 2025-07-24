import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from '@tanstack/react-router';
import { getCurrentUser } from '../api/user.api.js';
import { login } from '../store/slice/authslice.js';

export default function AuthCallback() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const user = await getCurrentUser();
        dispatch(login(user));
        navigate({ to: '/' });
      } catch (error) {
        console.error('Auth callback failed:', error);
        navigate({ to: '/auth' });
      }
    };

    handleCallback();
  }, [dispatch, navigate]);

  return <div>Completing sign in...</div>;
}