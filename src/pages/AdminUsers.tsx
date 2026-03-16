import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Users, Mail, User, Shield, X, UserPlus, CheckCircle, Search, ArrowLeft, ChevronRight } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
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

  // MIGRÉ
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);

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
      fetchAllUserAssociations(); // Re-fetch associations
    } catch (err: any) {
      console.error('Erreur de création:', err);
      showNotification(err.message, 'error');
    }
    setLoading(false);
  };

  // MIGRÉ
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser || !token) return;
    setLoading(true);

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
      fetchAllUserAssociations(); // Re-fetch associations
    } catch (err: any) {
      console.error('Erreur de mise à jour:', err);
      showNotification(err.message, 'error');
    }
    setLoading(false);
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
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Gestionnaire': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Active':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"><span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span> Actif</span>;
      case 'Invited':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"><span className="w-2 h-2 mr-1 bg-yellow-500 rounded-full"></span> Invité</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><span className="w-2 h-2 mr-1 bg-red-500 rounded-full"></span> Inactif</span>;
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

    return matchesSearch && matchesRole;
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
    <div className="font-inter pt-20 lg:pt-40 pb-20 min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="text-slate-400 hover:text-indigo-600 transition flex items-center mb-2 group">
            <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Retour au tableau de bord
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 className="text-3xl font-bold text-slate-800 font-poppins flex items-center">
              <Users className="mr-3 h-8 w-8 text-indigo-600" />
              Gestion des Utilisateurs
            </h1>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <button onClick={() => { setEditingUser(null); setShowAddForm(true); }} className="flex items-center px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
                <UserPlus className="mr-2 h-5 w-5" />
                Ajouter un utilisateur
              </button>
              <button onClick={expandAllRoles} className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition">Tout déplier</button>
              <button onClick={collapseAllRoles} className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition">Tout replier</button>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Rechercher</label>
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="search"
                  placeholder="Rechercher par nom, email, rôle, instrument..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filtrer par rôle</label>
              <div className="flex space-x-2">
                <button onClick={selectAllRoles} className={`px-3 py-1 rounded-full text-sm ${roleFilter.length === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Tous</button>
                {['Admin', 'Gestionnaire', 'Membre'].map(role => (
                  <button key={role} onClick={() => toggleRoleFilter(role)} className={`px-3 py-1 rounded-full text-sm ${roleFilter.includes(role) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {role}
                  </button>
                ))}
                <button onClick={clearAllRoles} className="px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-700">Aucun</button>
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
                      <div key={user.id} className={`p-4 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-gray-50/50 transition-colors duration-200 border-l-4 ${getRoleColor(user.role).replace('bg', 'border').replace('-100', '-500')}`}>
                        <div className="flex-1 mb-4 md:mb-0">
                          <div className="flex items-center mb-2">
                            <p className="font-bold text-lg text-gray-800">{user.last_name.toUpperCase()} {user.first_name}</p>
                            <span className={`ml-3 px-2.5 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>{user.role}</span>
                            <div className="ml-3">
                              {getStatusBadge(user.status)}
                            </div>
                          </div>
                          <div className="flex items-center text-gray-500 text-sm">
                            <Mail size={14} className="mr-2" /> {user.email}
                          </div>
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4 md:mb-0">
                          <div>
                            <h4 className="font-semibold text-gray-600">Orchestres</h4>
                            {userOrchestras[user.id] && userOrchestras[user.id].length > 0 ? (
                              <ul className="list-disc list-inside text-gray-700">
                                {userOrchestras[user.id].map(orc => <li key={orc.id}>{orc.name}</li>)}
                              </ul>
                            ) : <p className="text-gray-400 italic">Aucun</p>}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-600">Instruments</h4>
                            {userInstruments[user.id] && userInstruments[user.id].length > 0 ? (
                              <ul className="list-disc list-inside text-gray-700">
                                {userInstruments[user.id].map(inst => <li key={inst.id}>{inst.name}</li>)}
                              </ul>
                            ) : <p className="text-gray-400 italic">Aucun</p>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 flex-shrink-0">
                          {user.role !== 'Admin' && (
                            <button onClick={() => handleInvite(user.id)} title="Envoyer invitation d'activation / Réinitialisation" className="p-2 text-indigo-600 bg-indigo-100 hover:bg-indigo-200 rounded-full transition-colors duration-200">
                              <Mail size={18} />
                            </button>
                          )}
                          <button onClick={() => handleEdit(user)} title="Modifier" className="p-2 text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors duration-200"><Edit size={18} /></button>
                          <button onClick={() => confirmDelete(user)} title="Supprimer" className="p-2 text-red-600 bg-red-100 hover:bg-red-200 rounded-full transition-colors duration-200"><Trash2 size={18} /></button>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-5 border-b">
                <h2 className="text-2xl font-bold text-gray-800">{editingUser ? 'Modifier' : 'Ajouter'} un utilisateur</h2>
                <button onClick={cancelEdit} className="p-2 rounded-full hover:bg-gray-200"><X size={24} /></button>
              </div>
              <form onSubmit={editingUser ? handleUpdate : handleCreate} className="flex-grow overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Prénom" required className="w-full px-4 py-2 border rounded-lg" />
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Nom" required className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" required className="w-full px-4 py-2 border rounded-lg" />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
                  <select name="role" value={formData.role} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg bg-white">
                    <option value="Membre">Membre</option>
                    <option value="Gestionnaire">Gestionnaire</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                {formData.role === 'Admin' && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                    <label className="block text-sm font-medium text-red-800 mb-1">Mot de passe de l'Administrateur</label>
                    <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder={editingUser ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe obligatoire'} required={!editingUser && formData.role === 'Admin'} className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-red-500 focus:border-red-500" />
                    <p className="text-xs text-red-600 mt-1">Les profils Admin ne peuvent pas être activés par email, leur mot de passe doit être défini ici.</p>
                  </div>
                )}

                {formData.role === 'Gestionnaire' && (
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-700">Permissions des Modules</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border p-4 rounded-lg bg-gray-50">
                      {availableModules.map(module => (
                        <label key={module.id} className="flex items-center space-x-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={formData.managedModules.includes(module.id)} 
                            onChange={(e) => handleModuleChange(module.id, e.target.checked)} 
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                          />
                          <span className="text-gray-700 text-sm font-medium">{module.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-700">Orchestres</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto border p-3 rounded-lg">
                      {orchestras.map(orc => (
                        <label key={orc.id} className="flex items-center space-x-3">
                          <input type="checkbox" checked={formData.orchestras.includes(orc.id)} onChange={(e) => handleOrchestraChange(orc.id, e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-gray-700">{orc.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-700">Instruments</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto border p-3 rounded-lg">
                      {instruments.map(inst => (
                        <label key={inst.id} className="flex items-center space-x-3">
                          <input type="checkbox" checked={formData.instruments.includes(inst.id)} onChange={(e) => handleInstrumentChange(inst.id, e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-gray-700">{inst.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t">
                  <button type="button" onClick={cancelEdit} className="mr-4 px-6 py-2 rounded-lg border hover:bg-gray-100">Annuler</button>
                  <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:bg-blue-300">
                    {loading ? 'Enregistrement...' : (editingUser ? 'Mettre à jour' : 'Créer')}
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
          <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            <div className="flex items-center">
              <CheckCircle size={20} className="mr-2" />
              {notification.message}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminUsers;
