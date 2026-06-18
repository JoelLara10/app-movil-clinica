import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import adminService from '../../services/adminService';

const areas = ['Consulta', 'Preparacion', 'Recuperacion'];
const reasons = ['Consulta', 'Cirugia', 'Urgencia', 'Estudio'];
const specialties = ['Oftalmologia', 'Retina', 'Cornea', 'Glaucoma'];
const doctors = ['Dra. Sandoval', 'Dr. Ramos', 'Dra. Castillo', 'Dr. Herrera', 'Dra. Vega'];

const buildInitialForm = (patient = {}) => ({
  curp: patient.curp || '',
  papell: patient.papell || patient.rawPatient?.papell || patient.name?.split(' ')?.[0] || '',
  sapell: patient.sapell || patient.rawPatient?.sapell || patient.name?.split(' ')?.[1] || '',
  nom_pac: patient.nom_pac || patient.rawPatient?.nom_pac || patient.name?.split(' ').slice(2).join(' ') || patient.name || '',
  fecnac: patient.birthDate || '',
  tel: patient.phone || '',
  area: patient.area || 'Consulta',
  cama: patient.bed || patient.cama || '',
  motivo: patient.reason || 'Consulta',
  especialidad: patient.specialty || 'Oftalmologia',
  alergias: patient.allergies || '',
  familiar: '',
  parentesco: '',
  famTel: '',
});

const NuevoPacienteScreen = ({ navigation, route }) => {
  const mode = route?.params?.mode === 'edit' ? 'edit' : 'create';
  const idExp = route?.params?.patient?.Id_exp;
  const [form, setForm] = useState(buildInitialForm(route?.params?.patient));
  const [assignedDoctors, setAssignedDoctors] = useState([]);
  const [options, setOptions] = useState({
    areas,
    motivos: reasons,
    especialidades: specialties,
    camas: [],
    medicos: doctors.map((doctor) => ({ id: doctor, label: doctor })),
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiNotice, setApiNotice] = useState('');

  const doctorOptions = useMemo(() => (
    (options.medicos || []).map((doctor) => ({
      id: doctor.id ?? doctor.id_medico ?? doctor.username ?? doctor.label ?? doctor,
      label: doctor.label || doctor.nombre || doctor.username || doctor.name || String(doctor),
    }))
  ), [options.medicos]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const optionsResponse = await adminService.getOptions(route?.params?.patient?.id_cama);
        const medicosList = (optionsResponse.medicos || []).map((doctor) => ({
          ...doctor,
          label: [doctor.nombre, doctor.papell, doctor.sapell].filter(Boolean).join(' ') || doctor.username || String(doctor.id),
        }));
        setOptions({
          areas: optionsResponse.areas || areas,
          motivos: optionsResponse.motivos || reasons,
          especialidades: optionsResponse.especialidades || specialties,
          camas: optionsResponse.camas || [],
          medicos: medicosList,
        });

        if (mode === 'edit' && idExp) {
          const detail = await adminService.getPatient(idExp);
          const raw = detail.rawPatient || {};
          const active = detail.activeAppointment || detail.patient || {};
          const family = detail.family || {};
          setForm(buildInitialForm({
            ...active,
            rawPatient: raw,
            curp: raw.curp,
            birthDate: raw.fecnac?.slice?.(0, 10) || active.birthDate,
            phone: raw.tel || active.phone,
            cama: active.bed,
            allergies: active.allergies,
          }));
          setForm((current) => ({
            ...current,
            familiar: family.nombre || '',
            parentesco: family.parentesco || '',
            famTel: family.telefono || '',
          }));
          setAssignedDoctors(active.doctors || []);
        } else if (!assignedDoctors.length && medicosList[0]) {
          setAssignedDoctors([medicosList[0].id]);
        }

        setApiNotice('');
      } catch (error) {
        setApiNotice('No se pudieron cargar opciones desde la API. Puedes seguir viendo la pantalla con datos locales.');
        if (!assignedDoctors.length) {
          setAssignedDoctors([doctors[0]]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const toggleDoctor = (doctor) => {
    setAssignedDoctors((current) => {
      if (current.includes(doctor)) {
        return current.filter((item) => item !== doctor);
      }
      if (current.length >= 5) {
        Alert.alert('Limite de medicos', 'Solo se pueden asignar hasta 5 medicos.');
        return current;
      }
      return [...current, doctor];
    });
  };

  const handleSave = () => {
    const payload = {
      curp: form.curp,
      papell: form.papell,
      sapell: form.sapell,
      nom_pac: form.nom_pac,
      fecnac: form.fecnac,
      tel: form.tel,
      area: form.area,
      cama: form.cama,
      motivo: form.motivo,
      especialidad: form.especialidad,
      alergias: form.alergias,
      assignedDoctors,
      fam_nombre: form.familiar,
      fam_parentesco: form.parentesco,
      fam_tel: form.famTel,
    };

    const save = async () => {
      try {
        setSaving(true);
        if (mode === 'edit' && idExp) {
          await adminService.updatePatient(idExp, payload);
          Alert.alert('Paciente actualizado', 'La informacion fue enviada a la API.');
        } else {
          await adminService.createPatient(payload);
          Alert.alert('Paciente registrado', 'El paciente fue enviado a la API.');
        }
        navigation.goBack();
      } catch (error) {
        const message = error.response?.data?.error || 'No se pudo guardar el paciente.';
        Alert.alert('Error', message);
      } finally {
        setSaving(false);
      }
    };

    save();
  };

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{mode === 'edit' ? 'Editar Paciente' : 'Nuevo Paciente'}</Text>
          <Text style={styles.headerSubtitle}>Datos generales, atencion y familiar</Text>
        </View>
        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
          <Ionicons name="save-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.lookupCard}>
        <View style={styles.lookupIcon}>
          <Ionicons name="search-outline" size={22} color="#667eea" />
        </View>
        <View style={styles.lookupBody}>
          <Text style={styles.lookupTitle}>Busqueda rapida</Text>
          <TextInput
            value={form.curp}
            onChangeText={(value) => update('curp', value.toUpperCase())}
            placeholder="Escribe CURP o nombre del paciente..."
            placeholderTextColor="#a0aec0"
            autoCapitalize="characters"
            style={styles.lookupInput}
          />
        </View>
      </View>

      {apiNotice ? (
        <View style={styles.noticeBox}>
          <Ionicons name="cloud-offline-outline" size={16} color="#b7791f" />
          <Text style={styles.noticeText}>{apiNotice}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#667eea" />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      ) : null}

      <FormSection icon="person-outline" title="Datos del paciente">
        <Field label="CURP" value={form.curp} onChangeText={(value) => update('curp', value.toUpperCase())} placeholder="Ingrese CURP" autoCapitalize="characters" maxLength={18} />
        <Field label="Primer apellido" value={form.papell} onChangeText={(value) => update('papell', value)} placeholder="Primer apellido" />
        <Field label="Segundo apellido" value={form.sapell} onChangeText={(value) => update('sapell', value)} placeholder="Segundo apellido" />
        <Field label="Nombre completo" value={form.nom_pac} onChangeText={(value) => update('nom_pac', value)} placeholder="Nombre completo" />
        <Field label="Fecha de nacimiento" value={form.fecnac} onChangeText={(value) => update('fecnac', value)} placeholder="AAAA-MM-DD" />
        <Field label="Telefono" value={form.tel} onChangeText={(value) => update('tel', value)} placeholder="Telefono de contacto" keyboardType="phone-pad" />
      </FormSection>

      <FormSection icon="business-outline" title="Datos de atencion">
        <OptionGroup label="Area" options={options.areas || areas} value={form.area} onChange={(value) => update('area', value)} />
        <Field label="Cama o consultorio" value={form.cama} onChangeText={(value) => update('cama', value)} placeholder="Ej: CONS-02" />
        {(options.camas || []).length ? (
          <View style={styles.chipWrap}>
            {options.camas.map((bed) => (
              <TouchableOpacity
                key={bed.id_cama || bed.numero}
                onPress={() => update('cama', bed.numero || String(bed.id_cama))}
                style={[styles.chip, form.cama === bed.numero && styles.chipActive]}
              >
                <Text style={[styles.chipText, form.cama === bed.numero && styles.chipTextActive]}>
                  {bed.numero}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        <OptionGroup label="Motivo" options={options.motivos || reasons} value={form.motivo} onChange={(value) => update('motivo', value)} />
        <OptionGroup label="Especialidad" options={options.especialidades || specialties} value={form.especialidad} onChange={(value) => update('especialidad', value)} />
        <Field label="Alergias" value={form.alergias} onChangeText={(value) => update('alergias', value)} placeholder="Medicamentos, alimentos, etc." multiline />
      </FormSection>

      <FormSection icon="medkit-outline" title="Medicos asignados">
        <Text style={styles.helperText}>Selecciona hasta 5 medicos para la atencion.</Text>
        <View style={styles.chipWrap}>
          {doctorOptions.map((doctor) => {
            const active = assignedDoctors.includes(doctor.id) || assignedDoctors.includes(doctor.label);
            return (
              <TouchableOpacity
                key={doctor.id}
                onPress={() => toggleDoctor(doctor.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={active ? '#fff' : '#667eea'} />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{doctor.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </FormSection>

      <FormSection icon="call-outline" title="Familiar responsable">
        <Field label="Nombre del familiar" value={form.familiar} onChangeText={(value) => update('familiar', value)} placeholder="Nombre del familiar" />
        <Field label="Parentesco" value={form.parentesco} onChangeText={(value) => update('parentesco', value)} placeholder="Ej: Padre, Madre, Hermano" />
        <Field label="Telefono familiar" value={form.famTel} onChangeText={(value) => update('famTel', value)} placeholder="Telefono de contacto" keyboardType="phone-pad" />
      </FormSection>

      <View style={styles.footerActions}>
        <TouchableOpacity style={[styles.footerButton, styles.cancelButton]} onPress={() => navigation.goBack()}>
          <Ionicons name="close-circle-outline" size={18} color="#718096" />
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.footerButton, styles.saveButton]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Ionicons name="save-outline" size={18} color="#fff" />}
          <Text style={styles.saveText}>{mode === 'edit' ? 'Actualizar' : 'Guardar'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const FormSection = ({ icon, title, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={20} color="#667eea" />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const Field = ({ label, multiline, style, ...props }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      {...props}
      placeholderTextColor="#a0aec0"
      multiline={multiline}
      style={[styles.input, multiline && styles.textArea, style]}
    />
  </View>
);

const OptionGroup = ({ label, options, value, onChange }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.chipWrap}>
      {options.map((option) => {
        const active = option === value;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => onChange(option)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc' },
  contentContainer: { paddingBottom: 28 },
  header: {
    minHeight: 142,
    paddingTop: 56,
    paddingHorizontal: 18,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  headerSubtitle: { color: 'rgba(255,255,255,0.82)', fontSize: 12, marginTop: 4, textAlign: 'center' },
  lookupCard: {
    marginHorizontal: 16,
    marginTop: -22,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    boxShadow: '0 2px 8px rgba(45, 55, 72, 0.10)',
  },
  lookupIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#667eea18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  lookupBody: { flex: 1 },
  lookupTitle: { color: '#2d3748', fontSize: 14, fontWeight: '800' },
  lookupInput: {
    minHeight: 36,
    marginTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    color: '#2d3748',
    fontSize: 14,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    boxShadow: '0 2px 8px rgba(45, 55, 72, 0.08)',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#667eea18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: { color: '#2d3748', fontSize: 16, fontWeight: '900' },
  field: { marginBottom: 12 },
  label: { color: '#4a5568', fontSize: 12, fontWeight: '800', marginBottom: 6 },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f7fafc',
    paddingHorizontal: 12,
    color: '#2d3748',
    fontSize: 14,
  },
  textArea: { minHeight: 88, paddingTop: 12, textAlignVertical: 'top' },
  helperText: { color: '#718096', fontSize: 12, lineHeight: 18, marginBottom: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#cbd5e0',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: '#667eea', borderColor: '#667eea' },
  chipText: { color: '#4a5568', fontSize: 13, fontWeight: '700', marginLeft: 4 },
  chipTextActive: { color: '#fff' },
  footerActions: { flexDirection: 'row', marginHorizontal: 16, marginTop: 18 },
  footerButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cancelButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8 },
  saveButton: { backgroundColor: '#667eea', marginLeft: 8 },
  cancelText: { color: '#718096', fontSize: 14, fontWeight: '800', marginLeft: 6 },
  saveText: { color: '#fff', fontSize: 14, fontWeight: '900', marginLeft: 6 },
  noticeBox: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fffaf0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f6e05e',
  },
  noticeText: { color: '#744210', fontSize: 12, marginLeft: 8, flex: 1, lineHeight: 17 },
  loadingBox: { alignItems: 'center', paddingVertical: 16 },
  loadingText: { color: '#718096', fontSize: 13, marginTop: 8 },
});

export default NuevoPacienteScreen;
