import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addDays,
  subDays,
  parseISO,
} from 'date-fns';
import { Screen } from '../../components/common/Screen';
import { useTheme } from '../../theme/useTheme';
import { useUiStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { RADIUS, SPACING, TYPOGRAPHY, CATEGORY_COLORS } from '../../theme/tokens';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Card } from '../../components/ui/Card';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { CategoryBadge } from '../../components/common/CategoryBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { eventsApi } from '../events/api';
import { EventItem } from '../../types/api';
import { openExternalLink } from '../../lib/links';
import { formatTime, computeIsUrgent } from '../../lib/dates';
import { haptics } from '../../lib/haptics';

export const CalendarScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const currentGroupId = useAuthStore((s) => s.group?.id);
  const activeView = useUiStore((s) => s.activeCalendarView);
  const setActiveView = useUiStore((s) => s.setActiveCalendarView);
  const tapHackathonOpensLink = useUiStore((s) => s.tapHackathonOpensLinkDirectly);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Compute date range for query based on active month
  const rangeStart = startOfWeek(startOfMonth(currentDate)).toISOString();
  const rangeEnd = endOfWeek(endOfMonth(currentDate)).toISOString();

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['events', currentGroupId, rangeStart, rangeEnd],
    queryFn: () =>
      eventsApi.getEvents(currentGroupId!, {
        from: rangeStart,
        to: rangeEnd,
      }),
    enabled: !!currentGroupId,
  });

  // Calendar month days grid
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Events filtered for selected day in month view
  const selectedDayEvents = useMemo(() => {
    return events.filter((e) => isSameDay(parseISO(e.startAt), selectedDate));
  }, [events, selectedDate]);

  const handleEventPress = (event: EventItem) => {
    haptics.light();
    const isHack = event.category === 'hackathon' || event.category === 'competition';
    if (tapHackathonOpensLink && isHack && event.primaryUrl) {
      openExternalLink(event.primaryUrl);
    } else {
      navigation.navigate('EventDetails', { eventId: event.id, initialEvent: event });
    }
  };

  const handlePrev = () => {
    haptics.light();
    if (activeView === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (activeView === 'week') setSelectedDate(subDays(selectedDate, 7));
    else setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNext = () => {
    haptics.light();
    if (activeView === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (activeView === 'week') setSelectedDate(addDays(selectedDate, 7));
    else setSelectedDate(addDays(selectedDate, 1));
  };

  const handleToday = () => {
    haptics.medium();
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  return (
    <Screen>
      {/* Top Controls Header */}
      <View style={styles.topHeader}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={handlePrev} style={styles.navBtn}>
            <Text style={[styles.navArrow, { color: theme.text }]}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleToday} style={styles.titleTouch}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {format(activeView === 'month' ? currentDate : selectedDate, 'MMMM yyyy')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNext} style={styles.navBtn}>
            <Text style={[styles.navArrow, { color: theme.text }]}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controlsRow}>
          <SegmentedControl
            options={[
              { label: 'Month', value: 'month' },
              { label: 'Week', value: 'week' },
              { label: 'Day', value: 'day' },
            ]}
            selectedValue={activeView}
            onValueChange={setActiveView}
          />
        </View>
      </View>

      {/* Main View Area */}
      {activeView === 'month' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollArea}>
          {/* Day of Week labels */}
          <View style={styles.weekLabelsRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <Text key={idx} style={[styles.weekDayLabel, { color: theme.muted }]}>
                {day}
              </Text>
            ))}
          </View>

          {/* Month Days Grid */}
          <View style={styles.daysGrid}>
            {monthDays.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              // Dots for events on this day
              const dayEvents = events.filter((e) => isSameDay(parseISO(e.startAt), day));

              return (
                <TouchableOpacity
                  key={day.toISOString()}
                  accessibilityRole="button"
                  onPress={() => {
                    haptics.light();
                    setSelectedDate(day);
                  }}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: isSelected ? `${theme.primary}25` : 'transparent',
                      borderColor: isSelected ? theme.primary : 'transparent',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.dayNumberContainer,
                      isToday && { backgroundColor: theme.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        {
                          color: isToday
                            ? theme.primaryForeground
                            : isCurrentMonth
                            ? theme.text
                            : theme.muted,
                          fontWeight: isToday || isSelected ? '700' : '400',
                        },
                      ]}
                    >
                      {format(day, 'd')}
                    </Text>
                  </View>

                  {/* Category dots */}
                  <View style={styles.dotsRow}>
                    {dayEvents.slice(0, 3).map((e, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.dot,
                          { backgroundColor: CATEGORY_COLORS[e.category] || theme.primary },
                        ]}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <Text style={[styles.plusDot, { color: theme.muted }]}>+</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected Day Agenda Section */}
          <View style={styles.agendaHeader}>
            <Text style={[styles.agendaTitle, { color: theme.text }]}>
              {format(selectedDate, 'EEEE, MMM d')}
            </Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('EventForm', { initialDate: selectedDate.toISOString() })
              }
              style={styles.addSmallBtn}
            >
              <Text style={{ color: theme.primary, fontWeight: '600', fontSize: TYPOGRAPHY.sm }}>
                ＋ Add
              </Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <Skeleton height={80} style={{ marginVertical: SPACING.xs }} />
          ) : selectedDayEvents.length === 0 ? (
            <EmptyState
              title="No events today"
              description="Tap ＋ to schedule an event, meeting, or hackathon"
              actionTitle="Create Event"
              onAction={() =>
                navigation.navigate('EventForm', { initialDate: selectedDate.toISOString() })
              }
            />
          ) : (
            selectedDayEvents.map((event) => {
              const isUrgent = computeIsUrgent(event);
              const isCompleted = event.status === 'completed';

              return (
                <Card
                  key={event.id}
                  isUrgent={isUrgent}
                  onPress={() => handleEventPress(event)}
                  style={styles.eventCard}
                >
                  <View style={styles.eventCardHeader}>
                    <CategoryBadge category={event.category} />
                    <PriorityBadge priority={event.priority} showLabel={false} />
                  </View>

                  <Text
                    style={[
                      styles.eventTitle,
                      {
                        color: theme.text,
                        textDecorationLine: isCompleted ? 'line-through' : 'none',
                        opacity: isCompleted ? 0.6 : 1,
                      },
                    ]}
                  >
                    {event.title}
                  </Text>

                  <View style={styles.eventFooter}>
                    <Text style={[styles.eventTime, { color: theme.muted }]}>
                      {event.allDay ? 'All Day' : `${formatTime(event.startAt)} – ${formatTime(event.endAt)}`}
                    </Text>
                    {event.primaryUrl && (
                      <Text style={{ color: theme.primary, fontSize: TYPOGRAPHY.xs, fontWeight: '700' }}>
                        🔗 Link ↗
                      </Text>
                    )}
                  </View>
                </Card>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Week View */}
      {activeView === 'week' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollArea}>
          <Text style={[styles.agendaTitle, { color: theme.text, marginBottom: SPACING.md }]}>
            Week of {format(startOfWeek(selectedDate), 'MMM d, yyyy')}
          </Text>
          {eachDayOfInterval({
            start: startOfWeek(selectedDate),
            end: endOfWeek(selectedDate),
          }).map((day) => {
            const dayEvents = events.filter((e) => isSameDay(parseISO(e.startAt), day));
            return (
              <View key={day.toISOString()} style={styles.weekDayBlock}>
                <Text style={[styles.weekDayBlockHeader, { color: theme.primary }]}>
                  {format(day, 'EEE • MMM d')}
                </Text>
                {dayEvents.length === 0 ? (
                  <Text style={[styles.noEventsText, { color: theme.muted }]}>No events</Text>
                ) : (
                  dayEvents.map((event) => (
                    <Card
                      key={event.id}
                      onPress={() => handleEventPress(event)}
                      isUrgent={computeIsUrgent(event)}
                      style={styles.eventCard}
                    >
                      <Text style={[styles.eventTitle, { color: theme.text }]}>{event.title}</Text>
                      <Text style={[styles.eventTime, { color: theme.muted }]}>
                        {formatTime(event.startAt)} • {event.category}
                      </Text>
                    </Card>
                  ))
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Day View */}
      {activeView === 'day' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollArea}>
          <Text style={[styles.agendaTitle, { color: theme.text, marginBottom: SPACING.md }]}>
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </Text>
          {selectedDayEvents.length === 0 ? (
            <EmptyState
              title="Nothing scheduled"
              description="You have no tasks or events for this day"
              actionTitle="Schedule Event"
              onAction={() =>
                navigation.navigate('EventForm', { initialDate: selectedDate.toISOString() })
              }
            />
          ) : (
            selectedDayEvents.map((event) => (
              <Card
                key={event.id}
                onPress={() => handleEventPress(event)}
                isUrgent={computeIsUrgent(event)}
                style={styles.eventCard}
              >
                <View style={styles.eventCardHeader}>
                  <CategoryBadge category={event.category} />
                  <PriorityBadge priority={event.priority} />
                </View>
                <Text style={[styles.eventTitle, { color: theme.text }]}>{event.title}</Text>
                <Text style={[styles.eventTime, { color: theme.muted }]}>
                  {event.allDay ? 'All Day' : `${formatTime(event.startAt)} – ${formatTime(event.endAt)}`}
                </Text>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  topHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  navBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrow: {
    fontSize: 28,
    fontWeight: '300',
  },
  titleTouch: {
    minHeight: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
  },
  controlsRow: {
    marginTop: 2,
  },
  scrollArea: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl * 2,
  },
  weekLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  weekDayLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: SPACING.xs,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginVertical: 1,
  },
  dayNumberContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: TYPOGRAPHY.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 6,
    gap: 2,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  plusDot: {
    fontSize: 8,
    lineHeight: 8,
  },
  agendaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  agendaTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '700',
  },
  addSmallBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  eventCard: {
    padding: SPACING.md,
    marginVertical: SPACING.xs,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  eventTime: {
    fontSize: TYPOGRAPHY.xs,
  },
  weekDayBlock: {
    marginBottom: SPACING.lg,
  },
  weekDayBlockHeader: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  noEventsText: {
    fontSize: TYPOGRAPHY.xs,
    fontStyle: 'italic',
    paddingVertical: SPACING.xs,
  },
});

