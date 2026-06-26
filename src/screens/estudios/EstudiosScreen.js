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
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const SECTIONS = [
  { id: 'solicitudes_lab', label: 'Solicitudes Lab', icon: '🧪' },
  { id: 'solicitudes_gab', label: 'Solicitudes Gab', icon: '📊' },
  { id: 'resultados_lab', label: 'Resultados Lab', icon: '📋' },
  { id: 'resultados_gab', label: 'Resultados Gab', icon: '📁' },
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

const EstudiosScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [selectedSection, setSelectedSection] = useState('solicitudes_lab');
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ laboratorio: 0, gabinete: 0, total: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const initialLoadDone = useRef(false);
  const skipFocusRefresh = useRef(false);

  const normalizeItem = (item = {}) => ({
    id_examen: item.id_examen ?? item._id ?? '',
    paciente: typeof item.paciente === 'string'
      ? item.paciente
      : item.paciente?.nombre || item.nombre_paciente || 'Paciente',
    medico: typeof item.medico === 'string'
      ? item.medico
      : item.medico?.nombre || item.nombre_medico || 'No asignado',
    estudios: Array.isArray(item.estudios)
      ? item.estudios.join(', ')
      : item.estudios || 'Sin estudios',
    fecha: item.fecha_solicitud || item.fecha || null,
    fecha_realizado: item.fecha_realizado || null,
    habitacion: item.habitacion || item.numero_habitacion || item.cama || 'Sin información',
  });

  // ============================================================
  //  loadData - AHORA ORDENA POR FECHA (más reciente primero)
  // ============================================================
  const loadData = useCallback(async (pageNum = 1, append = false) => {
    const config = SECTION_CONFIG[selectedSection];
    if (!config) {
      setItems([]);
      setError('Sección inválida');
      return;
    }

    try {
      if (pageNum === 1) {
        setLoading(true);
        setItems([]);
      } else {
        setLoadingMore(true);
      }
      setError('');

      const response = await api.get(`/exams${config.endpoint}`, {
        params: {
          type: config.type,
          page: pageNum,
          limit: PAGE_SIZE,
        },
      });

      const data = Array.isArray(response.data) ? response.data : [];
      let normalized = data.map(normalizeItem);

      // 🔥 ORDENAR POR FECHA (más reciente primero)
      // Si no hay fecha, se coloca al final
      normalized.sort((a, b) => {
        const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
        const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
        return dateB - dateA; // descendente
      });

      if (append) {
        setItems(prev => {
          const existingIds = new Set(prev.map(item => item.id_examen));
          const newItems = normalized.filter(item => !existingIds.has(item.id_examen));
          // También ordenamos el conjunto completo por si acaso
          const merged = [...prev, ...newItems];
          merged.sort((a, b) => {
            const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
            const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
            return dateB - dateA;
          });
          return merged;
        });
      } else {
        setItems(normalized);
      }

      setHasMore(data.length === PAGE_SIZE);
      setPage(pageNum);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error || 'No se pudieron cargar los estudios.');
      if (pageNum === 1) setItems([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedSection]);

  // ============================================================
  //  loadCounts
  // ============================================================
  const loadCounts = useCallback(async () => {
    try {
      const response = await api.get('/exams/counts');
      setCounts({
        laboratorio: response.data?.laboratorio ?? 0,
        gabinete: response.data?.gabinete ?? 0,
        total: response.data?.total ?? 0,
      });
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  }, []);

  // ============================================================
  //  EFECTOS
  // ============================================================
  useEffect(() => {
    skipFocusRefresh.current = false;
    loadData(1, false);
    loadCounts();
    initialLoadDone.current = true;
  }, [selectedSection, loadData, loadCounts]);

  useFocusEffect(
    useCallback(() => {
      if (!initialLoadDone.current) return;
      if (skipFocusRefresh.current) {
        skipFocusRefresh.current = false;
        return;
      }
      loadData(1, false);
      loadCounts();
    }, [loadData, loadCounts])
  );

  // ============================================================
  //  HANDLERS
  // ============================================================
  const onRefresh = async () => {
    setRefreshing(true);
    skipFocusRefresh.current = true;
    await Promise.all([loadData(1, false), loadCounts()]);
    setRefreshing(false);
    skipFocusRefresh.current = false;
  };

  const loadMore = () => {
    if (!loadingMore && !loading && hasMore) {
      loadData(page + 1, true);
    }
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

  // 🔥 ELIMINAR CON CONFIRMACIÓN
  const handleDelete = (id_examen) => {
    const tipo = selectedSection.includes('lab') ? 'laboratorio' : 'gabinete';
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que deseas eliminar este resultado de ${tipo}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/exams/${id_examen}/results?type=${tipo}`);
              // Recargar datos después de eliminar
              loadData(1, false);
              loadCounts();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el resultado. Intenta de nuevo.');
            }
          },
        },
      ]
    );
  };

  // ============================================================
  //  RENDER
  // ============================================================
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
            <Text style={styles.patientDetail}>🛏️ {item.habitacion}</Text>
          </View>
          {!isPending && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedEmoji}>✅</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🔬</Text>
            <Text style={styles.examsList}>{item.estudios}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.dateText}>
              {`Solicitado: ${item.fecha ? new Date(item.fecha).toLocaleDateString() : 'Fecha no disponible'}`}
            </Text>
          </View>
          {!isPending && item.fecha_realizado && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>✅</Text>
              <Text style={styles.dateText}>
                {`Realizado: ${new Date(item.fecha_realizado).toLocaleDateString()}`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          {isPending ? (
            <TouchableOpacity style={styles.uploadButton} onPress={() => handleUpload(item.id_examen)}>
              <Text style={styles.uploadEmoji}>📤</Text>
              <Text style={styles.uploadText}>Subir</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.viewButton} onPress={() => handleView(item.id_examen)}>
                <Text style={styles.viewEmoji}>👁️</Text>
                <Text style={styles.viewText}>Ver</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item.id_examen)}>
                <Text style={styles.editEmoji}>✏️</Text>
                <Text style={styles.editText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id_examen)}>
                <Text style={styles.deleteEmoji}>🗑️</Text>
                <Text style={styles.deleteText}>Eliminar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" />
        <Text style={styles.footerText}>Cargando más...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    const isPending = selectedSection.startsWith('solicitudes');
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>📭</Text>
        <Text style={styles.emptyText}>
          {isPending ? 'No hay solicitudes pendientes' : 'No hay resultados registrados'}
        </Text>
        <Text style={styles.emptySubtext}>
          {isPending ? 'Todos los estudios están completados' : 'Aún no se han subido resultados'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔬 Módulo de Estudios</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statEmoji}>🧪</Text>
          <Text style={styles.statNumber}>{counts.laboratorio}</Text>
          <Text style={styles.statLabel}>Laboratorio</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statEmoji}>📊</Text>
          <Text style={styles.statNumber}>{counts.gabinete}</Text>
          <Text style={styles.statLabel}>Gabinete</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statEmoji}>⚠️</Text>
          <Text style={styles.statNumber}>{counts.total}</Text>
          <Text style={styles.statLabel}>Total Pendientes</Text>
        </View>
      </View>

      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {SECTIONS.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={[styles.tab, selectedSection === section.id && styles.activeTab]}
              onPress={() => {
                setSelectedSection(section.id);
                skipFocusRefresh.current = true;
              }}
            >
              <Text style={styles.tabIcon}>{section.icon}</Text>
              <Text style={[styles.tabText, selectedSection === section.id && styles.activeTabText]}>
                {section.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.listArea}>
        {error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>⚠️</Text>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            key={selectedSection}
            data={items}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.id_examen}_${index}`}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" />
                  <Text style={styles.loadingText}>Cargando estudios...</Text>
                </View>
              ) : (
                renderEmpty()
              )
            }
            ListFooterComponent={renderFooter}
            onEndReached={loadMore}
            onEndReachedThreshold={0.2}
            extraData={selectedSection}
          />
        )}
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: { padding: 8 },
  backText: { fontSize: 24, color: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statEmoji: { fontSize: 28, marginBottom: 4 },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#2d3748' },
  statLabel: { fontSize: 12, color: '#718096', marginTop: 2 },
  tabsWrapper: {
    height: 50,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    height: '100%',
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    height: 36,
  },
  activeTab: { backgroundColor: '#667eea' },
  tabIcon: { fontSize: 18, marginRight: 6 },
  tabText: { fontSize: 14, color: '#718096', fontWeight: '500' },
  activeTabText: { color: '#fff' },
  listArea: { flex: 1, marginTop: 8 },
  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  loadingBox: { paddingVertical: 60, alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#718096' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 45, height: 45, borderRadius: 22, backgroundColor: '#667eea', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardInfo: { flex: 1, marginLeft: 12 },
  patientName: { fontSize: 16, fontWeight: '600', color: '#2d3748' },
  patientDetail: { fontSize: 12, color: '#718096', marginTop: 2 },
  completedBadge: { padding: 4 },
  completedEmoji: { fontSize: 20 },
  cardBody: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 12, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoIcon: { fontSize: 14, marginRight: 8, width: 30 },
  examsList: { fontSize: 13, color: '#4a5568', flex: 1 },
  dateText: { fontSize: 12, color: '#a0aec0', flex: 1 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, flexWrap: 'wrap' },
  uploadButton: { backgroundColor: '#667eea', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 4 },
  uploadEmoji: { fontSize: 16, marginRight: 4, color: '#fff' },
  uploadText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  viewButton: { backgroundColor: '#48bb78', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 4 },
  viewEmoji: { fontSize: 16, marginRight: 4, color: '#fff' },
  viewText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  editButton: { backgroundColor: '#ed8936', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 4 },
  editEmoji: { fontSize: 16, marginRight: 4, color: '#fff' },
  editText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  deleteButton: { backgroundColor: '#e53e3e', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', flex: 1 },
  deleteEmoji: { fontSize: 16, marginRight: 4, color: '#fff' },
  deleteText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#a0aec0', marginTop: 12, textAlign: 'center' },
  emptySubtext: { fontSize: 12, color: '#cbd5e0', marginTop: 4, textAlign: 'center' },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
  footerText: { marginTop: 8, color: '#718096', fontSize: 12 },
});

export default EstudiosScreen;