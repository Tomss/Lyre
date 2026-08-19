import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Mail, Send, History, Calendar, Users, CheckCircle, 
  AlertCircle, Search, Clock, MapPin, X, Sparkles, Filter, ChevronRight, Check, ShieldAlert, FileText,
  Bold, Italic, Underline, List, Smile, HelpCircle, Music,
  AlignLeft, AlignCenter, AlignRight, Trash2, Eye, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { API_URL, BASE_URL } from '../config';

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
  message_content?: string;
  recipient_count: number;
  recipients_list: string[];
  is_test: boolean;
  created_at: string;
  event_title?: string;
  event_type?: string;
  event_location?: string;
  formatted_event_date?: string;
  sender_name: string;
}

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

const LOGO_URL = 'https://res.cloudinary.com/dr2sbjrms/image/upload/v1774629447/lyre-uploads/ll5sutyvmfrocohfv3yd.png';

const EMOJI_CATEGORIES = [
  {
    name: 'Émotions & Visages',
    icon: '😊',
    emojis: ['😊', '😄', '😃', '😎', '🥳', '🤔', '😇', '😉', '😍', '🥰', '🤗', '👋', '👏', '🙌', '🙏']
  },
  {
    name: 'Musique & Instruments',
    icon: '🎷',
    emojis: ['🎷', '🎺', '🎸', '🎻', '🥁', '🎹', '🎼', '🎵', '🎶', '🎤', '🎧', '🎭', '🎨', '🎟️']
  },
  {
    name: 'Agenda & Événements',
    icon: '📅',
    emojis: ['📅', '📍', '⏰', '⏳', '📢', '✉️', '📝', '📌', '🏆', '🎉', '🎈', '⭐', '💡', '✨']
  },
  {
    name: 'Symboles & Gestes',
    icon: '👍',
    emojis: ['👍', '👎', '👌', '🤝', '🔥', '💯', 'ℹ️', '⚠️', '✅', '❌', '❓', '❗']
  }
];

const TEXT_COLORS = [
  { label: 'Noir', color: '#0f172a' },
  { label: 'Indigo', color: '#4f46e5' },
  { label: 'Rouge', color: '#dc2626' },
  { label: 'Vert', color: '#16a34a' },
  { label: 'Bleu', color: '#2563eb' },
  { label: 'Orange', color: '#d97706' },
];

const HIGHLIGHT_COLORS = [
  { label: 'Jaune', color: '#fef08a' },
  { label: 'Vert menthe', color: '#a7f3d0' },
  { label: 'Bleu clair', color: '#bfdbfe' },
  { label: 'Rose', color: '#fbcfe8' },
  { label: 'Aucun', color: 'transparent' },
];

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
  
  // Form fields & Rich text state
  const [customSubject, setCustomSubject] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [freeMessageContent, setFreeMessageContent] = useState('');
  const [isTestMode, setIsTestMode] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  // Emoji Picker state & Click Outside Ref
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState(0);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Search & Filter states
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [eventSearchTerm, setEventSearchTerm] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'free' | 'event' | 'test'>('all');
  const [historyDateFilter, setHistoryDateFilter] = useState<'all' | '7days' | '30days' | 'thisYear'>('all');

  // Detail Modal State (View a past communication)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<CommunicationLogItem | null>(null);

  // Loading & Action states
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Custom Delete Confirmation Modal state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    id: string | null;
    subject: string;
  }>({
    isOpen: false,
    id: null,
    subject: '',
  });

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

  // Close Emoji Picker on Outside Click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Synchronize editor innerHTML when step changes to step 3 in free mode
  useEffect(() => {
    if (wizardStep === 3 && commType === 'free' && editorRef.current) {
      if (editorRef.current.innerHTML !== freeMessageContent) {
        editorRef.current.innerHTML = freeMessageContent || '';
      }
    }
  }, [wizardStep, commType]);

  // Execute Rich Text formatting commands (WYSIWYG Word-like behavior)
  const execFormat = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      setFreeMessageContent(editorRef.current.innerHTML);
    }
  };

  const insertEmojiAtCursor = (emoji: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertText', false, emoji);
      setFreeMessageContent(editorRef.current.innerHTML);
    }
    setShowEmojiPicker(false);
  };

  // Prevent scroll when wizard or modal is open
  useEffect(() => {
    if (showWizard || deleteConfirmation.isOpen || selectedHistoryItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showWizard, deleteConfirmation.isOpen, selectedHistoryItem]);

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

  // Open custom delete modal
  const promptDeleteHistoryItem = (id: string, subject: string) => {
    setDeleteConfirmation({
      isOpen: true,
      id,
      subject,
    });
  };

  // Execute deletion after user confirms in custom modal
  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.id || !token) return;
    const targetId = deleteConfirmation.id;
    setDeletingId(targetId);
    setDeleteConfirmation({ isOpen: false, id: null, subject: '' });

    try {
      const response = await fetch(`${API_URL}/communication/log/${targetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Erreur lors de la suppression.');
      }

      showNotification('Communication supprimée de l\'historique avec succès.', 'success');
      setHistory(prev => prev.filter(h => h.id !== targetId));
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Reset all history filters
  const resetHistoryFilters = () => {
    setHistorySearchTerm('');
    setHistoryTypeFilter('all');
    setHistoryDateFilter('all');
  };

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
    setShowEmojiPicker(false);
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

  // Filter history based on type, date, and search term (search across member names, emails, subject, etc.)
  const filteredHistory = history.filter(item => {
    // 1. Type / Mode Filter
    if (historyTypeFilter === 'free' && item.event_title) return false;
    if (historyTypeFilter === 'event' && !item.event_title) return false;
    if (historyTypeFilter === 'test' && !item.is_test) return false;

    // 2. Date Filter
    if (historyDateFilter !== 'all') {
      const itemDate = new Date(item.created_at).getTime();
      const now = Date.now();
      if (historyDateFilter === '7days' && (now - itemDate) > 7 * 24 * 3600 * 1000) return false;
      if (historyDateFilter === '30days' && (now - itemDate) > 30 * 24 * 3600 * 1000) return false;
      if (historyDateFilter === 'thisYear' && new Date(item.created_at).getFullYear() !== new Date().getFullYear()) return false;
    }

    // 3. Search Term (subject, event_title, sender_name, recipients list strings containing names and emails)
    if (!historySearchTerm.trim()) return true;

    const query = historySearchTerm.toLowerCase().trim();
    const recipientsString = Array.isArray(item.recipients_list) 
      ? item.recipients_list.join(' ') 
      : String(item.recipients_list || '');
      
    const fullText = `${item.subject} ${item.event_title || ''} ${item.sender_name || ''} ${recipientsString}`.toLowerCase();
    
    return fullText.includes(query);
  });

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
    
    const finalRecipientsIds = selectedUserIds;

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

      {/* Custom Tailwind Delete Confirmation Modal (Consistent with rest of the site) */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-sm">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Confirmer la suppression</h3>
            <p className="text-slate-500 mb-6 text-xs leading-relaxed">
              Voulez-vous vraiment supprimer la communication <strong className="text-slate-800">"{deleteConfirmation.subject}"</strong> de l'historique ? Cette action est irréversible.
            </p>
            <div className="flex justify-center items-center gap-3">
              <button 
                onClick={() => setDeleteConfirmation({ isOpen: false, id: null, subject: '' })}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-red-200 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Communication Detail Modal (View Full Log Contents & Recipients) */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-8 py-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Mail size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">Détails de la communication</h3>
                  <p className="text-xs text-slate-400">
                    Envoyé le {new Date(selectedHistoryItem.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })} par {selectedHistoryItem.sender_name || 'Admin'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedHistoryItem(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              
              {/* Badges & Overview */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedHistoryItem.is_test ? (
                  <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full">
                    🧪 Mode Test
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-green-100 text-green-900 text-xs font-bold rounded-full">
                    📢 Envoi Officiel
                  </span>
                )}

                {selectedHistoryItem.event_title ? (
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-900 text-xs font-bold rounded-full">
                    📅 Événement : {selectedHistoryItem.event_title}
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-purple-100 text-purple-900 text-xs font-bold rounded-full">
                    📝 Communication Libre
                  </span>
                )}

                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                  👥 {selectedHistoryItem.recipient_count} membre(s) ciblé(s)
                </span>
              </div>

              {/* Subject */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                  Objet du mail
                </label>
                <h4 className="font-extrabold text-slate-900 text-base">{selectedHistoryItem.subject}</h4>
              </div>

              {/* Event Info if applicable */}
              {selectedHistoryItem.event_title && (
                <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-200 text-xs text-indigo-900 space-y-1">
                  <h5 className="font-bold text-sm text-indigo-950">Détails de l'événement associé :</h5>
                  <p><strong>Titre :</strong> {selectedHistoryItem.event_title}</p>
                  {selectedHistoryItem.formatted_event_date && <p><strong>Date :</strong> {selectedHistoryItem.formatted_event_date}</p>}
                  {selectedHistoryItem.event_location && <p><strong>Lieu :</strong> {selectedHistoryItem.event_location}</p>}
                </div>
              )}

              {/* Message Content */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                  Contenu du message transmis
                </label>
                <div 
                  className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-slate-800 text-sm leading-relaxed max-h-64 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: selectedHistoryItem.message_content || '<p className="italic text-slate-400">Contenu non archivé pour ce test antérieur</p>' }}
                />
              </div>

              {/* Recipients List */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                  Liste des destinataires ({selectedHistoryItem.recipient_count})
                </label>
                
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 max-h-52 overflow-y-auto space-y-2 text-xs">
                  {Array.isArray(selectedHistoryItem.recipients_list) && selectedHistoryItem.recipients_list.length > 0 ? (
                    selectedHistoryItem.recipients_list.map((rec, idx) => {
                      const recStr = String(rec || '');
                      const match = recStr.match(/^(.*?)\s*\(([^)]+)\)$/);
                      
                      return (
                        <div key={idx} className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                          <CheckCircle size={15} className="text-indigo-600 flex-shrink-0" />
                          {match ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs">{match[1].trim()}</span>
                              <span className="text-slate-400 font-normal text-[11px]">&lt;{match[2].trim()}&gt;</span>
                            </div>
                          ) : (
                            <span className="font-bold text-slate-800 text-xs">{recStr}</span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-slate-400 italic text-xs">Liste des destinataires enregistrée ({selectedHistoryItem.recipient_count} membres)</div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-8 py-4 flex justify-end">
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Fermer
              </button>
            </div>

          </div>
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

        {/* SEARCH & FILTERS CARD (EXACT SAME DA & LAYOUT AS OTHER ADMIN PAGES) */}
        <div className="mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          
          {/* Row 1: Search Bar */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Rechercher une communication
            </label>
            <div className="relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par objet, nom de membre, prénom, email, événement, expéditeur..."
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-sm text-slate-800"
              />
            </div>
          </div>

          {/* Row 2: Filters Chips / Pills */}
          <div className="flex flex-col lg:flex-row gap-6 pt-4 border-t border-slate-100">
            
            {/* Filter by Type */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center">
                <Filter className="w-4 h-4 mr-2 text-indigo-500" /> Type & Mode de communication
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'Tous' },
                  { id: 'free', label: 'Communication Libre' },
                  { id: 'event', label: 'Liée à un Événement' },
                  { id: 'test', label: '🧪 Tests uniquement' },
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setHistoryTypeFilter(type.id as any)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      historyTypeFilter === type.id 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by Period */}
            <div className="lg:border-l lg:pl-6 border-slate-100 flex-1 border-t lg:border-t-0 pt-4 lg:pt-0">
              <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-amber-500" /> Période d'envoi
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'Toutes les dates' },
                  { id: '7days', label: '7 derniers jours' },
                  { id: '30days', label: '30 derniers jours' },
                  { id: 'thisYear', label: 'Cette année' },
                ].map(period => (
                  <button
                    key={period.id}
                    onClick={() => setHistoryDateFilter(period.id as any)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      historyDateFilter === period.id 
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-100' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Filters */}
            <div className="lg:border-l lg:pl-6 border-slate-100 flex flex-col justify-center border-t lg:border-t-0 pt-4 lg:pt-0 min-w-[160px]">
              <button
                onClick={resetHistoryFilters}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw size={14} />
                <span>Réinitialiser les filtres</span>
              </button>
            </div>

          </div>
        </div>

        {/* Main Content Card: History Table */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Historique des Communications ({filteredHistory.length})
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              Cliquez sur une ligne pour voir le détail complet
            </span>
          </div>

          {loadingHistory ? (
            <div className="py-12 text-center text-slate-400 text-sm">Chargement de l'historique...</div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">Aucune communication ne correspond à vos filtres.</div>
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
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredHistory.map(item => (
                    <tr 
                      key={item.id} 
                      onClick={() => setSelectedHistoryItem(item)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-3 font-medium text-slate-600 text-xs whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">
                        {item.event_title || <span className="text-slate-400 italic">Communication Libre</span>}
                      </td>
                      <td className="py-3.5 px-3 text-slate-700 text-xs max-w-xs truncate font-medium group-hover:text-indigo-600 transition-colors">
                        {item.subject}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
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
                      <td className="py-3.5 px-3 font-bold text-slate-700 whitespace-nowrap">
                        {item.recipient_count} membre(s)
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 text-xs whitespace-nowrap">
                        {item.sender_name || 'Admin'}
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedHistoryItem(item)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Voir le résumé complet de la communication"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => promptDeleteHistoryItem(item.id, item.subject)}
                            disabled={deletingId === item.id}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer cette communication de l'historique"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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
                    {wizardStep === 2 && "Étape 2 : Sélectionner les destinataires & Mode Test"}
                    {wizardStep === 3 && (commType === 'event' ? "Étape 3 : Compléter la note d'organisation" : "Étape 3 : Rédiger le message (Éditeur Word complet)")}
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
                        Choisir l'événement & Destinataires <ChevronRight size={16} className="ml-1" />
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
                        Choisir les Destinataires <ChevronRight size={16} className="ml-1" />
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: TARGET SELECTION FIRST! (EVENT OR FREE ORCHESTRAS/MEMBERS) */}
              {wizardStep === 2 && (
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
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                            1. Sélectionner l'Événement Cible
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
                          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
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
                      </div>

                      {selectedEvent && (
                        <div className="space-y-4 pt-4 border-t border-slate-200">
                          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-xs text-indigo-900 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2.5">
                              <Users size={20} className="text-indigo-600 flex-shrink-0" />
                              <span>Musiciens ciblés par l'événement : <strong>{selectedEvent.title}</strong> ({(selectedEvent.orchestras || []).map(o => o.name).join(', ')})</span>
                            </div>
                            <span className="font-black bg-indigo-600 text-white px-3 py-1 rounded-full text-xs flex-shrink-0">
                              {selectedUserIds.length} / {recipients.length} membre(s) retenu(s)
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                2. Musiciens de l'événement ({recipients.length})
                              </span>
                              <div className="flex items-center gap-2 text-xs">
                                <button type="button" onClick={() => setSelectedUserIds(recipients.map(r => r.id))} className="font-bold text-indigo-600 hover:underline">Tout cocher</button>
                                <span className="text-slate-300">•</span>
                                <button type="button" onClick={() => setSelectedUserIds([])} className="font-bold text-slate-500 hover:underline">Tout décocher</button>
                              </div>
                            </div>

                            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                              {[...recipients]
                                .sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' }) || a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' }))
                                .map(r => {
                                  const isChecked = selectedUserIds.includes(r.id);
                                  return (
                                    <div 
                                      key={r.id} 
                                      onClick={() => toggleUserSelection(r.id)}
                                      className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                        isChecked ? 'bg-indigo-50/60 border-indigo-300 shadow-xs' : 'bg-white border-slate-200 hover:bg-slate-50 opacity-60'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => {}}
                                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                        />
                                        <div>
                                          <span className="font-bold text-slate-900 text-sm">{r.lastName.toUpperCase()} <span className="font-semibold text-slate-700">{r.firstName}</span></span>
                                          <span className="text-slate-400 text-xs ml-2">{r.email}</span>
                                        </div>
                                      </div>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                        isChecked ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'
                                      }`}>
                                        {isChecked ? 'Retenu' : 'Exclu'}
                                      </span>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        </div>
                      )}
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
                          <Filter size={16} />
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

              {/* STEP 3: MESSAGE CONTENT (SUBJECT & COMPLETE WORD WYSIWYG TOOLBAR) */}
              {wizardStep === 3 && (
                <div className="space-y-6">
                  {commType === 'event' ? (
                    <div className="space-y-5">
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
                          rows={4}
                          placeholder="Ex: Arrivée requise 15 minutes en avance avec votre tenue de concert..."
                          value={customNote}
                          onChange={(e) => setCustomNote(e.target.value)}
                          className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Free Communication Form with COMPLETE WORD TOOLBAR */
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

                      {/* COMPLETE WORD TOOLBAR & WYSIWYG EDITOR */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Corps du message
                        </label>
                        
                        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                          
                          {/* Complete Word Toolbar */}
                          <div className="bg-slate-50 border-b border-slate-200 px-3 py-2.5 flex items-center justify-between flex-wrap gap-3">
                            
                            {/* Format Controls */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              
                              {/* Bold, Italic, Underline */}
                              <button 
                                type="button"
                                onClick={() => execFormat('bold')}
                                title="Gras"
                                className="p-2 hover:bg-slate-200 rounded-lg text-slate-800 font-extrabold text-xs transition-colors"
                              >
                                <Bold size={16} />
                              </button>

                              <button 
                                type="button"
                                onClick={() => execFormat('italic')}
                                title="Italique"
                                className="p-2 hover:bg-slate-200 rounded-lg text-slate-800 italic text-xs transition-colors"
                              >
                                <Italic size={16} />
                              </button>

                              <button 
                                type="button"
                                onClick={() => execFormat('underline')}
                                title="Souligné"
                                className="p-2 hover:bg-slate-200 rounded-lg text-slate-800 underline text-xs transition-colors"
                              >
                                <Underline size={16} />
                              </button>

                              <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />

                              {/* Text Size Dropdown */}
                              <select 
                                onChange={(e) => execFormat('fontSize', e.target.value)}
                                defaultValue="3"
                                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:border-slate-300"
                                title="Taille du texte"
                              >
                                <option value="2">Petite</option>
                                <option value="3">Normale</option>
                                <option value="5">Grande</option>
                                <option value="6">Très grande</option>
                              </select>

                              <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />

                              {/* Text Color Picker */}
                              <div className="flex items-center gap-1">
                                <span className="text-[11px] font-bold text-slate-500">Couleur :</span>
                                {TEXT_COLORS.map(c => (
                                  <button
                                    key={c.color}
                                    type="button"
                                    onClick={() => execFormat('foreColor', c.color)}
                                    className="w-4 h-4 rounded-full border border-slate-300 hover:scale-125 transition-transform shadow-xs"
                                    style={{ backgroundColor: c.color }}
                                    title={`Couleur ${c.label}`}
                                  />
                                ))}
                              </div>

                              <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />

                              {/* Highlight Color (Surlignage) */}
                              <div className="flex items-center gap-1">
                                <span className="text-[11px] font-bold text-slate-500">Surligner :</span>
                                {HIGHLIGHT_COLORS.map(c => (
                                  <button
                                    key={c.label}
                                    type="button"
                                    onClick={() => execFormat('hiliteColor', c.color)}
                                    className="w-4 h-4 rounded-md border border-slate-300 hover:scale-125 transition-transform shadow-xs flex items-center justify-center"
                                    style={{ backgroundColor: c.color === 'transparent' ? '#ffffff' : c.color }}
                                    title={`Surlignage : ${c.label}`}
                                  >
                                    {c.color === 'transparent' && <span className="text-[9px] text-red-500 font-bold">✕</span>}
                                  </button>
                                ))}
                              </div>

                              <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />

                              {/* Text Alignment */}
                              <button 
                                type="button"
                                onClick={() => execFormat('justifyLeft')}
                                title="Aligner à gauche"
                                className="p-2 hover:bg-slate-200 rounded-lg text-slate-800 transition-colors"
                              >
                                <AlignLeft size={16} />
                              </button>

                              <button 
                                type="button"
                                onClick={() => execFormat('justifyCenter')}
                                title="Centrer"
                                className="p-2 hover:bg-slate-200 rounded-lg text-slate-800 transition-colors"
                              >
                                <AlignCenter size={16} />
                              </button>

                              <button 
                                type="button"
                                onClick={() => execFormat('justifyRight')}
                                title="Aligner à droite"
                                className="p-2 hover:bg-slate-200 rounded-lg text-slate-800 transition-colors"
                              >
                                <AlignRight size={16} />
                              </button>

                              <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />

                              {/* Bullet List */}
                              <button 
                                type="button"
                                onClick={() => execFormat('insertUnorderedList')}
                                title="Liste à puces"
                                className="p-2 hover:bg-slate-200 rounded-lg text-slate-800 transition-colors"
                              >
                                <List size={16} />
                              </button>

                            </div>

                            {/* Emoji Picker Trigger with Ref for Click Outside */}
                            <div className="relative" ref={emojiPickerRef}>
                              <button 
                                type="button"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-all shadow-sm"
                              >
                                <Smile size={16} className="text-amber-600" />
                                <span>Smileys & Emojis</span>
                              </button>

                              {/* Emoji Picker Popover (Closes on outside click) */}
                              {showEmojiPicker && (
                                <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 w-80 space-y-3">
                                  
                                  {/* Emoji Categories Tabs */}
                                  <div className="flex items-center gap-1 border-b border-slate-100 pb-2 overflow-x-auto">
                                    {EMOJI_CATEGORIES.map((cat, idx) => (
                                      <button
                                        key={cat.name}
                                        type="button"
                                        onClick={() => setActiveEmojiCategory(idx)}
                                        className={`p-1.5 rounded-lg text-sm transition-colors ${
                                          activeEmojiCategory === idx ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-slate-100 text-slate-600'
                                        }`}
                                        title={cat.name}
                                      >
                                        {cat.icon}
                                      </button>
                                    ))}
                                  </div>

                                  {/* Emoji Grid */}
                                  <div className="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto">
                                    {EMOJI_CATEGORIES[activeEmojiCategory].emojis.map((emoji, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => insertEmojiAtCursor(emoji)}
                                        className="p-2 text-xl hover:bg-slate-100 rounded-xl transition-all hover:scale-125 text-center"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>

                                  <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 pt-1">
                                    Cliquez sur un smiley pour l'insérer directement.
                                  </div>
                                </div>
                              )}
                            </div>

                          </div>

                          {/* TRUE ContentEditable WYSIWYG Editor */}
                          <div
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={(e) => setFreeMessageContent(e.currentTarget.innerHTML)}
                            onBlur={(e) => setFreeMessageContent(e.currentTarget.innerHTML)}
                            className="w-full min-h-[220px] max-h-[350px] p-4 text-sm bg-white focus:outline-none text-slate-800 leading-relaxed overflow-y-auto"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: Live Preview & Send (REAL LOGO, NO SAXOPHONE, NO CHALINDREY, NO VERTICAL LEFT BAR) */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-base">Aperçu du mail avant envoi final</h4>

                  {/* Render Chic Simulated Email Container */}
                  <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-lg bg-slate-100 text-slate-800 text-xs p-6">
                    <div className="max-w-xl mx-auto bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                      
                      {/* Real Logo Header (No Saxophone, No Chalindrey, Just "La Lyre") */}
                      <div className="bg-white p-6 text-center border-b-2 border-indigo-600">
                        <img 
                          src={LOGO_URL} 
                          alt="La Lyre" 
                          className="h-14 w-auto mx-auto mb-2 object-contain" 
                        />
                        <h5 className="font-black text-xl text-slate-900 tracking-tight">La Lyre</h5>
                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Espace Membre</p>
                      </div>

                      {/* Email Body */}
                      <div className="p-6 space-y-4">
                        {isTestMode && (
                          <div className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-xl text-center border border-amber-300">
                            ⚠️ EMAIL DE TEST (Envoi d'essai restreint)
                          </div>
                        )}

                        <p className="font-bold text-slate-800 text-sm">Bonjour [Prénom],</p>

                        {commType === 'event' && selectedEvent ? (
                          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-block bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                                {selectedEvent.event_type === 'concert' ? 'Concert' : (selectedEvent.event_type === 'repetition' ? 'Répétition' : 'Événement')}
                              </span>
                              {(selectedEvent.orchestras || []).map(o => (
                                <span key={o.id} className="text-[10px] font-bold bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-full">
                                  {o.name}
                                </span>
                              ))}
                            </div>

                            <h5 className="font-black text-slate-900 text-base">{selectedEvent.title}</h5>

                            <div className="space-y-1 text-xs text-slate-700 pt-1">
                              <p>📅 <strong>Date :</strong> {formatEventDate(selectedEvent.event_date)}</p>
                              {selectedEvent.location && <p>📍 <strong>Lieu :</strong> {selectedEvent.location}</p>}
                              {(selectedEvent.orchestras || []).length > 0 && (
                                <p>🎷 <strong>Ensemble(s) :</strong> {(selectedEvent.orchestras || []).map(o => o.name).join(', ')}</p>
                              )}
                            </div>

                            {selectedEvent.description && (
                              <div className="pt-2 border-t border-slate-200/80">
                                <h6 className="font-bold text-slate-900 text-xs mb-1">Description / Programme :</h6>
                                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{selectedEvent.description}</p>
                              </div>
                            )}

                            {selectedEvent.practical_info && (
                              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 mt-2">
                                <h6 className="font-bold text-blue-950 mb-1 flex items-center gap-1.5">
                                  <span>ℹ️ Informations pratiques :</span>
                                </h6>
                                <p className="text-blue-900/90 leading-relaxed font-normal whitespace-pre-line">{selectedEvent.practical_info}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* CLEAN MESSAGE CONTAINER WITHOUT VERTICAL LEFT BAR */
                          <div 
                            className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-slate-800 font-normal leading-relaxed text-sm"
                            dangerouslySetInnerHTML={{ __html: freeMessageContent || 'Aperçu du contenu libre...' }}
                          />
                        )}

                        {customNote && (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs italic text-slate-700">
                            <strong>Note du responsable :</strong>
                            <div className="mt-1 font-normal not-italic" dangerouslySetInnerHTML={{ __html: customNote }} />
                          </div>
                        )}

                        {/* Clean Theme Button */}
                        <div className="text-center pt-4">
                          <span className="inline-block bg-indigo-600 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-sm">
                            Accéder à mon Espace Membre
                          </span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="bg-slate-50 p-3 text-center text-[10px] text-slate-400 border-t border-slate-100">
                        La Lyre &bull; Espace Membre
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
                    <p><strong>Destinataires retenus :</strong> {isTestMode ? selectedUserIds.length : (commType === 'event' ? recipients.length : selectedUserIds.length)} membre(s)</p>
                    <p><strong>Objet du mail :</strong> {customSubject}</p>
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
                  disabled={
                    (wizardStep === 2 && commType === 'event' && !selectedEventId) ||
                    (wizardStep === 2 && commType === 'free' && !isTestMode && selectedUserIds.length === 0) ||
                    (wizardStep === 3 && !customSubject)
                  }
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
