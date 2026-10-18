import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useFeedback } from '../ui/Feedback';
import { User, Role } from '../../types';
import { UserPlus, Trash2, Edit2, Lock, X, ShieldCheck, Power, Shield, UserCheck, KeyRound } from 'lucide-react';

interface UsersManagementViewProps {
  autoOpenAdd?: boolean;
  onModalClosed?: () => void;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({ autoOpenAdd, onModalClosed }) => {
  const { users, currentUser, addUser, updateUser, deleteUser, canDeleteUser } = useAuth();
  const { addLog } = useData();
  const { toast, confirm } = useFeedback();

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [nomComplet, setNomComplet] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('stagiaire');
  const [titre, setTitre] = useState('');
  const [motDePasse, setMotDePasse] = useState('uba2026');

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
    setMotDePasse('uba' + Math.floor(1000 + Math.random() * 9000));
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomComplet.trim() || !email.trim()) {
      toast('Veuillez remplir le nom et l\'adresse email.', 'error');
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
      toast(res.message, res.success ? 'success' : 'error');
      if (res.success) {
        addLog('Modification Utilisateur', `Profil modifié : ${nomComplet} (${role})`, 'utilisateur');
        setShowModal(false);
      }
    } else {
      const res = await addUser({
        nomComplet: nomComplet.trim(),
        email: email.trim(),
        role,
        titre: titre.trim() || (role === 'admin' ? 'Administrateur' : role === 'super_admin' ? 'Chef d\'équipe' : 'Archiviste'),
        actif: true,
        motDePasse: motDePasse.trim()
      });

      if (res.success) {
        toast(res.message, 'success');
        addLog('Création Utilisateur', `Nouvel utilisateur créé avec mot de passe sécurisé : ${nomComplet} (${role})`, 'utilisateur');
        setShowModal(false);
      } else {
        toast(res.message, 'error');
      }
    }
  };

  const handleToggleActif = async (u: User) => {
    if (u.id === currentUser?.id) {
      toast('Vous ne pouvez pas bloquer ou désactiver votre propre compte.', 'error');
      return;
    }

    if (u.actif) {
      const ok = await confirm({
        title: `Bloquer l'utilisateur "${u.nomComplet}" ?`,
        message: `Êtes-vous sûr de vouloir bloquer ce compte (${u.email}) ? L'utilisateur sera immédiatement déconnecté et ne pourra plus du tout se connecter au logiciel ARCHIVA tant qu'il n'aura pas été débloqué.`,
        confirmLabel: 'Bloquer l\'accès',
        danger: true
      });
      if (!ok) return;
    }

    const updated = { ...u, actif: !u.actif };
    const res = updateUser(updated);
    toast(res.message, updated.actif ? 'success' : 'info');
    addLog(
      'Sécurité Utilisateur',
      `Compte ${u.nomComplet} (${u.role}) ${updated.actif ? 'DÉBLOQUÉ et activé' : 'BLOQUÉ et accès interdit'}`,
      'utilisateur'
    );
  };

  const handleDelete = async (target: User) => {
    const check = canDeleteUser(target);
    if (!check.allowed) {
      toast(`Action refusée : ${check.reason}`, 'error');
      return;
    }

    const ok = await confirm({
      title: 'Supprimer cet utilisateur ?',
      message: `Confirmer la suppression du compte de "${target.nomComplet}" (${target.role}) ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer définitivement',
      danger: true
    });

    if (ok) {
      const res = deleteUser(target.id);
      if (res.success) {
        toast(res.message, 'success');
        addLog('Suppression Utilisateur', `Compte supprimé : ${target.nomComplet} (${target.role})`, 'utilisateur');
      } else {
        toast(res.message, 'error');
      }
    }
  };

  const getRoleBadge = (r: Role) => {
    switch (r) {
      case 'super_admin':
        return <span className="badge badge-red">Super Admin (Chef)</span>;
      case 'admin':
        return <span className="badge badge-black">Administrateur</span>;
      default:
        return <span className="badge badge-silver">Archiviste / Stagiaire</span>;
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Utilisateurs & Droits d'Accès</h1>
          <p className="text-muted text-sm" style={{ marginTop: '4px' }}>
            {users.length} compte(s) enregistré(s)
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary">
          <UserPlus size={16} /> Créer un Utilisateur
        </button>
      </div>

      {/* Users Table */}
      <div className="uba-table-container">
        <table className="uba-table uba-table--cards">
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
                  <td data-label="Utilisateur">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: u.role === 'super_admin' ? 'var(--brand)' : 'var(--surface-2)',
                        color: 'var(--text-1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.95rem'
                      }}>
                        {u.nomComplet.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>
                          {u.nomComplet} {u.id === currentUser?.id && <span style={{ color: 'var(--brand-hi)', fontSize: '0.8rem' }}>(Vous)</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td data-label="Email" className="num">
                    {u.email}
                  </td>
                  <td data-label="Rôle">{getRoleBadge(u.role)}</td>
                  <td data-label="Fonction" style={{ color: 'var(--text-1)' }}>
                    {u.titre}
                  </td>
                  <td data-label="État">
                    {u.actif ? (
                      <span className="badge badge-green" style={{ fontWeight: 700 }}>
                        ● Actif
                      </span>
                    ) : (
                      <span className="badge badge-red" style={{ fontWeight: 800, letterSpacing: '0.02em' }}>
                        ● Bloqué (Interdit)
                      </span>
                    )}
                  </td>
                  <td data-label="Actions" style={{ textAlign: 'right' }}>
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
                        className="btn btn-secondary btn-sm btn-icon"
                        style={{ color: u.actif ? 'var(--danger)' : 'var(--green)' }}
                        title={u.actif ? 'Bloquer l\'accès au compte' : 'Débloquer l\'accès au compte'}
                      >
                        <Power size={14} />
                      </button>

                      {check.allowed ? (
                        <button
                          onClick={() => handleDelete(u)}
                          className="btn btn-secondary btn-sm btn-icon"
                          style={{ color: 'var(--danger)' }}
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <span
                          title={check.reason || 'Action protégée'}
                          className="text-muted"
                          style={{ padding: '0 8px', display: 'inline-flex', alignItems: 'center' }}
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
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3>{editingUser ? 'Modifier le compte' : 'Créer un nouvel utilisateur'}</h3>
                <p className="text-muted text-sm" style={{ marginTop: '4px' }}>
                  Définissez l'identité, le rôle opérationnel et les accès dans ARCHIVA.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-ghost btn-icon"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nom complet de l'agent *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nom et prénom complet de l'agent"
                  value={nomComplet}
                  onChange={e => setNomComplet(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email professionnel UBA *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="agent@ubagroup.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Choix visuel du Rôle */}
              <div className="form-group">
                <label className="form-label">Niveau d'habilitation & Rôle *</label>
                <div className="grid-3" style={{ marginTop: '8px' }}>
                  {/* Stagiaire */}
                  <div
                    onClick={() => setRole('stagiaire')}
                    className="card card--interactive"
                    style={{
                      borderColor: role === 'stagiaire' ? 'var(--brand)' : 'var(--line)',
                      backgroundColor: role === 'stagiaire' ? 'var(--brand-tint)' : 'var(--surface-2)',
                      padding: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <UserCheck size={18} color="var(--brand-hi)" />
                      <strong>Stagiaire</strong>
                    </div>
                    <div className="text-muted text-sm">
                      Saisie quotidienne des rapports, bordereaux, cartons et incidents.
                    </div>
                  </div>

                  {/* Administrateur */}
                  <div
                    onClick={() => setRole('admin')}
                    className="card card--interactive"
                    style={{
                      borderColor: role === 'admin' ? 'var(--brand)' : 'var(--line)',
                      backgroundColor: role === 'admin' ? 'var(--brand-tint)' : 'var(--surface-2)',
                      padding: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Shield size={18} color="var(--brand-hi)" />
                      <strong>Administrateur</strong>
                    </div>
                    <div className="text-muted text-sm">
                      Gestion des référentiels, équipes, synthèses et création de comptes.
                    </div>
                  </div>

                  {/* Super Admin */}
                  {currentUser?.role === 'super_admin' && (
                    <div
                      onClick={() => setRole('super_admin')}
                      className="card card--interactive"
                      style={{
                        borderColor: role === 'super_admin' ? 'var(--brand)' : 'var(--line)',
                        backgroundColor: role === 'super_admin' ? 'var(--brand-tint)' : 'var(--surface-2)',
                        padding: '14px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <ShieldCheck size={18} color="var(--brand-hi)" />
                        <strong>Super Admin</strong>
                      </div>
                      <div className="text-muted text-sm">
                        Chef d'équipe (Accès total, purge et suppression).
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Titre & Suggestions */}
              <div className="form-group">
                <label className="form-label">Fonction / Poste officiel</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Archiviste Superviseur"
                  value={titre}
                  onChange={e => setTitre(e.target.value)}
                  style={{ marginBottom: '8px' }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['Archiviste de Terrain', 'Superviseur Traitement', 'Responsable Mazala', 'Opérateur de Saisie', 'Chauffeur / Convoyeur'].map(sugg => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setTitre(sugg)}
                      className="btn btn-secondary btn-sm"
                    >
                      + {sugg}
                    </button>
                  ))}
                </div>
              </div>

              {!editingUser && (
                <div className="card" style={{ backgroundColor: 'var(--surface-2)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <KeyRound size={18} color="var(--brand-hi)" />
                    <label className="form-label" style={{ margin: 0 }}>Mot de passe initial sécurisé</label>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      className="form-input num"
                      value={motDePasse}
                      onChange={e => setMotDePasse(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setMotDePasse('uba' + Math.floor(1000 + Math.random() * 9000))}
                      className="btn btn-secondary"
                    >
                      Générer
                    </button>
                  </div>
                  <p className="text-muted text-sm" style={{ marginTop: '8px' }}>
                    Le mot de passe sera haché avec sel cryptographique (SHA-256). L'agent pourra le modifier à tout moment.
                  </p>
                </div>
              )}

              <div className="modal-actions">
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
