import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { MapPin, Phone, Mail, Clock, Send, User, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import PageHero from '../components/PageHero';

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
  const { pageHeaders } = useTheme();
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
      color: 'from-orange-500 to-indigo-500'
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
      {/* Hero Section */}
      <PageHero
        title={<span><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-500">Contactez</span>-nous</span>}
        subtitle="Une question ? Envie de nous rejoindre ? N'hésitez pas à nous écrire."
        backgroundImage={pageHeaders['contact'] || "https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop"}
        anchors={[
          { label: "Nous écrire", targetId: "formulaire", icon: MessageSquare, color: "amber" },
          { label: "Nous trouver", targetId: "plan", icon: MapPin, color: "indigo" }
        ]}
      />

      {/* Formulaire et Carte */}
      {/* Formulaire et Carte */}
      <section id="formulaire" className="scroll-mt-20 py-16 bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Infos pratiques */}
          <div className="text-center mb-12 relative z-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-3xl mx-auto border border-white/20">
              <h2 className="font-poppins font-bold text-2xl text-white mb-4">
                Contactez-nous facilement
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="text-center">
                  <div className="bg-orange-400/20 p-2 rounded-lg w-fit mx-auto mb-2">
                    <User className="h-5 w-5 text-orange-300" />
                  </div>
                  <p className="text-orange-200 font-medium">Inscriptions ouvertes</p>
                  <p className="text-gray-300">toute l'année</p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-400/20 p-2 rounded-lg w-fit mx-auto mb-2">
                    <Clock className="h-5 w-5 text-blue-300" />
                  </div>
                  <p className="text-blue-200 font-medium">Réponse rapide</p>
                  <p className="text-gray-300">sous 48h maximum</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-400/20 p-2 rounded-lg w-fit mx-auto mb-2">
                    <MessageSquare className="h-5 w-5 text-green-300" />
                  </div>
                  <p className="text-green-200 font-medium">Cours d'essai</p>
                  <p className="text-gray-300">gratuit et sans engagement</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto relative z-10">

            {/* Formulaire de Contact */}
            <div className="animate-fade-in">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-800/80 to-amber-700/80 p-6 text-white backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="font-poppins font-bold text-xl">Écrivez-nous</h2>
                      <p className="text-orange-200 text-sm">Nous vous répondrons rapidement</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Notification de statut */}
                  {formStatus.type !== 'idle' && (
                    <div className={`mb-4 p-3 rounded-lg border ${formStatus.type === 'success'
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : formStatus.type === 'error'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-orange-50 border-orange-200 text-orange-800'
                      }`}>
                      <div className="flex items-center space-x-2">
                        {formStatus.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {formStatus.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
                        {formStatus.type === 'loading' && (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-600 border-t-transparent"></div>
                        )}
                        <span className="text-sm font-medium">{formStatus.message}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom complet *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                          placeholder="Votre nom et prénom"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                          placeholder="votre@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone (optionnel)
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                        placeholder="06 12 34 56 78"
                      />
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
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                      >
                        <option value="">Sélectionnez un sujet</option>
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
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 resize-none"
                        placeholder="Décrivez votre demande, vos questions ou votre projet musical..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={formStatus.type === 'loading'}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        {formStatus.type === 'loading' ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        <span>
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

            {/* Google Maps */}
            <div className="animate-fade-in">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-600 to-gray-700 p-6 text-white">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-poppins font-bold text-xl">Notre Localisation</h3>
                      <p className="text-gray-100 text-sm">1 bis rue Jean Jaurès, Chalindrey</p>
                    </div>
                  </div>
                </div>

                <div className="h-96 relative">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2679.123!2d5.3456!3d47.8901!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47f1e1234567890a%3A0x1234567890abcdef!2s1%20bis%20Rue%20Jean%20Jaur%C3%A8s%2C%2052600%20Chalindrey%2C%20France!5e0!3m2!1sfr!2sfr!4v1234567890!5m2!1sfr!2sfr"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Localisation de la Lyre Cheminote et Municipale de Chalindrey"
                    className="w-full h-full"
                  ></iframe>

                  {/* Overlay discret */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                      <div className="flex items-center space-x-2">
                        <div className="bg-orange-500/10 p-1.5 rounded-lg">
                          <MapPin className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-poppins font-medium text-sm text-gray-800">Lyre Cheminote et Municipale</h4>
                          <p className="text-xs text-gray-600">1 bis rue Jean Jaurès, 52600 Chalindrey</p>
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

      {/* Coordonnées */}
      <section className="py-16 bg-gradient-to-br from-blue-25 via-indigo-25 to-purple-25">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-poppins font-bold text-2xl md:text-3xl text-dark mb-3">
              Nos Coordonnées
            </h2>
            <p className="font-inter text-gray-600 max-w-xl mx-auto">
              Plusieurs moyens de nous joindre
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`bg-gradient-to-br ${info.color} w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm`}>
                  <info.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-poppins font-semibold text-lg text-dark mb-3">
                  {info.title}
                </h3>
                <div className="space-y-1">
                  {info.content.map((line, lineIndex) => (
                    <p key={lineIndex} className="font-inter text-sm text-gray-600">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Contact;