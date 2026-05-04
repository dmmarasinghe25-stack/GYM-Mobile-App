import { View, ScrollView, StyleSheet, Text, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../src/components/AppButton';
import { COLORS, SPACING, SIZES } from '../src/constants/theme';
import api from '../src/services/api';

export default function CreatePlan() {
  const router = useRouter();
  const { memberId, planId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [allExercises, setAllExercises] = useState([]);
  
  // Plan State
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [notes, setNotes] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState('Beginner');
  const [days, setDays] = useState([{ dayName: 'Day 1', exercises: [] }]);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [activeDayIndex, setActiveDayIndex] = useState(null);

  useEffect(() => {
    fetchExercises();
    if (planId) fetchPlanData();
  }, [planId]);

  const fetchExercises = async () => {
    try {
      const res = await api.get('/workouts/exercises');
      setAllExercises(res.data);
    } catch (e) { console.log('Error fetching exercises'); }
  };

  const fetchPlanData = async () => {
    try {
      const res = await api.get('/workouts/plans');
      const planToEdit = res.data.find(p => p._id === planId);
      if (planToEdit) {
        setTitle(planToEdit.title);
        setGoal(planToEdit.goal || '');
        setNotes(planToEdit.notes || '');
        setFitnessLevel(planToEdit.fitnessLevel || 'Beginner');
        const formattedDays = planToEdit.days.map(d => ({
          dayName: d.dayName,
          exercises: d.exercises.map(ex => ex._id)
        }));
        if (formattedDays.length > 0) setDays(formattedDays);
      }
    } catch (e) { console.log('Error fetching plan data', e); }
  };

  const addDay = () => {
    setDays([...days, { dayName: `Day ${days.length + 1}`, exercises: [] }]);
  };

  const removeDay = (index) => {
    setDays(days.filter((_, i) => i !== index));
  };

  const openExerciseSelector = (dayIndex) => {
    setActiveDayIndex(dayIndex);
    setModalVisible(true);
  };

  const toggleExerciseSelection = (exerciseId) => {
    setDays(prev => {
      const newDays = [...prev];
      const day = newDays[activeDayIndex];
      if (day.exercises.includes(exerciseId)) {
        day.exercises = day.exercises.filter(id => id !== exerciseId);
      } else {
        day.exercises.push(exerciseId);
      }
      return newDays;
    });
  };

  const handleSave = async () => {
    if (!title) {
      Alert.alert('Validation Error', 'Plan title is required.');
      return;
    }
    if (days.length === 0 || days.every(d => d.exercises.length === 0)) {
      Alert.alert('Validation Error', 'Please add at least one exercise to your plan.');
      return;
    }

    setLoading(true);
    try {
      const payload = { title, goal, notes, fitnessLevel, days };
      if (memberId) payload.member = memberId;

      if (planId) {
        await api.put(`/workouts/plans/${planId}`, payload);
        Alert.alert('Success', 'Workout plan updated successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        const res = await api.post('/workouts/plans', payload);
        if (memberId) {
          // Auto assign the personalized plan to the member
          await api.post('/workouts/assign', { workoutPlanId: res.data._id, memberId });
        }
        Alert.alert('Success', memberId ? 'Personalized plan assigned successfully!' : 'Workout plan created successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>{planId ? 'Edit Plan' : memberId ? 'Personalized Plan' : 'Create Template'}</Text>
        <Text style={styles.headerSubtitle}>
          {planId ? 'Update this routine' : memberId ? 'Design a routine specifically for a member' : 'Design a reusable routine template'}
        </Text>

        <Text style={styles.label}>Plan Title *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. 4-Week Hypertrophy" placeholderTextColor={COLORS.textDim} />

        <Text style={styles.label}>Primary Goal</Text>
        <TextInput style={styles.input} value={goal} onChangeText={setGoal} placeholder="e.g. Muscle Gain" placeholderTextColor={COLORS.textDim} />

        <Text style={styles.label}>Coach Notes & Instructions</Text>
        <TextInput 
          style={[styles.input, {height: 80, textAlignVertical: 'top'}]} 
          value={notes} 
          onChangeText={setNotes} 
          placeholder="e.g. Focus on mind-muscle connection..." 
          placeholderTextColor={COLORS.textDim} 
          multiline
        />

        <Text style={styles.label}>Fitness Level</Text>
        <View style={styles.rowBtnContainer}>
          {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
            <TouchableOpacity key={lvl} style={[styles.diffBtn, fitnessLevel === lvl && styles.diffBtnActive]} onPress={() => setFitnessLevel(lvl)}>
              <Text style={[styles.diffText, fitnessLevel === lvl && styles.diffTextActive]}>{lvl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.rowBetween}>
          <Text style={styles.label}>Schedule</Text>
          <TouchableOpacity onPress={addDay}>
            <Text style={{color: COLORS.primary, fontWeight: 'bold'}}>+ Add Day</Text>
          </TouchableOpacity>
        </View>

        {days.map((day, index) => (
          <View key={index} style={styles.dayCard}>
            <View style={styles.rowBetween}>
              <TextInput 
                style={styles.dayInput} 
                value={day.dayName} 
                onChangeText={(text) => {
                  const newDays = [...days];
                  newDays[index].dayName = text;
                  setDays(newDays);
                }} 
              />
              <TouchableOpacity onPress={() => removeDay(index)}>
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>

            {day.exercises.map(exId => {
              const ex = allExercises.find(e => e._id === exId);
              if (!ex) return null;
              return (
                <View key={exId} style={styles.exRow}>
                  <Text style={styles.exName}>{ex.name}</Text>
                  <Text style={styles.exTarget}>{ex.targetMuscleGroup}</Text>
                </View>
              );
            })}

            <TouchableOpacity style={styles.addExBtn} onPress={() => openExerciseSelector(index)}>
              <Text style={styles.addExText}>+ Select Exercises</Text>
            </TouchableOpacity>
          </View>
        ))}

        <AppButton title={planId ? "Update Plan" : "Save Plan"} onPress={handleSave} disabled={loading} style={{marginTop: SPACING.xl}} />
      </ScrollView>

      {/* Exercise Selection Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Select Exercises</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.text}/></TouchableOpacity>
            </View>

            <ScrollView>
              {allExercises.map(ex => {
                const isSelected = activeDayIndex !== null && days[activeDayIndex]?.exercises.includes(ex._id);
                return (
                  <TouchableOpacity 
                    key={ex._id} 
                    style={[styles.exSelectRow, isSelected && styles.exSelectRowActive]}
                    onPress={() => toggleExerciseSelection(ex._id)}
                  >
                    <View style={{flex: 1}}>
                      <Text style={[styles.exSelectName, isSelected && {color: COLORS.primary}]}>{ex.name}</Text>
                      <Text style={styles.exSelectTarget}>{ex.targetMuscleGroup} • {ex.difficulty}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <AppButton title="Done" onPress={() => setModalVisible(false)} style={{marginTop: SPACING.md}} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  headerSubtitle: { fontSize: 14, color: COLORS.textDim, marginBottom: SPACING.xl },
  label: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 5 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', color: COLORS.text, padding: 12, borderRadius: 8, marginBottom: 15 },
  rowBtnContainer: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  diffBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  diffBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  diffText: { color: COLORS.textDim, fontSize: 12, fontWeight: 'bold' },
  diffTextActive: { color: COLORS.background },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dayCard: { backgroundColor: COLORS.card, padding: SPACING.md, borderRadius: SIZES.radius, marginBottom: SPACING.md },
  dayInput: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: COLORS.border, width: '80%', paddingBottom: 4 },
  addExBtn: { marginTop: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, alignItems: 'center' },
  addExText: { color: COLORS.primary, fontWeight: '600' },
  exRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  exName: { color: COLORS.text, fontSize: 14 },
  exTarget: { color: COLORS.textDim, fontSize: 12 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: SIZES.radius, borderTopRightRadius: SIZES.radius, padding: SPACING.lg, height: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  exSelectRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  exSelectRowActive: { backgroundColor: 'rgba(57, 255, 20, 0.05)' },
  exSelectName: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  exSelectTarget: { color: COLORS.textDim, fontSize: 12, marginTop: 4 },
});
