// src/pages/Customer/Venue.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUp, MapPin, Users, Maximize, Wifi, 
  Music, Coffee, ArrowRight, Star 
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
      { threshold: 0.15 }
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

const Venue = () => {
  const navigate = useNavigate();
   const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  
  // --- Slide & Scroll Logic States ---
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [navIsScrolled, setNavIsScrolled] = useState(false); // Track mobile scrolling
  
  // Refs
  const containerRef = useRef(null);
  const sectionRefs = useRef([]);
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

    // Desktop: Custom Smooth Scroll
    if (window.innerWidth >= 768) {
      setIsScrolling(true);
      const targetSection = sectionRefs.current[index];
      const targetTop = targetSection.offsetTop;
      smoothScrollTo(targetTop, 1000); // 1 second duration
    } else {
      // Mobile: Native scroll
      sectionRefs.current[index].scrollIntoView({ behavior: 'smooth' });
    }
  };

  // --- 3. DESKTOP: MOUSE WHEEL LISTENER ---
  useEffect(() => {
    const handleWheel = (e) => {
      if (window.innerWidth < 768) return; // Native scroll on mobile

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

  // --- 4. MOBILE: TOUCH LISTENERS (Swipe Logic) ---
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    // On mobile we prefer native scrolling, but we track swipes for updating activeIndex logic if needed
    // or for "snap" feel. Currently relying on Native Scroll for UX, 
    // but we track this to update activeIndex for 'Back to Top' visibility.
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY.current - touchEndY;
    
    if (Math.abs(deltaY) > 50) {
      // Logic to guess next slide index could go here, 
      // but usually native scroll + IntersectionObserver is better for mobile index tracking.
      // For now, we rely on handleNativeScroll for navbar state.
    }
  };

  // Theme Helper
  const theme = {
    bg: darkMode ? 'bg-[#0c0c0c]' : 'bg-[#FAFAFA]',
    cardBg: darkMode ? 'bg-[#111]' : 'bg-white',
    text: darkMode ? 'text-stone-200' : 'text-stone-900',
    subText: darkMode ? 'text-stone-400' : 'text-stone-500',
    border: darkMode ? 'border-stone-800' : 'border-stone-200',
  };

  const venues = [
    {
      id: 1,
      name: "Palacios Event Place",
      capacity: "Up to 300 Guests",
      size: "4,500 sq. ft.",
      img: "/images/palacios.png",
      subImg: "/images/palacioslogo.png", 
      description: "Palacios Events Place offers a clean, elegant, and spacious venue perfect for weddings, parties, and special celebrations."
    },
    {
      id: 2,
      name: "La Veranda Events Hall",
      capacity: "Up to 150 Guests",
      size: "2,800 sq. ft.",
      img: "/images/laverandaa.png",
      subImg: "/images/laverandalogo.jpg", 
      description: "A cozy and beautifully curated events space, La Veranda is the ideal spot for small parties and special occasions."
    },
    {
      id: 3,
      name: "Tenorio's Events Place",
      capacity: "Up to 50 Guests",
      size: "1,200 sq. ft.",
      img: "/images/tenorios.png",
      subImg: "/images/tenorioslogo.jpg", 
      description: "Your exclusive getaway for family celebrations, team gatherings, and special occasions. Relax, celebrate, and create memories here at Tenorio's!"
    }
  ];

  return (
    <div 
      ref={containerRef}
      onScroll={handleNativeScroll} // 5. Attach Native Scroll Listener
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`h-screen w-full font-sans antialiased transition-colors duration-500 ${theme.bg} ${theme.text} selection:bg-[#C9A25D] selection:text-white overflow-y-scroll md:overflow-hidden`}
    >
      
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap');
          .font-serif { font-family: 'Cormorant Garamond', serif; }
          .font-sans { font-family: 'Inter', sans-serif; }
        `}
      </style>

      {/* 6. Navbar Logic: Solid if Desktop Slide > 0 OR Mobile Scroll > 50px */}
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} isScrolled={activeIndex > 0 || navIsScrolled} />

      {/* --- 0. Hero Section (Slide 0) --- */}
      <header 
        ref={addToRefs}
        className="relative h-screen w-full overflow-hidden bg-stone-900 flex flex-col justify-center items-center"
      >
        <div className="absolute inset-0 w-full h-full z-0">
          <img 
            src="https://images.pexels.com/photos/3835638/pexels-photo-3835638.jpeg?auto=compress&cs=tinysrgb&w=1600" 
            alt="Venue Architecture" 
            className="w-full h-full object-cover opacity-50 animate-[pulse_15s_infinite_ease-in-out]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/60 via-stone-900/20 to-stone-900/90"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto mt-10">
          <FadeIn>
            <span className="text-[#C9A25D] text-xs md:text-sm tracking-[0.3em] uppercase font-medium mb-6 block">
              Our Spaces
            </span>
            <h1 className="font-serif text-5xl md:text-7xl text-white leading-none mb-6 font-thin">
              Timeless <span className="italic">Architecture</span>
            </h1>
            <p className="text-white/80 text-sm md:text-base max-w-lg mx-auto font-light leading-relaxed tracking-wide">
              Discover settings that inspire. From historic ballrooms to modern garden escapes, 
              we provide the canvas for your masterpiece.
            </p>
          </FadeIn>
        </div>

        {/* Scroll Indicator */}
        <div 
          onClick={() => scrollToSection(1)}
          className="absolute bottom-10 w-full flex flex-col items-center justify-center gap-3 opacity-80 animate-bounce z-10 cursor-pointer hover:opacity-100"
        >
          <span className="text-[9px] text-white tracking-[0.4em] uppercase">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent"></div>
        </div>
      </header>

      {/* --- Venues Loop (Slides 1, 2, 3) --- */}
      {venues.map((venue, index) => (
        <section 
          key={venue.id} 
          ref={addToRefs}
          className={`min-h-screen md:h-screen flex flex-col justify-center py-20 ${theme.bg}`}
        >
          <div className="max-w-screen-xl mx-auto px-6 w-full">
            <div className={`flex flex-col md:flex-row gap-16 md:gap-20 items-center group ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
              
              {/* DYNAMIC IMAGE SIDE */}
              <div className="w-full md:w-1/2 relative flex justify-center">
                <FadeIn delay={100}>
                  <div 
                    onClick={() => navigate('/booking')}
                    className="relative w-[90%] aspect-[4/5] cursor-pointer"
                  >
                    {/* DECORATIVE BORDER */}
                    <div className={`absolute inset-0 border border-[#C9A25D]/50 z-0 transition-transform duration-500 ease-out
                      ${index % 2 === 0 
                        ? '-translate-x-5 -translate-y-5 group-hover:-translate-x-3 group-hover:-translate-y-3' 
                        : 'translate-x-5 -translate-y-5 group-hover:translate-x-3 group-hover:-translate-y-3'
                      }
                    `}></div>

                    {/* MAIN IMAGE */}
                    <div className="relative z-10 w-full h-full overflow-hidden shadow-2xl bg-stone-200">
                      <img 
                        src={venue.img} 
                        alt={venue.name} 
                        className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110 grayscale-[10%] group-hover:grayscale-0"
                      />
                    </div>

                    {/* FLOATING DETAIL IMAGE */}
                    <div className={`absolute -bottom-8 -right-4 md:-right-10 w-40 h-40 md:w-52 md:h-52 z-20 overflow-hidden shadow-2xl border-4 ${darkMode ? 'border-[#0c0c0c]' : 'border-[#FAFAFA]'} transition-transform duration-700 ease-out group-hover:-translate-y-4 ${index % 2 === 1 ? 'right-auto -left-4 md:-left-10' : ''}`}>
                      <img 
                        src={venue.subImg} 
                        alt="Detail" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </FadeIn>
              </div>

              {/* TEXT CONTENT SIDE */}
              <div className="w-full md:w-1/2">
                <FadeIn delay={300}>
                  <div className="flex items-center gap-2 mb-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700">
                    <Star className="w-4 h-4 text-[#C9A25D] fill-current" />
                    <span className={`text-xs tracking-[0.2em] uppercase ${theme.subText}`}>Premium Space</span>
                  </div>

                  <h2 
                    onClick={() => navigate('/booking')}
                    className={`font-serif text-5xl md:text-6xl ${theme.text} mb-6 cursor-pointer hover:text-[#C9A25D] transition-colors`}
                  >
                    {venue.name}
                  </h2>
                  <p className={`${theme.subText} leading-relaxed mb-10 font-light text-lg max-w-md`}>
                    {venue.description}
                  </p>
                  
                  {/* Specs Grid */}
                  <div className={`grid grid-cols-2 gap-8 border-t ${theme.border} pt-8 mb-10`}>
                    <div>
                      <span className={`text-xs tracking-[0.2em] uppercase ${theme.subText} block mb-3`}>Capacity</span>
                      <div className={`flex items-center ${theme.text}`}>
                        <Users className="w-5 h-5 mr-3 text-[#C9A25D]" />
                        <span className="font-serif text-xl">{venue.capacity}</span>
                      </div>
                    </div>
                    <div>
                      <span className={`text-xs tracking-[0.2em] uppercase ${theme.subText} block mb-3`}>Dimensions</span>
                      <div className={`flex items-center ${theme.text}`}>
                        <Maximize className="w-5 h-5 mr-3 text-[#C9A25D]" />
                        <span className="font-serif text-xl">{venue.size}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate('/booking')}
                    className={`group flex items-center gap-3 text-xs tracking-[0.25em] uppercase font-bold ${theme.text} hover:text-[#C9A25D] transition-colors`}
                  >
                    Book This Space
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                  </button>
                </FadeIn>
              </div>

            </div>
          </div>
        </section>
      ))}

      {/* --- Amenities Section (Slide 4) --- */}
      <section 
        ref={addToRefs}
        className={`min-h-screen md:h-screen flex flex-col justify-center py-20 md:py-32 ${theme.cardBg} border-t ${theme.border}`}
      >
        <div className="max-w-screen-xl mx-auto px-6 text-center w-full">
          <FadeIn>
            <h2 className={`font-serif text-3xl md:text-4xl ${theme.text} mb-16`}>Included Amenities</h2>
          </FadeIn>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { icon: Wifi, title: "High-Speed WiFi", desc: "Seamless connectivity for all guests." },
              { icon: Music, title: "Premium Audio", desc: "Integrated Bose sound systems." },
              { icon: MapPin, title: "Valet Parking", desc: "Complimentary service on arrival." },
              { icon: Coffee, title: "Private Suite", desc: "Exclusive green room for hosts." }
            ].map((item, idx) => (
              <FadeIn key={idx} delay={idx * 100}>
                <div className="flex flex-col items-center group">
                  <div className={`w-12 h-12 mb-6 flex items-center justify-center rounded-full ${darkMode ? 'bg-stone-800 text-white' : 'bg-stone-50 text-stone-900'} group-hover:bg-[#C9A25D] group-hover:text-white transition-colors duration-500`}>
                    <item.icon strokeWidth={1} className="w-5 h-5" />
                  </div>
                  <h3 className={`font-serif text-xl ${theme.text} mb-2`}>{item.title}</h3>
                  <p className={`text-xs ${theme.subText} tracking-wide`}>{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* --- Tour CTA (Slide 5) --- */}
      <section 
        ref={addToRefs}
        className={`min-h-screen md:h-screen flex flex-col justify-center py-20 md:py-32 ${theme.bg} relative`}
      >
        <div className="max-w-screen-md mx-auto px-6 text-center w-full">
          <FadeIn>
            <h2 className={`font-serif text-4xl md:text-6xl ${theme.text} mb-6`}>
              Experience it in Person
            </h2>
            <p className={`${theme.subText} mb-10 max-w-lg mx-auto font-light`}>
              Schedule a private tour with our venue coordinator to visualize your event in our spaces.
            </p>
            <button 
              onClick={() => navigate('/booking')}
              className={`px-12 py-4 ${darkMode ? 'bg-white text-stone-900 hover:bg-[#C9A25D] hover:text-white' : 'bg-stone-900 text-white hover:bg-[#C9A25D]'} text-xs tracking-[0.25em] uppercase font-bold shadow-xl transition-all duration-300`}
            >
              Schedule a Tour
            </button>
          </FadeIn>
        </div>
      </section>

      {/* --- Footer (Slide 6) --- */}
      <div ref={addToRefs} className="h-auto">
        <Footer darkMode={darkMode} />
      </div>

      {/* --- Back to Top --- */}
      <button 
        onClick={() => scrollToSection(0)}
        className={`fixed bottom-8 right-8 p-3 ${darkMode ? 'bg-stone-800/50 border-stone-700 hover:bg-white hover:text-stone-900' : 'bg-white/10 border-stone-200 hover:bg-stone-900 hover:text-white'} backdrop-blur-md border rounded-full shadow-lg transition-all duration-500 z-50 ${
          (activeIndex > 0 || navIsScrolled) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        <ArrowUp className="w-5 h-5" strokeWidth={1.5} />
      </button>
    </div>
  );
};

export default Venue;