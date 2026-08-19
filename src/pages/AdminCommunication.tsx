import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Mail, Send, History, Calendar, Users, CheckCircle, 
  AlertCircle, Search, Clock, MapPin, X, Sparkles, Filter, ChevronRight, Check, ShieldAlert, FileText, ChevronDown, ChevronUp, Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { API_URL } from '../config';

interface Orchestra {
  id: string;
  name: string;
}

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  practical_info: string | null;
  event_type: 'concert' | 'repetition' | 'divers';
  event_date: string;
  location: string | null;
  orchestras: Orchestra[];
}

interface Recipient {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  userOrchestras: string[];
}

interface CommunicationLogItem {
  id: string;
  subject: string;
  recipient_count: number;
  recipients_list: string[];
  is_test: boolean;
  created_at: string;
  event_title: string;
  event_type: string;
  sender_name: string;
}

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

const AdminCommunication = () => {
  const { currentUser, token, isAuthenticated } = useAuth();

  // Wizard modal state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  
  // Communication config
  const [commType, setCommType] = useState<'event' | 'free'>('event');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [history, setHistory] = useState<CommunicationLogItem[]>([]);
  
  // Free communication targeting mode: 'orchestras' | 'members'
  const [freeTargetMode, setFreeTargetMode] = useState<'orchestras' | 'members'>('orchestras');
  const [selectedOrchestraNames, setSelectedOrchestraNames] = useState<string[]>([]);
  
  // Form fields
  const [customSubject, setCustomSubject] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [freeMessageContent, setFreeMessageContent] = useState('');
  const [isTestMode, setIsTestMode] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  // Search & Filter states
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [eventSearchTerm, setEventSearchTerm] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');

  // Loading & Action states
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    type: 'success',
  });

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  // Prevent scroll when wizard is open
  useEffect(() => {
    if (showWizard) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showWizard]);

  // Redirect if unauthorized
  if (!isAuthenticated) return <Navigate to="/connexion" replace />;
  if (currentUser?.role !== 'Admin' && (!currentUser?.managedModules || !currentUser?.managedModules.includes('communication'))) {
    return <Navigate to="/dashboard" replace />;
  }

  // Fetch upcoming events
  const fetchUpcomingEvents = async () => {
    if (!token) return;
    setLoadingEvents(true);
    try {
      const response = await fetch(`${API_URL}/communication/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des événements');
      const data = await response.json();
      setEvents(data || []);
      if (data && data.length > 0) {
        setSelectedEventId(data[0].id);
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoadingEvents(false);
    }
  };

  // Fetch communication history
  const fetchHistory = async () => {
    if (!token) return;
    setLoadingHistory(true);
    try {
      const response = await fetch(`${API_URL}/communication/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erreur lors du chargement de l\'historique');
      const data = await response.json();
      setHistory(data || []);
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  // Handle opening wizard
  const openNewWizard = () => {
    setWizardStep(1);
    setCommType('event');
    setCustomNote('');
    setFreeMessageContent('');
    setIsTestMode(false);
    setFreeTargetMode('orchestras');
    setSelectedOrchestraNames([]);
    setSelectedUserIds([]);
    setShowWizard(true);
    fetchUpcomingEvents();
  };

  // Fetch recipients when selected event changes or commType changes to free
  useEffect(() => {
    if (!token || !showWizard) return;

    if (commType === 'event') {
      if (!selectedEventId) return;

      const fetchEventRecipients = async () => {
        setLoadingRecipients(true);
        try {
          const response = await fetch(`${API_URL}/communication/recipients/${selectedEventId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error('Erreur lors du calcul des destinataires');
          const data = await response.json();
          setRecipients(data || []);
          setSelectedUserIds((data || []).map((r: Recipient) => r.id));
        } catch (err: any) {
          showNotification(err.message, 'error');
        } finally {
          setLoadingRecipients(false);
        }
      };

      fetchEventRecipients();

      // Auto-fill subject for selected event
      const selectedEv = events.find(e => e.id === selectedEventId);
      if (selectedEv) {
        const formattedDate = new Date(selectedEv.event_date).toLocaleDateString('fr-FR', {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const prefix = selectedEv.event_type === 'concert' ? 'Convocation Concert' : (selectedEv.event_type === 'repetition' ? 'Rappel Répétition' : 'Rappel Événement');
        setCustomSubject(`[La Lyre] ${prefix} : ${selectedEv.title} (${formattedDate})`);
      }

    } else {
      // Free comm -> Fetch all members
      const fetchAllMembers = async () => {
        setLoadingRecipients(true);
        try {
          const response = await fetch(`${API_URL}/communication/all-members`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error('Erreur lors du chargement de la liste des membres');
          const data = await response.json();
          setRecipients(data || []);
          setSelectedUserIds([]);
          setSelectedOrchestraNames([]);
          setCustomSubject('[La Lyre] Information importante');
        } catch (err: any) {
          showNotification(err.message, 'error');
        } finally {
          setLoadingRecipients(false);
        }
      };

      fetchAllMembers();
    }

  }, [selectedEventId, commType, token, showWizard, events]);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  // Available unique orchestra names across recipients
  const availableOrchestraNames = Array.from(
    new Set(recipients.flatMap(r => r.userOrchestras || []).filter(Boolean))
  ).sort();

  // Filter and sort recipients based on search (Sorted alphabetically by Last Name)
  const filteredRecipients = recipients
    .filter(r => 
      `${r.lastName} ${r.firstName} ${r.email}`.toLowerCase().includes(memberSearchTerm.toLowerCase())
    )
    .sort((a, b) => 
      a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' }) || 
      a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' })
    );

  // Filter upcoming events based on search
  const filteredUpcomingEvents = events.filter(e => 
    `${e.title} ${e.location} ${e.event_type}`.toLowerCase().includes(eventSearchTerm.toLowerCase())
  );

  // Filter history based on search
  const filteredHistory = history.filter(h => 
    `${h.subject} ${h.event_title} ${h.sender_name}`.toLowerCase().includes(historySearchTerm.toLowerCase())
  );

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const selectAllFiltered = () => {
    setSelectedUserIds(filteredRecipients.map(r => r.id));
  };

  const deselectAll = () => {
    setSelectedUserIds([]);
  };

  // Toggle Orchestra Selection in Free Mode
  const toggleOrchestraSelection = (orchName: string) => {
    const newSelectedOrchestras = selectedOrchestraNames.includes(orchName)
      ? selectedOrchestraNames.filter(name => name !== orchName)
      : [...selectedOrchestraNames, orchName];

    setSelectedOrchestraNames(newSelectedOrchestras);

    // Automatically check all members belonging to ANY of the selected orchestras
    const matchingIds = recipients
      .filter(r => (r.userOrchestras || []).some(o => newSelectedOrchestras.includes(o)))
      .map(r => r.id);

    setSelectedUserIds(matchingIds);
  };

  const selectAllOrchestras = () => {
    setSelectedOrchestraNames(availableOrchestraNames);
    setSelectedUserIds(recipients.map(r => r.id));
  };

  const deselectAllOrchestras = () => {
    setSelectedOrchestraNames([]);
    setSelectedUserIds([]);
  };

  const handleSendCommunication = async () => {
    if (!token) return;
    
    const finalRecipientsIds = isTestMode ? selectedUserIds : (commType === 'event' ? recipients.map(r => r.id) : selectedUserIds);

    if (finalRecipientsIds.length === 0) {
      showNotification('Veuillez sélectionner au moins un destinataire.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/communication/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: commType,
          eventId: commType === 'event' ? selectedEventId : null,
          customSubject,
          freeMessageContent,
          customNote,
          selectedUserIds: finalRecipientsIds,
          isTest: isTestMode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'envoi de la communication');
      }

      showNotification(data.message || 'Communication envoyée avec succès !', 'success');
      setShowWizard(false);
      fetchHistory();

    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatEventDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="pt-8 lg:pt-12 pb-20 min-h-screen bg-gray-100">
      
      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-5 py-4 rounded-xl shadow-2xl transition-all duration-300 border ${
          notification.type === 'success' 
            ? 'bg-slate-900 text-white border-slate-700' 
            : 'bg-red-900 text-red-100 border-red-700'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0" />
          )}
          <span className="font-semibold text-sm">{notification.message}</span>
        </div>
      )}

      <div className="w-full px-4 sm:px-10 lg:px-16">

        {/* Header - EXACTLY SAME DA AS ADMINUSERS */}
        <div className="mb-8">
          <Link to="/dashboard" className="text-slate-400 hover:text-indigo-600 transition flex items-center mb-2 group">
            <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Retour au tableau de bord
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-sm border border-indigo-50 flex-shrink-0">
                <Mail size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800">
                  Administration Communication
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Rappels d'événements à venir et convocations par email aux orchestres
                </p>
              </div>
            </div>

            <button 
              onClick={openNewWizard}
              className="flex items-center px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 mt-4 md:mt-0 font-bold text-sm"
            >
              <Send className="mr-2 h-5 w-5" />
              Nouvelle communication
            </button>
          </div>
        </div>

        {/* Main Content Card: History & Search */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Historique des Communications Envoyées
              </h2>
              <p className="text-xs text-slate-500">
                Journal des emails d'information et rappels de répétition/concert transmis aux membres.
              </p>
            </div>

            {/* History Search Bar */}
            <div className="relative w-full md:w-80">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par objet, événement, expéditeur..."
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-xs"
              />
            </div>
          </div>

          {loadingHistory ? (
            <div className="py-12 text-center text-slate-400 text-sm">Chargement de l'historique...</div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">Aucune communication enregistrée pour le moment.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-3">Date</th>
                    <th className="pb-3 px-3">Événement Cible</th>
                    <th className="pb-3 px-3">Objet du mail</th>
                    <th className="pb-3 px-3">Mode</th>
                    <th className="pb-3 px-3">Destinataires</th>
                    <th className="pb-3 px-3">Expéditeur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredHistory.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3 font-medium text-slate-600 text-xs">
                        {new Date(item.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">
                        {item.event_title || <span className="text-slate-400 italic">Communication Libre</span>}
                      </td>
                      <td className="py-3.5 px-3 text-slate-700 text-xs max-w-xs truncate font-medium">
                        {item.subject}
                      </td>
                      <td className="py-3.5 px-3">
                        {item.is_test ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            🧪 Test ({item.recipient_count})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            📢 Officiel ({item.recipient_count})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-700">
                        {item.recipient_count} membre(s)
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 text-xs">
                        {item.sender_name || 'Admin'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* POP-UP WIZARD MODAL (MUCH LARGER: max-w-5xl) */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-100 my-4 overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-8 py-5 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-base shadow-md">
                  {wizardStep}/4
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-white">Nouvelle Communication</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {wizardStep === 1 && "Étape 1 : Choisir le type de communication"}
                    {wizardStep === 2 && (commType === 'event' ? "Étape 2 : Sélectionner l'événement à venir" : "Étape 2 : Rédiger la communication libre")}
                    {wizardStep === 3 && "Étape 3 : Ciblage par Orchestre(s) ou par Membre(s)"}
                    {wizardStep === 4 && "Étape 4 : Aperçu & Confirmation d'envoi"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowWizard(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto flex-1 space-y-6">

              {/* STEP 1: Choose Type */}
              {wizardStep === 1 && (
                <div className="space-y-6">
                  <h4 className="font-extrabold text-slate-800 text-lg">Quel type de communication souhaitez-vous envoyer ?</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div 
                      onClick={() => setCommType('event')}
                      className={`p-8 rounded-3xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between space-y-6 ${
                        commType === 'event' 
                          ? 'border-indigo-600 bg-indigo-50/40 ring-4 ring-indigo-600/10' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                        <Calendar size={28} />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-slate-900 text-lg">Liée à un Événement</h5>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                          Rappel de répétition, convocation concert ou détails d'organisation automatiquement adressés aux musiciens concernés par l'événement.
                        </p>
                      </div>
                      <span className="text-xs font-extrabold text-indigo-600 flex items-center">
                        Sélectionner l'événement <ChevronRight size={16} className="ml-1" />
                      </span>
                    </div>

                    <div 
                      onClick={() => setCommType('free')}
                      className={`p-8 rounded-3xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between space-y-6 ${
                        commType === 'free' 
                          ? 'border-indigo-600 bg-indigo-50/40 ring-4 ring-indigo-600/10' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                        <FileText size={28} />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-slate-900 text-lg">Communication Libre</h5>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                          Annonce générale, note d'information ou message personnalisé adressé à un ou plusieurs orchestres ou membres spécifiques.
                        </p>
                      </div>
                      <span className="text-xs font-extrabold text-purple-600 flex items-center">
                        Rédiger le message <ChevronRight size={16} className="ml-1" />
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Event selection or Free Content */}
              {wizardStep === 2 && (
                <div className="space-y-6">
                  {commType === 'event' ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                          Sélectionner l'Événement à venir
                        </label>

                        {/* Search input */}
                        <div className="relative w-64">
                          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Chercher un événement..."
                            value={eventSearchTerm}
                            onChange={(e) => setEventSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                      </div>

                      {loadingEvents ? (
                        <div className="py-12 text-center text-slate-400 text-sm">Chargement des événements...</div>
                      ) : filteredUpcomingEvents.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-sm">Aucun événement à venir trouvé.</div>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                          {filteredUpcomingEvents.map(ev => {
                            const isSelected = ev.id === selectedEventId;
                            return (
                              <div
                                key={ev.id}
                                onClick={() => setSelectedEventId(ev.id)}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                                  isSelected 
                                    ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-600/20' 
                                    : 'bg-white border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                      ev.event_type === 'concert' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                                    }`}>
                                      {ev.event_type === 'concert' ? 'Concert' : (ev.event_type === 'repetition' ? 'Répétition' : 'Événement')}
                                    </span>
                                    {(ev.orchestras || []).map(o => (
                                      <span key={o.id} className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                                        {o.name}
                                      </span>
                                    ))}
                                  </div>
                                  <h5 className="font-bold text-slate-900 text-base">{ev.title}</h5>
                                  <p className="text-xs text-slate-500 mt-1">
                                    📅 {formatEventDate(ev.event_date)} {ev.location ? `• 📍 ${ev.location}` : ''}
                                  </p>
                                </div>
                                
                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                  isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                                }`}>
                                  {isSelected && <Check size={14} className="stroke-[3]" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Objet du Mail
                          </label>
                          <input
                            type="text"
                            value={customSubject}
                            onChange={(e) => setCustomSubject(e.target.value)}
                            className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Note d'organisation du responsable (Optionnel)
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Ex: Arrivée requise 15 minutes en avance avec votre tenue de concert..."
                            value={customNote}
                            onChange={(e) => setCustomNote(e.target.value)}
                            className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Free Communication Form */
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Objet du message
                        </label>
                        <input
                          type="text"
                          placeholder="Objet de la communication..."
                          value={customSubject}
                          onChange={(e) => setCustomSubject(e.target.value)}
                          className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Corps du message
                        </label>
                        <textarea
                          rows={8}
                          placeholder="Rédigez votre message ici..."
                          value={freeMessageContent}
                          onChange={(e) => setFreeMessageContent(e.target.value)}
                          className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 outline-none leading-relaxed"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Target Selection (Orchestra vs Members choice) */}
              {wizardStep === 3 && (
                <div className="space-y-6">
                  
                  {/* Mode Banner */}
                  <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <h5 className="font-bold text-slate-800 text-sm">Mode d'envoi</h5>
                      <p className="text-xs text-slate-500">
                        {isTestMode ? "Actuellement en Mode Test (envoi restreint)" : "Envoi réel à la sélection"}
                      </p>
                    </div>

                    <div 
                      onClick={() => setIsTestMode(!isTestMode)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl cursor-pointer transition-all border ${
                        isTestMode ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <Sparkles size={16} className={isTestMode ? 'text-amber-600 animate-pulse' : 'text-slate-400'} />
                      <span className="text-xs font-bold">Activer Mode Test</span>
                      <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isTestMode ? 'bg-amber-500' : 'bg-slate-300'}`}>
                        <div className={`w-3 h-3 rounded-full bg-white transition-transform ${isTestMode ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  </div>

                  {/* Mode Test Alert */}
                  {isTestMode && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
                      <ShieldAlert size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Mode Test Activé :</strong> Seuls les membres cochés recevront le mail d'essai. Utile pour vérifier l'affichage du mail sur votre adresse.
                      </div>
                    </div>
                  )}

                  {commType === 'event' ? (
                    /* Event Mode Targeting */
                    <div className="space-y-4">
                      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-xs text-indigo-900 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Users size={20} className="text-indigo-600" />
                          <span>Musiciens ciblés par l'événement : <strong>{selectedEvent?.title}</strong> ({(selectedEvent?.orchestras || []).map(o => o.name).join(', ')})</span>
                        </div>
                        <span className="font-black bg-indigo-600 text-white px-3 py-1 rounded-full text-xs flex-shrink-0">
                          {recipients.length} membre(s)
                        </span>
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Liste des musiciens ({recipients.length})
                          </span>
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {[...recipients]
                            .sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' }) || a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' }))
                            .map(r => (
                            <div key={r.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-3">
                                <CheckCircle size={16} className="text-indigo-600" />
                                <div>
                                  <span className="font-bold text-slate-900">{r.lastName.toUpperCase()} <span className="font-semibold text-slate-700">{r.firstName}</span></span>
                                  <span className="text-slate-400 ml-2">{r.email}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* FREE COMMUNICATION TARGETING: Choice between Orchestras or Individual Members */
                    <div className="space-y-6">
                      
                      {/* Sub-Tabs: Par Orchestre(s) VS Par Membre(s) */}
                      <div className="flex items-center p-1 bg-slate-100 rounded-2xl gap-1">
                        <button
                          type="button"
                          onClick={() => setFreeTargetMode('orchestras')}
                          className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                            freeTargetMode === 'orchestras'
                              ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100/50'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <Layers size={16} />
                          <span>1. Cibler par Orchestre(s)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFreeTargetMode('members')}
                          className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                            freeTargetMode === 'members'
                              ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100/50'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <Users size={16} />
                          <span>2. Sélectionner par Membre(s) direct(s)</span>
                        </button>
                      </div>

                      {/* Summary Banner */}
                      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-xs text-purple-900 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <FileText size={20} className="text-purple-600" />
                          <span>
                            {freeTargetMode === 'orchestras' 
                              ? "Cochez un ou plusieurs orchestres pour déplier et retenir tous leurs musiciens."
                              : "Cochez directement les membres auxquels vous souhaitez envoyer le message."}
                          </span>
                        </div>
                        <span className="font-black bg-purple-600 text-white px-3 py-1 rounded-full text-xs flex-shrink-0">
                          {selectedUserIds.length} destinataire(s) retenu(s)
                        </span>
                      </div>

                      {/* OPTION 1: TARGET BY ORCHESTRAS */}
                      {freeTargetMode === 'orchestras' ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                              Sélectionner les orchestres ({availableOrchestraNames.length})
                            </span>
                            <div className="flex items-center gap-2 text-xs">
                              <button onClick={selectAllOrchestras} className="font-bold text-indigo-600 hover:underline">Tous les orchestres</button>
                              <span className="text-slate-300">•</span>
                              <button onClick={deselectAllOrchestras} className="font-bold text-slate-500 hover:underline">Aucun orchestre</button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {availableOrchestraNames.map(orchName => {
                              const isChecked = selectedOrchestraNames.includes(orchName);
                              const membersOfOrch = recipients.filter(r => (r.userOrchestras || []).includes(orchName));

                              return (
                                <div 
                                  key={orchName}
                                  onClick={() => toggleOrchestraSelection(orchName)}
                                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                                    isChecked 
                                      ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-600/20' 
                                      : 'bg-white border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}}
                                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                    <div>
                                      <h6 className="font-bold text-slate-800 text-sm">{orchName}</h6>
                                      <p className="text-xs text-slate-500">{membersOfOrch.length} membre(s)</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Unfolded Members List under selected Orchestras */}
                          {selectedOrchestraNames.length > 0 && (
                            <div className="pt-4 border-t border-slate-200 space-y-3">
                              <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                Musiciens dépliés ({selectedUserIds.length} membres cochés par défaut)
                              </h5>

                              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                {selectedOrchestraNames.map(orchName => {
                                  const orchMembers = recipients
                                    .filter(r => (r.userOrchestras || []).includes(orchName))
                                    .sort((a, b) => 
                                      a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' }) || 
                                      a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' })
                                    );

                                  return (
                                    <div key={orchName} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                        <span className="font-bold text-slate-800 text-xs">Ensemble : {orchName}</span>
                                        <span className="text-[11px] text-slate-500">{orchMembers.length} membre(s)</span>
                                      </div>

                                      <div className="space-y-1.5">
                                        {orchMembers.map(m => {
                                          const isMemberChecked = selectedUserIds.includes(m.id);
                                          return (
                                            <div 
                                              key={m.id}
                                              onClick={() => toggleUserSelection(m.id)}
                                              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                                isMemberChecked ? 'bg-white border-indigo-200 shadow-sm' : 'bg-slate-100/70 border-slate-200 opacity-60'
                                              }`}
                                            >
                                              <div className="flex items-center gap-3">
                                                <input 
                                                  type="checkbox"
                                                  checked={isMemberChecked}
                                                  onChange={() => {}}
                                                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                                />
                                                <span className="font-bold text-slate-900">{m.lastName.toUpperCase()} <span className="font-semibold text-slate-700">{m.firstName}</span></span>
                                                <span className="text-slate-400">{m.email}</span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* OPTION 2: TARGET BY INDIVIDUAL MEMBERS DIRECTLY */
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                              Membres de La Lyre ({filteredRecipients.length})
                            </span>
                            <div className="flex items-center gap-2 text-xs">
                              <button onClick={selectAllFiltered} className="font-bold text-indigo-600 hover:underline">Tout cocher</button>
                              <span className="text-slate-300">•</span>
                              <button onClick={deselectAll} className="font-bold text-slate-500 hover:underline">Tout décocher</button>
                            </div>
                          </div>

                          <div className="relative">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Rechercher un membre par nom, prénom, email..."
                              value={memberSearchTerm}
                              onChange={(e) => setMemberSearchTerm(e.target.value)}
                              className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>

                          {loadingRecipients ? (
                            <div className="py-12 text-center text-slate-400 text-xs">Chargement des membres...</div>
                          ) : filteredRecipients.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-xs">Aucun membre trouvé.</div>
                          ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                              {filteredRecipients.map(r => {
                                const isChecked = selectedUserIds.includes(r.id);
                                return (
                                  <div
                                    key={r.id}
                                    onClick={() => toggleUserSelection(r.id)}
                                    className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                      isChecked ? 'bg-indigo-50/60 border-indigo-300' : 'bg-white border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {}}
                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                      />
                                      <span className="font-bold text-slate-900 text-sm">{r.lastName.toUpperCase()} <span className="font-semibold text-slate-700">{r.firstName}</span></span>
                                      <span className="text-slate-400 text-xs">{r.email}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  )}

                </div>
              )}

              {/* STEP 4: Live Preview & Send */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-base">Aperçu avant envoi final</h4>

                  {/* Render simulated Email */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white text-slate-800 text-xs">
                    <div className="bg-gradient-to-r from-indigo-600 to-cyan-600 p-4 text-center text-white">
                      <h5 className="font-black text-base">La Lyre Municipale</h5>
                      <p className="text-[10px] opacity-90">Chalindrey</p>
                    </div>

                    <div className="p-4 space-y-3">
                      {isTestMode && (
                        <div className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-1 rounded text-center">
                          ⚠️ MODE TEST ({selectedUserIds.length} destinataire(s))
                        </div>
                      )}

                      <p className="font-semibold text-slate-700">Bonjour [Prénom],</p>

                      {commType === 'event' && selectedEvent ? (
                        <div className="bg-slate-50 border-l-4 border-indigo-600 p-3 rounded-r-lg space-y-1">
                          <span className="inline-block bg-indigo-100 text-indigo-800 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                            {selectedEvent.event_type === 'concert' ? 'Concert' : (selectedEvent.event_type === 'repetition' ? 'Répétition' : 'Événement')}
                          </span>
                          <h5 className="font-bold text-slate-900 text-sm">{selectedEvent.title}</h5>
                          <p className="text-[11px] text-slate-600">📅 <strong>Date :</strong> {formatEventDate(selectedEvent.event_date)}</p>
                          {selectedEvent.location && <p className="text-[11px] text-slate-600">📍 <strong>Lieu :</strong> {selectedEvent.location}</p>}
                        </div>
                      ) : (
                        <div className="bg-slate-50 border-l-4 border-indigo-600 p-3 rounded-r-lg text-slate-700 font-normal">
                          {(freeMessageContent || 'Aperçu du contenu libre...').replace(/\n/g, '<br/>')}
                        </div>
                      )}

                      {customNote && (
                        <div className="bg-slate-100 border border-dashed border-slate-300 rounded-lg p-2.5 text-[11px] italic text-slate-700">
                          <strong>Note du responsable :</strong> "{customNote}"
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 p-2 text-center text-[9px] text-slate-400 border-t border-slate-100">
                      La Lyre Municipale de Chalindrey
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                    <p><strong>Destinataires retenus :</strong> {isTestMode ? selectedUserIds.length : (commType === 'event' ? recipients.length : selectedUserIds.length)} membre(s)</p>
                    <p><strong>Objet :</strong> {customSubject}</p>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer (Controls) */}
            <div className="bg-slate-50 border-t border-slate-200 px-8 py-5 flex items-center justify-between">
              {wizardStep > 1 ? (
                <button
                  onClick={() => setWizardStep(prev => prev - 1)}
                  disabled={submitting}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 transition-colors"
                >
                  Précédent
                </button>
              ) : <div />}

              {wizardStep < 4 ? (
                <button
                  onClick={() => setWizardStep(prev => prev + 1)}
                  disabled={(wizardStep === 2 && commType === 'event' && !selectedEventId)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>Suivant</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  onClick={handleSendCommunication}
                  disabled={submitting || (commType === 'free' && !isTestMode && selectedUserIds.length === 0) || (isTestMode && selectedUserIds.length === 0)}
                  className="px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <span>Envoi en cours...</span>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Confirmer & Envoyer via Resend</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCommunication;
