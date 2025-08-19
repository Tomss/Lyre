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
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-dark mb-8">
              Notre Histoire
            </h2>
            <div className="space-y-6 text-lg leading-relaxed text-gray-700">
              <p className="font-inter">
                La Lyre, ce n'est pas seulement un orchestre d'Harmonie, c'est aussi une École fixant les bases musicales théoriques et pratiques nécessaires, afin de gravir les échelons menant des petits orchestres au Grand.
              </p>
              <p className="font-inter">
                Spectateur(s) à l'ouïe fine, futur(e)s virtuose(s) ou simplement curieux(ses), n'hésitez pas à prendre le temps de parcourir notre site afin de nous connaître un peu mieux.
              </p>
              <p className="font-inter font-medium text-primary">
                En ayant l'espoir de vous voir à notre prochain concert ou au sein de notre groupe, nous vous souhaitons une agréable journée et vous remercions de votre visite.
              </p>
            </div>
            <div className="mt-12">
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-primary/20 p-4 rounded-full">
                    <Music className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h3 className="font-poppins font-semibold text-xl text-dark mb-4">
                  Depuis 1931
                </h3>
                <p className="font-inter text-gray-600">
                  Plus de 90 ans d'histoire musicale au service de la passion et de l'apprentissage
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-dark mb-8">
              Notre Histoire
            </h2>
            <div className="space-y-6 text-lg leading-relaxed text-gray-700">
              <p className="font-inter">
                Association musicale fondée en 1931, la Lyre n'a cessé, de croches en noires, de répétitions en répétitions, de concerts en concerts, de voyages en rivages et presque sans anicroches, de motiver jeunes et sages à vivre et partager ce langage aux mille et une harmoniques...
              </p>
              <p className="font-inter">
                La Lyre, ce n'est pas seulement un orchestre d'Harmonie, c'est aussi une École fixant les bases musicales théoriques et pratiques nécessaires, afin de gravir les échelons menant des petits orchestres au Grand.
              </p>
              <p className="font-inter">
                Spectateur(s) à l'ouïe fine, futur(e)s virtuose(s) ou simplement curieux(ses), n'hésitez pas à prendre le temps de parcourir notre site afin de nous connaître un peu mieux.
              </p>
              <p className="font-inter font-medium text-primary">
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
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-accent/10 transition-colors duration-300">
                  <feature.icon className="h-8 w-8 text-primary group-hover:text-accent transition-colors duration-300" />
                </div>
                <h3 className="font-poppins font-semibold text-xl text-dark mb-4">
                  {feature.title}
                </h3>
                <p className="font-inter text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events Preview Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-on-scroll text-center mb-12">
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-dark mb-4">
              Nos prochains événements
            </h2>
            <p className="font-inter text-lg text-gray-600 max-w-2xl mx-auto">
              Découvrez nos concerts, masterclasses et événements à venir. 
              Rejoignez notre communauté musicale dynamique !
            </p>
          </div>
          
          <div className="animate-on-scroll grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Event Cards Placeholder */}
            {[1, 2, 3].map((item) => (
              <div 
                key={item} 
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20"></div>
                <div className="p-6">
                  <h3 className="font-poppins font-semibold text-xl text-dark mb-2">
                    Événement à venir
                  </h3>
                  <p className="font-inter text-gray-600 mb-4">
                    Les détails seront bientôt disponibles. Restez connectés !
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
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