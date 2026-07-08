import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import adminService from '../../services/adminService';

const PATIENTS_PER_PAGE = 5;
const CACHE_TIME = 1000 * 60 * 5;

const patientGroupsFallback = [
  {
    key: 'activos',
    title: 'Pacientes activos',
    accent: '#667eea',
    icon: 'people-outline',
    patients: [],
    pagination: {
      page: 1,
      limit: PATIENTS_PER_PAGE,
      total: 0,
      total_pages: 1,
      has_more: false,
    },
  },
  {
    key: 'expedientes',
    title: 'Expedientes recientes',
    accent: '#ed8936',
    icon: 'folder-open-outline',
    patients: [],
    pagination: {
      page: 1,
      limit: PATIENTS_PER_PAGE,
      total: 0,
      total_pages: 1,
      has_more: false,
    },
  },
  {
    key: 'altas',
    title: 'Altas recientes',
    accent: '#48bb78',
    icon: 'checkmark-circle-outline',
    patients: [],
    pagination: {
      page: 1,
      limit: PATIENTS_PER_PAGE,
      total: 0,
      total_pages: 1,
      has_more: false,
    },
  },
];

const patientsCache = new Map();

const getCacheKey = (search = '', page = 1) => (
  `${search.trim().toLowerCase()}::${page}`
);

const normalizeGroups = (response) => {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return [
      {
        key: 'activos',
        title: 'Pacientes activos',
        accent: '#667eea',
        icon: 'people-outline',
        patients: response,
        pagination: {
          page: 1,
          limit: response.length,
          total: response.length,
          total_pages: 1,
          has_more: false,
        },
      },
    ];
  }

  return response.groups || response.data || [];
};

const normalizeSummary = (response) => {
  const summary = response?.summary || {};

  return {
    activos: summary.activos || 0,
    expedientes: summary.expedientes || 0,
    altas: summary.altas || 0,
  };
};

const getPatientKey = (patient, index = 0) => (
  String(
    patient?.id_atencion ||
    patient?.idAtencion ||
    patient?.attention ||
    patient?.record ||
    patient?.id_exp ||
    patient?.idExp ||
    index
  )
);

const mergeGroups = (currentGroups, nextGroups) => {
  const currentByKey = new Map(
    (currentGroups || []).map((group) => [group.key, group])
  );

  return (nextGroups || []).map((nextGroup) => {
    const currentGroup = currentByKey.get(nextGroup.key);

    if (!currentGroup) {
      return {
        ...nextGroup,
        patients: nextGroup.patients || [],
      };
    }

    const usedKeys = new Set();
    const mergedPatients = [];

    [...(currentGroup.patients || []), ...(nextGroup.patients || [])].forEach((patient, index) => {
      const key = getPatientKey(patient, index);

      if (!usedKeys.has(key)) {
        usedKeys.add(key);
        mergedPatients.push(patient);
      }
    });

    return {
      ...currentGroup,
      ...nextGroup,
      patients: mergedPatients,
    };
  });
};

const hasMoreGroups = (groups = []) => (
  groups.some((group) => Boolean(group?.pagination?.has_more))
);

const getGroupTotal = (group) => (
  group?.pagination?.total ?? group?.patients?.length ?? 0
);

const formatValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  return String(value);
};

const formatAge = (value) => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  const text = String(value);

  if (text.toLowerCase().includes('año') || text.toLowerCase().includes('ano')) {
    return text;
  }

  return `${text} años`;
};

const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  const text = String(value);

  if (!text.includes('T')) {
    return text;
  }

  const [date] = text.split('T');

  return date || text;
};

const PacientesScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [groups, setGroups] = useState(patientGroupsFallback);
  const [summary, setSummary] = useState({ activos: 0, expedientes: 0, altas: 0 });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [apiNotice, setApiNotice] = useState('');

  const requestIdRef = useRef(0);

  const applyPatientsResponse = useCallback((response, requestedPage, append = false) => {
    const nextGroups = normalizeGroups(response);
    const nextSummary = normalizeSummary(response);

    setGroups((currentGroups) => (
      append ? mergeGroups(currentGroups, nextGroups) : nextGroups
    ));

    setSummary(nextSummary);
    setPage(requestedPage);
    setHasMore(hasMoreGroups(nextGroups));
    setApiNotice('');
  }, []);

  const loadPatients = useCallback(async ({
    requestedPage = 1,
    append = false,
    forceRefresh = false,
    silent = false,
  } = {}) => {
    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;

    const cacheKey = getCacheKey(debouncedSearch, requestedPage);
    const cachedData = patientsCache.get(cacheKey);
    const cacheIsValid =
      cachedData &&
      Date.now() - cachedData.timestamp < CACHE_TIME;

    if (!forceRefresh && cacheIsValid) {
      applyPatientsResponse(cachedData.data, requestedPage, append);
      setLoadingInitial(false);
      setLoadingMore(false);
      setRefreshing(false);
      return;
    }

    try {
      if (append) {
        setLoadingMore(true);
      } else if (!silent) {
        setLoadingInitial(true);
      }

      const response = await adminService.getPatients(
        debouncedSearch,
        requestedPage,
        PATIENTS_PER_PAGE
      );

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      patientsCache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
      });

      applyPatientsResponse(response, requestedPage, append);
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      console.log('ERROR GESTIÓN PACIENTES:', {
        message: error.message,
        code: error.code,
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
      });

      if (cachedData) {
        applyPatientsResponse(cachedData.data, requestedPage, append);
        setApiNotice('Mostrando información guardada en caché.');
      } else {
        setApiNotice(
          error.response?.data?.error ||
          `No se pudo conectar con la API: ${error.message}`
        );
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoadingInitial(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    }
  }, [applyPatientsResponse, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 450);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadPatients({
      requestedPage: 1,
      append: false,
      forceRefresh: false,
      silent: false,
    });
  }, [debouncedSearch, loadPatients]);

  const onRefresh = () => {
    setRefreshing(true);

    loadPatients({
      requestedPage: 1,
      append: false,
      forceRefresh: true,
      silent: true,
    });
  };

  const loadMorePatients = () => {
    if (loadingMore || loadingInitial || !hasMore) {
      return;
    }

    loadPatients({
      requestedPage: page + 1,
      append: true,
      forceRefresh: false,
      silent: true,
    });
  };

  const goToDetail = (patient) => {
    navigation.navigate('PacienteDetail', { patient });
  };

  const listData = useMemo(() => {
    const rows = [];

    (groups || []).forEach((group) => {
      const patients = group.patients || [];

      if (!patients.length) {
        return;
      }

      rows.push({
        type: 'section',
        key: `section-${group.key}`,
        group,
      });

      patients.forEach((patient, index) => {
        rows.push({
          type: 'patient',
          key: `${group.key}-${getPatientKey(patient, index)}-${index}`,
          group,
          patient,
        });
      });
    });

    return rows;
  }, [groups]);

  const renderItem = ({ item }) => {
    if (item.type === 'section') {
      const { group } = item;

      return (
        <View style={styles.section}>
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
              {getGroupTotal(group)}
            </Text>
          </View>
        </View>
      );
    }

    const { patient, group } = item;

    return (
      <View style={styles.patientWrapper}>
        <View style={styles.patientCard}>
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
                {formatValue(patient.name)}
              </Text>

              <Text style={styles.patientMeta}>
                {formatValue(patient.record)} - {formatValue(patient.attention)}
              </Text>

              <Text style={styles.patientMeta}>
                {formatValue(patient.area)} - {formatValue(patient.bed)}
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
              value={formatAge(patient.age)}
            />

            <Info
              label="Nacimiento"
              value={formatDate(patient.birthDate)}
            />

            <Info
              label="Telefono"
              value={formatValue(patient.phone)}
            />

            <Info
              label="Ingreso"
              value={formatDate(patient.admittedAt)}
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
      </View>
    );
  };

  const ListHeader = (
    <>
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
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
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

      {loadingInitial ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#667eea" />
          <Text style={styles.loadingText}>Cargando pacientes...</Text>
        </View>
      ) : null}
    </>
  );

  const ListFooter = (
    <>
      {!loadingInitial && hasMore ? (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={loadMorePatients}
          disabled={loadingMore}
        >
          {loadingMore ? (
            <ActivityIndicator color="#667eea" />
          ) : (
            <>
              <Ionicons
                name="chevron-down-outline"
                size={18}
                color="#667eea"
              />

              <Text style={styles.loadMoreText}>
                Mostrar 5 más
              </Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}

      <View style={styles.footerSpace} />
    </>
  );

  const EmptyComponent = !loadingInitial ? (
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
  ) : null;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      data={listData}
      keyExtractor={(item) => item.key}
      renderItem={renderItem}
      ListHeaderComponent={ListHeader}
      ListFooterComponent={ListFooter}
      ListEmptyComponent={EmptyComponent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={5}
      removeClippedSubviews
      keyboardShouldPersistTaps="handled"
    />
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
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
    shadowColor: '#2d3748',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    color: '#2d3748',
    fontSize: 14,
    fontWeight: '800',
  },
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
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: '#2d3748',
    fontSize: 14,
  },
  summaryStrip: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    shadowColor: '#2d3748',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    color: '#718096',
    fontSize: 11,
    marginTop: 2,
  },
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
  noticeText: {
    color: '#744210',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    lineHeight: 17,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    color: '#718096',
    fontSize: 13,
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
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
    shadowColor: '#2d3748',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    color: '#2d3748',
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },
  sectionCount: {
    fontSize: 15,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  patientWrapper: {
    paddingHorizontal: 16,
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#2d3748',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  patientMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientText: {
    flex: 1,
  },
  patientName: {
    color: '#2d3748',
    fontSize: 16,
    fontWeight: '800',
  },
  patientMeta: {
    color: '#718096',
    fontSize: 12,
    marginTop: 2,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
  },
  infoItem: {
    width: '50%',
    marginBottom: 10,
    paddingRight: 8,
  },
  infoLabel: {
    color: '#a0aec0',
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  infoValue: {
    color: '#4a5568',
    fontSize: 13,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  cardButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginRight: 8,
  },
  editButton: {
    backgroundColor: '#667eea16',
  },
  accountButton: {
    backgroundColor: '#48bb7816',
    marginRight: 0,
  },
  cardButtonText: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  loadMoreButton: {
    backgroundColor: '#fff',
    borderRadius: 14,
    minHeight: 52,
    marginHorizontal: 16,
    marginTop: 6,
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
  emptyState: {
    alignItems: 'center',
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
  },
  emptyTitle: {
    color: '#2d3748',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
  },
  emptyText: {
    color: '#718096',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  footerSpace: {
    height: 24,
  },
});

export default PacientesScreen;