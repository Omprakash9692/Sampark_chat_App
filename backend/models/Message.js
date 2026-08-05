import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["text", "image", "file", "audio", "call"],
      default: "text",
    },
    attachmentUrl: {
      type: String,
      default: "",
    },
    attachmentName: {
      type: String,
      default: "",
    },
    attachmentSize: {
      type: String,
      default: "",
    },
    attachmentDuration: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },

    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        readAt: {
          type: Date,
          default: Date.now,
        }
      }
    ],

    deliveredTo: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        deliveredAt: {
          type: Date,
          default: Date.now,
        }
      }
    ],
    blockedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    isForwarded: {
      type: Boolean,
      default: false,
    },
    replyToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    edited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    emojiReactions: [
      {
        emoji: {
          type: String,
          required: true,
        },
        userIds: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          }
        ]
      }
    ]
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
