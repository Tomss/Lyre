import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, User, MessageSquare, CheckCircle, AlertCircle, Music } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormStatus {
  type: 'idle' | 'loading' | 'success' | 'error';
  message: string;
}

const Contact = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  
  const [formStatus, setFormStatus] = useState<FormStatus>({
    type: 'idle',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus({ type: 'loading', message: 'Envoi en cours...' });
    
    // Simulation d'envoi
    setTimeout(() => {
      setFormStatus({ 
        type: 'success', 
        message: 'Message envoyé ! Nous vous répondrons rapidement.' 
      });
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      
      setTimeout(() => {
        setFormStatus({ type: 'idle', message: '' });
      }, 4000);
    }, 1500);
  };

  const subjectOptions = [
    'Inscription à l\'école',
    'Informations sur les cours',
    'Rejoindre un orchestre',
    'Événements et concerts',
    'Partenariat',
    'Autre demande'
  ];

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Adresse',
      content: 'Lyre Cheminote et Municipale\nChalindrey, Haute-Marne',
      color: 'from-orange-400 to-amber-500'
    },
    {
      icon: Phone,
      title: 'Téléphone',
      content: '03 25 88 XX XX',
      color: 'from-amber-400 to-yellow-500'
    },
    {
      icon: Mail,
      title: 'Email',
      content: 'contact@lyre-chalindrey.fr',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Clock,
      title: 'Horaires',
      content: 'Cours selon planning\nRenseignements sur demande',
      color: 'from-amber-500 to-orange-600'
    }
  ];

  return (
    <div className="font-inter">
      {/* Hero Section - Plus soft */}
      <section className="relative h-[60vh] flex items-center justify-center bg-cover bg-center bg-no-repeat" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url("https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop")` 
        }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h1 className="font-poppins font-bold text-3xl md:text-4xl text-white mb-4">
              Contactez-nous
            </h1>
            <p className="font-inter text-lg text-white/90 max-w-2xl mx-auto">
              Une question ? Un projet musical ? Nous sommes là pour vous accompagner.
            </p>
          </div>
        </div>
      </section>

      {/* Section principale - Formulaire + Maps */}
      <section className="py-16 bg-gradient-to-br from-orange-25 via-amber-25 to-yellow-25">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              
              {/* Formulaire de Contact - Gauche */}
              <div className="animate-fade-in">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
                  {/* Header du formulaire */}
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="font-poppins font-semibold text-xl">Écrivez-nous</h2>
                        <p className="text-orange-100 text-sm">Nous vous répondrons rapidement</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Notification de statut */}
                    {formStatus.type !== 'idle' && (
                      <div className={`mb-6 p-4 rounded-lg border ${
                        formStatus.type === 'success' 
                          ? 'bg-green-50 border-green-200 text-green-800' 
                          : formStatus.type === 'error'
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : 'bg-orange-50 border-orange-200 text-orange-800'
                      }`}>
                        <div className="flex items-center space-x-3">
                          {formStatus.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                          {formStatus.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
                          {formStatus.type === 'loading' && (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-600 border-t-transparent"></div>
                          )}
                          <span className="font-medium text-sm">{formStatus.message}</span>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nom complet *
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <User className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              required
                              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                              placeholder="Votre nom"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Mail className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              required
                              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                              placeholder="votre@email.com"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Téléphone (optionnel)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                            placeholder="06 12 34 56 78"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sujet *
                        </label>
                        <select
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                        >
                          <option value="">Choisissez un sujet</option>
                          {subjectOptions.map((option, index) => (
                            <option key={index} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Message *
                        </label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          rows={5}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 resize-none"
                          placeholder="Votre message..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={formStatus.type === 'loading'}
                        className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          {formStatus.type === 'loading' ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                          ) : (
                            <Send className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                          )}
                          <span>
                            {formStatus.type === 'loading' ? 'Envoi...' : 'Envoyer'}
                          </span>
                        </div>
                      </button>

                      <p className="text-xs text-gray-500 text-center">
                        * Champs obligatoires
                      </p>
                    </form>
                  </div>
                </div>
              </div>

              {/* Google Maps - Droite */}
              <div className="animate-fade-in">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden h-full">
                  {/* Header de la carte */}
                  <div className="bg-gradient-to-r from-slate-600 to-gray-700 p-6 text-white">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <MapPin className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="font-poppins font-semibold text-xl">Notre Localisation</h2>
                        <p className="text-gray-200 text-sm">Chalindrey, Haute-Marne</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Carte Google Maps */}
                  <div className="relative h-96">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2679.8234567890123!2d5.3456789!3d47.8901234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sChalindrey%2C%20France!5e0!3m2!1sfr!2sfr!4v1234567890123!5m2!1sfr!2sfr"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Localisation de la Lyre Cheminote et Municipale de Chalindrey"
                      className="w-full h-full"
                    ></iframe>
                    
                    {/* Overlay avec informations */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-2 rounded-lg shadow-md">
                            <Music className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-poppins font-semibold text-gray-800">École de Musique La Lyre</h4>
                            <p className="text-sm text-gray-600">Chalindrey, Haute-Marne</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Coordonnées - En bas */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 animate-fade-in">
              <h2 className="font-poppins font-bold text-2xl md:text-3xl text-dark mb-3">
                Nos Coordonnées
              </h2>
              <p className="font-inter text-gray-600">
                Plusieurs moyens de nous joindre
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((info, index) => (
                <div 
                  key={index} 
                  className="group text-center animate-fade-in bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`bg-gradient-to-br ${info.color} w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <info.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-poppins font-semibold text-lg text-dark mb-2">
                    {info.title}
                  </h3>
                  <p className="font-inter text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {info.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section Informations Pratiques */}
      <section className="py-16 bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
              <div className="text-center mb-8">
                <div className="bg-gradient-to-br from-orange-500 to-amber-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Music className="h-8 w-8 text-white" />
                </div>
                <h2 className="font-poppins font-bold text-2xl text-dark mb-2">
                  Rejoignez Notre Famille Musicale
                </h2>
                <p className="font-inter text-gray-600">
                  Depuis 1931, nous cultivons la passion musicale à Chalindrey
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                  <div className="bg-gradient-to-br from-orange-500 to-amber-600 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-poppins font-semibold text-lg text-dark mb-2">Cours d'Essai</h3>
                  <p className="text-sm text-gray-600">Gratuit et sans engagement</p>
                </div>
                
                <div className="text-center bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-100">
                  <div className="bg-gradient-to-br from-amber-500 to-yellow-600 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-poppins font-semibold text-lg text-dark mb-2">Flexibilité</h3>
                  <p className="text-sm text-gray-600">Horaires adaptés</p>
                </div>
                
                <div className="text-center bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100">
                  <div className="bg-gradient-to-br from-orange-500 to-red-500 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-poppins font-semibold text-lg text-dark mb-2">Suivi</h3>
                  <p className="text-sm text-gray-600">Accompagnement personnalisé</p>
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