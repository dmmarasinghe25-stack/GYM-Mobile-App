import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AppCard from '../src/components/AppCard';
import AppButton from '../src/components/AppButton';
import { COLORS, SPACING, SIZES } from '../src/constants/theme';
import api from '../src/services/api';

export default function Plans() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/plans');
      if (res.data.length > 0) setPlans(res.data);
      else {
        // Fallback demo data if DB is empty
        setPlans([
          { _id: '60d5ecb8b392d700153ee001', name: 'Yoga Class (Monthly)', durationMonths: 1, price: 50 },
          { _id: '60d5ecb8b392d700153ee002', name: 'Gym Membership (6 Months)', durationMonths: 6, price: 200 },
        ]);
      }
    } catch (e) {
      console.log('Error', e);
    }
  };

  const handleSelectPlan = (plan) => {
    Alert.alert(
      'Confirm Selection',
      `You selected ${plan.name} for $${plan.price}. Proceed to payment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Proceed', 
          onPress: () => router.push({ pathname: '/payment', params: { planId: plan._id, amount: plan.price, name: plan.name } }) 
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={{flex: 1}}>
          <Text style={styles.headerTitle}>Select Your Plan</Text>
          <Text style={styles.headerSubtitle}>Choose a membership or class that fits your goals.</Text>
        </View>
        <AppButton title="My History" size="sm" type="outline" onPress={() => router.push('/history')} />
      </View>

      {plans.map(plan => (
        <TouchableOpacity key={plan._id} activeOpacity={0.8} onPress={() => handleSelectPlan(plan)}>
          <AppCard style={styles.planCard}>
            <View style={styles.planInfo}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planDuration}>{plan.durationMonths} Month{plan.durationMonths > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>${plan.price}</Text>
            </View>
          </AppCard>
        </TouchableOpacity>
      ))}

      <View style={styles.adminSection}>
        <AppButton title="Manage Plans (Admin)" type="outline" onPress={() => router.push('/admin-plans')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.primary, marginBottom: SPACING.xs },
  headerSubtitle: { fontSize: 14, color: COLORS.textDim },
  planCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  planInfo: { flex: 1 },
  planName: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  planDuration: { fontSize: 14, color: COLORS.textDim },
  priceTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: SIZES.radiusSm,
  },
  priceText: { color: COLORS.background, fontWeight: '800', fontSize: 18 },
  adminSection: { marginTop: SPACING.xxl, paddingTop: SPACING.xl, borderTopWidth: 1, borderTopColor: COLORS.border }
});
