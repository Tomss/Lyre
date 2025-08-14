// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import School from './pages/School';
import Events from './pages/Events';
import Media from './pages/Media';
import Contact from './pages/Contact';
import Connexion from './pages/Connexion'; // Importer la page de connexion
import Dashboard from './pages/Dashboard'; // Importer le dashboard
import AdminUsers from './pages/AdminUsers'; // Importer la page d'administration des utilisateurs

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/school" element={<School />} />
            <Route path="/events" element={<Events />} />
            <Route path="/media" element={<Media />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/connexion" element={<Connexion />} /> {/* Route pour la connexion */}
            <Route path="/dashboard" element={<Dashboard />} /> {/* Route (non protégée pour l'instant) */}
            <Route path="/admin/users" element={<AdminUsers />} /> {/* Route pour l'administration des utilisateurs */}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;