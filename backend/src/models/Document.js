import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    originalName: { type: String, required: true },
    mimeType: String,
    size: Number,
    status: { type: String, enum: ['processing', 'ready', 'failed'], default: 'processing' },
    pageCount: { type: Number, default: 0 },
    chunkCount: { type: Number, default: 0 },
    summary: { type: String, default: '' },
    error: { type: String, default: '' },
  },
  { timestamps: true }
);

documentSchema.index({ owner: 1, createdAt: -1 });

export default mongoose.model('Document', documentSchema);

