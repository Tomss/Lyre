import React, { useEffect } from 'react';
import { Users, Calendar, Music2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

import PartnersSection from '../components/PartnersSection';
import HomeNewsSection from '../components/HomeNewsSection';
import HomeAgendaSection from '../components/HomeAgendaSection';
import { API_URL } from '../config';

const Home = () => {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [backgroundImages, setBackgroundImages] = React.useState<string[]>([]);

  // Fallback images
  const defaultImages = [
    'https://images.pexels.com/photos/3721941/pexels-photo-3721941.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    'https://images.pexels.com/photos/1246437/pexels-photo-1246437.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    'https://images.pexels.com/photos/1751731/pexels-photo-1751731.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    'https://images.pexels.com/photos/1327430/pexels-photo-1327430.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
  ];

  const { settings } = useTheme();

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

  useEffect(() => {
    if (backgroundImages.length === 0) return;

    // Carousel d'images de fond
    const intervalTime = parseInt(settings.carousel_interval || '5000');
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, intervalTime);

    return () => {
      clearInterval(imageInterval);
    };
  }, [backgroundImages, settings.carousel_interval]);

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
      {/* Hero Section - Classic Carousel Version */}
      <section id="accueil" className="relative min-h-screen flex items-center py-24 md:py-32 justify-center bg-gray-900 overflow-hidden">
        {/* Images de fond avec transition */}
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.6)), url("${image}")` }}
          />
        ))}
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex flex-col items-center justify-center text-center">
            <h1 className="flex flex-col items-center gap-4 font-poppins font-bold text-white mb-8 animate-fade-in-up">
              <span className="text-7xl md:text-[8rem] tracking-tighter drop-shadow-2xl leading-none">
                La <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-500">Lyre</span>
              </span>
              <div className="h-1 w-24 md:w-32 bg-gradient-to-r from-transparent via-teal-400 to-transparent my-2 opacity-80"></div>
              <span className="text-xl md:text-3xl font-light tracking-[0.3em] uppercase text-white/90 drop-shadow-lg text-center">
                École de Musique de Chalindrey
              </span>
            </h1>
        </div>

        {/* Indicateurs de carousel */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4 z-20">
          {backgroundImages.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-teal-400 scale-125 shadow-[0_0_10px_rgba(45,212,191,0.8)]' : 'bg-white/40 hover:bg-white/60'}`}
              onClick={() => setCurrentImageIndex(index)}
              aria-label={`Aller à l'image ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Qui sommes-nous ? Section */}
      <section id="la-lyre" className="scroll-mt-20 py-24 bg-white relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[500px] h-[500px] bg-teal-50/50 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-cyan-50/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] font-bold text-slate-50 select-none pointer-events-none z-0 opacity-40 font-poppins">
          LYRE
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center mb-16 animate-on-scroll">
              <h2 className="text-4xl md:text-6xl font-poppins font-extrabold text-slate-900 mb-6 relative inline-block">
                Qui sommes-nous ?
                <div className="absolute -bottom-4 left-0 w-1/2 h-1.5 bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full"></div>
              </h2>
            </div>
            
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24 animate-on-scroll">
               {/* Site Logo - Floating & Integrated */}
               <div className="lg:w-2/5 flex justify-center order-2 lg:order-1">
                 <div className="relative">
                   {/* Multiple layered glows for a soft organic feel */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-tr from-teal-500/10 via-cyan-400/5 to-transparent rounded-full blur-[80px] animate-pulse-slow"></div>
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-white/60 rounded-full blur-3xl"></div>
                   
                   <div className="relative animate-float">
                      <img 
                        src={settings.secondary_logo_url || settings.site_logo_url || "/lyre-logo.png"} 
                        alt="Logo de La Lyre" 
                        className="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-transform duration-700 hover:scale-110"
                      />
                   </div>
                 </div>
               </div>

               {/* Content - Clean & Typedographic */}
               <div className="lg:w-3/5 text-center lg:text-left space-y-10 order-1 lg:order-2">
                  <div className="space-y-6">
                    <p className="text-xl md:text-3xl text-slate-700 leading-snug font-poppins font-light">
                       <span className="text-teal-600 font-bold border-b-2 border-teal-100 pb-1">Depuis 1886</span>, La Lyre est bien plus qu'une association.
                    </p>
                    <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-2xl">
                       De croches en noires, de répétitions en répétitions, notre ensemble motive jeunes et moins jeunes à vivre et partager ce langage aux mille et une harmoniques.
                    </p>
                  </div>

                  <div className="space-y-8 py-4">
                    <div className="flex items-start gap-4">
                      <div className="w-1.5 h-12 bg-gradient-to-b from-teal-500 to-cyan-400 rounded-full mt-1 shrink-0"></div>
                      <div>
                        <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Orchestre d'Harmonie</h3>
                        <p className="text-slate-600 text-lg">Le cœur battant de notre association, où la passion rencontre l'excellence collective.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-1.5 h-12 bg-gradient-to-b from-cyan-400 to-indigo-400 rounded-full mt-1 shrink-0"></div>
                      <div>
                        <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">École de Musique</h3>
                        <p className="text-slate-600 text-lg">La transmission du savoir pour forger les virtuoses de demain.</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 block">
                    <p className="text-teal-700 text-lg md:text-xl font-medium flex items-center gap-3 justify-center lg:justify-start">
                      <span className="h-px w-8 bg-teal-200"></span>
                      Prenez le temps de parcourir notre univers..
                    </p>
                  </div>
               </div>
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
      <section id="rejoignez-nous" className="scroll-mt-20 py-20 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-teal-500/20">
              <Music2 className="h-10 w-10 text-white" />
            </div>
            <h2 className="font-poppins font-bold text-3xl text-slate-800 mb-6">Rejoignez-nous</h2>
            <p className="font-inter text-slate-600 leading-relaxed mb-6">
              Chaque concert est une nouvelle page de notre histoire musicale. Venez partager ces moments d'émotion et de partage avec La Lyre Cheminote et Municipale de Chalindrey.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center group">
                <div className="bg-white border border-slate-100 rounded-3xl p-8 mb-4 transition-all duration-500 group-hover:-translate-y-3 group-hover:shadow-2xl group-hover:border-teal-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <Calendar className="h-10 w-10 text-slate-400 mx-auto mb-4 group-hover:text-teal-500 group-hover:scale-110 transition-all duration-500" />
                  <h3 className="font-bold text-slate-800 text-lg mb-2">Concerts réguliers</h3>
                  <p className="text-slate-500 text-sm">Plusieurs représentations par an</p>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-white border border-slate-100 rounded-3xl p-8 mb-4 transition-all duration-500 group-hover:-translate-y-3 group-hover:shadow-2xl group-hover:border-indigo-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <Users className="h-10 w-10 text-slate-400 mx-auto mb-4 group-hover:text-indigo-500 group-hover:scale-110 transition-all duration-500" />
                  <h3 className="font-bold text-slate-800 text-lg mb-2">Tous niveaux</h3>
                  <p className="text-slate-500 text-sm">De l'éveil au niveau supérieur</p>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-white border border-slate-100 rounded-3xl p-8 mb-4 transition-all duration-500 group-hover:-translate-y-3 group-hover:shadow-2xl group-hover:border-cyan-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <Music2 className="h-10 w-10 text-slate-400 mx-auto mb-4 group-hover:text-cyan-500 group-hover:scale-110 transition-all duration-500" />
                  <h3 className="font-bold text-slate-800 text-lg mb-2">Répertoire varié</h3>
                  <p className="text-slate-500 text-sm">Classique, moderne, populaire</p>
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