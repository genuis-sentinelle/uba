import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useFeedback } from '../ui/Feedback';
import { todayLocal } from '../../utils/dates';
import { AttendanceRecord } from '../../types';
import { CheckCircle2, Save, Check } from 'lucide-react';

export const QuickAttendanceView: React.FC = () => {
  const { teamMembers, attendance, saveAttendance, getAttendance } = useData();
  const { toast } = useFeedback();

  const [datePointage, setDatePointage] = useState<string>(todayLocal());
  const [statuses, setStatuses] = useState<Record<string, AttendanceRecord['statut']>>({});
  const [motifs, setMotifs] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const activeMembers = teamMembers.filter(m => m.actif);

  // Synchronisation avec la date sélectionnée
  useEffect(() => {
    const existing = getAttendance(datePointage);
    const nextStatuses: Record<string, AttendanceRecord['statut']> = {};
    const nextMotifs: Record<string, string> = {};

    activeMembers.forEach(m => {
      const found = existing.find(a => a.memberId === m.id);
      if (found) {
        nextStatuses[m.id] = found.statut;
        if (found.motif) nextMotifs[m.id] = found.motif;
      } else {
        nextStatuses[m.id] = m.site === 'Mazala' ? 'mazala' : 'present';
      }
    });

    setStatuses(nextStatuses);
    setMotifs(nextMotifs);
    setSaved(false);
  }, [datePointage, teamMembers, attendance]);

  const setAllPresent = () => {
    const next: Record<string, AttendanceRecord['statut']> = {};
    activeMembers.forEach(m => {
      next[m.id] = m.site === 'Mazala' ? 'mazala' : 'present';
    });
    setStatuses(next);
    setSaved(false);
  };

  const handleStatusChange = (id: string, st: AttendanceRecord['statut']) => {
    setStatuses(prev => ({ ...prev, [id]: st }));
    setSaved(false);
  };

  const handleSave = () => {
    const entries = activeMembers.map(m => ({
      memberId: m.id,
      statut: statuses[m.id] || (m.site === 'Mazala' ? 'mazala' : 'present'),
      motif: motifs[m.id]
    }));

    const res = saveAttendance(datePointage, entries);
    if (res.success) {
      setSaved(true);
      toast(res.message, 'success');
    } else {
      toast('Erreur lors de l\'enregistrement du pointage.', 'error');
    }
  };

  const presentsCount = activeMembers.filter(m => (statuses[m.id] || 'present') === 'present').length;
  const mazalaCount = activeMembers.filter(m => statuses[m.id] === 'mazala').length;
  const ordiCount = activeMembers.filter(m => statuses[m.id] === 'ordinateur').length;
  const absentsCount = activeMembers.filter(m => statuses[m.id] === 'absent').length;

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Pointage des Présences</h1>
          <p className="text-muted text-sm" style={{ marginTop: '4px' }}>
            Appel matinal et affectation opérationnelle (Maya-Maya & Mazala)
          </p>
        </div>

        <div className="row">
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto', minWidth: '150px' }}
            value={datePointage}
            onChange={e => setDatePointage(e.target.value)}
          />
          <button onClick={setAllPresent} className="btn btn-secondary">
            <Check size={16} /> Tous Présents
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            <Save size={16} /> Enregistrer
          </button>
        </div>
      </div>

      {saved && (
        <div
          className="card"
          style={{
            marginBottom: '20px',
            borderColor: 'rgba(52, 199, 89, 0.4)',
            backgroundColor: 'rgba(52, 199, 89, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <CheckCircle2 size={18} color="var(--success)" />
          <span style={{ fontWeight: 500 }}>
            Pointage du {datePointage} validé, sauvegardé et synchronisé.
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid-auto" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--text-2)' }}>
          <div className="text-muted text-sm" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Maya-Maya (Tri)</div>
          <div className="num" style={{ fontSize: '2rem', fontWeight: 700, marginTop: '4px' }}>{presentsCount}</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--brand)' }}>
          <div className="text-muted text-sm" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Site Mazala</div>
          <div className="num" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--brand-hi)', marginTop: '4px' }}>{mazalaCount}</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--ai-3)' }}>
          <div className="text-muted text-sm" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Saisie Ordinateur</div>
          <div className="num" style={{ fontSize: '2rem', fontWeight: 700, marginTop: '4px' }}>{ordiCount}</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="text-muted text-sm" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Absents</div>
          <div className="num" style={{ fontSize: '2rem', fontWeight: 700, color: absentsCount > 0 ? 'var(--danger)' : 'var(--text-1)', marginTop: '4px' }}>{absentsCount}</div>
        </div>
      </div>

      {/* Members Attendance List */}
      <div className="uba-table-container">
        <table className="uba-table uba-table--cards">
          <thead>
            <tr>
              <th>Archiviste</th>
              <th>Catégorie / Titre</th>
              <th style={{ textAlign: 'center' }}>Affectation</th>
            </tr>
          </thead>
          <tbody>
            {activeMembers.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '36px' }} className="text-muted">
                  Aucun membre actif dans l'équipe. Veuillez en ajouter dans la section Équipe.
                </td>
              </tr>
            ) : (
              activeMembers.map(m => {
                const currentStatus = statuses[m.id] || (m.site === 'Mazala' ? 'mazala' : 'present');

                return (
                  <tr key={m.id}>
                    <td data-label="Archiviste">
                      <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>
                        {m.nomOfficiel}
                      </div>
                      <div className="text-muted text-sm">
                        Site par défaut : {m.site}
                      </div>
                    </td>
                    <td data-label="Catégorie">
                      <span className="badge badge-black">
                        {m.categorie.replace('_', ' ')}
                      </span>
                    </td>
                    <td data-label="Affectation" style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(m.id, 'present')}
                          className={`btn btn-sm ${currentStatus === 'present' ? 'btn-secondary' : 'btn-ghost'}`}
                          style={{
                            minHeight: '38px',
                            borderColor: currentStatus === 'present' ? 'var(--line-strong)' : 'transparent'
                          }}
                        >
                          Maya-Maya
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(m.id, 'mazala')}
                          className={`btn btn-sm ${currentStatus === 'mazala' ? 'btn-primary' : 'btn-ghost'}`}
                          style={{ minHeight: '38px' }}
                        >
                          Mazala
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(m.id, 'ordinateur')}
                          className={`btn btn-sm ${currentStatus === 'ordinateur' ? 'btn-secondary' : 'btn-ghost'}`}
                          style={{
                            minHeight: '38px',
                            borderColor: currentStatus === 'ordinateur' ? 'var(--line-strong)' : 'transparent'
                          }}
                        >
                          Ordinateur
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(m.id, 'absent')}
                          className={`btn btn-sm ${currentStatus === 'absent' ? 'btn-danger' : 'btn-ghost'}`}
                          style={{ minHeight: '38px' }}
                        >
                          Absent
                        </button>
                      </div>

                      {currentStatus === 'absent' && (
                        <div style={{ marginTop: '8px' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Motif d'absence (facultatif)"
                            value={motifs[m.id] || ''}
                            onChange={e => setMotifs(prev => ({ ...prev, [m.id]: e.target.value }))}
                            style={{ minHeight: '36px', fontSize: '0.875rem' }}
                          />
                        </div>
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
