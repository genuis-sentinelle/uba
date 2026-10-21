import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ArchiveIncident } from '../../types';
import { can } from '../../utils/permissions';
import { formatDate } from '../../utils/formatters';
import {
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  Clock,
  ShieldAlert
} from 'lucide-react';

import { useFeedback } from '../ui/Feedback';

export const IncidentsView: React.FC = () => {
  const { incidents, agencies, addIncident, updateIncident, deleteIncident } = useData();
  const { currentUser } = useAuth();
  const { confirm, toast } = useFeedback();
  const isStagiaire = currentUser?.role === 'stagiaire';

  const [showModal, setShowModal] = useState(false);
  const [editingIncident, setEditingIncident] = useState<ArchiveIncident | null>(null);

  // Form states
  const [titre, setTitre] = useState('');
  const [agenceNom, setAgenceNom] = useState(agencies[0]?.nom || 'City-Center');
  const [severite, setSeverite] = useState<ArchiveIncident['severite']>('moyen');
  const [statut, setStatut] = useState<ArchiveIncident['statut']>('signale');
  const [description, setDescription] = useState('');
  const [actionsPrises, setActionsPrises] = useState('');
  const [signalePar, setSignalePar] = useState('Superviseur');

  const handleOpenAdd = () => {
    setEditingIncident(null);
    setTitre('');
    setAgenceNom(agencies[0]?.nom || 'City-Center');
    setSeverite('moyen');
    setStatut('signale');
    setDescription('');
    setActionsPrises('');
    setSignalePar('Superviseur');
    setShowModal(true);
  };

  const handleOpenEdit = (inc: ArchiveIncident) => {
    setEditingIncident(inc);
    setTitre(inc.titre);
    setAgenceNom(inc.agenceNom);
    setSeverite(inc.severite);
    setStatut(inc.statut);
    setDescription(inc.description);
    setActionsPrises(inc.actionsPrises || '');
    setSignalePar(inc.signalePar);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) return;

    const agenceObj = agencies.find(a => a.nom === agenceNom);
    const code = agenceObj?.code || '900';

    if (editingIncident) {
      updateIncident({
        ...editingIncident,
        titre: titre.trim(),
        agenceNom,
        code,
        severite,
        statut,
        description,
        actionsPrises: actionsPrises.trim() || undefined,
        signalePar
      });
    } else {
      addIncident({
        titre: titre.trim(),
        agenceNom,
        code,
        severite,
        statut,
        description,
        actionsPrises: actionsPrises.trim() || undefined,
        signalePar
      });
    }
    setShowModal(false);
  };

  const handleDelete = async (inc: ArchiveIncident) => {
    const ok = await confirm({
      title: 'Supprimer cet incident ?',
      message: `Supprimer l'incident "${inc.titre}" ?`,
      confirmLabel: 'Supprimer',
      danger: true
    });
    if (ok) {
      deleteIncident(inc.id);
      toast(`Incident "${inc.titre}" supprimé.`, 'info');
    }
  };

  const handleToggleResolve = (inc: ArchiveIncident) => {
    updateIncident({
      ...inc,
      statut: inc.statut === 'resolu' ? 'en_cours' : 'resolu'
    });
  };

  const getSeveriteBadge = (sev: string) => {
    switch (sev) {
      case 'critique':
        return <span className="badge badge-red" style={{ backgroundColor: '#B42318', color: '#FFFFFF' }}>Critique</span>;
      case 'moyen':
        return <span className="badge badge-red">Moyen</span>;
      default:
        return <span className="badge badge-gray">Faible</span>;
    }
  };

  const getStatutBadge = (st: string) => {
    switch (st) {
      case 'resolu':
        return <span className="badge badge-white"><CheckCircle2 size={12} /> Résolu</span>;
      case 'en_cours':
        return <span className="badge badge-black"><Clock size={12} /> En cours</span>;
      default:
        return <span className="badge badge-gray"><AlertTriangle size={12} /> Signalé</span>;
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Incidents & Anomalies d'Archives
          </h1>
          <div style={{ fontSize: '0.92rem', color: '#D9D9D9', marginTop: '4px' }}>
            {incidents.length} incident(s) répertorié(s)
          </div>
        </div>

        {isStagiaire ? (
          <span className="badge badge-black" style={{ padding: '8px 14px', fontSize: '0.85rem', border: '1px solid var(--uba-anthracite)' }}>
            Mode Consultation (Lecture seule)
          </span>
        ) : (
          <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
            <Plus size={15} /> + Signaler un Incident
          </button>
        )}
      </div>

      {/* Table */}
      <div className="uba-table-container">
        <table className="uba-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Intitulé de l'incident</th>
              <th>Agence concernée</th>
              <th>Sévérité</th>
              <th>Statut</th>
              <th>Constat / Actions</th>
              <th>Signalé par</th>
              <th style={{ textAlign: 'right', width: '180px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#D9D9D9' }}>
                  Aucun incident actif.
                </td>
              </tr>
            ) : (
              incidents.map(inc => (
                <tr key={inc.id}>
                  <td style={{ fontSize: '0.85rem', color: '#D9D9D9', whiteSpace: 'nowrap' }}>
                    {formatDate(inc.dateSignalement)}
                  </td>
                  <td>
                    <strong style={{ color: '#FFFFFF', fontSize: '0.95rem' }}>{inc.titre}</strong>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{inc.agenceNom}</span>
                    <span style={{ fontSize: '0.8rem', color: '#D9D9D9', marginLeft: '4px' }}>({inc.code})</span>
                  </td>
                  <td>{getSeveriteBadge(inc.severite)}</td>
                  <td>{getStatutBadge(inc.statut)}</td>
                  <td style={{ fontSize: '0.85rem', color: '#D9D9D9', maxWidth: '280px' }}>
                    <div>{inc.description}</div>
                    {inc.actionsPrises && (
                      <div style={{ color: 'var(--uba-red-bright)', fontWeight: 700, fontSize: '0.82rem', marginTop: '3px' }}>
                        Action : {inc.actionsPrises}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#D9D9D9' }}>{inc.signalePar}</td>
                  <td style={{ textAlign: 'right' }}>
                    {!isStagiaire ? (
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => handleToggleResolve(inc)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 8px', color: '#FFFFFF' }}
                          title={inc.statut === 'resolu' ? 'Rouvrir' : 'Marquer comme résolu'}
                        >
                          <CheckCircle2 size={13} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(inc)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 8px' }}
                          title="Modifier"
                        >
                          <Edit2 size={13} />
                        </button>
                        {can.deleteData(currentUser?.role) && (
                          <button
                            onClick={() => handleDelete(inc)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '5px 8px', color: '#DC2626' }}
                            title="Supprimer"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
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
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#101828', margin: 0 }}>
                {editingIncident ? 'Modifier l\'incident' : 'Signaler une anomalie d\'archives'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667085' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Titre de l'incident *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Cartons détériorés à l'arrivée"
                  value={titre}
                  onChange={e => setTitre(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Agence concernée</label>
                  <select
                    className="form-select"
                    value={agenceNom}
                    onChange={e => setAgenceNom(e.target.value)}
                  >
                    {agencies.map(a => (
                      <option key={a.id} value={a.nom}>{a.nom} ({a.code})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Niveau de sévérité</label>
                  <select
                    className="form-select"
                    value={severite}
                    onChange={e => setSeverite(e.target.value as any)}
                  >
                    <option value="faible">Faible</option>
                    <option value="moyen">Moyen</option>
                    <option value="critique">Critique (Bloquant)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description du constat</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Détails précis de l'anomalie observée..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Actions correctives engagées</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Renforcement et reconditionnement..."
                  value={actionsPrises}
                  onChange={e => setActionsPrises(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Signalé par</label>
                  <input
                    type="text"
                    className="form-input"
                    value={signalePar}
                    onChange={e => setSignalePar(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Statut actuel</label>
                  <select
                    className="form-select"
                    value={statut}
                    onChange={e => setStatut(e.target.value as any)}
                  >
                    <option value="signale">Signalé</option>
                    <option value="en_cours">En cours de traitement</option>
                    <option value="resolu">Résolu</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingIncident ? 'Enregistrer les modifications' : 'Enregistrer l\'incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
