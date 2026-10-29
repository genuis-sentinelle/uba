import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../ui/Feedback';
import { Agency } from '../../types';
import { formatNumber } from '../../utils/formatters';
import { can } from '../../utils/permissions';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Building
} from 'lucide-react';

export const AgenciesView: React.FC = () => {
  const { agencies, addAgency, updateAgency, deleteAgency } = useData();
  const { currentUser } = useAuth();
  const { toast, confirm } = useFeedback();

  const isStagiaire = currentUser?.role === 'stagiaire';
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [conventionsCount, setConventionsCount] = useState<number>(0);
  const [cartonsCount, setCartonsCount] = useState<number>(0);
  const [ordre, setOrdre] = useState<number>(1);

  const sorted = [...agencies].sort((a, b) => {
    const ordA = a.ordre ?? 999;
    const ordB = b.ordre ?? 999;
    if (ordA !== ordB) return ordA - ordB;
    return a.nom.localeCompare(b.nom);
  });

  const filtered = sorted.filter(a =>
    a.nom.toLowerCase().includes(search.toLowerCase()) ||
    a.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingAgency(null);
    setCode('');
    setNom('');
    setDescription('');
    setConventionsCount(0);
    setCartonsCount(0);
    setOrdre(agencies.length + 1);
    setShowModal(true);
  };

  const handleOpenEdit = (ag: Agency) => {
    setEditingAgency(ag);
    setCode(ag.code);
    setNom(ag.nom);
    setDescription(ag.description || '');
    setConventionsCount(ag.conventionsCount);
    setCartonsCount(ag.cartonsCount);
    setOrdre(ag.ordre ?? 1);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !nom.trim()) {
      toast('Veuillez saisir un code et un nom d\'agence.', 'error');
      return;
    }

    const trimmedCode = code.trim();
    const duplicate = agencies.find(a => a.id !== editingAgency?.id && a.code.toLowerCase() === trimmedCode.toLowerCase());
    if (duplicate) {
      toast(`Le code d'agence "${trimmedCode}" est déjà utilisé par l'agence "${duplicate.nom}".`, 'error');
      return;
    }

    if (editingAgency) {
      const updated: Agency = {
        ...editingAgency,
        code: code.trim(),
        nom: nom.trim(),
        description: description.trim() || undefined,
        conventionsCount: Number(conventionsCount) || 0,
        cartonsCount: Number(cartonsCount) || 0,
        dossiersCount: Number(conventionsCount) || 0,
        ordre: Number(ordre) || 1
      };
      const res = updateAgency(updated);
      toast(res.message, res.success ? 'success' : 'error');
      if (res.success) setShowModal(false);
    } else {
      const res = addAgency({
        code: code.trim(),
        nom: nom.trim(),
        description: description.trim() || undefined,
        conventionsCount: Number(conventionsCount) || 0,
        cartonsCount: Number(cartonsCount) || 0,
        dossiersCount: Number(conventionsCount) || 0,
        ordre: Number(ordre) || 1,
        statut: 'active'
      });
      toast(res.message, res.success ? 'success' : 'error');
      if (res.success) setShowModal(false);
    }
  };

  const handleDelete = async (ag: Agency) => {
    const ok = await confirm({
      title: 'Supprimer cette agence ?',
      message: `Confirmer la suppression de l'agence "${ag.nom}" (Code ${ag.code}) ?`,
      confirmLabel: 'Supprimer',
      danger: true
    });

    if (ok) {
      const res = deleteAgency(ag.id);
      toast(res.message, res.success ? 'success' : 'error');
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-head">
        <div>
          <h1>Agences</h1>
          <p className="text-muted text-sm" style={{ marginTop: '4px' }}>
            {agencies.length} agence(s) enregistrée(s)
          </p>
        </div>

        {can.editReferentials(currentUser?.role) && (
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} /> Ajouter une agence
          </button>
        )}
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search
          size={16}
          className="text-muted"
          style={{ position: 'absolute', left: '14px', top: '14px' }}
        />
        <input
          type="text"
          placeholder="Rechercher par nom ou code (ex: 901, Bacongo)..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="form-input"
          style={{ paddingLeft: '40px' }}
        />
      </div>

      {/* Table Container */}
      <div className="uba-table-container">
        <table className="uba-table uba-table--cards">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Ordre</th>
              <th style={{ width: '90px' }}>Code</th>
              <th>Nom de l'agence</th>
              <th>Description</th>
              <th style={{ textAlign: 'right' }}>Conventions</th>
              <th style={{ textAlign: 'right' }}>Boîtes</th>
              <th>Statut</th>
              {can.editReferentials(currentUser?.role) && (
                <th style={{ textAlign: 'right', width: '160px' }}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={can.editReferentials(currentUser?.role) ? 8 : 7} style={{ textAlign: 'center', padding: '36px' }} className="text-muted">
                  Aucune agence trouvée.
                </td>
              </tr>
            ) : (
              filtered.map(ag => (
                <tr key={ag.id}>
                  <td data-label="Ordre">
                    <span className="badge badge-outline">#{ag.ordre ?? 1}</span>
                  </td>
                  <td data-label="Code">
                    <span className="badge badge-black">
                      {ag.code}
                    </span>
                  </td>
                  <td data-label="Nom">
                    <strong style={{ color: 'var(--text-1)' }}>{ag.nom}</strong>
                  </td>
                  <td data-label="Description" className="text-muted text-sm">
                    {ag.description || '—'}
                  </td>
                  <td data-label="Conventions" className="num" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--brand-hi)' }}>
                    {formatNumber(ag.conventionsCount)}
                  </td>
                  <td data-label="Boîtes" className="num" style={{ textAlign: 'right', fontWeight: 600 }}>
                    {ag.cartonsCount}
                  </td>
                  <td data-label="Statut">
                    <span className={ag.statut === 'active' ? 'badge badge-green' : 'badge badge-silver'}>
                      {ag.statut === 'active' ? 'Active' : 'Terminée'}
                    </span>
                  </td>
                  {can.editReferentials(currentUser?.role) && (
                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenEdit(ag)}
                          className="btn btn-secondary btn-sm"
                          title="Modifier l'agence"
                        >
                          <Edit2 size={13} /> Modifier
                        </button>
                        {can.deleteData(currentUser?.role) && (
                          <button
                            onClick={() => handleDelete(ag)}
                            className="btn btn-secondary btn-sm btn-icon"
                            style={{ color: 'var(--danger)' }}
                            title="Supprimer l'agence"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add / Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>{editingAgency ? 'Modifier l\'agence' : 'Nouvelle agence'}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-ghost btn-icon"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Code Agence *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: 901"
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
                    placeholder="Ex: City Center"
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
                  placeholder="Ex: Agence Principale - Siège"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Ordre d'affichage</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="form-input num"
                    placeholder="Ex: 1"
                    value={ordre}
                    onChange={e => setOrdre(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Conventions estimées</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="form-input num"
                    value={conventionsCount}
                    onChange={e => setConventionsCount(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Boîtes archivées</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="form-input num"
                    value={cartonsCount}
                    onChange={e => setCartonsCount(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAgency ? 'Enregistrer les modifications' : 'Créer l\'agence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
