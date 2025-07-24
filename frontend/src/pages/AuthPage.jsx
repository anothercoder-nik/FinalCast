import React, { useState, useEffect } from 'react'
import { useSearch } from '@tanstack/react-router'
import LoginForm from '../components/Forms/LoginForm.jsx'
import RegisterForm from '../components/Forms/RegisterForm.jsx';
import { FloatingShapes } from '../components/utils/floating-shapers.jsx';

const AuthPage = () => {
  const search = useSearch({ from: '/auth' });
  const [login, setLogin] = useState(search?.mode !== 'signup');

  
  useEffect(() => {
    setLogin(search?.mode !== 'signup');
  }, [search]);

  return (
    <>
     <FloatingShapes />
      {login ? <LoginForm state={setLogin} /> : <RegisterForm state={setLogin} />}
    </>
  )
}

export default AuthPage
