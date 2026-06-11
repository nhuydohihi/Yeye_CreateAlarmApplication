import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false })
});

export default function App() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(new Date(Date.now() + 60000).toTimeString().slice(0, 5));
  const [note, setNote] = useState('');
  const [sound, setSound] = useState(true);
  const [alarms, setAlarms] = useState([]);
  const [isAdding, setIsAdding] = useState(false);

  const activeCount = useMemo(() => alarms.filter((alarm) => alarm.enabled).length, [alarms]);
  const nextEvent = useMemo(() => alarms.filter((alarm) => alarm.enabled).sort((a, b) => a.fireAt - b.fireAt)[0], [alarms]);

  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  const getEventDate = () => {
    const cleanDate = date.trim();
    const cleanTime = time.trim();
    const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(cleanDate);
    const vnMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(cleanDate);
    const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(cleanTime);
    if ((!isoMatch && !vnMatch) || !timeMatch) return null;

    const year = isoMatch ? Number(isoMatch[1]) : Number(vnMatch[3]);
    const month = isoMatch ? Number(isoMatch[2]) : Number(vnMatch[2]);
    const day = isoMatch ? Number(isoMatch[3]) : Number(vnMatch[1]);
    const hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2]);
    if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;

    const eventDate = new Date(year, month - 1, day, hour, minute, 0, 0);
    const isSameDate =
      eventDate.getFullYear() === year &&
      eventDate.getMonth() === month - 1 &&
      eventDate.getDate() === day &&
      eventDate.getHours() === hour &&
      eventDate.getMinutes() === minute;
    return isSameDate ? eventDate : null;
  };

  const scheduleEvent = async () => {
    const eventDate = getEventDate();
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter an event title.');
      return;
    }
    if (!eventDate) {
      Alert.alert('Invalid date/time', 'Use YYYY-MM-DD or DD/MM/YYYY for date, and HH:mm for time. Example: 05/06/2026 and 20:30.');
      return;
    }
    if (eventDate <= new Date()) {
      Alert.alert('Time already passed', 'Please choose a future date and time.');
      return;
    }

    const draftEvent = {
      id: `event-${Date.now()}`,
      title: title.trim(),
      note: note.trim(),
      fireAt: eventDate,
      sound,
      enabled: true
    };

    setAlarms((current) => [draftEvent, ...current]);
    setTitle('');
    setNote('');
    setIsAdding(false);

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title: draftEvent.title, body: draftEvent.note || 'Your event is starting.', sound },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: eventDate
        }
      });
      setAlarms((current) => current.map((item) => item.id === draftEvent.id ? { ...item, id } : item));
    } catch (error) {
      Alert.alert('Event saved', 'The event was added, but notification scheduling failed in Expo Go. Please keep the app open for demo if needed.');
    }
  };

  const cancelAlarm = async (id) => {
    await Notifications.cancelScheduledNotificationAsync(id);
    setAlarms((current) => current.filter((alarm) => alarm.id !== id));
  };

  const toggleAlarm = async (alarm) => {
    if (alarm.enabled) {
      await Notifications.cancelScheduledNotificationAsync(alarm.id);
      setAlarms((current) => current.map((item) => item.id === alarm.id ? { ...item, enabled: false } : item));
    } else {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title: alarm.title, body: alarm.note || 'Your event is starting.', sound: alarm.sound },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 60
        }
      });
      setAlarms((current) => current.map((item) => item.id === alarm.id ? { ...item, id, fireAt: new Date(Date.now() + 60000), enabled: true } : item));
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Part 3 - Exercise 03</Text>
          <Text style={styles.title}>Event Schedule Board</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setIsAdding(true)}>
          <Text style={styles.addText}>New Event</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dashboard}>
        <View style={styles.nextCard}>
          <Text style={styles.panelLabel}>Next Alarm</Text>
          <Text style={styles.nextTitle} numberOfLines={1}>{nextEvent ? nextEvent.title : 'No active event'}</Text>
          <Text style={styles.nextTime}>{nextEvent ? nextEvent.fireAt.toLocaleString() : 'Create an event to schedule a notification.'}</Text>
        </View>
        <View style={styles.stats}>
          <Stat label="Total" value={alarms.length} />
          <Stat label="Active" value={activeCount} />
        </View>
      </View>

      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Timeline</Text>}
        ListEmptyComponent={<Text style={styles.empty}>No events yet. Tap New Event to create one.</Text>}
        renderItem={({ item }) => (
          <View style={styles.eventCard}>
            <View style={[styles.timelineDot, item.enabled && styles.timelineDotOn]} />
            <View style={styles.eventBody}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventTime}>{item.enabled ? item.fireAt.toLocaleString() : 'Paused'}</Text>
              {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
            </View>
            <View style={styles.eventActions}>
              <Switch value={item.enabled} onValueChange={() => toggleAlarm(item)} />
              <TouchableOpacity style={styles.deleteButton} onPress={() => cancelAlarm(item.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={isAdding} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsAdding(false)}>
        <SafeAreaView style={styles.modalScreen}>
          <StatusBar style="light" />
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalKicker}>Schedule Composer</Text>
            <Text style={styles.modalTitle}>Create Event Alarm</Text>

            <View style={styles.form}>
              <Text style={styles.label}>Event title</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Class presentation" placeholderTextColor="#7c8da6" />
              <View style={styles.twoColumns}>
                <View style={styles.field}>
                  <Text style={styles.label}>Date</Text>
                  <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="05/06/2026" placeholderTextColor="#7c8da6" />
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Time</Text>
                  <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="20:30" placeholderTextColor="#7c8da6" />
                </View>
              </View>
              <Text style={styles.label}>Note</Text>
              <TextInput style={[styles.input, styles.noteInput]} value={note} onChangeText={setNote} placeholder="Prepare slides and screenshots" placeholderTextColor="#7c8da6" multiline />
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.label}>Notification sound</Text>
                  <Text style={styles.hint}>Enable sound when the event fires.</Text>
                </View>
                <Switch value={sound} onValueChange={setSound} />
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={scheduleEvent}>
                <Text style={styles.saveText}>Save Event</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAdding(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b1020' },
  header: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  kicker: { color: '#93c5fd', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 27, fontWeight: '900', marginTop: 5, maxWidth: 230 },
  addButton: { minHeight: 42, borderRadius: 8, backgroundColor: '#f59e0b', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  addText: { color: '#111827', fontWeight: '900', fontSize: 14 },
  dashboard: { paddingHorizontal: 18, gap: 10 },
  nextCard: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 16 },
  panelLabel: { color: '#64748b', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  nextTitle: { color: '#111827', fontSize: 22, fontWeight: '900', marginTop: 6 },
  nextTime: { color: '#475569', fontSize: 13, lineHeight: 18, marginTop: 6 },
  stats: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#162033', borderRadius: 8, borderWidth: 1, borderColor: '#26364d', padding: 13 },
  statValue: { color: '#ffffff', fontSize: 24, fontWeight: '900' },
  statLabel: { color: '#9fb0c8', fontSize: 12, fontWeight: '800', marginTop: 4 },
  list: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 34 },
  sectionTitle: { color: '#ffffff', fontSize: 19, fontWeight: '900', marginBottom: 10 },
  empty: { color: '#9fb0c8', fontSize: 14, textAlign: 'center', marginTop: 24 },
  eventCard: { backgroundColor: '#ffffff', borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 10 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#cbd5e1' },
  timelineDotOn: { backgroundColor: '#22c55e' },
  eventBody: { flex: 1 },
  eventTitle: { color: '#111827', fontWeight: '900', fontSize: 16 },
  eventTime: { color: '#64748b', marginTop: 4, fontSize: 13 },
  note: { color: '#475569', fontSize: 13, lineHeight: 18, marginTop: 4 },
  eventActions: { alignItems: 'center', gap: 7 },
  deleteButton: { borderWidth: 1, borderColor: '#f43f5e', borderRadius: 8, paddingHorizontal: 9, minHeight: 34, justifyContent: 'center' },
  deleteText: { color: '#e11d48', fontWeight: '900', fontSize: 12 },
  modalScreen: { flex: 1, backgroundColor: '#0b1020' },
  modalContent: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 34 },
  modalKicker: { color: '#93c5fd', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  modalTitle: { color: '#ffffff', fontSize: 29, fontWeight: '900', marginTop: 6, marginBottom: 14 },
  form: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 16, gap: 10 },
  label: { color: '#111827', fontWeight: '900', fontSize: 14 },
  hint: { color: '#64748b', fontSize: 12, marginTop: 3 },
  input: { minHeight: 46, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, fontSize: 16, color: '#111827', backgroundColor: '#ffffff' },
  noteInput: { minHeight: 92, paddingTop: 12, textAlignVertical: 'top' },
  twoColumns: { flexDirection: 'row', gap: 10 },
  field: { flex: 1, gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  saveButton: { minHeight: 50, borderRadius: 8, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveText: { color: '#ffffff', fontWeight: '900', fontSize: 16 },
  cancelButton: { minHeight: 46, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#111827', fontWeight: '900', fontSize: 15 }
});
