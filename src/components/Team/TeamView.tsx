import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { TeamMember } from '../../types';
import { Users, Plus, Edit2, Trash2, Search, X, MapPin } from 'lucide-react';

export const TeamView: React.FC = () => {
  const { teamMembers, addTeamMember, updateTeamMember, deleteTeamMember } = useData();
  const { currentUser } = useAuth();
  const isStagiaire = currentUser?.role === 'stagiaire' || currentUser?.role === 'user';

  const [search, setSearch] = useState('');
  const [filterSite, setFilterSite] = useState<'all' | 'Maya-Maya' | 'Mazala'>('all');

  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Form states
  const [nomOfficiel, setNomOfficiel] = useState('');
  const [aliasStr, setAliasStr] = useState('');
  const [categorie, setCategorie] = useState<TeamMember['categorie']>('ancien_stagiaire');
  const [site, setSite] = useState<'Maya-Maya' | 'Mazala'>('Maya-Maya');

  const filtered = teamMembers.filter(m => {
    const matchesSearch =
      m.nomOfficiel.toLowerCase().includes(search.toLowerCase()) ||
      (m.alias && m.alias.some(a => a.toLowerCase().includes(search.toLowerCase())));
    const matchesSite = filterSite === 'all' || m.site === filterSite;
    return matchesSearch && matchesSite;
  });

  const handleOpenAdd = () => {
    setEditingMember(null);
    setNomOfficiel('');
    setAliasStr('');
    setCategorie('ancien_stagiaire');
    setSite('Maya-Maya');
    setShowModal(true);
  };

  const handleOpenEdit = (m: TeamMember) => {
    setEditingMember(m);
    setNomOfficiel(m.nomOfficiel);
    setAliasStr(m.alias ? m.alias.join(', ') : '');
    setCategorie(m.categorie);
    setSite(m.site);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomOfficiel.trim()) return;

    const aliases = aliasStr.split(',').map(s => s.trim()).filter(Boolean);

    if (editingMember) {
      updateTeamMember({
        ...editingMember,
        nomOfficiel: nomOfficiel.trim(),
        alias: aliases.length > 0 ? aliases : undefined,
        categorie,
        site
      });
    } else {
      addTeamMember({
        nomOfficiel: nomOfficiel.trim(),
        alias: aliases.length > 0 ? aliases : undefined,
        categorie,
        site,
        actif: true
      });
    }
    setShowModal(false);
  };

  const handleDelete = (m: TeamMember) => {
    if (window.confirm(`Supprimer ${m.nomOfficiel} de la liste de l'équipe ?`)) {
      deleteTeamMember(m.id);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'chef':
        return <span className="badge badge-red">Chef d'équipe</span>;
      case 'superviseur':
        return <span className="badge badge-black">Superviseur</span>;
      case 'ancien_stagiaire':
        return <span className="badge badge-gray">Ancien Stagiaire</span>;
      default:
        return <span className="badge badge-gray">Nouveau Stagiaire</span>;
    }
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Équipe Archiviste
          </h1>
          <div style={{ fontSize: '0.95rem', color: '#D9D9D9', marginTop: '4px' }}>
            {teamMembers.length} membre(s) répertorié(s) (Sites Maya-Maya & Mazala)
          </div>
        </div>

        {isStagiaire ? (
          <span className="badge badge-black" style={{ padding: '8px 14px', fontSize: '0.85rem', border: '1px solid var(--uba-anthracite)' }}>
            Mode Consultation (Lecture seule)
          </span>
        ) : (
          <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
            <Plus size={15} /> + Ajouter un membre
          </button>
        )}
      </div>

      {/* Search and filters — Dark Glass */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '18px',
        backgroundColor: 'rgba(14, 14, 14, 0.85)',
        padding: '10px 16px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <Search size={16} color="#D9D9D9" />
        <input
          type="text"
          placeholder="Rechercher par nom ou alias (ex: Fred, Duschane)..."
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

        <div style={{ display: 'flex', gap: '6px' }}>
          {(['all', 'Maya-Maya', 'Mazala'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterSite(s)}
              style={{
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: filterSite === s ? 'var(--uba-red)' : 'var(--uba-anthracite)',
                color: '#FFFFFF'
              }}
            >
              {s === 'all' ? 'Tous' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="uba-table-container">
        <table className="uba-table">
          <thead>
            <tr>
              <th>Nom officiel</th>
              <th>Alias / Orthographes connues</th>
              <th>Catégorie</th>
              <th>Site d'affectation</th>
              <th style={{ textAlign: 'right', width: '160px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#D9D9D9' }}>
                  Aucun membre trouvé.
                </td>
              </tr>
            ) : (
              filtered.map(m => (
                <tr key={m.id}>
                  <td>
                    <strong style={{ color: '#FFFFFF', fontSize: '0.95rem' }}>{m.nomOfficiel}</strong>
                  </td>
                  <td>
                    {m.alias && m.alias.length > 0 ? (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {m.alias.map((a, i) => (
                          <span key={i} className="badge badge-gray" style={{ fontSize: '0.75rem' }}>
                            {a}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#A6A6A6', fontSize: '0.85rem' }}>—</span>
                    )}
                  </td>
                  <td>{getCategoryBadge(m.categorie)}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: m.site === 'Mazala' ? 'var(--uba-red-bright)' : '#FFFFFF'
                    }}>
                      <MapPin size={13} color={m.site === 'Mazala' ? 'var(--uba-red-bright)' : 'var(--uba-silver-light)'} /> {m.site}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {!isStagiaire ? (
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 8px' }}
                          title="Modifier"
                        >
                          <Edit2 size={13} /> Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 8px', color: '#DC2626' }}
                          title="Supprimer"
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
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#101828', margin: 0 }}>
                {editingMember ? 'Modifier le membre' : 'Nouveau membre de l\'équipe'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667085' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nom officiel *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Thony Obaki"
                  value={nomOfficiel}
                  onChange={e => setNomOfficiel(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Alias connus (séparés par une virgule)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Tony Obaki, Monsieur Tony"
                  value={aliasStr}
                  onChange={e => setAliasStr(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Rôle / Catégorie</label>
                  <select
                    className="form-select"
                    value={categorie}
                    onChange={e => setCategorie(e.target.value as any)}
                  >
                    <option value="chef">Chef d'équipe</option>
                    <option value="superviseur">Superviseur</option>
                    <option value="ancien_stagiaire">Ancien Stagiaire</option>
                    <option value="nouveau_stagiaire">Nouveau Stagiaire</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Site d'affectation</label>
                  <select
                    className="form-select"
                    value={site}
                    onChange={e => setSite(e.target.value as any)}
                  >
                    <option value="Maya-Maya">Maya-Maya (Principal)</option>
                    <option value="Mazala">Mazala (Stockage)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingMember ? 'Enregistrer les modifications' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
