import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const Contact = () => {
  const contactInfo = [
    {
      icon: MapPin,
      title: 'Adresse',
      content: ['123 Rue de la Musique', '75001 Paris, France']
    },
    {
      icon: Phone,
      title: 'Téléphone',
      content: ['01 23 45 67 89']
    },
    {
      icon: Mail,
      title: 'Email',
      content: ['contact@ecolelyre.fr', 'info@ecolelyre.fr']
    },
    {
      icon: Clock,
      title: 'Horaires',
      content: ['Lun-Ven: 9h-20h', 'Sam: 9h-18h', 'Dim: Fermé']
    }
  ];

  return (
    <div className="font-inter">
      {/* Header Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat bg-gray-900" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("https://images.pexels.com/photos/1751731/pexels-photo-1751731.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop")` 
        }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in relative z-10">
            <h1 className="font-poppins font-bold text-4xl md:text-5xl text-white mb-6">
              Contactez-nous.
            </h1>
            <p className="font-inter text-base text-white/90 max-w-2xl mx-auto">
              Nous sommes là pour répondre à toutes vos questions sur nos cours, 
              nos événements et notre école de musique.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20 bg-gradient-to-br from-blue-25 via-indigo-25 to-purple-25">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactInfo.map((info, index) => (
              <div key={index} className="text-center animate-fade-in bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-md hover:shadow-lg transition-all duration-300">
                <div className="bg-gradient-to-br from-indigo-400 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <info.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-poppins font-semibold text-xl text-dark mb-4">
                  {info.title}
                </h3>
                <div className="space-y-1">
                  {info.content.map((line, lineIndex) => (
                    <p key={lineIndex} className="font-inter text-gray-600">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map Placeholder and Additional Info */}
      <section className="py-20 bg-gradient-to-br from-emerald-25 via-teal-25 to-cyan-25">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Map Placeholder */}
            <div className="animate-fade-in">
              <div className="bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg h-80 flex items-center justify-center shadow-lg">
                <MapPin className="h-16 w-16 text-white/80" />
              </div>
            </div>
            
            {/* Additional Information */}
            <div className="animate-fade-in bg-white/60 backdrop-blur-sm rounded-xl p-8 border border-white/50 shadow-md">
              <h2 className="font-poppins font-bold text-3xl text-dark mb-6">
                Venez nous rendre visite
              </h2>
              <p className="font-inter text-sm text-gray-600 mb-6 leading-relaxed">
                Notre école de musique est située au cœur de Paris, dans un quartier 
                facilement accessible en transport en commun. Nous disposons d'espaces 
                d'accueil confortables pour les parents et les élèves.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-gradient-to-br from-teal-400 to-cyan-500 p-2 rounded-full mt-1 shadow-md">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-poppins font-semibold text-dark">Transport</h4>
                    <p className="font-inter text-gray-600 text-sm">
                      Métro ligne 1 et 4, Bus 21, 27, 39
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-2 rounded-full mt-1 shadow-md">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-poppins font-semibold text-dark">Rendez-vous</h4>
                    <p className="font-inter text-gray-600 text-sm">
                      Sur rendez-vous pour les visites et inscriptions
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;