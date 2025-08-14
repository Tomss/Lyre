import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Plus, Users, Mail, User, Shield, X, UserPlus, CheckCircle, Music, Search, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

interface UserData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'Membre' | 'Gestionnaire' | 'Admin';
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
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [orchestras, setOrchestras] = useState<Orchestra[]>([]);
  const [userInstruments, setUserInstruments] = useState<{[key: string]: Instrument[]}>({});
  const [userOrchestras, setUserOrchestras] = useState<{[key: string]: Orchestra[]}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string[]>(['Admin', 'Gestionnaire', 'Membre']);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
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
  });

  // Fonction pour afficher une notification
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Récupérer tous les instruments
  const fetchInstruments = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-instruments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setInstruments(data || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des instruments:', err);
    }
  };

  // Récupérer les instruments d'un utilisateur
  const fetchUserInstruments = async (userId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-instruments?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data || [];
    } catch (err) {
      console.error('Erreur lors de la récupération des instruments utilisateur:', err);
      return [];
    }
  };

  // Récupérer tous les orchestres
  const fetchOrchestras = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-orchestras`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOrchestras(data || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des orchestres:', err);
    }
  };

  // Récupérer les orchestres d'un utilisateur
  const fetchUserOrchestras = async (userId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-orchestras?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data || [];
    } catch (err) {
      console.error('Erreur lors de la récupération des orchestres utilisateur:', err);
      return [];
    }
  };

  // Récupérer les instruments de tous les utilisateurs
  const fetchAllUserAssociations = async () => {
    const instrumentsMap: {[key: string]: Instrument[]} = {};
    const orchestrasMap: {[key: string]: Orchestra[]} = {};
    
    for (const user of users) {
      const userInsts = await fetchUserInstruments(user.id);
      const userOrcs = await fetchUserOrchestras(user.id);
      instrumentsMap[user.id] = userInsts;
      orchestrasMap[user.id] = userOrcs;
    }
    
    setUserInstruments(instrumentsMap);
    setUserOrchestras(orchestrasMap);
  };

  // Récupérer tous les utilisateurs
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-all-users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data || []);
    } catch (err) {
      console.error('Erreur réseau:', err);
      alert('Erreur de connexion');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (profile?.role === 'Admin') {
      fetchUsers();
      fetchInstruments();
      fetchOrchestras();
    }
  }, [profile]);

  useEffect(() => {
    if (users.length > 0) {
      fetchAllUserAssociations();
    }
  }, [users]);

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

  // Créer un utilisateur (sans se connecter dessus)
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: formData.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        showNotification('Utilisateur créé avec succès !');
        
        // Gérer les instruments si sélectionnés
        if (formData.instruments.length > 0) {
          await manageUserInstruments(result.user.id, formData.instruments);
        }
        
        // Gérer les orchestres si sélectionnés
        if (formData.orchestras.length > 0) {
          await manageUserOrchestras(result.user.id, formData.orchestras);
        }
        
        cancelEdit();
        fetchUsers();
      } else {
        showNotification(`Erreur de création: ${result.error}`, 'error');
      }
    } catch (err) {
      console.error('Erreur de création:', err);
      showNotification('Erreur de création: ' + (err instanceof Error ? err.message : 'Erreur inconnue'), 'error');
    }
    setLoading(false);
  };

  // Gérer les instruments d'un utilisateur
  const manageUserInstruments = async (userId: string, instrumentIds: string[]) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user-instruments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          instrumentIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    } catch (err) {
      console.error('Erreur lors de la gestion des instruments:', err);
      throw err;
    }
  };

  // Gérer les orchestres d'un utilisateur
  const manageUserOrchestras = async (userId: string, orchestraIds: string[]) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user-orchestras`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          orchestraIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    } catch (err) {
      console.error('Erreur lors de la gestion des orchestres:', err);
      throw err;
    }
  };

  // Mettre à jour un utilisateur
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingUser.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: formData.role,
          password: formData.password || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (response.ok && result.message) {
        showNotification('Utilisateur mis à jour avec succès !');
        
        // Gérer les instruments
        await manageUserInstruments(editingUser.id, formData.instruments);
        
        // Gérer les orchestres
        await manageUserOrchestras(editingUser.id, formData.orchestras);
        
        cancelEdit();
        fetchUsers();
      } else {
        showNotification(`Erreur de mise à jour: ${result.error || 'Erreur inconnue'}`, 'error');
      }
    } catch (err) {
      console.error('Erreur de mise à jour:', err);
      showNotification('Erreur de mise à jour: ' + (err instanceof Error ? err.message : 'Erreur inconnue'), 'error');
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
    if (!deleteConfirmation.user) return;
    
    const userId = deleteConfirmation.user.id;
    console.log('Attempting to delete user:', userId);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
        }),
      });

      console.log('Delete response status:', response.status);
      const result = await response.json();
      console.log('Delete response body:', result);

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      if (result.message) {
        showNotification('Utilisateur supprimé avec succès !');
        fetchUsers();
        setDeleteConfirmation({ isOpen: false, user: null });
      } else {
        console.error('Unexpected response format:', result);
        showNotification(`Erreur de suppression: ${result.error || 'Format de réponse inattendu'}`, 'error');
      }
    } catch (err) {
      console.error('Erreur de suppression:', err);
      showNotification('Erreur de suppression: ' + (err instanceof Error ? err.message : 'Erreur inconnue'), 'error');
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
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Gestionnaire': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (profile && profile.role !== 'Admin') {
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

  return (
    <div className="font-inter pt-20 pb-20 min-h-screen bg-gray-50">
      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-24 right-4 z-50 animate-fade-in">
          <div className={`flex items-center space-x-3 px-6 py-4 rounded-lg shadow-lg border ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <X className="h-5 w-5 text-red-600" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link
                to="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-2"
                title="Retour au dashboard"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </Link>
              <div className="bg-primary/10 p-3 rounded-lg">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="font-poppins font-bold text-3xl text-dark">
                  Gestion des utilisateurs
                </h1>
                <p className="font-inter text-gray-600">
                  Gérez les comptes utilisateurs de l'école
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <UserPlus className="h-5 w-5" />
              <span>Ajouter un utilisateur</span>
            </button>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-4">
            <span className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} {searchTerm && `sur ${users.length}`}</span>
            </span>
            {roleFilter.length < 3 && (
              <span className="flex items-center space-x-1">
                <Shield className="h-4 w-4" />
                <span>Filtré par: {roleFilter.join(', ')}</span>
              </span>
            )}
          </div>
        </div>

        {/* Formulaire d'ajout/modification (Modal) */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      {editingUser ? <Edit className="h-6 w-6 text-primary" /> : <Plus className="h-6 w-6 text-primary" />}
                    </div>
                    <h2 className="font-poppins font-semibold text-xl text-dark">
                      {editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
                    </h2>
                  </div>
                  <button
                    onClick={cancelEdit}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={editingUser ? handleUpdate : handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      Prénom
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      Nom
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!!editingUser}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      Mot de passe {editingUser && '(laisser vide pour ne pas changer)'}
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      required={!editingUser}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-3">
                      Instruments
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {instruments.map((instrument) => (
                        <label key={instrument.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={formData.instruments.includes(instrument.id)}
                            onChange={(e) => handleInstrumentChange(instrument.id, e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-gray-700">{instrument.name}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Sélectionnez un ou plusieurs instruments (optionnel)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-3">
                      Orchestres
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {orchestras.map((orchestra) => (
                        <label key={orchestra.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={formData.orchestras.includes(orchestra.id)}
                            onChange={(e) => handleOrchestraChange(orchestra.id, e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-gray-700">{orchestra.name}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Sélectionnez un ou plusieurs orchestres (optionnel)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      Rôle
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="Membre">Membre</option>
                      <option value="Gestionnaire">Gestionnaire</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      {loading ? 'En cours...' : (editingUser ? 'Mettre à jour' : 'Créer')}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-dark rounded-lg transition-all duration-200"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmation de suppression */}
        {deleteConfirmation.isOpen && deleteConfirmation.user && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-red-100 p-3 rounded-full">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-poppins font-semibold text-lg text-dark">
                      Confirmer la suppression
                    </h3>
                    <p className="text-sm text-gray-600">
                      Cette action est irréversible
                    </p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-700">
                    Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
                    <span className="font-semibold text-dark">
                      {deleteConfirmation.user.first_name} {deleteConfirmation.user.last_name}
                    </span>{' '}
                    ?
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Email: {deleteConfirmation.user.email}
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleDelete}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Supprimer définitivement
                  </button>
                  <button
                    onClick={cancelDelete}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-dark font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Liste des utilisateurs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-poppins font-semibold text-lg text-dark">
                Liste des utilisateurs
              </h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-64"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Filtres par rôle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">Filtrer par rôle :</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleRoleFilter('Admin')}
                    className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      roleFilter.includes('Admin')
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <Shield className="h-3 w-3" />
                    <span>Admin</span>
                  </button>
                  <button
                    onClick={() => toggleRoleFilter('Gestionnaire')}
                    className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      roleFilter.includes('Gestionnaire')
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <User className="h-3 w-3" />
                    <span>Gestionnaire</span>
                  </button>
                  <button
                    onClick={() => toggleRoleFilter('Membre')}
                    className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      roleFilter.includes('Membre')
                        ? 'bg-gray-100 text-gray-800 border border-gray-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <Users className="h-3 w-3" />
                    <span>Membre</span>
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={selectAllRoles}
                  className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Tout sélectionner
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={clearAllRoles}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
                >
                  Tout désélectionner
                </button>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement...</p>
            </div>
          ) : filteredUsers.length === 0 && searchTerm ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>Aucun utilisateur trouvé pour "{searchTerm}"</p>
              <button onClick={() => setSearchTerm('')} className="text-primary hover:text-primary/80 mt-2">Effacer la recherche</button>
            </div>
          ) : filteredUsers.length === 0 && roleFilter.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>Aucun rôle sélectionné</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Aucun utilisateur trouvé
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                return (
                  <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold text-dark text-lg">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="flex items-center space-x-3 text-sm text-gray-600 mb-1">
                            <span className="flex items-center space-x-1">
                              <Mail className="h-4 w-4" />
                              <span>{user.email}</span>
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {user.role}
                            </span>
                          </div>
                          {userInstruments[user.id] && userInstruments[user.id].length > 0 && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Music className="h-3 w-3" />
                              <span>{userInstruments[user.id].map(inst => inst.name).join(', ')}</span>
                            </div>
                          )}
                          {userOrchestras[user.id] && userOrchestras[user.id].length > 0 && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                              <Users className="h-3 w-3" />
                              <span>{userOrchestras[user.id].map(orc => orc.name).join(', ')}</span>
                            </div>
                          )}
                          </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Modifier"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => confirmDelete(user)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Supprimer"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;