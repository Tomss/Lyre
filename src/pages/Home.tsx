import React, { useEffect } from 'react';
import { Users, Calendar, Music2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

import PartnersSection from '../components/PartnersSection';
import HomeNewsSection from '../components/HomeNewsSection';
import HomeAgendaSection from '../components/HomeAgendaSection';
import { API_URL } from '../config';

const Home = () => {
  const [backgroundImages, setBackgroundImages] = React.useState<string[]>([]);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  // Fallback images
  const defaultImages = [
    'https://images.pexels.com/photos/3721941/pexels-photo-3721941.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    'https://images.pexels.com/photos/1246437/pexels-photo-1246437.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    'https://images.pexels.com/photos/1751731/pexels-photo-1751731.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    'https://images.pexels.com/photos/1327430/pexels-photo-1327430.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
  ];

  useEffect(() => {
    const fetchCarouselImages = async () => {
      try {
        const response = await fetch(`${API_URL}/carousel`);
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setBackgroundImages(data.map((item: any) => item.image_url));
          } else {
            setBackgroundImages(defaultImages);
          }
        } else {
          setBackgroundImages(defaultImages);
        }
      } catch (error) {
        console.error('Error fetching carousel images:', error);
        setBackgroundImages(defaultImages);
      }
    };

    fetchCarouselImages();
  }, []);

  // Mouse Parallax Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 30;
      const y = (clientY / window.innerHeight - 0.5) * 30;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="font-inter">
      {/* Hero Section: Kinetic Photo Wall (V2) */}
      <section id="accueil" className="relative h-screen w-full bg-slate-950 overflow-hidden flex items-center justify-center">
        {/* Parallax Container */}
        <div 
          className="absolute inset-x-[-10%] inset-y-[-10%] w-[120%] h-[120%] flex gap-4 md:gap-8 opacity-60 pointer-events-none px-4 transition-transform duration-300 ease-out"
          style={{ transform: `translate3d(${mousePosition.x}px, ${mousePosition.y}px, 0)` }}
        >
          {[0, 1, 2, 3, 4].map((colIndex) => {
            const colImages = [...backgroundImages, ...backgroundImages, ...backgroundImages].filter((_, i) => i % 5 === colIndex);
            
            // Column variations for "Disordered" look
            const colConfigs = [
              { speed: '75s', drift: 'animate-drift-slow', offset: '-mt-32' },
              { speed: '55s', drift: 'animate-drift-fast', offset: 'mt-16' },
              { speed: '90s', drift: 'animate-drift-slow', offset: '-mt-56' },
              { speed: '60s', drift: 'animate-drift-fast', offset: 'mt-40' },
              { speed: '80s', drift: 'animate-drift-slow', offset: '-mt-20' },
            ];
            const config = colConfigs[colIndex] || colConfigs[0];

            return (
              <div 
                key={colIndex} 
                className={`flex-1 flex flex-col gap-6 md:gap-12 ${config.offset} ${
                  colIndex % 2 === 0 ? 'animate-scroll-vertical' : 'animate-scroll-vertical-reverse'
                }`}
                style={{ animationDuration: config.speed }}
              >
                {colImages.map((image, imgIndex) => (
                  <div 
                    key={imgIndex}
                    className={`relative rounded-[2.5rem] bg-slate-900 border border-white/5 shadow-2xl overflow-hidden group/img transition-all duration-1000 ${config.drift}`}
                    style={{ 
                      animationDelay: `${imgIndex * 0.8 + colIndex * 1.5}s`,
                      animationDuration: config.speed === '55s' ? '25s' : '40s'
                    }}
                  >
                    {/* The actual image - using bg-cover with improved positioning */}
                    <div 
                      className="w-full aspect-[4/5] bg-cover bg-center transition-transform duration-1000 group-hover/img:scale-110"
                      style={{ backgroundImage: `url("${image}")` }}
                    />
                    {/* Subtle overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent"></div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Minimalist Kinetic Title */}
        <div className="relative z-20 pointer-events-none text-center">
            <h1 className="flex flex-col items-center gap-4 font-poppins font-extrabold text-white select-none">
              <span className="text-9xl md:text-[18rem] tracking-tight leading-none drop-shadow-[0_30px_60px_rgba(0,0,0,1)] flex items-center">
                La <span className="text-transparent bg-clip-text bg-gradient-to-br from-teal-200 via-emerald-400 to-cyan-400 ml-6 md:ml-16 drop-shadow-[0_0_50px_rgba(45,212,191,0.6)]">Lyre</span>
              </span>
            </h1>
        </div>

        {/* Dynamic Scroll Indicator */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-6">
            <div className="w-[1px] h-24 bg-gradient-to-b from-white to-transparent opacity-30"></div>
        </div>
      </section>

      {/* Qui sommes-nous ? Section */}
      <section id="la-lyre" className="scroll-mt-20 py-24 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center mb-16 animate-on-scroll">
              <h2 className="text-4xl md:text-6xl font-poppins font-extrabold text-slate-800 mb-8 relative inline-block">
                Qui sommes-nous ?
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-teal-500 rounded-full"></div>
              </h2>
            </div>
            
            <div className="max-w-4xl mx-auto text-center space-y-12 animate-on-scroll">
               <p className="text-xl md:text-2xl text-slate-600 leading-relaxed font-light">
                  <strong className="font-bold text-slate-800">Association musicale fondée en 1886</strong>, La Lyre, de croches en noires, de répétitions en répétitions, de concerts en concerts, de voyages en rivages, motive jeunes et moins jeunes, sages et exubérants, à vivre et partager ce langage aux mille et une harmoniques...
               </p>

               <div className="group relative bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl border border-slate-100 overflow-hidden hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-700">
                 <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500/5 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                 
                 <p className="relative z-10 text-2xl md:text-3xl text-slate-700 leading-relaxed mb-10 group-hover:text-slate-900 transition-colors">
                    L’association <strong className="text-teal-600 font-extrabold">LYRE</strong>, c'est un <strong className="font-extrabold text-slate-800">orchestre d'Harmonie</strong>.
                 </p>
                 <div className="w-32 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mx-auto my-10 group-hover:scale-x-150 transition-transform duration-1000"></div>
                 <p className="relative z-10 text-2xl md:text-3xl text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">
                    Et c'est aussi une <strong className="text-teal-600 font-extrabold">ÉCOLE</strong> fixant les bases musicales indispensables pour gravir les échelons du Grand Orchestre.
                 </p>
               </div>

               <p className="italic text-teal-700 text-xl md:text-2xl font-semibold mt-12 py-8 border-y border-slate-100 inline-block">
                  Spectateurs à l'ouïe fine, futur(e)s virtuoses ou simples curieux(se)s, prenez le temps de parcourir notre site..
               </p>
            </div>
        </div>
      </section>

      {/* News Section */}
      <HomeNewsSection />

      {/* Agenda Section */}
      <HomeAgendaSection />

      {/* Partners Section */}
      <PartnersSection />

      {/* Section Rejoignez-nous */}
      <section id="rejoignez-nous" className="scroll-mt-20 py-24 bg-slate-50 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-[2rem] w-24 h-24 flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-teal-500/30 animate-bounce-slow">
              <Music2 className="h-12 w-12 text-white" />
            </div>
            <h2 className="font-poppins font-extrabold text-4xl md:text-5xl text-slate-800 mb-8">Partageons l'Émotion</h2>
            <p className="font-inter text-xl text-slate-600 leading-relaxed mb-16 max-w-3xl mx-auto">
              Chaque concert est une nouvelle page de notre histoire. Venez vibrer avec La Lyre Cheminote et Municipale de Chalindrey.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mt-12">
              <div className="text-center group">
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 transition-all duration-700 group-hover:-translate-y-4 group-hover:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] group-hover:border-teal-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-6 group-hover:text-teal-500 group-hover:scale-110 transition-all duration-700" />
                  <h3 className="font-extrabold text-slate-800 text-xl mb-3">Saison Musicale</h3>
                  <p className="text-slate-500 text-sm">Des rendez-vous incontournables</p>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 transition-all duration-700 group-hover:-translate-y-4 group-hover:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] group-hover:border-indigo-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <Users className="h-12 w-12 text-slate-300 mx-auto mb-6 group-hover:text-indigo-500 group-hover:scale-110 transition-all duration-700" />
                  <h3 className="font-extrabold text-slate-800 text-xl mb-3">Ensemble Unique</h3>
                  <p className="text-slate-500 text-sm">Une famille de musiciens passionnés</p>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 transition-all duration-700 group-hover:-translate-y-4 group-hover:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] group-hover:border-cyan-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <Music2 className="h-12 w-12 text-slate-300 mx-auto mb-6 group-hover:text-cyan-500 group-hover:scale-110 transition-all duration-700" />
                  <h3 className="font-extrabold text-slate-800 text-xl mb-3">Art du Partage</h3>
                  <p className="text-slate-500 text-sm">Un répertoire ouvert sur le monde</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section >
    </div >
  );
};

export default Home;