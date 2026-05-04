import { View, ScrollView, StyleSheet, Alert, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import AppInput from '../src/components/AppInput';
import AppButton from '../src/components/AppButton';
import api from '../src/services/api';
import { COLORS, SPACING } from '../src/constants/theme';

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    let formatted = phone.replace(/\s+/g, '');
    if (formatted.startsWith('07') && formatted.length === 10) {
      return '+94' + formatted.substring(1);
    }
    return formatted;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full Name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    const phoneRegex = /^(07|\+947)\d{8}$/;
    const phoneToValidate = formData.phone.replace(/\s+/g, '');
    if (!phoneToValidate || !phoneRegex.test(phoneToValidate)) {
      newErrors.phone = 'Enter a valid Sri Lankan phone number';
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(formData.phone);
      
      const res = await api.post('/auth/register', { 
        name: formData.name, 
        email: formData.email, 
        phone: formattedPhone,
        password: formData.password,
        role: 'Member'
      });
      
      // If the backend returns a token upon registration, save it
      if (res.data.token) {
        await SecureStore.setItemAsync('token', res.data.token);
      }
      
      Alert.alert('Welcome to Gym Pro!', 'Your account has been created successfully.');
      router.push('/login');
    } catch (error) {
      Alert.alert(
        'Registration Failed', 
        error.response?.data?.message || 'Network error. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Join The Elite</Text>
        <Text style={styles.headerSubtitle}>Create your Gym Pro account to start tracking your fitness journey.</Text>

        <View style={styles.form}>
          <AppInput 
            label="FULL NAME *" 
            placeholder="John Doe" 
            value={formData.name} 
            onChangeText={(v) => handleChange('name', v)} 
            error={errors.name}
          />
          <AppInput 
            label="EMAIL ADDRESS *" 
            placeholder="john@example.com" 
            keyboardType="email-address"
            value={formData.email} 
            onChangeText={(v) => handleChange('email', v)} 
            error={errors.email}
          />
          <AppInput 
            label="PHONE NUMBER *" 
            placeholder="0771234567 or +94771234567" 
            keyboardType="phone-pad"
            value={formData.phone} 
            onChangeText={(v) => handleChange('phone', v)} 
            error={errors.phone}
          />
          <AppInput 
            label="PASSWORD *" 
            placeholder="Create a strong password" 
            secureTextEntry 
            value={formData.password} 
            onChangeText={(v) => handleChange('password', v)} 
            error={errors.password}
          />
          <AppInput 
            label="CONFIRM PASSWORD *" 
            placeholder="Repeat your password" 
            secureTextEntry 
            value={formData.confirmPassword} 
            onChangeText={(v) => handleChange('confirmPassword', v)} 
            error={errors.confirmPassword}
          />

          <AppButton 
            title="Create Account" 
            onPress={handleRegister} 
            loading={loading}
            style={{ marginTop: SPACING.md }}
          />

          <AppButton 
            title="Already have an account? Log In" 
            type="outline" 
            onPress={() => router.push('/login')} 
            disabled={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textDim,
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  form: {
    gap: SPACING.sm,
  }
});
