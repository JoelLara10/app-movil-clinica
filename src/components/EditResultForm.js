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
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import api from '../services/api';
import { getCache, setCache, CacheKeys, invalidateCachePrefix, removeCache } from '../services/EstudiosCache';

export default function EditResultForm({ navigation, route }) {
  const { id_examen, tipo } = route.params;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [info, setInfo] = useState({ paciente: '', habitacion: '', archivos: [], observaciones: '' });
  const [nuevosArchivos, setNuevosArchivos] = useState([]);
  const [archivosAEliminar, setArchivosAEliminar] = useState({});
  const [error, setError] = useState('');

  // ============================================================
  //  LOAD INFO WITH CACHE
  // ============================================================
  useEffect(() => {
    const loadInfo = async () => {
      try {
        setLoading(true);
        const cacheKey = CacheKeys.examenEditInfo(id_examen, tipo);
        let data = await getCache(cacheKey);
        if (!data) {
          const response = await api.get(`/exams/${id_examen}/edit-info?type=${tipo}`);
          data = response.data;
          await setCache(cacheKey, data);
        }
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
        console.error('Error loading info:', err);
        setError('Could not load information.');
      } finally {
        setLoading(false);
      }
    };
    loadInfo();
  }, [id_examen, tipo]);

  // ============================================================
  //  FILE SELECTION
  // ============================================================
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
          name: asset.name || 'file',
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
        }));
      } else if (result.output) {
        selectedFiles = result.output.map(file => ({
          uri: file.uri,
          name: file.name || 'file',
          type: file.type || file.mimeType || 'application/octet-stream',
          size: file.size || 0,
        }));
      } else if (result.uri) {
        selectedFiles = [{
          uri: result.uri,
          name: result.name || 'file',
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
      console.error('Error selecting files:', err);
      Alert.alert('Error', 'Could not select files.');
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

  // ============================================================
  //  SUBMIT WITH CACHE INVALIDATION
  // ============================================================
  const handleSubmit = async () => {
    const archivosExistentes = info.archivos.filter(nombre => !archivosAEliminar[nombre]);
    if (archivosExistentes.length === 0 && nuevosArchivos.length === 0) {
      Alert.alert('Error', 'You must keep at least one file or add a new one.');
      return;
    }

    const MAX_SIZE = 25 * 1024 * 1024;
    for (const file of nuevosArchivos) {
      if (file.size > MAX_SIZE) {
        Alert.alert('Error', `File "${file.name}" exceeds 25MB.`);
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

      // Invalidate cache for lists, counts, info and edit-info
      await invalidateCachePrefix('estudios_all_');
      await removeCache(CacheKeys.counts);
      await removeCache(CacheKeys.examenInfo(id_examen));
      await removeCache(CacheKeys.examenEditInfo(id_examen, tipo));

      Alert.alert('Success', 'Changes saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error('Error updating:', err);
      let msg = 'Error updating results.';
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

  // ============================================================
  //  RENDER
  // ============================================================
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#e53e3e" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          <Ionicons name="create-outline" size={20} color="#fff" /> Edit Results
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Patient Summary Card */}
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryTitle}>{info.paciente}</Text>
          <Text style={styles.summarySubtitle}>
            <Ionicons name="bed-outline" size={14} color="#718096" /> Room: {info.habitacion}
          </Text>
        </View>
        <View style={styles.statsPill}>
          <Ionicons name="document-text-outline" size={16} color="#667eea" />
          <Text style={styles.statsPillText}>{info.archivos.length}</Text>
        </View>
      </View>

      {/* Existing Files Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Existing Files</Text>
        {info.archivos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={32} color="#cbd5e0" />
            <Text style={styles.emptyText}>No files registered.</Text>
          </View>
        ) : (
          info.archivos.map((nombre, index) => (
            <View key={index} style={styles.fileItem}>
              <View style={styles.fileItemLeft}>
                <Ionicons name="document-text-outline" size={18} color="#4a5568" />
                <Text style={styles.fileName} numberOfLines={1}>{nombre}</Text>
              </View>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Delete</Text>
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

      {/* Add New Files Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Add New Files</Text>
        <TouchableOpacity style={styles.pickButton} onPress={pickDocuments}>
          <Ionicons name="attach-outline" size={20} color="#4dabf7" />
          <Text style={styles.pickButtonText}>Select files</Text>
        </TouchableOpacity>

        {nuevosArchivos.length > 0 && (
          <View style={styles.fileList}>
            {nuevosArchivos.map((file, index) => (
              <View key={`${file.uri}_${index}`} style={styles.fileItem}>
                <View style={styles.fileItemLeft}>
                  <Ionicons name="document-text-outline" size={18} color="#4a5568" />
                  <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                </View>
                <Text style={styles.fileSize}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </Text>
                <TouchableOpacity onPress={() => removeNuevoArchivo(index)}>
                  <Ionicons name="close-circle" size={22} color="#e53e3e" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.hint}>Formats: PDF, PNG, JPG, JPEG (max 25MB)</Text>
      </View>

      {/* Observations Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Observations</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="Relevant observations..."
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
          <>
            <Ionicons name="save-outline" size={20} color="#fff" />
            <Text style={styles.submitText}>Save Changes</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          <Ionicons name="shield-checkmark-outline" size={12} color="rgba(0,0,0,0.4)" />
          {' '}INEO v2.0 - Hospital Management System
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f7fafc',
  },
  loadingText: {
    marginTop: 12,
    color: '#718096',
    fontSize: 14,
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 12,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
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
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryCard: {
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
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  summarySubtitle: {
    fontSize: 13,
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
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: '#a0aec0',
    fontSize: 14,
    marginTop: 4,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  fileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileName: {
    flex: 1,
    color: '#2d3748',
    fontSize: 14,
    marginLeft: 8,
  },
  fileSize: {
    fontSize: 12,
    color: '#718096',
    marginHorizontal: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 12,
    color: '#718096',
    marginRight: 6,
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f4fd',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4dabf7',
    borderStyle: 'dashed',
  },
  pickButtonText: {
    color: '#4dabf7',
    fontWeight: '500',
    fontSize: 15,
    marginLeft: 8,
  },
  fileList: {
    marginTop: 12,
  },
  hint: {
    fontSize: 12,
    color: '#a0aec0',
    marginTop: 8,
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#2d3748',
    backgroundColor: '#f7fafc',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 30,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
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