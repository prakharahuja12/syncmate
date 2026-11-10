import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { addHours, format, parseISO, startOfHour } from 'date-fns';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/useTheme';
import {
  CATEGORY_COLORS,
  PRIORITY_COLORS,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
} from '../../theme/tokens';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { eventsApi, CreateEventPayload } from './api';
import { groupApi } from '../group/api';
import { useAuthStore } from '../../stores/authStore';
import { EventCategory, EventPriority, HackathonMode, EventItem } from '../../types/api';
import { haptics } from '../../lib/haptics';

type Props = NativeStackScreenProps<RootStackParamList, 'EventForm'>;

const CATEGORIES: EventCategory[] = [
  'hackathon',
  'college',
  'personal',
  'meeting',
  'competition',
  'other',
];

const PRIORITIES: { label: string; value: EventPriority; icon: string }[] = [
  { label: 'High', value: 'high', icon: '🔴' },
  { label: 'Medium', value: 'medium', icon: '🟡' },
  { label: 'Low', value: 'low', icon: '🟢' },
];

const REMINDER_PRESETS = [
  { label: '1 hour before', offset: 60 },
  { label: '30 mins before', offset: 30 },
  { label: '12 hours before', offset: 720 },
  { label: '1 day before', offset: 1440 },
];

export const EventFormModal: React.FC<Props> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const currentGroupId = useAuthStore((s) => s.group?.id);

  const eventId = route.params?.eventId;
  const initialCategory = (route.params?.initialCategory as EventCategory) || 'hackathon';

  const defaultStart = startOfHour(addHours(new Date(), 1));
  const defaultEnd = addHours(defaultStart, 1);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>(initialCategory);
  const [priority, setPriority] = useState<EventPriority>('medium');
  const [startAt, setStartAt] = useState(defaultStart.toISOString());
  const [endAt, setEndAt] = useState(defaultEnd.toISOString());
  const [allDay, setAllDay] = useState(false);
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [assignedToAll, setAssignedToAll] = useState(true);
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [selectedReminderOffset, setSelectedReminderOffset] = useState<number | null>(60);
  const [saveToWatchlist, setSaveToWatchlist] = useState(false);

  // Hackathon specific fields
  const [hackName, setHackName] = useState('');
  const [regUrl, setRegUrl] = useState('');
  const [officialUrl, setOfficialUrl] = useState('');
  const [regClosesAt, setRegClosesAt] = useState('');
  const [prizePool, setPrizePool] = useState('');
  const [location, setLocation] = useState('');
  const [mode, setMode] = useState<HackathonMode>('online');

  // Load group members for assignment checklist
  const { data: group } = useQuery({
    queryKey: ['group'],
    queryFn: () => groupApi.getMyGroup(),
  });

  // If editing, load event details
  const { data: existingEvent } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.getEventById(eventId!),
    enabled: !!eventId,
  });

  useEffect(() => {
    if (existingEvent) {
      setTitle(existingEvent.title);
      setCategory(existingEvent.category);
      setPriority(existingEvent.priority);
      setStartAt(existingEvent.startAt);
      setEndAt(existingEvent.endAt);
      setAllDay(existingEvent.allDay);
      setDescription(existingEvent.description || '');
      setUrl(existingEvent.url || '');
      setAssignedToAll(existingEvent.assignedToAll);
      setAssignedTo(existingEvent.assignedTo || []);

      if (existingEvent.hackathon) {
        setHackName(existingEvent.hackathon.name || '');
        setRegUrl(existingEvent.hackathon.registrationUrl || '');
        setOfficialUrl(existingEvent.hackathon.officialUrl || '');
        setRegClosesAt(existingEvent.hackathon.registrationClosesAt || '');
        setPrizePool(existingEvent.hackathon.prizePool || '');
        setLocation(existingEvent.hackathon.location || '');
        setMode(existingEvent.hackathon.mode || 'online');
      }
    }
  }, [existingEvent]);

  const isHackathonType = category === 'hackathon' || category === 'competition';

  const createMutation = useMutation({
    mutationFn: (payload: CreateEventPayload) =>
      eventsApi.createEvent(currentGroupId!, payload),
    onSuccess: async (created) => {
      haptics.success();
      if (saveToWatchlist) {
        try {
          await eventsApi.pinEvent(created.id, 'group');
        } catch {}
      }
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      Toast.show({ type: 'success', text1: 'Event saved!' });
      navigation.goBack();
    },
    onError: (err: any) => {
      Toast.show({ type: 'error', text1: 'Error saving event', text2: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: CreateEventPayload) =>
      eventsApi.updateEvent(eventId!, payload),
    onSuccess: () => {
      haptics.success();
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      Toast.show({ type: 'success', text1: 'Event updated!' });
      navigation.goBack();
    },
    onError: (err: any) => {
      Toast.show({ type: 'error', text1: 'Error updating event', text2: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => eventsApi.deleteEvent(eventId!),
    onSuccess: () => {
      haptics.warning();
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      Toast.show({ type: 'success', text1: 'Event deleted' });
      navigation.goBack();
    },
    onError: (err: any) => {
      Toast.show({ type: 'error', text1: 'Cannot delete event', text2: err.message });
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter an event title.');
      return;
    }

    const payload: CreateEventPayload = {
      title: title.trim(),
      category,
      priority,
      startAt,
      endAt,
      allDay,
      description: description.trim() || undefined,
      url: url.trim() || undefined,
      assignedToAll,
      assignedTo: assignedToAll ? [] : assignedTo,
      kind: 'event',
      reminders: selectedReminderOffset
        ? [{ anchor: 'start', offsetMinutes: selectedReminderOffset }]
        : [],
    };

    if (isHackathonType) {
      payload.hackathon = {
        name: hackName.trim() || title.trim(),
        registrationUrl: regUrl.trim() || undefined,
        officialUrl: officialUrl.trim() || undefined,
        registrationClosesAt: regClosesAt.trim() || undefined,
        prizePool: prizePool.trim() || undefined,
        location: location.trim() || undefined,
        mode,
      };
    }

    if (eventId) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Event', 'Are you sure you want to delete this event for the group?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      {/* Header bar */}
      <View style={[styles.headerBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={styles.cancelTouch}
        >
          <Text style={{ color: theme.muted, fontSize: TYPOGRAPHY.md }}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.modalTitle, { color: theme.text }]}>
          {eventId ? 'Edit Event' : 'New Event'}
        </Text>
        <View style={styles.cancelTouch} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <Input
          label="Title"
          placeholder="e.g. Smart India Hackathon 2026"
          value={title}
          onChangeText={setTitle}
          style={{ fontSize: TYPOGRAPHY.lg, fontWeight: '600' }}
          autoFocus={!eventId}
        />

        {/* Category Chips */}
        <Text style={[styles.label, { color: theme.text }]}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat;
            const catColor = CATEGORY_COLORS[cat];
            return (
              <TouchableOpacity
                key={cat}
                accessibilityRole="button"
                onPress={() => {
                  haptics.light();
                  setCategory(cat);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? catColor : theme.surface,
                    borderColor: isSelected ? catColor : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {cat.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Priority Chips */}
        <Text style={[styles.label, { color: theme.text }]}>Priority</Text>
        <View style={styles.priorityRow}>
          {PRIORITIES.map((p) => {
            const isSelected = priority === p.value;
            const pColor = PRIORITY_COLORS[p.value];
            return (
              <TouchableOpacity
                key={p.value}
                accessibilityRole="button"
                onPress={() => {
                  haptics.light();
                  setPriority(p.value);
                }}
                style={[
                  styles.priorityBtn,
                  {
                    backgroundColor: isSelected ? `${pColor}20` : theme.surface,
                    borderColor: isSelected ? pColor : theme.border,
                  },
                ]}
              >
                <Text style={styles.priorityIcon}>{p.icon}</Text>
                <Text
                  style={[
                    styles.priorityLabel,
                    { color: isSelected ? pColor : theme.text, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* All-Day Switch & Date Display */}
        <View style={[styles.switchRow, { borderColor: theme.border }]}>
          <Text style={[styles.switchLabel, { color: theme.text }]}>All-day event</Text>
          <Switch
            value={allDay}
            onValueChange={setAllDay}
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        </View>

        {/* Date summary display */}
        <View style={[styles.dateSummary, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.dateText, { color: theme.muted }]}>Starts:</Text>
          <Text style={[styles.dateVal, { color: theme.text }]}>
            {format(parseISO(startAt), 'EEE, MMM d, yyyy • h:mm a')}
          </Text>
        </View>

        {/* Description */}
        <Input
          label="Description"
          placeholder="Details, agendas, or notes..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={{ minHeight: 70 }}
        />

        {/* Hackathon Section */}
        {isHackathonType && (
          <View style={[styles.hackathonSection, { backgroundColor: `${theme.primary}0D`, borderColor: theme.primary }]}>
            <Text style={[styles.hackSectionTitle, { color: theme.primary }]}>
              🏆 Hackathon Details
            </Text>

            <Input
              label="Registration URL"
              placeholder="https://hackathon.devpost.com"
              keyboardType="url"
              value={regUrl}
              onChangeText={setRegUrl}
            />

            <Input
              label="Official Website"
              placeholder="https://sih.gov.in"
              keyboardType="url"
              value={officialUrl}
              onChangeText={setOfficialUrl}
            />

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Prize Pool"
                  placeholder="₹1,00,000"
                  value={prizePool}
                  onChangeText={setPrizePool}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Location"
                  placeholder="New Delhi / Online"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            {/* Watchlist Checkbox */}
            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityState={{ checked: saveToWatchlist }}
              onPress={() => {
                haptics.light();
                setSaveToWatchlist(!saveToWatchlist);
              }}
              style={styles.watchlistRow}
            >
              <Text style={styles.checkboxIcon}>{saveToWatchlist ? '☑️' : '◻️'}</Text>
              <Text style={[styles.watchlistText, { color: theme.text }]}>
                📌 Save for later (add to Watchlist)
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reminders Presets */}
        <Text style={[styles.label, { color: theme.text }]}>Reminder (for you only)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {REMINDER_PRESETS.map((rem) => {
            const isSelected = selectedReminderOffset === rem.offset;
            return (
              <TouchableOpacity
                key={rem.offset}
                onPress={() => {
                  haptics.light();
                  setSelectedReminderOffset(isSelected ? null : rem.offset);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? theme.primaryForeground : theme.text },
                  ]}
                >
                  {rem.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Assignment */}
        <View style={[styles.switchRow, { borderColor: theme.border, marginTop: SPACING.md }]}>
          <Text style={[styles.switchLabel, { color: theme.text }]}>Assign to entire group</Text>
          <Switch
            value={assignedToAll}
            onValueChange={setAssignedToAll}
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        </View>

        {!assignedToAll && group && (
          <View style={styles.memberChecklist}>
            {group.members.map((member) => {
              const isChecked = assignedTo.includes(member.id);
              return (
                <TouchableOpacity
                  key={member.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isChecked }}
                  onPress={() => {
                    haptics.light();
                    if (isChecked) {
                      setAssignedTo(assignedTo.filter((id) => id !== member.id));
                    } else {
                      setAssignedTo([...assignedTo, member.id]);
                    }
                  }}
                  style={[styles.memberRow, { borderColor: theme.border }]}
                >
                  <Avatar user={member} size={28} />
                  <Text style={[styles.memberName, { color: theme.text }]}>{member.name}</Text>
                  <Text style={styles.checkGlyph}>{isChecked ? '✓' : ''}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Action Buttons */}
        <Button
          title={eventId ? 'Save Changes' : 'Create Event'}
          onPress={handleSubmit}
          loading={createMutation.isPending || updateMutation.isPending}
          variant="primary"
          size="lg"
          style={styles.saveBtn}
        />

        {eventId && (
          <Button
            title="Delete Event"
            onPress={handleDelete}
            loading={deleteMutation.isPending}
            variant="destructive"
            size="md"
            style={styles.deleteBtn}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  cancelTouch: {
    minWidth: 60,
    minHeight: 44,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl * 2,
  },
  label: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  chipsScroll: {
    marginBottom: SPACING.md,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginRight: SPACING.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: TYPOGRAPHY.xs,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  priorityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    minHeight: 44,
    gap: 6,
  },
  priorityIcon: {
    fontSize: 16,
  },
  priorityLabel: {
    fontSize: TYPOGRAPHY.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginVertical: SPACING.sm,
  },
  switchLabel: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '500',
  },
  dateSummary: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  dateText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '600',
    marginBottom: 2,
  },
  dateVal: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '700',
  },
  hackathonSection: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginVertical: SPACING.md,
  },
  hackSectionTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  twoCol: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  watchlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    minHeight: 44,
  },
  checkboxIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  watchlistText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
  },
  memberChecklist: {
    marginVertical: SPACING.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    minHeight: 44,
  },
  memberName: {
    flex: 1,
    marginLeft: SPACING.md,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '500',
  },
  checkGlyph: {
    color: '#30A46C',
    fontSize: 18,
    fontWeight: '700',
    marginRight: SPACING.sm,
  },
  saveBtn: {
    marginTop: SPACING.xl,
  },
  deleteBtn: {
    marginTop: SPACING.sm,
  },
});

