import React, { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  RefreshControl,
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

const censusSections = [
  {
    key: 'consulta',
    title: 'Pacientes en consulta',
    searchPlaceholder: 'Buscar en consulta...',
    accent: '#4299e1',
    icon: 'people-outline',
    roomLabel: 'Consultorio',
    data: [
      {
        account: 'A-2381',
        room: 'CONS-02',
        admittedAt: '17 Jun 2026 - 08:35',
        patient: 'Mariana Lopez Ruiz',
        age: '54',
        reason: 'Valoracion oftalmologica',
        record: 'INEO-000341',
        doctor: 'Dra. Sandoval',
        notice: 'Sin aviso',
      },
      {
        account: 'A-2379',
        room: 'CONS-04',
        admittedAt: '17 Jun 2026 - 07:50',
        patient: 'Hector Garcia Neri',
        age: '62',
        reason: 'Revision postoperatoria',
        record: 'INEO-000338',
        doctor: 'Dr. Ramos',
        notice: 'Pendiente firma',
      },
    ],
  },
  {
    key: 'preparacion',
    title: 'Pacientes en preparacion',
    searchPlaceholder: 'Buscar en preparacion...',
    accent: '#f56565',
    icon: 'alert-circle-outline',
    roomLabel: 'Espacio',
    data: [
      {
        account: 'A-2376',
        room: 'PREP-01',
        admittedAt: '17 Jun 2026 - 06:20',
        patient: 'Lucia Moreno Paz',
        age: '47',
        reason: 'Cirugia programada',
        record: 'INEO-000331',
        doctor: 'Dra. Castillo',
        notice: 'Alergia penicilina',
      },
    ],
  },
  {
    key: 'recuperacion',
    title: 'Pacientes en recuperacion',
    searchPlaceholder: 'Buscar en recuperacion...',
    accent: '#48bb78',
    icon: 'bed-outline',
    roomLabel: 'Consultorio',
    data: [
      {
        account: 'A-2371',
        room: 'REC-03',
        admittedAt: '16 Jun 2026 - 18:45',
        patient: 'Rafael Torres Luna',
        age: '70',
        reason: 'Observacion posterior',
        record: 'INEO-000326',
        doctor: 'Dr. Herrera',
        notice: 'Alta probable',
      },
      {
        account: 'A-2369',
        room: 'REC-05',
        admittedAt: '16 Jun 2026 - 16:10',
        patient: 'Ana Sofia Perez',
        age: '39',
        reason: 'Tratamiento intravitreo',
        record: 'INEO-000321',
        doctor: 'Dra. Vega',
        notice: 'Revisar cuenta',
      },
    ],
  },
];


const matchesSearch = (patient, query) => {
  const text = `${patient.account} ${patient.room} ${patient.patient} ${patient.record} ${patient.doctor} ${patient.reason}`.toLowerCase();
  return text.includes(query.trim().toLowerCase());
};

const PATIENTS_PER_PAGE = 20;
const CensoScreen = ({ navigation }) => {
  const [searches, setSearches] = useState({
    consulta: '',
    preparacion: '',
    recuperacion: '',
  });
  const [sections, setSections] = useState(censusSections);
  const [summary, setSummary] = useState({ activos: 5, areas: 3, avisos: 3 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiNotice, setApiNotice] = useState('');

  const [visibleBySection, setVisibleBySection] = useState({
  consulta: PATIENTS_PER_PAGE,
  preparacion: PATIENTS_PER_PAGE,
  recuperacion: PATIENTS_PER_PAGE,
});


  const loadCensus = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const response = await adminService.getCensus();
      setSections(response.sections || censusSections);
      setSummary(response.summary || { activos: 0, areas: 0, avisos: 0 });
      setApiNotice('');
    } catch (error) {
      setApiNotice('Mostrando datos locales. No se pudo consultar el censo en la API.');
      setSections(censusSections);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCensus();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCensus({ silent: true });
  };

  const updateSearch = (key, value) => {
    setSearches((current) => ({ ...current, [key]: value }));
  };

  const renderPatient = (patient, accent, roomLabel, index) => (
  <View
    key={`${patient.id_atencion || patient.account}-${patient.Id_exp || patient.record}-${index}`}
    style={styles.patientCard}
  >
    <View style={styles.patientTopRow}>
      <View style={[styles.accountBadge, { backgroundColor: `${accent}18` }]}>
        <Ionicons name="receipt-outline" size={16} color={accent} />

        <Text style={[styles.accountText, { color: accent }]} selectable>
          {patient.account}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.smallAction}
        onPress={() =>
          Alert.alert(
            'Vista pendiente',
            'Aqui se conectara el alta del paciente.'
          )
        }
      >
        <Ionicons
          name="checkmark-circle-outline"
          size={18}
          color="#48bb78"
        />

        <Text style={styles.smallActionText}>Alta</Text>
      </TouchableOpacity>
    </View>

    <Text style={styles.patientName} selectable>
      {patient.patient}
    </Text>

    <View style={styles.infoGrid}>
      <InfoItem label={roomLabel} value={patient.room} />
      <InfoItem label="Ingreso" value={patient.admittedAt} />
      <InfoItem label="Edad" value={`${patient.age} anos`} />
      <InfoItem label="Exp" value={patient.record} />
      <InfoItem label="Medico" value={patient.doctor} />

      <InfoItem
        label="Aviso"
        value={patient.notice}
        strong={patient.notice !== 'Sin aviso'}
      />
    </View>

    <View style={styles.reasonBox}>
      <Text style={styles.reasonLabel}>Motivo</Text>

      <Text style={styles.reasonText} selectable>
        {patient.reason}
      </Text>
    </View>
  </View>
);

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Censo de Pacientes</Text>
          <Text style={styles.headerSubtitle}>Consulta, preparacion y recuperacion</Text>
        </View>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => Alert.alert('Impresion pendiente', 'El PDF del censo se conectara cuando este lista la API.')}
        >
          <Ionicons name="print-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.summaryRow}>
        <SummaryCard icon="people-outline" label="Activos" value={String(summary.activos || 0)} color="#667eea" />
        <SummaryCard icon="business-outline" label="Areas" value={String(summary.areas || 0)} color="#48bb78" />
        <SummaryCard icon="alert-circle-outline" label="Avisos" value={String(summary.avisos || 0)} color="#ed8936" />
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
          <Text style={styles.loadingText}>Cargando censo...</Text>
        </View>
      ) : null}

      {sections.map((section) => {
        const query = searches[section.key] || '';

const filtered = (section.data || []).filter((patient) =>
  matchesSearch(patient, query)
);

const visibleLimit =
  visibleBySection[section.key] || PATIENTS_PER_PAGE;

const visiblePatients = filtered.slice(0, visibleLimit);

        return (
          <View key={section.key} style={styles.section}>
            <View style={[styles.sectionHeader, { borderLeftColor: section.accent }]}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name={section.icon} size={22} color={section.accent} />
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <View style={[styles.countPill, { backgroundColor: section.accent }]}>
                <Text style={styles.countText}>{filtered.length}</Text>
              </View>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color="#a0aec0" />
              <TextInput
                value={query}
                onChangeText={(value) => updateSearch(section.key, value)}
                placeholder={section.searchPlaceholder}
                placeholderTextColor="#a0aec0"
                style={styles.searchInput}
              />
            </View>

            {visiblePatients.length ? (
  <>
    {visiblePatients.map((patient, index) =>
      renderPatient(
        patient,
        section.accent,
        section.roomLabel,
        index
      )
    )}

    {visiblePatients.length < filtered.length ? (
      <TouchableOpacity
        style={styles.loadMoreButton}
        onPress={() =>
          setVisibleBySection((current) => ({
            ...current,
            [section.key]:
              (current[section.key] || PATIENTS_PER_PAGE) +
              PATIENTS_PER_PAGE,
          }))
        }
      >
        <Ionicons
          name="chevron-down-outline"
          size={18}
          color="#667eea"
        />

        <Text style={styles.loadMoreText}>
          Mostrar 20 más
        </Text>

        <Text style={styles.remainingText}>
          {filtered.length - visiblePatients.length} restantes
        </Text>
      </TouchableOpacity>
    ) : null}
  </>
) : (
  <View style={styles.emptyState}>
    <Ionicons
      name="file-tray-outline"
      size={34}
      color="#a0aec0"
    />

    <Text style={styles.emptyText}>
      No hay pacientes para mostrar
    </Text>
  </View>
)}
          </View>
        );
      })}
    </ScrollView>
  );
};

const InfoItem = ({ label, value, strong }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, strong && styles.infoValueStrong]} selectable>
      {value}
    </Text>
  </View>
);

const SummaryCard = ({ icon, label, value, color }) => (
  <View style={styles.summaryCard}>
    <View style={[styles.summaryIcon, { backgroundColor: `${color}18` }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.summaryValue}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
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
  loadMoreButton: {
  backgroundColor: '#fff',
  borderRadius: 14,
  minHeight: 52,
  marginBottom: 12,
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  borderWidth: 1,
  borderColor: '#c3dafe',
},

loadMoreText: {
  color: '#667eea',
  fontSize: 13,
  fontWeight: '800',
  marginLeft: 6,
},

remainingText: {
  color: '#718096',
  fontSize: 11,
  marginLeft: 8,
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
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -24,
    marginBottom: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginHorizontal: 4,
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(45, 55, 72, 0.10)',
  },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#2d3748', fontVariant: ['tabular-nums'] },
  summaryLabel: { fontSize: 11, color: '#718096', marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 18 },
  sectionHeader: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 1px 5px rgba(45, 55, 72, 0.08)',
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#2d3748', marginLeft: 8, textTransform: 'uppercase' },
  countPill: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countText: { color: '#fff', fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  searchBox: {
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: { flex: 1, marginLeft: 8, color: '#2d3748', fontSize: 14 },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(45, 55, 72, 0.08)',
  },
  patientTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  accountText: { fontSize: 12, fontWeight: '800', marginLeft: 6 },
  smallAction: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 8 },
  smallActionText: { color: '#48bb78', fontSize: 12, fontWeight: '700', marginLeft: 4 },
  patientName: { color: '#2d3748', fontSize: 17, fontWeight: '800', marginTop: 12 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  infoItem: { width: '50%', paddingRight: 8, marginBottom: 10 },
  infoLabel: { fontSize: 10, color: '#a0aec0', textTransform: 'uppercase', fontWeight: '700' },
  infoValue: { fontSize: 13, color: '#4a5568', marginTop: 2 },
  infoValueStrong: { color: '#c05621', fontWeight: '700' },
  reasonBox: { backgroundColor: '#f7fafc', borderRadius: 12, padding: 12, marginTop: 2 },
  reasonLabel: { fontSize: 10, color: '#a0aec0', textTransform: 'uppercase', fontWeight: '700' },
  reasonText: { color: '#4a5568', fontSize: 13, marginTop: 3, lineHeight: 18 },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    minHeight: 118,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { color: '#a0aec0', fontSize: 13, marginTop: 8 },
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
  loadingBox: { alignItems: 'center', paddingVertical: 24 },
  loadingText: { color: '#718096', fontSize: 13, marginTop: 8 },
});

export default CensoScreen;
