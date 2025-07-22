import React, { useEffect, useState } from 'react';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 border-r-2
        ${scrolled
          ? "bg-black/90 shadow-md"
          : "bg-transparent"
        }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center text-white">
        <h1 className="text-lg font-bold">MySite</h1>
        <ul className="flex gap-6">
          <li className="hover:underline">Home</li>
          <li className="hover:underline">About</li>
          <li className="hover:underline">Contact</li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
