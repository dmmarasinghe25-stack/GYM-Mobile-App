import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import AppCard from '../src/components/AppCard';
import AppButton from '../src/components/AppButton';
import AppInput from '../src/components/AppInput';
import { COLORS, SPACING } from '../src/constants/theme';
import api from '../src/services/api';

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(true); // For demo, let's assume true to show Admin UI
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [discount, setDiscount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const res = await api.get('/promotions');
      setPromotions(res.data);
    } catch (e) { console.log('Error', e); }
  };

  const handleCreatePromo = async () => {
    if (!title || !discount) return Alert.alert('Error', 'Title and Discount required');
    setLoading(true);
    try {
      await api.post('/promotions', { title, description: desc, discountPercentage: Number(discount) });
      setTitle(''); setDesc(''); setDiscount('');
      fetchPromotions();
      Alert.alert('Success', 'Promotion added!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add promotion');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/promotions/${id}`);
      fetchPromotions();
    } catch (e) { Alert.alert('Error', 'Failed to delete'); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Promotions</Text>
      <Text style={styles.headerSubtitle}>Exclusive offers and challenges.</Text>

      {isAdmin && (
        <AppCard style={styles.adminCard}>
          <Text style={styles.sectionTitle}>Admin: New Promotion</Text>
          <AppInput label="PROMO TITLE" placeholder="e.g. New Year Special" value={title} onChangeText={setTitle} />
          <AppInput label="DISCOUNT %" placeholder="e.g. 20" keyboardType="numeric" value={discount} onChangeText={setDiscount} />
          <AppInput label="DESCRIPTION" placeholder="Offer details..." value={desc} onChangeText={setDesc} />
          <AppButton title="Post Promotion" onPress={handleCreatePromo} loading={loading} />
        </AppCard>
      )}

      {promotions.length === 0 ? (
        <Text style={{color: COLORS.textDim}}>No active promotions right now.</Text>
      ) : (
        promotions.map(promo => (
          <AppCard key={promo._id} style={styles.promoCard}>
            <View style={styles.promoHeader}>
              <Text style={styles.promoTitle}>{promo.title}</Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{promo.discountPercentage}% OFF</Text>
              </View>
            </View>
            <Text style={styles.promoDesc}>{promo.description}</Text>
            
            {isAdmin && (
              <TouchableOpacity onPress={() => handleDelete(promo._id)}>
                <Text style={styles.deleteText}>Delete Offer</Text>
              </TouchableOpacity>
            )}
          </AppCard>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.primary, marginBottom: SPACING.xs },
  headerSubtitle: { fontSize: 14, color: COLORS.textDim, marginBottom: SPACING.xl },
  adminCard: { padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.secondary },
  sectionTitle: { fontSize: 18, color: COLORS.text, fontWeight: 'bold', marginBottom: SPACING.md },
  promoCard: { padding: SPACING.lg, marginBottom: SPACING.md },
  promoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  promoTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, flex: 1 },
  discountBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  discountText: { color: COLORS.background, fontWeight: '900', fontSize: 12 },
  promoDesc: { color: COLORS.textDim, fontSize: 14, marginBottom: SPACING.sm },
  deleteText: { color: COLORS.error, fontWeight: 'bold', fontSize: 12, textAlign: 'right' }
});
