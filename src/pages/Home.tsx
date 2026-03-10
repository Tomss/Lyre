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

  // Images par défaut (fallback)
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
      {/* Hero Section */}
      <section id="accueil" className="relative min-h-screen flex items-center py-24 md:py-32 justify-center bg-cover bg-center bg-no-repeat bg-gray-900 overflow-hidden"
      >
        {/* Images de fond avec transition */}
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.6)), url("${image}")` }}
          />
        ))}
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex flex-col items-center justify-center text-center">
            {/* Main Title Only */}
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

      {/* Nouvelle Section La Lyre */}
      <section id="la-lyre" className="scroll-mt-20 py-20 bg-slate-50 border-b border-slate-100 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center mb-12 animate-on-scroll">
              <h2 className="text-3xl md:text-5xl font-poppins font-bold text-slate-800 mb-6 relative inline-block">
                Qui sommes-nous ?
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-1 bg-teal-500 rounded-full"></div>
              </h2>
            </div>
            
            <div className="max-w-3xl mx-auto text-center space-y-8 animate-on-scroll">
               <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
                  <strong className="font-semibold text-slate-800">Association musicale fondée en 1886</strong>, La Lyre, de croches en noires, de répétitions en répétitions, de concerts en concerts, de voyages en rivages, motive jeunes et moins jeunes, sages et exubérants, à vivre et partager ce langage aux mille et une harmoniques...
               </p>

               <div className="bg-white rounded-2xl p-8 md:p-12 shadow-md border border-slate-100">
                 <p className="text-lg md:text-xl text-slate-700 leading-relaxed mb-6">
                    L’association <strong className="text-teal-600 uppercase tracking-wide">LYRE</strong>, c'est un <strong className="font-semibold text-slate-800">orchestre d'Harmonie</strong>.
                 </p>
                 <div className="w-16 h-px bg-slate-200 mx-auto my-6"></div>
                 <p className="text-lg md:text-xl text-slate-700 leading-relaxed">
                    Et c'est aussi une <strong className="text-teal-600 uppercase tracking-wide">ÉCOLE</strong> fixant les bases musicales théoriques et pratiques, nécessaires afin de gravir les échelons des petits orchestres vers le Grand.
                 </p>
               </div>

               <p className="italic text-teal-700 text-lg md:text-xl font-medium mt-8 pt-6 border-t border-slate-200 inline-block">
                  Spectateurs à l'ouïe fine, futur(e)s virtuoses ou simples curieux(se)s, prenez le temps de parcourir notre site..
               </p>
            </div>
        </div>
      </section>

      {/* History Section */}



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
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-4 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
                  <Calendar className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-slate-800">Concerts réguliers</h3>
                  <p className="text-slate-500 mt-2 text-sm">Plusieurs représentations par an</p>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-4 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
                  <Users className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-indigo-900">Tous niveaux</h3>
                  <p className="text-indigo-700 mt-2 text-sm">De l'éveil au niveau supérieur</p>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6 mb-4 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
                  <Music2 className="h-8 w-8 text-teal-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-teal-900">Répertoire varié</h3>
                  <p className="text-teal-700 mt-2 text-sm">Classique, moderne, populaire</p>
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