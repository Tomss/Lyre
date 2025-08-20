import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, User, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';

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
    
    // Simulation d'envoi (remplacer par vraie logique d'envoi)
    setTimeout(() => {
      setFormStatus({ 
        type: 'success', 
        message: 'Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.' 
      });
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      
      // Réinitialiser le statut après 5 secondes
      setTimeout(() => {
        setFormStatus({ type: 'idle', message: '' });
      }, 5000);
    }, 2000);
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Adresse',
      content: ['Lyre Cheminote et Municipale', 'Chalindrey, France'],
      color: 'from-orange-400 to-amber-500'
    },
    {
      icon: Phone,
      title: 'Téléphone',
      content: ['03 25 88 XX XX'],
      color: 'from-amber-400 to-yellow-500'
    },
    {
      icon: Mail,
      title: 'Email',
      content: ['contact@lyre-chalindrey.fr'],
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Clock,
      title: 'Horaires des cours',
      content: ['Selon planning', 'Voir avec les professeurs'],
      color: 'from-amber-500 to-orange-600'
    }
  ];

  const subjectOptions = [
    'Inscription à l\'école',
    'Informations sur les cours',
    'Rejoindre un orchestre',
    'Événements et concerts',
    'Partenariat',
    'Autre demande'
  ];

  return (
    <div className="font-inter">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat bg-gray-900" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop")` 
        }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in relative z-10">
            <h1 className="font-poppins font-bold text-4xl md:text-5xl text-white mb-6">
              Contactez-nous
            </h1>
            <p className="font-inter text-lg text-white/90 max-w-3xl mx-auto leading-relaxed">
              Une question sur nos cours ? Envie de rejoindre notre famille musicale ? 
              Nous sommes là pour vous accompagner dans votre parcours musical.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Cards Section */}
      <section className="py-20 bg-gradient-to-br from-orange-25 via-amber-25 to-yellow-25 relative overflow-hidden">
        {/* Particules d'arrière-plan */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-orange-400/15 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-dark mb-4">
              Nos Coordonnées
            </h2>
            <p className="font-inter text-lg text-gray-600 max-w-2xl mx-auto">
              Plusieurs moyens de nous joindre pour tous vos besoins musicaux
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {contactInfo.map((info, index) => (
              <div 
                key={index} 
                className="group text-center animate-fade-in bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Effet de brillance au survol */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <div className={`bg-gradient-to-br ${info.color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative z-10`}>
                  <info.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-poppins font-semibold text-xl text-dark mb-4 relative z-10">
                  {info.title}
                </h3>
                <div className="space-y-2 relative z-10">
                  {info.content.map((line, lineIndex) => (
                    <p key={lineIndex} className="font-inter text-gray-600 leading-relaxed">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Section - Form + Map */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900 relative overflow-hidden">
        {/* Particules d'arrière-plan */}
        <div className="absolute inset-0">
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-orange-400/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-7xl mx-auto">
            
            {/* Formulaire de Contact */}
            <div className="animate-fade-in">
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="bg-white/20 p-3 rounded-2xl shadow-lg">
                        <MessageSquare className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="font-poppins font-bold text-2xl">Écrivez-nous</h2>
                        <p className="text-orange-100">Nous vous répondrons rapidement</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  {/* Notification de statut */}
                  {formStatus.type !== 'idle' && (
                    <div className={`mb-6 p-4 rounded-xl border ${
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
                        <span className="font-medium">{formStatus.message}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Nom complet *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                            placeholder="Votre nom et prénom"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Email *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                            placeholder="votre@email.com"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Téléphone (optionnel)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                          placeholder="06 12 34 56 78"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Sujet *
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      >
                        <option value="">Sélectionnez un sujet</option>
                        {subjectOptions.map((option, index) => (
                          <option key={index} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={6}
                        className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/80 backdrop-blur-sm resize-none"
                        placeholder="Décrivez votre demande, vos questions ou votre projet musical..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={formStatus.type === 'loading'}
                      className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        {formStatus.type === 'loading' ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                        ) : (
                          <Send className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                        )}
                        <span className="text-lg">
                          {formStatus.type === 'loading' ? 'Envoi en cours...' : 'Envoyer le message'}
                        </span>
                      </div>
                    </button>

                    <p className="text-sm text-gray-500 text-center">
                      * Champs obligatoires
                    </p>
                  </form>
                </div>
              </div>
            </div>

            {/* Google Maps + Informations */}
            <div className="animate-fade-in space-y-8">
              {/* Carte Google Maps */}
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-700 to-gray-800 p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-400/10 rounded-full -translate-y-12 translate-x-12"></div>
                  <div className="relative z-10 flex items-center space-x-4">
                    <div className="bg-white/20 p-3 rounded-2xl shadow-lg">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-poppins font-bold text-xl">Notre Localisation</h3>
                      <p className="text-gray-200">Chalindrey, Haute-Marne</p>
                    </div>
                  </div>
                </div>
                
                <div className="aspect-[4/3] relative">
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
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-poppins font-semibold text-gray-800">Lyre Cheminote et Municipale</h4>
                          <p className="text-sm text-gray-600">Chalindrey, Haute-Marne</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations Pratiques */}
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
                <div className="text-center mb-8">
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-poppins font-bold text-2xl text-dark mb-2">
                    Informations Pratiques
                  </h3>
                  <p className="text-gray-600">
                    Tout ce qu'il faut savoir pour nous rejoindre
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100">
                    <h4 className="font-poppins font-semibold text-lg text-dark mb-3 flex items-center space-x-2">
                      <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-2 rounded-lg shadow-md">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <span>Inscriptions</span>
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      Les inscriptions sont ouvertes toute l'année. Contactez-nous pour organiser 
                      un cours d'essai gratuit et découvrir l'instrument qui vous correspond.
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-100">
                    <h4 className="font-poppins font-semibold text-lg text-dark mb-3 flex items-center space-x-2">
                      <div className="bg-gradient-to-br from-amber-500 to-yellow-600 p-2 rounded-lg shadow-md">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <span>Horaires des Cours</span>
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      Les cours sont organisés selon le rythme scolaire. Chaque élève bénéficie 
                      d'un cours de solfège, d'une demi-heure d'instrument et d'une activité orchestrale par semaine.
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
                    <h4 className="font-poppins font-semibold text-lg text-dark mb-3 flex items-center space-x-2">
                      <div className="bg-gradient-to-br from-orange-500 to-red-500 p-2 rounded-lg shadow-md">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                      <span>Réponse Rapide</span>
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      Nous nous engageons à répondre à tous vos messages dans les 48h. 
                      Pour les urgences, n'hésitez pas à nous appeler directement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Appel à l'Action */}
      <section className="py-20 bg-gradient-to-br from-blue-25 via-indigo-25 to-purple-25 relative overflow-hidden">
        {/* Particules d'arrière-plan */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-orange-400/10 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-white/50 relative overflow-hidden group">
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-orange-500 to-amber-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <MessageSquare className="h-10 w-10 text-white" />
                </div>
                
                <h2 className="font-poppins font-bold text-3xl md:text-4xl text-dark mb-6 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Prêt à Commencer Votre Aventure Musicale ?
                </h2>
                
                <p className="font-inter text-lg text-gray-700 leading-relaxed mb-8 max-w-2xl mx-auto">
                  Depuis 1931, nous accompagnons les passionnés de musique dans leur épanouissement artistique. 
                  Rejoignez notre famille musicale et découvrez le plaisir de jouer ensemble !
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl p-6 shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <div className="bg-gradient-to-br from-orange-500 to-amber-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-poppins font-semibold text-lg text-dark mb-2">Cours d'Essai</h3>
                    <p className="text-sm text-gray-600">Gratuit et sans engagement</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl p-6 shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <div className="bg-gradient-to-br from-amber-500 to-yellow-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-poppins font-semibold text-lg text-dark mb-2">Flexibilité</h3>
                    <p className="text-sm text-gray-600">Horaires adaptés à vos besoins</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl p-6 shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <div className="bg-gradient-to-br from-orange-500 to-red-500 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-poppins font-semibold text-lg text-dark mb-2">Accompagnement</h3>
                    <p className="text-sm text-gray-600">Suivi personnalisé et bienveillant</p>
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