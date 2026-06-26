import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

export default function ViewResultForm({ navigation, route }) {
  const { id_examen, tipo } = route.params;
  const [loading, setLoading] = useState(true);
  const [archivos, setArchivos] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const baseUrl = api.defaults.baseURL?.replace('/api/v1', '') || 'http://192.168.1.78:5000';

  useEffect(() => {
    const loadFiles = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/exams/${id_examen}/files`, {
          params: { type: tipo }
        });
        setArchivos(response.data);
        if (response.data.length > 0) {
          setSelectedFile(response.data[0]);
        }
        setError('');
      } catch (err) {
        console.error('Error cargando archivos:', err);
        setError('No se pudieron cargar los archivos.');
      } finally {
        setLoading(false);
      }
    };
    loadFiles();
  }, [id_examen, tipo]);

  const handleSelectFile = (file) => {
    setSelectedFile(file);
  };

  const handleDownload = async () => {
    if (!selectedFile) return;

    try {
      setDownloading(true);
      const fileUrl = `${baseUrl}${selectedFile.url}`;
      const fileName = selectedFile.nombre;
      const destination = new File(Paths.document, fileName);
      const downloadedFile = await File.downloadFileAsync(fileUrl, destination, {
        idempotent: true,
      });

      if (downloadedFile.exists) {
        Alert.alert(
          'Descargar o Compartir',
          '¿Deseas abrir el archivo?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Abrir',
              onPress: async () => {
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(downloadedFile.uri);
                } else {
                  Alert.alert('Error', 'No se puede compartir en este dispositivo');
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo descargar el archivo.');
      }
    } catch (err) {
      console.error('Error al descargar:', err);
      Alert.alert('Error', 'No se pudo descargar el archivo.');
    } finally {
      setDownloading(false);
    }
  };

  const renderPreview = () => {
    if (!selectedFile) {
      return (
        <View style={styles.previewPlaceholder}>
          <Ionicons name="document-text-outline" size={64} color="#cbd5e0" />
          <Text style={styles.placeholderText}>Selecciona un archivo</Text>
          <Text style={styles.placeholderSubtext}>
            Toca un archivo de la lista para previsualizarlo
          </Text>
        </View>
      );
    }

    const ext = selectedFile.tipo;
    const fileUrl = `${baseUrl}${selectedFile.url}`;

    if (ext === 'pdf') {
      // Vista simplificada: solo icono y nombre
      return (
        <View style={styles.pdfPreviewContainer}>
          <View style={styles.pdfIconWrapper}>
            <Ionicons name="document-text-outline" size={80} color="#667eea" />
          </View>
          <Text style={styles.pdfName} numberOfLines={2}>
            {selectedFile.nombre}
          </Text>
          <View style={styles.pdfTypeBadge}>
            <Text style={styles.pdfTypeText}>PDF</Text>
          </View>
          <TouchableOpacity
            style={styles.downloadPdfButton}
            onPress={handleDownload}
            disabled={downloading}
          >
            <Text style={styles.downloadPdfText}>
              {downloading ? 'Descargando...' : '📥 Descargar PDF'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    } else if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) {
      return (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: fileUrl }}
            style={styles.previewImage}
            resizeMode="contain"
            onError={() => Alert.alert('Error', 'No se pudo cargar la imagen')}
          />
        </View>
      );
    } else {
      return (
        <View style={styles.previewPlaceholder}>
          <Ionicons name="document-outline" size={48} color="#a0aec0" />
          <Text style={styles.placeholderText}>Formato no soportado</Text>
          <Text style={styles.placeholderSubtext}>
            No se puede mostrar vista previa de este tipo de archivo.
          </Text>
          <TouchableOpacity
            style={styles.downloadPdfButton}
            onPress={handleDownload}
            disabled={downloading}
          >
            <Text style={styles.downloadPdfText}>
              {downloading ? 'Descargando...' : '📥 Descargar archivo'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Cargando archivos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#e53e3e" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Regresar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ver Resultados</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <View style={styles.mainContainer}>
        {/* Lista de archivos */}
        <View style={styles.listContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="folder-outline" size={20} color="#4a5568" />
            <Text style={styles.sectionTitle}>Archivos disponibles</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{archivos.length}</Text>
            </View>
          </View>
          <ScrollView style={styles.fileList} showsVerticalScrollIndicator={false}>
            {archivos.length === 0 ? (
              <Text style={styles.emptyText}>No hay archivos registrados.</Text>
            ) : (
              archivos.map((file, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.fileItem,
                    selectedFile?.nombre === file.nombre && styles.fileItemActive,
                  ]}
                  onPress={() => handleSelectFile(file)}
                >
                  <View style={styles.fileItemContent}>
                    <View style={styles.fileIconContainer}>
                      <Text style={styles.fileIcon}>
                        {file.tipo === 'pdf' ? '📄' : '🖼️'}
                      </Text>
                    </View>
                    <Text style={styles.fileName} numberOfLines={2}>
                      {file.nombre}
                    </Text>
                    <View style={styles.fileBadge}>
                      <Text style={styles.fileBadgeText}>{file.tipo.toUpperCase()}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        {/* Vista previa */}
        <View style={styles.previewContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="eye-outline" size={20} color="#4a5568" />
            <Text style={styles.sectionTitle}>Vista previa</Text>
          </View>
          <View style={styles.previewBox}>{renderPreview()}</View>
          {selectedFile && selectedFile.tipo !== 'pdf' && (
            <TouchableOpacity
              style={[styles.downloadButton, downloading && styles.disabledButton]}
              onPress={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={styles.downloadText}>Descargar o Compartir</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
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
    fontSize: 16,
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
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  listContainer: {
    flex: 0.38,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  previewContainer: {
    flex: 0.62,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3748',
    marginLeft: 8,
  },
  badge: {
    backgroundColor: '#e8f4fd',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#4dabf7',
    fontWeight: '600',
  },
  fileList: {
    flex: 1,
  },
  fileItem: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fileItemActive: {
    backgroundColor: '#e8f4fd',
    borderColor: '#4dabf7',
  },
  fileItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#e8f4fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  fileIcon: {
    fontSize: 18,
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    color: '#2d3748',
    fontWeight: '500',
  },
  fileBadge: {
    backgroundColor: '#edf2f7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  fileBadgeText: {
    fontSize: 9,
    color: '#4a5568',
    fontWeight: '600',
  },
  emptyText: {
    color: '#a0aec0',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  previewBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#edf2f7',
  },
  previewPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: '#a0aec0',
    marginTop: 12,
    fontWeight: '500',
  },
  placeholderSubtext: {
    fontSize: 13,
    color: '#cbd5e0',
    marginTop: 4,
    textAlign: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  downloadButton: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  downloadText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  downloadPdfButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
    alignSelf: 'center',
  },
  downloadPdfText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  pdfPreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pdfIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#ebf4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  pdfName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 8,
  },
  pdfTypeBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 12,
  },
  pdfTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a5568',
  },
});