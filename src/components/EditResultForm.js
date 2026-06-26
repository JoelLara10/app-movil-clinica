import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import api from '../services/api';

export default function EditResultForm({ navigation, route }) {
  const { id_examen, tipo } = route.params;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [info, setInfo] = useState({ paciente: '', habitacion: '', archivos: [], observaciones: '' });
  const [nuevosArchivos, setNuevosArchivos] = useState([]);
  const [archivosAEliminar, setArchivosAEliminar] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    const loadInfo = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/exams/${id_examen}/edit-info?type=${tipo}`);
        const data = response.data;
        setInfo({
          paciente: data.paciente || '',
          habitacion: data.habitacion || '',
          archivos: data.archivos || [],
          observaciones: data.observaciones || '',
        });
        const eliminarState = {};
        (data.archivos || []).forEach(nombre => { eliminarState[nombre] = false; });
        setArchivosAEliminar(eliminarState);
        setError('');
      } catch (err) {
        console.error('Error cargando info:', err);
        setError('No se pudo cargar la información.');
      } finally {
        setLoading(false);
      }
    };
    loadInfo();
  }, [id_examen]);

  const pickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/png', 'image/jpeg'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || result.type === 'cancel') return;

      let selectedFiles = [];
      if (result.assets) {
        selectedFiles = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.name || 'archivo',
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
        }));
      } else if (result.output) {
        selectedFiles = result.output.map(file => ({
          uri: file.uri,
          name: file.name || 'archivo',
          type: file.type || file.mimeType || 'application/octet-stream',
          size: file.size || 0,
        }));
      } else if (result.uri) {
        selectedFiles = [{
          uri: result.uri,
          name: result.name || 'archivo',
          type: result.type || result.mimeType || 'application/octet-stream',
          size: result.size || 0,
        }];
      }

      if (selectedFiles.length === 0) return;

      setNuevosArchivos(prev => {
        const existing = new Set(prev.map(f => f.uri));
        const newFiles = selectedFiles.filter(f => !existing.has(f.uri));
        return [...prev, ...newFiles];
      });
    } catch (err) {
      console.error('Error seleccionando archivos:', err);
      Alert.alert('Error', 'No se pudieron seleccionar los archivos.');
    }
  };

  const removeNuevoArchivo = (index) => {
    setNuevosArchivos(prev => prev.filter((_, i) => i !== index));
  };

  const toggleEliminar = (nombre) => {
    setArchivosAEliminar(prev => ({
      ...prev,
      [nombre]: !prev[nombre]
    }));
  };

  const handleSubmit = async () => {
    const archivosExistentes = info.archivos.filter(nombre => !archivosAEliminar[nombre]);
    if (archivosExistentes.length === 0 && nuevosArchivos.length === 0) {
      Alert.alert('Error', 'Debe mantener al menos un archivo o agregar uno nuevo.');
      return;
    }

    const MAX_SIZE = 25 * 1024 * 1024;
    for (const file of nuevosArchivos) {
      if (file.size > MAX_SIZE) {
        Alert.alert('Error', `El archivo "${file.name}" excede 25MB.`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      nuevosArchivos.forEach((file) => {
        formData.append('archivos', {
          uri: file.uri,
          name: file.name,
          type: file.type,
        });
      });

      const eliminarList = Object.keys(archivosAEliminar).filter(nombre => archivosAEliminar[nombre]);
      eliminarList.forEach(nombre => {
        formData.append('eliminar_archivos', nombre);
      });

      formData.append('observaciones', info.observaciones);
      formData.append('type', tipo);

      await api.put(`/exams/${id_examen}/edit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        timeout: 60000,
      });

      Alert.alert('Éxito', 'Cambios guardados correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error('Error al actualizar:', err);
      let msg = 'Error al actualizar los resultados.';
      if (err.response?.data?.error) {
        msg = err.response.data.error;
      } else if (err.message) {
        msg = err.message;
      }
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Regresar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Resultados</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Paciente:</Text>
          <Text style={styles.value}>{info.paciente}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Habitación:</Text>
          <Text style={styles.value}>{info.habitacion}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Archivos existentes</Text>
        {info.archivos.length === 0 ? (
          <Text style={styles.emptyText}>No hay archivos registrados.</Text>
        ) : (
          info.archivos.map((nombre, index) => (
            <View key={index} style={styles.fileItem}>
              <Text style={styles.fileName} numberOfLines={1}>{nombre}</Text>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Eliminar</Text>
                <Switch
                  value={archivosAEliminar[nombre] || false}
                  onValueChange={() => toggleEliminar(nombre)}
                  trackColor={{ false: '#cbd5e0', true: '#e53e3e' }}
                  thumbColor={archivosAEliminar[nombre] ? '#e53e3e' : '#f4f4f4'}
                />
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Agregar nuevos archivos</Text>
        <TouchableOpacity style={styles.pickButton} onPress={pickDocuments}>
          <Text style={styles.pickButtonText}>📎 Seleccionar archivos</Text>
        </TouchableOpacity>

        {nuevosArchivos.length > 0 && (
          <View style={styles.fileList}>
            {nuevosArchivos.map((file, index) => (
              <View key={`${file.uri}_${index}`} style={styles.fileItem}>
                <Text style={styles.fileName} numberOfLines={1}>
                  📄 {file.name}
                </Text>
                <Text style={styles.fileSize}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </Text>
                <TouchableOpacity onPress={() => removeNuevoArchivo(index)}>
                  <Text style={styles.removeFile}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.hint}>Formatos: PDF, PNG, JPG, JPEG (máx 25MB)</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Observaciones</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="Observaciones relevantes..."
          placeholderTextColor="#a0aec0"
          value={info.observaciones}
          onChangeText={(text) => setInfo({ ...info, observaciones: text })}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>💾 Guardar Cambios</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: '#718096' },
  errorText: { color: '#e53e3e', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#667eea', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '500' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  backButton: { padding: 8 },
  backText: { fontSize: 24, color: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  infoRow: { flexDirection: 'row', marginBottom: 8 },
  label: { width: 100, fontWeight: '600', color: '#2d3748' },
  value: { flex: 1, color: '#4a5568' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#2d3748', marginBottom: 12 },
  pickButton: { backgroundColor: '#e8f4fd', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#4dabf7', borderStyle: 'dashed' },
  pickButtonText: { color: '#4dabf7', fontWeight: '500', fontSize: 15 },
  fileList: { marginTop: 12 },
  fileItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f7fafc', padding: 10, borderRadius: 6, marginBottom: 6 },
  fileName: { flex: 1, color: '#2d3748', fontSize: 14 },
  fileSize: { fontSize: 12, color: '#718096', marginHorizontal: 8 },
  removeFile: { color: '#e53e3e', fontWeight: 'bold', fontSize: 18, paddingHorizontal: 8 },
  hint: { fontSize: 12, color: '#a0aec0', marginTop: 8 },
  textArea: { height: 100, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, textAlignVertical: 'top', fontSize: 14 },
  submitButton: { backgroundColor: '#667eea', marginHorizontal: 16, marginTop: 20, marginBottom: 30, padding: 14, borderRadius: 10, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabledButton: { opacity: 0.6 },
  switchContainer: { flexDirection: 'row', alignItems: 'center' },
  switchLabel: { fontSize: 12, color: '#718096', marginRight: 8 },
  emptyText: { color: '#a0aec0', fontSize: 14, textAlign: 'center', paddingVertical: 10 },
});