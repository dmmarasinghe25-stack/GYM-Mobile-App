import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppCard from '../src/components/AppCard';
import AppButton from '../src/components/AppButton';
import { COLORS, SPACING, SIZES } from '../src/constants/theme';
import api from '../src/services/api';

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [time, setTime] = useState(''); // e.g. YYYY-MM-DDTHH:mm

  useFocusEffect(
    useCallback(() => {
      fetchReminders();
    }, [])
  );

  const fetchReminders = async () => {
    try {
      const res = await api.get('/reminders');
      setReminders(res.data);
    } catch (e) { console.log('Error fetching reminders', e); }
  };

  const openAddModal = () => {
    setEditingId(null);
    setTitle('');
    setMessage('');
    // Defaults to current time + 1 hour formatted roughly for input
    const d = new Date();
    d.setHours(d.getHours() + 1);
    setTime(d.toISOString().slice(0, 16));
    setModalVisible(true);
  };

  const openEditModal = (reminder) => {
    setEditingId(reminder._id);
    setTitle(reminder.title);
    setMessage(reminder.message || '');
    setTime(new Date(reminder.time).toISOString().slice(0, 16));
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    Alert.alert('Delete', 'Are you sure you want to delete this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/reminders/${id}`);
            fetchReminders();
          } catch (e) { Alert.alert('Error', 'Failed to delete.'); }
      }}
    ]);
  };

  const handleSave = async () => {
    if (!title || !message || !time) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }
    
    // Ensure time string is parsable
    const parsedTime = new Date(time);
    if (isNaN(parsedTime.getTime())) {
      Alert.alert('Validation Error', 'Invalid date/time format. Please use YYYY-MM-DDTHH:mm');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/reminders/${editingId}`, { title, message, time: parsedTime.toISOString(), type: 'Custom' });
      } else {
        await api.post('/reminders', { title, message, time: parsedTime.toISOString(), type: 'Custom' });
      }
      setModalVisible(false);
      fetchReminders();
    } catch (e) {
      Alert.alert('Error', 'Failed to save reminder.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Reminders</Text>
            <Text style={styles.headerSubtitle}>Set custom notifications and alerts.</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Ionicons name="add" size={24} color={COLORS.background} />
          </TouchableOpacity>
        </View>

        {reminders.length === 0 && (
          <Text style={{color: COLORS.textDim, textAlign: 'center', marginTop: 40}}>You have no custom reminders.</Text>
        )}

        {reminders.map(rem => {
          const isPending = rem.status === 'Pending';
          return (
            <AppCard key={rem._id} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.titleText}>{rem.title}</Text>
                <View style={[styles.badge, isPending ? styles.badgePending : styles.badgeDone]}>
                  <Text style={styles.badgeText}>{rem.status}</Text>
                </View>
              </View>

              <Text style={styles.timeText}>{formatDate(rem.time)}</Text>
              
              <View style={styles.divider} />
              
              <Text style={styles.messageText}>{rem.message}</Text>

              {isPending && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(rem)}>
                    <Ionicons name="pencil" size={16} color={COLORS.primary} />
                    <Text style={[styles.actionText, {color: COLORS.primary}]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(rem._id)}>
                    <Ionicons name="trash" size={16} color={COLORS.error} />
                    <Text style={[styles.actionText, {color: COLORS.error}]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </AppCard>
          )
        })}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Reminder' : 'New Reminder'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.text}/></TouchableOpacity>
            </View>

            <Text style={styles.label}>Reminder Title *</Text>
            <TextInput 
              style={styles.input} 
              value={title} 
              onChangeText={setTitle} 
              placeholder="e.g. Drink Water" 
              placeholderTextColor={COLORS.textDim} 
            />

            <Text style={styles.label}>Message *</Text>
            <TextInput 
              style={[styles.input, {height: 80, textAlignVertical: 'top'}]} 
              value={message} 
              onChangeText={setMessage} 
              placeholder="e.g. Don't forget to drink 2 bottles of water..." 
              placeholderTextColor={COLORS.textDim} 
              multiline
            />

            <Text style={styles.label}>Date & Time (YYYY-MM-DDTHH:mm) *</Text>
            <TextInput 
              style={styles.input} 
              value={time} 
              onChangeText={setTime} 
              placeholder="2026-06-01T14:30" 
              placeholderTextColor={COLORS.textDim} 
            />
            <Text style={{color: COLORS.textDim, fontSize: 11, marginBottom: 20, marginTop: -10}}>
              * Cron engine runs hourly to deliver pending reminders.
            </Text>

            <AppButton title={editingId ? 'Save Changes' : 'Create Reminder'} onPress={handleSave} disabled={loading} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  headerSubtitle: { fontSize: 14, color: COLORS.textDim },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  card: { padding: SPACING.md, marginBottom: SPACING.md },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleText: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  timeText: { fontSize: 14, color: COLORS.primary, marginTop: 4, fontWeight: 'bold' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgePending: { backgroundColor: 'rgba(255, 165, 0, 0.2)' },
  badgeDone: { backgroundColor: 'rgba(57, 255, 20, 0.2)' },
  badgeText: { color: COLORS.text, fontSize: 12, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 12 },
  messageText: { fontSize: 14, color: COLORS.textDim, marginBottom: 15 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 13, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: SIZES.radius, borderTopRightRadius: SIZES.radius, padding: SPACING.lg },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
  label: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', color: COLORS.text, padding: 12, borderRadius: 8, marginBottom: 15 },
});
