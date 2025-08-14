// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';
import { Settings, LogOut, Users } from 'lucide-react';

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('Membre'); // Valeur de remplacement
  const [userName, setUserName] = useState<string>('Jean Dupont'); // Valeur de remplacement
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/'); // Redirige vers l'accueil après déconnexion
  };

  return (
    <div className="font-inter pt-20 pb-20 min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-poppins font-bold text-3xl text-dark mb-2">
                Bonjour {userName}
              </h1>
              <p className="font-inter text-lg text-gray-600">
                Bienvenue dans votre espace.
              </p>
              {user && (
                <p className="font-inter text-sm text-gray-500 mt-2">
                  Connecté en tant que {user.email} • Rôle: {userRole}
                </p>
              )}
            </div>
            <div className="mt-6 md:mt-0">
              <button
                onClick={handleLogout}
                className="inline-flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-dark font-medium px-4 py-2 rounded-lg transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Admin Section - Visible uniquement pour les Admins */}
        {userRole === 'Admin' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
            <h2 className="font-poppins font-semibold text-xl text-dark mb-4">
              Administration
            </h2>
            <p className="font-inter text-gray-600 mb-6">
              Accédez aux outils d'administration de l'école.
            </p>
            <Link
              to="/admin/users"
              className="inline-flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Users className="h-5 w-5" />
              <span>Gérer les utilisateurs</span>
            </Link>
          </div>
        )}

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-poppins font-semibold text-lg text-dark">
                Mon Profil
              </h3>
            </div>
            <p className="font-inter text-gray-600 mb-4">
              Gérez vos informations personnelles et vos préférences.
            </p>
            <button className="text-primary hover:text-primary/80 font-medium text-sm transition-colors">
              Modifier mon profil →
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-accent/10 p-2 rounded-lg">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-poppins font-semibold text-lg text-dark">
                Mes Cours
              </h3>
            </div>
            <p className="font-inter text-gray-600 mb-4">
              Consultez vos cours et votre planning.
            </p>
            <button className="text-primary hover:text-primary/80 font-medium text-sm transition-colors">
              Voir mes cours →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;