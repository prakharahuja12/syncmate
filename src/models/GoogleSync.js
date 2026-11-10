import mongoose from 'mongoose';

const googleSyncSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    googleEventId: {
      type: String,
      default: null,
    },
    calendarId: {
      type: String,
      default: 'primary',
    },
    kind: {
      type: String,
      enum: ['event', 'registrationDeadline'],
      required: true,
    },
    contentHash: {
      type: String,
      required: true,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
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

googleSyncSchema.index({ userId: 1, eventId: 1, kind: 1 }, { unique: true });

export const GoogleSync = mongoose.model('GoogleSync', googleSyncSchema);

