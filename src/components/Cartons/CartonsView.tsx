import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { CartonInventory } from '../../types';
import { can } from '../../utils/permissions';
import { formatNumber, formatDate } from '../../utils/formatters';
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  Printer,
  X,
  MapPin,
  CheckCircle2,
  Boxes
} from 'lucide-react';

import { useFeedback } from '../ui/Feedback';
import { AgencyAutocomplete } from '../ui/AgencyAutocomplete';

export const CartonsView: React.FC = () => {
  const { cartons, agencies, addCarton, updateCarton, deleteCarton } = useData();
  const { currentUser } = useAuth();
  const { confirm, toast } = useFeedback();
  const isStagiaire = currentUser?.role === 'stagiaire';

  const [showModal, setShowModal] = useState(false);
  const [editingCarton, setEditingCarton] = useState<CartonInventory | null>(null);
  const [labelCarton, setLabelCarton] = useState<CartonInventory | null>(null);

  // Form states
  const [numeroCarton, setNumeroCarton] = useState('');
  const [agenceId, setAgenceId] = useState(agencies[0]?.id || '');
  const [agenceNom, setAgenceNom] = useState(agencies[0]?.nom || 'City-Center');
  const [exercice, setExercice] = useState(2018);
  const [boitesCount, setBoitesCount] = useState(1);
  const [conventionsEstimees, setConventionsEstimees] = useState(100);
  const [emplacement, setEmplacement] = useState('Allée A · Travée 1 · Étagère 1');
  const [site, setSite] = useState<'Mazala' | 'Maya-Maya'>('Mazala');
  const [etat, setEtat] = useState<'bon' | 'abime' | 'a_verifier'>('bon');
  const [notes, setNotes] = useState('');

  // Nouveaux champs de gestion des boîtes & tri
  const [boitesDatees, setBoitesDatees] = useState<number>(0);
  const [boitesNonDatees, setBoitesNonDatees] = useState<number>(0);
  const [boitesRecues, setBoitesRecues] = useState<number>(0);
  const [boitesNonTriees, setBoitesNonTriees] = useState<number>(0);
  const [statutTri, setStatutTri] = useState<'non_commence' | 'en_cours' | 'termine'>('termine');

  const handleOpenAdd = () => {
    setEditingCarton(null);
    const prefix = site === 'Mazala' ? 'MZL' : 'MYM';
    const agenceObj = agencies.find(a => a.id === agenceId) || agencies[0];
    const code = agenceObj?.code || '901';
    setAgenceId(agenceObj?.id || '');
    setAgenceNom(agenceObj?.nom || 'City-Center');
    setNumeroCarton(`${prefix}-${code}-${exercice}-${Math.floor(Math.random() * 90 + 10)}`);
    setExercice(2018);
    setBoitesCount(1);
    setConventionsEstimees(150);
    setEmplacement('Allée A · Travée 1 · Étagère 1');
    setSite('Mazala');
    setEtat('bon');
    setNotes('');
    setBoitesDatees(0);
    setBoitesNonDatees(0);
    setBoitesRecues(1);
    setBoitesNonTriees(0);
    setStatutTri('en_cours');
    setShowModal(true);
  };

  const handleOpenEdit = (c: CartonInventory) => {
    setEditingCarton(c);
    const foundAg = agencies.find(a => a.nom === c.agenceNom || a.code === c.code);
    setAgenceId(foundAg?.id || '');
    setNumeroCarton(c.numeroCarton);
    setAgenceNom(c.agenceNom);
    setExercice(c.exercice);
    setBoitesCount(c.boitesCount);
    setConventionsEstimees(c.conventionsEstimees);
    setEmplacement(c.emplacement);
    setSite(c.site);
    setEtat(c.etat);
    setNotes(c.notes || '');
    setBoitesDatees(c.boitesDatees ?? 0);
    setBoitesNonDatees(c.boitesNonDatees ?? 0);
    setBoitesRecues(c.boitesRecues ?? c.boitesCount);
    setBoitesNonTriees(c.boitesNonTriees ?? 0);
    setStatutTri(c.statutTri ?? 'termine');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroCarton.trim()) return;

    const agenceObj = agencies.find(a => a.id === agenceId || a.nom === agenceNom);
    const code = agenceObj?.code || '901';
    const cleanNom = agenceObj?.nom || agenceNom;

    if (editingCarton) {
      updateCarton({
        ...editingCarton,
        numeroCarton: numeroCarton.trim(),
        agenceNom: cleanNom,
        code,
        exercice: Number(exercice) || 2018,
        boitesCount: Number(boitesCount) || 1,
        conventionsEstimees: Number(conventionsEstimees) || 0,
        emplacement,
        site,
        etat,
        notes: notes.trim() || undefined,
        boitesDatees: Number(boitesDatees) || 0,
        boitesNonDatees: Number(boitesNonDatees) || 0,
        boitesRecues: Number(boitesRecues) || 0,
        boitesNonTriees: Number(boitesNonTriees) || 0,
        statutTri
      });
    } else {
      addCarton({
        numeroCarton: numeroCarton.trim(),
        agenceNom: cleanNom,
        code,
        exercice: Number(exercice) || 2018,
        boitesCount: Number(boitesCount) || 1,
        conventionsEstimees: Number(conventionsEstimees) || 0,
        emplacement,
        site,
        etat,
        notes: notes.trim() || undefined,
        boitesDatees: Number(boitesDatees) || 0,
        boitesNonDatees: Number(boitesNonDatees) || 0,
        boitesRecues: Number(boitesRecues) || 0,
        boitesNonTriees: Number(boitesNonTriees) || 0,
        statutTri
      });
    }
    setShowModal(false);
  };

  const handleDelete = async (c: CartonInventory) => {
    const ok = await confirm({
      title: 'Supprimer ce carton ?',
      message: `Supprimer le carton ${c.numeroCarton} de l'inventaire ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      danger: true
    });
    if (ok) {
      deleteCarton(c.id);
      toast(`Carton ${c.numeroCarton} supprimé de l'inventaire.`, 'info');
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Inventaire des Cartons & Rayonnage
          </h1>
          <div style={{ fontSize: '0.92rem', color: '#D9D9D9', marginTop: '4px' }}>
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
        <table className="uba-table uba-table--cards">
          <thead>
            <tr>
              <th>Numéro de Carton</th>
              <th>Agence & Code</th>
              <th>Exercice</th>
              <th>Emplacement Physique</th>
              <th>Site</th>
              <th style={{ textAlign: 'right' }}>Conventions</th>
              <th style={{ textAlign: 'center' }}>Boîtes (Reçues / Datées / Non datées)</th>
              <th>Statut Tri</th>
              <th>État</th>
              <th style={{ textAlign: 'right', width: '200px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cartons.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-3)' }}>
                  Aucun carton inventorié.
                </td>
              </tr>
            ) : (
              cartons.map(c => (
                <tr key={c.id}>
                  <td data-label="Carton">
                    <strong style={{ color: 'var(--brand-hi)', fontSize: '0.92rem' }}>{c.numeroCarton}</strong>
                  </td>
                  <td data-label="Agence">
                    <strong style={{ color: 'var(--text-1)' }}>{c.agenceNom}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginLeft: '4px' }}>({c.code})</span>
                  </td>
                  <td data-label="Exercice" style={{ color: 'var(--text-1)' }}>{c.exercice}</td>
                  <td data-label="Emplacement">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-1)' }}>
                      <MapPin size={13} color="var(--brand-hi)" /> {c.emplacement}
                    </span>
                  </td>
                  <td data-label="Site">
                    <span className="badge badge-black">{c.site}</span>
                  </td>
                  <td data-label="Conventions" style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-1)' }}>
                    {formatNumber(c.conventionsEstimees)}
                  </td>
                  <td data-label="Boîtes" style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span className="badge badge-silver" title="Total boîtes reçues">
                        {c.boitesRecues ?? c.boitesCount ?? 1} reçue(s)
                      </span>
                      {(c.boitesDatees !== undefined || c.boitesNonDatees !== undefined) && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>
                          ({c.boitesDatees ?? 0} dat. / {c.boitesNonDatees ?? 0} non dat.)
                        </span>
                      )}
                    </div>
                  </td>
                  <td data-label="Statut Tri">
                    <span className={
                      c.statutTri === 'termine'
                        ? 'badge badge-green'
                        : c.statutTri === 'en_cours'
                        ? 'badge badge-gold'
                        : 'badge badge-silver'
                    }>
                      {c.statutTri === 'termine' ? 'Tri terminé' : c.statutTri === 'en_cours' ? 'Tri en cours' : 'Non commencé'}
                    </span>
                  </td>
                  <td data-label="État">
                    <span className={c.etat === 'bon' ? 'badge badge-white' : c.etat === 'abime' ? 'badge badge-red' : 'badge badge-gray'}>
                      {c.etat === 'bon' ? 'Bon état' : c.etat === 'abime' ? 'Abîmé' : 'À vérifier'}
                    </span>
                  </td>
                  <td data-label="Actions" style={{ textAlign: 'right' }}>
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
                          {can.deleteData(currentUser?.role) && (
                            <button
                              onClick={() => handleDelete(c)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '5px 8px', color: '#DC2626' }}
                              title="Supprimer"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
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
                  <label className="form-label">Agence rattachement *</label>
                  <AgencyAutocomplete
                    agencies={agencies}
                    value={agenceId}
                    onChange={ag => {
                      if (ag) {
                        setAgenceId(ag.id);
                        setAgenceNom(ag.nom);
                      } else {
                        setAgenceId('');
                        setAgenceNom('');
                      }
                    }}
                    placeholder="Sélectionner l'agence..."
                  />
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

              {/* Bloc de gestion des boîtes et statut de tri */}
              <div className="card" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--line)', marginBottom: '14px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Boxes size={16} color="var(--brand-hi)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-1)' }}>
                    Suivi des Boîtes & Statut de Tri
                  </span>
                </div>

                <div className="grid-2" style={{ marginBottom: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label text-xs">Statut du tri des boîtes</label>
                    <select
                      className="form-select"
                      value={statutTri}
                      onChange={e => setStatutTri(e.target.value as any)}
                    >
                      <option value="non_commence">Non commencé</option>
                      <option value="en_cours">Tri en cours</option>
                      <option value="termine">Tri terminé</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label text-xs">Nombre total de boîtes reçues</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="form-input num"
                      value={boitesRecues}
                      onChange={e => {
                        const val = Math.max(0, Number(e.target.value));
                        setBoitesRecues(val);
                        setBoitesCount(val);
                      }}
                    />
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label text-xs">Boîtes datées</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="form-input num"
                      value={boitesDatees}
                      onChange={e => setBoitesDatees(Math.max(0, Number(e.target.value)))}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label text-xs">Boîtes non datées</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="form-input num"
                      value={boitesNonDatees}
                      onChange={e => setBoitesNonDatees(Math.max(0, Number(e.target.value)))}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label text-xs">Tri non terminé</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="form-input num"
                      value={boitesNonTriees}
                      onChange={e => setBoitesNonTriees(Math.max(0, Number(e.target.value)))}
                    />
                  </div>
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
              <button
                onClick={() => {
                  if (isStagiaire) {
                    toast('Impression non autorisée pour ce profil (Lecture Seule).', 'error');
                    return;
                  }
                  window.print();
                }}
                className="btn btn-primary btn-sm"
                style={{ width: '100%' }}
                disabled={isStagiaire}
                title={isStagiaire ? "Impression réservée aux administrateurs" : "Imprimer l'étiquette"}
              >
                <Printer size={15} /> Imprimer l'étiquette
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
