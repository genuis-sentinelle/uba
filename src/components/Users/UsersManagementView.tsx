import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { User, Role } from '../../types';
import { UserPlus, Trash2, Edit2, CheckCircle, AlertTriangle, Lock, X, ShieldCheck, Power, Shield, UserCheck, KeyRound } from 'lucide-react';

interface UsersManagementViewProps {
  autoOpenAdd?: boolean;
  onModalClosed?: () => void;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({ autoOpenAdd, onModalClosed }) => {
  const { users, currentUser, addUser, updateUser, deleteUser, canDeleteUser } = useAuth();
  const { addLog } = useData();

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [nomComplet, setNomComplet] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [titre, setTitre] = useState('');
  const [motDePasse, setMotDePasse] = useState('uba2026');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (autoOpenAdd) {
      handleOpenAdd();
      if (onModalClosed) {
        onModalClosed();
      }
    }
  }, [autoOpenAdd]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setNomComplet('');
    setEmail('');
    setRole('stagiaire');
    setTitre('');
    setMotDePasse('uba2026');
    setShowModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setNomComplet(u.nomComplet);
    setEmail(u.email);
    setRole(u.role);
    setTitre(u.titre);
    setMotDePasse('••••••••');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomComplet.trim() || !email.trim()) {
      setMessage({ type: 'error', text: 'Veuillez remplir le nom et l\'adresse email.' });
      return;
    }

    if (editingUser) {
      const res = updateUser({
        ...editingUser,
        nomComplet: nomComplet.trim(),
        email: email.trim(),
        role,
        titre: titre.trim() || editingUser.titre
      });
      setMessage({ type: 'success', text: res.message });
      addLog('Modification Utilisateur', `Profil modifié : ${nomComplet} (${role})`, 'utilisateur');
      setShowModal(false);
    } else {
      const res = addUser({
        nomComplet: nomComplet.trim(),
        email: email.trim(),
        role,
        titre: titre.trim() || (role === 'admin' ? 'Administrateur' : role === 'super_admin' ? 'Chef d\'équipe' : 'Archiviste'),
        actif: true
      });

      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        addLog('Création Utilisateur', `Nouvel utilisateur créé : ${nomComplet} (${role})`, 'utilisateur');
        setShowModal(false);
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    }
  };

  const handleToggleActif = (u: User) => {
    if (u.id === currentUser?.id) {
      alert('Vous ne pouvez pas désactiver votre propre compte.');
      return;
    }
    const updated = { ...u, actif: !u.actif };
    updateUser(updated);
    setMessage({
      type: 'success',
      text: `Compte ${u.nomComplet} ${updated.actif ? 'activé' : 'désactivé'}.`
    });
    addLog(
      'Statut Utilisateur',
      `Compte ${u.nomComplet} ${updated.actif ? 'activé' : 'désactivé'}`,
      'utilisateur'
    );
  };

  const handleDelete = (target: User) => {
    const check = canDeleteUser(target);
    if (!check.allowed) {
      alert(`Action refusée : ${check.reason}`);
      return;
    }

    if (window.confirm(`Confirmer la suppression du compte de "${target.nomComplet}" (${target.role}) ?`)) {
      const res = deleteUser(target.id);
      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        addLog('Suppression Utilisateur', `Compte supprimé : ${target.nomComplet} (${target.role})`, 'utilisateur');
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    }
  };

  const getRoleBadge = (r: Role) => {
    switch (r) {
      case 'super_admin':
        return <span className="badge badge-red" style={{ fontWeight: 800 }}>Super Admin (Chef)</span>;
      case 'admin':
        return <span className="badge badge-black" style={{ fontWeight: 800 }}>Administrateur</span>;
      default:
        return <span className="badge badge-gray" style={{ fontWeight: 700 }}>Archiviste / Stagiaire</span>;
    }
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Utilisateurs & Droits d'Accès
          </h1>
          <div style={{ fontSize: '0.92rem', color: '#D9D9D9', marginTop: '2px' }}>
            {users.length} compte(s) enregistré(s)
          </div>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary">
          <UserPlus size={16} /> + Créer un Utilisateur
        </button>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          color: message.type === 'success' ? '#065F46' : '#B91C1C',
          border: `1px solid ${message.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
          fontSize: '0.9rem',
          fontWeight: 700
        }}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="uba-table-container">
        <table className="uba-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Adresse Email</th>
              <th>Rôle</th>
              <th>Fonction</th>
              <th>État</th>
              <th style={{ textAlign: 'right', width: '220px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const check = canDeleteUser(u);

              return (
                <tr key={u.id} style={{ opacity: u.actif ? 1 : 0.6 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: u.role === 'super_admin' ? '#E41E26' : '#0F172A',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.95rem'
                      }}>
                        {u.nomComplet.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1rem' }}>
                          {u.nomComplet} {u.id === currentUser?.id && <span style={{ color: 'var(--uba-red-bright)', fontSize: '0.8rem' }}>(Vous)</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#D9D9D9', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                    {u.email}
                  </td>
                  <td>{getRoleBadge(u.role)}</td>
                  <td style={{ fontSize: '0.95rem', color: '#FFFFFF', fontWeight: 600 }}>
                    {u.titre}
                  </td>
                  <td>
                    <span className={u.actif ? 'badge badge-white' : 'badge badge-gray'}>
                      {u.actif ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="btn btn-secondary btn-sm"
                        title="Modifier"
                      >
                        <Edit2 size={14} /> Modifier
                      </button>

                      <button
                        onClick={() => handleToggleActif(u)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 8px', color: '#FFFFFF' }}
                        title={u.actif ? 'Désactiver le compte' : 'Activer le compte'}
                      >
                        <Power size={14} />
                      </button>

                      {check.allowed ? (
                        <button
                          onClick={() => handleDelete(u)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 8px', color: '#DC2626' }}
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <span
                          title={check.reason || 'Action protégée'}
                          style={{ fontSize: '0.78rem', color: '#94A3B8', cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                        >
                          <Lock size={12} />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Add / Edit User */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  {editingUser ? 'Modifier le compte' : 'Créer un nouvel utilisateur'}
                </h3>
                <p style={{ fontSize: '0.92rem', color: '#D9D9D9', margin: '4px 0 0 0' }}>
                  Définissez l'identité, le rôle opérationnel et les accès dans ARCHIVA.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D9D9D9', padding: '6px' }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '1rem' }}>Nom complet de l'agent *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Jean-Paul Makoundou"
                  value={nomComplet}
                  onChange={e => setNomComplet(e.target.value)}
                  required
                  style={{ fontSize: '1.05rem', height: '48px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '1rem' }}>Email professionnel UBA *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Ex: jean-paul.makoundou@ubagroup.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ fontSize: '1.05rem', height: '48px' }}
                />
              </div>

              {/* Choix visuel du Rôle */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '1rem', marginBottom: '10px' }}>
                  Niveau d'habilitation & Rôle *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: currentUser?.role === 'super_admin' ? '1fr 1fr 1fr' : '1fr 1fr', gap: '10px' }}>
                  {/* Stagiaire (Lecture seule) */}
                  <div
                    onClick={() => setRole('stagiaire')}
                    style={{
                      border: (role === 'stagiaire' || role === 'user') ? '2px solid var(--uba-red)' : '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundColor: (role === 'stagiaire' || role === 'user') ? 'rgba(227, 30, 36, 0.15)' : 'var(--uba-anthracite)',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <UserCheck size={18} color="#FFFFFF" />
                      <strong style={{ fontSize: '0.95rem', color: '#FFFFFF' }}>Stagiaire</strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#D9D9D9', lineHeight: 1.3 }}>
                      Lecture seule stricte. Consultation sans modification. Aucun accès aux logs ni aux utilisateurs.
                    </div>
                  </div>

                  {/* Administrateur (Lecture & Modification) */}
                  <div
                    onClick={() => setRole('admin')}
                    style={{
                      border: role === 'admin' ? '2px solid var(--uba-red)' : '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundColor: role === 'admin' ? 'rgba(227, 30, 36, 0.15)' : 'var(--uba-anthracite)',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Shield size={18} color="#FFFFFF" />
                      <strong style={{ fontSize: '0.95rem', color: '#FFFFFF' }}>Administrateur</strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#D9D9D9', lineHeight: 1.3 }}>
                      Droit de lecture et de modification. Création de données, rapports, bordereaux et comptes.
                    </div>
                  </div>

                  {/* Super Admin */}
                  {currentUser?.role === 'super_admin' && (
                    <div
                      onClick={() => setRole('super_admin')}
                      style={{
                        border: role === 'super_admin' ? '2px solid var(--uba-red)' : '1px solid rgba(255, 255, 255, 0.12)',
                        backgroundColor: role === 'super_admin' ? 'rgba(227, 30, 36, 0.22)' : 'var(--uba-anthracite)',
                        borderRadius: '8px',
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <ShieldCheck size={18} color="var(--uba-red-bright)" />
                        <strong style={{ fontSize: '0.95rem', color: 'var(--uba-red-bright)' }}>Super Admin</strong>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#D9D9D9', lineHeight: 1.3 }}>
                        Chef d'équipe (Accès total & suppression).
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Titre & Suggestions */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '1rem' }}>Fonction / Poste officiel</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Archiviste Superviseur"
                  value={titre}
                  onChange={e => setTitre(e.target.value)}
                  style={{ fontSize: '1.05rem', height: '48px', marginBottom: '8px' }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['Archiviste de Terrain', 'Superviseur Traitement', 'Responsable Mazala', 'Opérateur de Saisie', 'Chauffeur / Convoyeur'].map(sugg => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setTitre(sugg)}
                      style={{
                        backgroundColor: titre === sugg ? 'var(--uba-red)' : 'var(--uba-anthracite)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '6px',
                        padding: '5px 12px',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                    >
                      + {sugg}
                    </button>
                  ))}
                </div>
              </div>

              {!editingUser && (
                <div className="form-group" style={{ backgroundColor: 'rgba(6, 6, 6, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <KeyRound size={18} color="var(--uba-red-bright)" />
                    <label className="form-label" style={{ margin: 0, fontSize: '0.95rem' }}>Mot de passe initial sécurisé</label>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={motDePasse}
                      onChange={e => setMotDePasse(e.target.value)}
                      style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.05rem', height: '44px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setMotDePasse('uba' + Math.floor(1000 + Math.random() * 9000))}
                      className="btn btn-secondary btn-sm"
                    >
                      Générer
                    </button>
                  </div>
                  <span style={{ fontSize: '0.82rem', color: '#D9D9D9', marginTop: '6px', display: 'block' }}>
                    L'agent pourra changer son mot de passe lors de sa première session.
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '26px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Enregistrer les modifications' : 'Créer l\'utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
