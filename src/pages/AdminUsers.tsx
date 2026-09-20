import React, { useState, useEffect, FormEvent } from 'react';
import { ChevronDown,  Edit, Trash2, Users, Mail, MailPlus, User, Shield, X, UserPlus, CheckCircle, Search, ArrowLeft, Power, Music, LayoutGrid, Plus, KeyRound, Eye, EyeOff, Copy, Sparkles, Star, ArrowUpDown } from "lucide-react";
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { EmailAutocompleteInput } from '../components/EmailAutocompleteInput';

import { API_URL } from '../config';

export interface AssociatedEmail {
  userId: string;
  email: string;
  isPrimary: boolean;
  hasPassword: boolean;
  isActive?: boolean;
  isInvited?: boolean;
  lastLogin: string | null;
  alsoUsedBy?: string[];
}

interface UserData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'Membre' | 'Gestionnaire' | 'Admin';
  managed_modules?: string[];
  status?: 'Inactive' | 'Invited' | 'Active';
  has_password: boolean;
  last_login?: string | null;
  emails?: AssociatedEmail[];
}

interface Instrument {
  id: string;
  name: string;
}

interface Orchestra {
  id: string;
  name: string;
  description?: string;
}

interface DeleteConfirmation {
  isOpen: boolean;
  user: UserData | null;
}

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

const generateSecurePassword = () => {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const specials = '!@#$%^&*_-+=?';
  const all = uppers + lowers + digits + specials;
  
  let pwd = '';
  pwd += uppers[Math.floor(Math.random() * uppers.length)];
  pwd += lowers[Math.floor(Math.random() * lowers.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += specials[Math.floor(Math.random() * specials.length)];
  for (let i = 0; i < 8; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd.split('').sort(() => 0.5 - Math.random()).join('');
};

const getPasswordRules = (pwd: string) => {
  return {
    minLength: pwd.length >= 8,
    hasUpper: /[A-Z]/.test(pwd),
    hasLower: /[a-z]/.test(pwd),
    hasDigit: /[0-9]/.test(pwd),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(pwd),
  };
};

const AdminUsers = () => {
  const { currentUser, token, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [orchestras, setOrchestras] = useState<Orchestra[]>([]);
  const [userInstruments, setUserInstruments] = useState<{ [key: string]: Instrument[] }>({});
  const [userOrchestras, setUserOrchestras] = useState<{ [key: string]: Orchestra[] }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string[]>(['Admin', 'Gestionnaire', 'Membre']);
  const [statusFilter, setStatusFilter] = useState<string[]>(['Active', 'Invited', 'Inactive']);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set(['Admin', 'Gestionnaire', 'Membre']));
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    isOpen: false,
    user: null,
  });
  const [addEmailModal, setAddEmailModal] = useState<{
    isOpen: boolean;
    profile: UserData | null;
    email: string;
    submitting: boolean;
  }>({
    isOpen: false,
    profile: null,
    email: '',
    submitting: false
  });
  const [removeEmailConfirmation, setRemoveEmailConfirmation] = useState<{
    isOpen: boolean;
    profileId: string;
    userId: string;
    email: string;
    submitting: boolean;
  }>({
    isOpen: false,
    profileId: '',
    userId: '',
    email: '',
    submitting: false
  });
  const [showPasswordInForm, setShowPasswordInForm] = useState(false);

  const [setPasswordModal, setSetPasswordModal] = useState<{
    isOpen: boolean;
    profileId: string;
    profileName: string;
    userId: string;
    email: string;
    password: string;
    showPassword: boolean;
    submitting: boolean;
    copied: boolean;
  }>({
    isOpen: false,
    profileId: '',
    profileName: '',
    userId: '',
    email: '',
    password: '',
    showPassword: false,
    submitting: false,
    copied: false,
  });

  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    type: 'success',
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Membre' as 'Membre' | 'Gestionnaire' | 'Admin',
    instruments: [] as string[],
    orchestras: [] as string[],
    managedModules: [] as string[],
    status: 'Inactive' as 'Inactive' | 'Invited' | 'Active',
  });
  const [secondaryEmails, setSecondaryEmails] = useState<string[]>([]);

  const availableModules = [
    { id: 'news', label: 'Actualités & Événements' },
    { id: 'communication', label: 'Communication & Emails' },
    { id: 'orchestras', label: 'Orchestres' },
    { id: 'instruments', label: 'Instruments & Professeurs' },
    { id: 'media', label: 'Média & Photos' },
    { id: 'morceaux', label: 'Répertoire Musical' },
    { id: 'partners', label: 'Partenaires' },
    { id: 'theme', label: 'Configuration du thème' },
    { id: 'users', label: 'Utilisateurs' },
  ];

  useEffect(() => {
    if (showAddForm || deleteConfirmation.isOpen || addEmailModal.isOpen || removeEmailConfirmation.isOpen || setPasswordModal.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddForm, deleteConfirmation.isOpen, addEmailModal.isOpen, removeEmailConfirmation.isOpen, setPasswordModal.isOpen]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // MIGRÉ
  const fetchInstruments = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/instruments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.status === 403) throw new Error('Accès refusé.');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setInstruments(data || []);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des instruments:', err);
    }
  };

  // MIGRÉ
  const fetchOrchestras = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/orchestras`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.status === 403) throw new Error('Accès refusé.');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setOrchestras(data || []);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des orchestres:', err);
    }
  };

  // MIGRÉ ET OPTIMISÉ
  const fetchAllUserAssociations = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/user-associations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch user associations');
      const { userInstruments: flatInstruments, userOrchestras: flatOrchestras } = await response.json();

      // Transformer les listes plates en maps
      const instrumentsMap = flatInstruments.reduce((acc: any, item: any) => {
        if (!acc[item.user_id]) {
          acc[item.user_id] = [];
        }
        acc[item.user_id].push({ id: item.id, name: item.name });
        return acc;
      }, {});

      const orchestrasMap = flatOrchestras.reduce((acc: any, item: any) => {
        if (!acc[item.user_id]) {
          acc[item.user_id] = [];
        }
        acc[item.user_id].push({ id: item.id, name: item.name });
        return acc;
      }, {});

      setUserInstruments(instrumentsMap);
      setUserOrchestras(orchestrasMap);

    } catch (err: any) {
      console.error('Erreur lors de la récupération des associations utilisateur:', err);
      showNotification(err.message, 'error');
    }
  };

  // MIGRÉ
  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.status === 403) throw new Error('Accès refusé.');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setUsers(data || []);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des utilisateurs:', err);
      showNotification(err.message, 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated && (currentUser?.role === "Admin" || currentUser?.managedModules?.includes("users"))) {
      fetchUsers();
      fetchInstruments();
      fetchOrchestras();
    }
  }, [isAuthenticated, currentUser, token]);

  useEffect(() => {
    if (users.length > 0) {
      fetchAllUserAssociations();
    }
  }, [users]);

  useEffect(() => {
    if (editingUser) {
      const updated = users.find(u => u.id === editingUser.id);
      if (updated) {
        setEditingUser(updated);
      }
    }
  }, [users]);

  // ... Le reste du composant reste inchangé pour l'instant

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInstrumentChange = (instrumentId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      instruments: checked
        ? [...prev.instruments, instrumentId]
        : prev.instruments.filter(id => id !== instrumentId)
    }));
  };

  const handleOrchestraChange = (orchestraId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      orchestras: checked
        ? [...prev.orchestras, orchestraId]
        : prev.orchestras.filter(id => id !== orchestraId)
    }));
  };

  const handleModuleChange = (moduleId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      managedModules: checked
        ? [...prev.managedModules, moduleId]
        : prev.managedModules.filter(id => id !== moduleId)
    }));
  };

  const handleInvite = async (profileId: string, targetUserId?: string) => {
    console.log(`[Invitation] Triggered for profile ${profileId}, targetUserId: ${targetUserId || 'primary'}`);
    if (!token) {
      console.error("[Invitation] Error: Token is missing!");
      showNotification("Erreur d'authentification : jeton manquant.", "error");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/${profileId}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(targetUserId ? { userId: targetUserId } : {}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'envoi");
      }

      const result = await response.json();
      showNotification(result.message);
      fetchUsers(); // Actualiser pour voir la pastille "🟡 Invité"
    } catch (err: any) {
      console.error("Erreur d'invitation:", err);
      showNotification(err.message, 'error');
    }
    setLoading(false);
  };

  const handleToggleStatus = async (user: UserData) => {
    if (!token) return;
    
    let newStatus: 'Active' | 'Inactive' | 'Invited';
    
    if (user.role === 'Admin') {
      newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    } else {
      if (user.status === 'Active') {
        newStatus = 'Inactive';
      } else if (user.status === 'Invited') {
        newStatus = 'Inactive';
      } else {
        // Inactif -> Activable direct SI a un mot de passe (Option 1)
        if (user.has_password) {
          newStatus = 'Active';
        } else {
          showNotification("L'activation nécessite l'envoi d'un mail", "error");
          return;
        }
      }
    }
    
    // Optimistic update
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));

    try {
      const response = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          status: newStatus,
          managedModules: user.managed_modules,
          instruments: userInstruments[user.id]?.map(i => i.id) || [],
          orchestras: userOrchestras[user.id]?.map(o => o.id) || [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du changement de statut');
      }
      showNotification(`Compte ${newStatus === 'Active' ? 'activé' : 'désactivé'} avec succès`);
    } catch (err: any) {
      console.error(err);
      showNotification(err.message, 'error');
      // Rollback
      fetchUsers();
    }
  };

  // MIGRÉ
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          secondaryEmails: secondaryEmails.map(e => e.trim()).filter(e => e.length > 0),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur de création');
      }

      const result = await response.json();
      showNotification(result.message);
      cancelEdit();
      fetchUsers();
      fetchAllUserAssociations();
    } catch (err: any) {
      console.error('Erreur de création:', err);
      showNotification(err.message, 'error');
    }
    setSubmitting(false);
  };

  const handleOpenAddEmail = (user: UserData) => {
    setAddEmailModal({
      isOpen: true,
      profile: user,
      email: '',
      submitting: false,
    });
  };

  const handleSubmitAddEmail = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const profile = addEmailModal.profile;
    const emailToSubmit = addEmailModal.email.trim();

    if (!profile || !token || !emailToSubmit) return;
    setAddEmailModal(prev => ({ ...prev, submitting: true }));

    try {
      const response = await fetch(`${API_URL}/users/${profile.id}/add-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailToSubmit,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'ajout de l\'e-mail');
      }

      const result = await response.json();
      showNotification(result.message || 'Adresse e-mail rattachée avec succès');
      setAddEmailModal({ isOpen: false, profile: null, email: '', submitting: false });
      await fetchUsers();
      if (editingUser && editingUser.id === profile.id) {
        const res = await fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const freshUsers: UserData[] = await res.json();
          const freshEditing = freshUsers.find(u => u.id === editingUser.id);
          if (freshEditing) setEditingUser(freshEditing);
        }
      }
    } catch (err: any) {
      console.error('Erreur add-email:', err);
      showNotification(err.message, 'error');
      setAddEmailModal(prev => ({ ...prev, submitting: false }));
    }
  };

  const handlePromptRemoveEmail = (profileId: string, userId: string, email: string) => {
    setRemoveEmailConfirmation({
      isOpen: true,
      profileId,
      userId,
      email,
      submitting: false,
    });
  };

  const handleConfirmRemoveEmail = async () => {
    if (!token || !removeEmailConfirmation.profileId || !removeEmailConfirmation.userId) return;
    setRemoveEmailConfirmation(prev => ({ ...prev, submitting: true }));
    try {
      const response = await fetch(`${API_URL}/users/${removeEmailConfirmation.profileId}/emails/${removeEmailConfirmation.userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la dissociation de l\'e-mail');
      }

      const result = await response.json();
      showNotification(result.message || 'E-mail dissocié');
      setRemoveEmailConfirmation({ isOpen: false, profileId: '', userId: '', email: '', submitting: false });
      await fetchUsers();
    } catch (err: any) {
      console.error('Erreur remove-email:', err);
      showNotification(err.message, 'error');
      setRemoveEmailConfirmation(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleSetPrimaryEmail = async (profileId: string, userId: string, email: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/users/${profileId}/emails/${userId}/primary`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la modification de l\'e-mail principal');
      }

      const result = await response.json();
      showNotification(result.message || `${email} est désormais l'adresse principale.`);
      await fetchUsers();
      if (editingUser && editingUser.id === profileId) {
        const res = await fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const freshUsers: UserData[] = await res.json();
          const freshEditing = freshUsers.find(u => u.id === editingUser.id);
          if (freshEditing) setEditingUser(freshEditing);
        }
      }
    } catch (err: any) {
      console.error('Erreur set-primary-email:', err);
      showNotification(err.message, 'error');
    }
  };

  const handleOpenSetPasswordModal = (user: UserData, targetedUserId?: string, targetEmail?: string) => {
    const email = targetEmail || user.email;
    const userId = targetedUserId || '';
    setSetPasswordModal({
      isOpen: true,
      profileId: user.id,
      profileName: `${user.first_name} ${user.last_name}`,
      userId,
      email,
      password: '',
      showPassword: false,
      submitting: false,
      copied: false,
    });
  };

  const handleConfirmSetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !setPasswordModal.profileId || !setPasswordModal.password) return;

    const rules = getPasswordRules(setPasswordModal.password);
    if (!rules.minLength || !rules.hasUpper || !rules.hasLower || !rules.hasDigit || !rules.hasSpecial) {
      showNotification('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.', 'error');
      return;
    }

    setSetPasswordModal(prev => ({ ...prev, submitting: true }));
    try {
      const response = await fetch(`${API_URL}/users/${setPasswordModal.profileId}/set-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: setPasswordModal.userId || undefined,
          password: setPasswordModal.password,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Erreur lors de la définition du mot de passe.');
      }

      const data = await response.json();
      showNotification(data.message || 'Mot de passe défini avec succès.');
      setSetPasswordModal(prev => ({ ...prev, isOpen: false, password: '' }));
      await fetchUsers();
    } catch (err: any) {
      console.error(err);
      showNotification(err.message, 'error');
    } finally {
      setSetPasswordModal(prev => ({ ...prev, submitting: false }));
    }
  };

  // MIGRÉ
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser || !token) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur de mise à jour');
      }

      const result = await response.json();
      showNotification(result.message);
      cancelEdit();
      fetchUsers();
      fetchAllUserAssociations();
    } catch (err: any) {
      console.error('Erreur de mise à jour:', err);
      showNotification(err.message, 'error');
    }
    setSubmitting(false);
  };

  // Supprimer un utilisateur
  const confirmDelete = (user: UserData) => {
    setDeleteConfirmation({
      isOpen: true,
      user: user,
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirmation.user || !token) return;

    try {
      const response = await fetch(`${API_URL}/users/${deleteConfirmation.user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur de suppression');
      }

      const result = await response.json();
      showNotification(result.message);
      fetchUsers(); // Re-fetch the list
      setDeleteConfirmation({ isOpen: false, user: null });
    } catch (err: any) {
      console.error('Erreur de suppression:', err);
      showNotification(err.message, 'error');
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, user: null });
  };

  // Préparer l'édition
  const handleEdit = (user: UserData) => {
    const userInsts = userInstruments[user.id] || [];
    const userOrcs = userOrchestras[user.id] || [];
    setEditingUser(user);
    setSecondaryEmails([]);
    setShowPasswordInForm(false);
    setFormData({
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      password: '',
      role: user.role,
      instruments: userInsts.map(inst => inst.id),
      orchestras: userOrcs.map(orc => orc.id),
      managedModules: user.managed_modules || [],
      status: user.status || 'Inactive',
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setShowAddForm(false);
    setSecondaryEmails([]);
    setShowPasswordInForm(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'Membre',
      instruments: [],
      orchestras: [],
      managedModules: [],
      status: 'Inactive',
    });
  };

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'Admin': return { bg: 'bg-gradient-to-r from-rose-50 to-white', text: 'text-rose-900', icon: 'text-rose-600', iconBg: 'bg-rose-100', badge: 'bg-white/50 border-rose-100 text-rose-600', itemBorder: 'border-l-rose-500', badgeSimple: 'bg-rose-100 text-rose-800' };
      case 'Gestionnaire': return { bg: 'bg-gradient-to-r from-indigo-50 to-white', text: 'text-indigo-900', icon: 'text-indigo-600', iconBg: 'bg-indigo-100', badge: 'bg-white/50 border-indigo-100 text-indigo-600', itemBorder: 'border-l-indigo-500', badgeSimple: 'bg-indigo-100 text-indigo-800' };
      default: return { bg: 'bg-gradient-to-r from-slate-50 to-white', text: 'text-slate-900', icon: 'text-slate-600', iconBg: 'bg-slate-100', badge: 'bg-white/50 border-slate-100 text-slate-600', itemBorder: 'border-l-slate-500', badgeSimple: 'bg-slate-100 text-slate-800' };
    }
  };

  const getStatusBadge = (user: UserData) => {
    if (currentUser?.id === user.id) {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                <span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span> Actif (Moi)
            </span>
        );
    }

    const { status, role } = user;
    const isAdmin = role === 'Admin';

    switch (status) {
      case 'Active':
        return (
          <button 
            onClick={() => handleToggleStatus(user)}
            title="Désactiver le compte"
            className="group inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 hover:bg-red-100 hover:text-red-800 transition-colors"
          >
            <Power className="w-3 h-3 mr-1 text-green-500 group-hover:text-red-500 transition-colors" /> Actif
          </button>
        );
      case 'Invited': {
        let badgeLabel = 'Invité';
        if (user.emails && user.emails.length > 1) {
          const invitedCount = user.emails.filter(e => e.isInvited || e.isActive).length;
          badgeLabel = `Invité (${invitedCount}/${user.emails.length})`;
        }
        return (
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => handleToggleStatus(user)}
              title="Retourner en Inactif"
              className="group inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-red-100 hover:text-red-800 transition-colors"
            >
              <span className="w-2 h-2 mr-1 bg-yellow-500 rounded-full group-hover:bg-red-500 transition-colors"></span> {badgeLabel}
            </button>
          </div>
        );
      }
      default:
        // Pour les Admins, on peut activer direct car pas de mail
        if (isAdmin) {
          return (
            <button 
              onClick={() => handleToggleStatus(user)}
              title="Activer le compte Admin"
              className="group inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 hover:bg-green-100 hover:text-green-800 transition-colors"
            >
              <Power className="w-3 h-3 mr-1 text-red-500 group-hover:text-green-500 transition-colors" /> Inactif
            </button>
          );
        }
        // Pour les autres, activation manuelle autorisée SI a un mot de passe (Option 1)
        if (user.has_password) {
          return (
            <button 
              onClick={() => handleToggleStatus(user)}
              title="Réactiver le compte"
              className="group inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 hover:bg-green-100 hover:text-green-800 transition-colors"
            >
              <Power className="w-3 h-3 mr-1 text-red-500 group-hover:text-green-500 transition-colors" /> Inactif
            </button>
          );
        }
        
        return (
          <span 
            title="Activation par mail requise"
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
          >
            <Power className="w-3 h-3 mr-1" /> Inactif
          </span>
        );
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin': return Shield;
      case 'Gestionnaire': return User;
      default: return Users;
    }
  };

  // Normalisation du texte pour recherche insensible aux accents et à la casse
  const normalizeSearchText = (str: string = '') =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  // Filtrer les utilisateurs selon le terme de recherche
  const searchTerms = normalizeSearchText(searchTerm).split(/\s+/).filter(Boolean);

  const filteredUsers = users.filter(user => {
    // Tous les e-mails associés (principal et secondaires)
    const userEmails = (user.emails || []).map(e => e.email).join(' ');
    // Profils partagés associés
    const userAlsoUsedBy = (user.emails || []).flatMap(e => e.alsoUsedBy || []).join(' ');
    // Instruments et orchestres
    const instruments = (userInstruments[user.id] || []).map(i => i.name).join(' ');
    const orchestras = (userOrchestras[user.id] || []).map(o => o.name).join(' ');

    const searchableText = normalizeSearchText(`
      ${user.first_name || ''} 
      ${user.last_name || ''} 
      ${user.first_name || ''} ${user.last_name || ''} 
      ${user.last_name || ''} ${user.first_name || ''} 
      ${user.email || ''} 
      ${userEmails} 
      ${userAlsoUsedBy} 
      ${user.role || ''} 
      ${instruments} 
      ${orchestras}
    `);

    // Tous les mots saisis dans la barre de recherche doivent être présents
    const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => searchableText.includes(term));

    const matchesRole = roleFilter.includes(user.role);
    const userStatus = user.status || 'Inactive';
    const matchesStatus = statusFilter.includes(userStatus);

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (currentUser && currentUser.role !== 'Admin' && (!currentUser.managedModules || !currentUser.managedModules.includes('users'))) {
    return <Navigate to="/dashboard" />;
  }

  const toggleRoleFilter = (role: string) => {
    setRoleFilter(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const selectAllRoles = () => {
    setRoleFilter(['Admin', 'Gestionnaire', 'Membre']);
  };

  const clearAllRoles = () => {
    setRoleFilter([]);
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const selectAllStatuses = () => {
    setStatusFilter(['Active', 'Invited', 'Inactive']);
  };

  const clearAllStatuses = () => {
    setStatusFilter([]);
  };

  const toggleRoleExpansion = (role: string) => {
    setExpandedRoles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(role)) {
        newSet.delete(role);
      } else {
        newSet.add(role);
      }
      return newSet;
    });
  };

  const expandAllRoles = () => {
    setExpandedRoles(new Set(['Admin', 'Gestionnaire', 'Membre']));
  };

  const collapseAllRoles = () => {
    setExpandedRoles(new Set());
  };

  const usersByRole = filteredUsers
    .sort((a, b) => {
      const lastNameCompare = (a.last_name || '').localeCompare(b.last_name || '');
      if (lastNameCompare !== 0) return lastNameCompare;
      return (a.first_name || '').localeCompare(b.first_name || '');
    })
    .reduce((acc, user) => {
      if (!acc[user.role]) {
        acc[user.role] = [];
      }
      acc[user.role].push(user);
      return acc;
    }, {} as Record<string, UserData[]>);

  return (
    <div className="pt-8 lg:pt-12 pb-20 min-h-screen bg-gray-100">
      <div className="w-full px-4 sm:px-10 lg:px-16">

        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="text-slate-400 hover:text-indigo-600 transition flex items-center mb-2 group">
            <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Retour au tableau de bord
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-sm border border-indigo-50 flex-shrink-0">
                <Users size={28} />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800">
                Gestion des Utilisateurs
              </h1>
            </div>
            <button onClick={() => { setEditingUser(null); setShowAddForm(true); }} className="flex items-center px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 mt-4 md:mt-0">
              <UserPlus className="mr-2 h-5 w-5" />
              Ajouter un utilisateur
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          {/* Row 1: Search Bar */}
          <div>
            <label htmlFor="search" className="block text-sm font-semibold text-slate-700 mb-2">Rechercher un membre</label>
            <div className="relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="search"
                placeholder="Rechercher par nom, email, rôle, instrument ou orchestre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>

          {/* Row 2: Filters (Roles, Status, Expand/Collapse) */}
          <div className="flex flex-col lg:flex-row gap-6 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-indigo-500" /> Filtrer par rôle
              </label>
              <div className="flex flex-wrap gap-2">
                <button onClick={selectAllRoles} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${roleFilter.length === 3 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Tous</button>
                {['Admin', 'Gestionnaire', 'Membre'].map(role => (
                  <button key={role} onClick={() => toggleRoleFilter(role)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${roleFilter.includes(role) ? 'bg-indigo-500 text-white shadow-md shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {role}
                  </button>
                ))}
                <button onClick={clearAllRoles} className="px-4 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-400 hover:bg-slate-200 transition-all italic">Aucun</button>
              </div>
            </div>
            <div className="lg:border-l lg:pl-6 border-slate-100">
              <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-amber-500" /> Filtrer par statut
              </label>
              <div className="flex flex-wrap gap-2">
                <button onClick={selectAllStatuses} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${statusFilter.length === 3 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Tous</button>
                {[
                  { id: 'Active', label: 'Actif' },
                  { id: 'Invited', label: 'Invité' },
                  { id: 'Inactive', label: 'Inactif' }
                ].map(status => (
                  <button key={status.id} onClick={() => toggleStatusFilter(status.id)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${statusFilter.includes(status.id) ? 'bg-amber-500 text-white shadow-md shadow-amber-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {status.label}
                  </button>
                ))}
                <button onClick={clearAllStatuses} className="px-4 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-400 hover:bg-slate-200 transition-all italic">Aucun</button>
              </div>
            </div>
            
            <div className="lg:border-l lg:pl-6 border-slate-100 flex items-end lg:ml-auto pt-4 lg:pt-0 pb-0.5">
              <div className="flex items-center space-x-2">
                <button onClick={expandAllRoles} className={`px-4 py-2 rounded-xl transition text-sm font-medium whitespace-nowrap ${expandedRoles.size === 3 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Tout déplier</button>
                <button onClick={collapseAllRoles} className={`px-4 py-2 rounded-xl transition text-sm font-medium whitespace-nowrap ${expandedRoles.size === 0 ? 'bg-slate-600 text-white shadow-md shadow-slate-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Tout replier</button>
              </div>
            </div>
          </div>
        </div>

        {/* User List */}
        {loading ? (
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Chargement des utilisateurs...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(usersByRole).map(([role, userList]) => {
              const style = getRoleStyle(role);
              return (
              <div key={role} className="bg-white rounded-2xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
                <div onClick={() => toggleRoleExpansion(role)} className={`p-4 flex justify-between items-center cursor-pointer ${style.bg} hover:opacity-90 transition-all ${expandedRoles.has(role) ? 'rounded-t-2xl' : 'rounded-2xl'}`}>
                  <div className="flex items-center">
                    <div className={`p-2 ${style.iconBg} rounded-xl ${style.icon} mr-4 shadow-sm`}>
                      {React.createElement(getRoleIcon(role), { size: 20 })}
                    </div>
                    <div className="flex items-center">
                      <h2 className={`text-lg font-bold ${style.text}`}>{role}s</h2>
                      <span className={`ml-3 px-2.5 py-0.5 rounded-full border text-xs font-bold ${style.badge}`}>
                        {userList.length}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="text-slate-400" />
                </div>
                {expandedRoles.has(role) && (
                  <div className="divide-y divide-slate-100">
                    {userList.map((user, userIdx) => (
                      <div key={user.id} className={`p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start md:items-center hover:bg-slate-50/50 transition-colors duration-200 ${userIdx === userList.length - 1 ? 'rounded-b-2xl' : ''}`}>
                        <div className="md:col-span-6">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <p className="font-bold text-lg text-slate-800 uppercase leading-tight mr-1">{user.last_name} {user.first_name}</p>
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${style.badgeSimple}`}>{user.role}</span>
                            <div>
                              {getStatusBadge(user)}
                            </div>
                            {user.emails && user.emails.length > 1 && (
                              <span 
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-sm"
                                title={user.emails.map(e => e.email).join(', ')}
                              >
                                <Mail size={12} className="text-cyan-500" />
                                Multi-accès ({user.emails.length})
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col space-y-1">
                            {user.emails && user.emails.length > 0 ? (
                              <div className="space-y-1.5 my-1">
                                {user.emails.map(em => (
                                  <div key={em.userId} className="flex flex-wrap items-center text-xs text-slate-600 gap-2 px-2.5 py-1 rounded-xl border max-w-fit bg-slate-50/80 border-slate-100">
                                    <Mail size={12} className={em.isPrimary ? "text-indigo-500" : "text-cyan-500"} />
                                    <span className="font-semibold text-slate-700">{em.email}</span>
                                    {em.isPrimary ? (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1">
                                        <Star size={10} className="fill-indigo-600 text-indigo-600" />
                                        Principal
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleSetPrimaryEmail(user.id, em.userId, em.email)}
                                        title={`Cliquer pour définir ${em.email} comme adresse principale`}
                                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700 hover:bg-cyan-200 hover:text-cyan-900 transition-colors flex items-center gap-1 cursor-pointer group/sec"
                                      >
                                        <ArrowUpDown size={10} className="group-hover/sec:scale-125 transition-transform" />
                                        Secondaire
                                      </button>
                                    )}
                                    {em.alsoUsedBy && em.alsoUsedBy.length > 0 && (
                                      <div className="relative group/shared inline-flex items-center">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/90 shadow-xs cursor-pointer select-none hover:bg-amber-100 transition-colors">
                                          <Users size={11} className="text-amber-600 flex-shrink-0" />
                                          Partagé
                                        </span>
                                        {/* Tooltip au survol */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/shared:flex flex-col z-50 min-w-[190px] max-w-xs p-2.5 bg-slate-900/95 backdrop-blur-md text-white rounded-xl shadow-xl border border-slate-700/60 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95">
                                          <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px] pb-1.5 mb-1.5 border-b border-slate-800">
                                            <Users size={12} className="text-amber-400" />
                                            <span>Donne aussi accès à :</span>
                                          </div>
                                          <div className="space-y-1">
                                            {em.alsoUsedBy.map((name, idx) => (
                                              <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-100 font-medium">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"></span>
                                                <span className="truncate">{name}</span>
                                              </div>
                                            ))}
                                          </div>
                                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95"></div>
                                        </div>
                                      </div>
                                    )}
                                    {em.isActive ? (
                                      <span className="text-[10px] font-bold bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        Actif
                                      </span>
                                    ) : em.isInvited ? (
                                      <span className="text-[10px] font-bold bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                        Invité
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                        Inactif
                                      </span>
                                    )}
                                    {user.role !== 'Admin' && (
                                      <button
                                        onClick={() => handleInvite(user.id, em.userId)}
                                        title={
                                          em.isActive
                                            ? `Envoyer un lien de réinitialisation à ${em.email}`
                                            : em.isInvited
                                              ? `Renvoyer l'invitation d'activation à ${em.email}`
                                              : `Envoyer l'invitation d'activation à ${em.email}`
                                        }
                                        className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <Mail size={12} />
                                      </button>
                                    )}
                                    {currentUser?.role === 'Admin' && (
                                      <button
                                        onClick={() => handleOpenSetPasswordModal(user, em.userId, em.email)}
                                        title={`Définir ou forcer le mot de passe pour ${em.email}`}
                                        className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <KeyRound size={12} />
                                      </button>
                                    )}
                                    {!em.isPrimary && (
                                      <button
                                        onClick={() => handlePromptRemoveEmail(user.id, em.userId, em.email)}
                                        title={`Dissocier l'email ${em.email}`}
                                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <X size={12} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center text-gray-600 text-sm">
                                <Mail size={14} className="mr-2 text-indigo-400" /> {user.email}
                              </div>
                            )}
                            <div className="flex items-center text-[10px] font-bold uppercase tracking-wider">
                              {user.last_login ? (
                                <>
                                  <CheckCircle size={10} className="mr-1.5 text-teal-500" />
                                  <span className="text-slate-500">Dernière connexion : {new Date(user.last_login).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} à {new Date(user.last_login).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-2 h-2 rounded-full bg-slate-200 mr-2"></div>
                                  <span className="text-slate-400">Aucune connexion enregistrée</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="md:col-span-2 text-sm">
                          <h4 className="font-black text-[10px] uppercase tracking-widest text-indigo-400/70 mb-2">Orchestres</h4>
                          {userOrchestras[user.id] && userOrchestras[user.id].length > 0 ? (
                            <ul className="space-y-1 text-slate-700">
                              {userOrchestras[user.id].map(orc => (
                                <li key={orc.id} className="flex items-center truncate" title={orc.name}>
                                  <div className="w-1 h-1 rounded-full bg-indigo-400 mr-2 flex-shrink-0"></div>
                                  <span className="truncate">{orc.name}</span>
                                </li>
                              ))}
                            </ul>
                          ) : <p className="text-gray-400 italic text-xs">Aucun</p>}
                        </div>

                        <div className="md:col-span-2 text-sm">
                          <h4 className="font-black text-[10px] uppercase tracking-widest text-teal-400/70 mb-2">Instruments</h4>
                          {userInstruments[user.id] && userInstruments[user.id].length > 0 ? (
                            <ul className="space-y-1 text-slate-700">
                              {userInstruments[user.id].map(inst => (
                                <li key={inst.id} className="flex items-center truncate" title={inst.name}>
                                  <div className="w-1 h-1 rounded-full bg-teal-400 mr-2 flex-shrink-0"></div>
                                  <span className="truncate">{inst.name}</span>
                                </li>
                              ))}
                            </ul>
                          ) : <p className="text-gray-400 italic text-xs">Aucun</p>}
                        </div>

                        <div className="md:col-span-2 flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleOpenAddEmail(user)} 
                            title="Ajouter un autre e-mail" 
                            className="p-2 text-cyan-600 bg-cyan-50 hover:bg-cyan-100 rounded-xl transition-all duration-300 hover:scale-110 cursor-pointer"
                          >
                            <MailPlus size={18} />
                          </button>
                          {user.role !== 'Admin' && (
                            <button 
                              onClick={() => handleInvite(user.id)} 
                              title={
                                user.emails && user.emails.length > 1
                                  ? `Envoyer l'invitation à toutes les adresses associées (${user.emails.length} adresses)`
                                  : user.status === 'Active' 
                                    ? "Envoyer un lien de réinitialisation" 
                                    : "Envoyer invitation d'activation"
                              } 
                              className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 cursor-pointer ${
                                user.status === 'Active' 
                                  ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' 
                                  : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                              }`}
                            >
                              <Mail size={18} />
                            </button>
                          )}
                          {currentUser?.role === 'Admin' && (
                            <button 
                              onClick={() => handleOpenSetPasswordModal(user)} 
                              title={user.has_password || user.status === 'Active' ? "Définir / forcer le mot de passe" : "Définir un mot de passe (activer directement)"} 
                              className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all duration-300 hover:scale-110 cursor-pointer"
                            >
                              <KeyRound size={18} />
                            </button>
                          )}
                          <button onClick={() => handleEdit(user)} title="Modifier" className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-300 hover:scale-110"><Edit size={18} /></button>
                          {currentUser?.id !== user.id && (
                            <button onClick={() => confirmDelete(user)} title="Supprimer" className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-300 hover:scale-110"><Trash2 size={18} /></button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex justify-center items-start p-4 pt-24">
            <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border border-white max-h-[calc(100vh-120px)] animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center p-5 bg-white border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                        {editingUser ? <Edit size={20} /> : <UserPlus size={20} />}
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                        {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                    </h2>
                </div>
                <button onClick={cancelEdit} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                </button>
              </div>
              <form onSubmit={editingUser ? handleUpdate : handleCreate} className="flex-grow overflow-y-auto p-5 space-y-6 bg-gradient-to-b from-slate-50 to-white">
                {/* Section: Informations personnelles */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                        <User size={16} />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Informations personnelles</h3>
                    </div>
                    
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center text-sm font-semibold text-slate-700 mb-1">
                                    <User size={14} className="mr-2 text-slate-400" /> Prénom *
                                </label>
                                <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Prénom" required className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white text-sm" />
                            </div>
                            <div>
                                <label className="flex items-center text-sm font-semibold text-slate-700 mb-1">
                                    <User size={14} className="mr-2 text-slate-400" /> Nom *
                                </label>
                                <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Nom" required className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center text-sm font-semibold text-slate-700 mb-1">
                                <Mail size={14} className="mr-2 text-slate-400" /> Adresse Email {!editingUser ? 'principale *' : '*'}
                            </label>
                            <EmailAutocompleteInput
                              name="email"
                              value={formData.email}
                              onChange={(val) => setFormData(prev => ({ ...prev, email: val }))}
                              users={users}
                              excludeEmails={secondaryEmails}
                              placeholder="Tapez un nom de membre ou ex: jean.dupont@gmail.com"
                              required
                              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white text-sm"
                            />
                        </div>

                        {!editingUser && (
                          <div className="pt-3 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-600">
                                <Mail size={13} className="mr-1.5 text-cyan-500" />
                                Adresse e-mail supplémentaire
                              </label>
                              <button
                                type="button"
                                onClick={() => setSecondaryEmails(prev => [...prev, ''])}
                                className="text-xs font-bold text-cyan-600 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Plus size={13} />
                                + Ajouter un autre e-mail
                              </button>
                            </div>

                            {secondaryEmails.length > 0 && (
                              <div className="space-y-2">
                                {secondaryEmails.map((secEmail, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <div className="flex-1">
                                      <EmailAutocompleteInput
                                        value={secEmail}
                                        onChange={(val) => {
                                          setSecondaryEmails(prev => prev.map((item, i) => i === idx ? val : item));
                                        }}
                                        users={users}
                                        excludeEmails={[
                                          formData.email,
                                          ...secondaryEmails.filter((_, i) => i !== idx)
                                        ]}
                                        placeholder="Tapez un nom de membre ou une adresse e-mail..."
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white text-sm"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setSecondaryEmails(prev => prev.filter((_, i) => i !== idx))}
                                      title="Supprimer cette adresse"
                                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                </div>

                {/* Section Multi-accès / Comptes partagés (si mode édition) */}
                {editingUser && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-indigo-600 mb-1">
                      <div className="flex items-center space-x-2">
                        <Mail size={16} />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Accès & Adresses e-mail</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenAddEmail(editingUser)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus size={14} />
                        Ajouter un autre e-mail
                      </button>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                      {editingUser.emails && editingUser.emails.length > 0 ? (
                        <div className="space-y-2">
                          {editingUser.emails.map((em) => (
                            <div key={em.userId} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border gap-2 border-slate-100 bg-slate-50/50">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  em.isPrimary ? 'bg-indigo-100 text-indigo-600' : 'bg-cyan-100 text-cyan-600'
                                }`}>
                                  <Mail size={16} />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-sm text-slate-800 break-all">{em.email}</span>
                                     {em.isPrimary ? (
                                       <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1">
                                         <Star size={10} className="fill-indigo-600 text-indigo-600" />
                                         Principal
                                       </span>
                                     ) : (
                                       <button
                                         type="button"
                                         onClick={() => handleSetPrimaryEmail(editingUser.id, em.userId, em.email)}
                                         title={`Cliquer pour définir ${em.email} comme adresse principale`}
                                         className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 hover:bg-cyan-200 hover:text-cyan-900 transition-colors flex items-center gap-1 cursor-pointer group/sec"
                                       >
                                         <ArrowUpDown size={10} className="group-hover/sec:scale-125 transition-transform" />
                                         Secondaire
                                       </button>
                                     )}
                                    {em.alsoUsedBy && em.alsoUsedBy.length > 0 && (
                                      <div className="relative group/shared inline-flex items-center">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/90 shadow-xs cursor-pointer select-none hover:bg-amber-100 transition-colors">
                                          <Users size={11} className="text-amber-600 flex-shrink-0" />
                                          Partagé
                                        </span>
                                        {/* Tooltip au survol */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/shared:flex flex-col z-50 min-w-[190px] max-w-xs p-2.5 bg-slate-900/95 backdrop-blur-md text-white rounded-xl shadow-xl border border-slate-700/60 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95">
                                          <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px] pb-1.5 mb-1.5 border-b border-slate-800">
                                            <Users size={12} className="text-amber-400" />
                                            <span>Donne aussi accès à :</span>
                                          </div>
                                          <div className="space-y-1">
                                            {em.alsoUsedBy.map((name, idx) => (
                                              <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-100 font-medium">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"></span>
                                                <span className="truncate">{name}</span>
                                              </div>
                                            ))}
                                          </div>
                                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95"></div>
                                        </div>
                                      </div>
                                    )}
                                    {em.isActive ? (
                                      <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        Actif
                                      </span>
                                    ) : em.isInvited ? (
                                      <span className="text-[10px] font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                        Invité
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                        Inactif
                                      </span>
                                    )}
                                  </div>
                                  {em.lastLogin && (
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                      Dernière connexion : {new Date(em.lastLogin).toLocaleDateString('fr-FR')}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-center">
                                  {!em.isPrimary && (
                                    <button
                                      type="button"
                                      onClick={() => handleSetPrimaryEmail(editingUser.id, em.userId, em.email)}
                                      title={`Passer ${em.email} en adresse principale`}
                                      className="h-8 px-3 text-xs font-semibold text-cyan-700 hover:text-cyan-900 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 hover:border-cyan-300 rounded-lg shadow-sm transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                                    >
                                      <ArrowUpDown size={13} className="text-cyan-600" />
                                      Passer en principale
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleInvite(editingUser.id, em.userId)}
                                    title={
                                      em.isActive 
                                        ? `Envoyer un lien de réinitialisation à ${em.email}` 
                                        : em.isInvited 
                                          ? `Renvoyer l'invitation à ${em.email}` 
                                          : `Envoyer l'invitation à ${em.email}`
                                    }
                                    className="h-8 px-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-lg shadow-sm transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                                  >
                                    <Mail size={13} />
                                    {em.isActive ? 'Réinitialiser' : em.isInvited ? 'Relancer' : 'Inviter'}
                                  </button>
                                  {currentUser?.role === 'Admin' && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenSetPasswordModal(editingUser, em.userId, em.email)}
                                      title={`Définir ou modifier directement le mot de passe pour ${em.email}`}
                                      className="h-8 px-3 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-lg shadow-sm transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                                    >
                                      <KeyRound size={13} className="text-amber-500" />
                                      Mot de passe
                                    </button>
                                  )}
                                  {!em.isPrimary && (
                                    <button
                                      type="button"
                                      onClick={() => handlePromptRemoveEmail(editingUser.id, em.userId, em.email)}
                                      title="Dissocier cet e-mail"
                                      className="h-8 w-8 inline-flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-100"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Aucun e-mail supplémentaire associé.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Section: Rôle & Permissions */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                        <Shield size={16} />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Rôle & Permissions</h3>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center text-sm font-semibold text-slate-700 mb-1">
                                    <LayoutGrid size={14} className="mr-2 text-slate-400" /> Rôle
                                </label>
                                <div className="relative">
                                    <select name="role" value={formData.role} onChange={handleInputChange} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white appearance-none text-sm">
                                        <option value="Membre">👤 Membre</option>
                                        <option value="Gestionnaire">🛠️ Gestionnaire</option>
                                        <option value="Admin">⚡ Admin</option>
                                    </select>
                                    <ChevronDown className="text-slate-400" />
                                </div>
                            </div>
                            {currentUser?.role === 'Admin' && (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="flex items-center text-sm font-semibold text-slate-700">
                                            <KeyRound size={14} className="mr-2 text-slate-400" /> Mot de passe
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const gen = generateSecurePassword();
                                                setFormData(prev => ({ ...prev, password: gen }));
                                                setShowPasswordInForm(true);
                                            }}
                                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                            title="Générer un mot de passe sécurisé"
                                        >
                                            <Sparkles size={11} />
                                            Générer
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPasswordInForm ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder={editingUser ? "Laisser vide pour ne pas changer" : "Laisser vide pour inviter"}
                                            className="w-full pl-4 pr-10 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswordInForm(!showPasswordInForm)}
                                            className="p-1 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer absolute right-3 top-1/2 -translate-y-1/2"
                                        >
                                            {showPasswordInForm ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {formData.role === 'Gestionnaire' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                                    <CheckCircle size={14} className="mr-2 text-slate-400" /> Modules gérés
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                                    {availableModules.map(module => (
                                        <label key={module.id} className="flex items-center space-x-2 cursor-pointer group p-1">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.managedModules.includes(module.id)} 
                                                onChange={(e) => handleModuleChange(module.id, e.target.checked)} 
                                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer" 
                                            />
                                            <span className="text-slate-600 text-xs group-hover:text-indigo-600 transition-colors">{module.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section: Orchestres & Instruments */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                        <Users size={16} />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Orchestres & Instruments</h3>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                                    <Users size={14} className="mr-2 text-slate-400" /> Orchestres
                                </label>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50/50 rounded-xl border border-slate-100 shadow-inner">
                                    {orchestras.map(orchestra => (
                                        <label key={orchestra.id} className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm cursor-pointer group hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.orchestras.includes(orchestra.id)} 
                                                onChange={(e) => handleOrchestraChange(orchestra.id, e.target.checked)} 
                                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600" 
                                            />
                                            <span className="text-xs font-medium text-slate-600 group-hover:text-indigo-700">{orchestra.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                                    <Music size={14} className="mr-2 text-slate-400" /> Instruments
                                </label>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50/50 rounded-xl border border-slate-100 shadow-inner">
                                    {instruments.map(instrument => (
                                        <label key={instrument.id} className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm cursor-pointer group hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.instruments.includes(instrument.id)} 
                                                onChange={(e) => handleInstrumentChange(instrument.id, e.target.checked)} 
                                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600" 
                                            />
                                            <span className="text-xs font-medium text-slate-600 group-hover:text-emerald-700">{instrument.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end p-5 bg-white border-t border-slate-100 gap-3 flex-shrink-0">
                  <button type="button" onClick={cancelEdit} className="px-5 py-2.5 text-slate-500 hover:text-slate-700 font-bold transition hover:bg-slate-50 rounded-xl text-sm">
                    Annuler
                  </button>
                  <button type="submit" disabled={submitting} className="px-8 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold transition shadow-lg shadow-indigo-200 flex items-center justify-center text-sm">
                    {submitting ? (
                        <>
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
                            Validation...
                        </>
                    ) : (editingUser ? 'Mettre à jour' : 'Créer l\'utilisateur')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full border border-slate-100">
              <div className="flex items-center gap-3 text-rose-600 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Confirmer la suppression</h3>
                  <p className="text-xs text-slate-500">Action irréversible</p>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-6">
                Êtes-vous sûr de vouloir supprimer le profil de <strong className="text-slate-800">{deleteConfirmation.user?.first_name} {deleteConfirmation.user?.last_name}</strong> ? Cette action est irréversible.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelDelete}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-200 transition cursor-pointer"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Secondary Email Confirmation Modal */}
        {removeEmailConfirmation.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full border border-slate-100">
              <div className="flex items-center gap-3 text-rose-600 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Dissocier l'adresse e-mail</h3>
                  <p className="text-xs text-slate-500">Accès supplémentaire</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-6">
                Êtes-vous sûr de vouloir dissocier l'adresse email <strong className="text-slate-800">{removeEmailConfirmation.email}</strong> de ce profil ?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRemoveEmailConfirmation({ isOpen: false, profileId: '', userId: '', email: '', submitting: false })}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemoveEmail}
                  disabled={removeEmailConfirmation.submitting}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-200 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {removeEmailConfirmation.submitting ? 'Dissociation...' : 'Dissocier l\'adresse'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Secondary Email Modal */}
        {addEmailModal.isOpen && addEmailModal.profile && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-lg w-full border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 text-cyan-600">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Ajouter un autre e-mail</h3>
                    <p className="text-xs text-slate-500">Pour {addEmailModal.profile.first_name} {addEmailModal.profile.last_name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAddEmailModal({ isOpen: false, profile: null, email: '', submitting: false })}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitAddEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Adresse e-mail supplémentaire *
                  </label>
                  <EmailAutocompleteInput
                    value={addEmailModal.email}
                    onChange={(val) => setAddEmailModal(prev => ({ ...prev, email: val }))}
                    users={users}
                    excludeEmails={
                      addEmailModal.profile?.emails?.map(e => e.email) ||
                      (addEmailModal.profile?.email ? [addEmailModal.profile.email] : [])
                    }
                    placeholder="Tapez un nom de membre ou une adresse e-mail..."
                    required
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition text-sm bg-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAddEmailModal({ isOpen: false, profile: null, email: '', submitting: false })}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={addEmailModal.submitting}
                    className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-lg shadow-cyan-200 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {addEmailModal.submitting ? 'Enregistrement...' : 'Associer cet e-mail'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quick Set Password Modal */}
        {setPasswordModal.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full border border-slate-100">
              <div className="flex items-center gap-3 text-amber-600 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <KeyRound size={24} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">Définir le mot de passe</h3>
                  <p className="text-xs text-slate-500 font-medium">{setPasswordModal.profileName}</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                Définir ou forcer un mot de passe pour <span className="font-semibold text-slate-800">{setPasswordModal.email}</span>. Le compte passera immédiatement au statut <span className="font-bold text-green-700">Actif</span>.
              </p>

              <form onSubmit={handleConfirmSetPassword} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Nouveau mot de passe *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const gen = generateSecurePassword();
                        setSetPasswordModal(prev => ({ ...prev, password: gen, showPassword: true }));
                      }}
                      className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-100/80 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles size={12} />
                      Générer
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={setPasswordModal.showPassword ? "text" : "password"}
                      value={setPasswordModal.password}
                      onChange={(e) => setSetPasswordModal(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Au moins 8 caractères..."
                      required
                      autoFocus
                      className="w-full pl-4 pr-20 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white text-sm"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {setPasswordModal.password && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(setPasswordModal.password);
                            setSetPasswordModal(prev => ({ ...prev, copied: true }));
                            setTimeout(() => setSetPasswordModal(prev => ({ ...prev, copied: false })), 2000);
                          }}
                          title="Copier le mot de passe"
                          className="p-1 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
                        >
                          {setPasswordModal.copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSetPasswordModal(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
                      >
                        {setPasswordModal.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {setPasswordModal.password && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 pt-2 text-[10px]">
                      {(() => {
                        const rules = getPasswordRules(setPasswordModal.password);
                        return (
                          <>
                            <span className={`px-1.5 py-0.5 rounded text-center font-medium ${rules.minLength ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                              {rules.minLength ? '✓' : '•'} 8+ car.
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-center font-medium ${rules.hasUpper ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                              {rules.hasUpper ? '✓' : '•'} Majuscule
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-center font-medium ${rules.hasLower ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                              {rules.hasLower ? '✓' : '•'} Minuscule
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-center font-medium ${rules.hasDigit ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                              {rules.hasDigit ? '✓' : '•'} Chiffre
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-center font-medium ${rules.hasSpecial ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                              {rules.hasSpecial ? '✓' : '•'} Spécial
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSetPasswordModal(prev => ({ ...prev, isOpen: false, password: '' }))}
                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={setPasswordModal.submitting || !setPasswordModal.password}
                    className="px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl transition shadow-lg shadow-amber-200 flex items-center gap-2 cursor-pointer"
                  >
                    {setPasswordModal.submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                        Enregistrement...
                      </>
                    ) : (
                      'Enregistrer et Activer'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification.show && (
          <div className={`fixed top-5 right-5 p-4 rounded-xl shadow-2xl text-white z-[100] transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            <div className="flex items-center space-x-3">
              {notification.type === 'success' ? <CheckCircle size={24} /> : <X size={24} />}
              <div className="font-semibold">{notification.message}</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminUsers;

