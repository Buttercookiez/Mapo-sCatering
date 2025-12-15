// src/components/customer/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ darkMode, setDarkMode, isScrolled }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/', isExternal: false },
    { name: 'About', path: '/about', isExternal: false },
    { name: 'Venue', path: '/venue', isExternal: false },
    { 
      name: 'Booking', 
      path: 'https://www.facebook.com/maposcatering', 
      isExternal: true 
    },
  ];

  const handleNavClick = () => {
    if (!menuOpen) window.scrollTo(0, 0);
    setMenuOpen(false);
  };

  // Entry Animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Theme Logic
  const theme = {
    // UPDATED: When menu is open, make the top bar transparent so it blends with the overlay
    navBackground: menuOpen 
      ? 'bg-transparent' 
      : (isScrolled ? (darkMode ? 'bg-[#0c0c0c]/90' : 'bg-stone-50/90') : 'bg-transparent'),

    // Text color logic
    text: menuOpen 
      ? (darkMode ? 'text-stone-200' : 'text-stone-800') 
      : (isScrolled && !darkMode ? 'text-stone-900' : 'text-white'),
    
    // Overlay Text Color
    overlayText: darkMode ? 'text-stone-200' : 'text-stone-800',
  };

  return (
    <>
      {/* --- Navbar Container --- */}
      <nav
        // UPDATED: Changed py-6 to py-4 md:py-6 (Smaller height on mobile)
        className={`fixed top-0 left-0 w-full z-50 py-4 md:py-6 transition-all duration-[1000ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } ${theme.navBackground}`}
      >
        {/* UPDATED: Changed px-8 to px-6 md:px-20 (Slightly less padding on sides for mobile) */}
        <div className="w-full px-6 md:px-20 flex justify-between items-center">
          
          {/* --- Logo --- */}
          <Link 
            to="/" 
            className={`relative z-50 transition-colors duration-500 ${theme.text}`}
            onClick={() => {
              window.scrollTo(0, 0);
              setMenuOpen(false);
            }} 
          >
            {/* UPDATED: Changed text-2xl to text-xl md:text-3xl (Smaller logo text on mobile) */}
            <h1 className="text-xl md:text-3xl font-serif font-light tracking-widest uppercase cursor-pointer select-none">
              Mapo's
            </h1>
          </Link>

          {/* --- Right: Controls --- */}
          {/* UPDATED: Changed gap-6 to gap-4 md:gap-6 (Closer together on mobile) */}
          <div className={`flex items-center gap-4 md:gap-6 z-50 transition-colors duration-500 ${theme.text}`}>
            
            {/* 1. Theme Toggle */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="w-10 h-10 flex items-center justify-center hover:opacity-60 transition-opacity duration-300"
            >
              {darkMode ? <Sun className="w-5 h-5" strokeWidth={1.5} /> : <Moon className="w-5 h-5" strokeWidth={1.5} />}
            </button>

            {/* 2. Hamburger */}
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

      {/* --- Menu Overlay --- */}
      <div 
        className="fixed inset-0 h-[100dvh] w-screen flex flex-col items-center justify-center z-40"
        style={{
          // FORCE BACKGROUND COLOR HERE TO BYPASS APP.CSS
          backgroundColor: darkMode ? '#0c0c0c' : '#FAFAFA', 
          
          // Animation Logic
          clipPath: menuOpen 
            ? 'ellipse(150% 150% at 50% 50%)' 
            : 'ellipse(150% 100% at 50% -100%)',
          transition: 'clip-path 1s cubic-bezier(0.76, 0, 0.24, 1)' 
        }}
      >
        <div className="flex flex-col items-center gap-6">
          {navLinks.map((item, i) => {
            const commonClasses = `block text-5xl md:text-7xl font-serif italic ${theme.overlayText} hover:text-[#C9A25D] transition-transform duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)]`;
            const commonStyles = {
               transform: menuOpen ? 'translateY(0)' : 'translateY(100%)',
               transitionDelay: `${100 + (i * 50)}ms`
            };

            return (
              <div key={item.name} className="overflow-hidden">
                {item.isExternal ? (
                  /* External Link */
                  <a 
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={commonClasses}
                    style={commonStyles}
                    onClick={handleNavClick}
                  >
                    {item.name}
                  </a>
                ) : (
                  /* Internal Link */
                  <Link 
                    to={item.path} 
                    className={commonClasses}
                    style={commonStyles}
                    onClick={() => {
                      window.scrollTo(0, 0);
                      handleNavClick();
                    }} 
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
        
        <div className={`absolute bottom-10 text-[10px] uppercase tracking-widest opacity-50 ${theme.overlayText} transition-opacity duration-700 delay-500 ${menuOpen ? 'opacity-50' : 'opacity-0'}`}>
           &copy; {new Date().getFullYear()} Mapo's Catering
        </div>
      </div>
    </>
  );
};

export default Navbar;