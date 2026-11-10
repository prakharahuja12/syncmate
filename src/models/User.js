import mongoose from 'mongoose';

const pushTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, trim: true },
    platform: { type: String, enum: ['web', 'ios', 'android'], required: true },
    deviceId: { type: String, required: true, trim: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const googlePreferencesSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ['all', 'categories', 'assigned_to_me', 'none'],
      default: 'all',
    },
    categories: { type: [String], default: [] },
    priorities: { type: [String], default: [] },
    includeRegistrationDeadlines: { type: Boolean, default: false },
  },
  { _id: false }
);

const googleSchema = new mongoose.Schema(
  {
    connected: { type: Boolean, default: false },
    email: { type: String, default: null },
    refreshTokenEnc: { type: String, default: null },
    calendarId: { type: String, default: 'primary' },
    syncPreferences: { type: googlePreferencesSchema, default: () => ({}) },
    lastSyncAt: { type: Date, default: null },
  },
  { _id: false }
);

const userSettingsSchema = new mongoose.Schema(
  {
    theme: {
      type: String,
      enum: ['system', 'light', 'dark'],
      default: 'system',
    },
    emailNotifications: { type: Boolean, default: false },
    pushNotifications: { type: Boolean, default: true },
    inAppNotifications: { type: Boolean, default: true },
    defaultReminderOffsets: { type: [Number], default: [60] },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    avatarColor: {
      type: String,
      required: true,
      trim: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
      trim: true,
    },
    settings: {
      type: userSettingsSchema,
      default: () => ({}),
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
      index: true,
    },
    pushTokens: {
      type: [pushTokenSchema],
      default: [],
    },
    google: {
      type: googleSchema,
      default: () => ({}),
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
        delete ret.passwordHash;
        if (ret.google?.refreshTokenEnc) {
          delete ret.google.refreshTokenEnc;
        }
        return ret;
      },
    },
  }
);

export const User = mongoose.model('User', userSchema);
