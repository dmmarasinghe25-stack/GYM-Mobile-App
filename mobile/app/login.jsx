import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import AppInput from '../src/components/AppInput';
import AppButton from '../src/components/AppButton';
import api from '../src/services/api';
import { COLORS, SPACING } from '../src/constants/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert('Validation Error', 'Please enter both email and password.');
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      await SecureStore.setItemAsync('token', res.data.token);
      Alert.alert('Access Granted', 'Welcome back!');
      router.push('/home');
    } catch (error) {
      Alert.alert('Access Denied', error.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Welcome Back</Text>
      <Text style={styles.headerSubtitle}>Sign in to continue your progress.</Text>

      <AppInput 
        label="EMAIL ADDRESS" 
        placeholder="Enter your email"
        keyboardType="email-address"
        value={email} 
        onChangeText={setEmail} 
      />
      
      <AppInput 
        label="PASSWORD" 
        placeholder="Enter your password"
        secureTextEntry 
        value={password} 
        onChangeText={setPassword} 
      />

      <TouchableOpacity onPress={() => router.push('/forgot-password')} style={styles.forgotContainer}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      <AppButton 
        title="Access Dashboard" 
        onPress={handleLogin} 
        loading={loading}
        style={{ marginTop: SPACING.md }}
      />
      
      <AppButton 
        title="Don't have an account? Register" 
        type="outline" 
        onPress={() => router.push('/register')} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: SPACING.lg, 
    backgroundColor: COLORS.background,
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textDim,
    marginBottom: SPACING.xxl,
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotText: {
    color: COLORS.secondary,
    fontWeight: '600',
    fontSize: 14,
  }
});