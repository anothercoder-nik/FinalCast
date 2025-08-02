import React from 'react'
import { useSelector } from 'react-redux';
import { BentoGridDemo } from '../studio/bentogrid';
import { FloatingShapes } from '../utils/floating-shapers';
import { WobbleCardDemo } from '../studio/wobblecard';
import Navbar from '../utils/Navbar';


const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  return (
    <div className=' max-w-7xl mx-auto'>
      <FloatingShapes/>
      <Navbar/>
      <WobbleCardDemo/>
    </div>
  )
}

export default Dashboard

