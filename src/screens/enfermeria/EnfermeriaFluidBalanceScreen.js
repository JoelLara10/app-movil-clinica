// src/screens/enfermeria/EnfermeriaFluidBalanceScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import CacheService from '../../services/cacheService';
import Pagination from '../../components/Pagination';
import moment from 'moment';

const CACHE_KEY_PREFIX = 'enfermeria_fluid_balance_';
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos
const HISTORY_ITEMS_PER_PAGE = 5;

const EnfermeriaFluidBalanceScreen = ({ navigation, route }) => {
  const { id_atencion, Id_exp } = route.params;
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const [formData, setFormData] = useState({
    ingresos_orales: '',
    ingresos_iv: '',
    egresos_orina: '',
    egresos_drenajes: '',
    observaciones: '',
  });

  // Cargar historial de balances hídricos
  useEffect(() => {
    loadFluidBalanceHistory();
  }, []);

  const loadFluidBalanceHistory = async (forceRefresh = false) => {
    try {
      setLoadingHistory(true);
      const cacheKey = `${CACHE_KEY_PREFIX}${id_atencion}`;

      if (!forceRefresh) {
        const cachedData = await CacheService.get(cacheKey);
        if (cachedData) {
          console.log('📦 Historial de balance hídrico cargado desde caché');
          setHistory(cachedData);
          setLoadingHistory(false);
          return;
        }
      }

      console.log('🌐 Cargando historial de balance hídrico desde API...');
      const response = await api.get(`/appointments/${id_atencion}/fluid-balance`);
      
      await CacheService.set(cacheKey, response.data, CACHE_TTL);
      setHistory(response.data || []);
      if (forceRefresh) setCurrentHistoryPage(1);
    } catch (error) {
      console.error('Error loading fluid balance history:', error);
      
      const cacheKey = `${CACHE_KEY_PREFIX}${id_atencion}`;
      const cachedData = await CacheService.get(cacheKey);
      if (cachedData) {
        console.log('📦 Historial de balance hídrico cargado desde caché (fallback)');
        setHistory(cachedData);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async () => {
    const hasData = Object.values(formData).some(value => value.trim() !== '');
    if (!hasData) {
      Alert.alert('Advertencia', 'Ingrese al menos un dato en el balance hídrico');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/appointments/${id_atencion}/fluid-balance`, formData);
      if (response.data) {
        Alert.alert('Éxito', 'Balance hídrico guardado correctamente');
        setFormData({
          ingresos_orales: '',
          ingresos_iv: '',
          egresos_orina: '',
          egresos_drenajes: '',
          observaciones: '',
        });
        await loadFluidBalanceHistory(true);
      }
    } catch (error) {
      console.error('Error saving fluid balance:', error);
      Alert.alert('Error', error.response?.data?.error || 'No se pudo guardar el balance hídrico');
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryItem = ({ item }) => {
    const balance = item.balance || {};
    const totalIngresos = (parseFloat(balance.ingresos_orales) || 0) + (parseFloat(balance.ingresos_iv) || 0);
    const totalEgresos = (parseFloat(balance.egresos_orina) || 0) + (parseFloat(balance.egresos_drenajes) || 0);
    const balanceNeto = totalIngresos - totalEgresos;

    return (
      <View style={styles.historyItem}>
        <View style={styles.historyHeader}>
          <View style={styles.historyBadge}>
            <Text style={styles.historyBadgeText}>
              {moment(item.fecha_registro).format('DD/MM')}
            </Text>
          </View>
          <View style={styles.historyInfo}>
            <Text style={styles.historyDate}>
              {moment(item.fecha_registro).format('dddd, D [de] MMMM [de] YYYY [a las] HH:mm')}
            </Text>
            <Text style={styles.historyDoctor}>
              <Ionicons name="medkit-outline" size={12} color="#718096" /> Enf. {item.enfermero_nombre || 'No especificado'}
            </Text>
          </View>
        </View>
        
        <View style={styles.historyContent}>
          <View style={styles.historyRow}>
            <View style={styles.historyHalf}>
              <Text style={styles.historyLabel}>Ingresos orales:</Text>
              <Text style={styles.historyValue}>{balance.ingresos_orales || 0} ml</Text>
            </View>
            <View style={styles.historyHalf}>
              <Text style={styles.historyLabel}>Ingresos IV:</Text>
              <Text style={styles.historyValue}>{balance.ingresos_iv || 0} ml</Text>
            </View>
          </View>
          
          <View style={styles.historyRow}>
            <View style={styles.historyHalf}>
              <Text style={styles.historyLabel}>Egresos orina:</Text>
              <Text style={styles.historyValue}>{balance.egresos_orina || 0} ml</Text>
            </View>
            <View style={styles.historyHalf}>
              <Text style={styles.historyLabel}>Egresos drenajes:</Text>
              <Text style={styles.historyValue}>{balance.egresos_drenajes || 0} ml</Text>
            </View>
          </View>
          
          <View style={[styles.historyRow, styles.historyTotalRow]}>
            <View style={styles.historyHalf}>
              <Text style={styles.historyTotalLabel}>Total ingresos:</Text>
              <Text style={styles.historyTotalValue}>{totalIngresos} ml</Text>
            </View>
            <View style={styles.historyHalf}>
              <Text style={styles.historyTotalLabel}>Total egresos:</Text>
              <Text style={styles.historyTotalValue}>{totalEgresos} ml</Text>
            </View>
          </View>
          
          <View style={styles.historyBalanceRow}>
            <Text style={styles.historyBalanceLabel}>Balance neto:</Text>
            <Text style={[
              styles.historyBalanceValue,
              balanceNeto >= 0 ? styles.balancePositive : styles.balanceNegative
            ]}>
              {balanceNeto >= 0 ? '+' : ''}{balanceNeto} ml
            </Text>
          </View>

          {balance.observaciones && (
            <View style={styles.historyField}>
              <Ionicons name="document-text-outline" size={14} color="#718096" />
              <Text style={styles.historyFieldLabel}>Observaciones:</Text>
              <Text style={styles.historyFieldValue}>{balance.observaciones}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const totalHistoryPages = Math.ceil(history.length / HISTORY_ITEMS_PER_PAGE);
  const paginatedHistory = history.slice(
    (currentHistoryPage - 1) * HISTORY_ITEMS_PER_PAGE,
    currentHistoryPage * HISTORY_ITEMS_PER_PAGE,
  );

  useEffect(() => {
    const validTotalPages = Math.max(1, totalHistoryPages);
    if (currentHistoryPage > validTotalPages) {
      setCurrentHistoryPage(validTotalPages);
    }
  }, [currentHistoryPage, totalHistoryPages]);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#4299e1', '#3182ce']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          <Ionicons name="water-outline" size={20} color="#fff" /> Balance Hídrico
        </Text>
        <TouchableOpacity
          onPress={() => loadFluidBalanceHistory(true)}
          style={styles.backButton}
          disabled={loading || loadingHistory}
        >
          <Ionicons name="refresh-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Información del paciente */}
      <View style={styles.patientInfoCard}>
        <View style={styles.patientInfoContent}>
          <View style={styles.patientAvatar}>
            <Ionicons name="person-circle" size={50} color="#fff" />
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>Paciente</Text>
            <View style={styles.patientMeta}>
              <Text style={styles.patientMetaItem}>
                <Ionicons name="card-outline" size={12} color="#4299e1" />
                <Text style={styles.patientMetaText}>Exp: {Id_exp || 'N/A'}</Text>
              </Text>
              <Text style={styles.patientMetaItem}>
                <Ionicons name="calendar-outline" size={12} color="#4299e1" />
                <Text style={styles.patientMetaText}>Atención: {id_atencion}</Text>
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tarjeta principal - Nuevo balance */}
      <View style={styles.mainCard}>
        <LinearGradient 
          colors={['#4299e1', '#3182ce']} 
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.cardHeaderContent}>
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text style={styles.cardHeaderTitle}>Registrar Balance Hídrico</Text>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          {/* Ingresos orales */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabel}>
              <Ionicons name="cafe-outline" size={16} color="#4299e1" />
              <Text style={styles.fieldLabelText}>Ingresos orales (ml)</Text>
            </View>
            <TextInput
              style={styles.fieldInput}
              placeholder="Ej: 1500"
              placeholderTextColor="#a0aec0"
              keyboardType="numeric"
              value={formData.ingresos_orales}
              onChangeText={(text) => setFormData({ ...formData, ingresos_orales: text })}
            />
          </View>

          {/* Ingresos IV */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabel}>
              <Ionicons name="medical-outline" size={16} color="#4299e1" />
              <Text style={styles.fieldLabelText}>Ingresos IV (ml)</Text>
            </View>
            <TextInput
              style={styles.fieldInput}
              placeholder="Ej: 1000"
              placeholderTextColor="#a0aec0"
              keyboardType="numeric"
              value={formData.ingresos_iv}
              onChangeText={(text) => setFormData({ ...formData, ingresos_iv: text })}
            />
          </View>

          {/* Egresos orina */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabel}>
              <Ionicons name="water-outline" size={16} color="#4299e1" />
              <Text style={styles.fieldLabelText}>Egresos orina (ml)</Text>
            </View>
            <TextInput
              style={styles.fieldInput}
              placeholder="Ej: 1200"
              placeholderTextColor="#a0aec0"
              keyboardType="numeric"
              value={formData.egresos_orina}
              onChangeText={(text) => setFormData({ ...formData, egresos_orina: text })}
            />
          </View>

          {/* Egresos drenajes */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabel}>
              <Ionicons name="bandage-outline" size={16} color="#4299e1" />
              <Text style={styles.fieldLabelText}>Egresos drenajes (ml)</Text>
            </View>
            <TextInput
              style={styles.fieldInput}
              placeholder="Ej: 200"
              placeholderTextColor="#a0aec0"
              keyboardType="numeric"
              value={formData.egresos_drenajes}
              onChangeText={(text) => setFormData({ ...formData, egresos_drenajes: text })}
            />
          </View>

          {/* Observaciones */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabel}>
              <Ionicons name="document-text-outline" size={16} color="#718096" />
              <Text style={styles.fieldLabelText}>Observaciones</Text>
            </View>
            <TextInput
              style={[styles.fieldInput, styles.textArea]}
              placeholder="Notas adicionales del balance hídrico"
              placeholderTextColor="#a0aec0"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={formData.observaciones}
              onChangeText={(text) => setFormData({ ...formData, observaciones: text })}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={styles.saveButtonText}>Guardar Balance</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Historial de Balances */}
      <View style={styles.historyCard}>
        <TouchableOpacity 
          style={styles.historyHeaderGradient}
          onPress={() => setShowHistory(!showHistory)}
          activeOpacity={0.8}
        >
          <LinearGradient 
            colors={['#4299e1', '#3182ce']} 
            style={styles.historyHeaderInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.historyHeaderContent}>
              <Ionicons name="time-outline" size={20} color="#fff" />
              <Text style={styles.historyTitle}>Historial de Balances</Text>
              <View style={styles.historyCount}>
                <Text style={styles.historyCountText}>{history.length} registros</Text>
              </View>
              <Ionicons 
                name={showHistory ? "chevron-up-outline" : "chevron-down-outline"} 
                size={20} 
                color="#fff" 
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {showHistory && (
          <View style={styles.historyBody}>
            {loadingHistory ? (
              <ActivityIndicator style={styles.historyLoader} size="large" color="#4299e1" />
            ) : history.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Ionicons name="document-text-outline" size={48} color="#cbd5e0" />
                <Text style={styles.emptyHistoryText}>No hay balances previos</Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={paginatedHistory}
                  renderItem={renderHistoryItem}
                  keyExtractor={(item, index) => {
                    if (item.id_balance) {
                      return `balance_${item.id_balance}`;
                    }
                    return `balance_fallback_${index}_${item.fecha_registro || 'unknown'}`;
                  }}
                  scrollEnabled={false}
                  initialNumToRender={HISTORY_ITEMS_PER_PAGE}
                  maxToRenderPerBatch={HISTORY_ITEMS_PER_PAGE}
                />
                <View style={styles.historyPagination}>
                  <Pagination
                    currentPage={currentHistoryPage}
                    totalPages={totalHistoryPages}
                    onPageChange={setCurrentHistoryPage}
                    itemsPerPage={HISTORY_ITEMS_PER_PAGE}
                    totalItems={history.length}
                  />
                </View>
              </>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  patientInfoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#4299e1',
  },
  patientInfoContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  patientAvatar: { width: 60, height: 60, borderRadius: 15, backgroundColor: '#4299e1', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  patientDetails: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#2d3748', marginBottom: 4 },
  patientMeta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  patientMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  patientMetaText: { fontSize: 12, color: '#718096' },
  mainCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeader: { paddingVertical: 16, paddingHorizontal: 20 },
  cardHeaderContent: { flexDirection: 'row', alignItems: 'center' },
  cardHeaderTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginLeft: 8 },
  cardBody: { padding: 20 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  fieldLabelText: { fontSize: 13, fontWeight: '600', color: '#4a5568', marginLeft: 6 },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2d3748',
    backgroundColor: '#fff',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#4299e1',
  },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff', marginLeft: 8 },
  disabledButton: { opacity: 0.7 },
  historyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 30,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  historyHeaderGradient: { overflow: 'hidden' },
  historyHeaderInner: { paddingVertical: 16, paddingHorizontal: 20 },
  historyHeaderContent: { flexDirection: 'row', alignItems: 'center' },
  historyTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#fff', marginLeft: 8 },
  historyCount: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
  },
  historyCountText: { fontSize: 11, color: '#fff', fontWeight: '500' },
  historyBody: { padding: 16 },
  historyLoader: { padding: 40 },
  emptyHistory: { alignItems: 'center', padding: 40 },
  emptyHistoryText: { fontSize: 14, color: '#a0aec0', marginTop: 12 },
  historyItem: {
    backgroundColor: '#f7fafc',
    borderRadius: 15,
    marginBottom: 16,
    overflow: 'hidden',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#edf2f7',
  },
  historyBadge: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#4299e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyBadgeText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  historyInfo: { flex: 1 },
  historyDate: { fontSize: 12, fontWeight: '500', color: '#2d3748' },
  historyDoctor: { fontSize: 11, color: '#718096', marginTop: 2 },
  historyContent: { padding: 12 },
  historyRow: { flexDirection: 'row', marginBottom: 6 },
  historyHalf: { flex: 1 },
  historyLabel: { fontSize: 12, color: '#718096' },
  historyValue: { fontSize: 12, fontWeight: '600', color: '#2d3748' },
  historyTotalRow: { 
    borderTopWidth: 1, 
    borderTopColor: '#e2e8f0', 
    paddingTop: 8,
    marginTop: 4,
  },
  historyTotalLabel: { fontSize: 12, fontWeight: '700', color: '#4a5568' },
  historyTotalValue: { fontSize: 13, fontWeight: '700', color: '#2d3748' },
  historyBalanceRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#f0f4f8',
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  historyBalanceLabel: { fontSize: 13, fontWeight: '700', color: '#4a5568', marginRight: 8 },
  historyBalanceValue: { fontSize: 16, fontWeight: '700' },
  balancePositive: { color: '#48bb78' },
  balanceNegative: { color: '#e53e3e' },
  historyField: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6, flexWrap: 'wrap' },
  historyFieldLabel: { fontSize: 12, fontWeight: '600', color: '#4a5568', marginLeft: 6, marginRight: 4 },
  historyFieldValue: { fontSize: 12, color: '#2d3748', flex: 1 },
  historyPagination: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

export default EnfermeriaFluidBalanceScreen;