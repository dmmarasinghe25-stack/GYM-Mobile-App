import { View, ScrollView, StyleSheet, Text, ActivityIndicator, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as SecureStore from 'expo-secure-store';

import AppCard from '../src/components/AppCard';
import AppButton from '../src/components/AppButton';
import { COLORS, SPACING, SIZES } from '../src/constants/theme';
import api from '../src/services/api';

const screenWidth = Dimensions.get('window').width - SPACING.md * 2 - SPACING.lg * 2; // card padding

export default function HealthDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchProgress();
    }, [])
  );

  const fetchProgress = async () => {
    try {
      const [progRes, assessRes] = await Promise.all([
        api.get('/health/progress'),
        api.get('/health')
      ]);
      
      const latestAssessment = assessRes.data.length > 0 ? assessRes.data[0] : null;
      
      setData({
        progressData: progRes.data,
        latestAssessment
      });
    } catch (e) {
      console.log('Error fetching health data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const uri = `${api.defaults.baseURL}/health/report`;
      const fileUri = `${FileSystem.documentDirectory}Health_Report.pdf`;
      
      const res = await FileSystem.downloadAsync(uri, fileUri, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(res.uri);
      } else {
        Alert.alert('Success', 'Report downloaded.');
      }
    } catch (error) {
      Alert.alert('Download Error', 'Could not fetch report.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!data || !data.latestAssessment) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: SPACING.xl }]}>
        <Text style={{color: COLORS.text, textAlign: 'center', marginBottom: 20}}>No health data found. Please complete your assessment first.</Text>
      </View>
    );
  }

  const { progressData, latestAssessment } = data;
  const { weightHistory = [], bmiHistory = [], goalAnalysis = {} } = progressData || {};

  // Chart Data preparation
  const chartLabels = weightHistory.slice(-6).map(h => new Date(h.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}));
  const chartWeights = weightHistory.slice(-6).map(h => h.weight);
  
  const lineChartData = {
    labels: chartLabels.length > 0 ? chartLabels : ['No Data'],
    datasets: [{ data: chartWeights.length > 0 ? chartWeights : [0] }]
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Health Analytics</Text>
      <Text style={styles.headerSubtitle}>Track your progress over time.</Text>

      {/* Risk Alerts */}
      {latestAssessment.riskAlerts && latestAssessment.riskAlerts.length > 0 && (
        <View style={styles.alertBox}>
          <View style={styles.alertHeader}>
            <Ionicons name="warning" size={20} color={COLORS.error} />
            <Text style={styles.alertTitle}>Health Alerts</Text>
          </View>
          {latestAssessment.riskAlerts.map((alert, idx) => (
            <Text key={idx} style={styles.alertText}>• {alert}</Text>
          ))}
        </View>
      )}

      {/* Health Score */}
      <AppCard style={styles.scoreCard}>
        <Text style={styles.sectionTitle}>Overall Health Score</Text>
        <View style={styles.scoreContainer}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreText}>{latestAssessment.healthScore}</Text>
          </View>
          <View style={styles.scoreDetails}>
            <Text style={styles.scoreCat}>Category: {latestAssessment.category}</Text>
            <Text style={styles.scoreBmi}>Current BMI: {latestAssessment.bmi}</Text>
          </View>
        </View>
      </AppCard>

      {/* Goal Analysis */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>Goal Progress</Text>
        <View style={styles.goalRow}>
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>Current</Text>
            <Text style={styles.goalVal}>{goalAnalysis.currentWeight || latestAssessment.weightKg} kg</Text>
          </View>
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>Remaining</Text>
            <Text style={styles.goalVal}>{goalAnalysis.remainingTarget || 0} kg</Text>
          </View>
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>Completed</Text>
            <Text style={[styles.goalVal, {color: COLORS.primary}]}>{goalAnalysis.completionPercentage || 0}%</Text>
          </View>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progBarBg}>
          <View style={[styles.progBarFill, { width: `${goalAnalysis.completionPercentage || 0}%` }]} />
        </View>
      </AppCard>

      {/* Weight Chart */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>Weight Trend</Text>
        {chartWeights.length > 0 ? (
          <LineChart
            data={lineChartData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        ) : (
          <Text style={{color: COLORS.textDim}}>Not enough data to display chart.</Text>
        )}
      </AppCard>

      <AppButton 
        title="Download PDF Report" 
        onPress={handleDownload} 
        loading={downloading}
        style={{marginTop: SPACING.md, marginBottom: SPACING.xl, backgroundColor: COLORS.surfaceLight}}
        textStyle={{color: COLORS.primary}}
      />
    </ScrollView>
  );
}

const chartConfig = {
  backgroundColor: COLORS.card,
  backgroundGradientFrom: COLORS.card,
  backgroundGradientTo: COLORS.card,
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(57, 255, 20, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: "6", strokeWidth: "2", stroke: COLORS.background }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: COLORS.textDim, marginBottom: SPACING.xl },
  alertBox: { backgroundColor: 'rgba(255, 50, 50, 0.1)', borderWidth: 1, borderColor: COLORS.error, borderRadius: SIZES.radius, padding: SPACING.md, marginBottom: SPACING.lg },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  alertTitle: { color: COLORS.error, fontWeight: 'bold', fontSize: 16 },
  alertText: { color: COLORS.text, fontSize: 13, marginBottom: 4 },
  card: { padding: SPACING.lg, marginBottom: SPACING.lg },
  scoreCard: { padding: SPACING.lg, marginBottom: SPACING.lg, alignItems: 'center' },
  sectionTitle: { fontSize: 18, color: COLORS.text, fontWeight: 'bold', marginBottom: SPACING.md },
  scoreContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%', marginTop: 10 },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  scoreText: { color: COLORS.primary, fontSize: 28, fontWeight: '900' },
  scoreDetails: { alignItems: 'flex-start' },
  scoreCat: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  scoreBmi: { color: COLORS.textDim, fontSize: 14 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
  goalItem: { alignItems: 'center' },
  goalLabel: { color: COLORS.textDim, fontSize: 12, marginBottom: 4 },
  goalVal: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  progBarBg: { height: 10, backgroundColor: COLORS.surfaceLight, borderRadius: 5, overflow: 'hidden' },
  progBarFill: { height: '100%', backgroundColor: COLORS.primary },
  chart: { marginVertical: 8, borderRadius: 16 },
});
