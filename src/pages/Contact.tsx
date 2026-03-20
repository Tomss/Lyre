import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { MapPin, Mail, Clock, Send, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
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

  const subjectOptions = [
    'Inscription à l\'école',
    'Informations sur les cours',
    'Rejoindre un orchestre',
    'Événements et concerts',
    'Partenariat',
    'Autre demande'
  ];

  return (
    <div className="font-inter bg-white overflow-hidden">
      {/* Hero Section */}
      <PageHero
        title={<span><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-500">Contactez</span>-nous</span>}
        subtitle="Une question ? Envie de nous rejoindre ? Prenons contact pour votre projet musical."
        backgroundImage={pageHeaders['contact'] || "https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop"}
        anchors={[
          { label: "Nous écrire", targetId: "formulaire", icon: MessageSquare, color: "teal" },
          { label: "Où nous trouver ?", targetId: "localisation", icon: MapPin, color: "cyan" }
        ]}
      />

      {/* Section Formulaire */}
      <section id="formulaire" className="scroll-mt-20 py-24 bg-white relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
              
              {/* Infos & Pourquoi nous écrire */}
              <div className="lg:col-span-5 space-y-8">
                <div className="space-y-6">
                  <h2 className="font-poppins font-bold text-4xl text-slate-900 leading-tight">
                    Parlons de votre <br />
                    <span className="text-teal-600">passion musicale</span>
                  </h2>
                  <p className="text-slate-600 text-lg leading-relaxed max-w-md">
                    Que ce soit pour une inscription, une demande de partenariat ou simplement pour saluer l'orchestre, notre équipe est à votre écoute.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { icon: CheckCircle, title: "Inscriptions ouvertes", text: "Toute l'année pour tous les niveaux", color: "text-teal-500", bg: "bg-teal-50" },
                    { icon: Clock, title: "Réponse rapide", text: "Nous traitons vos messages sous 48h", color: "text-cyan-500", bg: "bg-cyan-50" },
                    { icon: MessageSquare, title: "Cours d'essai", text: "Gratuit et sans engagement", color: "text-emerald-500", bg: "bg-emerald-50" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start space-x-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                      <div className={`${item.bg} p-3 rounded-xl shadow-inner`}>
                        <item.icon className={`h-6 w-6 ${item.color}`} />
                      </div>
                      <div>
                        <h4 className="font-poppins font-bold text-slate-800 text-sm">{item.title}</h4>
                        <p className="text-slate-500 text-xs mt-1 leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulaire de Contact Premium */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-slate-200/60 border border-slate-100 relative group">
                  {/* Decorative dot */}
                  <div className="absolute top-8 right-8 w-3 h-3 bg-teal-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(20,184,166,0.5)]"></div>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nom Complet</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all duration-300 text-slate-800 font-medium"
                          placeholder="Jean Dupont"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all duration-300 text-slate-800 font-medium"
                          placeholder="jean@exemple.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Téléphone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all duration-300 text-slate-800 font-medium"
                          placeholder="06 00 00 00 00"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sujet</label>
                        <select
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          required
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all duration-300 text-slate-800 font-medium appearance-none cursor-pointer"
                        >
                          <option value="">Sélectionnez un sujet</option>
                          {subjectOptions.map((option, index) => (
                            <option key={index} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Message</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={5}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all duration-300 text-slate-800 font-medium resize-none"
                        placeholder="Votre message ici..."
                      />
                    </div>

                    <div className="pt-2">
                      {formStatus.type !== 'idle' && (
                        <div className={`mb-6 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300 border flex items-center space-x-3 ${
                          formStatus.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 
                          formStatus.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' : 
                          'bg-slate-50 border-slate-100 text-slate-700'
                        }`}>
                          {formStatus.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                          {formStatus.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-500" />}
                          {formStatus.type === 'loading' && <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-500 border-t-transparent"></div>}
                          <span className="text-sm font-bold">{formStatus.message}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={formStatus.type === 'loading'}
                        className="w-full group relative overflow-hidden bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl transition-all duration-500 hover:bg-teal-600 hover:shadow-2xl hover:shadow-teal-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative flex items-center justify-center space-x-3">
                          {formStatus.type === 'loading' ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                          ) : (
                            <Send className="h-4 w-4 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          )}
                          <span>{formStatus.type === 'loading' ? 'Envoi en cours...' : 'Envoyer le message'}</span>
                        </div>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Localisation */}
      <section id="localisation" className="scroll-mt-20 py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                
                {/* Infos localisation */}
                <div className="p-12 md:p-16 flex flex-col justify-center space-y-8 bg-white">
                  <div className="space-y-4">
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-50 rounded-full border border-rose-100 text-rose-600">
                      <MapPin className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Où nous trouver ?</span>
                    </div>
                    <h3 className="font-poppins font-bold text-3xl text-slate-900">
                      La Lyre Cheminote <br /> 
                      <span className="text-slate-500">& Municipale</span>
                    </h3>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <MapPin className="h-6 w-6 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-poppins font-bold text-slate-800">Notre adresse</p>
                        <p className="text-slate-600">1 bis rue Jean Jaurès, <br /> 52600 Chalindrey, France</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <Mail className="h-6 w-6 text-cyan-600" />
                      </div>
                      <div>
                        <p className="font-poppins font-bold text-slate-800">Email direct</p>
                        <p className="text-slate-600">contact@lyre-chalindrey.fr</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <a 
                      href="https://www.google.com/maps/dir/?api=1&destination=1+bis+Rue+Jean+Jaurès,+52600+Chalindrey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-3 bg-slate-900 text-white font-bold py-4 px-8 rounded-2xl hover:bg-teal-600 transition-all duration-300 hover:shadow-xl hover:shadow-teal-900/20"
                    >
                      <span>Obtenir l'itinéraire</span>
                      <Send className="h-4 w-4 rotate-45" />
                    </a>
                  </div>
                </div>

                {/* Carte interactive */}
                <div className="h-[500px] lg:h-auto relative bg-slate-100">
                   <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2679.123!2d5.3456!3d47.8901!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47f1e1234567890a%3A0x1234567890abcdef!2s1%20bis%20Rue%20Jean%20Jaur%C3%A8s%2C%2052600%20Chalindrey%2C%20France!5e0!3m2!1sfr!2sfr!4v1234567890!5m2!1sfr!2sfr"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Localisation de la Lyre Cheminote et Municipale de Chalindrey"
                    className="w-full h-full grayscale-[0.3] hover:grayscale-0 transition-all duration-1000"
                  ></iframe>
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