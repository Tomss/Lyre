import React from 'react';
import { Calendar, Clock, User, Plus, Pencil, Trash2 } from 'lucide-react';

export interface Activity {
    id: string;
    type: 'event' | 'partition' | 'news';
    action_type: 'create' | 'update' | 'delete';
    title: string;
    message: string;
    target_id?: string;
    created_at: string;
    first_name: string;
    last_name: string;
}

interface ActivityFeedProps {
    activities: Activity[];
    onItemClick?: (activity: Activity) => void;
    lastSeenId?: string | null;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, onItemClick, lastSeenId }) => {
    // Determine which activities are "new" (unread)
    // In a descending sorted list, any item before the lastSeenId is new
    const lastSeenIndex = lastSeenId ? activities.findIndex(a => a.id === lastSeenId) : -1;
    
    const isActivityNew = (index: number) => {
        if (!lastSeenId) return true; // Everything is new if nothing seen yet
        if (lastSeenIndex === -1) return true; // lastSeenId not found (maybe older than current fetch)
        return index < lastSeenIndex;
    };
    const getActionBadge = (action: Activity['action_type']) => {
        switch (action) {
            case 'create':
                return (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Plus className="w-2.5 h-2.5" /> Créé
                    </span>
                );
            case 'update':
                return (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Pencil className="w-2.5 h-2.5" /> Modifié
                    </span>
                );
            case 'delete':
                return (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <Trash2 className="w-2.5 h-2.5" /> Supprimé
                    </span>
                );
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

        if (diffInHours < 24 && date.getDate() === now.getDate()) {
            return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        }
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (activities.length === 0) {
        return (
            <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/10">
                    <Clock className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-white/40 text-sm font-medium italic">Aucune activité récente.</p>
            </div>
        );
    }

    return (
        <div 
            className="max-h-[400px] overflow-y-auto custom-scrollbar" 
            data-lenis-prevent
            style={{ overscrollBehavior: 'contain' }}
        >
            <div className="divide-y divide-white/5">
                {activities.map((activity, index) => {
                    const isNew = isActivityNew(index);
                    return (
                        <button 
                            key={activity.id}
                            onClick={() => onItemClick?.(activity)}
                            disabled={!activity.target_id || activity.action_type === 'delete'}
                            className={`w-full text-left p-4 transition-all duration-200 group relative ${
                                activity.target_id && activity.action_type !== 'delete' ? 'hover:bg-white/10 cursor-pointer' : 'cursor-default opacity-80'
                            } ${isNew ? 'bg-indigo-500/5' : 'bg-transparent'}`}
                        >
                            {/* Unread Indicator Dot */}
                            {isNew && (
                                <div className="absolute top-4 left-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                    </span>
                                </div>
                            )}

                            <div className="flex items-start gap-4">
                                {/* Icon Container */}
                                <div className="flex-shrink-0 mt-1">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 border ${
                                        isNew ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                    }`}>
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-2 text-white/40 text-[10px] font-semibold uppercase tracking-tight">
                                            {formatDate(activity.created_at)}
                                            {isNew && (
                                                <span className="px-1.5 py-0.5 rounded bg-indigo-500 text-white text-[8px] font-bold">NOUVEAU</span>
                                            )}
                                        </div>
                                        {getActionBadge(activity.action_type)}
                                    </div>
                                    
                                    <h3 className={`font-bold text-sm truncate leading-snug mb-0.5 transition-colors ${
                                        isNew ? 'text-white' : 'text-slate-300 group-hover:text-indigo-300'
                                    }`}>
                                        {activity.title}
                                    </h3>
                                    
                                    <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">
                                        {activity.message}
                                    </p>

                                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-white/40">
                                        <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-white/60 overflow-hidden border border-white/5">
                                            <User className="w-2.5 h-2.5" />
                                        </div>
                                        <span className="truncate opacity-80">Par {activity.first_name} {activity.last_name}</span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ActivityFeed;

