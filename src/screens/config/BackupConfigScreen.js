import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfigHeader from './ConfigHeader';
import { configStyles as styles } from './ConfigStyles';
import configurationService from '../../services/configurationService';
import CacheService from '../../services/cacheService';
import { useLanguage } from '../../context/LanguageContext';

const CACHE_KEY = 'config_backups';
const CACHE_TTL = 2 * 60 * 1000;
const ITEMS_PER_PAGE = 6;

const FORMAT_COLORS = { json: '#667eea', csv: '#38a169', xlsx: '#ed8936', pdf: '#e53e3e' };
const TYPE_COLORS = { completa: '#667eea', incremental: '#38b2ac', diferencial: '#ed8936', full: '#667eea' };

const getTotalPages = (data) => Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));
const getPagedData = (data, page) => data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
const formatBytes = (bytes = 0) => bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;

const Choice = ({ value, label, current, onPress }) => (
  <TouchableOpacity style={[styles.optionChip, current === value && styles.optionChipActive]} onPress={() => onPress(value)}>
    <Text style={[styles.optionText, current === value && styles.optionTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const FilterChip = ({ value, label, active, onPress, color }) => (
  <TouchableOpacity style={[styles.optionChip, active && { borderColor: color, backgroundColor: color + '18' }]} onPress={() => onPress(value)}>
    <Text style={[styles.optionText, active && { color }]}>{label}</Text>
  </TouchableOpacity>
);

export default function BackupConfigScreen({ navigation }) {
  const { t } = useLanguage();
  const [backups, setBackups] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selected, setSelected] = useState([]);
  const [type, setType] = useState('completa');
  const [format, setFormat] = useState('json');
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [filterFormat, setFilterFormat] = useState('todos');
  const [filterType, setFilterType] = useState('todos');
  const [page, setPage] = useState(1);

  const load = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      if (!forceRefresh) {
        const cached = await CacheService.get(CACHE_KEY);
        if (cached) {
          setBackups(cached.backups); setCollections(cached.collections);
          setSelected((old) => old.length ? old.filter((n) => cached.collections.includes(n)) : cached.collections);
          setHealth(cached.health); setLoading(false); return;
        }
      }
      const [list, names, status] = await Promise.all([
        configurationService.backups.list(),
        configurationService.backups.collections(),
        configurationService.backups.health(),
      ]);
      const backupList = Array.isArray(list) ? list : [];
      const collectionList = Array.isArray(names) ? names : [];
      await CacheService.set(CACHE_KEY, { backups: backupList, collections: collectionList, health: status }, CACHE_TTL);
      setBackups(backupList); setCollections(collectionList);
      setSelected((old) => old.length ? old.filter((n) => collectionList.includes(n)) : collectionList);
      setHealth(status);
    } catch (error) {
      const cached = await CacheService.get(CACHE_KEY);
      if (cached) { setBackups(cached.backups); setCollections(cached.collections); setHealth(cached.health); setMessage(t('config.noConnection')); }
      else setMessage(error.response?.data?.error || t('config.backupLoadError'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); setPage(1);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const toggle = (name) => setSelected((old) => old.includes(name) ? old.filter((item) => item !== name) : [...old, name]);

  const create = async () => {
    if (!selected.length) return Alert.alert(t('config.backupMissingCollections'), t('config.backupMissingCollectionsMsg'));
    setLoading(true); setMessage(t('config.backupCreating'));
    try {
      const result = await configurationService.backups.create({ tipo: type, formato: format, colecciones: selected });
      setMessage(result.message); await load(true);
    } catch (error) { setMessage(error.response?.data?.error || error.message || t('config.backupSaveError')); }
    finally { setLoading(false); }
  };

  const restore = (backup) => Alert.alert(t('config.backupRestoreTitle'), `${t('config.backupRestoreMsg')} ${backup.filename}?`, [
    { text: t('config.cancel'), style: 'cancel' },
    { text: t('config.backupRestore'), style: 'destructive', onPress: async () => {
      setLoading(true); setMessage(t('config.backupRestoring'));
      try {
        const result = await configurationService.backups.restore(backup.filename);
        const names = Array.isArray(result.collections) ? result.collections.join(', ') : '';
        setMessage(`${result.message}${names ? `. Collections: ${names}` : ''}`);
      } catch (error) { setMessage(error.response?.data?.error || error.message || t('config.backupRestoreError')); }
      finally { setLoading(false); }
    }},
  ]);

  const remove = (backup) => Alert.alert(t('config.backupDeleteTitle'), `${t('config.backupDeleteMsg')} ${backup.filename}?`, [
    { text: t('config.cancel'), style: 'cancel' },
    { text: t('config.delete'), style: 'destructive', onPress: async () => {
      try { await configurationService.backups.remove(backup.filename); setMessage(t('config.backupDeleted')); await load(true); }
      catch (error) { setMessage(error.response?.data?.error || t('config.backupDeleteError')); }
    }},
  ]);

  const resetFilters = () => { setSearch(''); setFilterFormat('todos'); setFilterType('todos'); setPage(1); };

  const filtered = useMemo(() => {
    let result = backups;
    if (filterFormat !== 'todos') result = result.filter((b) => b.format?.toLowerCase() === filterFormat);
    if (filterType !== 'todos') result = result.filter((b) => b.type?.toLowerCase() === filterType);
    if (search.trim()) { const q = search.trim().toLowerCase(); result = result.filter((b) => b.filename?.toLowerCase().includes(q)); }
    return result;
  }, [backups, filterFormat, filterType, search]);

  const paged = useMemo(() => getPagedData(filtered, page), [filtered, page]);
  const totalPages = getTotalPages(filtered);
  const hasActiveFilters = filterFormat !== 'todos' || filterType !== 'todos' || search.trim();

  const availableFormats = useMemo(() => [...new Set(backups.map((b) => b.format?.toLowerCase()).filter(Boolean))], [backups]);
  const availableTypes = useMemo(() => [...new Set(backups.map((b) => b.type?.toLowerCase()).filter(Boolean))], [backups]);

  const typeLabels = {
    completa: t('config.backupFull'),
    incremental: t('config.backupIncremental'),
    diferencial: t('config.backupDifferential'),
    full: t('config.backupFull'),
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <ConfigHeader title={t('config.backupsTitle')} navigation={navigation} onRefresh={onRefresh} />
      <View style={styles.content}>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>MongoDB</Text>
          <Text style={styles.cardSubtitle}>{health?.message || t('config.backupVerifying')}</Text>
        </View>

        <Text style={styles.label}>{t('config.backupType')}</Text>
        <View style={styles.wrapRow}>
          <Choice value="completa" label={t('config.backupFull')} current={type} onPress={setType} />
          <Choice value="incremental" label={t('config.backupIncremental')} current={type} onPress={setType} />
          <Choice value="diferencial" label={t('config.backupDifferential')} current={type} onPress={setType} />
        </View>

        <Text style={styles.label}>{t('config.backupFormat')}</Text>
        <View style={styles.wrapRow}>
          {[['json', 'JSON'], ['csv', 'CSV (ZIP)'], ['xlsx', 'Excel'], ['pdf', 'PDF']].map(([v, l]) => (
            <Choice key={v} value={v} label={l} current={format} onPress={setFormat} />
          ))}
        </View>

        <Text style={styles.cardSubtitle}>
          {type === 'completa' ? t('config.backupDescFull') : type === 'incremental' ? t('config.backupDescIncremental') : t('config.backupDescDifferential')}
          {format === 'pdf' ? t('config.backupDescPdf') : ''}
        </Text>

        <View style={styles.between}>
          <Text style={styles.sectionTitle}>{t('config.backupCollections')} ({selected.length}/{collections.length})</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setSelected(selected.length === collections.length ? [] : collections)}>
            <Text style={styles.secondaryText}>{selected.length === collections.length ? t('config.backupNone') : t('config.backupAll')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.wrapRow}>
          {collections.map((name) => (
            <Choice key={name} value={name} label={name} current={selected.includes(name) ? name : ''} onPress={() => toggle(name)} />
          ))}
        </View>

        <TouchableOpacity disabled={loading} style={[styles.primaryButton, loading && styles.disabled]} onPress={create}>
          <Text style={styles.primaryText}>{loading ? t('config.backupProcessing') : t('config.backupCreate')}</Text>
        </TouchableOpacity>

        {!!message && <View style={styles.messageBox}><Text style={styles.messageText}>{message}</Text></View>}

        {/* Lista */}
        <View style={[styles.between, { marginTop: 20, marginBottom: 8 }]}>
          <Text style={styles.sectionTitle}>{t('config.backupAvailable')} ({filtered.length})</Text>
          {hasActiveFilters && (
            <TouchableOpacity style={styles.secondaryButton} onPress={resetFilters}>
              <Text style={styles.secondaryText}>{t('config.backupClearFilters')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TextInput style={styles.searchInput} value={search} onChangeText={(v) => { setSearch(v); setPage(1); }} placeholder={t('config.backupSearchPlaceholder')} />

        {availableFormats.length > 0 && (
          <>
            <Text style={styles.label}>{t('config.backupFilterFormat')}</Text>
            <View style={styles.wrapRow}>
              <FilterChip value="todos" label={t('config.backupFilterAll')} active={filterFormat === 'todos'} onPress={(v) => { setFilterFormat(v); setPage(1); }} color="#667eea" />
              {availableFormats.map((f) => (
                <FilterChip key={f} value={f} label={f.toUpperCase()} active={filterFormat === f} onPress={(v) => { setFilterFormat(v); setPage(1); }} color={FORMAT_COLORS[f] || '#667eea'} />
              ))}
            </View>
          </>
        )}

        {availableTypes.length > 0 && (
          <>
            <Text style={styles.label}>{t('config.backupFilterType')}</Text>
            <View style={styles.wrapRow}>
              <FilterChip value="todos" label={t('config.backupFilterAll')} active={filterType === 'todos'} onPress={(v) => { setFilterType(v); setPage(1); }} color="#667eea" />
              {availableTypes.map((tp) => (
                <FilterChip key={tp} value={tp} label={typeLabels[tp] || tp} active={filterType === tp} onPress={(v) => { setFilterType(v); setPage(1); }} color={TYPE_COLORS[tp] || '#667eea'} />
              ))}
            </View>
          </>
        )}

        {paged.map((backup) => {
          const fmtColor = FORMAT_COLORS[backup.format?.toLowerCase()] || '#667eea';
          const tpColor = TYPE_COLORS[backup.type?.toLowerCase()] || '#667eea';
          return (
            <View key={backup.filename} style={styles.card}>
              <Text style={styles.cardTitle}>{backup.filename}</Text>
              <Text style={styles.cardSubtitle}>{new Date(backup.date).toLocaleString()} · {formatBytes(backup.size)}</Text>
              <View style={styles.wrapRow}>
                {backup.format && <View style={[styles.badge, { backgroundColor: fmtColor + '18' }]}><Text style={[styles.badgeText, { color: fmtColor }]}>{backup.format.toUpperCase()}</Text></View>}
                {backup.type && <View style={[styles.badge, { backgroundColor: tpColor + '18' }]}><Text style={[styles.badgeText, { color: tpColor }]}>{(typeLabels[backup.type?.toLowerCase()] || backup.type).toUpperCase()}</Text></View>}
              </View>
              <View style={styles.wrapRow}>
                <TouchableOpacity style={styles.secondaryButton} onPress={async () => {
                  try { await configurationService.backups.download(backup.filename); }
                  catch (error) { setMessage(error.message || t('config.backupDownloadError')); }
                }}>
                  <Text style={styles.secondaryText}>{t('config.backupDownload')}</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={!backup.restorable || loading} style={[styles.secondaryButton, (!backup.restorable || loading) && styles.disabled]} onPress={() => restore(backup)}>
                  <Text style={styles.secondaryText}>{t('config.backupRestore')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dangerButton} onPress={() => remove(backup)}>
                  <Text style={styles.dangerText}>{t('config.delete')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {!loading && !filtered.length && (
          <Text style={styles.emptyText}>{hasActiveFilters ? t('config.backupNoResults') : t('config.backupNoCollections')}</Text>
        )}

        {totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity style={styles.secondaryButton} disabled={page === 1} onPress={() => setPage(page - 1)}><Text style={styles.secondaryText}>‹</Text></TouchableOpacity>
            <Text style={styles.pageText}>{page} / {totalPages}</Text>
            <TouchableOpacity style={styles.secondaryButton} disabled={page === totalPages} onPress={() => setPage(page + 1)}><Text style={styles.secondaryText}>›</Text></TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
