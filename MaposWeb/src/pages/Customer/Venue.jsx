// src/pages/Customer/Venue.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUp, MapPin, Users, Maximize, Wifi, 
  Music, Coffee, ArrowRight, Star 
} from 'lucide-react';
import Navbar from '../../components/customer/Navbar';
import Footer from '../../components/customer/Footer';

// --- ANIMATION COMPONENTS ---

// 1. Staggered Text Reveal
const StaggeredText = ({ text, className = "", delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 } 
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, []);

  const words = text.split(" ");

  return (
    <span ref={ref} className={`inline-block ${className} leading-tight`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom mr-[0.25em]">
          <span
            className={`inline-block transition-transform duration-[1000ms] ease-[cubic-bezier(0.76,0,0.24,1)] will-change-transform ${
              isVisible ? 'translate-y-0' : 'translate-y-[110%]'
            }`}
            style={{ transitionDelay: isVisible ? `${delay + (i * 30)}ms` : '0ms' }}
          >
            {word}
          </span>
        </span>
      ))}
    </span>
  );
};

// 2. Fade Up Wrapper
const FadeIn = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      }, { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-[1000ms] ease-[cubic-bezier(0.76,0,0.24,1)] transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: isVisible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
};

const Venue = () => {
  const navigate = useNavigate();
  const [appLoading, setAppLoading] = useState(true);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  
  // --- Slide & Scroll Logic States ---
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [navIsScrolled, setNavIsScrolled] = useState(false);
  
  const containerRef = useRef(null);
  const sectionRefs = useRef([]);
  const touchStartY = useRef(0);

  // --- INITIAL LOAD ANIMATION ---
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      setAppLoading(false);
      setTimeout(() => {
        document.body.style.overflow = '';
      }, 1200);
    }, 1500); 

    return () => clearTimeout(timer);
  }, []);

  // --- Theme Logic ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      document.body.style.backgroundColor = '#0c0c0c';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      document.body.style.backgroundColor = '#FAFAFA';
    }
  }, [darkMode]);

  const addToRefs = (el) => {
    if (el && !sectionRefs.current.includes(el)) {
      sectionRefs.current.push(el);
    }
  };

  // --- SCROLL LOGIC ---
  const handleNativeScroll = (e) => {
    const scrollTop = e.currentTarget.scrollTop;
    setNavIsScrolled(scrollTop > 50);
  };

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
      const targetTop = targetSection.offsetTop;
      smoothScrollTo(targetTop, 1000); 
    } else {
      sectionRefs.current[index].scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleWheel = (e) => {
      if (appLoading) return;
      if (window.innerWidth < 768) return;
      e.preventDefault();
      if (isScrolling) return;
      const direction = e.deltaY > 0 ? 1 : -1;
      const nextIndex = Math.min(Math.max(activeIndex + direction, 0), sectionRefs.current.length - 1);
      if (nextIndex !== activeIndex) scrollToSection(nextIndex);
    };
    const container = containerRef.current;
    if (container) container.addEventListener('wheel', handleWheel, { passive: false });
    return () => { if (container) container.removeEventListener('wheel', handleWheel); };
  }, [activeIndex, isScrolling, appLoading]);

  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e) => {
    if (isScrolling || appLoading) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY.current - touchEndY;
    if (Math.abs(deltaY) > 50) { /* Mobile logic */ }
  };

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
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} isScrolled={activeIndex > 0 || navIsScrolled} />

      {/* --- OPENING ANIMATION --- */}
      <div 
        className={`fixed inset-0 z-[100] flex items-center justify-center 
          ${darkMode ? 'bg-[#0c0c0c]' : 'bg-[#FAFAFA]'}`
        }
        style={{
          clipPath: appLoading 
            ? 'ellipse(150% 150% at 50% 50%)' 
            : 'ellipse(150% 100% at 50% -100%)',
          transition: 'clip-path 1.2s cubic-bezier(0.76, 0, 0.24, 1)'
        }}
      >
        <div className={`text-center transition-all duration-700 ease-out 
          ${appLoading ? 'opacity-100 scale-100' : 'opacity-0 scale-95 -translate-y-20'}`}>
          <h1 className={`font-serif text-3xl md:text-4xl tracking-[0.2em] uppercase 
            ${darkMode ? 'text-white' : 'text-stone-900'}`}>
            Venue
          </h1>
        </div>
      </div>

      <div 
        ref={containerRef}
        onScroll={handleNativeScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`relative h-screen w-full font-sans antialiased transition-colors duration-500 ${theme.bg} ${theme.text} selection:bg-[#C9A25D] selection:text-white overflow-y-scroll md:overflow-hidden`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap');
            .font-serif { font-family: 'Cormorant Garamond', serif; }
            .font-sans { font-family: 'Inter', sans-serif; }
            ::-webkit-scrollbar { display: none; }
          `}
        </style>

        {/* --- 0. HERO SECTION --- */}
        <header 
          ref={addToRefs}
          className="relative h-screen w-full overflow-hidden bg-stone-900 flex flex-col justify-center items-center"
        >
          {/* Parallax Image Scale */}
          <div className={`absolute inset-0 w-full h-full z-0 transition-transform duration-[2000ms] ease-out ${appLoading ? 'scale-125' : 'scale-100'}`}>
            <img 
              src="https://images.pexels.com/photos/3835638/pexels-photo-3835638.jpeg?auto=compress&cs=tinysrgb&w=1600" 
              alt="Venue Architecture" 
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-stone-900/60 via-stone-900/20 to-stone-900/90"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto mt-0 md:-mt-10">
            <FadeIn delay={1000}>
              <span className="text-[#C9A25D] text-xs md:text-sm tracking-[0.4em] uppercase font-medium mb-6 block">
                Our Spaces
              </span>
            </FadeIn>

            <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl text-white leading-[0.9] mb-8 font-thin drop-shadow-2xl">
              <div className="block overflow-hidden">
                  <StaggeredText text="Timeless" delay={1400} />
              </div>
              <div className="block overflow-hidden">
                  <span className="italic font-light">
                    <StaggeredText text="Architecture" delay={1600} />
                  </span>
              </div>
            </h1>
            
            <FadeIn delay={2000}>
              <div className="max-w-md mx-auto">
                <p className="text-white/90 text-sm md:text-base font-light leading-relaxed tracking-wide">
                  Discover settings that inspire. From historic ballrooms to modern garden escapes, 
                  we provide the canvas for your masterpiece.
                </p>
              </div>
            </FadeIn>
          </div>

          {/* Scroll Indicator - Bouncy */}
          <div 
            onClick={() => scrollToSection(1)}
            className={`absolute bottom-10 flex flex-col items-center gap-3 z-10 cursor-pointer animate-bounce transition-opacity duration-1000 delay-[2200ms] ${appLoading ? 'opacity-0' : 'opacity-80 hover:opacity-100'}`}
          >
            <span className="text-[9px] text-white tracking-[0.4em] uppercase">Scroll</span>
            <div className="w-[1px] h-12 bg-white/50"></div>
          </div>
        </header>

        {/* --- VENUES LOOP (Slides 1, 2, 3) --- */}
        {venues.map((venue, index) => (
          <section 
            key={venue.id} 
            ref={addToRefs}
            className={`min-h-screen md:h-screen flex flex-col justify-center py-20 ${theme.bg} transition-colors duration-500`}
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
                      className={`font-serif text-5xl md:text-6xl ${theme.text} mb-6 cursor-pointer hover:text-[#C9A25D] transition-colors leading-tight`}
                    >
                      <StaggeredText text={venue.name} />
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

        {/* --- AMENITIES SECTION --- */}
        <section 
          ref={addToRefs}
          className={`min-h-screen md:h-screen flex flex-col justify-center py-20 md:py-32 ${theme.cardBg} border-t ${theme.border} transition-colors duration-500`}
        >
          <div className="max-w-screen-xl mx-auto px-6 text-center w-full">
            <FadeIn>
              <h2 className={`font-serif text-3xl md:text-5xl ${theme.text} mb-16`}>
                <StaggeredText text="Included Amenities" />
              </h2>
            </FadeIn>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {[
                { icon: Wifi, title: "High-Speed WiFi", desc: "Seamless connectivity for all guests." },
                { icon: Music, title: "Premium Audio", desc: "Integrated Bose sound systems." },
                { icon: MapPin, title: "Valet Parking", desc: "Complimentary service on arrival." },
                { icon: Coffee, title: "Private Suite", desc: "Exclusive green room for hosts." }
              ].map((item, idx) => (
                <FadeIn key={idx} delay={idx * 150}>
                  <div className="flex flex-col items-center group">
                    <div className={`w-12 h-12 mb-6 flex items-center justify-center rounded-full ${darkMode ? 'bg-stone-800 text-white' : 'bg-stone-50 text-stone-900'} group-hover:bg-[#C9A25D] group-hover:text-white transition-colors duration-500`}>
                      <item.icon strokeWidth={1} className="w-5 h-5" />
                    </div>
                    <h3 className={`font-serif text-xl ${theme.text} mb-2`}>
                      <StaggeredText text={item.title} />
                    </h3>
                    <p className={`text-xs ${theme.subText} tracking-wide`}>{item.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* --- TOUR CTA --- */}
        <section 
          ref={addToRefs}
          className={`min-h-screen md:h-screen flex flex-col justify-center py-20 md:py-32 ${theme.bg} relative transition-colors duration-500`}
        >
          <div className="max-w-screen-md mx-auto px-6 text-center w-full">
            <FadeIn>
              <h2 className={`font-serif text-4xl md:text-6xl ${theme.text} mb-6 leading-tight`}>
                <StaggeredText text="Experience it in Person" />
              </h2>
              <div className="w-[1px] h-20 bg-[#C9A25D] mx-auto mb-8 mt-4"></div>
              <p className={`${theme.subText} mb-10 max-w-lg mx-auto font-light text-lg`}>
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

        {/* --- FOOTER --- */}
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
    </>
  );
};

export default Venue;