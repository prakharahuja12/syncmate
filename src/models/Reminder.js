import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    anchor: {
      type: String,
      enum: ['start', 'registrationClose'],
      required: true,
    },
    offsetMinutes: {
      type: Number,
      default: null,
    },
    customAt: {
      type: Date,
      default: null,
    },
    fireAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'cancelled', 'processing'],
      default: 'pending',
      index: true,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    attempts: {
      type: Number,
      default: 0,
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

reminderSchema.index({ status: 1, fireAt: 1 });

export const Reminder = mongoose.model('Reminder', reminderSchema);

