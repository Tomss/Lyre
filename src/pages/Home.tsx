import React, { useEffect } from 'react';
import { Users, Calendar, Heart, Music2, Star, Award } from 'lucide-react';

const Home = () => {
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
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(234, 88, 12, 0.3)), url("https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop")'
        }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h1 className="font-poppins font-bold text-4xl md:text-6xl text-white mb-6">
              Bienvenue à la Lyre
            </h1>
            <p className="font-inter text-xl text-orange-100 mb-8 leading-relaxed">
              Rejoignez notre communauté musicale dynamique !
            </p>
            <p className="font-inter text-lg text-orange-300 font-medium mb-12">
              Depuis 1931, nous cultivons la passion musicale
            </p>
            <div className="mt-12">
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-8">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-orange-200">
                  <div className="bg-orange-100 p-4 rounded-full">
                    <Music2 className="h-12 w-12 text-orange-600" />
                  </div>
                </div>
                <h3 className="font-poppins font-semibold text-2xl text-orange-800 mb-4">
                  Depuis 1931
                </h3>
                <p className="font-inter text-gray-700 text-lg">
                  Plus de 90 ans d'histoire musicale au service de la passion et de l'apprentissage
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-orange-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-orange-800 mb-8">
              Notre Histoire
            </h2>
            <div className="space-y-6 text-lg leading-relaxed text-gray-800">
              <p className="font-inter">
                Association musicale fondée en 1931, la Lyre n'a cessé, de croches en noires, de répétitions en répétitions, de concerts en concerts, de voyages en rivages et presque sans anicroches, de motiver jeunes et sages à vivre et partager ce langage aux mille et une harmoniques...
              </p>
              <p className="font-inter">
                La Lyre, ce n'est pas seulement un orchestre d'Harmonie, c'est aussi une École fixant les bases musicales théoriques et pratiques nécessaires, afin de gravir les échelons menant des petits orchestres au Grand.
              </p>
              <p className="font-inter">
                Spectateur(s) à l'ouïe fine, futur(e)s virtuose(s) ou simplement curieux(ses), n'hésitez pas à prendre le temps de parcourir notre site afin de nous connaître un peu mieux.
              </p>
              <p className="font-inter font-medium text-orange-600 text-xl">
                En ayant l'espoir de vous voir à notre prochain concert ou au sein de notre groupe, nous vous souhaitons une agréable journée et vous remercions de votre visite.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="animate-on-scroll text-center group hover:transform hover:-translate-y-2 transition-all duration-300"
              >
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-200 transition-colors duration-300">
                  <feature.icon className="h-8 w-8 text-orange-600 group-hover:text-orange-700 transition-colors duration-300" />
                </div>
                <h3 className="font-poppins font-semibold text-xl text-orange-800 mb-4">
                  {feature.title}
                </h3>
                <p className="font-inter text-gray-700 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events Preview Section */}
      <section className="py-20 bg-orange-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-on-scroll text-center mb-12">
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-orange-800 mb-4">
              Nos Événements
            </h2>
            <p className="font-inter text-lg text-gray-700 max-w-2xl mx-auto">
              Découvrez nos prochains concerts et événements musicaux
            </p>
          </div>
          
          <div className="animate-on-scroll grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Event Cards Placeholder */}
            {[1, 2, 3].map((item) => (
              <div 
                key={item}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border border-orange-100"
              >
                <div className="p-6">
                  <h3 className="font-poppins font-semibold text-xl text-orange-800 mb-2">
                    Événement à venir
                  </h3>
                  <p className="font-inter text-gray-700 mb-4">
                    Les détails seront bientôt disponibles. Restez connectés !
                  </p>
                  <div className="flex items-center text-sm text-orange-600">
                    <Calendar className="h-4 w-4 mr-2 text-orange-500" />
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