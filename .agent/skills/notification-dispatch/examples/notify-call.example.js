/**
 * examples/notify-call.example.js
 * Example of multi-channel notification dispatch in SyncMate.
 */
import * as notificationService from '../../src/services/notification.service.js';

export async function exampleNotifyEventCreated(event, actor) {
  // Target group members, excluding the creator
  const recipientIds = event.assignedToAll
    ? ['user-b-id', 'user-c-id']
    : event.assignedTo.filter(id => id !== actor.id);

  await notificationService.notifyUsers({
    userIds: recipientIds,
    groupId: event.groupId,
    actorId: actor.id,
    type: 'event_created',
    title: `New event: ${event.title}`,
    body: `${actor.name} added it for ${new Date(event.startAt).toLocaleString()}`,
    data: {
      eventId: event.id,
      deepLink: `syncmate://event/${event.id}`
    }
  });
}

