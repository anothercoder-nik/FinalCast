import { Outlet } from '@tanstack/react-router';
import Navbar from '../src/components/utils/Navbar.jsx';

function RootLayout() {
  return (

     <div className="flex-grow">
        <Outlet />
      </div>
  );
}

export default RootLayout