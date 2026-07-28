import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { configStyles as styles } from './ConfigStyles';

export default function ConfigHeader({ title, navigation, onRefresh }) {
  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
      <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backButton}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      {onRefresh ? (
        <TouchableOpacity onPress={onRefresh} style={styles.backButton}>
          <Ionicons name="refresh-outline" size={22} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 42 }} />
      )}
    </LinearGradient>
  );
}
