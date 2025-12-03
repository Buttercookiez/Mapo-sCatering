// src/components/customer/Navbar.jsx
import React, { useState } from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = ({ darkMode, setDarkMode, isScrolled }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const theme = {
    // When menu is open, force transparent bg for nav header so it blends with overlay
    navBg: mobileMenuOpen 
      ? 'bg-transparent' 
      : (isScrolled ? (darkMode ? 'bg-[#0c0c0c]/90' : 'bg-white/90') : 'bg-transparent'),
    
    navText: (isScrolled || mobileMenuOpen) ? (darkMode ? 'text-stone-100' : 'text-stone-900') : 'text-white',
    
    navBorder: (isScrolled && !mobileMenuOpen) ? (darkMode ? 'border-stone-800' : 'border-stone-200') : 'border-transparent',
    
    // Overlay colors
    overlayBg: darkMode ? 'bg-[#0c0c0c]' : 'bg-[#FAFAFA]',
    mobileOverlayText: darkMode ? 'text-stone-200' : 'text-stone-900',
  };

  // Navigation Links Configuration
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Venue', path: '/venue' },
    { name: 'Booking', path: '/booking' },
  ];

  // --- Helper: Scroll to top and close menu ---
  const handleNavClick = () => {
    window.scrollTo(0, 0);      // Scrolls to top immediately
    setMobileMenuOpen(false);   // Closes mobile menu if open
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 border-b py-4 backdrop-blur-md ${theme.navBg} ${theme.navText} ${theme.navBorder}`}
    >
      <div className="max-w-screen-xl mx-auto px-6 md:px-12 flex justify-between items-center relative z-50">
        
        {/* Logo */}
        <Link 
          to="/" 
          className="group" 
          onClick={handleNavClick} 
        >
          <h1 className="text-2xl md:text-3xl font-serif font-light tracking-[0.15em] uppercase cursor-pointer">
            Mapo's
          </h1>
        </Link>

        {/* Desktop Menu */}
        <div className={`hidden md:flex items-center gap-12 text-xs tracking-[0.2em] uppercase font-medium ${!isScrolled ? 'text-white/90' : 'text-stone-500'}`}>
          {navLinks.filter(l => l.name !== 'Home').map((link) => (
             <Link 
               key={link.name} 
               to={link.path} 
               onClick={() => window.scrollTo(0, 0)} // Scroll top on desktop click
               className="hover:text-[#C9A25D] transition-colors duration-300 relative group"
             >
              {link.name}
              <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-[#C9A25D] transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Dark Mode Toggle */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full transition-colors duration-300 cursor-pointer ${
              (isScrolled || mobileMenuOpen)
                ? (darkMode ? 'hover:bg-stone-800 text-white' : 'hover:bg-stone-100 text-stone-900') 
                : 'hover:bg-white/20 text-white'
            }`}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Mobile Menu Toggle Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className={`md:hidden p-1 transition-transform duration-300 ${mobileMenuOpen ? 'rotate-90' : 'rotate-0'}`}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 h-screen w-screen ${theme.overlayBg} flex flex-col items-center justify-center space-y-10 transition-all duration-500 ease-in-out transform ${mobileMenuOpen ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-full pointer-events-none'} md:hidden z-40`}
      >
        {navLinks.map((item) => (
          <Link 
            key={item.name} 
            to={item.path} 
            className={`text-4xl font-serif font-light italic ${theme.mobileOverlayText} hover:text-[#C9A25D] transition-colors duration-300`} 
            onClick={handleNavClick} 
          >
            {item.name}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;