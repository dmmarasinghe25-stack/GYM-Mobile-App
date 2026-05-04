import { View, ScrollView, StyleSheet, Alert, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AppInput from '../src/components/AppInput';
import AppButton from '../src/components/AppButton';
import { COLORS, SPACING } from '../src/constants/theme';
import api from '../src/services/api';

export default function Payment() {
  const { planId, amount, name } = useLocalSearchParams();
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCardNumberChange = (text) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 16) cleaned = cleaned.slice(0, 16);
    let formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (text) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 4) cleaned = cleaned.slice(0, 4);
    
    if (cleaned.length >= 2) {
      let month = parseInt(cleaned.slice(0, 2), 10);
      if (month > 12) cleaned = '12' + cleaned.slice(2);
      if (month === 0 && cleaned.length >= 2) cleaned = '01' + cleaned.slice(2);
      cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    setExpiry(cleaned);
  };

  const handleCvvChange = (text) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 4) cleaned = cleaned.slice(0, 4);
    setCvv(cleaned);
  };

  const handleSendOTP = async () => {
    if (!phone) return Alert.alert('Error', 'Please enter your phone number');
    setLoading(true);
    try {
      // Academic Simulator: Sending OTP '1234'
      await api.post('/payments/otp', { phone });
      setOtpSent(true);
      Alert.alert('OTP Sent', 'For this demo, your OTP is: 1234');
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!otp || !cardNumber || !expiry || !cvv) {
      return Alert.alert('Error', 'Please fill all payment details and OTP');
    }
    
    setLoading(true);
    try {
      // Send payment request
      const res = await api.post('/payments/process', { 
        planId: planId || '60d5ecb8b392d700153ee000', 
        amount: amount || 0, 
        otp 
      });
      
      router.push({ 
        pathname: '/success', 
        params: { 
          name: name || 'Selected Plan', 
          amount: amount || 0,
          date: new Date().toLocaleDateString()
        } 
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Invalid OTP or processing error';
      Alert.alert('Payment Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>Checkout</Text>
        <Text style={styles.headerSubtitle}>Complete your payment to activate your plan.</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>Plan: <Text style={styles.highlight}>{name || 'Selected Plan'}</Text></Text>
          <Text style={styles.summaryText}>Total Due: <Text style={styles.highlight}>${amount || '0'}</Text></Text>
        </View>

        {!otpSent ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Verify Phone Number</Text>
            <AppInput label="PHONE NUMBER" placeholder="Enter your phone number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <AppButton title="Send Verification OTP" onPress={handleSendOTP} loading={loading} />
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Payment Details</Text>
            <AppInput label="OTP CODE" placeholder="Enter 1234" keyboardType="numeric" value={otp} onChangeText={setOtp} />
            
            <View style={styles.cardBox}>
              <Text style={styles.cardHeader}>Demo Card Details (Do not use real card)</Text>
              <AppInput label="CARD NUMBER" placeholder="0000 0000 0000 0000" keyboardType="numeric" value={cardNumber} onChangeText={handleCardNumberChange} />
              <View style={styles.row}>
                <View style={styles.half}><AppInput label="EXPIRY" placeholder="MM/YY" keyboardType="numeric" value={expiry} onChangeText={handleExpiryChange} /></View>
                <View style={styles.half}><AppInput label="CVV" placeholder="123" keyboardType="numeric" secureTextEntry value={cvv} onChangeText={handleCvvChange} /></View>
              </View>
            </View>

            <AppButton title={`Pay $${amount || 0}`} onPress={handlePayment} loading={loading} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.primary, marginBottom: SPACING.xs },
  headerSubtitle: { fontSize: 14, color: COLORS.textDim, marginBottom: SPACING.xl },
  summaryCard: {
    backgroundColor: COLORS.surfaceLight,
    padding: SPACING.lg,
    borderRadius: 8,
    marginBottom: SPACING.xl,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  summaryText: { color: COLORS.text, fontSize: 16, marginBottom: 4 },
  highlight: { fontWeight: 'bold', color: COLORS.primary },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { fontSize: 18, color: COLORS.text, fontWeight: 'bold', marginBottom: SPACING.md },
  cardBox: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: { color: COLORS.error, fontSize: 12, marginBottom: SPACING.sm, fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  half: { width: '48%' },
});
