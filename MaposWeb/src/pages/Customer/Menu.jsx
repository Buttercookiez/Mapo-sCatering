// src/pages/Customer/Menu.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, Leaf, Wheat, Star, ArrowUp 
} from 'lucide-react';
import Navbar from '../../components/customer/Navbar';
import Footer from '../../components/customer/Footer';

// --- Minimalist Animation Wrapper ---
const FadeIn = ({ children, delay = 0, direction = 'up' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  const translateClass = direction === 'up' ? 'translate-y-10' : 'translate-x-0';

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : `opacity-0 ${translateClass}`
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const Menu = () => {
  const navigate = useNavigate();
   const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [activeCategory, setActiveCategory] = useState("All");

  // --- Slide & Scroll Logic States ---
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [navIsScrolled, setNavIsScrolled] = useState(false); // Track mobile scrolling

  // Refs
  const containerRef = useRef(null);
  const sectionRefs = useRef([]);
  const menuListRef = useRef(null);
  const touchStartY = useRef(0);

  // Helper to track slides
  const addToRefs = (el) => {
    if (el && !sectionRefs.current.includes(el)) {
      sectionRefs.current.push(el);
    }
  };

  // --- Dark Mode Logic ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark'); // Save preference
      document.body.style.backgroundColor = '#0c0c0c';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light'); // Save preference
      document.body.style.backgroundColor = '#FAFAFA';
    }
  }, [darkMode]);

  // --- 1. NATIVE SCROLL HANDLER (Fixes Mobile Navbar) ---
  const handleNativeScroll = (e) => {
    const scrollTop = e.currentTarget.scrollTop;
    // If we scroll down more than 50px on mobile, turn navbar solid
    setNavIsScrolled(scrollTop > 50);
  };

  // --- 2. CUSTOM SMOOTH SCROLL ENGINE (Desktop) ---
  const easeInOutCubic = (t) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const smoothScrollTo = (targetPosition, duration) => {
    const container = containerRef.current;
    if (!container) return;

    const startPosition = container.scrollTop;
    const distance = targetPosition - startPosition;
    let startTime = null;

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      container.scrollTop = startPosition + (distance * ease);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        setIsScrolling(false);
      }
    };

    requestAnimationFrame(animation);
  };

  const scrollToSection = (index) => {
    if (index < 0 || index >= sectionRefs.current.length) return;
    
    setActiveIndex(index);

    if (window.innerWidth >= 768) {
      setIsScrolling(true);
      const targetSection = sectionRefs.current[index];
      smoothScrollTo(targetSection.offsetTop, 1000); 
    } else {
      sectionRefs.current[index].scrollIntoView({ behavior: 'smooth' });
    }
  };

  // --- 3. INTELLIGENT MOUSE WHEEL HANDLER ---
  useEffect(() => {
    const handleWheel = (e) => {
      if (window.innerWidth < 768) return;

      const isMenuScroll = e.target.closest('.menu-scroll-container');
      
      if (isMenuScroll && menuListRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = menuListRef.current;
        const isAtTop = scrollTop === 0;
        const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 2;

        if (e.deltaY > 0 && !isAtBottom) return; 
        if (e.deltaY < 0 && !isAtTop) return;
      }

      e.preventDefault();
      if (isScrolling) return;

      const direction = e.deltaY > 0 ? 1 : -1;
      const nextIndex = Math.min(
        Math.max(activeIndex + direction, 0), 
        sectionRefs.current.length - 1
      );

      if (nextIndex !== activeIndex) {
        scrollToSection(nextIndex);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [activeIndex, isScrolling]);

  // --- 4. TOUCH HANDLERS (Swipe Logic) ---
  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  
  const handleTouchEnd = (e) => {
    if (isScrolling) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY.current - touchEndY;

    const isMenuScroll = e.target.closest('.menu-scroll-container');
    if (isMenuScroll && menuListRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = menuListRef.current;
        const isAtTop = scrollTop === 0;
        const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 2;
        if (deltaY > 0 && !isAtBottom) return; 
        if (deltaY < 0 && !isAtTop) return;
    }

    if (Math.abs(deltaY) > 50) {
      const direction = deltaY > 0 ? 1 : -1;
      const nextIndex = Math.min(Math.max(activeIndex + direction, 0), sectionRefs.current.length - 1);
      if (nextIndex !== activeIndex) scrollToSection(nextIndex);
    }
  };

  const theme = {
    bg: darkMode ? 'bg-[#0c0c0c]' : 'bg-[#FAFAFA]',
    cardBg: darkMode ? 'bg-[#111]' : 'bg-white',
    text: darkMode ? 'text-stone-200' : 'text-stone-900',
    subText: darkMode ? 'text-stone-400' : 'text-stone-500',
    border: darkMode ? 'border-stone-800' : 'border-stone-200',
    accent: 'text-[#C9A25D]',
  };

  const categories = ["All", "Appetizers", "Entrées", "Sides", "Desserts", "Cocktails"];
  
  const menuItems = [
    { id: 1, category: "Appetizers", name: "Truffle Arancini", description: "Wild mushroom risotto, white truffle oil, parmesan crisp.", tags: ["v"], price: "Start" },
    { id: 2, category: "Appetizers", name: "Hokkaido Scallop Crudo", description: "Yuzu vinaigrette, shaved radish, micro cilantro, chili oil.", tags: ["gf"], price: "Cold" },
    { id: 3, category: "Entrées", name: "24-Hour Short Rib", description: "Braised angus beef, pomme purée, glazed heirloom carrots, red wine reduction.", tags: ["gf"], price: "Sig" },
    { id: 4, category: "Entrées", name: "Miso Glazed Black Cod", description: "Sustainably sourced cod, bok choy, ginger dashi broth.", tags: ["pesc"], price: "Sea" },
    { id: 5, category: "Entrées", name: "Wild Mushroom Wellington", description: "Portobello, spinach, chestnut farce, puff pastry, thyme jus.", tags: ["v", "vg"], price: "Earth" },
    { id: 6, category: "Desserts", name: "Dark Chocolate Ganache", description: "70% Valrhona chocolate, sea salt, raspberry coulis, gold leaf.", tags: ["v"], price: "Sweet" },
    { id: 7, category: "Cocktails", name: "The Gilded Old Fashioned", description: "Japanese whisky, smoked maple syrup, angostura, orange peel.", tags: [], price: "Bar" },
    { id: 8, category: "Sides", name: "Charred Broccolini", description: "Garlic confit, lemon zest, toasted almonds.", tags: ["vg", "gf"], price: "Side" }
  ];

  const filteredItems = activeCategory === "All" ? menuItems : menuItems.filter(item => item.category === activeCategory);

  return (
    <div 
      ref={containerRef}
      onScroll={handleNativeScroll} // Detect mobile scroll for Navbar
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`h-screen w-full font-sans antialiased transition-colors duration-500 ${theme.bg} ${theme.text} selection:bg-[#C9A25D] selection:text-white overflow-y-scroll md:overflow-hidden`}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap');
        .font-serif { font-family: 'Cormorant Garamond', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Navbar Logic: Turns black if slide > 0 OR mobile scroll > 50px */}
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} isScrolled={activeIndex > 0 || navIsScrolled} />

      {/* --- Slide 0: Hero --- */}
      <header ref={addToRefs} className="relative h-screen w-full overflow-hidden flex flex-col justify-center items-center bg-stone-900">
        <div className="absolute inset-0">
            <img src="https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="Plating Art" className="w-full h-full object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40"></div>
        </div>
        <div className="relative z-10 text-center px-6">
            <FadeIn>
                <span className={`${theme.accent} text-xs tracking-[0.3em] uppercase font-medium mb-4 block`}>Season 2025</span>
                <h1 className="font-serif text-5xl md:text-7xl text-white font-thin tracking-tight">Culinary Collections</h1>
            </FadeIn>
        </div>
        <div onClick={() => scrollToSection(1)} className="absolute bottom-10 w-full flex flex-col items-center justify-center gap-3 opacity-80 animate-bounce z-10 cursor-pointer hover:opacity-100">
          <span className="text-[9px] text-white tracking-[0.4em] uppercase">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent"></div>
        </div>
      </header>

      {/* --- Slide 1: Menu (Flicker-Free) --- */}
      <section ref={addToRefs} className={`h-screen flex flex-col pt-24 pb-0 ${theme.bg} transition-colors duration-500`}>
        
        {/* FIXED HEADER */}
        <div className={`w-full py-4 md:py-6 border-b ${theme.border} flex-shrink-0`}>
          <div className="max-w-screen-xl mx-auto px-0 md:px-6">
              <div className="overflow-x-auto no-scrollbar px-6">
                  <div className="flex justify-start md:justify-center items-center gap-6 md:gap-12 min-w-max">
                      {categories.map((cat) => (
                          <button key={cat} onClick={() => setActiveCategory(cat)} className={`text-xs md:text-sm tracking-[0.2em] uppercase transition-all duration-300 pb-1 border-b-2 whitespace-nowrap ${activeCategory === cat ? `text-[#C9A25D] border-[#C9A25D]` : `${theme.subText} border-transparent hover:${theme.text}`}`}>
                              {cat}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div ref={menuListRef} className="flex-grow overflow-y-auto no-scrollbar menu-scroll-container">
            <div className="max-w-screen-lg mx-auto px-6 py-10 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 pb-20">
                    {filteredItems.map((item, idx) => (
                        <FadeIn key={item.id} delay={idx * 50}>
                            <div className="group">
                                <div className="flex justify-between items-baseline mb-2">
                                    <h3 className={`font-serif text-2xl md:text-3xl ${theme.text} group-hover:text-[#C9A25D] transition-colors duration-300`}>{item.name}</h3>
                                    <div className={`flex-grow mx-4 border-b border-dotted ${darkMode ? 'border-stone-700' : 'border-stone-300'} opacity-50 relative -top-1`}></div>
                                    <span className={`font-sans text-xs font-medium tracking-wider uppercase ${theme.subText}`}>{item.price}</span>
                                </div>
                                <p className={`${theme.subText} font-light text-sm leading-relaxed mb-3`}>{item.description}</p>
                                <div className="flex gap-3">
                                    {item.tags.includes('v') && <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-green-600/70"><Leaf className="w-3 h-3" /> Veg</span>}
                                    {item.tags.includes('gf') && <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-600/70"><Wheat className="w-3 h-3" /> GF</span>}
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </div>
      </section>

      {/* --- Slide 2: Seasonal --- */}
      <section ref={addToRefs} className="relative h-screen bg-fixed bg-center bg-cover flex items-center justify-center" style={{ backgroundImage: "url('https://images.pexels.com/photos/5638268/pexels-photo-5638268.jpeg?auto=compress&cs=tinysrgb&w=1600')" }}>
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 max-w-screen-md mx-auto px-6 text-center text-white">
            <FadeIn>
                <Star className="w-8 h-8 text-[#C9A25D] mx-auto mb-6" />
                <h2 className="font-serif text-4xl md:text-6xl mb-6">Chef's Table Experience</h2>
                <p className="font-light text-lg md:text-xl text-white/90 mb-10 leading-relaxed">
                    An intimate 7-course tasting menu featuring rare ingredients and wine pairings.
                </p>
                <button onClick={() => navigate('/booking')} className="bg-[#C9A25D] text-white px-10 py-4 text-xs tracking-[0.2em] uppercase hover:bg-white hover:text-stone-900 transition-all duration-300">Inquire Availability</button>
            </FadeIn>
        </div>
      </section>

      {/* --- Slide 3: CTA --- */}
      <section ref={addToRefs} className={`h-screen flex flex-col justify-center py-20 ${theme.cardBg} border-t ${theme.border} transition-colors duration-500`}>
        <div className="max-w-screen-md mx-auto px-6 text-center">
            <FadeIn>
                <h3 className={`font-serif text-3xl ${theme.text} mb-4`}>Planning an Event?</h3>
                <div className="flex flex-col md:flex-row justify-center gap-4 mt-8">
                    <button className={`flex items-center justify-center gap-3 px-8 py-4 border ${theme.border} ${theme.text} hover:border-[#C9A25D] hover:text-[#C9A25D] transition-all duration-300 uppercase text-xs tracking-widest`}><Download className="w-4 h-4" /> Wedding Packages</button>
                    <button className={`flex items-center justify-center gap-3 px-8 py-4 border ${theme.border} ${theme.text} hover:border-[#C9A25D] hover:text-[#C9A25D] transition-all duration-300 uppercase text-xs tracking-widest`}><Download className="w-4 h-4" /> Corporate Menu</button>
                </div>
            </FadeIn>
        </div>
      </section>

      {/* --- Slide 4: Footer --- */}
      <div ref={addToRefs} className="h-auto">
        <Footer darkMode={darkMode} />
      </div>

      {/* --- Back to Top --- */}
      <button onClick={() => scrollToSection(0)} className={`fixed bottom-8 right-8 p-3 ${darkMode ? 'bg-stone-800/50 border-stone-700 hover:bg-white hover:text-stone-900' : 'bg-white/10 border-stone-200 hover:bg-stone-900 hover:text-white'} backdrop-blur-md border rounded-full shadow-lg transition-all duration-500 z-50 ${activeIndex > 0 || navIsScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <ArrowUp className="w-5 h-5" strokeWidth={1.5} />
      </button>
    </div>
  );
};

export default Menu;