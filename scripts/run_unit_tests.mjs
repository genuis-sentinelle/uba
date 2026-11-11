// Tests unitaires de validation métier — ARCHIVA UBA
// Exécution en pur JavaScript ES Module

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Échec du test : ${message}`);
  }
}

function formatNumber(num) {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

const isAdminLike = (r) => r === 'super_admin' || r === 'admin';
const can = {
  deleteData: (r) => r === 'super_admin',
  print: isAdminLike,
  export: isAdminLike
};

console.log('--- EXÉCUTION DE LA SUITE DE TESTS UNITAIRES ARCHIVA ---');

// 1. Formatters
assert(formatNumber(0) === '0', 'formatNumber(0) doit renvoyer "0"');
assert(formatNumber(1500) === '1 500', 'formatNumber(1500) doit renvoyer "1 500"');
assert(formatNumber(2450000) === '2 450 000', 'formatNumber(2450000) doit formater les millions');
assert(formatDate('2026-10-28') === '28/10/2026', 'formatDate doit formater DD/MM/YYYY');
console.log('✓ Tests Formatters passés');

// 2. Permissions RBAC
assert(can.print('super_admin') === true, 'super_admin a le droit d impression');
assert(can.print('admin') === true, 'admin a le droit d impression');
assert(can.print('stagiaire') === false, 'stagiaire N A PAS le droit d impression');
assert(can.deleteData('stagiaire') === false, 'stagiaire ne peut pas supprimer');
assert(can.deleteData('admin') === false, 'admin seul ne peut pas supprimer');
assert(can.deleteData('super_admin') === true, 'super_admin peut supprimer');
console.log('✓ Tests RBAC Permissions passés');

// 3. Critères d'archivage
function isReportArchivable(report) {
  if (report.archived) return false;
  if (report.statut !== 'valide') return false;
  return true;
}

assert(isReportArchivable({ statut: 'brouillon', archived: false }) === false, 'Un brouillon ne doit pas être archivable');
assert(isReportArchivable({ statut: 'valide', archived: false }) === true, 'Un rapport validé doit être archivable');
assert(isReportArchivable({ statut: 'valide', archived: true }) === false, 'Un rapport déjà archivé ne doit plus l être');
console.log('✓ Tests Archivage passés');

console.log('[SUCCÈS] Tous les tests unitaires ont réussi avec succès !');
