import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Alert, Modal, Image } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppCard from '../src/components/AppCard';
import AppButton from '../src/components/AppButton';
import { COLORS, SPACING, SIZES } from '../src/constants/theme';
import api from '../src/services/api';

export default function Workouts() {
  const [assigned, setAssigned] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);

  // Auto-schedule form state
  const [fitnessLevel, setFitnessLevel] = useState('Beginner');
  const [availableDays, setAvailableDays] = useState(['Monday', 'Wednesday', 'Friday']);
  const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  const fetchWorkouts = async () => {
    try {
      const res = await api.get('/workouts/assigned');
      setAssigned(res.data);
    } catch (e) { console.log('Error fetching assigned workouts', e); }
  };

  const toggleDay = (day) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter(d => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const generateAutoSchedule = async () => {
    if (availableDays.length === 0) {
      Alert.alert('Error', 'Please select at least one available day.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/workouts/auto-schedule', { availableDays, fitnessLevel });
      setScheduleModalVisible(false);
      fetchWorkouts();
      Alert.alert('Success', 'Your 4-week schedule has been generated!');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to generate schedule.');
    } finally {
      setLoading(false);
    }
  };

  const markDayCompleted = async (assignedWorkoutId, scheduleId) => {
    setLoading(true);
    try {
      await api.put('/workouts/progress', { assignedWorkoutId, scheduleId });
      Alert.alert('Great job!', 'Workout marked as completed.');
      fetchWorkouts();
    } catch (e) {
      Alert.alert('Error', 'Failed to update progress.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date cleanly
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('en-US', { weekday: 'short' })}, ${d.toLocaleDateString()}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>My Workouts</Text>
        <Text style={styles.headerSubtitle}>Follow your schedule and crush your goals.</Text>

        {assigned.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={60} color={COLORS.primary} style={{marginBottom: 20}} />
            <Text style={styles.emptyTitle}>No Active Plan</Text>
            <Text style={styles.emptyText}>You don't have a workout schedule yet.</Text>
            <AppButton title="Generate Auto Schedule" onPress={() => setScheduleModalVisible(true)} style={{marginTop: 20}} />
          </View>
        ) : (
          assigned.map(work => {
            const plan = work.workoutPlan;
            if (!plan) return null;
            
            return (
              <View key={work._id} style={{marginBottom: SPACING.xxl}}>
                <AppCard style={styles.workoutCard}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.planTitle}>{plan.title}</Text>
                      <Text style={styles.planGoal}>{plan.fitnessLevel} • {plan.goal}</Text>
                    </View>
                    <View style={styles.progressCircle}>
                      <Text style={styles.progressText}>{work.completionStatus}%</Text>
                    </View>
                  </View>
                  {plan.notes ? (
                    <Text style={{color: COLORS.textDim, fontSize: 13, marginTop: 10, fontStyle: 'italic'}}>
                      Coach Notes: {plan.notes}
                    </Text>
                  ) : null}
                </AppCard>

                <Text style={styles.scheduleHeader}>My Schedule</Text>

                {work.schedule.map((sched) => {
                  const isToday = new Date(sched.date).toDateString() === new Date().toDateString();
                  const isPast = new Date(sched.date) < new Date(new Date().setHours(0,0,0,0));

                  return (
                    <View key={sched._id} style={[styles.dayContainer, sched.isCompleted && styles.dayCompleted]}>
                      <View style={styles.dayHeader}>
                        <Text style={[styles.dayDate, isToday && {color: COLORS.primary, fontWeight: 'bold'}]}>
                          {isToday ? 'Today' : formatDate(sched.date)}
                        </Text>
                        {sched.isCompleted ? (
                          <View style={styles.badgeGreen}><Text style={styles.badgeText}>Done</Text></View>
                        ) : isPast ? (
                          <View style={styles.badgeRed}><Text style={styles.badgeText}>Missed</Text></View>
                        ) : null}
                      </View>
                      
                      {sched.exercises.map((ex, idx) => (
                        <View key={ex._id || idx} style={styles.exerciseRow}>
                          <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <View style={styles.exDot} />
                            <View style={{flex: 1}}>
                              <Text style={styles.exName}>{ex.name}</Text>
                              <Text style={styles.exStats}>{ex.sets} Sets x {ex.repetitions} Reps</Text>
                            </View>
                          </View>
                          
                          {ex.description ? (
                            <Text style={styles.exDesc}>{ex.description}</Text>
                          ) : null}

                          {ex.mediaUrls && ex.mediaUrls.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exGallery}>
                              {ex.mediaUrls.map((url, i) => (
                                <View key={i} style={styles.exMediaContainer}>
                                  <Image source={{uri: url}} style={styles.exMediaImage} />
                                </View>
                              ))}
                            </ScrollView>
                          )}
                        </View>
                      ))}

                      {!sched.isCompleted && (isToday || isPast) && (
                        <AppButton 
                          title="Mark Completed" 
                          size="sm" 
                          type="outline" 
                          style={{marginTop: 15}} 
                          onPress={() => markDayCompleted(work._id, sched._id)}
                          disabled={loading}
                        />
                      )}
                    </View>
                  )
                })}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Auto Schedule Modal */}
      <Modal visible={scheduleModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Auto-Generate Schedule</Text>
              <TouchableOpacity onPress={() => setScheduleModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.text}/></TouchableOpacity>
            </View>
            <Text style={{color: COLORS.textDim, marginBottom: 20}}>We will generate a 4-week program based on your inputs.</Text>

            <Text style={styles.label}>Fitness Level</Text>
            <View style={styles.rowBtnContainer}>
              {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                <TouchableOpacity key={lvl} style={[styles.diffBtn, fitnessLevel === lvl && styles.diffBtnActive]} onPress={() => setFitnessLevel(lvl)}>
                  <Text style={[styles.diffText, fitnessLevel === lvl && styles.diffTextActive]}>{lvl}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Available Days</Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20}}>
              {allDays.map(day => {
                const isActive = availableDays.includes(day);
                return (
                  <TouchableOpacity key={day} style={[styles.dayChip, isActive && styles.dayChipActive]} onPress={() => toggleDay(day)}>
                    <Text style={[styles.dayChipText, isActive && styles.dayChipTextActive]}>{day}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <AppButton title="Generate Now" onPress={generateAutoSchedule} disabled={loading} />
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
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  emptyText: { color: COLORS.textDim, textAlign: 'center', marginBottom: 20 },
  
  workoutCard: { padding: SPACING.lg, marginBottom: SPACING.lg, backgroundColor: 'rgba(57, 255, 20, 0.05)', borderColor: COLORS.primary, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planTitle: { fontSize: 20, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  planGoal: { fontSize: 14, color: COLORS.text },
  progressCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 3, borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  progressText: { color: COLORS.text, fontWeight: '800', fontSize: 14 },
  
  scheduleHeader: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  dayContainer: { backgroundColor: COLORS.card, padding: SPACING.md, borderRadius: SIZES.radius, marginBottom: SPACING.md, borderLeftWidth: 4, borderLeftColor: COLORS.border },
  dayCompleted: { opacity: 0.7, borderLeftColor: COLORS.primary },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  dayDate: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  badgeGreen: { backgroundColor: 'rgba(57, 255, 20, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeRed: { backgroundColor: 'rgba(255, 51, 102, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: COLORS.text, fontSize: 12, fontWeight: 'bold' },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  exDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.secondary, marginRight: 12 },
  exName: { color: COLORS.text, fontWeight: '500', fontSize: 15 },
  exStats: { color: COLORS.textDim, fontSize: 12 },
  exDesc: { color: COLORS.textDim, fontSize: 13, marginTop: 8, fontStyle: 'italic', paddingLeft: 20 },
  exGallery: { flexDirection: 'row', marginTop: 10, paddingLeft: 20 },
  exMediaContainer: { width: 80, height: 80, borderRadius: 8, overflow: 'hidden', marginRight: 10, backgroundColor: COLORS.border },
  exMediaImage: { width: '100%', height: '100%' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: SIZES.radius, borderTopRightRadius: SIZES.radius, padding: SPACING.lg },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  label: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 10 },
  rowBtnContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  diffBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  diffBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  diffText: { color: COLORS.textDim, fontSize: 12, fontWeight: 'bold' },
  diffTextActive: { color: COLORS.background },
  dayChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  dayChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayChipText: { color: COLORS.textDim, fontSize: 12, fontWeight: 'bold' },
  dayChipTextActive: { color: COLORS.background },
});
