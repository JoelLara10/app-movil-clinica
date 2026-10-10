import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const parseDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day) ? date : null;
};

const toISODate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const monthKey = (date) => date.getFullYear() * 12 + date.getMonth();

export default function DatePickerField({ label, value, onChange, placeholder = 'Selecciona una fecha' }) {
  const [visible, setVisible] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [yearPage, setYearPage] = useState(() => Math.floor(new Date().getFullYear() / 10) * 10);
  const [displayMonth, setDisplayMonth] = useState(() => parseDate(value) || new Date());
  const selected = parseDate(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = useMemo(() => {
    const first = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1);
    const startOffset = (first.getDay() + 6) % 7;
    const count = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0).getDate();
    return Array.from({ length: 42 }, (_, index) => {
      const day = index - startOffset + 1;
      return day > 0 && day <= count ? day : null;
    });
  }, [displayMonth]);

  const years = useMemo(() => Array.from({ length: 10 }, (_, index) => yearPage + index), [yearPage]);
  const maxYearPage = Math.floor(today.getFullYear() / 10) * 10;

  const shiftMonth = (amount) => setDisplayMonth((current) => (
    new Date(current.getFullYear(), current.getMonth() + amount, 1)
  ));
  const open = () => {
    const initialDate = selected || new Date();
    setDisplayMonth(initialDate);
    setYearPage(Math.floor(initialDate.getFullYear() / 10) * 10);
    setShowYearPicker(false);
    setVisible(true);
  };
  const openYearPicker = () => {
    setYearPage(Math.floor(displayMonth.getFullYear() / 10) * 10);
    setShowYearPicker(true);
  };
  const selectYear = (year) => {
    if (year > today.getFullYear()) return;
    setDisplayMonth((current) => new Date(year, current.getMonth(), 1));
    setShowYearPicker(false);
  };
  const selectDay = (day) => {
    const next = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
    if (next > today) return;
    onChange(toISODate(next));
    setVisible(false);
  };

  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label || 'Seleccionar fecha'}
        onPress={open}
        style={styles.input}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>
          {selected ? selected.toLocaleDateString('es-MX') : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={19} color="#667eea" />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={styles.dialog} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.title}>Fecha de nacimiento</Text>
            {showYearPicker ? (
              <>
                <View style={styles.monthBar}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Década anterior"
                    disabled={yearPage <= 1900}
                    onPress={() => setYearPage((current) => Math.max(1900, current - 10))}
                    style={styles.monthButton}
                  >
                    <Ionicons name="chevron-back" size={20} color="#4a5568" />
                  </TouchableOpacity>
                  <Text style={styles.monthText}>{yearPage}–{Math.min(yearPage + 9, today.getFullYear())}</Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Década siguiente"
                    disabled={yearPage >= maxYearPage}
                    onPress={() => setYearPage((current) => Math.min(maxYearPage, current + 10))}
                    style={styles.monthButton}
                  >
                    <Ionicons name="chevron-forward" size={20} color="#4a5568" />
                  </TouchableOpacity>
                </View>
                <View style={styles.yearGrid}>
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      accessibilityRole="button"
                      accessibilityLabel={String(year)}
                      disabled={year > today.getFullYear()}
                      onPress={() => selectYear(year)}
                      style={[
                        styles.yearCell,
                        year === displayMonth.getFullYear() && styles.selectedDay,
                        year > today.getFullYear() && styles.disabledYear,
                      ]}
                    >
                      <Text style={[
                        styles.yearText,
                        year === displayMonth.getFullYear() && styles.selectedDayText,
                        year > today.getFullYear() && styles.disabledDayText,
                      ]}>{year}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <>
                <View style={styles.monthBar}>
                  <TouchableOpacity accessibilityLabel="Mes anterior" onPress={() => shiftMonth(-1)} style={styles.monthButton}>
                    <Ionicons name="chevron-back" size={20} color="#4a5568" />
                  </TouchableOpacity>
                  <View style={styles.monthHeading}>
                    <Text style={styles.monthText}>{MONTHS[displayMonth.getMonth()]}</Text>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Elegir año"
                      onPress={openYearPicker}
                      style={styles.yearButton}
                    >
                      <Text style={styles.yearButtonText}>{displayMonth.getFullYear()}</Text>
                      <Ionicons name="chevron-down" size={14} color="#667eea" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    accessibilityLabel="Mes siguiente"
                    disabled={monthKey(displayMonth) >= monthKey(today)}
                    onPress={() => shiftMonth(1)}
                    style={styles.monthButton}
                  >
                    <Ionicons name="chevron-forward" size={20} color="#4a5568" />
                  </TouchableOpacity>
                </View>
                <View style={styles.grid}>
                  {WEEKDAYS.map((day, index) => (
                    <Text key={`${day}-${index}`} style={[styles.dayCell, styles.weekday]}>{day}</Text>
                  ))}
                  {days.map((day, index) => {
                    if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
                    const candidate = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
                    const isSelected = selected && toISODate(candidate) === value;
                    const isFuture = candidate > today;
                    return (
                      <TouchableOpacity
                        key={toISODate(candidate)}
                        accessibilityRole="button"
                        accessibilityLabel={toISODate(candidate)}
                        disabled={isFuture}
                        onPress={() => selectDay(day)}
                        style={[styles.dayCell, isSelected && styles.selectedDay]}
                      >
                        <Text style={[
                          styles.dayText,
                          isSelected && styles.selectedDayText,
                          isFuture && styles.disabledDayText,
                        ]}>{day}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
            <TouchableOpacity onPress={() => setVisible(false)} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 12 },
  label: { color: '#4a5568', fontWeight: '700', fontSize: 13, marginBottom: 6 },
  input: {
    minHeight: 46, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e0',
    backgroundColor: '#fff', paddingHorizontal: 12, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  value: { color: '#2d3748', fontSize: 15 },
  placeholder: { color: '#a0aec0' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.48)', justifyContent: 'center', padding: 20 },
  dialog: { backgroundColor: '#fff', borderRadius: 18, padding: 18, maxWidth: 380, width: '100%', alignSelf: 'center' },
  title: { color: '#2d3748', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 8 },
  monthHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  yearButton: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 5, paddingVertical: 6, borderRadius: 8, backgroundColor: '#eef2ff' },
  yearButtonText: { color: '#4c51bf', fontSize: 15, fontWeight: '800' },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 10 },
  yearCell: { width: '25%', minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  yearText: { color: '#2d3748', fontSize: 15, fontWeight: '700' },
  disabledYear: { opacity: 0.35 },
  monthButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  monthText: { color: '#2d3748', fontSize: 15, fontWeight: '800', textTransform: 'capitalize' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.2857%', height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  weekday: { color: '#718096', fontWeight: '800' },
  dayText: { color: '#2d3748', fontSize: 14 },
  selectedDay: { backgroundColor: '#667eea' },
  selectedDayText: { color: '#fff', fontWeight: '800' },
  disabledDayText: { color: '#cbd5e0' },
  cancelButton: { minHeight: 42, marginTop: 10, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#667eea', fontWeight: '800' },
});
