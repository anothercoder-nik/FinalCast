import React from 'react'
import { useSelector } from 'react-redux';
import { BentoGridDemo } from '../studio/bentogrid';
import { FloatingShapes } from '../utils/floating-shapers';
import { WobbleCardDemo } from '../studio/wobblecard';


const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  return (
    <div className=' max-w-7xl mx-auto'>
      <WobbleCardDemo/>
    </div>
  )
}

export default Dashboard

