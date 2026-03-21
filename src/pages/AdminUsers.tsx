import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Users, Mail, User, Shield, X, UserPlus, CheckCircle, Search, ArrowLeft, ChevronRight, Power, Lock, Music, LayoutGrid } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

import { API_URL } from '../config';

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

const AdminUsers = () => {
  const { currentUser, token, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [orchestras, setOrchestras] = useState<Orchestra[]>([]);
  const [userInstruments, setUserInstruments] = useState<{ [key: string]: Instrument[] }>({});
  const [userOrchestras, setUserOrchestras] = useState<{ [key: string]: Orchestra[] }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string[]>(['Admin', 'Gestionnaire', 'Membre']);
  const [statusFilter, setStatusFilter] = useState<string[]>(['Active', 'Invited', 'Inactive']);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set(['Admin', 'Gestionnaire', 'Membre']));
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    isOpen: false,
    user: null,
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

  const availableModules = [
    { id: 'news', label: 'Actualités & Événements' },
    { id: 'orchestras', label: 'Orchestres' },
    { id: 'instruments', label: 'Instruments & Professeurs' },
    { id: 'media', label: 'Média & Photos' },
    { id: 'morceaux', label: 'Répertoire Musical' },
    { id: 'partners', label: 'Partenaires' },
    { id: 'theme', label: 'Configuration du thème' },
    { id: 'users', label: 'Utilisateurs' },
  ];

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

  const handleInvite = async (userId: string) => {
    console.log(`[Invitation] Triggered for user ${userId}`);
    if (!token) {
      console.error("[Invitation] Error: Token is missing!");
      showNotification("Erreur d'authentification : jeton manquant.", "error");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/${userId}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
        body: JSON.stringify(formData),
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
        body: JSON.stringify(formData),
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Gestionnaire': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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
      case 'Invited':
        return (
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => handleToggleStatus(user)}
              title="Retourner en Inactif"
              className="group inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-red-100 hover:text-red-800 transition-colors"
            >
              <span className="w-2 h-2 mr-1 bg-yellow-500 rounded-full group-hover:bg-red-500 transition-colors"></span> Invité
            </button>
          </div>
        );
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

  // Filtrer les utilisateurs selon le terme de recherche
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      user.first_name.toLowerCase().includes(searchLower) ||
      user.last_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower) ||
      (userInstruments[user.id] && userInstruments[user.id].some(inst =>
        inst.name.toLowerCase().includes(searchLower)
      )) ||
      (userOrchestras[user.id] && userOrchestras[user.id].some(orc =>
        orc.name.toLowerCase().includes(searchLower)
      ))
    );

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
      const lastNameCompare = a.last_name.localeCompare(b.last_name);
      if (lastNameCompare !== 0) return lastNameCompare;
      return a.first_name.localeCompare(b.first_name);
    })
    .reduce((acc, user) => {
      if (!acc[user.role]) {
        acc[user.role] = [];
      }
      acc[user.role].push(user);
      return acc;
    }, {} as Record<string, UserData[]>);

  return (
    <div className="font-inter pt-8 lg:pt-12 pb-20 min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="text-slate-400 hover:text-indigo-600 transition flex items-center mb-2 group">
            <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Retour au tableau de bord
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 className="text-3xl font-bold text-slate-800 font-poppins flex items-center">
              Gestion des Utilisateurs
            </h1>
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
                <button onClick={expandAllRoles} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-200 transition text-sm font-medium whitespace-nowrap">Tout déplier</button>
                <button onClick={collapseAllRoles} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-200 transition text-sm font-medium whitespace-nowrap">Tout replier</button>
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
            {Object.entries(usersByRole).map(([role, userList]) => (
              <div key={role} className="bg-white rounded-xl shadow-lg border border-gray-200/80 overflow-hidden">
                <div onClick={() => toggleRoleExpansion(role)} className={`p-5 flex justify-between items-center cursor-pointer border-b border-gray-200/80 transition-colors ${getRoleColor(role).replace('text-', 'bg-').replace('-800', '-200')} hover:bg-gray-100/50`}>
                  <div className="flex items-center">
                    {React.createElement(getRoleIcon(role), { className: `h-8 w-8 mr-4 ${getRoleColor(role).replace('bg-', 'text-').replace('-100', '-600')}` })}
                    <h2 className={`text-2xl font-bold ${getRoleColor(role).replace('bg-', 'text-').replace('-100', '-800')}`}>{role}s <span className="text-lg font-normal">({userList.length})</span></h2>
                  </div>
                  <ChevronRight className={`transform transition-transform duration-300 ${expandedRoles.has(role) ? 'rotate-90' : ''}`} />
                </div>
                {expandedRoles.has(role) && (
                  <div className="divide-y divide-gray-200/80">
                    {userList.map(user => (
                      <div key={user.id} className={`p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start md:items-center hover:bg-gray-50/50 transition-colors duration-200 border-l-4 ${getRoleColor(user.role).replace('bg', 'border').replace('-100', '-500')}`}>
                        <div className="md:col-span-6">
                          <div className="flex items-center mb-2">
                            <p className="font-bold text-lg text-gray-800">{user.last_name.toUpperCase()} {user.first_name}</p>
                            <span className={`ml-3 px-2.5 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>{user.role}</span>
                            <div className="ml-3">
                              {getStatusBadge(user)}
                            </div>
                          </div>
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center text-gray-600 text-sm">
                              <Mail size={14} className="mr-2 text-indigo-400" /> {user.email}
                            </div>
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

                        <div className="md:col-span-2 flex items-center justify-end space-x-3">
                          {user.role !== 'Admin' && (
                            <button 
                              onClick={() => handleInvite(user.id)} 
                              title={user.status === 'Active' ? "Envoyer un lien de réinitialisation" : "Envoyer invitation d'activation"} 
                              className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 ${
                                user.status === 'Active' 
                                  ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' 
                                  : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                              }`}
                            >
                              <Mail size={18} />
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
            ))}
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 flex justify-center items-start p-4 pt-24">
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
                                <Mail size={14} className="mr-2 text-slate-400" /> Adresse Email *
                            </label>
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" required className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white text-sm" />
                        </div>
                    </div>
                </div>

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
                                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={14} />
                                </div>
                            </div>
                            {formData.role === 'Admin' && (
                                <div>
                                    <label className="flex items-center text-sm font-semibold text-red-700 mb-1">
                                        <Lock size={14} className="mr-2 text-red-400" /> Mot de passe Admin
                                    </label>
                                    <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder={editingUser ? 'Laisser vide pour ne pas changer' : 'Requis pour Admin'} required={!editingUser && formData.role === 'Admin'} className="w-full px-4 py-2 rounded-xl border border-red-200 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition bg-red-50/30 focus:bg-white text-sm" />
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
          <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-8 m-4 max-w-md w-full">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Confirmer la suppression</h3>
              <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir supprimer l'utilisateur <span className="font-bold">{deleteConfirmation.user?.first_name} {deleteConfirmation.user?.last_name}</span> ? Cette action est irréversible.</p>
              <div className="flex justify-end space-x-4">
                <button onClick={cancelDelete} className="px-6 py-2 rounded-lg border hover:bg-gray-100">Annuler</button>
                <button onClick={handleDelete} className="bg-red-600 text-white px-6 py-2 rounded-lg shadow hover:bg-red-700">Supprimer</button>
              </div>
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
