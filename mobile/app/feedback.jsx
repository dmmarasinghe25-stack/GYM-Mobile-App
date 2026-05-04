import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import AppCard from '../src/components/AppCard';
import AppButton from '../src/components/AppButton';
import AppInput from '../src/components/AppInput';
import { COLORS, SPACING, SIZES } from '../src/constants/theme';
import api from '../src/services/api';

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [mode, setMode] = useState('App'); // 'App' or 'Coach'
  const [target, setTarget] = useState('Overall'); // For App mode
  const [coachId, setCoachId] = useState(''); // For Coach mode
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchFeedbacks();
      fetchTrainers();
    }, [])
  );

  const fetchFeedbacks = async () => {
    try {
      const res = await api.get('/feedback');
      setFeedbacks(res.data);
    } catch (e) { console.log('Error', e); }
  };

  const fetchTrainers = async () => {
    try {
      const res = await api.get('/users/trainers');
      setTrainers(res.data);
      if (res.data.length > 0) setCoachId(res.data[0]._id);
    } catch (e) { console.log('Error fetching trainers', e); }
  };

  const handleSubmit = async () => {
    if (!message) {
      Alert.alert('Validation Error', 'Please provide a message.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        message,
        rating: mode === 'Coach' ? rating : undefined,
        target: mode === 'App' ? target : undefined,
        coachId: mode === 'Coach' ? coachId : undefined,
      };

      await api.post('/feedback', payload);
      setMessage('');
      fetchFeedbacks();
      Alert.alert('Success', 'Feedback submitted successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReviewed = async (id) => {
    try {
      await api.put(`/feedback/${id}/review`);
      fetchFeedbacks();
    } catch (e) { Alert.alert('Error', 'Failed to update status'); }
  };

  const renderStars = (currentRating, interactive = false) => {
    return (
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity 
            key={star} 
            disabled={!interactive}
            onPress={() => setRating(star)}
          >
            <Text style={[styles.star, { color: star <= currentRating ? COLORS.secondary : COLORS.surfaceLight }]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Feedback</Text>
      <Text style={styles.headerSubtitle}>Rate your experience.</Text>

      <View style={styles.modeTabs}>
        <TouchableOpacity style={[styles.modeTab, mode === 'App' && styles.modeTabActive]} onPress={() => setMode('App')}>
          <Text style={[styles.modeTabText, mode === 'App' && styles.modeTabTextActive]}>App Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modeTab, mode === 'Coach' && styles.modeTabActive]} onPress={() => setMode('Coach')}>
          <Text style={[styles.modeTabText, mode === 'Coach' && styles.modeTabTextActive]}>Rate a Coach</Text>
        </TouchableOpacity>
      </View>

      <AppCard style={styles.formCard}>
        {mode === 'App' ? (
          <>
            <Text style={styles.label}>CATEGORY</Text>
            <View style={styles.targetRow}>
              {['Overall', 'Service', 'App Issue', 'Other'].map(t => (
                <TouchableOpacity 
                  key={t} 
                  style={[styles.targetBtn, target === t && styles.targetBtnActive]}
                  onPress={() => setTarget(t)}
                >
                  <Text style={[styles.targetText, target === t && styles.targetTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.label}>SELECT COACH</Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20}}>
              {trainers.map(tr => (
                <TouchableOpacity 
                  key={tr._id} 
                  style={[styles.trainerBtn, coachId === tr._id && styles.trainerBtnActive]}
                  onPress={() => setCoachId(tr._id)}
                >
                  <Text style={[styles.trainerText, coachId === tr._id && {color: COLORS.background}]}>{tr.name}</Text>
                </TouchableOpacity>
              ))}
              {trainers.length === 0 && <Text style={{color: COLORS.textDim}}>No coaches available.</Text>}
            </View>

            <Text style={styles.label}>RATING</Text>
            {renderStars(rating, true)}
          </>
        )}

        <Text style={styles.label}>YOUR MESSAGE</Text>
        <AppInput placeholder="Write your feedback..." value={message} onChangeText={setMessage} multiline />
        
        <AppButton title="Submit Feedback" onPress={handleSubmit} loading={loading} style={{marginTop: 15}}/>
      </AppCard>

      <Text style={styles.sectionTitle}>Recent Feedback</Text>
      {feedbacks.map(item => (
        <AppCard key={item._id} style={styles.feedbackCard}>
          <View style={styles.fbHeader}>
            <Text style={styles.fbTarget}>{item.coachId ? `Coach: ${item.coachId.name}` : `App: ${item.target}`}</Text>
            {item.coachId ? renderStars(item.rating) : null}
          </View>
          <Text style={styles.fbReview}>"{item.message}"</Text>
          <View style={styles.fbFooter}>
            <Text style={styles.fbUser}>- {item.user?.name || 'Member'}</Text>
            {item.isReviewed ? (
              <Text style={styles.statusReviewed}>Reviewed ✓</Text>
            ) : (
              <TouchableOpacity onPress={() => handleMarkReviewed(item._id)}>
                <Text style={styles.actionResolve}>Mark as Reviewed</Text>
              </TouchableOpacity>
            )}
          </View>
        </AppCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.primary, marginBottom: SPACING.xs },
  headerSubtitle: { fontSize: 14, color: COLORS.textDim, marginBottom: SPACING.lg },
  modeTabs: { flexDirection: 'row', marginBottom: SPACING.lg, backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radius, padding: 4 },
  modeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: SIZES.radius - 4 },
  modeTabActive: { backgroundColor: COLORS.card },
  modeTabText: { color: COLORS.textDim, fontWeight: 'bold' },
  modeTabTextActive: { color: COLORS.primary },
  formCard: { marginBottom: SPACING.xl },
  sectionTitle: { fontSize: 18, color: COLORS.text, fontWeight: 'bold', marginBottom: SPACING.md },
  label: { color: COLORS.primary, fontSize: 10, fontWeight: '700', marginBottom: 8, marginTop: 10 },
  targetRow: { flexDirection: 'row', flexWrap: 'wrap' },
  targetBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, marginBottom: 8 },
  targetBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  targetText: { color: COLORS.textDim, fontSize: 12 },
  targetTextActive: { color: COLORS.background, fontWeight: 'bold' },
  pickerContainer: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, marginBottom: 15, backgroundColor: 'rgba(255,255,255,0.02)' },
  picker: { color: COLORS.text },
  starRow: { flexDirection: 'row' },
  star: { fontSize: 32, marginRight: 4 },
  feedbackCard: { padding: SPACING.md, marginBottom: SPACING.md },
  fbHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fbTarget: { color: COLORS.primary, fontWeight: '700' },
  fbReview: { color: COLORS.text, fontStyle: 'italic', marginVertical: SPACING.sm },
  fbFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  fbUser: { color: COLORS.textDim, fontSize: 12 },
  statusReviewed: { color: COLORS.secondary, fontSize: 12, fontWeight: 'bold' },
  actionResolve: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold' },
  trainerBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  trainerBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  trainerText: { color: COLORS.textDim, fontSize: 14, fontWeight: 'bold' },
});
