// Missing fields stay missing: never fill them with a different patient's data.
export const normalizePatient = (patient = {}) => ({
  ...patient,
  name: patient.name || (typeof patient.patient === 'string' ? patient.patient : '')
    || [patient.papell, patient.sapell, patient.nom_pac].filter(Boolean).join(' ') || '—',
  attention: patient.attention || patient.id_atencion || patient.idAtencion || '',
  record: patient.record || patient.Id_exp || patient.id_exp || '',
});
