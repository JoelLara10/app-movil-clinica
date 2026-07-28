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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const { width, height } = Dimensions.get('window');

export default function ViewResultForm({ navigation, route }) {
  const { t } = useLanguage();
  const { id_examen, tipo } = route.params;
  const [loading, setLoading] = useState(true);
  const [archivos, setArchivos] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const baseUrl = api.defaults.baseURL?.replace('/api/v1', '') || 'http://192.168.1.73:5000';

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
        console.error('Error loading files:', err);
        setError(t('studies.couldNotLoadFiles'));
      } finally {
        setLoading(false);
      }
    };
    loadFiles();
  }, [id_examen, tipo, t]);

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
          t('studies.downloadOrShare'),
          t('studies.openFileQuestion'),
          [
            { text: t('studies.cancel'), style: 'cancel' },
            {
              text: t('studies.open'),
              onPress: async () => {
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(downloadedFile.uri);
                } else {
                  Alert.alert(t('studies.error'), t('studies.cannotShare'));
                }
              },
            },
          ]
        );
      } else {
        Alert.alert(t('studies.error'), t('studies.downloadError'));
      }
    } catch (err) {
      console.error('Error downloading:', err);
      Alert.alert(t('studies.error'), t('studies.downloadError'));
    } finally {
      setDownloading(false);
    }
  };

  const renderPreview = () => {
    if (!selectedFile) {
      return (
        <View style={styles.previewPlaceholder}>
          <Ionicons name="document-text-outline" size={64} color="#cbd5e0" />
          <Text style={styles.placeholderText}>{t('studies.selectAFile')}</Text>
          <Text style={styles.placeholderSubtext}>
            {t('studies.tapFileToPreview')}
          </Text>
        </View>
      );
    }

    const ext = selectedFile.tipo;
    const fileUrl = `${baseUrl}${selectedFile.url}`;

    if (ext === 'pdf') {
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
            style={styles.downloadButton}
            onPress={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.downloadText}>{t('studies.downloadPdf')}</Text>
              </>
            )}
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
            onError={() => Alert.alert(t('studies.error'), t('studies.imageLoadError'))}
          />
        </View>
      );
    } else {
      return (
        <View style={styles.previewPlaceholder}>
          <Ionicons name="document-outline" size={48} color="#a0aec0" />
          <Text style={styles.placeholderText}>{t('studies.unsupportedFormat')}</Text>
          <Text style={styles.placeholderSubtext}>
            {t('studies.cannotPreview')}
          </Text>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.downloadText}>{t('studies.downloadFile')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>{t('studies.loadingFiles')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#e53e3e" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>{t('studies.goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          <Ionicons name="eye-outline" size={20} color="#fff" /> {t('studies.viewResults')}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.refreshButton}>
          <Ionicons name="close-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryTitle}>
            {tipo === 'LABORATORIO' ? t('studies.labResults') : t('studies.imagingResults')}
          </Text>
          <Text style={styles.summarySubtitle}>
            {t(archivos.length === 1 ? 'studies.fileAvailable' : 'studies.filesAvailable', { count: archivos.length })}
          </Text>
        </View>
        <View style={styles.statsPill}>
          <Ionicons name="folder-outline" size={16} color="#667eea" />
          <Text style={styles.statsPillText}>{archivos.length}</Text>
        </View>
      </View>

      {/* Main content: list and preview */}
      <View style={styles.mainContainer}>
        <View style={styles.listContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list-outline" size={20} color="#4a5568" />
            <Text style={styles.sectionTitle}>{t('studies.availableFiles')}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{archivos.length}</Text>
            </View>
          </View>
          <ScrollView style={styles.fileList} showsVerticalScrollIndicator={false}>
            {archivos.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={40} color="#cbd5e0" />
                <Text style={styles.emptyText}>{t('studies.noFilesRegistered')}</Text>
              </View>
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
                    {selectedFile?.nombre === file.nombre && (
                      <Ionicons name="checkmark-circle" size={18} color="#48bb78" style={styles.checkIcon} />
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        <View style={styles.previewContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="eye-outline" size={20} color="#4a5568" />
            <Text style={styles.sectionTitle}>{t('studies.preview')}</Text>
          </View>
          <View style={styles.previewBox}>{renderPreview()}</View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          <Ionicons name="shield-checkmark-outline" size={12} color="rgba(0,0,0,0.4)" />
          {' '}{t('studies.hospitalFooter')}
        </Text>
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
  refreshButton: {
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
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
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
    flex: 1,
  },
  badge: {
    backgroundColor: '#e8f4fd',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
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
  checkIcon: {
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    color: '#a0aec0',
    fontSize: 14,
    marginTop: 8,
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
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 16,
    alignSelf: 'center',
    gap: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  downloadText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
