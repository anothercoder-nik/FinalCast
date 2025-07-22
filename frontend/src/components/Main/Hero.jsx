import { useEffect, useRef, useState } from "react";
import Navbar from "../utils/Navbar";

const Hero = () => {
  const [showText, setShowText] = useState(true);
  const thirdDivRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!thirdDivRef.current) return;
      const rect = thirdDivRef.current.getBoundingClientRect();
      // Hide the text as soon as the top of the third div reaches the top of the viewport
      if (rect.top <= 0) {
        setShowText(false);
      } else {
        setShowText(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
    <div className="w-full h-[300vh]">
      <div className="relative w-full h-screen overflow-hidden">
         
        <video
          className="absolute top-0 left-0 w-full object-cover z-0 backdrop-blur-10xl"
          src="/video.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
         
        {showText && (
          <div className="fixed inset-0 flex items-center justify-center z-10">
            <h1 className="text-[#F3E9DC] text-5xl font-bold text-center">Record. Render. Release.</h1>
          </div>
        )}

        </div>
        <div className="bg-[#F3E9DC] h-[50vh] w-full"></div>
        <div ref={thirdDivRef} className="bg-zinc-700 h-100vh w-full"></div>
      </div>
    </>
  );
};

export default Hero;
