// src/pages/Customer/AboutUs.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Users, Clock, Star, ArrowUp, 
  ChefHat, Award, Leaf, ArrowRight 
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
        <span key={i} className="inline-block overflow-hidden align-bottom mr-[0.35em]">
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

const AboutUs = () => {
  const navigate = useNavigate();
  const [appLoading, setAppLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // --- Scroll Logic States ---
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

  // --- SCROLL ENGINE ---
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


  // --- Theme Objects ---
  const theme = {
    bg: darkMode ? 'bg-[#0c0c0c]' : 'bg-[#FAFAFA]',
    cardBg: darkMode ? 'bg-[#111]' : 'bg-white',
    text: darkMode ? 'text-stone-200' : 'text-stone-900',
    subText: darkMode ? 'text-stone-400' : 'text-stone-500',
    border: darkMode ? 'border-stone-800' : 'border-stone-200',
    accent: 'text-[#C9A25D]',
  };

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
            About Us
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

        {/* --- Section 0: Hero --- */}
        <header 
          ref={addToRefs}
          className="relative h-screen w-full overflow-hidden bg-stone-900 flex flex-col justify-center items-center"
        >
          {/* Parallax Image */}
          <div className={`absolute inset-0 w-full h-full z-0 transition-transform duration-[2000ms] ease-out ${appLoading ? 'scale-125' : 'scale-100'}`}>
            <img 
              src="images/aboutus.jpg" 
              alt="Culinary Art" 
              className="object-cover w-full h-full opacity-60 animate-pulse-slow" 
              style={{ animationDuration: '20s' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80"></div>
          </div>

          <div className="relative z-10 text-center px-4 md:px-6 max-w-5xl mx-auto flex flex-col items-center justify-center h-full pb-16 md:pb-0">
            <FadeIn delay={1000}>
              <div className="flex justify-center w-full">
                <span className="text-[#C9A25D] text-sm md:text-base tracking-[0.3em] uppercase font-medium mb-4 md:mb-6 text-center pr-12">
                  Established 2004
                </span>
              </div>
            </FadeIn>
            
            <h1 className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-white leading-[0.9] mb-6 md:mb-8 font-thin drop-shadow-2xl flex flex-col items-center">
              <div className="block overflow-hidden">
                  <StaggeredText text="Heart &" delay={1400} />
              </div>
              <div className="block overflow-hidden">
                  <span className="italic font-light">
                    <StaggeredText text="Heritage" delay={1600} />
                  </span>
              </div>
            </h1>
            
            <FadeIn delay={2000}>
              <p className="text-white/80 text-base md:text-lg max-w-xs md:max-w-xl mx-auto font-light leading-relaxed tracking-wide mb-8 md:mb-10 text-center">
                The story of Mapo's is a story of family. From a small canteen in Alaminos 
                to the premier catering choice of Laguna.
              </p>
            </FadeIn>
          </div>

          {/* Scroll Indicator */}
          <div 
            onClick={() => scrollToSection(1)}
            className={`absolute bottom-10 w-full flex flex-col items-center justify-center gap-3 animate-bounce z-10 cursor-pointer hover:opacity-100 transition-opacity duration-1000 delay-[2200ms] ${appLoading ? 'opacity-0' : 'opacity-70'}`}
          >
            <span className="text-[9px] text-white tracking-[0.4em] uppercase">The Story</span>
            <div className="w-[1px] h-12 bg-white/50"></div>
          </div>
        </header>

        {/* --- Section 1: The Origin --- */}
        <section 
          ref={addToRefs}
          className={`min-h-screen flex flex-col justify-center py-20 px-6 ${theme.bg} transition-colors duration-500`}
        >
          <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center gap-16 md:gap-24 w-full">
            
            {/* Image Side */}
            <div className="w-full md:w-1/2 flex justify-center">
              <FadeIn>
                <div className="relative w-[85%] aspect-[3/4] group cursor-pointer">
                    <div className={`absolute inset-0 border border-[#C9A25D]/50 z-0 transition-transform duration-500 ease-out translate-x-5 -translate-y-5 group-hover:translate-x-3 group-hover:-translate-y-3`}></div>
                    <div className="relative z-10 w-full h-full overflow-hidden shadow-2xl bg-stone-200">
                      <img 
                        src="/images/maandpo3.jpg" 
                        alt="Marivic & Potenciano" 
                        className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute bottom-6 left-6 text-white z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                        <p className="font-serif text-3xl italic mb-1">"Ma" + "Po"</p>
                        <p className="text-[10px] uppercase tracking-widest text-[#C9A25D]">Founders</p>
                      </div>
                    </div>
                </div>
              </FadeIn>
            </div>
            
            {/* Text Side */}
            <div className="w-full md:w-1/2">
              <FadeIn delay={200}>
                <h2 className={`font-serif text-4xl md:text-6xl ${theme.text} mb-8 leading-tight`}>
                  <StaggeredText text="Humble" /> <br/>
                  <span className="italic text-[#C9A25D]">
                    <StaggeredText text="Beginnings" />
                  </span>
                </h2>
                <div className={`space-y-6 ${theme.subText} font-light text-lg leading-relaxed text-justify md:text-left`}>
                  <p>
                    Mapo's Catering began 21 years ago not in a grand ballroom, but in a modest school canteen. For 16 years, it was a daily struggle and a labor of love, serving Halo-Halo and Pancit to the locals of Alaminos.
                  </p>
                  <p>
                    <strong className={theme.text}>Marivic</strong>, a working mother and student, dreamed of something bigger. She believed that poverty was not a hindrance but an inspiration.
                  </p>
                  <p>
                    The name <strong className="text-[#C9A25D]">"Mapo"</strong> is a union of <span className={theme.text}>Ma</span>rivic and <span className={theme.text}>Po</span>tenciano, a testament that this business is built on partnership, love, and the Filipino value of <em>Bayanihan</em>.
                  </p>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* --- Section 2: Values (Grid) --- */}
        <section 
          ref={addToRefs}
          className={`min-h-screen flex flex-col justify-center py-20 px-6 ${theme.cardBg} border-y ${theme.border} transition-colors duration-500`}
        >
          <div className="max-w-screen-xl mx-auto w-full">
            <FadeIn>
              <div className="text-center mb-20">
                <span className="text-[#C9A25D] text-xs tracking-[0.2em] uppercase mb-4 block">Our Philosophy</span>
                <h2 className={`font-serif text-4xl md:text-5xl ${theme.text}`}>
                    <StaggeredText text="Why We Serve" />
                </h2>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  icon: Clock, 
                  title: "Freshly Sourced", 
                  desc: "We avoid the shortcut of stockpiling. We buy ingredients right before your event to ensure crisp vegetables and fresh meats." 
                },
                { 
                  icon: Heart, 
                  title: "Absolute Honesty", 
                  desc: "We treat your budget like it is our own. There are no hidden fees or shortcuts here. If we promise 500 plates, we serve 500 generous portions." 
                },
                { 
                  icon: Leaf, 
                  title: "Local Roots", 
                  desc: "We are proud natives of Laguna. We hire local servers, cooks, and drivers to support the community that raised us." 
                }
              ].map((item, idx) => (
                <FadeIn key={idx} delay={idx * 150}>
                  <div className={`group relative p-10 h-full border ${theme.border} hover:border-[#C9A25D] transition-colors duration-500 flex flex-col items-center text-center`}>
                    <div className={`absolute top-0 left-0 w-full h-1 bg-[#C9A25D] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
                    <item.icon className={`w-10 h-10 ${theme.accent} mb-8 opacity-80 group-hover:opacity-100 transition-opacity`} strokeWidth={1} />
                    <h4 className={`font-serif text-2xl ${theme.text} mb-4`}>{item.title}</h4>
                    <p className={`${theme.subText} font-light text-sm leading-relaxed`}>
                      {item.desc}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* --- Section 3: The Team --- */}
        <section 
          ref={addToRefs}
          className={`min-h-screen flex flex-col justify-center py-20 px-6 ${theme.bg} transition-colors duration-500`}
        >
          <div className="max-w-screen-xl mx-auto w-full flex flex-col md:flex-row gap-16">
            <div className="w-full md:w-1/3">
              <FadeIn>
                <span className="text-[#C9A25D] text-xs tracking-[0.2em] uppercase mb-4 block">The Kitchen Brigade</span>
                <h2 className={`font-serif text-5xl ${theme.text} mb-8 leading-tight`}>
                  <StaggeredText text="Meet the" /> <br/> 
                  <span className="italic">
                    <StaggeredText text="Masters" />
                  </span>
                </h2>
                {/* REMOVED DASHES IN THIS PARAGRAPH AS REQUESTED */}
                <p className={`${theme.subText} font-light mb-8 text-lg`}>
                  A kitchen is only as good as its hands. Our hierarchy ensures that every aspect of your meal from the main course to the dessert is handled by a specialist.
                </p>
                <button 
                  onClick={() => navigate('/booking')} 
                  className={`group flex items-center gap-2 text-xs tracking-[0.2em] uppercase border-b border-[#C9A25D] pb-1 ${theme.text} hover:text-[#C9A25D] transition-colors font-bold`}
                >
                  Book a Tasting
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </FadeIn>
            </div>

            <div className="w-full md:w-2/3 grid grid-cols-1 gap-6">
              {[
                { 
                  role: "Head Chef", 
                  name: "The Owners", 
                  icon: ChefHat, 
                  desc: "Leading the kitchen team and keeping our family cooking standards high." 
                },
                { 
                  role: "2nd Chef", 
                  name: "Pastry Specialist", 
                  icon: Heart, 
                  desc: "Focused entirely on creating delicious desserts and sweet treats." 
                },
                { 
                  role: "3rd Chef", 
                  name: "Grill Master", 
                  icon: Star, 
                  desc: "Expertly handling the grill station for all roasted and barbecued dishes." 
                },
                { 
                  role: "Support Staff", 
                  name: "Service & Stewardship", 
                  icon: Users, 
                  desc: "Our hardworking team of dishwashers and waiters ensuring smooth service." 
                }
              ].map((member, i) => (
                <FadeIn key={i} delay={i * 100}>
                  <div className={`
                    group flex items-center gap-6 p-6 border ${theme.border} 
                    cursor-default transition-all duration-500
                    hover:border-[#C9A25D]
                    ${darkMode ? 'hover:bg-stone-900' : 'hover:bg-white'} 
                  `}>
                    <div className={`p-4 rounded-full border ${theme.border} ${theme.text} group-hover:bg-[#C9A25D] group-hover:text-white group-hover:border-[#C9A25D] transition-all duration-500`}>
                      <member.icon className="w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <div>
                      <span className="text-[#C9A25D] text-[10px] tracking-[0.2em] uppercase block mb-1">{member.role}</span>
                      <h4 className={`font-serif text-2xl ${theme.text} mb-1 transition-colors duration-300`}>{member.name}</h4>
                      <p className={`text-xs ${theme.subText} group-hover:text-stone-500 dark:group-hover:text-stone-400 transition-colors duration-300`}>{member.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* --- Section 4: Footer --- */}
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

export default AboutUs;