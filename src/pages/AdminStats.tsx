import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import {
    BarChart3,
    ArrowLeft,
    Users,
    Eye,
    Smartphone,
    ExternalLink,
    RefreshCw,
    TrendingUp,
    Calendar,
    Radio,
    Sparkles
} from 'lucide-react';

interface TimeRange {
    id: string;
    label: string;
    shortLabel: string;
    days: number;
}

const TIME_RANGES: TimeRange[] = [
    { id: 'today', label: "Aujourd'hui", shortLabel: 'Auj.', days: 1 },
    { id: '24h', label: 'Dernières 24h', shortLabel: '24h', days: 1 },
    { id: '7d', label: '7 derniers jours', shortLabel: '7j', days: 7 },
    { id: '30d', label: '30 derniers jours', shortLabel: '30j', days: 30 },
    { id: '90d', label: '90 jours (3 mois)', shortLabel: '3m', days: 90 },
    { id: '6m', label: '6 derniers mois', shortLabel: '6m', days: 180 },
    { id: '1y', label: 'Cette année', shortLabel: '1 an', days: 365 },
    { id: 'all', label: "Tout l'historique", shortLabel: 'Tout', days: 1000 },
];

const AdminStats: React.FC = () => {
    const { currentUser, isAuthenticated } = useAuth();
    const [selectedRange, setSelectedRange] = useState<string>('30d');
    const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Check permission
    const hasPermission = isAuthenticated && (
        currentUser?.role === 'Admin' ||
        currentUser?.managedModules?.includes('stats')
    );

    const handleManualRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setLastUpdated(new Date());
            setIsRefreshing(false);
        }, 600);
    };

    // Auto-refresh interval (every 30 seconds if active)
    useEffect(() => {
        if (!isAutoRefresh) return;
        const interval = setInterval(() => {
            setLastUpdated(new Date());
        }, 30000);
        return () => clearInterval(interval);
    }, [isAutoRefresh]);

    if (!isAuthenticated) {
        return <Navigate to="/connexion" replace />;
    }

    if (!hasPermission) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="pt-8 lg:pt-12 pb-20 min-h-screen bg-slate-50 [overflow-anchor:none]">
            <div className="w-full px-4 sm:px-10 lg:px-16 max-w-7xl mx-auto">
                
                {/* Top Back Nav & Quick Action */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <Link to="/dashboard" className="text-slate-400 hover:text-indigo-600 transition flex items-center mb-2 group text-sm font-medium">
                            <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                            Retour au tableau de bord
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm border border-indigo-50 flex-shrink-0">
                                <BarChart3 size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                                    Statistiques de Fréquentation
                                </h1>
                                <p className="text-slate-500 text-sm mt-0.5">
                                    Audience en temps réel et analyse du trafic officiel de La Lyre.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        {/* Real-time live pulse badge */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-700 text-xs font-semibold shadow-xs">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span>Suivi en direct actif</span>
                        </div>

                        {/* Open Full Umami External Link */}
                        <a
                            href="https://stats.lalyre.fr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs hover:border-indigo-300 hover:text-indigo-600 transition-all group"
                        >
                            <span>Ouvrir Umami complet</span>
                            <ExternalLink size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        </a>
                    </div>
                </div>

                {/* Control Bar: Time Range Selector & Live Controls */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                    
                    {/* Time Range Pills - Wrapped & Clean (No horizontal scroll) */}
                    <div className="flex flex-wrap items-center gap-1.5 w-full xl:w-auto">
                        <div className="flex items-center text-xs font-bold text-slate-400 mr-1.5 uppercase tracking-wider">
                            <Calendar size={14} className="mr-1 text-slate-400" />
                            Période :
                        </div>
                        {TIME_RANGES.map((range) => {
                            const isSelected = selectedRange === range.id;
                            return (
                                <button
                                    key={range.id}
                                    onClick={() => setSelectedRange(range.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                        isSelected
                                            ? 'bg-indigo-600 text-white shadow-xs scale-100'
                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    {range.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Refresh & Live Status Controls */}
                    <div className="flex items-center justify-between xl:justify-end gap-3 w-full xl:w-auto pt-3 xl:pt-0 border-t xl:border-t-0 border-slate-100">
                        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                            Actualisé à {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>

                        <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-600 hover:text-slate-900">
                            <input
                                type="checkbox"
                                checked={isAutoRefresh}
                                onChange={(e) => setIsAutoRefresh(e.target.checked)}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                            />
                            <span>Auto (30s)</span>
                        </label>

                        <button
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 rounded-xl border border-slate-200/80 transition shadow-2xs active:scale-95 disabled:opacity-50"
                            title="Actualiser les données"
                        >
                            <RefreshCw size={15} className={`${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* KPI Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    
                    {/* Unique Visitors */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Visiteurs Uniques</span>
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Users size={18} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-black text-slate-800">En direct</span>
                        </div>
                        <p className="text-[12px] text-slate-400 mt-1 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Collecte active sans cookies
                        </p>
                    </div>

                    {/* Page Views */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pages Vues</span>
                            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Eye size={18} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-black text-slate-800">100% RGPD</span>
                        </div>
                        <p className="text-[12px] text-slate-400 mt-1">
                            Suivi temps réel & SPA
                        </p>
                    </div>

                    {/* Sessions / Traffic */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fréquentation</span>
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <TrendingUp size={18} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-black text-slate-800">Illimité</span>
                        </div>
                        <p className="text-[12px] text-slate-400 mt-1">
                            Hébergé sur votre VPS
                        </p>
                    </div>

                    {/* Mobile vs Desktop */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Appareils</span>
                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Smartphone size={18} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-black text-slate-800">Mobile & PC</span>
                        </div>
                        <p className="text-[12px] text-slate-400 mt-1">
                            Analyse multi-plateforme
                        </p>
                    </div>
                </div>

                {/* Main Interactive Analytics Container */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
                    
                    {/* Header with Title & Quick Info */}
                    <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/70 to-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                                <Radio size={20} className="animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-slate-800">
                                    Tableau de bord interactif en direct
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Données synchronisées automatiquement avec le serveur d'analyse Umami.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg font-semibold">
                                Domaine : lalyre.fr
                            </span>
                        </div>
                    </div>

                    {/* Embedded Interactive Umami View */}
                    <div className="relative w-full bg-white min-h-[680px] lg:min-h-[780px]">
                        <iframe
                            src="https://stats.lalyre.fr/share/VTPrCmd87buqcPt1"
                            title="Tableau de bord Umami Analytics La Lyre"
                            className="w-full h-full min-h-[680px] lg:min-h-[780px] border-0 rounded-b-2xl"
                            loading="lazy"
                        />
                    </div>
                </div>

                {/* Footer Insight Information Card */}
                <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50 p-6 rounded-2xl border border-indigo-100/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">
                                Respect strict de la vie privée & Décret CNIL
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Ce système fonctionne sans cookies traceurs. Aucune donnée personnelle n'est transmise à des tiers, conformément aux normes françaises et européennes.
                            </p>
                        </div>
                    </div>
                    <a
                        href="https://stats.lalyre.fr"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all whitespace-nowrap"
                    >
                        Gestion avancée sur stats.lalyre.fr →
                    </a>
                </div>

            </div>
        </div>
    );
};

export default AdminStats;
