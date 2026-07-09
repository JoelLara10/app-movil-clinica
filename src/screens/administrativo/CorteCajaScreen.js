import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const movements = [
  {
    id: 'M-1042',
    time: '09:18',
    patient: 'Mariana Lopez Ruiz',
    concept: 'Anticipo',
    method: 'Tarjeta',
    amount: 5000,
  },
  {
    id: 'M-1041',
    time: '08:52',
    patient: 'Hector Garcia Neri',
    concept: 'Consulta',
    method: 'Efectivo',
    amount: 1200,
  },
  {
    id: 'M-1038',
    time: '08:10',
    patient: 'Lucia Moreno Paz',
    concept: 'Paquete quirurgico',
    method: 'Transferencia',
    amount: 18000,
  },
  {
    id: 'M-1037',
    time: '07:35',
    patient: 'Rafael Torres Luna',
    concept: 'Medicamento',
    method: 'Efectivo',
    amount: 850,
  },
];

const activeAccounts = [
  {
    record: 'INEO-000341',
    attention: 'A-2381',
    bed: 'CONS-02',
    patient: 'Mariana Lopez Ruiz',
    doctor: 'Dra. Sandoval',
    area: 'Consulta',
    subtotal: 12400,
    tax: 1984,
    total: 14384,
    advance: 5000,
    admittedAt: '17 Jun 2026',
  },
  {
    record: 'INEO-000331',
    attention: 'A-2376',
    bed: 'PREP-01',
    patient: 'Lucia Moreno Paz',
    doctor: 'Dra. Castillo',
    area: 'Preparacion',
    subtotal: 24500,
    tax: 3920,
    total: 28420,
    advance: 18000,
    admittedAt: '17 Jun 2026',
  },
  {
    record: 'INEO-000326',
    attention: 'A-2371',
    bed: 'REC-03',
    patient: 'Rafael Torres Luna',
    doctor: 'Dr. Herrera',
    area: 'Recuperacion',
    subtotal: 8200,
    tax: 1312,
    total: 9512,
    advance: 3500,
    admittedAt: '16 Jun 2026',
  },
];

const money = (value) =>
  `$${Number(value || 0)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

const ITEMS_PER_PAGE = 5;
const CACHE_TIME = 1000 * 60 * 5;
const cashCutCache = new Map();

const CorteCajaScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');

  const [cashCut, setCashCut] = useState({
    period: { label: '17 Jun 2026' },
    summary: null,
    movements,
    activeAccounts,
  });

  const [loading, setLoading] = useState(true);
  const [loadingMoreMovements, setLoadingMoreMovements] = useState(false);
  const [loadingMoreAccounts, setLoadingMoreAccounts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [apiNotice, setApiNotice] = useState('');

  const [movementsPage, setMovementsPage] = useState(1);
  const [accountsPage, setAccountsPage] = useState(1);

  const [movementsPagination, setMovementsPagination] = useState({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: movements.length,
    total_pages: 1,
    has_more: false,
  });

  const [accountsPagination, setAccountsPagination] = useState({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: activeAccounts.length,
    total_pages: 1,
    has_more: false,
  });

  const requestIdRef = useRef(0);

  const getCacheKey = (value = '', page = 1) =>
    `${value.trim().toLowerCase()}::${page}`;

  const normalizeCashCutResponse = (response) => ({
    period: response.period || { label: '' },
    summary: response.summary,
    movements: response.movements || response.data || [],
    activeAccounts: response.activeAccounts || response.accounts || [],
  });

  const getMovementsPagination = (response, page) =>
    response.movements_pagination ||
    response.cash_cut_pagination ||
    response.corte_caja_pagination ||
    response.data_pagination ||
    response.pagination || {
      page,
      limit: ITEMS_PER_PAGE,
      total: response.movements?.length || 0,
      total_pages: page,
      has_more: false,
    };

  const getAccountsPagination = (response, page) =>
    response.activeAccounts_pagination ||
    response.accounts_pagination ||
    response.patients_pagination ||
    response.data_pagination ||
    response.pagination || {
      page,
      limit: ITEMS_PER_PAGE,
      total: response.activeAccounts?.length || 0,
      total_pages: page,
      has_more: false,
    };

  const mergeByKey = (currentItems, newItems, keyFactory) => {
    const map = new Map();

    [...currentItems, ...newItems].forEach((item, index) => {
      const key = keyFactory(item, index);
      map.set(key, item);
    });

    return Array.from(map.values());
  };

  const applyCashCutResponse = (
    response,
    {
      append = false,
      page = 1,
      appendType = 'all',
    } = {}
  ) => {
    const normalized = normalizeCashCutResponse(response);

    setCashCut((current) => {
      if (!append) {
        return normalized;
      }

      const nextMovements =
        appendType === 'movements' || appendType === 'all'
          ? mergeByKey(
              current.movements || [],
              normalized.movements || [],
              (item, index) =>
                `${item.id || item.id_movimiento || item.id_atencion || 'movement'}-${index}`
            )
          : current.movements || [];

      const nextAccounts =
        appendType === 'accounts' || appendType === 'all'
          ? mergeByKey(
              current.activeAccounts || [],
              normalized.activeAccounts || [],
              (item, index) =>
                `${item.id_atencion || item.attention || item.record || 'account'}-${index}`
            )
          : current.activeAccounts || [];

      return {
        period: normalized.period || current.period,
        summary: normalized.summary || current.summary,
        movements: nextMovements,
        activeAccounts: nextAccounts,
      };
    });

    if (appendType === 'movements' || appendType === 'all') {
      setMovementsPagination(getMovementsPagination(response, page));
    }

    if (appendType === 'accounts' || appendType === 'all') {
      setAccountsPagination(getAccountsPagination(response, page));
    }

    setApiNotice('');
  };

  const loadCashCut = async ({
    silent = false,
    forceRefresh = false,
    page = 1,
    append = false,
    appendType = 'all',
  } = {}) => {
    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;

    const cacheKey = getCacheKey(search, page);
    const cachedData = cashCutCache.get(cacheKey);
    const cacheIsValid =
      cachedData &&
      Date.now() - cachedData.timestamp < CACHE_TIME;

    if (!forceRefresh && cacheIsValid) {
      applyCashCutResponse(cachedData.data, {
        append,
        page,
        appendType,
      });

      setLoading(false);
      setRefreshing(false);
      setLoadingMoreMovements(false);
      setLoadingMoreAccounts(false);
      return;
    }

    try {
      if (!silent && !append && !cachedData) {
        setLoading(true);
      }

      if (cachedData) {
        applyCashCutResponse(cachedData.data, {
          append,
          page,
          appendType,
        });
      }

      const response = await adminService.getCashCut({
        search,
        page,
        limit: ITEMS_PER_PAGE,
      });

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      cashCutCache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
      });

      applyCashCutResponse(response, {
        append,
        page,
        appendType,
      });
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if (cachedData) {
        applyCashCutResponse(cachedData.data, {
          append,
          page,
          appendType,
        });

        setApiNotice('Mostrando información guardada en caché.');
      } else if (!append) {
        setApiNotice(
          'Mostrando datos locales. No se pudo consultar el corte en la API.'
        );

        setCashCut({
          period: { label: '17 Jun 2026' },
          summary: null,
          movements,
          activeAccounts,
        });

        setMovementsPagination({
          page: 1,
          limit: ITEMS_PER_PAGE,
          total: movements.length,
          total_pages: 1,
          has_more: false,
        });

        setAccountsPagination({
          page: 1,
          limit: ITEMS_PER_PAGE,
          total: activeAccounts.length,
          total_pages: 1,
          has_more: false,
        });
      } else {
        setApiNotice('No se pudieron cargar más registros desde la API.');
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMoreMovements(false);
        setLoadingMoreAccounts(false);
      }
    }
  };

  useEffect(() => {
    const hasSearch = search.trim().length > 0;
    const delay = hasSearch ? 350 : 0;

    const timer = setTimeout(() => {
      setMovementsPage(1);
      setAccountsPage(1);

      loadCashCut({
        silent: hasSearch,
        page: 1,
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    setMovementsPage(1);
    setAccountsPage(1);

    loadCashCut({
      silent: true,
      forceRefresh: true,
      page: 1,
    });
  };

  const loadMoreMovements = () => {
    if (loadingMoreMovements || !movementsPagination.has_more) {
      return;
    }

    const nextPage = movementsPage + 1;

    setMovementsPage(nextPage);
    setLoadingMoreMovements(true);

    loadCashCut({
      silent: true,
      page: nextPage,
      append: true,
      appendType: 'movements',
    });
  };

  const loadMoreAccounts = () => {
    if (loadingMoreAccounts || !accountsPagination.has_more) {
      return;
    }

    const nextPage = accountsPage + 1;

    setAccountsPage(nextPage);
    setLoadingMoreAccounts(true);

    loadCashCut({
      silent: true,
      page: nextPage,
      append: true,
      appendType: 'accounts',
    });
  };

  const totals = useMemo(() => {
    if (cashCut.summary) {
      return cashCut.summary;
    }

    const income = cashCut.movements.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const pending = cashCut.activeAccounts.reduce(
      (sum, item) =>
        sum + Math.max(item.total - item.advance, 0),
      0
    );

    return {
      income,
      pending,
      movements:
        movementsPagination.total || cashCut.movements.length,
      accounts:
        accountsPagination.total || cashCut.activeAccounts.length,
    };
  }, [cashCut, movementsPagination, accountsPagination]);

  const filteredAccounts = cashCut.activeAccounts.filter(
    (account) => {
      const query = search.trim().toLowerCase();

      const text =
        `${account.record} ${account.attention} ` +
        `${account.patient} ${account.bed} ${account.area}`;

      return text.toLowerCase().includes(query);
    }
  );

  const visibleMovementItems = cashCut.movements;

  const visibleAccountItems = filteredAccounts;

  const remainingMovements = Math.max(
    (movementsPagination.total || cashCut.movements.length) -
      visibleMovementItems.length,
    0
  );

  const remainingAccounts = Math.max(
    (accountsPagination.total || filteredAccounts.length) -
      visibleAccountItems.length,
    0
  );

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            Corte de Caja
          </Text>

          <Text style={styles.headerSubtitle}>
            Movimientos y cuentas activas
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() =>
            Alert.alert(
              'Reporte pendiente',
              'El reporte de caja se conectara despues con la API.'
            )
          }
        >
          <Ionicons
            name="print-outline"
            size={22}
            color="#fff"
          />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.dateCard}>
        <View style={styles.dateInfo}>
          <Ionicons
            name="calendar-outline"
            size={22}
            color="#667eea"
          />

          <View>
            <Text style={styles.dateLabel}>
              Periodo de corte
            </Text>

            <Text style={styles.dateValue}>
              {cashCut.period?.label || 'Hoy'} - Turno matutino
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() =>
            Alert.alert(
              'Filtros',
              'Aqui se seleccionara fecha y turno cuando este lista la API.'
            )
          }
        >
          <Ionicons
            name="options-outline"
            size={18}
            color="#667eea"
          />

          <Text style={styles.filterText}>
            Filtros
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          label="Ingresos"
          value={money(totals.income)}
          color="#48bb78"
          icon="cash-outline"
        />

        <MetricCard
          label="Pendiente"
          value={money(totals.pending)}
          color="#ed8936"
          icon="time-outline"
        />

        <MetricCard
          label="Movs."
          value={String(totals.movements)}
          color="#4299e1"
          icon="swap-horizontal-outline"
        />

        <MetricCard
          label="Cuentas"
          value={String(totals.accounts)}
          color="#9f7aea"
          icon="receipt-outline"
        />
      </View>

      {apiNotice ? (
        <View style={styles.noticeBox}>
          <Ionicons
            name="cloud-offline-outline"
            size={16}
            color="#b7791f"
          />

          <Text style={styles.noticeText}>
            {apiNotice}
          </Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#667eea" />

          <Text style={styles.loadingText}>
            Cargando corte...
          </Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="wallet-outline"
              size={21}
              color="#48bb78"
            />

            <Text style={styles.sectionTitle}>
              Movimientos del dia
            </Text>
          </View>

          <TouchableOpacity
            style={styles.outlineAction}
            onPress={() =>
              Alert.alert(
                'Cierre pendiente',
                'El cierre final se conectara con el endpoint de caja.'
              )
            }
          >
            <Text style={styles.outlineActionText}>
              Cerrar
            </Text>
          </TouchableOpacity>
        </View>

        {visibleMovementItems.map((movement, index) => (
          <View
            key={`${movement.id || movement.id_atencion || 'movimiento'}-${index}`}
            style={styles.movementCard}
          >
            <View style={styles.movementIcon}>
              <Ionicons
                name={
                  movement.method === 'Efectivo'
                    ? 'cash-outline'
                    : 'card-outline'
                }
                size={22}
                color="#667eea"
              />
            </View>

            <View style={styles.movementBody}>
              <View style={styles.movementTop}>
                <Text style={styles.movementConcept}>
                  {movement.concept}
                </Text>

                <Text style={styles.movementAmount}>
                  {money(movement.amount)}
                </Text>
              </View>

              <Text
                style={styles.movementPatient}
                selectable
              >
                {movement.patient}
              </Text>

              <Text style={styles.movementMeta}>
                {movement.time} - {movement.method} - {movement.id}
              </Text>
            </View>
          </View>
        ))}

        {remainingMovements > 0 ? (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={loadMoreMovements}
            disabled={loadingMoreMovements}
          >
            {loadingMoreMovements ? (
              <ActivityIndicator color="#667eea" />
            ) : (
              <Ionicons
                name="chevron-down-outline"
                size={18}
                color="#667eea"
              />
            )}

            <Text style={styles.loadMoreText}>
              {loadingMoreMovements
                ? 'Cargando...'
                : 'Mostrar 5 movimientos más'}
            </Text>

            <Text style={styles.remainingText}>
              {remainingMovements} restantes
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="people-outline"
              size={21}
              color="#667eea"
            />

            <Text style={styles.sectionTitle}>
              Cuentas de pacientes activos
            </Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={18}
            color="#a0aec0"
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nombre, expediente, cama..."
            placeholderTextColor="#a0aec0"
            style={styles.searchInput}
          />
        </View>

        {visibleAccountItems.map((account, index) => (
          <TouchableOpacity
            key={`${account.id_atencion || account.attention || account.record}-${index}`}
            style={styles.accountCard}
            onPress={() =>
              navigation.navigate('PacienteDetail', {
                patient: account,
              })
            }
          >
            <View style={styles.accountHeader}>
              <View>
                <Text
                  style={styles.accountPatient}
                  selectable
                >
                  {account.patient}
                </Text>

                <Text style={styles.accountMeta}>
                  {account.record} - {account.attention} - {account.bed}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#a0aec0"
              />
            </View>

            <View style={styles.amountGrid}>
              <Amount
                label="Subtotal"
                value={money(account.subtotal)}
              />

              <Amount
                label="IVA"
                value={money(account.tax)}
              />

              <Amount
                label="Total"
                value={money(account.total)}
                strong
              />

              <Amount
                label="Anticipos"
                value={money(account.advance)}
              />
            </View>

            <View style={styles.accountFooter}>
              <Text style={styles.accountFooterText}>
                {account.area} - {account.doctor}
              </Text>

              <Text style={styles.accountFooterText}>
                Ingreso: {account.admittedAt}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {remainingAccounts > 0 ? (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={loadMoreAccounts}
            disabled={loadingMoreAccounts}
          >
            {loadingMoreAccounts ? (
              <ActivityIndicator color="#667eea" />
            ) : (
              <Ionicons
                name="chevron-down-outline"
                size={18}
                color="#667eea"
              />
            )}

            <Text style={styles.loadMoreText}>
              {loadingMoreAccounts
                ? 'Cargando...'
                : 'Mostrar 5 cuentas más'}
            </Text>

            <Text style={styles.remainingText}>
              {remainingAccounts} restantes
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
};

const MetricCard = ({
  icon,
  label,
  value,
  color,
}) => (
  <View style={styles.metricCard}>
    <View
      style={[
        styles.metricIcon,
        {
          backgroundColor: `${color}18`,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={21}
        color={color}
      />
    </View>

    <Text
      style={styles.metricValue}
      numberOfLines={1}
    >
      {value}
    </Text>

    <Text style={styles.metricLabel}>
      {label}
    </Text>
  </View>
);

const Amount = ({
  label,
  value,
  strong,
}) => (
  <View style={styles.amountItem}>
    <Text style={styles.amountLabel}>
      {label}
    </Text>

    <Text
      style={[
        styles.amountValue,
        strong && styles.amountStrong,
      ]}
      selectable
    >
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },

  contentContainer: {
    paddingBottom: 28,
  },

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

  dateCard: {
    marginHorizontal: 16,
    marginTop: -22,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 8px rgba(45, 55, 72, 0.10)',
  },

  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  dateLabel: {
    fontSize: 11,
    color: '#a0aec0',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginLeft: 10,
  },

  dateValue: {
    fontSize: 13,
    color: '#2d3748',
    fontWeight: '700',
    marginLeft: 10,
    marginTop: 2,
  },

  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#667eea18',
  },

  filterText: {
    color: '#667eea',
    fontWeight: '800',
    fontSize: 12,
    marginLeft: 4,
  },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: 14,
  },

  metricCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    boxShadow: '0 2px 8px rgba(45, 55, 72, 0.08)',
  },

  metricIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  metricValue: {
    color: '#2d3748',
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },

  metricLabel: {
    color: '#718096',
    fontSize: 12,
    marginTop: 2,
  },

  section: {
    paddingHorizontal: 16,
    marginTop: 18,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  sectionTitle: {
    color: '#2d3748',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },

  outlineAction: {
    borderWidth: 1,
    borderColor: '#48bb78',
    borderRadius: 18,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },

  outlineActionText: {
    color: '#48bb78',
    fontSize: 12,
    fontWeight: '800',
  },

  movementCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    boxShadow: '0 2px 8px rgba(45, 55, 72, 0.08)',
  },

  movementIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#667eea18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  movementBody: {
    flex: 1,
  },

  movementTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  movementConcept: {
    color: '#2d3748',
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    paddingRight: 8,
  },

  movementAmount: {
    color: '#2f855a',
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },

  movementPatient: {
    color: '#4a5568',
    fontSize: 13,
    marginTop: 3,
  },

  movementMeta: {
    color: '#a0aec0',
    fontSize: 11,
    marginTop: 4,
  },

  searchBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: '#2d3748',
    fontSize: 14,
  },

  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(45, 55, 72, 0.08)',
  },

  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  accountPatient: {
    color: '#2d3748',
    fontSize: 16,
    fontWeight: '800',
  },

  accountMeta: {
    color: '#718096',
    fontSize: 12,
    marginTop: 3,
  },

  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
  },

  amountItem: {
    width: '50%',
    marginBottom: 10,
  },

  amountLabel: {
    color: '#a0aec0',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  amountValue: {
    color: '#4a5568',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },

  amountStrong: {
    color: '#667eea',
    fontSize: 15,
    fontWeight: '900',
  },

  accountFooter: {
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
    paddingTop: 10,
  },

  accountFooterText: {
    color: '#718096',
    fontSize: 12,
    marginTop: 2,
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
});

export default CorteCajaScreen;