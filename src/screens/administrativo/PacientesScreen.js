import React, { useEffect, useMemo, useState } from 'react';
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

const patientGroups = [
  {
    key: 'activos',
    title: 'Pacientes activos',
    accent: '#667eea',
    icon: 'people-outline',
    patients: [
      {
        record: 'INEO-000341',
        attention: 'A-2381',
        name: 'Mariana Lopez Ruiz',
        age: '54',
        birthDate: '1972-03-14',
        phone: '55 1234 9988',
        bed: 'CONS-02',
        admittedAt: '17 Jun 2026',
        area: 'Consulta',
        doctor: 'Dra. Sandoval',
      },
      {
        record: 'INEO-000331',
        attention: 'A-2376',
        name: 'Lucia Moreno Paz',
        age: '47',
        birthDate: '1979-11-02',
        phone: '55 4433 2211',
        bed: 'PREP-01',
        admittedAt: '17 Jun 2026',
        area: 'Preparacion',
        doctor: 'Dra. Castillo',
      },
    ],
  },
  {
    key: 'expedientes',
    title: 'Expedientes recientes',
    accent: '#ed8936',
    icon: 'folder-open-outline',
    patients: [
      {
        record: 'INEO-000326',
        attention: 'A-2371',
        name: 'Rafael Torres Luna',
        age: '70',
        birthDate: '1956-01-09',
        phone: '55 7777 9012',
        bed: 'REC-03',
        admittedAt: '16 Jun 2026',
        area: 'Recuperacion',
        doctor: 'Dr. Herrera',
      },
    ],
  },
  {
    key: 'altas',
    title: 'Altas recientes',
    accent: '#48bb78',
    icon: 'checkmark-circle-outline',
    patients: [
      {
        record: 'INEO-000318',
        attention: 'A-2362',
        name: 'Camila Soto Diaz',
        age: '31',
        birthDate: '1995-04-27',
        phone: '55 8181 3311',
        bed: 'REC-01',
        admittedAt: '15 Jun 2026',
        area: 'Alta',
        doctor: 'Dra. Vega',
      },
    ],
  },
];

const PATIENTS_PER_PAGE = 20;
const PacientesScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [groups, setGroups] = useState(patientGroups);
  const [summary, setSummary] = useState({ activos: 2, expedientes: 4, altas: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiNotice, setApiNotice] = useState('');

  const [visibleByGroup, setVisibleByGroup] = useState({
  activos: PATIENTS_PER_PAGE,
  expedientes: PATIENTS_PER_PAGE,
  altas: PATIENTS_PER_PAGE,
});

  const loadPatients = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const response = await adminService.getPatients(search);
      setGroups(response.groups || []);
      setSummary(response.summary || { activos: 0, expedientes: 0, altas: 0 });
      setApiNotice('');
    } catch (error) {
  console.log('ERROR GESTIÓN PACIENTES:', {
    message: error.message,
    code: error.code,
    baseURL: error.config?.baseURL,
    url: error.config?.url,
    status: error.response?.status,
    data: error.response?.data,
  });

  setApiNotice(
    error.response?.data?.error ||
    `No se pudo conectar con la API: ${error.message}`
  );
} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients({ silent: true });
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadPatients();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPatients({ silent: true });
  };

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query || !apiNotice) return groups;

    return groups
      .map((group) => ({
        ...group,
        patients: (group.patients || []).filter((patient) => {
          const text = `${patient.record} ${patient.attention} ${patient.name} ${patient.phone} ${patient.bed} ${patient.area}`.toLowerCase();
          return text.includes(query);
        }),
      }))
      .filter((group) => group.patients.length);
  }, [apiNotice, groups, search]);

  const goToDetail = (patient) => {
    navigation.navigate('PacienteDetail', { patient });
  };

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
          <Text style={styles.headerTitle}>Gestion de Pacientes</Text>
          <Text style={styles.headerSubtitle}>Registro, expedientes y cuentas</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('NuevoPaciente')} style={styles.headerButton}>
          <Ionicons name="person-add-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.actionGrid}>
        <ActionCard
          icon="person-add-outline"
          title="Nuevo paciente"
          color="#667eea"
          onPress={() => navigation.navigate('NuevoPaciente')}
        />
        <ActionCard
          icon="documents-outline"
          title="Documentos"
          color="#e53e3e"
          onPress={() => Alert.alert('Documentos', 'Estos PDFs se conectaran despues con la API.')}
        />
        <ActionCard
          icon="folder-open-outline"
          title="Expedientes"
          color="#ed8936"
          onPress={() => Alert.alert('Expedientes', 'La consulta de expedientes se conectara despues.')}
        />
        <ActionCard
          icon="stats-chart-outline"
          title="Censo"
          color="#38b2ac"
          onPress={() => navigation.navigate('Censo')}
        />
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#a0aec0" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar pacientes por nombre, expediente o telefono..."
          placeholderTextColor="#a0aec0"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.summaryStrip}>
        <Summary label="Activos" value={String(summary.activos || 0)} color="#667eea" />
        <Summary label="Expedientes" value={String(summary.expedientes || 0)} color="#ed8936" />
        <Summary label="Altas" value={String(summary.altas || 0)} color="#48bb78" />
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
          <Text style={styles.loadingText}>Cargando pacientes...</Text>
        </View>
      ) : null}

      {!loading && filteredGroups.length ? (
  filteredGroups.map((group) => {
    const visibleLimit =
      visibleByGroup[group.key] || PATIENTS_PER_PAGE;

    const visiblePatients = (group.patients || []).slice(
      0,
      visibleLimit
    );

    return (
      <View key={group.key} style={styles.section}>
        <View
          style={[
            styles.sectionHeader,
            { borderLeftColor: group.accent },
          ]}
        >
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name={group.icon}
              size={21}
              color={group.accent}
            />

            <Text style={styles.sectionTitle}>
              {group.title}
            </Text>
          </View>

          <Text
            style={[
              styles.sectionCount,
              { color: group.accent },
            ]}
          >
            {(group.patients || []).length}
          </Text>
        </View>

        {visiblePatients.map((patient, index) => (
          <View
            key={`${group.key}-${patient.id_atencion || patient.attention || patient.record}-${index}`}
            style={styles.patientCard}
          >
            <TouchableOpacity
              style={styles.patientMain}
              onPress={() => goToDetail(patient)}
            >
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: `${group.accent}18` },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={24}
                  color={group.accent}
                />
              </View>

              <View style={styles.patientText}>
                <Text style={styles.patientName} selectable>
                  {patient.name}
                </Text>

                <Text style={styles.patientMeta}>
                  {patient.record} - {patient.attention}
                </Text>

                <Text style={styles.patientMeta}>
                  {patient.area} - {patient.bed}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#a0aec0"
              />
            </TouchableOpacity>

            <View style={styles.detailGrid}>
              <Info
                label="Edad"
                value={`${patient.age} anos`}
              />

              <Info
                label="Nacimiento"
                value={patient.birthDate}
              />

              <Info
                label="Telefono"
                value={patient.phone}
              />

              <Info
                label="Ingreso"
                value={patient.admittedAt}
              />
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[
                  styles.cardButton,
                  styles.editButton,
                ]}
                onPress={() =>
                  navigation.navigate('NuevoPaciente', {
                    mode: 'edit',
                    patient,
                  })
                }
              >
                <Ionicons
                  name="create-outline"
                  size={16}
                  color="#667eea"
                />

                <Text
                  style={[
                    styles.cardButtonText,
                    { color: '#667eea' },
                  ]}
                >
                  Editar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cardButton,
                  styles.accountButton,
                ]}
                onPress={() => goToDetail(patient)}
              >
                <Ionicons
                  name="receipt-outline"
                  size={16}
                  color="#48bb78"
                />

                <Text
                  style={[
                    styles.cardButtonText,
                    { color: '#48bb78' },
                  ]}
                >
                  Cuenta
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {visiblePatients.length <
        (group.patients || []).length ? (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={() =>
              setVisibleByGroup((current) => ({
                ...current,
                [group.key]:
                  (current[group.key] ||
                    PATIENTS_PER_PAGE) +
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
              {(group.patients || []).length -
                visiblePatients.length}{' '}
              restantes
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  })
) : !loading ? (
  <View style={styles.emptyState}>
    <Ionicons
      name="search-outline"
      size={36}
      color="#a0aec0"
    />

    <Text style={styles.emptyTitle}>
      Sin resultados
    </Text>

    <Text style={styles.emptyText}>
      Intenta con otro nombre, expediente o telefono.
    </Text>
  </View>
) : null}
</ScrollView>
);
};

const ActionCard = ({ icon, title, color, onPress }) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress}>
    <View style={[styles.actionIcon, { backgroundColor: `${color}18` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.actionTitle}>{title}</Text>
  </TouchableOpacity>
);

const Summary = ({ label, value, color }) => (
  <View style={styles.summaryItem}>
    <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

const Info = ({ label, value }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} selectable>{value}</Text>
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
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  headerSubtitle: { color: 'rgba(255,255,255,0.82)', fontSize: 12, marginTop: 4, textAlign: 'center' },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: -24,
  },
  actionCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    boxShadow: '0 2px 8px rgba(45, 55, 72, 0.10)',
  },
  actionIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionTitle: { color: '#2d3748', fontSize: 14, fontWeight: '800' },
  searchBox: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: { flex: 1, marginLeft: 8, color: '#2d3748', fontSize: 14 },
  summaryStrip: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    boxShadow: '0 2px 8px rgba(45, 55, 72, 0.08)',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] },
  summaryLabel: { color: '#718096', fontSize: 11, marginTop: 2 },
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
    marginBottom: 12,
    boxShadow: '0 1px 5px rgba(45, 55, 72, 0.08)',
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  sectionTitle: { color: '#2d3748', fontSize: 15, fontWeight: '800', marginLeft: 8 },
  sectionCount: { fontSize: 15, fontWeight: '900', fontVariant: ['tabular-nums'] },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(45, 55, 72, 0.08)',
  },
  patientMain: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  patientText: { flex: 1 },
  patientName: { color: '#2d3748', fontSize: 16, fontWeight: '800' },
  patientMeta: { color: '#718096', fontSize: 12, marginTop: 2 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 },
  infoItem: { width: '50%', marginBottom: 10, paddingRight: 8 },
  infoLabel: { color: '#a0aec0', fontSize: 10, textTransform: 'uppercase', fontWeight: '700' },
  infoValue: { color: '#4a5568', fontSize: 13, marginTop: 2 },
  cardActions: { flexDirection: 'row', marginTop: 4 },
  cardButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginRight: 8,
  },
  editButton: { backgroundColor: '#667eea16' },
  accountButton: { backgroundColor: '#48bb7816', marginRight: 0 },
  cardButtonText: { fontSize: 13, fontWeight: '800', marginLeft: 6 },
  emptyState: { alignItems: 'center', margin: 16, backgroundColor: '#fff', borderRadius: 16, padding: 28 },
  emptyTitle: { color: '#2d3748', fontSize: 16, fontWeight: '800', marginTop: 10 },
  emptyText: { color: '#718096', fontSize: 13, textAlign: 'center', marginTop: 4 },
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

export default PacientesScreen;
