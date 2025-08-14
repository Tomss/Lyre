import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Settings, LogOut, Users, Music } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, profile, logout } = useAuth();

  if (!user) {
    return <Navigate to="/connexion" />;
  }

  return (
    <div className="font-inter pt-20 pb-20 min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              {profile ? (
                <>
                  <h1 className="font-poppins font-bold text-3xl text-dark mb-2">
                    Bonjour {profile.first_name} {profile.last_name}
                  </h1>
                  <p className="font-inter text-lg text-gray-600">
                    Bienvenue dans votre espace.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="font-poppins font-bold text-3xl text-dark mb-2">
                    Bonjour
                  </h1>
                  <p className="font-inter text-lg text-gray-600">
                    Chargement de votre profil...
                  </p>
                </>
              )}
              {user && profile && (
                <p className="font-inter text-sm text-gray-500 mt-2">
                  Connecté en tant que {user.email} • Rôle: {profile.role}
                </p>
              )}
            </div>
            <div className="mt-6 md:mt-0">
              <button
                onClick={logout}
                className="inline-flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-dark font-medium px-4 py-2 rounded-lg transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Admin Section - Visible uniquement pour les Admins */}
        {profile?.role === 'Admin' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
            <h2 className="font-poppins font-semibold text-xl text-dark mb-4">
              Administration
            </h2>
            <p className="font-inter text-gray-600 mb-6">
              Accédez aux outils d'administration de l'école.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/admin/users"
                className="inline-flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg text-center justify-center"
              >
                <Users className="h-5 w-5" />
                <span>Utilisateurs</span>
              </Link>
              <Link
                to="/admin/instruments"
                className="inline-flex items-center space-x-2 bg-accent hover:bg-accent/90 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg text-center justify-center"
              >
                <Music className="h-5 w-5" />
                <span>Instruments</span>
              </Link>
              <Link
                to="/admin/orchestras"
                className="inline-flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg text-center justify-center"
              >
                <Users className="h-5 w-5" />
                <span>Orchestres</span>
              </Link>
            </div>
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