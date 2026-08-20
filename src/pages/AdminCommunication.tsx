import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Mail, Send, History, Calendar, Users, CheckCircle, 
  AlertCircle, Search, Clock, MapPin, X, Sparkles, Filter, ChevronRight, Check, ShieldAlert, FileText,
  Bold, Italic, Underline, List, Smile, HelpCircle, Music,
  AlignLeft, AlignCenter, AlignRight, Trash2, Eye, RefreshCw, ListOrdered
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

const LOGO_URL = '/uploads/site/logo_lyre.png';

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
  
  // Communication config ('event' | 'free')
  const [commType, setCommType] = useState<'event' | 'free'>('event');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedScheduleEventIds, setSelectedScheduleEventIds] = useState<string[]>([]);
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
  const [eventOrchestraFilter, setEventOrchestraFilter] = useState<string>('all');
  const [showMusicianDetails, setShowMusicianDetails] = useState<boolean>(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'free' | 'event' | 'schedule' | 'test'>('all');
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
    if (wizardStep === 3 && editorRef.current) {
      const currentContent = commType === 'free' ? freeMessageContent : customNote;
      if (editorRef.current.innerHTML !== currentContent) {
        editorRef.current.innerHTML = currentContent || '';
      }
    }
  }, [wizardStep, commType]);

  const syncEditorContent = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      if (commType === 'free') {
        setFreeMessageContent(content);
      } else {
        setCustomNote(content);
      }
    }
  };

  // Execute Rich Text formatting commands (WYSIWYG Word-like behavior)
  const execFormat = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      syncEditorContent();
    }
  };

  const insertEmojiAtCursor = (emoji: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertText', false, emoji);
      syncEditorContent();
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
      const data: EventItem[] = await response.json();
      setEvents(data || []);
      setSelectedEventId('');
      if (commType === 'schedule') {
        setSelectedScheduleEventIds((data || []).map(e => e.id));
      } else {
        setSelectedScheduleEventIds([]);
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleSelectCommType = (type: 'event' | 'free') => {
    setCommType(type);
    setShowMusicianDetails(false);
    setSelectedScheduleEventIds([]);
    if (type === 'event') {
      setCustomSubject('[La Lyre] Programme / Planning');
    } else {
      setCustomSubject('[La Lyre] Communication');
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
    setSelectedScheduleEventIds([]);
    setShowMusicianDetails(false);
    setEventOrchestraFilter('all');
    setShowEmojiPicker(false);
    setShowWizard(true);
    fetchUpcomingEvents();
  };

  // Fetch recipients when selected event changes or commType changes
  useEffect(() => {
    if (!token || !showWizard) return;

    if (commType === 'event' || commType === 'schedule') {
      if (selectedScheduleEventIds.length === 0) {
        setRecipients([]);
        setSelectedUserIds([]);
        setCustomSubject('[La Lyre] Programme / Planning');
        return;
      }

      const fetchMultiRecipients = async () => {
        setLoadingRecipients(true);
        try {
          const response = await fetch(`${API_URL}/communication/recipients-multi`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ eventIds: selectedScheduleEventIds })
          });
          if (!response.ok) throw new Error('Erreur lors du calcul des destinataires');
          const data = await response.json();
          setRecipients(data || []);
          setSelectedUserIds((data || []).map((r: Recipient) => r.id));
          setCustomSubject('[La Lyre] Programme / Planning');
        } catch (err: any) {
          showNotification(err.message, 'error');
        } finally {
          setLoadingRecipients(false);
        }
      };

      fetchMultiRecipients();

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

  }, [selectedEventId, selectedScheduleEventIds, commType, token, showWizard, events]);

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const selectedScheduleEvents = events
    .filter(e => selectedScheduleEventIds.includes(e.id))
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  // Available unique orchestra names across recipients
  const availableOrchestraNames = Array.from(
    new Set(recipients.flatMap(r => r.userOrchestras || []).filter(Boolean))
  ).sort();

  // Filter and sort recipients based on search
  const filteredRecipients = recipients
    .filter(r => 
      `${r.lastName} ${r.firstName} ${r.email}`.toLowerCase().includes(memberSearchTerm.toLowerCase())
    )
    .sort((a, b) => 
      a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' }) || 
      a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' })
    );

  // Available unique orchestra names across upcoming events
  const allEventOrchestraNames = Array.from(
    new Set(events.flatMap(e => (e.orchestras || []).map(o => o.name)).filter(Boolean))
  ).sort();

  // Orchestra names targeted by currently selected events
  const targetedOrchestraNames = Array.from(
    new Set(
      events
        .filter(e => selectedScheduleEventIds.includes(e.id))
        .flatMap(e => (e.orchestras || []).map(o => o.name))
        .filter(Boolean)
    )
  ).sort();

  // Unique members belonging to selected orchestras/groups (without duplicates)
  const freeSelectedMembers = recipients
    .filter(r => (r.userOrchestras || []).some(orch => selectedOrchestraNames.includes(orch)))
    .sort((a, b) => 
      a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' }) || 
      a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' })
    );

  // Filter upcoming events based on search and orchestra filter
  const filteredUpcomingEvents = events.filter(e => {
    const matchesSearch = `${e.title} ${e.location} ${e.event_type}`.toLowerCase().includes(eventSearchTerm.toLowerCase());
    const matchesOrchestra = eventOrchestraFilter === 'all' || (e.orchestras || []).some(o => o.name === eventOrchestraFilter);
    return matchesSearch && matchesOrchestra;
  });

  // Filter history based on type, date, and search term
  const filteredHistory = history.filter(item => {
    // 1. Type / Mode Filter
    if (historyTypeFilter === 'free' && item.event_title) return false;
    if (historyTypeFilter === 'event' && !item.event_title) return false;
    if (historyTypeFilter === 'schedule' && !item.subject.toLowerCase().includes('planning')) return false;
    if (historyTypeFilter === 'test' && !item.is_test) return false;

    // 2. Date Filter
    if (historyDateFilter !== 'all') {
      const itemDate = new Date(item.created_at).getTime();
      const now = Date.now();
      if (historyDateFilter === '7days' && (now - itemDate) > 7 * 24 * 3600 * 1000) return false;
      if (historyDateFilter === '30days' && (now - itemDate) > 30 * 24 * 3600 * 1000) return false;
      if (historyDateFilter === 'thisYear' && new Date(item.created_at).getFullYear() !== new Date().getFullYear()) return false;
    }

    // 3. Search Term
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

  const toggleScheduleEventSelection = (eventId: string) => {
    setSelectedScheduleEventIds(prev =>
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    );
  };

  const selectAllFiltered = () => {
    setSelectedUserIds(filteredRecipients.map(r => r.id));
  };

  const deselectAll = () => {
    setSelectedUserIds([]);
  };

  const toggleOrchestraSelection = (orchName: string) => {
    const newSelectedOrchestras = selectedOrchestraNames.includes(orchName)
      ? selectedOrchestraNames.filter(name => name !== orchName)
      : [...selectedOrchestraNames, orchName];

    setSelectedOrchestraNames(newSelectedOrchestras);

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
          eventId: (commType === 'event' || commType === 'schedule') ? (selectedScheduleEventIds[0] || null) : null,
          selectedEventIds: (commType === 'event' || commType === 'schedule') ? selectedScheduleEventIds : [],
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
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const formatted = date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
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

      {/* Custom Tailwind Delete Confirmation Modal */}
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

      {/* Communication Detail Modal */}
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

                {selectedHistoryItem.subject.toLowerCase().includes('planning') ? (
                  <span className="px-3 py-1 bg-teal-100 text-teal-900 text-xs font-bold rounded-full">
                    📅 Planning / Échéancier
                  </span>
                ) : selectedHistoryItem.event_title ? (
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
                  Gestion de la communication
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Rappels d'événements, plannings chronologiques et convocations par email
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

        {/* SEARCH & FILTERS CARD */}
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
                  { id: 'event', label: 'Liée à un Événement' },
                  { id: 'schedule', label: '📅 Planning / Échéancier' },
                  { id: 'free', label: 'Communication Libre' },
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
                    <th className="pb-3 px-3">Événement / Type</th>
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
                        {item.subject.toLowerCase().includes('planning') ? (
                          <span className="text-teal-700 font-extrabold flex items-center gap-1 text-xs">
                            <Clock size={14} /> Planning / Échéancier
                          </span>
                        ) : item.event_title ? (
                          item.event_title
                        ) : (
                          <span className="text-slate-400 italic">Communication Libre</span>
                        )}
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

      {/* POP-UP WIZARD MODAL */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full h-[88vh] shadow-2xl border border-slate-100 my-2 overflow-hidden flex flex-col">
            
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
                    {wizardStep === 2 && "Étape 2 : Sélectionner les événements & destinataires"}
                    {wizardStep === 3 && (commType === 'event' ? "Étape 3 : Compléter la note d'organisation" : (commType === 'schedule' ? "Étape 3 : Note d'introduction du planning" : "Étape 3 : Rédiger le message"))}
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
            <div className="p-8 flex-1 min-h-0 flex flex-col overflow-hidden">

              {/* STEP 1: Choose Type (2 OPTIONS) */}
              {wizardStep === 1 && (
                <div className="space-y-6 overflow-y-auto flex-1 pr-1">
                  <h4 className="font-extrabold text-slate-800 text-lg">Quel type de communication souhaitez-vous envoyer ?</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Option 1: Événement(s) & Planning */}
                    <div 
                      onClick={() => handleSelectCommType('event')}
                      className={`p-6 rounded-3xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between space-y-6 ${
                        commType === 'event' 
                          ? 'border-indigo-600 bg-indigo-50/40 ring-4 ring-indigo-600/10' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                        <Calendar size={26} />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-slate-900 text-base">1. Événement(s) & Planning</h5>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                          Transmettre des informations, convocations ou le programme pour un ou plusieurs événements à venir.
                        </p>
                      </div>
                      <span className="text-xs font-extrabold text-indigo-600 flex items-center">
                        Choisir les événements <ChevronRight size={16} className="ml-1" />
                      </span>
                    </div>

                    {/* Option 2: Communication Libre */}
                    <div 
                      onClick={() => handleSelectCommType('free')}
                      className={`p-6 rounded-3xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between space-y-6 ${
                        commType === 'free' 
                          ? 'border-purple-600 bg-purple-50/40 ring-4 ring-purple-600/10' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                        <FileText size={26} />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-slate-900 text-base">2. Communication Libre</h5>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                          Annonce générale, note d'information ou message personnalisé ciblé par groupe(s) ou par membre(s).
                        </p>
                      </div>
                      <span className="text-xs font-extrabold text-purple-600 flex items-center">
                        Rédiger un message <ChevronRight size={16} className="ml-1" />
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: TARGET & SELECTION */}
              {wizardStep === 2 && (
                <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

                  {(commType === 'event' || commType === 'schedule') ? (
                    /* EVENT & SCHEDULE MULTI-SELECTION TARGETING */
                    <div className="flex flex-col flex-1 min-h-0 overflow-hidden space-y-3">
                      
                      {/* Header with Search & Orchestra Filter */}
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
                          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                            1. Sélectionner le ou les événements ({selectedScheduleEventIds.length} retenu{selectedScheduleEventIds.length > 1 ? 's' : ''})
                          </label>

                          <div className="flex items-center gap-2.5 flex-wrap">
                            {/* Orchestra Filter */}
                            {allEventOrchestraNames.length > 0 && (
                              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                                <Filter size={14} className="text-slate-400" />
                                <select
                                  value={eventOrchestraFilter}
                                  onChange={(e) => setEventOrchestraFilter(e.target.value)}
                                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                                >
                                  <option value="all">Tous les orchestres ({events.length})</option>
                                  {allEventOrchestraNames.map(orch => (
                                    <option key={orch} value={orch}>{orch}</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {/* Event Search Input */}
                            <div className="relative w-48">
                              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Chercher un événement..."
                                value={eventSearchTerm}
                                onChange={(e) => setEventSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                              />
                            </div>

                            {/* Quick selection links */}
                            <div className="flex items-center gap-2 text-xs">
                              <button type="button" onClick={() => setSelectedScheduleEventIds(filteredUpcomingEvents.map(e => e.id))} className="font-bold text-indigo-600 hover:underline">Tous les filtrés</button>
                              <span className="text-slate-300">•</span>
                              <button type="button" onClick={() => setSelectedScheduleEventIds(filteredUpcomingEvents.slice(0, 3).map(e => e.id))} className="font-bold text-teal-600 hover:underline">3 prochains</button>
                              <span className="text-slate-300">•</span>
                              <button type="button" onClick={() => setSelectedScheduleEventIds([])} className="font-bold text-slate-500 hover:underline">Aucun</button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Events List Container (The ONLY scrollable container!) */}
                      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5">
                        {loadingEvents ? (
                          <div className="py-12 text-center text-slate-400 text-sm">Chargement des événements...</div>
                        ) : filteredUpcomingEvents.length === 0 ? (
                          <div className="py-12 text-center text-slate-400 text-sm">Aucun événement correspondant trouvé.</div>
                        ) : (
                          filteredUpcomingEvents.map(ev => {
                            const isChecked = selectedScheduleEventIds.includes(ev.id);
                            return (
                              <div
                                key={ev.id}
                                onClick={() => toggleScheduleEventSelection(ev.id)}
                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                                  isChecked 
                                    ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-600/20' 
                                    : 'bg-white border-slate-200 hover:bg-slate-50'
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
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                                    <h5 className="font-bold text-slate-900 text-sm">{ev.title}</h5>
                                    <p className="text-xs text-slate-500">
                                      📅 {formatEventDate(ev.event_date)} {ev.location ? `• 📍 ${ev.location}` : ''}
                                    </p>
                                  </div>
                                </div>

                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                  isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                                }`}>
                                  {isChecked && <Check size={12} className="stroke-[3]" />}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Recipient Summary & Collapsible Musician Details */}
                      <div className="flex-shrink-0 pt-3 border-t border-slate-200 space-y-3">
                        <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-3.5 text-xs text-indigo-900 space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2.5">
                              <Users size={20} className="text-indigo-600 flex-shrink-0" />
                              <span className="font-medium">
                                Orchestre(s) : <strong>{targetedOrchestraNames.length > 0 ? targetedOrchestraNames.join(', ') : 'Aucun événement sélectionné'}</strong>
                              </span>
                            </div>
                            <span className="font-black bg-indigo-600 text-white px-3 py-1 rounded-full text-xs flex-shrink-0">
                              {selectedUserIds.length} / {recipients.length} membre(s) sélectionné(s)
                            </span>
                          </div>

                          {recipients.length > 0 && (
                            <div className="flex items-center justify-end pt-1 border-t border-indigo-200/60 text-[11px] text-indigo-800">
                              <button
                                type="button"
                                onClick={() => setShowMusicianDetails(!showMusicianDetails)}
                                className="font-bold text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1 cursor-pointer"
                              >
                                {showMusicianDetails ? (
                                  <><span>▲ Masquer la liste des musiciens</span></>
                                ) : (
                                  <><span>👁️ Déplier / Personnaliser la liste des musiciens ({recipients.length})</span></>
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Collapsible Musician List */}
                        {showMusicianDetails && (
                          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                Musiciens de la sélection ({recipients.length})
                              </span>
                              <div className="flex items-center gap-3 text-xs">
                                <button type="button" onClick={() => setSelectedUserIds(recipients.map(r => r.id))} className="font-bold text-indigo-600 hover:underline">Tout cocher</button>
                                <span className="text-slate-300">•</span>
                                <button type="button" onClick={() => setSelectedUserIds([])} className="font-bold text-slate-500 hover:underline">Tout décocher</button>
                              </div>
                            </div>

                            {/* Search Filter for Members */}
                            <div className="relative">
                              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Rechercher un membre..."
                                value={memberSearchTerm}
                                onChange={(e) => setMemberSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            </div>

                            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                              {filteredRecipients.map(r => {
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
                        )}
                      </div>
                    </div>
                  ) : (
                    /* FREE COMMUNICATION TARGETING */
                    <div className="flex flex-col flex-1 min-h-0 overflow-hidden space-y-4">
                      {/* Mode Selector Tabs */}
                      <div className="flex-shrink-0">
                        <div className="flex items-center p-1 bg-slate-100 rounded-2xl gap-1">
                          <button
                            type="button"
                            onClick={() => setFreeTargetMode('orchestras')}
                            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                              freeTargetMode === 'orchestras'
                                ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100/50'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <Filter size={16} />
                            <span>1. Cibler par Groupe(s)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFreeTargetMode('members')}
                            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                              freeTargetMode === 'members'
                                ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100/50'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <Users size={16} />
                            <span>2. Sélectionner par Membre(s) direct(s)</span>
                          </button>
                        </div>
                      </div>

                      {freeTargetMode === 'orchestras' ? (
                        <div className="flex flex-col flex-1 min-h-0 overflow-hidden space-y-3">
                          {/* Header & Quick Actions */}
                          <div className="flex-shrink-0 flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                              Sélectionner les groupes ({availableOrchestraNames.length})
                            </span>
                            <div className="flex items-center gap-2 text-xs">
                              <button type="button" onClick={selectAllOrchestras} className="font-bold text-indigo-600 hover:underline">Tous les groupes</button>
                              <span className="text-slate-300">•</span>
                              <button type="button" onClick={deselectAllOrchestras} className="font-bold text-slate-500 hover:underline">Aucun groupe</button>
                            </div>
                          </div>

                          {/* Groups List (Internal scrollable container) */}
                          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {availableOrchestraNames.map(orchName => {
                                const isChecked = selectedOrchestraNames.includes(orchName);
                                const membersOfOrch = recipients.filter(r => (r.userOrchestras || []).includes(orchName));

                                return (
                                  <div 
                                    key={orchName}
                                    onClick={() => toggleOrchestraSelection(orchName)}
                                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
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
                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                      />
                                      <div>
                                        <h6 className="font-bold text-slate-800 text-sm">{orchName}</h6>
                                        <p className="text-xs text-slate-500">{membersOfOrch.length} membre(s)</p>
                                      </div>
                                    </div>

                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                      isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                                    }`}>
                                      {isChecked && <Check size={12} className="stroke-[3]" />}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Recipient Summary & Collapsible Musician Details */}
                          <div className="flex-shrink-0 pt-3 border-t border-slate-200 space-y-3">
                            <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-3.5 text-xs text-purple-900 space-y-2">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2.5">
                                  <Users size={20} className="text-purple-600 flex-shrink-0" />
                                  <span className="font-medium">
                                    Groupe(s) : <strong>{selectedOrchestraNames.length > 0 ? selectedOrchestraNames.join(', ') : 'Aucun groupe sélectionné'}</strong>
                                  </span>
                                </div>
                                <span className="font-black bg-purple-600 text-white px-3 py-1 rounded-full text-xs flex-shrink-0">
                                  {selectedUserIds.length} / {recipients.length} membre(s) sélectionné(s)
                                </span>
                              </div>

                              {selectedUserIds.length > 0 && (
                                <div className="flex items-center justify-end pt-1 border-t border-purple-200/60 text-[11px] text-purple-800">
                                  <button
                                    type="button"
                                    onClick={() => setShowMusicianDetails(!showMusicianDetails)}
                                    className="font-bold text-purple-700 hover:text-purple-900 underline flex items-center gap-1 cursor-pointer"
                                  >
                                    {showMusicianDetails ? (
                                      <span>▲ Masquer la liste des musiciens</span>
                                    ) : (
                                      <span>👁️ Déplier / Personnaliser la liste des musiciens ({selectedUserIds.length})</span>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Collapsible Musician List (Deduplicated across selected groups!) */}
                            {showMusicianDetails && (
                              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                    Musiciens des groupes retenus ({freeSelectedMembers.length} sans doublon)
                                  </span>
                                  <div className="flex items-center gap-3 text-xs">
                                    <button type="button" onClick={() => setSelectedUserIds(freeSelectedMembers.map(m => m.id))} className="font-bold text-purple-600 hover:underline">Tout cocher</button>
                                    <span className="text-slate-300">•</span>
                                    <button type="button" onClick={() => setSelectedUserIds([])} className="font-bold text-slate-500 hover:underline">Tout décocher</button>
                                  </div>
                                </div>

                                <div className="relative">
                                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input
                                    type="text"
                                    placeholder="Rechercher un membre par nom, prénom..."
                                    value={memberSearchTerm}
                                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                  />
                                </div>

                                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                                  {freeSelectedMembers
                                    .filter(m => `${m.lastName} ${m.firstName} ${m.email}`.toLowerCase().includes(memberSearchTerm.toLowerCase()))
                                    .map(m => {
                                      const isChecked = selectedUserIds.includes(m.id);
                                      return (
                                        <div 
                                          key={m.id} 
                                          onClick={() => toggleUserSelection(m.id)}
                                          className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                            isChecked ? 'bg-purple-50/60 border-purple-300 shadow-xs' : 'bg-white border-slate-200 hover:bg-slate-50 opacity-60'
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => {}}
                                              className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                                            />
                                            <div>
                                              <span className="font-bold text-slate-900 text-sm">{m.lastName.toUpperCase()} <span className="font-semibold text-slate-700">{m.firstName}</span></span>
                                              <span className="text-slate-400 text-xs ml-2">({(m.userOrchestras || []).join(', ')})</span>
                                            </div>
                                          </div>
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                            isChecked ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-500'
                                          }`}>
                                            {isChecked ? 'Retenu' : 'Exclu'}
                                          </span>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* DIRECT MEMBERS TARGETING */
                        <div className="flex flex-col flex-1 min-h-0 overflow-hidden space-y-3">
                          <div className="flex-shrink-0 flex items-center justify-between flex-wrap gap-2">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                              Membres de La Lyre ({filteredRecipients.length})
                            </span>
                            <div className="flex items-center gap-3 text-xs">
                              <button type="button" onClick={selectAllFiltered} className="font-bold text-purple-600 hover:underline">Tout cocher</button>
                              <span className="text-slate-300">•</span>
                              <button type="button" onClick={deselectAll} className="font-bold text-slate-500 hover:underline">Tout décocher</button>
                            </div>
                          </div>

                          <div className="flex-shrink-0 relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Rechercher un membre par nom, prénom, email..."
                              value={memberSearchTerm}
                              onChange={(e) => setMemberSearchTerm(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                          </div>

                          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
                            {filteredRecipients.map(r => {
                              const isChecked = selectedUserIds.includes(r.id);
                              return (
                                <div
                                  key={r.id}
                                  onClick={() => toggleUserSelection(r.id)}
                                  className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                    isChecked ? 'bg-purple-50/60 border-purple-300 shadow-xs' : 'bg-white border-slate-200 hover:bg-slate-50 opacity-60'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}}
                                      className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                                    />
                                    <div>
                                      <span className="font-bold text-slate-900 text-sm">{r.lastName.toUpperCase()} <span className="font-semibold text-slate-700">{r.firstName}</span></span>
                                      <span className="text-slate-400 text-xs ml-2">{r.email}</span>
                                    </div>
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                    isChecked ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {isChecked ? 'Retenu' : 'Exclu'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* STEP 3: MESSAGE CONTENT & NOTES (UNIFIED RICH TEXT TOOLBAR ACROSS ALL MODES) */}
              {wizardStep === 3 && (
                <div className="space-y-5 overflow-y-auto flex-1 pr-1">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Objet du Mail
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      {commType === 'event' 
                        ? "Note d'organisation du responsable (Optionnel)" 
                        : (commType === 'schedule' 
                          ? "Message d'introduction du planning (Optionnel)" 
                          : "Corps du message")}
                    </label>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                      <div className="bg-slate-50 border-b border-slate-200 px-3 py-2.5 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button type="button" onClick={() => execFormat('bold')} title="Gras" className="p-2 hover:bg-slate-200 rounded-lg text-slate-800 font-extrabold text-xs transition-colors"><Bold size={16} /></button>
                          <button type="button" onClick={() => execFormat('italic')} title="Italique" className="p-2 hover:bg-slate-200 rounded-lg text-slate-800 italic text-xs transition-colors"><Italic size={16} /></button>
                          <button type="button" onClick={() => execFormat('underline')} title="Souligné" className="p-2 hover:bg-slate-200 rounded-lg text-slate-800 underline text-xs transition-colors"><Underline size={16} /></button>
                          <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />
                          <select onChange={(e) => execFormat('fontSize', e.target.value)} defaultValue="3" className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer">
                            <option value="2">Petite</option>
                            <option value="3">Normale</option>
                            <option value="5">Grande</option>
                            <option value="6">Très grande</option>
                          </select>
                          <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold text-slate-500">Couleur :</span>
                            {TEXT_COLORS.map(c => (
                              <button key={c.color} type="button" onClick={() => execFormat('foreColor', c.color)} className="w-4 h-4 rounded-full border border-slate-300 hover:scale-125 transition-transform" style={{ backgroundColor: c.color }} />
                            ))}
                          </div>
                        </div>
                        <div className="relative" ref={emojiPickerRef}>
                          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-all">
                            <Smile size={16} className="text-amber-600" />
                            <span>Smileys</span>
                          </button>
                          {showEmojiPicker && (
                            <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 w-80 space-y-3">
                              <div className="flex items-center gap-1 border-b border-slate-100 pb-2">
                                {EMOJI_CATEGORIES.map((cat, idx) => (
                                  <button key={cat.name} type="button" onClick={() => setActiveEmojiCategory(idx)} className={`p-1.5 rounded-lg text-sm ${activeEmojiCategory === idx ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-slate-100'}`}>{cat.icon}</button>
                                ))}
                              </div>
                              <div className="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto">
                                {EMOJI_CATEGORIES[activeEmojiCategory].emojis.map((emoji, i) => (
                                  <button key={i} type="button" onClick={() => insertEmojiAtCursor(emoji)} className="p-2 text-xl hover:bg-slate-100 rounded-xl">{emoji}</button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        ref={editorRef}
                        contentEditable
                        onInput={() => syncEditorContent()}
                        onBlur={() => syncEditorContent()}
                        className="w-full min-h-[200px] max-h-[320px] p-4 text-sm bg-white focus:outline-none text-slate-800 leading-relaxed overflow-y-auto"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Live Preview & Send */}
              {wizardStep === 4 && (
                <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                  <h4 className="font-bold text-slate-800 text-base">Aperçu du mail avant envoi final</h4>

                  <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-lg bg-slate-100 text-slate-800 text-xs p-6">
                    <div className="w-full mx-auto bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                      
                      <div className="bg-white p-6 text-center border-b-2 border-indigo-600">
                        <img 
                          src={LOGO_URL} 
                          alt="La Lyre" 
                          className="h-14 w-auto mx-auto mb-2 object-contain" 
                        />
                        <h5 className="font-black text-xl text-slate-900 tracking-tight">La Lyre</h5>
                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Espace Membre</p>
                      </div>

                      <div className="p-6 space-y-4">
                        {isTestMode && (
                          <div className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-xl text-center border border-amber-300">
                            ⚠️ EMAIL DE TEST (Envoi d'essai restreint)
                          </div>
                        )}

                        <p className="font-bold text-slate-800 text-sm">Bonjour [Prénom],</p>

                        {customNote && (
                          <div className="bg-purple-50/80 border border-purple-200 p-4 rounded-2xl text-xs text-purple-950">
                            <div className="text-purple-950 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: customNote }} />
                          </div>
                        )}

                        {(commType === 'event' || commType === 'schedule') && selectedScheduleEvents.length > 0 ? (
                          <div className="space-y-4">

                            {selectedScheduleEvents.length === 1 ? (
                              /* SINGLE EVENT PREVIEW CARD */
                              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="inline-block bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                                    {selectedScheduleEvents[0].event_type === 'concert' ? 'Concert' : (selectedScheduleEvents[0].event_type === 'repetition' ? 'Répétition' : 'Événement')}
                                  </span>
                                  {(selectedScheduleEvents[0].orchestras || []).map(o => (
                                    <span key={o.id} className="text-[10px] font-bold bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-full">
                                      {o.name}
                                    </span>
                                  ))}
                                </div>

                                <h5 className="font-black text-slate-900 text-base">{selectedScheduleEvents[0].title}</h5>

                                <div className="space-y-1 text-xs text-slate-700 pt-1">
                                  <p>📅 <strong>Date :</strong> {formatEventDate(selectedScheduleEvents[0].event_date)}</p>
                                  {selectedScheduleEvents[0].location && <p>📍 <strong>Lieu :</strong> {selectedScheduleEvents[0].location}</p>}
                                  {(selectedScheduleEvents[0].orchestras || []).length > 0 && (
                                    <p>🎷 <strong>Ensemble(s) :</strong> {(selectedScheduleEvents[0].orchestras || []).map(o => o.name).join(', ')}</p>
                                  )}
                                </div>

                                {selectedScheduleEvents[0].description && (
                                  <div className="pt-2 border-t border-slate-200/80">
                                    <h6 className="font-bold text-slate-900 text-xs mb-1">Description / Programme :</h6>
                                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{selectedScheduleEvents[0].description}</p>
                                  </div>
                                )}

                                {selectedScheduleEvents[0].practical_info && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 mt-2">
                                    <h6 className="font-bold text-blue-950 mb-1 flex items-center gap-1.5">
                                      <span>ℹ️ Informations pratiques :</span>
                                    </h6>
                                    <p className="text-blue-900/90 leading-relaxed font-normal whitespace-pre-line">{selectedScheduleEvents[0].practical_info}</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* MULTI-EVENT TIMELINE PREVIEW CARD */
                              <div className="space-y-3">
                                <h5 className="font-black text-slate-900 text-sm border-b border-indigo-500 pb-2 flex items-center gap-2">
                                  <Calendar size={18} className="text-indigo-600" />
                                  📅 Programme & Prochaines Échéances ({selectedScheduleEvents.length} événements)
                                </h5>

                                {selectedScheduleEvents.map(ev => (
                                  <div key={ev.id} className="bg-slate-50 border-l-4 border-indigo-600 rounded-2xl p-4 border border-slate-200 space-y-1.5">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                      <span className="bg-indigo-100 text-indigo-900 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                                        📅 {formatEventDate(ev.event_date)}
                                      </span>
                                      <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                        {ev.event_type === 'concert' ? 'Concert' : (ev.event_type === 'repetition' ? 'Répétition' : 'Événement')}
                                      </span>
                                    </div>
                                    <h6 className="font-black text-slate-900 text-sm">{ev.title}</h6>
                                    {ev.location && <p className="text-xs text-slate-600">📍 <strong>Lieu :</strong> {ev.location}</p>}
                                    {(ev.orchestras || []).length > 0 && (
                                      <p className="text-xs text-slate-600">🎷 <strong>Ensemble(s) :</strong> {(ev.orchestras || []).map(o => o.name).join(', ')}</p>
                                    )}
                                    {ev.description && <p className="text-xs text-slate-600 pt-1 leading-relaxed">{ev.description}</p>}
                                    {ev.practical_info && (
                                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-[11px] text-blue-900 mt-1">
                                        <strong>ℹ️ Infos pratiques :</strong> {ev.practical_info}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div 
                            className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-slate-800 font-normal leading-relaxed text-sm"
                            dangerouslySetInnerHTML={{ __html: freeMessageContent || 'Aperçu du contenu libre...' }}
                          />
                        )}

                        <div className="text-center pt-4">
                          <span className="inline-block bg-indigo-600 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-sm">
                            Accéder à mon Espace Membre
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5 text-xs text-slate-600">
                        <p><strong>Destinataires retenus :</strong> {selectedUserIds.length} membre(s)</p>
                        <p><strong>Objet du mail :</strong> {customSubject || ((commType === 'event' || commType === 'schedule') ? '[La Lyre] Programme / Planning' : '[La Lyre] Communication')}</p>
                      </div>

                    </div>
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
                    (wizardStep === 2 && (commType === 'event' || commType === 'schedule') && (selectedScheduleEventIds.length === 0 || selectedUserIds.length === 0)) ||
                    (wizardStep === 2 && commType === 'free' && selectedUserIds.length === 0) ||
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
                  disabled={submitting || selectedUserIds.length === 0}
                  className="px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <span>Envoi en cours...</span>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Confirmer & Envoyer</span>
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
