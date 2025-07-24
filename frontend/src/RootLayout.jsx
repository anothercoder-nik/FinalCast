import { Outlet } from '@tanstack/react-router';
import Navbar from '../src/components/utils/Navbar.jsx';
import { FloatingShapes } from './components/utils/floating-shapers.jsx';

function RootLayout() {
  return (
<div className="min-h-screen  bg-stone-950 text-white overflow-x-hidden pt-36">
  <FloatingShapes/>
      <Navbar />
     <div className="flex-grow">
        <Outlet />
      </div>
      </div>
  );
}

export default RootLayout