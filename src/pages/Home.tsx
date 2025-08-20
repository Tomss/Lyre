import React, { useEffect } from 'react';
import { Users, Calendar, Heart, Music2, Star, Award } from 'lucide-react';

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
            <h1 className="font-poppins font-bold text-3xl md:text-5xl text-white mb-6">
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
      <section className="py-20 bg-gradient-to-br from-orange-25 via-amber-25 to-yellow-25">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h2 className="font-poppins font-bold text-2xl md:text-3xl text-orange-800 mb-8">
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
              <p className="font-inter font-medium text-orange-600 text-lg">
              <p className="font-inter font-medium text-orange-600 text-xl">
                En ayant l'espoir de vous voir à notre prochain concert ou au sein de notre groupe, nous vous souhaitons une agréable journée et vous remercions de votre visite.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-blue-25 via-indigo-25 to-purple-25">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="animate-on-scroll text-center group hover:transform hover:-translate-y-2 transition-all duration-300 bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-md hover:shadow-lg"
              >
                <div className="bg-gradient-to-br from-indigo-400 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-poppins font-semibold text-xl text-dark mb-4">
                <h3 className="font-poppins font-semibold text-xl text-dark mb-4">
                  {feature.title}
                </h3>
                <p className="font-inter text-sm text-gray-700 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events Preview Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-25 via-teal-25 to-cyan-25">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-on-scroll text-center mb-12">
            <h2 className="font-poppins font-bold text-2xl md:text-3xl text-dark mb-4">
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-dark mb-4">
              Nos Événements
            </h2>
            <p className="font-inter text-base text-gray-600 max-w-2xl mx-auto">
              Découvrez nos prochains concerts et événements musicaux
            </p>
          </div>
          
          <div className="animate-on-scroll grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Event Cards Placeholder */}
            {[1, 2, 3].map((item) => (
              <div 
                key={item}
                className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border border-white/50"
              >
                <div className="p-6">
                  <h3 className="font-poppins font-semibold text-xl text-dark mb-2">
                  <h3 className="font-poppins font-semibold text-xl text-dark mb-2">
                    Événement à venir
                  </h3>
                  <p className="font-inter text-sm text-gray-600 mb-4">
                    Les détails seront bientôt disponibles. Restez connectés !
                  </p>
                  <div className="flex items-center text-sm text-teal-600">
                    <Calendar className="h-4 w-4 mr-2 text-teal-500" />
                    <span>Date à confirmer</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;