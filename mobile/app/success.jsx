import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AppButton from '../src/components/AppButton';
import AppCard from '../src/components/AppCard';
import { COLORS, SPACING } from '../src/constants/theme';

export default function Success() {
  const router = useRouter();
  const { name, amount, date } = useLocalSearchParams();

  // Generate a random transaction ID for the invoice display
  const transactionId = Math.random().toString(36).substr(2, 9).toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.iconContainer}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>
      </View>
      
      <Text style={styles.headerTitle}>Payment Successful!</Text>
      <Text style={styles.headerSubtitle}>Your enrollment is complete.</Text>

      <AppCard style={styles.invoiceCard}>
        <Text style={styles.invoiceHeader}>DIGITAL RECEIPT</Text>
        <View style={styles.divider} />
        
        <View style={styles.row}>
          <Text style={styles.label}>Plan Name:</Text>
          <Text style={styles.value}>{name}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Amount Paid:</Text>
          <Text style={styles.value}>${amount}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{date}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Transaction ID:</Text>
          <Text style={styles.value}>#{transactionId}</Text>
        </View>

        <View style={styles.divider} />
        
        <Text style={styles.footerText}>Thank you for choosing Gym Pro!</Text>
      </AppCard>

      <View style={styles.actions}>
        <AppButton 
          title="Go to Dashboard" 
          onPress={() => router.push('/home')} 
          style={{ marginBottom: SPACING.md }} 
        />
        <AppButton 
          title="View My History" 
          type="outline" 
          onPress={() => router.push('/history')} 
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, paddingBottom: SPACING.xxl, alignItems: 'center' },
  iconContainer: { marginTop: SPACING.xxl, marginBottom: SPACING.xl, alignItems: 'center' },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(57, 255, 20, 0.2)', // Green glow
    borderWidth: 2,
    borderColor: '#39FF14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: { color: '#39FF14', fontSize: 40, fontWeight: 'bold' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.xs, textAlign: 'center' },
  headerSubtitle: { fontSize: 14, color: COLORS.textDim, marginBottom: SPACING.xxl, textAlign: 'center' },
  invoiceCard: {
    width: '100%',
    padding: SPACING.xl,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    marginBottom: SPACING.xxl,
  },
  invoiceHeader: { color: COLORS.primary, fontSize: 16, fontWeight: '800', textAlign: 'center', letterSpacing: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  label: { color: COLORS.textDim, fontSize: 14 },
  value: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  footerText: { color: COLORS.textDim, fontSize: 12, textAlign: 'center', fontStyle: 'italic', marginTop: SPACING.sm },
  actions: { width: '100%' }
});
