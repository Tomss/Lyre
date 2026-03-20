import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { MapPin, Mail, Clock, Send, MessageSquare, CheckCircle, AlertCircle, Heart, ChevronDown } from 'lucide-react';
import PageHero from '../components/PageHero';
import { BASE_URL } from '../config';

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
  const { pageHeaders, settings } = useTheme();
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
          { label: "Où nous trouver ?", targetId: "localisation", icon: MapPin, color: "cyan" },
          { label: "Nous écrire", targetId: "formulaire", icon: MessageSquare, color: "teal" }
        ]}
      />

      {/* Section Localisation */}
      <section id="localisation" className="scroll-mt-20 py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Title */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="font-poppins font-bold text-3xl md:text-5xl text-slate-900 mb-6 relative inline-block">
              Où nous trouver ?
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-cyan-500 rounded-full"></div>
            </h2>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                
                {/* Infos localisation */}
                <div className="p-12 md:p-16 flex flex-col justify-center space-y-8 bg-white">
                  <div className="space-y-4">
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-50 rounded-full border border-rose-100 text-rose-600">
                      <MapPin className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Localisation</span>
                    </div>
                    
                    <div className="py-2">
                      {(settings?.header_logo_url || settings?.site_logo_url) ? (
                        <img 
                          src={settings.header_logo_url?.startsWith('http') ? settings.header_logo_url : (settings.header_logo_url ? `${BASE_URL}${settings.header_logo_url}` : (settings.site_logo_url?.startsWith('http') ? settings.site_logo_url : `${BASE_URL}${settings.site_logo_url}`))} 
                          alt="La Lyre" 
                          className="h-12 lg:h-16 w-auto object-contain" 
                        />
                      ) : (
                        <h3 className="font-poppins font-bold text-3xl text-teal-800">
                          La Lyre <br /> 
                          <span className="text-slate-500">& Municipale</span>
                        </h3>
                      )}
                    </div>
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
                        <p className="text-slate-600 text-teal-600 font-medium">contact@lalyre.fr</p>
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
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2679.1303867055723!2d5.437683976865664!3d47.80558897453488!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47ed2fe83730b387%3A0x880981517cf0a7cd!2sLyre%20Cheminote%20et%20Municipale!5e0!3m2!1sfr!2sfr!4v1711230000000!5m2!1sfr!2sfr"
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

      {/* Section Formulaire */}
      <section id="formulaire" className="scroll-mt-20 py-24 bg-white relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-teal-50 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-50 rounded-full blur-3xl opacity-60"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Title */}
          <div className="max-w-4xl mx-auto text-center mb-20">
            <h2 className="font-poppins font-bold text-3xl md:text-5xl text-slate-900 mb-6 relative inline-block">
              Nous écrire
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-teal-500 rounded-full"></div>
            </h2>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-stretch">
              
              {/* Infos & Pourquoi nous écrire */}
              <div className="lg:col-span-4 flex flex-col space-y-8">
                <div className="flex-1 space-y-8">
                  <div className="space-y-4">
                    <h3 className="font-poppins font-bold text-3xl text-slate-900 leading-tight">
                      Parlons de votre <br />
                      <span className="text-teal-600">passion musicale</span>
                    </h3>
                    <p className="text-slate-600 text-base leading-relaxed">
                      Que ce soit pour une inscription, une demande de partenariat ou pour tout autre renseignement, notre équipe est à votre écoute.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { icon: CheckCircle, title: "Inscriptions", text: "Ouvertes toute l'année", color: "text-teal-500", bg: "bg-teal-50" },
                      { icon: Clock, title: "Réduction", text: "Réponse garantie sous 48h", color: "text-cyan-500", bg: "bg-cyan-50" },
                      { icon: Heart, title: "Bienveillance", text: "Manifestations et portes ouvertes", color: "text-rose-500", bg: "bg-rose-50" }
                    ].map((item, i) => (
                      <div key={i} className="group flex items-center space-x-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-900/5 transition-all duration-500">
                        <div className={`${item.bg} p-3 rounded-xl transition-transform duration-500 group-hover:scale-110`}>
                          <item.icon className={`h-5 w-5 ${item.color}`} />
                        </div>
                        <div>
                          <h4 className="font-poppins font-bold text-slate-800 text-sm leading-none">{item.title}</h4>
                          <p className="text-slate-400 text-[11px] mt-1.5 font-medium">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Formulaire de Contact Premium */}
              <div className="lg:col-span-8">
                <div className="h-full bg-white rounded-[2.5rem] p-10 lg:p-14 shadow-[0_40px_80px_-15px_rgba(15,23,42,0.08)] border border-slate-100 relative group overflow-hidden">
                  {/* Glass shimmer effect */}
                  <div className="absolute -top-[100%] -left-[100%] w-[300%] h-[300%] bg-[conic-gradient(from_0deg,transparent,rgba(20,184,166,0.03),transparent)] animate-[spin_20s_linear_infinite] pointer-events-none"></div>
                  
                  <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3 group/field">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1 transition-colors group-focus-within/field:text-teal-600">Nom Complet</label>
                        <div className="relative">
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white transition-all duration-300 text-slate-800 font-semibold placeholder:text-slate-300"
                            placeholder="Jean Dupont"
                          />
                        </div>
                      </div>
                      <div className="space-y-3 group/field">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1 transition-colors group-focus-within/field:text-teal-600">Email Professionnel</label>
                        <div className="relative">
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white transition-all duration-300 text-slate-800 font-semibold placeholder:text-slate-300"
                            placeholder="jean@exemple.com"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3 group/field">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1 transition-colors group-focus-within/field:text-teal-600">Téléphone</label>
                        <div className="relative">
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white transition-all duration-300 text-slate-800 font-semibold placeholder:text-slate-300"
                            placeholder="06 00 00 00 00"
                          />
                        </div>
                      </div>
                      <div className="space-y-3 group/field">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1 transition-colors group-focus-within/field:text-teal-600">Objet de la demande</label>
                        <div className="relative">
                          <select
                            name="subject"
                            value={formData.subject}
                            onChange={handleInputChange}
                            required
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white transition-all duration-300 text-slate-800 font-semibold appearance-none cursor-pointer"
                          >
                            <option value="">Choisissez une option</option>
                            {subjectOptions.map((option, index) => (
                              <option key={index} value={option}>{option}</option>
                            ))}
                          </select>
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-focus-within/field:text-teal-500 transition-colors">
                            <ChevronDown className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 group/field">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1 transition-colors group-focus-within/field:text-teal-600">Votre Message</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={6}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white transition-all duration-300 text-slate-800 font-semibold resize-none placeholder:text-slate-300"
                        placeholder="Dites-nous tout..."
                      />
                    </div>

                    <div className="pt-4">
                      {formStatus.type !== 'idle' && (
                        <div className={`mb-8 p-5 rounded-2xl animate-in fade-in zoom-in duration-500 border flex items-center space-x-4 ${
                          formStatus.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 
                          formStatus.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' : 
                          'bg-slate-50 border-slate-100 text-slate-600'
                        }`}>
                          <div className={`p-2 rounded-full ${formStatus.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                            {formStatus.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                          </div>
                          <span className="text-sm font-bold tracking-tight">{formStatus.message}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={formStatus.type === 'loading'}
                        className="w-full inline-flex items-center justify-center space-x-3 bg-slate-900 text-white font-bold py-5 px-8 rounded-2xl hover:bg-teal-600 transition-all duration-300 hover:shadow-xl hover:shadow-teal-900/20 disabled:opacity-50"
                      >
                        {formStatus.type === 'loading' ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                        ) : (
                          <>
                            <span>Envoyer le message</span>
                            <Send className="h-4 w-4 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
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