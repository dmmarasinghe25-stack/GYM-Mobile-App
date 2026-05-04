import { View, ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { COLORS, SPACING } from '../src/constants/theme';
import api from '../src/services/api';
import AppCard from '../src/components/AppCard';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (e) {
      console.log('Error fetching notifications', e);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (e) {
      console.log('Error marking as read', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (e) {
      console.log('Error marking all as read', e);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.some(n => !n.isRead) && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 && (
        <Text style={{color: COLORS.textDim, textAlign: 'center', marginTop: 40}}>
          You have no notifications.
        </Text>
      )}

      {notifications.map(notif => {
        let badgeColor = COLORS.primary;
        let badgeText = notif.type || 'General';
        
        if (notif.type === 'Reminder') {
          badgeColor = '#FF9800'; // Orange
          badgeText = 'Reminder';
        } else if (notif.type === 'Alert') {
          badgeColor = '#F44336'; // Red
          badgeText = 'Alert';
        }

        return (
          <TouchableOpacity 
            key={notif._id} 
            activeOpacity={0.8}
            onPress={() => {
              if (!notif.isRead) markAsRead(notif._id);
            }}
          >
            <AppCard style={[styles.card, !notif.isRead && styles.unreadCard]}>
              <View style={styles.notifHeader}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                  <View style={[styles.typeBadge, {backgroundColor: badgeColor + '30'}]}>
                    <Text style={[styles.typeBadgeText, {color: badgeColor}]}>{badgeText}</Text>
                  </View>
                  <Text style={styles.title}>{notif.title}</Text>
                </View>
                <Text style={styles.time}>
                  {new Date(notif.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.message}>{notif.message}</Text>
            </AppCard>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: SPACING.xl 
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  markAllText: { color: COLORS.primary, fontWeight: '600' },
  card: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    opacity: 0.7,
  },
  unreadCard: {
    opacity: 1,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  time: {
    fontSize: 12,
    color: COLORS.textDim,
  },
  message: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  }
});
