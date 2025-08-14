// src/pages/AdminUsers.tsx
import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Plus, Users, Mail, User, Shield, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

// L'interface pour les données utilisateur reste la même
interface UserData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'Membre' | 'Gestionnaire' | 'Admin';
}

const AdminUsers = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Membre' as 'Membre' | 'Gestionnaire' | 'Admin',
  });

  // 1. LIRE (Read) : Récupère les utilisateurs via une Edge Function sécurisée
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('get-all-users');
    if (error) {
      console.error('Full error object:', error);
      alert(`Erreur lors du chargement des utilisateurs: ${error.message || error.toString() || 'une erreur inconnue est survenue'}`);
    } else {
      setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (profile?.role === 'Admin') {
      fetchUsers();
    }
  }, [profile]);

  // Gère les changements dans les champs du formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 2. CRÉER (Create) : Crée un utilisateur via une Edge Function sécurisée
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.functions.invoke('create-user', {
      body: {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
      },
    });

    setLoading(false);

    if (error) {
      alert(`Erreur lors de la création de l'utilisateur: ${error.message || error.toString() || 'une erreur inconnue est survenue'}`);
    } else {
      alert('Utilisateur créé avec succès !');
      cancelEdit(); // Réinitialise le formulaire
      fetchUsers(); // Met à jour la liste
    }
  };
  
  // 3. METTRE À JOUR (Update) : Prépare le formulaire pour l'édition
  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      password: '', // Le mot de passe n'est pas affiché pour la sécurité
      role: user.role,
    });
  };

  // Logique de la mise à jour
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);
  
    const { error } = await supabase.functions.invoke('update-user', {
      body: {
        id: editingUser.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
        password: formData.password, // Le mot de passe est envoyé uniquement s'il est changé
      },
    });
  
    setLoading(false);
  
    if (error) {
      alert(`Erreur lors de la mise à jour: ${error.message || error.toString() || 'une erreur inconnue est survenue'}`);
    } else {
      alert('Utilisateur mis à jour avec succès !');
      cancelEdit();
      fetchUsers();
    }
  };

  // 4. SUPPRIMER (Delete) : Supprime un utilisateur via une Edge Function sécurisée
  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${userName} ? Cette action est irréversible.`)) {
      return;
    }
    setLoading(true);
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { userId },
    });
    setLoading(false);

    if (error) {
      alert(`Erreur lors de la suppression: ${error.message || error.toString() || 'une erreur inconnue est survenue'}`);
    } else {
      alert('Utilisateur supprimé avec succès.');
      fetchUsers();
    }
  };

  // Annule le mode édition et vide le formulaire
  const cancelEdit = () => {
    setEditingUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'Membre',
    });
  };
  
  // ... (Les fonctions getRoleColor et getRoleIcon restent les mêmes)
  const getRoleColor = (role: string) => { /* ... */ };
  const getRoleIcon = (role: string) => { /* ... */ };

  // Sécurité : Redirige si l'utilisateur n'est pas Admin
  if (profile && profile.role !== 'Admin') {
    return <Navigate to="/dashboard" />;
  }

  return (
    // Votre JSX reste quasi identique, seules les liaisons `onSubmit` et `onClick` sont importantes
    <div className="font-inter pt-20 pb-20 min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* ... Header de la page ... */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire de création/modification */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {/* Titre du formulaire */}
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-primary/10 p-2 rounded-lg">
                  {editingUser ? <Edit className="h-6 w-6 text-primary" /> : <Plus className="h-6 w-6 text-primary" />}
                </div>
                <h2 className="font-poppins font-semibold text-xl text-dark">
                  {editingUser ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}
                </h2>
              </div>

              <form onSubmit={editingUser ? handleUpdate : handleCreate} className="space-y-4">
                {/* Champs du formulaire (firstName, lastName, email, password, role) */}
                {/* ... le JSX pour les inputs reste le même, mais notez les propriétés `disabled` et `required` */}
                <div>
                  <label htmlFor="email">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} disabled={!!editingUser} required />
                </div>
                <div>
                  <label htmlFor="password">Mot de passe {editingUser && '(laisser vide pour ne pas changer)'}</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} required={!editingUser} />
                </div>
                {/* ... autres champs ... */}

                {/* Boutons */}
                <div className="flex space-x-2 pt-2">
                  <button type="submit" disabled={loading} className="flex-1 ...">
                    {loading ? 'En cours...' : (editingUser ? 'Mettre à jour' : 'Créer')}
                  </button>
                  {editingUser && (
                    <button type="button" onClick={cancelEdit} className="...">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
          
          {/* Tableau des utilisateurs */}
          <div className="lg:col-span-2">
            {/* ... Le JSX pour le tableau reste le même ... */}
            {/* Les boutons appellent maintenant les nouvelles fonctions */}
            <button onClick={() => handleEdit(user)} className="...">
              <Edit className="h-4 w-4" />
            </button>
            <button onClick={() => handleDelete(user.id, `${user.first_name} ${user.last_name}`)} className="...">
              <Trash2 className="h-4 w-4" />
            </button>
            {/* ... */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;