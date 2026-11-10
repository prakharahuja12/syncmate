import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
      groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
      deepLink: { type: String, default: null },
    },
    readAt: {
      type: Date,
      default: null,
    },
    channels: {
      push: {
        type: String,
        enum: ['sent', 'failed', 'skipped'],
        default: 'skipped',
      },
      email: {
        type: String,
        enum: ['sent', 'failed', 'skipped'],
        default: 'skipped',
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
// TTL index: delete notifications after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const Notification = mongoose.model('Notification', notificationSchema);

