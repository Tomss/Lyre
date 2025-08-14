// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
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
    <div className="font-inter pt-32 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl text-center">
        <h1 className="font-poppins font-bold text-3xl text-dark mb-4">
          Bienvenue dans votre espace !
        </h1>
        {user && <p className="text-gray-600 mb-8">Connecté en tant que {user.email}</p>}

        {/* Ici vous pourrez ajouter le contenu du dashboard */}
        <div className="bg-gray-50 p-8 rounded-lg">
          <p>Tableau de bord à venir...</p>
        </div>

        <button
          onClick={handleLogout}
          className="mt-8 bg-accent hover:bg-accent/90 text-white font-inter font-semibold px-6 py-3 rounded-full transition-all duration-300"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
};

export default Dashboard;