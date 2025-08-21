import React, { useEffect } from 'react';
import { Users, Calendar, Heart, Music2, Star, Award } from 'lucide-react';
import MusicalNotesBackground from '../components/MusicalNotesBackground';

const Home = () => {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  
  const backgroundImages = [
    'https://images.pexels.com/photos/3721941/pexels-photo-3721941.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop', // Orchestre d'harmonie complet
    'https://images.pexels.com/photos/1246437/pexels-photo-1246437.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop', // Section cuivres - trompettes dorées
    'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop', // Chef d'orchestre dirigeant
    'https://images.pexels.com/photos/1751731/pexels-photo-1751731.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop', // Section bois - clarinettes et saxophones
    'https://images.pexels.com/photos/1327430/pexels-photo-1327430.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'  // Ensemble d'instruments à vent
  ];

  useEffect(() => {
    // Carousel d'images de fond
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 5000); // Change toutes les 5 secondes

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

    return () => {
      observer.disconnect();
      clearInterval(imageInterval);
    };
  }, []);

  const features = [
    {
      icon: Star,
      title: 'Des professeurs passionnés',
      description: 'Notre équipe pédagogique expérimentée vous accompagne avec passion'
    },
    {
      icon: Calendar,
      title: 'Des événements toute l\'année',
      description: 'Concerts, masterclasses et événements pour tous les niveaux'
    },
    {
      icon: Heart,
      title: 'Une ambiance conviviale',
      description: 'Un environnement chaleureux propice à l\'apprentissage musical'
    }
  ];

  return (
    <div className="font-inter">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat bg-gray-900" 
      >
        {/* Images de fond avec transition */}
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("${image}")` }}
          />
        ))}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h1 className="font-poppins font-bold text-4xl md:text-5xl text-white mb-6">
              Lyre Cheminote et Municipale de Chalindrey
            </h1>
            <p className="font-inter text-lg text-white mb-8 leading-relaxed">
              Rejoignez notre communauté musicale dynamique !
            </p>
            <p className="font-inter text-base text-orange-200 font-medium mb-12">
              Depuis 1931, nous cultivons la passion musicale
            </p>
          </div>
        </div>
        
        {/* Indicateurs de carousel */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {backgroundImages.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-orange-400 scale-125 shadow-lg' : 'bg-white/60 hover:bg-white/80'}`}
              onClick={() => setCurrentImageIndex(index)}
            />
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gradient-to-br from-orange-25 via-amber-25 to-yellow-25 relative overflow-hidden">
        {/* Notes de musique harmonieuses pour la section Bienvenue */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => {
            const notes = ['♪', '♫', '♬', '♩', '♭', '♯'];
            const note = notes[i % notes.length];
            const delay = i * 2;
            const left = 5 + (i * 8) % 90;
            const top = 10 + (i * 7) % 80;
            const size = 16 + Math.random() * 8;
            const rotation = Math.random() * 360;
            
            return (
              <div
                key={i}
                className="absolute text-amber-600/25 animate-pulse select-none"
                style={{
                  fontSize: `${size}px`,
                  left: `${left}%`,
                  top: `${top}%`,
                  transform: `rotate(${rotation}deg)`,
                  animationDelay: `${delay}s`,
                  animationDuration: '3s',
                  textShadow: '0 0 10px rgba(245, 158, 11, 0.3)'
                }}
              >
                {note}
              </div>
            );
          })}
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center animate-fade-in relative z-10">
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-orange-800 mb-8">
              Bienvenue
            </h2>
            <div className="space-y-6 text-base leading-relaxed text-gray-800">
              <p className="font-inter">
                Association musicale fondée en 1931, la Lyre n'a cessé, de croches en noires, de répétitions en répétitions, de concerts en concerts, de voyages en rivages et presque sans anicroches, de motiver jeunes et sages à vivre et partager ce langage aux mille et une harmoniques...
              </p>
              <p className="font-inter">
                La Lyre, ce n'est pas seulement un orchestre d'Harmonie, c'est aussi une École fixant les bases musicales théoriques et pratiques nécessaires, afin de gravir les échelons menant des petits orchestres au Grand.
              </p>
              <p className="font-inter">
                Spectateur(s) à l'ouïe fine, futur(e)s virtuose(s) ou simplement curieux(ses), n'hésitez pas à prendre le temps de parcourir notre site afin de nous connaître un peu mieux.
              </p>
              <p className="font-inter text-gray-700 leading-relaxed">
                En ayant l'espoir de vous voir à notre prochain concert ou au sein de notre groupe, nous vous souhaitons une agréable journée et vous remercions de votre visite.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Rejoignez-nous */}
      <section className="py-20 bg-gradient-to-br from-slate-100 via-gray-100 to-blue-100 relative overflow-hidden">
        {/* Notes de musique élégantes pour la section Rejoignez-nous */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(10)].map((_, i) => {
            const notes = ['♭', '♯', '♪', '♫', '♬', '♩'];
            const note = notes[i % notes.length];
            const delay = i * 1.8;
            const left = 8 + (i * 9) % 84;
            const top = 12 + (i * 8) % 76;
            const size = 14 + Math.random() * 6;
            const rotation = Math.random() * 360;
            
            return (
              <div
                key={i}
                className="absolute text-slate-500/20 animate-bounce select-none"
                style={{
                  fontSize: `${size}px`,
                  left: `${left}%`,
                  top: `${top}%`,
                  transform: `rotate(${rotation}deg)`,
                  animationDelay: `${delay}s`,
                  animationDuration: '2.5s',
                  textShadow: '0 0 8px rgba(100, 116, 139, 0.2)'
                }}
              >
                {note}
              </div>
            );
          })}
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="bg-gradient-to-br from-slate-500 to-gray-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8 shadow-lg">
              <Music2 className="h-10 w-10 text-white" />
            </div>
            <h2 className="font-poppins font-bold text-3xl text-gray-800 mb-6">Rejoignez-nous</h2>
            <p className="font-inter text-gray-600 leading-relaxed mb-6">
              Chaque concert est une nouvelle page de notre histoire musicale. Venez partager ces moments d'émotion et de partage avec La Lyre Cheminote et Municipale de Chalindrey.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="bg-gradient-to-br from-slate-100 to-gray-100 rounded-2xl p-6 mb-4">
                  <Calendar className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-800">Concerts réguliers</h3>
                  <p className="text-gray-600 mt-2">Plusieurs représentations par an</p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-6 mb-4">
                  <Users className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-800">Tous niveaux</h3>
                  <p className="text-gray-600 mt-2">De l'éveil au niveau supérieur</p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-br from-blue-100 to-slate-100 rounded-2xl p-6 mb-4">
                  <Music2 className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-800">Répertoire varié</h3>
                  <p className="text-gray-600 mt-2">Classique, moderne, populaire</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;