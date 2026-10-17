import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Agency } from '../../types';
import { formatNumber } from '../../utils/formatters';
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

export const AgenciesView: React.FC = () => {
  const { agencies, addAgency, updateAgency, deleteAgency } = useData();
  const { currentUser } = useAuth();
  const isStagiaire = currentUser?.role === 'stagiaire' || currentUser?.role === 'user';

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [conventionsCount, setConventionsCount] = useState(0);
  const [cartonsCount, setCartonsCount] = useState(0);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filtered = agencies.filter(a =>
    a.nom.toLowerCase().includes(search.toLowerCase()) ||
    a.code.includes(search)
  );

  const handleOpenAdd = () => {
    setEditingAgency(null);
    setCode('');
    setNom('');
    setDescription('');
    setConventionsCount(0);
    setCartonsCount(0);
    setShowModal(true);
  };

  const handleOpenEdit = (ag: Agency) => {
    setEditingAgency(ag);
    setCode(ag.code);
    setNom(ag.nom);
    setDescription(ag.description || '');
    setConventionsCount(ag.conventionsCount);
    setCartonsCount(ag.cartonsCount);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !nom.trim()) {
      setFeedback({ type: 'error', message: 'Veuillez saisir un code et un nom d\'agence.' });
      return;
    }

    if (editingAgency) {
      // MODIFIER
      const updated: Agency = {
        ...editingAgency,
        code: code.trim(),
        nom: nom.trim(),
        description: description.trim() || undefined,
        conventionsCount: Number(conventionsCount) || 0,
        cartonsCount: Number(cartonsCount) || 0,
        dossiersCount: Number(conventionsCount) || 0
      };
      const res = updateAgency(updated);
      setFeedback({ type: 'success', message: res.message });
      setShowModal(false);
    } else {
      // ENREGISTRER (NOUVEAU)
      const res = addAgency({
        code: code.trim(),
        nom: nom.trim(),
        description: description.trim() || undefined,
        conventionsCount: Number(conventionsCount) || 0,
        cartonsCount: Number(cartonsCount) || 0,
        dossiersCount: Number(conventionsCount) || 0,
        statut: 'active'
      });
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setShowModal(false);
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    }
  };

  const handleDelete = (ag: Agency) => {
    if (window.confirm(`Confirmer la suppression définitive de l'agence "${ag.nom}" (Code ${ag.code}) ?`)) {
      const res = deleteAgency(ag.id);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Clean Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Agences
          </h1>
          <div style={{ fontSize: '0.92rem', color: '#D9D9D9', marginTop: '4px' }}>
            {agencies.length} agence(s) enregistrée(s)
          </div>
        </div>

        {isStagiaire ? (
          <span className="badge badge-black" style={{ padding: '8px 14px', fontSize: '0.85rem', border: '1px solid var(--uba-anthracite)' }}>
            Mode Consultation (Lecture seule)
          </span>
        ) : (
          <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
            <Plus size={15} /> + Ajouter une agence
          </button>
        )}
      </div>

      {feedback && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'var(--uba-anthracite)',
          color: '#FFFFFF',
          border: '1px solid var(--uba-silver-dark)'
        }}>
          {feedback.type === 'success' ? <CheckCircle size={16} color="var(--uba-red-bright)" /> : <AlertCircle size={16} color="var(--uba-red)" />}
          <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, color: '#FFFFFF' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Search Input — Dark Glass */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '18px',
        backgroundColor: 'rgba(14, 14, 14, 0.85)',
        padding: '10px 16px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <Search size={16} color="#D9D9D9" />
        <input
          type="text"
          placeholder="Rechercher par nom ou code (ex: 901, Bacongo)..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            width: '100%',
            fontSize: '0.92rem',
            backgroundColor: 'transparent',
            color: '#FFFFFF'
          }}
        />
      </div>

      {/* Table Container */}
      <div className="uba-table-container">
        <table className="uba-table">
          <thead>
            <tr>
              <th style={{ width: '90px' }}>Code</th>
              <th>Nom de l'agence</th>
              <th>Description</th>
              <th style={{ textAlign: 'right' }}>Conventions</th>
              <th style={{ textAlign: 'right' }}>Boîtes</th>
              <th>Statut</th>
              <th style={{ textAlign: 'right', width: '160px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#D9D9D9' }}>
                  Aucune agence trouvée.
                </td>
              </tr>
            ) : (
              filtered.map(ag => (
                <tr key={ag.id}>
                  <td>
                    <span className="badge badge-gray" style={{ fontWeight: 800 }}>
                      {ag.code}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#FFFFFF', fontSize: '0.95rem' }}>{ag.nom}</strong>
                  </td>
                  <td style={{ color: '#D9D9D9', fontSize: '0.85rem' }}>
                    {ag.description || '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--uba-red-bright)', fontSize: '1.05rem' }}>
                    {formatNumber(ag.conventionsCount)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#FFFFFF' }}>
                    {ag.cartonsCount}
                  </td>
                  <td>
                    <span className={ag.statut === 'active' ? 'badge badge-white' : 'badge badge-gray'}>
                      {ag.statut === 'active' ? 'Active' : 'En cours'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {!isStagiaire ? (
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenEdit(ag)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 8px' }}
                          title="Modifier l'agence"
                        >
                          <Edit2 size={13} /> Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(ag)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 8px', color: '#DC2626' }}
                          title="Supprimer l'agence"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--uba-silver-dark)' }}>Consultation</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add / Edit */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                {editingAgency ? 'Modifier l\'agence' : 'Nouvelle agence'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D9D9D9' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Code *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="901"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom de l'agence *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="City-Center"
                    value={nom}
                    onChange={e => setNom(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Localisation</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Agence Principale"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Conventions traitées</label>
                  <input
                    type="number"
                    className="form-input"
                    value={conventionsCount}
                    onChange={e => setConventionsCount(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Boîtes archivées</label>
                  <input
                    type="number"
                    className="form-input"
                    value={cartonsCount}
                    onChange={e => setCartonsCount(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingAgency ? 'Enregistrer les modifications' : 'Enregistrer l\'agence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
