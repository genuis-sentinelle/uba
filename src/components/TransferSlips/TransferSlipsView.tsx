import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { TransferSlip, TransferSlipLine } from '../../types';
import { formatNumber, formatDate } from '../../utils/formatters';
import { TransferSlipPrintPreview } from './TransferSlipPrintPreview';
import {
  Truck,
  Plus,
  Printer,
  Trash2,
  Edit2,
  X,
  FileCheck,
  CheckCircle2
} from 'lucide-react';

import { useFeedback } from '../ui/Feedback';

export const TransferSlipsView: React.FC = () => {
  const { transferSlips, agencies, addTransferSlip, updateTransferSlip, deleteTransferSlip } = useData();
  const { currentUser } = useAuth();
  const { confirm, toast } = useFeedback();
  const isStagiaire = currentUser?.role === 'stagiaire';

  const [previewSlip, setPreviewSlip] = useState<TransferSlip | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSlip, setEditingSlip] = useState<TransferSlip | null>(null);

  // Form states — Propres et dynamiques
  const [dateTransfert, setDateTransfert] = useState(new Date().toISOString().split('T')[0]);
  const [chauffeurNom, setChauffeurNom] = useState('');
  const [vehicule, setVehicule] = useState('');
  const [responsableDepart, setResponsableDepart] = useState(
    currentUser ? `${currentUser.nomComplet} (${currentUser.titre || 'Chef de mission'})` : ''
  );
  const [responsableArrivee, setResponsableArrivee] = useState('');
  const [observations, setObservations] = useState('');

  const [lignes, setLignes] = useState<TransferSlipLine[]>([
    { agenceNom: agencies[0]?.nom || 'City Center', code: agencies[0]?.code || '901', exercice: 2022, boites: 0, conventions: 0, traitement: 'Trié & Contrôlé' }
  ]);

  const handleOpenAdd = () => {
    setEditingSlip(null);
    setDateTransfert(new Date().toISOString().split('T')[0]);
    setResponsableDepart(currentUser ? `${currentUser.nomComplet} (${currentUser.titre || 'Chef de mission'})` : '');
    setChauffeurNom('');
    setVehicule('');
    setResponsableArrivee('');
    setObservations('');
    setLignes([
      { agenceNom: agencies[0]?.nom || 'City Center', code: agencies[0]?.code || '901', exercice: 2022, boites: 0, conventions: 0, traitement: 'Trié & Contrôlé' }
    ]);
    setShowModal(true);
  };

  const handleOpenEdit = (slip: TransferSlip) => {
    setEditingSlip(slip);
    setDateTransfert(slip.dateTransfert);
    setChauffeurNom(slip.chauffeurNom);
    setVehicule(slip.vehicule);
    setResponsableDepart(slip.responsableDepart);
    setResponsableArrivee(slip.responsableArrivee);
    setObservations(slip.observations || '');
    setLignes(slip.lignes);
    setShowModal(true);
  };

  const handleAddLine = () => {
    setLignes([
      ...lignes,
      { agenceNom: agencies[0]?.nom || 'City-Center', code: agencies[0]?.code || '901', exercice: 2019, boites: 5, conventions: 500, traitement: 'Conforme' }
    ]);
  };

  const handleUpdateLine = (index: number, field: keyof TransferSlipLine, value: any) => {
    const updated = [...lignes];
    if (field === 'agenceNom') {
      const selected = agencies.find(a => a.nom === value);
      if (selected) {
        updated[index].agenceNom = selected.nom;
        updated[index].code = selected.code;
      }
    } else {
      (updated[index] as any)[field] = value;
    }
    setLignes(updated);
  };

  const handleRemoveLine = (index: number) => {
    setLignes(lignes.filter((_, i) => i !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const totalBoites = lignes.reduce((acc, l) => acc + (Number(l.boites) || 0), 0);
    const totalConventions = lignes.reduce((acc, l) => acc + (Number(l.conventions) || 0), 0);

    if (editingSlip) {
      updateTransferSlip({
        ...editingSlip,
        dateTransfert,
        chauffeurNom,
        vehicule,
        responsableDepart,
        responsableArrivee,
        observations,
        lignes,
        totalBoites,
        totalConventions
      });
    } else {
      addTransferSlip({
        dateTransfert,
        siteDepart: 'Maya-Maya',
        siteArrivee: 'Mazala',
        chauffeurNom,
        vehicule,
        responsableDepart,
        responsableArrivee,
        lignes,
        totalBoites,
        totalConventions,
        statut: 'valide',
        observations
      });
    }
    setShowModal(false);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Bordereaux de Transfert & Décharge
          </h1>
          <div style={{ fontSize: '0.92rem', color: '#D9D9D9', marginTop: '4px' }}>
            {transferSlips.length} bordereau(x) émis (Maya-Maya ⇄ Mazala)
          </div>
        </div>

        {isStagiaire ? (
          <span className="badge badge-black" style={{ padding: '8px 14px', fontSize: '0.85rem', border: '1px solid var(--uba-anthracite)' }}>
            Mode Consultation (Lecture seule)
          </span>
        ) : (
          <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
            <Plus size={15} /> + Nouveau Bordereau
          </button>
        )}
      </div>

      {/* Table */}
      <div className="uba-table-container">
        <table className="uba-table">
          <thead>
            <tr>
              <th>N° Bordereau</th>
              <th>Date</th>
              <th>Itinéraire</th>
              <th>Transporteur</th>
              <th style={{ textAlign: 'right' }}>Boîtes</th>
              <th style={{ textAlign: 'right' }}>Conventions</th>
              <th>Statut</th>
              <th style={{ textAlign: 'right', width: '220px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transferSlips.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#D9D9D9' }}>
                  Aucun bordereau de transfert émis.
                </td>
              </tr>
            ) : (
              transferSlips.map(slip => (
                <tr key={slip.id}>
                  <td>
                    <strong style={{ color: 'var(--uba-red-bright)', fontSize: '0.92rem' }}>{slip.numeroBordereau}</strong>
                  </td>
                  <td style={{ color: '#FFFFFF' }}>{formatDate(slip.dateTransfert)}</td>
                  <td>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>{slip.siteDepart} ➔ {slip.siteArrivee}</span>
                  </td>
                  <td style={{ color: '#D9D9D9', fontSize: '0.85rem' }}>
                    {slip.chauffeurNom}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#FFFFFF' }}>
                    {slip.totalBoites}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--uba-red-bright)', fontSize: '1.05rem' }}>
                    {formatNumber(slip.totalConventions)}
                  </td>
                  <td>
                    <span className="badge badge-white">Déchargé & Validé</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => setPreviewSlip(slip)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '5px 8px' }}
                        title="Imprimer le bordereau A4"
                      >
                        <Printer size={13} /> Imprimer A4
                      </button>
                      {!isStagiaire && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(slip)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '5px 8px' }}
                            title="Modifier"
                          >
                            <Edit2 size={13} /> Modifier
                          </button>
                          <button
                            onClick={async () => {
                              const ok = await confirm({
                                title: 'Supprimer ce bordereau ?',
                                message: `Supprimer le bordereau ${slip.numeroBordereau} ?`,
                                confirmLabel: 'Supprimer',
                                danger: true
                              });
                              if (ok) {
                                deleteTransferSlip(slip.id);
                                toast(`Bordereau ${slip.numeroBordereau} supprimé.`, 'info');
                              }
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '5px 8px', color: '#DC2626' }}
                            title="Supprimer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
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
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                {editingSlip ? 'Modifier le bordereau' : 'Émettre un bordereau de décharge'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D9D9D9' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Date du transfert</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dateTransfert}
                    onChange={e => setDateTransfert(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Chauffeur / Transporteur</label>
                  <input
                    type="text"
                    className="form-input"
                    value={chauffeurNom}
                    onChange={e => setChauffeurNom(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Véhicule / Immatriculation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={vehicule}
                    onChange={e => setVehicule(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Responsable à l'arrivée (Mazala)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={responsableArrivee}
                    onChange={e => setResponsableArrivee(e.target.value)}
                  />
                </div>
              </div>

              {/* Lignes d'agences */}
              <div style={{ marginTop: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Lots d'archives à charger</label>
                  <button type="button" onClick={handleAddLine} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }}>
                    + Ajouter une ligne
                  </button>
                </div>

                {lignes.map((l, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 80px 70px 90px 30px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                    <select
                      className="form-select"
                      value={l.agenceNom}
                      onChange={e => handleUpdateLine(i, 'agenceNom', e.target.value)}
                    >
                      {agencies.map(a => (
                        <option key={a.id} value={a.nom}>{a.nom} ({a.code})</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Année"
                      className="form-input"
                      value={l.exercice}
                      onChange={e => handleUpdateLine(i, 'exercice', Number(e.target.value))}
                    />
                    <input
                      type="number"
                      placeholder="Boîtes"
                      className="form-input"
                      value={l.boites}
                      onChange={e => handleUpdateLine(i, 'boites', Number(e.target.value))}
                    />
                    <input
                      type="number"
                      placeholder="Conventions"
                      className="form-input"
                      value={l.conventions}
                      onChange={e => handleUpdateLine(i, 'conventions', Number(e.target.value))}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(i)}
                      style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Observations</label>
                <input
                  type="text"
                  className="form-input"
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingSlip ? 'Enregistrer les modifications' : 'Émettre le bordereau'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {previewSlip && (
        <TransferSlipPrintPreview
          slip={previewSlip}
          onClose={() => setPreviewSlip(null)}
        />
      )}
    </div>
  );
};
