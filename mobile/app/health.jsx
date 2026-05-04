import { View, ScrollView, StyleSheet, Text, Alert, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AppCard from '../src/components/AppCard';
import AppButton from '../src/components/AppButton';
import { COLORS, SPACING, SIZES } from '../src/constants/theme';
import api from '../src/services/api';

export default function Health() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form State
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [targetWeightKg, setTargetWeightKg] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [goals, setGoals] = useState('');

  const handleSubmit = async () => {
    if (!age || !gender || !weightKg || !heightCm) {
      Alert.alert('Validation Error', 'Age, Gender, Weight, and Height are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        age: parseInt(age),
        gender,
        weightKg: parseFloat(weightKg),
        heightCm: parseFloat(heightCm),
        targetWeightKg: targetWeightKg ? parseFloat(targetWeightKg) : undefined,
        medicalConditions: medicalConditions ? medicalConditions.split(',').map(s => s.trim()) : [],
        goals
      };

      await api.post('/health', payload);
      Alert.alert('Success', 'Health Assessment saved successfully!', [
        { text: 'View Dashboard', onPress: () => router.push('/health-dashboard') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save health assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Health Assessment</Text>
      <Text style={styles.headerSubtitle}>Log your metrics to track progress.</Text>

      <AppButton 
        title="View Progress Dashboard" 
        onPress={() => router.push('/health-dashboard')} 
        style={{marginBottom: SPACING.xl, backgroundColor: COLORS.secondary}}
      />

      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>Basic Metrics</Text>
        
        <Text style={styles.label}>Age *</Text>
        <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholder="e.g. 28" placeholderTextColor={COLORS.textDim} />

        <Text style={styles.label}>Gender *</Text>
        <TextInput style={styles.input} value={gender} onChangeText={setGender} placeholder="e.g. Male/Female/Other" placeholderTextColor={COLORS.textDim} />

        <Text style={styles.label}>Weight (kg) *</Text>
        <TextInput style={styles.input} value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" placeholder="e.g. 75" placeholderTextColor={COLORS.textDim} />

        <Text style={styles.label}>Height (cm) *</Text>
        <TextInput style={styles.input} value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" placeholder="e.g. 180" placeholderTextColor={COLORS.textDim} />

        <Text style={styles.sectionTitle}>Goals & Conditions</Text>

        <Text style={styles.label}>Target Weight (kg)</Text>
        <TextInput style={styles.input} value={targetWeightKg} onChangeText={setTargetWeightKg} keyboardType="numeric" placeholder="e.g. 70" placeholderTextColor={COLORS.textDim} />

        <Text style={styles.label}>Medical Conditions & Injuries</Text>
        <TextInput 
          style={styles.input} 
          value={medicalConditions} 
          onChangeText={setMedicalConditions} 
          placeholder="Comma separated (e.g. Asthma, bad knee)" 
          placeholderTextColor={COLORS.textDim} 
        />

        <Text style={styles.label}>Overall Fitness Goals</Text>
        <TextInput 
          style={[styles.input, {height: 80, textAlignVertical: 'top'}]} 
          value={goals} 
          onChangeText={setGoals} 
          placeholder="e.g. I want to run a marathon..." 
          placeholderTextColor={COLORS.textDim} 
          multiline
        />

        <AppButton title="Submit Assessment" onPress={handleSubmit} loading={loading} style={{marginTop: SPACING.md}} />
      </AppCard>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: COLORS.textDim, marginBottom: SPACING.lg },
  card: { padding: SPACING.lg },
  sectionTitle: { fontSize: 18, color: COLORS.text, fontWeight: 'bold', marginBottom: SPACING.md, marginTop: SPACING.sm },
  label: { color: COLORS.primary, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', color: COLORS.text, padding: 12, borderRadius: 8, marginBottom: 15 },
});
