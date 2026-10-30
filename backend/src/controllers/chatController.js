import Conversation from '../models/Conversation.js';
import Document from '../models/Document.js';
import ai from '../services/aiClient.js';

export async function listConversations(req, res, next) {
  try {
    const items = await Conversation.find({ owner: req.user.id })
      .select('title documentIds updatedAt')
      .sort({ updatedAt: -1 });
    res.json({ conversations: items });
  } catch (e) {
    next(e);
  }
}

export async function getConversation(req, res, next) {
  try {
    const item = await Conversation.findOne({ _id: req.params.id, owner: req.user.id });
    if (!item) return res.status(404).json({ message: 'Conversation not found' });
    res.json({ conversation: item });
  } catch (e) {
    next(e);
  }
}

export async function askQuestion(req, res, next) {
  try {
    const { question, documentIds = [], conversationId } = req.body;
    if (!question?.trim()) return res.status(400).json({ message: 'Question is required' });
    if (!Array.isArray(documentIds) || !documentIds.length) {
      return res.status(400).json({ message: 'Select at least one document' });
    }

    const docs = await Document.find({ _id: { $in: documentIds }, owner: req.user.id, status: 'ready' });
    if (docs.length !== new Set(documentIds).size) {
      return res.status(400).json({ message: 'One or more documents are unavailable' });
    }

    let conversation = conversationId
      ? await Conversation.findOne({ _id: conversationId, owner: req.user.id })
      : null;
    if (conversationId && !conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (!conversation) {
      conversation = await Conversation.create({
        owner: req.user.id,
        documentIds: docs.map((d) => d._id),
        title: question.trim().slice(0, 70),
      });
    }

    const history = conversation.messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
    const result = await ai.post('/api/v1/chat', {
      owner_id: String(req.user.id),
      document_ids: docs.map((d) => String(d._id)),
      question,
      history,
    });

    conversation.messages.push({ role: 'user', content: question });
    conversation.messages.push({
      role: 'assistant',
      content: result.data.answer,
      citations: result.data.citations.map((c) => ({ ...c })),
    });
    conversation.documentIds = docs.map((d) => d._id);
    await conversation.save();

    res.json({ conversationId: conversation._id, answer: result.data.answer, citations: result.data.citations });
  } catch (e) {
    next(e);
  }
}

export async function deleteConversation(req, res, next) {
  try {
    const conversation = await Conversation.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    res.json({ message: 'Conversation deleted' });
  } catch (e) {
    next(e);
  }
}

