import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  CheckCircle2,
  Save,
  Check,
  MapPin,
  Laptop,
  Trash2,
  UserX,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export const QuickAttendanceView: React.FC = () => {
  const { teamMembers, addLog } = useData();
  const { currentUser } = useAuth();
  const isStagiaire = currentUser?.role === 'stagiaire' || currentUser?.role === 'user';

  const [datePointage, setDatePointage] = useState(new Date().toISOString().split('T')[0]);

  // List of active members in the attendance sheet (supports deletion)
  const [activeMemberIds, setActiveMemberIds] = useState<string[]>(() => teamMembers.map(m => m.id));

  // Status mapping: 'present' | 'mazala' | 'ordinateur' | 'absent'
  const [statuses, setStatuses] = useState<Record<string, 'present' | 'mazala' | 'ordinateur' | 'absent'>>(() => {
    const initial: Record<string, 'present' | 'mazala' | 'ordinateur' | 'absent'> = {};
    teamMembers.forEach(m => {
      if (m.site === 'Mazala') {
        initial[m.id] = 'mazala';
      } else {
        initial[m.id] = 'present';
      }
    });
    return initial;
  });

  const [saved, setSaved] = useState(false);

  const displayedMembers = teamMembers.filter(m => activeMemberIds.includes(m.id));

  const setAllPresent = () => {
    const updated: Record<string, 'present' | 'mazala' | 'ordinateur' | 'absent'> = {};
    displayedMembers.forEach(m => {
      updated[m.id] = m.site === 'Mazala' ? 'mazala' : 'present';
    });
    setStatuses(updated);
  };

  const handleStatusChange = (id: string, st: 'present' | 'mazala' | 'ordinateur' | 'absent') => {
    setStatuses(prev => ({ ...prev, [id]: st }));
    setSaved(false);
  };

  const handleDeleteMember = (memberId: string, memberName: string) => {
    if (window.confirm(`Confirmer la suppression de "${memberName}" du pointage du ${datePointage} ?`)) {
      setActiveMemberIds(prev => prev.filter(id => id !== memberId));
      addLog('Pointage Présences', `Retrait de ${memberName} du pointage du ${datePointage}`, 'equipe');
      setSaved(false);
    }
  };

  const handleRestoreAll = () => {
    setActiveMemberIds(teamMembers.map(m => m.id));
    setSaved(false);
  };

  const handleSave = () => {
    const totalPresents = displayedMembers.filter(m => statuses[m.id] !== 'absent').length;
    const absents = displayedMembers.filter(m => statuses[m.id] === 'absent').length;

    addLog(
      'Pointage Présences',
      `Appel du ${datePointage} validé : ${totalPresents}/${displayedMembers.length} présents (${absents} absent(s))`,
      'equipe'
    );
    setSaved(true);
  };

  const presentsCount = displayedMembers.filter(m => (statuses[m.id] || 'present') === 'present').length;
  const mazalaCount = displayedMembers.filter(m => statuses[m.id] === 'mazala').length;
  const ordiCount = displayedMembers.filter(m => statuses[m.id] === 'ordinateur').length;
  const absentsCount = displayedMembers.filter(m => statuses[m.id] === 'absent').length;

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1300px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Pointage Rapide du Matin (7h30)
          </h1>
          <div style={{ fontSize: '0.92rem', color: '#D9D9D9', marginTop: '4px' }}>
            Appel et répartition opérationnelle de l'équipe archiviste (Maya-Maya & Mazala)
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="date"
            className="form-input"
            style={{ width: '160px', height: '42px', padding: '6px 12px' }}
            value={datePointage}
            onChange={e => setDatePointage(e.target.value)}
          />
          {activeMemberIds.length < teamMembers.length && currentUser?.role !== 'stagiaire' && currentUser?.role !== 'user' && (
            <button onClick={handleRestoreAll} className="btn btn-secondary btn-sm" title="Réintégrer tous les archivistes">
              <RotateCcw size={15} /> Restaurer la liste
            </button>
          )}
          {currentUser?.role !== 'stagiaire' && currentUser?.role !== 'user' ? (
            <>
              <button onClick={setAllPresent} className="btn btn-secondary btn-sm">
                <Check size={15} /> Tous Présents
              </button>
              <button onClick={handleSave} className="btn btn-primary btn-sm">
                <Save size={15} /> Enregistrer l'Appel
              </button>
            </>
          ) : (
            <span className="badge badge-black" style={{ padding: '8px 14px', fontSize: '0.85rem', border: '1px solid var(--uba-anthracite)' }}>
              Mode Consultation (Lecture seule)
            </span>
          )}
        </div>
      </div>

      {saved && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '20px',
          backgroundColor: 'var(--uba-anthracite)',
          border: '1px solid var(--uba-silver-dark)',
          color: '#FFFFFF',
          fontSize: '0.92rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} color="var(--uba-red-bright)" />
          <span>Pointage du jour validé et synchronisé avec le journal d'audit UBA.</span>
        </div>
      )}

      {/* Summary KPI Cards — Noir, Rouge, Blanc */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid var(--uba-graphite)' }}>
          <div style={{ fontSize: '0.8rem', color: '#D9D9D9', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Maya-Maya (Tri)</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FFFFFF', marginTop: '4px' }}>{presentsCount}</div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid var(--uba-red)' }}>
          <div style={{ fontSize: '0.8rem', color: '#D9D9D9', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Site Mazala</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--uba-red-bright)', marginTop: '4px' }}>{mazalaCount}</div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid var(--uba-silver-dark)' }}>
          <div style={{ fontSize: '0.8rem', color: '#D9D9D9', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ordinateur / Saisie</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FFFFFF', marginTop: '4px' }}>{ordiCount}</div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid var(--uba-red-dark)' }}>
          <div style={{ fontSize: '0.8rem', color: '#D9D9D9', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Absents</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: absentsCount > 0 ? 'var(--uba-red-bright)' : '#FFFFFF', marginTop: '4px' }}>{absentsCount}</div>
        </div>
      </div>

      {/* Members Attendance List */}
      <div className="uba-table-container">
        <table className="uba-table">
          <thead>
            <tr>
              <th>Archiviste</th>
              <th>Catégorie / Titre</th>
              <th style={{ textAlign: 'center', width: '420px' }}>Affectation du jour</th>
              <th style={{ textAlign: 'right', width: '110px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {displayedMembers.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '36px', color: '#D9D9D9' }}>
                  Aucun membre dans le pointage. Cliquez sur "Restaurer la liste".
                </td>
              </tr>
            ) : (
              displayedMembers.map(m => {
                const currentStatus = statuses[m.id] || 'present';

                return (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.98rem' }}>
                        {m.nomOfficiel}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#D9D9D9' }}>
                        {m.site}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-black" style={{ fontSize: '0.82rem' }}>
                        {m.categorie.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {/* Sélecteur d'affectation sombre avec texte blanc */}
                      <div style={{
                        display: 'inline-flex',
                        gap: '6px',
                        backgroundColor: 'rgba(6, 6, 6, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        padding: '4px',
                        borderRadius: 'var(--radius-sm)'
                      }}>
                        <button
                          type="button"
                          disabled={isStagiaire}
                          onClick={() => handleStatusChange(m.id, 'present')}
                          style={{
                            border: '1px solid',
                            borderColor: currentStatus === 'present' ? 'var(--uba-silver-metal)' : 'transparent',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: isStagiaire ? 'default' : 'pointer',
                            backgroundColor: currentStatus === 'present' ? 'var(--uba-anthracite)' : 'transparent',
                            color: '#FFFFFF',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          Maya-Maya
                        </button>

                        <button
                          type="button"
                          disabled={isStagiaire}
                          onClick={() => handleStatusChange(m.id, 'mazala')}
                          style={{
                            border: '1px solid',
                            borderColor: currentStatus === 'mazala' ? 'var(--uba-red)' : 'transparent',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: isStagiaire ? 'default' : 'pointer',
                            backgroundColor: currentStatus === 'mazala' ? 'var(--uba-red)' : 'transparent',
                            color: '#FFFFFF',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          Mazala
                        </button>

                        <button
                          type="button"
                          disabled={isStagiaire}
                          onClick={() => handleStatusChange(m.id, 'ordinateur')}
                          style={{
                            border: '1px solid',
                            borderColor: currentStatus === 'ordinateur' ? 'var(--uba-silver-metal)' : 'transparent',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: isStagiaire ? 'default' : 'pointer',
                            backgroundColor: currentStatus === 'ordinateur' ? 'var(--uba-graphite)' : 'transparent',
                            color: '#FFFFFF',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          Ordinateur
                        </button>

                        <button
                          type="button"
                          disabled={isStagiaire}
                          onClick={() => handleStatusChange(m.id, 'absent')}
                          style={{
                            border: '1px solid',
                            borderColor: currentStatus === 'absent' ? 'var(--uba-red-dark)' : 'transparent',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: isStagiaire ? 'default' : 'pointer',
                            backgroundColor: currentStatus === 'absent' ? 'var(--uba-red-dark)' : 'transparent',
                            color: '#FFFFFF',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!isStagiaire ? (
                        <button
                          onClick={() => handleDeleteMember(m.id, m.nomOfficiel)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 8px', color: 'var(--uba-red-bright)' }}
                          title="Supprimer cette affectation de l'appel"
                        >
                          <Trash2 size={14} /> Supprimer
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--uba-silver-dark)' }}>Consultation</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
