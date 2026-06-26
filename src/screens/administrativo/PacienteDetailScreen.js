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

const fallbackPatient = {
  record: 'INEO-000341',
  attention: 'A-2381',
  name: 'Mariana Lopez Ruiz',
  age: '54',
  phone: '55 1234 9988',
  bed: 'CONS-02',
  area: 'Consulta',
  doctor: 'Dra. Sandoval',
  admittedAt: '17 Jun 2026',
  reason: 'Valoracion oftalmologica',
};

const initialCharges = [
  { id: 'C-01', date: '17 Jun 2026', description: 'Consulta oftalmologica', quantity: 1, price: 1200 },
  { id: 'C-02', date: '17 Jun 2026', description: 'Paquete de cirugia menor', quantity: 1, price: 8500 },
  { id: 'C-03', date: '17 Jun 2026', description: 'Medicamento postoperatorio', quantity: 2, price: 650 },
  { id: 'C-04', date: '17 Jun 2026', description: 'Material quirurgico', quantity: 1, price: 1400 },
];

const documents = [
  { title: 'Hoja inicial', icon: 'document-text-outline', color: '#667eea' },
  { title: 'Hoja frontal', icon: 'reader-outline', color: '#48bb78' },
  { title: 'Contrato', icon: 'briefcase-outline', color: '#ed8936' },
  { title: 'Consentimiento', icon: 'shield-checkmark-outline', color: '#38b2ac' },
  { title: 'Ficha', icon: 'id-card-outline', color: '#9f7aea' },
];

const money = (value) => `$${Number(value || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

const normalizePatient = (patient = {}) => ({
  ...fallbackPatient,
  ...patient,
  name: patient.name || patient.patient || fallbackPatient.name,
  attention: patient.attention || patient.id_atencion || fallbackPatient.attention,
  record: patient.record || patient.Id_exp || fallbackPatient.record,
});

const extractAccounts = (response) => {
  if (Array.isArray(response)) return response;
  return response?.activeAccounts || response?.accounts || response?.data || [];
};

const PacienteDetailScreen = ({ navigation, route }) => {
  const patient = normalizePatient(route?.params?.patient);
  const idAtencion = patient.id_atencion || patient.idAtencion || route?.params?.id_atencion;
  const [service, setService] = useState('');
  const [serviceQty, setServiceQty] = useState('1');
  const [serviceId, setServiceId] = useState(null);
  const [medicine, setMedicine] = useState('');
  const [medicineQty, setMedicineQty] = useState('1');
  const [medicineId, setMedicineId] = useState(null);
  const [account, setAccount] = useState(null);
  const [options, setOptions] = useState({ servicios: [], medicamentos: [] });
  const [loading, setLoading] = useState(Boolean(idAtencion));
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiNotice, setApiNotice] = useState('');
  const [accountList, setAccountList] = useState([]);

  const totals = useMemo(() => {
    if (account) {
      return {
        subtotal: account.subtotal || 0,
        iva: account.iva || account.tax || 0,
        total: account.total || 0,
        advances: account.advance || account.total_paid || 0,
        balance: account.balance || account.pending || 0,
      };
    }
    const subtotal = initialCharges.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;
    const advances = 5000;
    return { subtotal, iva, total, advances, balance: total - advances };
  }, [account]);

  const charges = account?.charges || account?.items || initialCharges;
  const documentItems = account?.documents || documents;

  const loadAccount = async ({ silent = false } = {}) => {
    if (!idAtencion) {
      try {
        if (!silent) setLoading(true);
        const response = await adminService.getAccounts();
        setAccountList(extractAccounts(response));
        setApiNotice('');
      } catch (error) {
        setApiNotice('No se pudieron consultar las cuentas activas en la API.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
      return;
    }

    try {
      if (!silent) setLoading(true);
      const [accountResponse, optionsResponse] = await Promise.all([
        adminService.getAccount(idAtencion),
        adminService.getOptions(),
      ]);
      setAccount(accountResponse);
      setOptions(optionsResponse || { servicios: [], medicamentos: [] });
      setApiNotice('');
    } catch (error) {
      setApiNotice('Mostrando datos locales. No se pudo consultar la cuenta en la API.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAccount();
  }, [idAtencion]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAccount({ silent: true });
  };

  const addPending = async (type) => {
    if (!idAtencion) {
      Alert.alert('Sin cuenta', 'No hay id de atencion para agregar cargos.');
      return;
    }

    const isService = type === 'Servicio';
    const selectedId = isService ? serviceId : medicineId;
    const description = isService ? service : medicine;
    const quantity = isService ? serviceQty : medicineQty;

    if (!selectedId && !description.trim()) {
      Alert.alert('Dato requerido', `Selecciona o escribe un ${type.toLowerCase()}.`);
      return;
    }

    try {
      setSaving(true);
      const response = await adminService.addCharge(idAtencion, {
        tipo: isService ? 'SERVICIO' : 'MEDICAMENTO',
        id_serv: isService ? selectedId : undefined,
        item_id: isService ? undefined : selectedId,
        descripcion: description,
        cantidad: Number(quantity) || 1,
      });
      setAccount(response);
      setService('');
      setServiceQty('1');
      setServiceId(null);
      setMedicine('');
      setMedicineQty('1');
      setMedicineId(null);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo agregar el cargo.');
    } finally {
      setSaving(false);
    }
  };

  const removeCharge = async (charge) => {
    const chargeId = charge.charge_id || charge.id_cargo || charge.id;
    if (!idAtencion || !chargeId) {
      Alert.alert('Cargo local', 'Este cargo no tiene identificador de API.');
      return;
    }

    try {
      await adminService.removeCharge(idAtencion, chargeId);
      await loadAccount({ silent: true });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo eliminar el cargo.');
    }
  };

  const closeAccount = async () => {
    if (!idAtencion) {
      Alert.alert('Sin cuenta', 'No hay id de atencion para cerrar la cuenta.');
      return;
    }

    try {
      setSaving(true);
      const response = await adminService.closeAccount(idAtencion);
      setAccount(response.account || response);
      Alert.alert('Cuenta cerrada', response.message || 'Cuenta cerrada exitosamente.');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo cerrar la cuenta.');
    } finally {
      setSaving(false);
    }
  };

  const renderHeader = (subtitle) => (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Cuenta del Paciente</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => Alert.alert('PDF pendiente', 'El PDF de cuenta se conectara con la API despues.')}
      >
        <Ionicons name="print-outline" size={22} color="#fff" />
      </TouchableOpacity>
    </LinearGradient>
  );

  if (!idAtencion) {
    return (
      <ScrollView
        style={styles.container}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {renderHeader('Selecciona una cuenta activa')}

        {apiNotice ? (
          <View style={styles.noticeBox}>
            <Ionicons name="cloud-offline-outline" size={16} color="#b7791f" />
            <Text style={styles.noticeText}>{apiNotice}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#667eea" />
            <Text style={styles.loadingText}>Cargando cuentas...</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="receipt-outline" size={21} color="#667eea" />
              <Text style={styles.sectionTitle}>Cuentas activas</Text>
            </View>
            <Text style={styles.sectionHint}>{accountList.length}</Text>
          </View>

          {accountList.length ? (
            accountList.map((item, index) => (
              <TouchableOpacity
                key={item.id_atencion || item.attention || index}
                style={styles.accountPickerCard}
                onPress={() => navigation.replace('PacienteDetail', { patient: item })}
              >
                <View style={styles.accountPickerIcon}>
                  <Ionicons name="person-outline" size={20} color="#667eea" />
                </View>
                <View style={styles.accountPickerBody}>
                  <Text style={styles.accountPickerName} selectable>
                    {item.patient || item.name || 'Paciente sin nombre'}
                  </Text>
                  <Text style={styles.accountPickerMeta}>
                    {item.record || item.Id_exp} - {item.attention || item.id_atencion} - {item.bed || 'Sin cama'}
                  </Text>
                  <Text style={styles.accountPickerMeta}>
                    Saldo: {money(item.balance || item.pending || 0)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#a0aec0" />
              </TouchableOpacity>
            ))
          ) : !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="file-tray-outline" size={34} color="#a0aec0" />
              <Text style={styles.emptyText}>No hay cuentas activas para mostrar</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {renderHeader(`${(account || patient).attention} - ${(account || patient).record}`)}

      <View style={styles.patientHero}>
        <View style={styles.heroAvatar}>
          <Ionicons name="person-outline" size={30} color="#667eea" />
        </View>
        <View style={styles.heroBody}>
          <Text style={styles.patientName} selectable>{(account || patient).name || (account || patient).patient}</Text>
          <Text style={styles.patientMeta}>{(account || patient).area} - {(account || patient).bed} - {(account || patient).doctor}</Text>
          <Text style={styles.patientMeta}>Ingreso: {(account || patient).admittedAt}</Text>
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
          <Text style={styles.loadingText}>Cargando cuenta...</Text>
        </View>
      ) : null}

      <View style={styles.totalGrid}>
        <TotalCard label="Subtotal" value={money(totals.subtotal)} color="#4299e1" />
        <TotalCard label="IVA" value={money(totals.iva)} color="#ed8936" />
        <TotalCard label="Total" value={money(totals.total)} color="#667eea" />
        <TotalCard label="Saldo" value={money(totals.balance)} color="#e53e3e" />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="add-circle-outline" size={21} color="#667eea" />
            <Text style={styles.sectionTitle}>Agregar cargos</Text>
          </View>
        </View>

        <ChargeForm
          title="Servicio"
          placeholder="Selecciona o escribe servicio"
          value={service}
          qty={serviceQty}
          onValueChange={setService}
          onQtyChange={setServiceQty}
          options={(options.servicios || []).slice(0, 5).map((item) => ({
            id: item.id_serv,
            label: item.serv_desc,
          }))}
          selectedId={serviceId}
          onSelect={(item) => {
            setServiceId(item.id);
            setService(item.label);
          }}
          onAdd={() => addPending('Servicio')}
          saving={saving}
        />
        <ChargeForm
          title="Medicamento"
          placeholder="Selecciona o escribe medicamento"
          value={medicine}
          qty={medicineQty}
          onValueChange={setMedicine}
          onQtyChange={setMedicineQty}
          options={(options.medicamentos || []).slice(0, 5).map((item) => ({
            id: item.item_id,
            label: item.item_name,
          }))}
          selectedId={medicineId}
          onSelect={(item) => {
            setMedicineId(item.id);
            setMedicine(item.label);
          }}
          onAdd={() => addPending('Medicamento')}
          saving={saving}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="receipt-outline" size={21} color="#48bb78" />
            <Text style={styles.sectionTitle}>Detalle de cuenta</Text>
          </View>
          <Text style={styles.sectionHint}>{charges.length} cargos</Text>
        </View>

        {charges.map((charge, index) => (
          <View key={charge.charge_id || charge.id_cargo || charge.id || index} style={styles.chargeCard}>
            <View style={styles.chargeIndex}>
              <Text style={styles.chargeIndexText}>{index + 1}</Text>
            </View>
            <View style={styles.chargeBody}>
              <View style={styles.chargeTop}>
                <Text style={styles.chargeDescription} selectable>{charge.description || charge.descripcion}</Text>
                <TouchableOpacity onPress={() => removeCharge(charge)}>
                  <Ionicons name="trash-outline" size={18} color="#e53e3e" />
                </TouchableOpacity>
              </View>
              <Text style={styles.chargeDate}>{charge.date || charge.fecha || ''}</Text>
              <View style={styles.chargeAmounts}>
                <Text style={styles.chargeMeta}>Cant. {charge.quantity || charge.cantidad}</Text>
                <Text style={styles.chargeMeta}>Precio {money(charge.price || charge.precio)}</Text>
                <Text style={styles.chargeTotal}>{money(charge.subtotal || ((charge.quantity || charge.cantidad || 1) * (charge.price || charge.precio || 0)))}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="documents-outline" size={21} color="#ed8936" />
            <Text style={styles.sectionTitle}>Documentos</Text>
          </View>
        </View>
        <View style={styles.documentGrid}>
          {documentItems.map((doc) => (
            <TouchableOpacity
              key={doc.key || doc.title}
              style={styles.documentButton}
              onPress={() => Alert.alert(doc.title, doc.endpoint || 'Documento disponible desde la API.')}
            >
              <View style={[styles.documentIcon, { backgroundColor: `${doc.color || '#667eea'}18` }]}>
                <Ionicons name={doc.icon || 'document-text-outline'} size={21} color={doc.color || '#667eea'} />
              </View>
              <Text style={styles.documentText}>{doc.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.closeCard}>
        <View style={styles.closeText}>
          <Text style={styles.closeTitle}>Cerrar cuenta</Text>
          <Text style={styles.closeSubtitle}>Marca la atencion como cerrada cuando la cuenta quede liquidada.</Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={closeAccount}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Ionicons name="lock-closed-outline" size={18} color="#fff" />}
          <Text style={styles.closeButtonText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const TotalCard = ({ label, value, color }) => (
  <View style={styles.totalCard}>
    <Text style={[styles.totalValue, { color }]} numberOfLines={1}>{value}</Text>
    <Text style={styles.totalLabel}>{label}</Text>
  </View>
);

const ChargeForm = ({ title, placeholder, value, qty, onValueChange, onQtyChange, onAdd, options, selectedId, onSelect, saving }) => (
  <View style={styles.chargeForm}>
    <Text style={styles.formTitle}>{title}</Text>
    {options?.length ? (
      <View style={styles.optionWrap}>
        {options.map((item) => (
          <TouchableOpacity
            key={item.id || item.label}
            style={[styles.optionChip, selectedId === item.id && styles.optionChipActive]}
            onPress={() => onSelect(item)}
          >
            <Text style={[styles.optionText, selectedId === item.id && styles.optionTextActive]} numberOfLines={1}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    ) : null}
    <View style={styles.formRow}>
      <TextInput
        value={value}
        onChangeText={onValueChange}
        placeholder={placeholder}
        placeholderTextColor="#a0aec0"
        style={[styles.input, styles.itemInput]}
      />
      <TextInput
        value={qty}
        onChangeText={onQtyChange}
        placeholder="Cant."
        placeholderTextColor="#a0aec0"
        keyboardType="numeric"
        style={[styles.input, styles.qtyInput]}
      />
    </View>
    <TouchableOpacity style={styles.addButton} onPress={onAdd} disabled={saving}>
      {saving ? <ActivityIndicator color="#fff" /> : <Ionicons name="add-circle-outline" size={18} color="#fff" />}
      <Text style={styles.addButtonText}>Agregar {title.toLowerCase()}</Text>
    </TouchableOpacity>
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
  patientHero: {
    marginHorizontal: 16,
    marginTop: -22,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    boxShadow: '0 2px 8px rgba(45, 55, 72, 0.10)',
  },
  heroAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#667eea18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heroBody: { flex: 1 },
  patientName: { color: '#2d3748', fontSize: 17, fontWeight: '900' },
  patientMeta: { color: '#718096', fontSize: 12, marginTop: 3 },
  totalGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginTop: 14 },
  totalCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    boxShadow: '0 2px 8px rgba(45, 55, 72, 0.08)',
  },
  totalValue: { fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
  totalLabel: { color: '#718096', fontSize: 12, marginTop: 2 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    boxShadow: '0 2px 8px rgba(45, 55, 72, 0.08)',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  sectionTitle: { color: '#2d3748', fontSize: 16, fontWeight: '900', marginLeft: 8 },
  sectionHint: { color: '#a0aec0', fontSize: 12, fontWeight: '700' },
  chargeForm: { backgroundColor: '#f7fafc', borderRadius: 14, padding: 12, marginBottom: 12 },
  formTitle: { color: '#4a5568', fontSize: 13, fontWeight: '900', marginBottom: 8 },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  optionChip: {
    maxWidth: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e0',
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  optionChipActive: { backgroundColor: '#667eea', borderColor: '#667eea' },
  optionText: { color: '#4a5568', fontSize: 12, fontWeight: '800' },
  optionTextActive: { color: '#fff' },
  formRow: { flexDirection: 'row' },
  input: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    color: '#2d3748',
    fontSize: 14,
  },
  itemInput: { flex: 1, marginRight: 8 },
  qtyInput: { width: 76, textAlign: 'center' },
  addButton: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: '#667eea',
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  addButtonText: { color: '#fff', fontSize: 13, fontWeight: '900', marginLeft: 6 },
  chargeCard: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
    paddingTop: 12,
    marginTop: 12,
  },
  chargeIndex: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#667eea18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  chargeIndexText: { color: '#667eea', fontWeight: '900', fontSize: 12 },
  chargeBody: { flex: 1 },
  chargeTop: { flexDirection: 'row', justifyContent: 'space-between' },
  chargeDescription: { flex: 1, color: '#2d3748', fontSize: 14, fontWeight: '800', paddingRight: 8 },
  chargeDate: { color: '#a0aec0', fontSize: 11, marginTop: 3 },
  chargeAmounts: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  chargeMeta: { color: '#718096', fontSize: 12, marginRight: 12 },
  chargeTotal: { marginLeft: 'auto', color: '#2f855a', fontSize: 13, fontWeight: '900', fontVariant: ['tabular-nums'] },
  documentGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  documentButton: {
    width: '50%',
    paddingRight: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  documentText: { color: '#4a5568', fontSize: 13, fontWeight: '800', flex: 1 },
  closeCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#2d3748',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeText: { flex: 1, paddingRight: 12 },
  closeTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  closeSubtitle: { color: 'rgba(255,255,255,0.72)', fontSize: 12, lineHeight: 18, marginTop: 4 },
  closeButton: {
    backgroundColor: '#e53e3e',
    minHeight: 42,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButtonText: { color: '#fff', fontSize: 13, fontWeight: '900', marginLeft: 6 },
  accountPickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
    paddingTop: 12,
    marginTop: 12,
  },
  accountPickerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#667eea18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  accountPickerBody: { flex: 1, paddingRight: 8 },
  accountPickerName: { color: '#2d3748', fontSize: 15, fontWeight: '900' },
  accountPickerMeta: { color: '#718096', fontSize: 12, marginTop: 3 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 130,
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
  },
  emptyText: { color: '#a0aec0', fontSize: 13, marginTop: 8, textAlign: 'center' },
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

export default PacienteDetailScreen;
