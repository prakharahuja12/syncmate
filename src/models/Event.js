import mongoose from 'mongoose';

const hackathonSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    registrationUrl: { type: String, trim: true, default: null },
    officialUrl: { type: String, trim: true, default: null },
    problemStatementUrl: { type: String, trim: true, default: null },
    registrationOpensAt: { type: Date, default: null },
    registrationClosesAt: { type: Date, default: null },
    prizePool: { type: String, trim: true, default: null },
    location: { type: String, trim: true, default: null },
    mode: { type: String, enum: ['online', 'offline', 'hybrid'], default: 'online' },
    details: { type: String, default: null },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ['event', 'task', 'deadline'],
      default: 'event',
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 5000,
    },
    category: {
      type: String,
      enum: ['hackathon', 'college', 'personal', 'meeting', 'competition', 'other'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    allDay: {
      type: Boolean,
      default: false,
    },
    url: {
      type: String,
      trim: true,
      default: null,
    },
    assignedToAll: {
      type: Boolean,
      default: true,
    },
    assignedTo: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hackathon: {
      type: hackathonSchema,
      default: null,
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

eventSchema.index({ groupId: 1, startAt: 1 });
eventSchema.index({ groupId: 1, status: 1, priority: 1 });
eventSchema.index({ groupId: 1, 'hackathon.registrationClosesAt': 1 });
eventSchema.index({ title: 'text', description: 'text', 'hackathon.name': 'text' });

export const Event = mongoose.model('Event', eventSchema);

