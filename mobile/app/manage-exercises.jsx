import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Alert, Modal, TextInput, Image } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppCard from '../src/components/AppCard';
import AppButton from '../src/components/AppButton';
import { COLORS, SPACING, SIZES } from '../src/constants/theme';
import api from '../src/services/api';

export default function ManageExercises() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [targetMuscleGroup, setTargetMuscleGroup] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [description, setDescription] = useState('');
  const [mediaUrls, setMediaUrls] = useState(''); // Comma separated string for simplicity in UI

  useFocusEffect(
    useCallback(() => {
      fetchExercises();
    }, [])
  );

  const fetchExercises = async () => {
    try {
      const res = await api.get('/workouts/exercises');
      setExercises(res.data);
    } catch (e) { console.log('Error fetching exercises', e); }
  };

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setTargetMuscleGroup('');
    setDifficulty('Beginner');
    setDescription('');
    setMediaUrls('');
    setModalVisible(true);
  };

  const openEditModal = (ex) => {
    setEditingId(ex._id);
    setName(ex.name);
    setTargetMuscleGroup(ex.targetMuscleGroup);
    setDifficulty(ex.difficulty || 'Beginner');
    setDescription(ex.description || '');
    setMediaUrls(ex.mediaUrls ? ex.mediaUrls.join(', ') : '');
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    Alert.alert('Delete', 'Are you sure you want to delete this exercise?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/workouts/exercises/${id}`);
            fetchExercises();
          } catch (e) { Alert.alert('Error', 'Failed to delete.'); }
      }}
    ]);
  };

  const handleSave = async () => {
    if (!name || !targetMuscleGroup) {
      Alert.alert('Validation Error', 'Name and Target Muscle Group are required.');
      return;
    }
    
    // Process mediaUrls string to array
    const mediaArray = mediaUrls.split(',').map(url => url.trim()).filter(url => url.length > 0);

    setLoading(true);
    try {
      const payload = { 
        name, 
        targetMuscleGroup, 
        difficulty, 
        description, 
        mediaUrls: mediaArray 
      };

      if (editingId) {
        await api.put(`/workouts/exercises/${editingId}`, payload);
      } else {
        await api.post('/workouts/exercises', payload);
      }
      setModalVisible(false);
      fetchExercises();
    } catch (e) {
      Alert.alert('Error', 'Failed to save exercise.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Workout Library</Text>
            <Text style={styles.headerSubtitle}>Manage your exercise database.</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Ionicons name="add" size={24} color={COLORS.background} />
          </TouchableOpacity>
        </View>

        {exercises.map(ex => (
          <AppCard key={ex._id} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.nameText}>{ex.name}</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>{ex.difficulty || 'Beginner'}</Text></View>
            </View>

            <Text style={styles.targetText}>Target: {ex.targetMuscleGroup}</Text>
            
            {ex.description ? (
              <Text style={styles.descText}>{ex.description}</Text>
            ) : null}

            {ex.mediaUrls && ex.mediaUrls.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
                {ex.mediaUrls.map((url, idx) => (
                  <View key={idx} style={styles.mediaContainer}>
                    <Image source={{uri: url}} style={styles.mediaImage} />
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(ex)}>
                <Ionicons name="pencil" size={16} color={COLORS.primary} />
                <Text style={[styles.actionText, {color: COLORS.primary}]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(ex._id)}>
                <Ionicons name="trash" size={16} color={COLORS.error} />
                <Text style={[styles.actionText, {color: COLORS.error}]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </AppCard>
        ))}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Exercise' : 'New Exercise'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.text}/></TouchableOpacity>
            </View>

            <ScrollView style={{maxHeight: '80%'}}>
              <Text style={styles.label}>Exercise Name *</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Barbell Squat" placeholderTextColor={COLORS.textDim} />

              <Text style={styles.label}>Target Muscle Group *</Text>
              <TextInput style={styles.input} value={targetMuscleGroup} onChangeText={setTargetMuscleGroup} placeholder="e.g. Legs, Quads" placeholderTextColor={COLORS.textDim} />

              <Text style={styles.label}>Difficulty</Text>
              <View style={styles.rowBtnContainer}>
                {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                  <TouchableOpacity key={lvl} style={[styles.diffBtn, difficulty === lvl && styles.diffBtnActive]} onPress={() => setDifficulty(lvl)}>
                    <Text style={[styles.diffText, difficulty === lvl && styles.diffTextActive]}>{lvl}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Description</Text>
              <TextInput 
                style={[styles.input, {height: 80, textAlignVertical: 'top'}]} 
                value={description} 
                onChangeText={setDescription} 
                placeholder="How to perform this exercise..." 
                placeholderTextColor={COLORS.textDim} 
                multiline
              />

              <Text style={styles.label}>Media URLs (Comma separated)</Text>
              <TextInput 
                style={[styles.input, {height: 80, textAlignVertical: 'top'}]} 
                value={mediaUrls} 
                onChangeText={setMediaUrls} 
                placeholder="https://example.com/squat1.jpg, https://example.com/squat2.jpg" 
                placeholderTextColor={COLORS.textDim} 
                multiline
              />
            </ScrollView>

            <AppButton title={editingId ? 'Save Changes' : 'Create Exercise'} onPress={handleSave} disabled={loading} style={{marginTop: 15}}/>
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
  nameText: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  targetText: { fontSize: 14, color: COLORS.primary, marginTop: 4, fontWeight: 'bold' },
  descText: { fontSize: 13, color: COLORS.textDim, marginTop: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(57, 255, 20, 0.2)' },
  badgeText: { color: COLORS.text, fontSize: 12, fontWeight: 'bold' },
  gallery: { flexDirection: 'row', marginTop: 15 },
  mediaContainer: { width: 100, height: 100, borderRadius: 8, overflow: 'hidden', marginRight: 10, backgroundColor: COLORS.border },
  mediaImage: { width: '100%', height: '100%' },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 15 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 13, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: SIZES.radius, borderTopRightRadius: SIZES.radius, padding: SPACING.lg },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
  label: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', color: COLORS.text, padding: 12, borderRadius: 8, marginBottom: 15 },
  rowBtnContainer: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  diffBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  diffBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  diffText: { color: COLORS.textDim, fontSize: 12, fontWeight: 'bold' },
  diffTextActive: { color: COLORS.background },
});
