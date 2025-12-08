// src/components/customer/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ darkMode, setDarkMode, isScrolled }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Venue', path: '/venue' },
    { name: 'Booking', path: '/booking' },
  ];

  const handleNavClick = () => {
    window.scrollTo(0, 0);
    setMenuOpen(false);
  };

  // Entry Animation: Slides down after the preloader finishes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Theme Logic
  const theme = {
    // Dynamic text color based on menu state or scroll
    text: menuOpen 
      ? (darkMode ? 'text-stone-200' : 'text-stone-800') 
      : (isScrolled && !darkMode ? 'text-stone-900' : 'text-white'),
    
    // Menu Overlay Colors
    overlayBg: darkMode ? 'bg-[#1a1a1a]' : 'bg-[#F2F0EB]',
    overlayText: darkMode ? 'text-stone-200' : 'text-stone-800',
  };

  return (
    <>
      {/* --- Navbar Container --- */}
      <nav
        className={`fixed top-0 left-0 w-full z-50 py-6 transition-transform duration-[1000ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="w-full px-8 md:px-20 flex justify-between items-center">
          
          {/* --- Logo --- */}
          <Link 
            to="/" 
            className={`relative z-50 transition-colors duration-500 ${theme.text}`}
            onClick={handleNavClick} 
          >
            <h1 className="text-2xl md:text-3xl font-serif font-light tracking-widest uppercase cursor-pointer select-none">
              Mapo's
            </h1>
          </Link>

          {/* --- Right: Controls --- */}
          <div className={`flex items-center gap-6 z-50 transition-colors duration-500 ${theme.text}`}>
            
            {/* 1. Theme Toggle */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="w-10 h-10 flex items-center justify-center hover:opacity-60 transition-opacity duration-300"
            >
              {darkMode ? <Sun className="w-5 h-5" strokeWidth={1.5} /> : <Moon className="w-5 h-5" strokeWidth={1.5} />}
            </button>

            {/* 2. Hamburger (Fixed Uniformity) */}
            <button 
              onClick={() => setMenuOpen(!menuOpen)} 
              className="group w-10 h-10 flex flex-col justify-center items-center gap-[6px] hover:opacity-60 transition-opacity duration-300"
            >
               {/* Top Line */}
               <span 
                 className={`h-[1.5px] w-5 bg-current transform transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
                   menuOpen ? 'rotate-45 translate-y-[7.5px]' : ''
                 }`} 
               />
               
               {/* Middle Line */}
               <span 
                 className={`h-[1.5px] w-5 bg-current transform transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
                   menuOpen ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
                 }`} 
               />
               
               {/* Bottom Line */}
               <span 
                 className={`h-[1.5px] w-5 bg-current transform transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
                   menuOpen ? '-rotate-45 -translate-y-[7.5px]' : ''
                 }`} 
               />
            </button>
          </div>
        </div>
      </nav>

      {/* --- Menu Overlay (Animation based on Reference Code) --- */}
      <div 
        className={`fixed inset-0 h-screen w-screen ${theme.overlayBg} flex flex-col items-center justify-center z-40`}
        style={{
          // Logic: "ellipse(150% 150% at 50% 50%)" is OPEN (Fullscreen)
          // Logic: "ellipse(150% 100% at 50% -100%)" is CLOSED (Hidden Top)
          clipPath: menuOpen 
            ? 'ellipse(150% 150% at 50% 50%)' 
            : 'ellipse(150% 100% at 50% -100%)',
          transition: 'clip-path 1s cubic-bezier(0.76, 0, 0.24, 1)' 
        }}
      >
        <div className="flex flex-col items-center gap-6">
          {navLinks.map((item, i) => (
            <div key={item.name} className="overflow-hidden">
                <Link 
                  to={item.path} 
                  className={`block text-5xl md:text-7xl font-serif italic ${theme.overlayText} hover:text-[#C9A25D] transition-transform duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)]`}
                  style={{ 
                    // Staggered slide up/down inside the overlay
                    transform: menuOpen ? 'translateY(0)' : 'translateY(100%)',
                    transitionDelay: `${100 + (i * 50)}ms`
                  }} 
                  onClick={handleNavClick} 
                >
                  {item.name}
                </Link>
            </div>
          ))}
        </div>
        
        <div className={`absolute bottom-10 text-[10px] uppercase tracking-widest opacity-50 ${theme.overlayText} transition-opacity duration-700 delay-500 ${menuOpen ? 'opacity-50' : 'opacity-0'}`}>
           &copy; {new Date().getFullYear()} Mapo's Catering
        </div>
      </div>
    </>
  );
};

export default Navbar;