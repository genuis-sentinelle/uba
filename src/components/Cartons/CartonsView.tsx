import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { CartonInventory } from '../../types';
import { formatNumber, formatDate } from '../../utils/formatters';
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  Printer,
  X,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export const CartonsView: React.FC = () => {
  const { cartons, agencies, addCarton, updateCarton, deleteCarton } = useData();
  const { currentUser } = useAuth();
  const isStagiaire = currentUser?.role === 'stagiaire' || currentUser?.role === 'user';

  const [showModal, setShowModal] = useState(false);
  const [editingCarton, setEditingCarton] = useState<CartonInventory | null>(null);
  const [labelCarton, setLabelCarton] = useState<CartonInventory | null>(null);

  // Form states
  const [numeroCarton, setNumeroCarton] = useState('');
  const [agenceNom, setAgenceNom] = useState(agencies[0]?.nom || 'City-Center');
  const [exercice, setExercice] = useState(2018);
  const [boitesCount, setBoitesCount] = useState(1);
  const [conventionsEstimees, setConventionsEstimees] = useState(100);
  const [emplacement, setEmplacement] = useState('Allée A · Travée 1 · Étagère 1');
  const [site, setSite] = useState<'Mazala' | 'Maya-Maya'>('Mazala');
  const [etat, setEtat] = useState<'bon' | 'abime' | 'a_verifier'>('bon');
  const [notes, setNotes] = useState('');

  const handleOpenAdd = () => {
    setEditingCarton(null);
    const prefix = site === 'Mazala' ? 'MZL' : 'MYM';
    const agenceObj = agencies.find(a => a.nom === agenceNom);
    const code = agenceObj?.code || '901';
    setNumeroCarton(`${prefix}-${code}-${exercice}-${Math.floor(Math.random() * 90 + 10)}`);
    setExercice(2018);
    setBoitesCount(1);
    setConventionsEstimees(150);
    setEmplacement('Allée A · Travée 1 · Étagère 1');
    setSite('Mazala');
    setEtat('bon');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (c: CartonInventory) => {
    setEditingCarton(c);
    setNumeroCarton(c.numeroCarton);
    setAgenceNom(c.agenceNom);
    setExercice(c.exercice);
    setBoitesCount(c.boitesCount);
    setConventionsEstimees(c.conventionsEstimees);
    setEmplacement(c.emplacement);
    setSite(c.site);
    setEtat(c.etat);
    setNotes(c.notes || '');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroCarton.trim()) return;

    const agenceObj = agencies.find(a => a.nom === agenceNom);
    const code = agenceObj?.code || '901';

    if (editingCarton) {
      updateCarton({
        ...editingCarton,
        numeroCarton: numeroCarton.trim(),
        agenceNom,
        code,
        exercice: Number(exercice) || 2018,
        boitesCount: Number(boitesCount) || 1,
        conventionsEstimees: Number(conventionsEstimees) || 0,
        emplacement,
        site,
        etat,
        notes: notes.trim() || undefined
      });
    } else {
      addCarton({
        numeroCarton: numeroCarton.trim(),
        agenceNom,
        code,
        exercice: Number(exercice) || 2018,
        boitesCount: Number(boitesCount) || 1,
        conventionsEstimees: Number(conventionsEstimees) || 0,
        emplacement,
        site,
        etat,
        notes: notes.trim() || undefined
      });
    }
    setShowModal(false);
  };

  const handleDelete = (c: CartonInventory) => {
    if (window.confirm(`Supprimer le carton ${c.numeroCarton} de l'inventaire ?`)) {
      deleteCarton(c.id);
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Inventaire des Cartons & Rayonnage
          </h1>
          <div style={{ fontSize: '0.95rem', color: '#D9D9D9', marginTop: '4px' }}>
            {cartons.length} carton(s) répertorié(s) (Sites Mazala & Maya-Maya)
          </div>
        </div>

        {isStagiaire ? (
          <span className="badge badge-black" style={{ padding: '8px 14px', fontSize: '0.85rem', border: '1px solid var(--uba-anthracite)' }}>
            Mode Consultation (Lecture seule)
          </span>
        ) : (
          <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
            <Plus size={15} /> + Répertorier un Carton
          </button>
        )}
      </div>

      {/* Table */}
      <div className="uba-table-container">
        <table className="uba-table">
          <thead>
            <tr>
              <th>Numéro de Carton</th>
              <th>Agence & Code</th>
              <th>Exercice</th>
              <th>Emplacement Physique</th>
              <th>Site</th>
              <th style={{ textAlign: 'right' }}>Conventions</th>
              <th>État</th>
              <th style={{ textAlign: 'right', width: '200px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cartons.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#D9D9D9' }}>
                  Aucun carton inventorié.
                </td>
              </tr>
            ) : (
              cartons.map(c => (
                <tr key={c.id}>
                  <td>
                    <strong style={{ color: 'var(--uba-red-bright)', fontSize: '0.92rem' }}>{c.numeroCarton}</strong>
                  </td>
                  <td>
                    <strong style={{ color: '#FFFFFF' }}>{c.agenceNom}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#D9D9D9', marginLeft: '4px' }}>({c.code})</span>
                  </td>
                  <td style={{ color: '#FFFFFF' }}>{c.exercice}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>
                      <MapPin size={13} color="var(--uba-red-bright)" /> {c.emplacement}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-black">{c.site}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#FFFFFF' }}>
                    {formatNumber(c.conventionsEstimees)}
                  </td>
                  <td>
                    <span className={c.etat === 'bon' ? 'badge badge-white' : c.etat === 'abime' ? 'badge badge-red' : 'badge badge-gray'}>
                      {c.etat === 'bon' ? 'Bon état' : c.etat === 'abime' ? 'Abîmé' : 'À vérifier'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => setLabelCarton(c)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '5px 8px' }}
                        title="Imprimer l'étiquette de carton"
                      >
                        <Printer size={13} /> Étiquette
                      </button>
                      {!isStagiaire && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '5px 8px' }}
                            title="Modifier"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
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
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#101828', margin: 0 }}>
                {editingCarton ? 'Modifier le carton' : 'Répertorier un carton'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667085' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Numéro d'identification unique</label>
                <input
                  type="text"
                  className="form-input"
                  value={numeroCarton}
                  onChange={e => setNumeroCarton(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Agence</label>
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
                  <label className="form-label">Exercice comptable</label>
                  <input
                    type="number"
                    className="form-input"
                    value={exercice}
                    onChange={e => setExercice(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Emplacement précis (Allée / Travée / Étagère)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Allée B · Travée 3 · Étagère 2"
                  value={emplacement}
                  onChange={e => setEmplacement(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Site de stockage</label>
                  <select
                    className="form-select"
                    value={site}
                    onChange={e => setSite(e.target.value as any)}
                  >
                    <option value="Mazala">Mazala</option>
                    <option value="Maya-Maya">Maya-Maya</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Conventions estimées</label>
                  <input
                    type="number"
                    className="form-input"
                    value={conventionsEstimees}
                    onChange={e => setConventionsEstimees(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">État physique</label>
                  <select
                    className="form-select"
                    value={etat}
                    onChange={e => setEtat(e.target.value as any)}
                  >
                    <option value="bon">Bon état</option>
                    <option value="abime">Abîmé</option>
                    <option value="a_verifier">À vérifier</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes de conditionnement</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Liasses contrôlées..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingCarton ? 'Enregistrer les modifications' : 'Enregistrer le carton'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Printable Label for Box */}
      {labelCarton && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className="badge badge-red">Étiquette de Carton UBA</span>
              <button onClick={() => setLabelCarton(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Printable Sticker — Noir, Rouge, Blanc */}
            <div
              id="carton-label-printable"
              style={{
                border: '3px solid #E41E26',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#0A0A0A',
                color: '#FFFFFF',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.7)'
              }}
            >
              <div style={{ backgroundColor: '#E41E26', color: '#FFFFFF', padding: '8px', fontWeight: 900, fontSize: '1.15rem', letterSpacing: '0.04em', borderRadius: '4px', marginBottom: '12px' }}>
                UBA CONGO · ARCHIVES
              </div>

              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--uba-red-bright)', letterSpacing: '0.02em', margin: '8px 0' }}>
                {labelCarton.numeroCarton}
              </div>

              <div style={{ borderTop: '1px dashed #303030', borderBottom: '1px dashed #303030', padding: '10px 0', margin: '10px 0', fontSize: '0.92rem' }}>
                <div><strong>AGENCE :</strong> {labelCarton.agenceNom} ({labelCarton.code})</div>
                <div><strong>EXERCICE :</strong> {labelCarton.exercice}</div>
                <div><strong>CONVENTIONS :</strong> {formatNumber(labelCarton.conventionsEstimees)}</div>
              </div>

              <div style={{ backgroundColor: '#161616', border: '1px solid #303030', padding: '8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--uba-red-bright)' }}>
                📍 {labelCarton.emplacement}
              </div>

              <div style={{ fontSize: '0.75rem', color: '#A6A6A6', marginTop: '10px' }}>
                Site : {labelCarton.site} · Archivé le {formatDate(labelCarton.dateEnregistrement)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => window.print()} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                <Printer size={15} /> Imprimer l'étiquette
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
