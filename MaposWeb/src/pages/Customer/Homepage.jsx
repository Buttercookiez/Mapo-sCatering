// src/pages/Customer/Homepage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUp, Minus, Plus, ChefHat, Calendar, Users, ArrowRight 
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

const Homepage = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [appLoading, setAppLoading] = useState(true);
  
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [navIsScrolled, setNavIsScrolled] = useState(false);
  
  const containerRef = useRef(null);
  const sectionRefs = useRef([]);
  const touchStartY = useRef(0);

  // --- INITIAL LOAD ---
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

  return (
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} isScrolled={activeIndex > 0 || navIsScrolled} />

      {/* --- OPENING ANIMATION (Reference Implementation) --- */}
      {/* 
          Logic copied from Reference:
          - Loading: clipPath: 'ellipse(150% 150% at 50% 50%)' (Full screen)
          - Loaded: clipPath: 'ellipse(150% 100% at 50% -100%)' (Lifts up with curve)
      */}
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
            Mapo's
          </h1>
        </div>
      </div>

      {/* --- MAIN SCROLL CONTAINER --- */}
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

        {/* --- 1. HERO SECTION --- */}
        <header 
          ref={addToRefs}
          id="home" 
          className="relative h-screen w-full overflow-hidden bg-stone-900 flex flex-col justify-center items-center"
        >
          {/* Parallax Video Scale */}
          <div className={`absolute inset-0 w-full h-full z-0 transition-transform duration-[2000ms] ease-out ${appLoading ? 'scale-125' : 'scale-100'}`}>
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="object-cover object-center w-full h-full opacity-60"
            >
              <source src="/videos/wedding.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/70"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto mt-0 md:-mt-10">
            
            <FadeIn delay={1000}>
              <span className="text-[#C9A25D] text-xs md:text-sm tracking-[0.4em] uppercase font-medium mb-6 block">
                Est. 2004
              </span>
            </FadeIn>

            <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl text-white leading-[0.9] mb-8 font-thin drop-shadow-2xl">
              <div className="block overflow-hidden">
                  <StaggeredText text="The Art of" delay={1400} />
              </div>
              <div className="block overflow-hidden">
                  <span className="italic font-light">
                    <StaggeredText text="Dining" delay={1600} />
                  </span>
              </div>
            </h1>
            
            <FadeIn delay={2000}>
              <div className="max-w-md mx-auto">
                <p className="text-white/90 text-sm md:text-base font-light leading-relaxed tracking-wide mb-10">
                  Bespoke culinary experiences tailored to the finest detail. 
                  From intimate gatherings to grand celebrations.
                </p>
                
                <button 
                  onClick={() => navigate('/booking')} 
                  className="px-10 py-4 bg-white text-stone-900 text-xs tracking-[0.25em] uppercase hover:bg-[#C9A25D] hover:text-white transition-all duration-500 shadow-xl font-bold"
                >
                  Inquire Now
                </button>
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

        {/* --- 2. INTRO --- */}
        <section 
          ref={addToRefs}
          className={`min-h-screen md:h-screen flex flex-col justify-center py-20 ${theme.bg} transition-colors duration-500`}
        >
          <div className="max-w-screen-lg mx-auto px-6 text-center">
            <div className="overflow-hidden">
              <h2 className={`font-serif text-4xl md:text-6xl ${theme.text} mb-8 leading-tight`}>
                <StaggeredText text='"We believe that food' className="block" />
                <StaggeredText text='is not just eaten,' className="block" />
                <span className={`${theme.subText} italic block mt-2`}>
                    <StaggeredText text='it is experienced."' delay={200} />
                </span>
              </h2>
            </div>
            <FadeIn>
              <div className="w-[1px] h-20 bg-[#C9A25D] mx-auto mb-8"></div>
              <p className={`${theme.subText} font-light text-lg leading-relaxed max-w-2xl mx-auto`}>
                Mapo's brings a symphony of flavors to your most cherished moments. 
                Rejecting the ordinary, we source exclusively from local artisans to craft 
                menus that are as sustainable as they are exquisite.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* --- 3. PROCESS --- */}
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
                    <h3 className={`font-serif text-3xl ${theme.text} mb-3`}>
                      <StaggeredText text={step.title} />
                    </h3>
                    <p className={`${theme.subText} text-sm font-light leading-relaxed max-w-xs mx-auto`}>
                      {step.desc}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* --- 4. MENUS --- */}
        <section 
          ref={addToRefs}
          id="menu" 
          className={`min-h-screen md:h-screen flex flex-col justify-center py-20 md:py-32 ${theme.bg} transition-colors duration-500`}
        >
          <div className="max-w-screen-xl mx-auto px-6 w-full">
            <div className={`flex flex-col md:flex-row justify-between items-end mb-12 md:mb-20 border-b ${theme.border} pb-6`}>
              <h2 className={`font-serif text-4xl md:text-6xl ${theme.text}`}>
                <StaggeredText text="Curated Menus" />
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
              {[
                { title: "The Classic", img: "/images/mapo3.png", sub: "Buffet Favorites" },
                { title: "The Executive", img: "/images/mapo4.png", sub: "Premium Dining" },
                { title: "Event Styling", img: "/images/mapo5.png", sub: "Decor & Ambiance" }
              ].map((item, idx) => (
                <FadeIn key={idx} delay={idx * 150}>
                  <div className="group cursor-pointer" onClick={() => navigate('/menu')}>
                    <div className={`relative overflow-hidden aspect-[3/4] mb-6 ${darkMode ? 'bg-stone-800' : 'bg-stone-200'}`}>
                      <img 
                        src={item.img} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.2,0.65,0.3,0.9)] group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0" 
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500"></div>
                    </div>
                    <div className={`flex justify-between items-baseline border-b ${theme.border} pb-2 group-hover:border-[#C9A25D] transition-colors duration-500`}>
                      <h3 className={`font-serif text-2xl ${theme.text} group-hover:italic transition-all duration-300`}>{item.title}</h3>
                      <span className={`text-xs ${theme.subText} uppercase tracking-widest`}>{item.sub}</span>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* --- 5. GALLERY --- */}
        <section 
          ref={addToRefs}
          id="gallery" 
          className="h-screen w-full bg-stone-900 snap-start"
        >
          <div className="group/gallery flex flex-wrap md:flex-nowrap h-full w-full">
            {[
              { src: "/images/mapo1.png", caption: "Table Settings" },
              { src: "/images/mapo2.png", caption: "Signature Dishes" },
              { src: "/images/mapo6.png", caption: "Floral Arrangements" },
              { src: "/images/mapo7.png", caption: "Cocktail Hour" }
            ].map((item, i) => (
              <div 
                key={i} 
                className="group/item relative w-1/2 h-1/2 md:w-auto md:h-full md:flex-1 md:hover:flex-[2.5] 
                  border border-stone-800/50 overflow-hidden 
                  transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer
                  grayscale-0 
                  group-hover/gallery:grayscale group-hover/gallery:opacity-40
                  hover:!grayscale-0 hover:!opacity-100"
              >
                <img 
                  src={item.src} 
                  alt={item.caption} 
                  className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover/item:scale-110" 
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                  <span className="text-[#C9A25D] text-xs uppercase tracking-[0.2em] mb-2 translate-y-4 group-hover/item:translate-y-0 transition-transform duration-500 delay-100">
                     View Gallery
                  </span>
                  <h3 className="text-white font-serif text-3xl translate-y-4 group-hover/item:translate-y-0 transition-transform duration-500">
                    {item.caption}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- 6. FAQ --- */}
        <section 
          ref={addToRefs}
          id="faq" 
          className={`min-h-screen md:h-screen flex flex-col justify-center py-20 md:py-32 ${theme.cardBg} transition-colors duration-500`}
        >
          <div className="max-w-screen-md mx-auto px-6 w-full">
            <h2 className={`font-serif text-4xl md:text-5xl ${theme.text} mb-16 text-center`}>
              <StaggeredText text="Common Inquiries" />
            </h2>
            <div className={`divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-100'}`}>
              {[
                { q: "What is the booking lead time?", a: "We recommend securing your date 6-12 months in advance, especially for weekends during peak season." },
                { q: "Do you handle dietary restrictions?", a: "Our culinary team is well-versed in gluten-free, vegan, and allergen-sensitive preparations without compromising on flavor." },
                { q: "Is staff included?", a: "Yes, our white-glove service team manages setup, service, and breakdown to ensure a seamless experience." }
              ].map((item, idx) => (
                <FadeIn key={idx} delay={idx * 100}>
                  <div className="group py-6 cursor-pointer" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                    <div className="flex justify-between items-center gap-4">
                      <span className={`font-serif text-xl md:text-2xl ${darkMode ? 'text-stone-200' : 'text-stone-800'} group-hover:text-[#C9A25D] transition-colors duration-300`}>{item.q}</span>
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

export default Homepage;