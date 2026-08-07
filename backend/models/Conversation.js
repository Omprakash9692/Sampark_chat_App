import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    name: {
      type: String,
      default: "", // Only for group chats
    },
    avatar: {
      type: String,
      default: "", // Only for group chats
    },
    description: {
      type: String,
      default: "", // Only for group chats
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      }
    ],
    adminIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    pinnedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    archivedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    favoriteBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    unreadFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    pinnedMessages: [
      {
        message: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Message",
          required: true,
        },
        pinnedUntil: {
          type: Date,
          default: null,
        },
      }
    ],
    isBlocked: {
      type: Boolean,
      default: false,
    },
    permissions: {
      sendMessages: {
        type: Boolean,
        default: true,
      },
      addMembers: {
        type: Boolean,
        default: true,
      },
      approveMembers: {
        type: Boolean,
        default: false,
      },
    },
    joinRequests: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        requestedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Tracks the timestamp when each participant joined the group.
    // Key = userId string, Value = Date they were added/joined.
    memberJoinedAt: {
      type: Map,
      of: Date,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
