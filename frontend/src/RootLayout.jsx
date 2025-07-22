import { Outlet } from '@tanstack/react-router';
import Navbar from './components/Navbar';

function RootLayout() {
  return (
   <div className="min-h-screen flex flex-col bg-gray-100">
    <Navbar/>
      <div className="flex-grow py-8">
        <Outlet />
      </div>
    </div>
  );
}

export default RootLayout