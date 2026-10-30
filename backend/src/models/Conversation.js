import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    citations: [{ documentId: String, documentName: String, page: Number, snippet: String }],
  },
  { _id: true, timestamps: true }
);

const conversationSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'New conversation' },
    documentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    messages: [messageSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Conversation', conversationSchema);

