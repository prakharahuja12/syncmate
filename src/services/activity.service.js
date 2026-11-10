import { Activity } from '../models/Activity.js';
import { serializeActivity } from '../utils/serializers.js';

/**
 * Lists paginated activity logs for a group.
 *
 * @param {object} params
 * @param {string} params.groupId
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @returns {Promise<Array<object>>}
 */
export async function listGroupActivity({ groupId, page = 1, limit = 20 }) {
  const skip = (page - 1) * limit;

  const activities = await Activity.find({ groupId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('actorId', 'name avatarColor');

  return activities.map(serializeActivity);
}

