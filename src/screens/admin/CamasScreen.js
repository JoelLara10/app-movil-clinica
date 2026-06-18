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

const initialBeds = [
  {
    id: '1',
    number: 'H-101',
    area: 'Hospitalizacion',
    roomType: 'Individual',
    floor: '1',
    section: 'A',
    status: 'LIBRE',
    patient: '',
  },
  {
    id: '2',
    number: 'H-102',
    area: 'Hospitalizacion',
    roomType: 'Compartida',
    floor: '1',
    section: 'A',
    status: 'OCUPADA',
    patient: 'Lucia Moreno Paz',
  },
  {
    id: '3',
    number: 'U-201',
    area: 'Urgencias',
    roomType: 'Observacion',
    floor: '2',
    section: 'B',
    status: 'LIBRE',
    patient: '',
  },
  {
    id: '4',
    number: 'R-301',
    area: 'Recuperacion',
    roomType: 'Suite',
    floor: '3',
    section: 'C',
    status: 'MANTENIMIENTO',
    patient: '',
  },
  {
    id: '5',
    number: 'C-004',
    area: 'Consulta',
    roomType: 'Consultorio',
    floor: 'PB',
    section: 'D',
    status: 'OCUPADA',
    patient: 'Mariana Lopez Ruiz',
  },
];

const areas = ['Hospitalizacion', 'Urgencias', 'Recuperacion', 'Consulta'];
const statuses = ['LIBRE', 'OCUPADA', 'MANTENIMIENTO'];

const emptyForm = {
  number: '',
  area: 'Hospitalizacion',
  roomType: '',
  floor: '',
  section: '',
  status: 'LIBRE',
};

const statusMeta = {
  LIBRE: { label: 'Libre', color: '#48bb78', icon: 'checkmark-circle-outline' },
  OCUPADA: { label: 'Ocupada', color: '#e53e3e', icon: 'person-circle-outline' },
  MANTENIMIENTO: { label: 'Mantenimiento', color: '#ed8936', icon: 'construct-outline' },
};

const normalizeBed = (bed, index = 0) => {
  const occupied = bed.ocupada === 1 || bed.ocupada === true || bed.status === 'OCUPADA' || bed.estatus === 'OCUPADA';
  const maintenance = bed.status === 'MANTENIMIENTO' || bed.estatus === 'MANTENIMIENTO';
  return {
    id: String(bed.id_cama || bed.id || bed._id || index),
    id_cama: bed.id_cama || bed.id,
    number: bed.numero || bed.num_cama || bed.number || '',
    area: bed.area || bed.tipo || 'Hospitalizacion',
    roomType: bed.tipo_habitacion || bed.roomType || bed.tipo || 'N/A',
    floor: String(bed.piso || bed.floor || 'N/A'),
    section: String(bed.seccion || bed.section || 'N/A'),
    status: maintenance ? 'MANTENIMIENTO' : occupied ? 'OCUPADA' : 'LIBRE',
    patient: bed.patient || bed.paciente || '',
  };
};

const CamasScreen = ({ navigation }) => {
  const [beds, setBeds] = useState(initialBeds);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('TODAS');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiNotice, setApiNotice] = useState('');

  const loadBeds = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const response = await adminService.getBeds();
      const source = Array.isArray(response) ? response : response.data || response.beds || response.camas || [];
      setBeds(source.map(normalizeBed));
      setApiNotice('');
    } catch (error) {
      setApiNotice('Mostrando camas locales. Si tu API usa otra ruta para camas, pasame routes/beds.py y la ajusto.');
      setBeds((current) => (current.length ? current : initialBeds));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBeds();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadBeds({ silent: true });
  };

  const stats = useMemo(() => ({
    total: beds.length,
    free: beds.filter((bed) => bed.status === 'LIBRE').length,
    occupied: beds.filter((bed) => bed.status === 'OCUPADA').length,
    maintenance: beds.filter((bed) => bed.status === 'MANTENIMIENTO').length,
  }), [beds]);

  const filteredBeds = useMemo(() => {
    const query = search.trim().toLowerCase();
    return beds.filter((bed) => {
      const statusMatches = filter === 'TODAS' || bed.status === filter;
      const text = `${bed.number} ${bed.area} ${bed.roomType} ${bed.floor} ${bed.section} ${bed.status} ${bed.patient}`.toLowerCase();
      return statusMatches && text.includes(query);
    });
  }, [beds, filter, search]);

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const startEdit = (bed) => {
    setEditingId(bed.id);
    setForm({
      number: bed.number,
      area: bed.area,
      roomType: bed.roomType,
      floor: bed.floor,
      section: bed.section,
      status: bed.status,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    const trimmedNumber = form.number.trim();
    if (!trimmedNumber) {
      Alert.alert('Numero requerido', 'Ingresa el numero de cama o habitacion.');
      return;
    }

    const payload = {
      numero: trimmedNumber,
      area: form.area,
      tipo_habitacion: form.roomType || 'N/A',
      piso: form.floor || 'N/A',
      seccion: form.section || 'N/A',
      ocupada: form.status === 'OCUPADA' ? 1 : 0,
      estatus: form.status,
    };

    if (editingId) {
      const currentBed = beds.find((bed) => bed.id === editingId);
      try {
        if (currentBed?.id_cama) {
          await adminService.updateBed(currentBed.id_cama, payload);
        }
      } catch (error) {
        setApiNotice('No se pudo actualizar en API. Se aplico solo en la vista local.');
      }
      setBeds((current) => current.map((bed) => (
        bed.id === editingId
          ? {
            ...bed,
            number: trimmedNumber,
            area: form.area,
            roomType: form.roomType || 'N/A',
            floor: form.floor || 'N/A',
            section: form.section || 'N/A',
            status: form.status,
          }
          : bed
      )));
      Alert.alert('Cama actualizada', currentBed?.id_cama ? 'Cambio enviado a la API.' : 'Cambio aplicado en la vista local.');
    } else {
      try {
        const created = await adminService.createBed(payload);
        const normalized = normalizeBed(created.data || created.bed || created.cama || created, 0);
        setBeds((current) => [normalized, ...current]);
        Alert.alert('Cama registrada', 'Registro enviado a la API.');
        resetForm();
        return;
      } catch (error) {
        setApiNotice('No se pudo registrar en API. Se agrego solo en la vista local.');
      }
      setBeds((current) => [
        {
          id: String(Date.now()),
          number: trimmedNumber,
          area: form.area,
          roomType: form.roomType || 'N/A',
          floor: form.floor || 'N/A',
          section: form.section || 'N/A',
          status: form.status,
          patient: '',
        },
        ...current,
      ]);
      Alert.alert('Cama registrada', 'Registro agregado solo en la vista local.');
    }

    resetForm();
  };

  const confirmDelete = (bed) => {
    Alert.alert(
      'Eliminar cama',
      `La cama ${bed.number} se eliminara solo de esta vista local.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (bed.id_cama) {
                await adminService.deleteBed(bed.id_cama);
              }
            } catch (error) {
              setApiNotice('No se pudo eliminar en API. Se elimino solo de la vista local.');
            }
            setBeds((current) => current.filter((item) => item.id !== bed.id));
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Gestion de Camas</Text>
          <Text style={styles.headerSubtitle}>Catalogo, estatus y habitaciones</Text>
        </View>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => Alert.alert('Sin API todavia', 'Estos cambios son solo visuales por ahora.')}
        >
          <Ionicons name="information-circle-outline" size={23} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.statsGrid}>
        <StatCard label="Total" value={stats.total} color="#667eea" icon="bed-outline" />
        <StatCard label="Libres" value={stats.free} color="#48bb78" icon="checkmark-circle-outline" />
        <StatCard label="Ocupadas" value={stats.occupied} color="#e53e3e" icon="person-outline" />
        <StatCard label="Mantto." value={stats.maintenance} color="#ed8936" icon="construct-outline" />
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
          <Text style={styles.loadingText}>Cargando camas...</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="list-outline" size={21} color="#667eea" />
            <Text style={styles.sectionTitle}>Catalogo de Camas</Text>
          </View>
          <TouchableOpacity style={styles.registerButton} onPress={resetForm}>
            <Ionicons name="add-circle-outline" size={17} color="#fff" />
            <Text style={styles.registerText}>Registrar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#a0aec0" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar cama, estatus o area..."
            placeholderTextColor="#a0aec0"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.filterRow}>
          {['TODAS', ...statuses].map((status) => {
            const active = status === filter;
            const color = status === 'TODAS' ? '#667eea' : statusMeta[status].color;
            return (
              <TouchableOpacity
                key={status}
                style={[styles.filterChip, active && { backgroundColor: color, borderColor: color }]}
                onPress={() => setFilter(status)}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {status === 'TODAS' ? 'Todas' : statusMeta[status].label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredBeds.length ? (
          filteredBeds.map((bed) => (
            <BedCard
              key={bed.id}
              bed={bed}
              selected={bed.id === editingId}
              onEdit={() => startEdit(bed)}
              onDelete={() => confirmDelete(bed)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={34} color="#a0aec0" />
            <Text style={styles.emptyTitle}>No hay camas registradas</Text>
            <Text style={styles.emptyText}>Cambia la busqueda o registra una nueva cama.</Text>
          </View>
        )}
      </View>

      <View style={styles.formCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name={editingId ? 'create-outline' : 'add-circle-outline'} size={21} color="#667eea" />
            <Text style={styles.sectionTitle}>{editingId ? 'Editar Cama' : 'Agregar Cama'}</Text>
          </View>
          {editingId ? (
            <TouchableOpacity onPress={resetForm} style={styles.clearButton}>
              <Text style={styles.clearText}>Limpiar</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Field
          label="Numero de cama"
          value={form.number}
          onChangeText={(value) => updateForm('number', value.toUpperCase())}
          placeholder="Ej. H-101"
          autoCapitalize="characters"
        />

        <OptionGroup
          label="Area"
          options={areas}
          value={form.area}
          onChange={(value) => updateForm('area', value)}
        />

        <Field
          label="Tipo de habitacion"
          value={form.roomType}
          onChangeText={(value) => updateForm('roomType', value)}
          placeholder="Individual, Compartida, Suite"
        />

        <View style={styles.twoColumn}>
          <Field
            label="Piso"
            value={form.floor}
            onChangeText={(value) => updateForm('floor', value)}
            placeholder="1"
            style={styles.halfField}
          />
          <Field
            label="Seccion"
            value={form.section}
            onChangeText={(value) => updateForm('section', value.toUpperCase())}
            placeholder="A"
            autoCapitalize="characters"
            style={styles.halfField}
          />
        </View>

        <OptionGroup
          label="Estatus"
          options={statuses}
          value={form.status}
          onChange={(value) => updateForm('status', value)}
          getLabel={(value) => statusMeta[value].label}
          getColor={(value) => statusMeta[value].color}
        />

        <View style={styles.formActions}>
          <TouchableOpacity style={[styles.formButton, styles.cancelButton]} onPress={resetForm}>
            <Ionicons name="close-circle-outline" size={18} color="#718096" />
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.formButton, styles.saveButton]} onPress={handleSave}>
            <Ionicons name="save-outline" size={18} color="#fff" />
            <Text style={styles.saveText}>{editingId ? 'Actualizar' : 'Guardar'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}>
      <Ionicons name={icon} size={21} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const BedCard = ({ bed, selected, onEdit, onDelete }) => {
  const meta = statusMeta[bed.status];
  return (
    <View style={[styles.bedCard, selected && styles.bedCardSelected]}>
      <View style={styles.bedTopRow}>
        <View style={styles.bedTitleRow}>
          <View style={[styles.bedIcon, { backgroundColor: `${meta.color}18` }]}>
            <Ionicons name={meta.icon} size={24} color={meta.color} />
          </View>
          <View>
            <Text style={styles.bedNumber} selectable>{bed.number}</Text>
            <Text style={styles.bedArea}>{bed.area}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: meta.color }]}>
          <Text style={styles.statusText}>{meta.label}</Text>
        </View>
      </View>

      {bed.patient ? (
        <View style={styles.patientBox}>
          <Ionicons name="person-outline" size={16} color="#e53e3e" />
          <Text style={styles.patientText} selectable>{bed.patient}</Text>
        </View>
      ) : null}

      <View style={styles.infoGrid}>
        <Info label="Habitacion" value={bed.roomType} />
        <Info label="Piso" value={bed.floor} />
        <Info label="Seccion" value={bed.section} />
        <Info label="Estado" value={meta.label} strong color={meta.color} />
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={onEdit}>
          <Ionicons name="create-outline" size={16} color="#667eea" />
          <Text style={[styles.actionText, { color: '#667eea' }]}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
          <Ionicons name="trash-outline" size={16} color="#e53e3e" />
          <Text style={[styles.actionText, { color: '#e53e3e' }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Info = ({ label, value, strong, color }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, strong && { color, fontWeight: '900' }]} selectable>
      {value}
    </Text>
  </View>
);

const Field = ({ label, style, ...props }) => (
  <View style={[styles.field, style]}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      {...props}
      placeholderTextColor="#a0aec0"
      style={styles.input}
    />
  </View>
);

const OptionGroup = ({ label, options, value, onChange, getLabel, getColor }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.optionWrap}>
      {options.map((option) => {
        const active = option === value;
        const color = getColor ? getColor(option) : '#667eea';
        return (
          <TouchableOpacity
            key={option}
            style={[styles.optionChip, active && { backgroundColor: color, borderColor: color }]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.optionText, active && styles.optionTextActive]}>
              {getLabel ? getLabel(option) : option}
            </Text>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: -24,
  },
  statCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    boxShadow: '0 2px 8px rgba(45, 55, 72, 0.10)',
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { color: '#2d3748', fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] },
  statLabel: { color: '#718096', fontSize: 12, marginTop: 2 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    boxShadow: '0 2px 8px rgba(45, 55, 72, 0.08)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  sectionTitle: { color: '#2d3748', fontSize: 16, fontWeight: '900', marginLeft: 8 },
  registerButton: {
    backgroundColor: '#667eea',
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerText: { color: '#fff', fontSize: 12, fontWeight: '900', marginLeft: 5 },
  searchBox: {
    backgroundColor: '#f7fafc',
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: { flex: 1, marginLeft: 8, color: '#2d3748', fontSize: 14 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, marginBottom: 4 },
  filterChip: {
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e0',
    marginRight: 8,
    marginBottom: 8,
  },
  filterText: { color: '#4a5568', fontSize: 12, fontWeight: '800' },
  filterTextActive: { color: '#fff' },
  bedCard: {
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
    paddingTop: 14,
    marginTop: 12,
  },
  bedCardSelected: {
    borderTopColor: '#667eea',
  },
  bedTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bedTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  bedIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bedNumber: { color: '#2d3748', fontSize: 17, fontWeight: '900' },
  bedArea: { color: '#718096', fontSize: 12, marginTop: 2 },
  statusBadge: {
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  patientBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
  },
  patientText: { color: '#742a2a', fontSize: 13, fontWeight: '800', marginLeft: 6 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  infoItem: { width: '50%', marginBottom: 10, paddingRight: 8 },
  infoLabel: { color: '#a0aec0', fontSize: 10, textTransform: 'uppercase', fontWeight: '700' },
  infoValue: { color: '#4a5568', fontSize: 13, marginTop: 2 },
  cardActions: { flexDirection: 'row', marginTop: 2 },
  actionButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: { backgroundColor: '#667eea16', marginRight: 8 },
  deleteButton: { backgroundColor: '#e53e3e14' },
  actionText: { fontSize: 13, fontWeight: '900', marginLeft: 5 },
  emptyState: { alignItems: 'center', paddingVertical: 28 },
  emptyTitle: { color: '#2d3748', fontSize: 15, fontWeight: '900', marginTop: 10 },
  emptyText: { color: '#718096', fontSize: 12, textAlign: 'center', marginTop: 4 },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    boxShadow: '0 2px 8px rgba(45, 55, 72, 0.08)',
  },
  clearButton: {
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#edf2f7',
  },
  clearText: { color: '#4a5568', fontSize: 12, fontWeight: '900' },
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
  twoColumn: { flexDirection: 'row' },
  halfField: { flex: 1, marginRight: 8 },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  optionChip: {
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e0',
    marginRight: 8,
    marginBottom: 8,
  },
  optionText: { color: '#4a5568', fontSize: 12, fontWeight: '800' },
  optionTextActive: { color: '#fff' },
  formActions: { flexDirection: 'row', marginTop: 2 },
  formButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8 },
  saveButton: { backgroundColor: '#667eea' },
  cancelText: { color: '#718096', fontSize: 14, fontWeight: '900', marginLeft: 6 },
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
  loadingBox: { alignItems: 'center', paddingVertical: 24 },
  loadingText: { color: '#718096', fontSize: 13, marginTop: 8 },
});

export default CamasScreen;
