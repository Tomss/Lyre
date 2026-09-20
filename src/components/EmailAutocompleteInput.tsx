import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Mail, User, Check, Search } from 'lucide-react';

export interface AutocompleteUserCandidate {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  emails?: { email: string }[];
}

interface EmailAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  users: AutocompleteUserCandidate[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  autoFocus?: boolean;
  excludeEmails?: string[];
  id?: string;
  name?: string;
}

export const EmailAutocompleteInput: React.FC<EmailAutocompleteInputProps> = ({
  value,
  onChange,
  users,
  placeholder = 'ex: jean.dupont@gmail.com',
  required = false,
  className = '',
  autoFocus = false,
  excludeEmails = [],
  id,
  name,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Regrouper toutes les adresses e-mails uniques avec les profils associés
  const uniqueEmailEntries = useMemo(() => {
    const map = new Map<string, { email: string; profiles: { name: string; role: string }[] }>();

    for (const u of users) {
      const fullName = `${u.first_name} ${u.last_name}`.trim();

      // 1. E-mail principal
      if (u.email && u.email.trim()) {
        const em = u.email.trim();
        const emKey = em.toLowerCase();
        if (!map.has(emKey)) {
          map.set(emKey, { email: em, profiles: [] });
        }
        const entry = map.get(emKey)!;
        if (!entry.profiles.some(p => p.name === fullName)) {
          entry.profiles.push({ name: fullName, role: u.role });
        }
      }

      // 2. E-mails secondaires
      if (u.emails && Array.isArray(u.emails)) {
        for (const e of u.emails) {
          if (e.email && e.email.trim()) {
            const em = e.email.trim();
            const emKey = em.toLowerCase();
            if (!map.has(emKey)) {
              map.set(emKey, { email: em, profiles: [] });
            }
            const entry = map.get(emKey)!;
            if (!entry.profiles.some(p => p.name === fullName)) {
              entry.profiles.push({ name: fullName, role: u.role });
            }
          }
        }
      }
    }

    return Array.from(map.values());
  }, [users]);

  // Filtrer les suggestions selon la saisie
  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query || query.length < 1) return [];

    const excluded = new Set(excludeEmails.map(e => e.trim().toLowerCase()));

    return uniqueEmailEntries
      .filter(item => {
        if (excluded.has(item.email.toLowerCase())) return false;
        // Recherche dans l'adresse e-mail
        if (item.email.toLowerCase().includes(query)) return true;
        // Recherche dans les noms des membres associés
        return item.profiles.some(p => p.name.toLowerCase().includes(query));
      })
      .slice(0, 6);
  }, [value, uniqueEmailEntries, excludeEmails]);

  // Fermer la liste si clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ouvrir automatiquement le dropdown s'il y a des suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
    setHighlightIndex(-1);
  };

  const handleSelectSuggestion = (email: string) => {
    onChange(email);
    setIsOpen(false);
    setHighlightIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true);
        setHighlightIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[highlightIndex].email);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="email"
        id={id}
        name={name}
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        autoComplete="off"
        className={className}
      />

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span className="flex items-center gap-1.5 text-indigo-600 font-bold">
              <Search size={12} />
              Adresses e-mail trouvées ({suggestions.length})
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              Tapez Entrée ou cliquez
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
            {suggestions.map((item, idx) => {
              const isSelected = item.email.toLowerCase() === value.trim().toLowerCase();
              const isHighlighted = idx === highlightIndex;

              return (
                <div
                  key={item.email}
                  onClick={() => handleSelectSuggestion(item.email)}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  className={`px-3.5 py-2.5 cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                    isHighlighted
                      ? 'bg-indigo-50/80 text-indigo-900'
                      : isSelected
                      ? 'bg-slate-50 text-slate-900'
                      : 'hover:bg-slate-50/70 text-slate-700'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Mail size={13} className={isSelected ? "text-indigo-600" : "text-slate-400"} />
                      <span className="font-semibold text-xs sm:text-sm text-slate-800 truncate">
                        {item.email}
                      </span>
                      {isSelected && (
                        <Check size={13} className="text-indigo-600 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                      <User size={11} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">
                        {item.profiles.map(p => `${p.name} (${p.role})`).join(', ')}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 transition-colors ${
                    isHighlighted
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  }`}>
                    Choisir
                  </span>
                </div>
              );
            })}
          </div>

          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center">
            Vous pouvez également saisir librement une nouvelle adresse non répertoriée
          </div>
        </div>
      )}
    </div>
  );
};
