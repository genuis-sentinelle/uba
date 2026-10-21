import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useFeedback } from '../ui/Feedback';
import { User, Role } from '../../types';
import { generatePassword } from '../../utils/password';
import {
  UserPlus,
  Trash2,
  Edit2,
  Lock,
  X,
  ShieldCheck,
  Power,
  Shield,
  UserCheck,
  KeyRound,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';

interface UsersManagementViewProps {
  autoOpenAdd?: boolean;
  onModalClosed?: () => void;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({ autoOpenAdd, onModalClosed }) => {
  const { users, usersError, refreshUsers, currentUser, addUser, updateUser, deleteUser, canDeleteUser } = useAuth();
  const { addLog } = useData();
  const { toast, confirm } = useFeedback();

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [nomComplet, setNomComplet] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('stagiaire');
  const [titre, setTitre] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

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
    const newPwd = generatePassword(14);
    setMotDePasse(newPwd);
    setShowPassword(true);
    setCopiedPassword(false);
    setShowModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setNomComplet(u.nomComplet);
    setEmail(u.email);
    setRole(u.role);
    setTitre(u.titre);
    setMotDePasse('••••••••');
    setShowPassword(false);
    setCopiedPassword(false);
    setShowModal(true);
  };

  const handleCopyPassword = () => {
    if (motDePasse) {
      navigator.clipboard.writeText(motDePasse);
      setCopiedPassword(true);
      toast('Mot de passe copié dans le presse-papier !', 'info');
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomComplet.trim() || !email.trim()) {
      toast('Veuillez remplir le nom et l\'adresse email.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        const res = await updateUser({
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
          motDePasse: motDePasse.trim()
        });

        if (res.success) {
          toast(res.message, 'success');
          addLog('Création Utilisateur', `Nouvel utilisateur créé côté serveur : ${nomComplet} (${role})`, 'utilisateur');
          setShowModal(false);
        } else {
          toast(res.message, 'error');
        }
      }
    } finally {
      setSubmitting(false);
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
        message: `Êtes-vous sûr de vouloir bloquer ce compte (${u.email}) ? Toutes ses sessions seront révoquées immédiatement et l'accès serveur aux données sera formellement refusé.`,
        confirmLabel: 'Bloquer l\'accès',
        danger: true
      });
      if (!ok) return;
    }

    setSubmitting(true);
    try {
      const updated = { ...u, actif: !u.actif };
      const res = await updateUser(updated);
      toast(res.message, res.success ? (updated.actif ? 'success' : 'info') : 'error');
      if (res.success) {
        addLog(
          'Sécurité Utilisateur',
          `Compte ${u.nomComplet} (${u.role}) ${updated.actif ? 'DÉBLOQUÉ et activé' : 'BLOQUÉ et sessions révoquées'}`,
          'utilisateur'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (target: User) => {
    const check = canDeleteUser(target);
    if (!check.allowed) {
      toast(`Action refusée : ${check.reason}`, 'error');
      return;
    }

    const ok = await confirm({
      title: 'Supprimer cet utilisateur ?',
      message: `Confirmer la suppression définitive du compte de "${target.nomComplet}" (${target.role}) ? L'utilisateur sera supprimé de Supabase Auth et de la base. Cette action est irréversible.`,
      confirmLabel: 'Supprimer définitivement',
      danger: true
    });

    if (ok) {
      setSubmitting(true);
      try {
        const res = await deleteUser(target.id);
        if (res.success) {
          toast(res.message, 'success');
          addLog('Suppression Utilisateur', `Compte supprimé : ${target.nomComplet} (${target.role})`, 'utilisateur');
        } else {
          toast(res.message, 'error');
        }
      } finally {
        setSubmitting(false);
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
            {usersError ? 'Liste indisponible' : `${users.length} compte(s) enregistré(s)`}
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary">
          <UserPlus size={16} /> Créer un Utilisateur
        </button>
      </div>

      {/* Bandeau d'erreur serveur explicite */}
      {usersError && (
        <div
          className="card"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            padding: '14px 18px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} />
            <span style={{ fontWeight: 500 }}>{usersError}</span>
          </div>
          <button
            onClick={() => refreshUsers()}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} /> Réessayer
          </button>
        </div>
      )}

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
                  readOnly={Boolean(editingUser)}
                  style={editingUser ? { backgroundColor: 'var(--surface-2)', cursor: 'not-allowed', opacity: 0.8 } : {}}
                />
                {editingUser && (
                  <p className="text-muted text-sm" style={{ marginTop: '4px', fontSize: '0.8rem' }}>
                    Modifiable uniquement par le Super Admin dans Supabase
                  </p>
                )}
              </div>

              {/* Choix visuel du Rôle */}
              <div className="form-group">
                <label className="form-label">Niveau d'habilitation & Rôle *</label>
                <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: currentUser?.role === 'admin' ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
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

                  {/* Administrateur (accessible seulement pour le Super Admin) */}
                  {currentUser?.role === 'super_admin' && (
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
                        Gestion des référentiels, équipes, synthèses et création de stagiaires.
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
                    <label className="form-label" style={{ margin: 0 }}>Mot de passe initial sécurisé (≥ 14 caractères)</label>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input num"
                      value={motDePasse}
                      onChange={e => setMotDePasse(e.target.value)}
                      style={{ flex: 1, letterSpacing: showPassword ? 'normal' : '0.15em' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="btn btn-secondary btn-icon"
                      title={showPassword ? 'Masquer' : 'Afficher'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="btn btn-secondary btn-icon"
                      title="Copier le mot de passe"
                    >
                      {copiedPassword ? <Check size={16} color="var(--green)" /> : <Copy size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newPwd = generatePassword(14);
                        setMotDePasse(newPwd);
                        setShowPassword(true);
                      }}
                      className="btn btn-secondary"
                    >
                      Générer
                    </button>
                  </div>
                  <p className="text-muted text-sm" style={{ marginTop: '8px' }}>
                    Communiquez ce mot de passe de façon sécurisée ; l'agent devra le changer à sa première connexion.
                  </p>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" disabled={submitting}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Traitement sécurisé...' : (editingUser ? 'Enregistrer les modifications' : 'Créer l\'utilisateur')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
