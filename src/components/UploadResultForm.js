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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import api from '../services/api';
import { getCache, setCache, CacheKeys, invalidateCachePrefix, removeCache } from '../services/EstudiosCache';

export default function UploadResultForm({ navigation, route }) {
  const { id_examen, tipo } = route.params;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [solicitud, setSolicitud] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [archivos, setArchivos] = useState([]);
  const [error, setError] = useState('');

  // ============================================================
  //  LOAD REQUEST WITH CACHE
  // ============================================================
  useEffect(() => {
    const loadSolicitud = async () => {
      try {
        setLoading(true);
        const cacheKey = CacheKeys.examenInfo(id_examen);
        let data = await getCache(cacheKey);
        if (!data) {
          const response = await api.get(`/exams/${id_examen}/info`);
          data = response.data;
          await setCache(cacheKey, data);
        }
        setSolicitud(data);
        setError('');
      } catch (err) {
        console.error('Error loading request:', err);
        setError('Could not load request information.');
      } finally {
        setLoading(false);
      }
    };
    loadSolicitud();
  }, [id_examen]);

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

      console.log('DocumentPicker result:', JSON.stringify(result, null, 2));

      if (result.canceled || result.type === 'cancel') {
        console.log('Selection cancelled');
        return;
      }

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

      if (selectedFiles.length === 0) {
        Alert.alert('Notice', 'No file obtained. Please try again.');
        return;
      }

      setArchivos(prev => {
        const existingUris = new Set(prev.map(f => f.uri));
        const newFiles = selectedFiles.filter(f => !existingUris.has(f.uri));
        return [...prev, ...newFiles];
      });

    } catch (err) {
      console.error('Error selecting files:', err);
      Alert.alert('Error', 'An error occurred while selecting files. Please try again.');
    }
  };

  const removeFile = (index) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
  };

  // ============================================================
  //  SUBMIT WITH CACHE INVALIDATION
  // ============================================================
  const handleSubmit = async () => {
    if (archivos.length === 0) {
      Alert.alert('Error', 'You must select at least one file.');
      return;
    }

    const MAX_SIZE = 25 * 1024 * 1024;
    for (const file of archivos) {
      if (file.size > MAX_SIZE) {
        Alert.alert('Error', `File "${file.name}" exceeds 25MB.`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      archivos.forEach((file) => {
        formData.append('archivos', {
          uri: file.uri,
          name: file.name,
          type: file.type,
        });
      });

      formData.append('observaciones', observaciones);
      formData.append('type', tipo);

      console.log('Sending files:', archivos.map(f => ({ name: f.name, uri: f.uri, type: f.type })));

      await api.post(`/exams/${id_examen}/results/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        timeout: 60000,
      });

      // Invalidate cache for lists, counts, and exam detail
      await invalidateCachePrefix('estudios_all_');
      await removeCache(CacheKeys.counts);
      await removeCache(CacheKeys.examenInfo(id_examen));

      Alert.alert('Success', 'Results uploaded successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error('Error uploading:', err);
      let msg = 'Error uploading results.';
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
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
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
          <Ionicons name="cloud-upload-outline" size={20} color="#fff" /> Upload Results
        </Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Patient Info Card */}
      <View style={styles.patientCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {solicitud?.paciente ? solicitud.paciente.charAt(0) : 'P'}
          </Text>
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{solicitud?.paciente || '-'}</Text>
          <View style={styles.patientDetails}>
            <Ionicons name="bed-outline" size={14} color="#718096" />
            <Text style={styles.detailText}>Room: {solicitud?.habitacion || '-'}</Text>
          </View>
          <View style={styles.patientDetails}>
            <Ionicons name="flask-outline" size={14} color="#718096" />
            <Text style={styles.detailText}>Studies: {solicitud?.estudios || '-'}</Text>
          </View>
        </View>
      </View>

      {/* File Selection Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Select Files</Text>
        <TouchableOpacity style={styles.pickButton} onPress={pickDocuments}>
          <Ionicons name="attach-outline" size={20} color="#4dabf7" />
          <Text style={styles.pickButtonText}>Choose files</Text>
        </TouchableOpacity>

        {archivos.length > 0 && (
          <View style={styles.fileList}>
            {archivos.map((file, index) => (
              <View key={`${file.uri}_${index}`} style={styles.fileItem}>
                <Ionicons name="document-text-outline" size={18} color="#4a5568" />
                <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                <Text style={styles.fileSize}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </Text>
                <TouchableOpacity onPress={() => removeFile(index)}>
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
          value={observaciones}
          onChangeText={setObservaciones}
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
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
            <Text style={styles.submitText}>Upload Results</Text>
          </>
        )}
      </TouchableOpacity>
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
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  patientCard: {
    flexDirection: 'row',
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
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  patientDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  detailText: {
    fontSize: 13,
    color: '#718096',
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
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
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
});