import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { getCache, setCache, CacheKeys, invalidateCachePrefix, removeCache } from '../../services/EstudiosCache';

const SECTIONS = [
  { id: 'solicitudes_lab', labelKey: 'labRequests', icon: 'flask-outline' },
  { id: 'solicitudes_gab', labelKey: 'imagingRequests', icon: 'scan-outline' },
  { id: 'resultados_lab', labelKey: 'labResults', icon: 'document-text-outline' },
  { id: 'resultados_gab', labelKey: 'imagingResults', icon: 'image-outline' },
];

const SECTION_CONFIG = {
  solicitudes_lab: {
    endpoint: '/pending',
    type: 'LABORATORIO',
    isPending: true,
  },
  solicitudes_gab: {
    endpoint: '/pending',
    type: 'GABINETE',
    isPending: true,
  },
  resultados_lab: {
    endpoint: '/completed',
    type: 'LABORATORIO',
    isPending: false,
  },
  resultados_gab: {
    endpoint: '/completed',
    type: 'GABINETE',
    isPending: false,
  },
};

const PAGE_SIZE = 5;
const FETCH_ALL_LIMIT = 9999;

const EstudiosScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const [selectedSection, setSelectedSection] = useState('solicitudes_lab');
  const [allItems, setAllItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [counts, setCounts] = useState({ laboratorio: 0, gabinete: 0, total: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const initialLoadDone = useRef(false);
  const skipFocusRefresh = useRef(false);

  useEffect(() => {
    const initialSection = route?.params?.initialSection;
    if (initialSection && SECTION_CONFIG[initialSection] && initialSection !== selectedSection) {
      setSelectedSection(initialSection);
    }
  }, [route?.params?.initialSection, selectedSection]);

  const normalizeItem = (item = {}) => ({
    id_examen: item.id_examen ?? item._id ?? '',
    paciente: typeof item.paciente === 'string'
      ? item.paciente
      : item.paciente?.nombre || item.nombre_paciente || t('studies.patient'),
    medico: typeof item.medico === 'string'
      ? item.medico
      : item.medico?.nombre || item.nombre_medico || t('studies.notAssigned'),
    estudios: Array.isArray(item.estudios)
      ? item.estudios.join(', ')
      : item.estudios || t('studies.noStudies'),
    fecha: item.fecha_solicitud || item.fecha || null,
    fecha_realizado: item.fecha_realizado || null,
    habitacion: item.habitacion || item.numero_habitacion || item.cama || t('studies.noInfo'),
  });

  const loadAllData = useCallback(async (force = false) => {
    const config = SECTION_CONFIG[selectedSection];
    if (!config) {
      setAllItems([]);
      setError(t('studies.invalidSection'));
      return;
    }

    const cacheKey = CacheKeys.estudiosAll(
      config.type,
      config.isPending ? 'pending' : 'completed'
    );

    try {
      setLoading(true);
      setError('');

      let data = null;
      if (!force) {
        const cached = await getCache(cacheKey);
        if (cached) {
          data = cached;
          console.log(`📦 Load from cache: ${cacheKey}`);
        }
      }

      if (!data) {
        console.log(`🌐 Loading from API for ${selectedSection}...`);
        const response = await api.get(`/exams${config.endpoint}`, {
          params: {
            type: config.type,
            page: 1,
            limit: FETCH_ALL_LIMIT,
          },
        });
        data = Array.isArray(response.data) ? response.data : [];
        await setCache(cacheKey, data);
        console.log(`💾 Saved to cache: ${cacheKey} (${data.length} records)`);
      }

      let normalized = data.map(normalizeItem);
      normalized.sort((a, b) => {
        const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
        const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
        return dateB - dateA;
      });

      setAllItems(normalized);
      setCurrentPage(1);
    } catch (err) {
      const errorMsg = err.response?.data?.error || t('studies.loadError');
      setError(errorMsg);
      setAllItems([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSection, t]);

  const loadCounts = useCallback(async (force = false) => {
    try {
      if (!force) {
        const cached = await getCache(CacheKeys.counts);
        if (cached) {
          setCounts(cached);
          return;
        }
      }
      const response = await api.get('/exams/counts');
      const counts = {
        laboratorio: response.data?.laboratorio ?? 0,
        gabinete: response.data?.gabinete ?? 0,
        total: response.data?.total ?? 0,
      };
      setCounts(counts);
      await setCache(CacheKeys.counts, counts);
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  }, []);

  useEffect(() => {
    skipFocusRefresh.current = false;
    loadAllData();
    loadCounts();
    initialLoadDone.current = true;
  }, [selectedSection, loadAllData, loadCounts]);

  useFocusEffect(
    useCallback(() => {
      if (!initialLoadDone.current) return;
      if (skipFocusRefresh.current) {
        skipFocusRefresh.current = false;
        return;
      }
      loadAllData();
      loadCounts();
    }, [loadAllData, loadCounts])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    skipFocusRefresh.current = true;
    await Promise.all([
      loadAllData(true),
      loadCounts(true)
    ]);
    setRefreshing(false);
    skipFocusRefresh.current = false;
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleUpload = (id_examen) => {
    const tipo = selectedSection.includes('lab') ? 'LABORATORIO' : 'GABINETE';
    skipFocusRefresh.current = false;
    navigation.navigate('SubirResultado', { id_examen, tipo });
  };

  const handleView = (id_examen) => {
    const tipo = selectedSection.includes('lab') ? 'LABORATORIO' : 'GABINETE';
    const screen = tipo === 'LABORATORIO' ? 'VerResultadoLab' : 'VerResultadoGab';
    navigation.navigate(screen, { id_examen, tipo });
  };

  const handleEdit = (id_examen) => {
    const tipo = selectedSection.includes('lab') ? 'LABORATORIO' : 'GABINETE';
    const screen = tipo === 'LABORATORIO' ? 'EditarResultadoLab' : 'EditarResultadoGab';
    navigation.navigate(screen, { id_examen, tipo });
  };

  const handleDelete = (id_examen) => {
    const tipo = selectedSection.includes('lab') ? 'laboratorio' : 'gabinete';
    Alert.alert(
      t('studies.confirmDeletion'),
      t('studies.deleteWarning', { type: tipo === 'laboratorio' ? t('studies.laboratory') : t('studies.imaging') }),
      [
        { text: t('studies.cancel'), style: 'cancel' },
        {
          text: t('studies.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/exams/${id_examen}/results?type=${tipo}`);
              await invalidateCachePrefix('estudios_all_');
              await removeCache(CacheKeys.counts);
              await loadAllData(true);
              await loadCounts(true);
            } catch (error) {
              Alert.alert(t('studies.error'), t('studies.deleteError'));
            }
          },
        },
      ]
    );
  };

  const getPaginatedItems = () => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return allItems.slice(start, end);
  };

  const totalPages = Math.ceil(allItems.length / PAGE_SIZE);

  const renderItem = ({ item }) => {
    const isPending = selectedSection.startsWith('solicitudes');
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {String(item.paciente || 'P').charAt(0)}
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.patientName}>{item.paciente}</Text>
            <Text style={styles.patientDetail}>
              <Ionicons name="bed-outline" size={14} color="#718096" /> {item.habitacion}
            </Text>
          </View>
          {!isPending && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#48bb78" />
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="flask-outline" size={16} color="#4a5568" style={styles.infoIcon} />
            <Text style={styles.examsList}>{item.estudios}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#4a5568" style={styles.infoIcon} />
            <Text style={styles.dateText}>
              {`${t('studies.requested')} ${item.fecha ? new Date(item.fecha).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX') : t('studies.dateUnavailable')}`}
            </Text>
          </View>
          {!isPending && item.fecha_realizado && (
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color="#4a5568" style={styles.infoIcon} />
              <Text style={styles.dateText}>
                {`${t('studies.performed')} ${new Date(item.fecha_realizado).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX')}`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          {isPending ? (
            <TouchableOpacity style={[styles.actionButton, styles.uploadButton]} onPress={() => handleUpload(item.id_examen)}>
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
              <Text style={styles.actionText}>{t('studies.upload')}</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={[styles.actionButton, styles.viewButton]} onPress={() => handleView(item.id_examen)}>
                <Ionicons name="eye-outline" size={18} color="#fff" />
                <Text style={styles.actionText}>{t('studies.view')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => handleEdit(item.id_examen)}>
                <Ionicons name="create-outline" size={18} color="#fff" />
                <Text style={styles.actionText}>{t('studies.edit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(item.id_examen)}>
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={styles.actionText}>{t('studies.delete')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    const isPending = selectedSection.startsWith('solicitudes');
    return (
      <View style={styles.emptyState}>
        <Ionicons name={isPending ? "document-text-outline" : "checkbox-outline"} size={64} color="#cbd5e0" />
        <Text style={styles.emptyText}>
          {isPending ? t('studies.noPendingRequests') : t('studies.noResults')}
        </Text>
        <Text style={styles.emptySubtext}>
          {isPending ? t('studies.allRequestsCompleted') : t('studies.noResultsUploaded')}
        </Text>
      </View>
    );
  };

  const paginatedItems = getPaginatedItems();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="flask-outline" size={22} color="#fff" />
          <Text style={styles.headerTitle}>{t('studies.module')}</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.welcomeCard}>
        <View>
          <Text style={styles.welcomeTitle}>{t('studies.helloDoctor', { user: user?.username || t('studies.user') })}</Text>
          <Text style={styles.welcomeSubtitle}>
            {new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </View>
        <View style={styles.statsPill}>
          <Ionicons name="clipboard-outline" size={16} color="#667eea" />
          <Text style={styles.statsPillText}>{t('studies.total')}: {counts.total}</Text>
        </View>
      </View>

      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {SECTIONS.map((section) => {
            const isActive = selectedSection === section.id;
            let color = '#4299e1';
            if (section.id.includes('lab')) color = '#8d7197e4';
            else if (section.id.includes('gab')) color = '#8d7197e4';
            if (section.id.startsWith('resultados')) color = '#8d7197e4';
            return (
              <TouchableOpacity
                key={section.id}
                style={[styles.tab, isActive && styles.activeTab]}
                onPress={() => {
                  setSelectedSection(section.id);
                  skipFocusRefresh.current = true;
                }}
              >
                <Ionicons name={section.icon} size={18} color={isActive ? '#fff' : '#718096'} />
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                  {t(`studies.${section.labelKey}`)}
                </Text>
                {isActive && <View style={[styles.activeIndicator, { backgroundColor: color }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.listArea}>
        {error ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={64} color="#e53e3e" />
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : (
          <>
            <FlatList
              key={selectedSection}
              data={paginatedItems}
              renderItem={renderItem}
              keyExtractor={(item, index) => `${item.id_examen}_${index}`}
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={
                loading ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#667eea" />
                    <Text style={styles.loadingText}>{t('studies.loadingStudies')}</Text>
                  </View>
                ) : (
                  renderEmpty()
                )
              }
              extraData={selectedSection}
            />
            {totalPages > 1 && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[styles.pageArrow, currentPage === 1 && styles.pageArrowDisabled]}
                  onPress={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? '#cbd5e0' : '#667eea'} />
                </TouchableOpacity>
                <Text style={styles.pageInfo}>
                  {currentPage} / {totalPages}
                </Text>
                <TouchableOpacity
                  style={[styles.pageArrow, currentPage === totalPages && styles.pageArrowDisabled]}
                  onPress={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? '#cbd5e0' : '#667eea'} />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          <Ionicons name="shield-checkmark-outline" size={12} color="rgba(0,0,0,0.4)" />
          {' '}{t('studies.hospitalFooter')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  welcomeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
  statsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statsPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 6,
  },
  tabsWrapper: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#edf2f7',
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    left: '13%',
    right: '13%',
    height: 4,
    borderRadius: 2,
  },
  listArea: {
    flex: 1,
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#718096',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  patientDetail: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedBadge: {
    padding: 4,
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoIcon: {
    marginRight: 8,
    width: 20,
  },
  examsList: {
    fontSize: 13,
    color: '#4a5568',
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: '#a0aec0',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  uploadButton: {
    backgroundColor: '#667eea',
  },
  viewButton: {
    backgroundColor: '#48bb78',
  },
  editButton: {
    backgroundColor: '#ed8936',
  },
  deleteButton: {
    backgroundColor: '#e53e3e',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#a0aec0',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#cbd5e0',
    marginTop: 4,
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pageArrow: {
    padding: 8,
    borderRadius: 8,
  },
  pageArrowDisabled: {
    opacity: 0.5,
  },
  pageInfo: {
    fontSize: 14,
    color: '#4a5568',
    marginHorizontal: 16,
    fontWeight: '500',
  },
  footer: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.4)',
  },
});

export default EstudiosScreen;
