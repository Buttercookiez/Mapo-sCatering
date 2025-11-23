// src/pages/Customer/Homepage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUp, Minus, Plus, ChefHat, Calendar, Users, 
  Instagram, Facebook, Mail, ChevronDown, Download, ArrowRight 
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

const Homepage = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
   const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [eventType, setEventType] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // --- Slide Logic States ---
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [navIsScrolled, setNavIsScrolled] = useState(false); // 1. Added state for mobile scroll
  
  // Refs
  const containerRef = useRef(null);
  const sectionRefs = useRef([]);
  const touchStartY = useRef(0);

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

  // --- 2. NATIVE SCROLL HANDLER (Fixes Mobile Navbar) ---
  const handleNativeScroll = (e) => {
    const scrollTop = e.currentTarget.scrollTop;
    // If scrolled down more than 50px on mobile, turn navbar solid
    setNavIsScrolled(scrollTop > 50);
  };

  // --- CUSTOM SLOW SCROLL ANIMATION (Desktop Only) ---
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

    // Update state to show/hide navbar elements or back-to-top
    setActiveIndex(index);

    // On Desktop: Use Custom Smooth Scroll
    if (window.innerWidth >= 768) {
      setIsScrolling(true);
      const targetSection = sectionRefs.current[index];
      const targetTop = targetSection.offsetTop;
      smoothScrollTo(targetTop, 1000); 
    } else {
      // On Mobile: Use Native Scroll
      sectionRefs.current[index].scrollIntoView({ behavior: 'smooth' });
    }
  };

  // --- DESKTOP: MOUSE WHEEL LISTENER ---
  useEffect(() => {
    const handleWheel = (e) => {
      // Only use custom scroll jacking on Desktop
      if (window.innerWidth < 768) return;

      e.preventDefault(); // Stop native scroll

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

  // --- MOBILE: TOUCH LISTENERS ---
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (isScrolling) return;

    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY.current - touchEndY;
    const threshold = 50; 

    if (Math.abs(deltaY) > threshold) {
      // On mobile we mainly rely on native scroll, but we track swipes 
      // to update the activeIndex state for the BackToTop button logic if needed.
      const direction = deltaY > 0 ? 1 : -1;
      const nextIndex = Math.min(
        Math.max(activeIndex + direction, 0), 
        sectionRefs.current.length - 1
      );
      // Ideally we don't force scroll on mobile unless it's a very clean snap, 
      // but we can update state here if we want strict tracking.
    }
  };

  const handleDownload = (e) => {
    e.preventDefault();
    alert("Downloading Menu PDF...");
  };

  const theme = {
    bg: darkMode ? 'bg-[#0c0c0c]' : 'bg-[#FAFAFA]',
    cardBg: darkMode ? 'bg-[#111]' : 'bg-white',
    text: darkMode ? 'text-stone-200' : 'text-stone-900',
    subText: darkMode ? 'text-stone-400' : 'text-stone-500',
    border: darkMode ? 'border-stone-800' : 'border-stone-200',
  };

  return (
    <div 
      ref={containerRef}
      onScroll={handleNativeScroll} // 3. Attach Scroll Listener
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

      {/* 4. Updated Navbar Prop logic */}
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} isScrolled={activeIndex > 0 || navIsScrolled} />

      {/* --- 0. Hero Section (Fixed Height) --- */}
      <header 
        ref={addToRefs}
        id="home" 
        className="relative h-screen w-full overflow-hidden bg-stone-900 flex flex-col justify-center items-center"
      >
        <div className="absolute inset-0 w-full h-full z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="object-cover object-center w-full h-full opacity-60"
          >
            <source src="/videos/wedding.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/60"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto mt-0 md:-mt-10">
          <FadeIn>
            <span className="text-[#C9A25D] text-xs md:text-sm tracking-[0.3em] uppercase font-medium mb-6 block">
              Est. 2015
            </span>
            <h1 className="font-serif text-5xl md:text-8xl lg:text-9xl text-white leading-none mb-8 font-thin drop-shadow-2xl">
              The Art of <br/> <span className="italic">Dining</span>
            </h1>
          </FadeIn>
          
          <FadeIn delay={200}>
            <p className="text-white/90 text-sm md:text-base max-w-md mx-auto font-light leading-relaxed tracking-wide mb-10">
              Bespoke culinary experiences tailored to the finest detail. 
              From intimate gatherings to grand celebrations.
            </p>
            
            <div className="flex flex-col md:flex-row gap-5 w-full justify-center items-center">
              <button 
                onClick={() => navigate('/booking')} 
                className="w-full md:w-auto px-10 py-4 bg-white text-stone-900 text-xs tracking-[0.25em] uppercase hover:bg-[#C9A25D] hover:text-white transition-all duration-500 shadow-xl font-bold"
              >
                Inquire Now
              </button>
              <button 
                onClick={() => navigate('/menu')} 
                className="w-full md:w-auto px-10 py-4 border border-white/30 text-white text-xs tracking-[0.25em] uppercase hover:bg-white/10 hover:border-white transition-all duration-500 backdrop-blur-sm"
              >
                View Menus
              </button>
            </div>
          </FadeIn>
        </div>
        
        <div 
          onClick={() => scrollToSection(1)}
          className="absolute bottom-10 w-full flex flex-col items-center justify-center gap-3 opacity-80 animate-bounce z-10 cursor-pointer hover:opacity-100"
        >
          <span className="text-[9px] text-white tracking-[0.4em] uppercase">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent"></div>
        </div>
      </header>

      {/* --- 1. About / Intro (Min Height for Mobile) --- */}
      <section 
        ref={addToRefs}
        className={`min-h-screen md:h-screen flex flex-col justify-center py-20 ${theme.bg} transition-colors duration-500`}
      >
        <div className="max-w-screen-lg mx-auto px-6 text-center">
          <FadeIn>
            <h2 className={`font-serif text-3xl md:text-5xl ${theme.text} mb-8 leading-tight`}>
              "We believe that food is not just eaten,<br/>
              <span className={`${theme.subText} italic`}>it is experienced."</span>
            </h2>
            <div className="w-[1px] h-20 bg-[#C9A25D] mx-auto mb-8"></div>
            <p className={`${theme.subText} font-light text-lg leading-relaxed max-w-2xl mx-auto`}>
              Mapo's brings a symphony of flavors to your most cherished moments. 
              Rejecting the ordinary, we source exclusively from local artisans to craft 
              menus that are as sustainable as they are exquisite.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* --- 2. Process (Min Height + Fixed Grid Stacking) --- */}
      <section 
        ref={addToRefs}
        id="process" 
        className={`min-h-screen md:h-screen flex flex-col justify-center py-20 md:py-24 ${theme.cardBg} border-t ${theme.border} transition-colors duration-500`}
      >
        <div className="max-w-screen-xl mx-auto px-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {[
              { icon: Users, title: "Consultation", desc: "We listen to your story to craft a proposal that is uniquely yours." },
              { icon: ChefHat, title: "Tasting", desc: "Experience your menu in our private kitchen before the big day." },
              { icon: Calendar, title: "Execution", desc: "Flawless service, ensuring you are a guest at your own event." }
            ].map((step, idx) => (
              <FadeIn key={idx} delay={idx * 150}>
                <div className="text-center group">
                  <div className={`mb-6 inline-flex items-center justify-center w-12 h-12 rounded-full ${darkMode ? 'bg-stone-800 text-white' : 'bg-stone-50 text-stone-900'} group-hover:bg-[#C9A25D] group-hover:text-white transition-colors duration-500`}>
                    <step.icon strokeWidth={1} className="w-5 h-5" />
                  </div>
                  <h3 className={`font-serif text-2xl ${theme.text} mb-3`}>{step.title}</h3>
                  <p className={`${theme.subText} text-sm font-light leading-relaxed max-w-xs mx-auto`}>
                    {step.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* --- 3. Curated Menus (Min Height) --- */}
      <section 
        ref={addToRefs}
        id="menu" 
        className={`min-h-screen md:h-screen flex flex-col justify-center py-20 md:py-32 ${theme.bg} transition-colors duration-500`}
      >
        <div className="max-w-screen-xl mx-auto px-6 w-full">
          <FadeIn>
            <div className={`flex flex-col md:flex-row justify-between items-end mb-12 md:mb-20 border-b ${theme.border} pb-6`}>
              <h2 className={`font-serif text-4xl md:text-5xl ${theme.text}`}>Curated Menus</h2>
              <div className="flex gap-6 mt-4 md:mt-0">
                 <button onClick={() => navigate('/menu')} className={`group flex items-center gap-2 text-xs tracking-[0.2em] uppercase ${theme.subText} hover:text-[#C9A25D] transition-colors cursor-pointer`}>
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
                <button onClick={handleDownload} className={`group flex items-center gap-2 text-xs tracking-[0.2em] uppercase ${theme.subText} hover:text-[#C9A25D] transition-colors cursor-pointer`}>
                  <span>Download PDF</span>
                  <Download className="w-4 h-4 group-hover:translate-y-1 transition-transform duration-300" />
                </button>
              </div>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {[
              { title: "The Gala", img: "https://images.pexels.com/photos/2544829/pexels-photo-2544829.jpeg?auto=compress&cs=tinysrgb&w=800", sub: "Plated Dinners" },
              { title: "Al Fresco", img: "https://images.pexels.com/photos/5638268/pexels-photo-5638268.jpeg?auto=compress&cs=tinysrgb&w=800", sub: "Open Air Events" },
              { title: "Corporate", img: "https://images.pexels.com/photos/2893685/pexels-photo-2893685.jpeg?auto=compress&cs=tinysrgb&w=800", sub: "Professional & Boxed" }
            ].map((item, idx) => (
              <FadeIn key={idx} delay={idx * 150}>
                <div className="group cursor-pointer" onClick={() => navigate('/menu')}>
                  <div className={`relative overflow-hidden aspect-[3/4] mb-6 ${darkMode ? 'bg-stone-800' : 'bg-stone-200'}`}>
                    <img 
                      src={item.img} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500"></div>
                  </div>
                  <div className={`flex justify-between items-baseline border-b ${theme.border} pb-2 group-hover:border-[#C9A25D] transition-colors duration-500`}>
                    <h3 className={`font-serif text-2xl ${theme.text}`}>{item.title}</h3>
                    <span className={`text-xs ${theme.subText} uppercase tracking-widest`}>{item.sub}</span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* --- 4. Gallery --- */}
      <section 
        ref={addToRefs}
        id="gallery" 
        className="h-screen w-full bg-stone-900 snap-start"
      >
        <div className="flex flex-wrap md:flex-nowrap h-full w-full">
          {[
            "https://images.pexels.com/photos/3026808/pexels-photo-3026808.jpeg?auto=compress&cs=tinysrgb&w=800",
            "https://images.pexels.com/photos/3217156/pexels-photo-3217156.jpeg?auto=compress&cs=tinysrgb&w=800",
            "https://images.pexels.com/photos/4552130/pexels-photo-4552130.jpeg?auto=compress&cs=tinysrgb&w=800",
            "https://images.pexels.com/photos/4253320/pexels-photo-4253320.jpeg?auto=compress&cs=tinysrgb&w=800"
          ].map((src, i) => (
            <div 
              key={i} 
              className="relative w-1/2 h-1/2 md:w-auto md:h-full md:flex-1 md:hover:flex-[3] border border-stone-800/50 overflow-hidden transition-all duration-1000 ease-in-out group cursor-pointer"
            >
              <img 
                src={src} 
                alt="Detail" 
                className="w-full h-full object-cover opacity-80 transition-all duration-1000 group-hover:opacity-100 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-black/30 md:group-hover:bg-transparent transition-colors duration-700 pointer-events-none"></div>
            </div>
          ))}
        </div>
      </section>

      {/* --- 5. FAQ (Min Height) --- */}
      <section 
        ref={addToRefs}
        id="faq" 
        className={`min-h-screen md:h-screen flex flex-col justify-center py-20 md:py-32 ${theme.cardBg} transition-colors duration-500`}
      >
        <div className="max-w-screen-md mx-auto px-6 w-full">
          <FadeIn>
            <h2 className={`font-serif text-4xl ${theme.text} mb-16 text-center`}>Common Inquiries</h2>
          </FadeIn>
          
          <div className={`divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-100'}`}>
            {[
              { q: "What is the booking lead time?", a: "We recommend securing your date 6-12 months in advance, especially for weekends during peak season." },
              { q: "Do you handle dietary restrictions?", a: "Our culinary team is well-versed in gluten-free, vegan, and allergen-sensitive preparations without compromising on flavor." },
              { q: "Is staff included?", a: "Yes, our white-glove service team manages setup, service, and breakdown to ensure a seamless experience." }
            ].map((item, idx) => (
              <FadeIn key={idx} delay={idx * 100}>
                <div className="group py-6 cursor-pointer" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                  <div className="flex justify-between items-center gap-4">
                    <span className={`font-serif text-lg md:text-xl ${darkMode ? 'text-stone-200' : 'text-stone-800'} group-hover:text-[#C9A25D] transition-colors`}>{item.q}</span>
                    {openFaq === idx ? <Minus className="w-4 h-4 text-[#C9A25D] flex-shrink-0"/> : <Plus className="w-4 h-4 text-stone-400 flex-shrink-0"/>}
                  </div>
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${openFaq === idx ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <p className={`${theme.subText} font-light leading-relaxed`}>{item.a}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* --- 6. Contact (Min Height) --- */}
      <section 
        ref={addToRefs}
        id="contact" 
        className={`min-h-screen md:h-screen flex flex-col justify-center py-20 md:py-32 ${theme.bg} relative overflow-visible transition-colors duration-500`}
      >
        <div className="max-w-screen-lg mx-auto px-6 flex flex-col md:flex-row items-center gap-12 md:gap-16 w-full">
          <div className="w-full md:w-1/2 text-left">
            <FadeIn>
              <span className="text-[#C9A25D] text-xs tracking-[0.2em] uppercase mb-4 block">Get in Touch</span>
              <h2 className={`font-serif text-5xl md:text-6xl ${theme.text} mb-6`}>Let's Plan Your <br/> <span className={`italic ${theme.subText}`}>Next Event</span></h2>
              <p className={`${theme.subText} font-light mb-8`}>
                We accept a limited number of events per year to ensure the highest quality of service.
              </p>
              <div className={`flex gap-4 ${theme.subText}`}>
                <a href="#" className={`hover:${theme.text} transition-colors`}><Instagram className="w-5 h-5" /></a>
                <a href="#" className={`hover:${theme.text} transition-colors`}><Facebook className="w-5 h-5" /></a>
                <a href="#" className={`hover:${theme.text} transition-colors`}><Mail className="w-5 h-5" /></a>
              </div>
            </FadeIn>
          </div>

          <div className="w-full md:w-1/2">
            <FadeIn delay={200}>
              <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="group">
                    <input type="text" placeholder="Name" className={`w-full bg-transparent border-b ${theme.border} py-3 pl-0 ${theme.text} placeholder-stone-400 focus:outline-none focus:${darkMode ? 'border-stone-100' : 'border-stone-900'} transition-colors`} />
                  </div>
                  <div className="group">
                    <input type="email" placeholder="Email" className={`w-full bg-transparent border-b ${theme.border} py-3 pl-0 ${theme.text} placeholder-stone-400 focus:outline-none focus:${darkMode ? 'border-stone-100' : 'border-stone-900'} transition-colors`} />
                  </div>
                </div>
                
                <div className="group relative">
                  <button 
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`w-full bg-transparent border-b ${theme.border} py-3 pl-0 pr-10 text-left focus:outline-none focus:${darkMode ? 'border-stone-100' : 'border-stone-900'} transition-colors flex justify-between items-center cursor-pointer`}
                  >
                    <span className={eventType ? theme.text : "text-stone-400"}>
                      {eventType || "Event Type"}
                    </span>
                    <ChevronDown className={`w-4 h-4 ${theme.subText} transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <div className={`absolute top-full left-0 w-full mt-2 py-2 shadow-2xl rounded-sm z-50 transition-all duration-300 origin-top ${dropdownOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'} ${darkMode ? 'bg-[#1c1c1c] border border-stone-800' : 'bg-white border border-stone-100'}`}>
                    {['Wedding', 'Corporate', 'Social Gathering', 'Private Dinner'].map((option) => (
                      <div 
                        key={option}
                        onClick={() => {
                          setEventType(option);
                          setDropdownOpen(false);
                        }}
                        className={`px-6 py-3 text-sm cursor-pointer transition-colors ${darkMode ? 'text-stone-400 hover:text-white hover:bg-stone-800' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'}`}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                </div>

                <button className={`mt-8 px-10 py-4 ${darkMode ? 'bg-white text-stone-900 hover:text-white' : 'bg-stone-900 text-white'} text-xs tracking-[0.2em] uppercase hover:bg-[#C9A25D] transition-colors duration-300 w-full md:w-auto shadow-xl`}>
                  Send Request
                </button>
              </form>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* --- 7. Footer (Final Slide) --- */}
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

export default Homepage;