import React, { useState, useRef, useEffect } from 'react';
import { Agency } from '../../types';
import { Building, Search, X, Check } from 'lucide-react';

interface AgencyAutocompleteProps {
  agencies: Agency[];
  value: string; // agenceId
  onChange: (agency: Agency | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const AgencyAutocomplete: React.FC<AgencyAutocompleteProps> = ({
  agencies,
  value,
  onChange,
  placeholder = 'Rechercher une agence...',
  disabled = false,
  className = '',
  id
}) => {
  const selectedAgency = agencies.find(a => a.id === value);
  const [query, setQuery] = useState(selectedAgency ? `${selectedAgency.nom} (${selectedAgency.code})` : '');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Synchronise le libellé si la valeur externe change
  useEffect(() => {
    if (selectedAgency) {
      setQuery(`${selectedAgency.nom} (${selectedAgency.code})`);
    } else if (!value) {
      setQuery('');
    }
  }, [value, selectedAgency]);

  // Fermer la liste déroulante au clic externe
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Si non confirmé, restaure le nom de l'agence sélectionnée
        if (selectedAgency) {
          setQuery(`${selectedAgency.nom} (${selectedAgency.code})`);
        } else {
          setQuery('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedAgency]);

  // Filtrage trié par ordre puis nom
  const sortedAgencies = [...agencies].sort((a, b) => {
    const ordA = a.ordre ?? 999;
    const ordB = b.ordre ?? 999;
    if (ordA !== ordB) return ordA - ordB;
    return a.nom.localeCompare(b.nom);
  });

  const filteredAgencies = sortedAgencies.filter(a => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      a.nom.toLowerCase().includes(q) ||
      a.code.toLowerCase().includes(q) ||
      (a.description && a.description.toLowerCase().includes(q))
    );
  });

  const handleSelect = (agency: Agency) => {
    onChange(agency);
    setQuery(`${agency.nom} (${agency.code})`);
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        setFocusedIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < filteredAgencies.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : filteredAgencies.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredAgencies.length) {
        handleSelect(filteredAgencies[focusedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%' }}
      className={`agency-autocomplete ${className}`}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Building
          size={16}
          style={{
            position: 'absolute',
            left: '12px',
            color: 'var(--text-3)',
            pointerEvents: 'none'
          }}
        />
        <input
          ref={inputRef}
          id={id}
          type="text"
          className="form-input"
          style={{
            paddingLeft: '36px',
            paddingRight: query ? '34px' : '12px',
            width: '100%',
            fontWeight: selectedAgency ? 600 : 400
          }}
          placeholder={placeholder}
          value={query}
          disabled={disabled}
          onFocus={() => setIsOpen(true)}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
            setFocusedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
        />

        {query && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '8px',
              background: 'transparent',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: 'var(--text-3)',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Effacer la sélection"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '4px'
          }}
          role="listbox"
        >
          {filteredAgencies.length === 0 ? (
            <div
              style={{
                padding: '12px 14px',
                textAlign: 'center',
                color: 'var(--text-3)',
                fontSize: '0.85rem'
              }}
            >
              Aucune agence trouvée pour "{query}"
            </div>
          ) : (
            filteredAgencies.map((agency, index) => {
              const isSelected = agency.id === value;
              const isFocused = index === focusedIndex;

              return (
                <div
                  key={agency.id}
                  onClick={() => handleSelect(agency)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  role="option"
                  aria-selected={isSelected}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    minHeight: '44px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    backgroundColor: isFocused
                      ? 'var(--surface-2)'
                      : isSelected
                      ? 'rgba(217, 4, 41, 0.08)'
                      : 'transparent',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      className="badge badge-outline"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}
                    >
                      {agency.code}
                    </span>
                    <span
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: isSelected ? 700 : 500,
                        color: 'var(--text-1)'
                      }}
                    >
                      {agency.nom}
                    </span>
                  </div>

                  {isSelected && (
                    <Check size={16} color="var(--brand-hi)" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
