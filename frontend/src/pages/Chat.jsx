import { useCallback, useEffect, useState } from 'react';
import { SendHorizonal, FileText, MessageSquare, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function Chat() {
  const [documents, setDocuments] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [docsRes, convRes] = await Promise.all([api.get('/documents'), api.get('/chat/conversations')]);
      setDocuments(docsRes.data.documents.filter((d) => d.status === 'ready'));
      setConversations(convRes.data.conversations);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load chat data');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function openConversation(conv) {
    setActiveId(conv._id);
    setError('');
    try {
      const { data } = await api.get(`/chat/conversations/${conv._id}`);
      setMessages(data.conversation.messages);
      setSelectedIds(data.conversation.documentIds.map(String));
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to open conversation');
    }
  }

  function toggleDocument(id) {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  async function send(e)
   {
    e.preventDefault();
    const text = question.trim();
    if (!text || !selectedIds.length) {
      setError('Ask a question and select at least one document.');
      return;
    }

    setBusy(true);
    setError('');
    setMessages((msgs) => [...msgs, { role: 'user', content: text }]);
    setQuestion('');

    try {
      const { data } = await api.post('/chat/ask', {
        question: text,
        documentIds: selectedIds,
        conversationId: activeId,
      });
      setMessages((msgs) => [...msgs, { role: 'assistant', content: data.answer, citations: data.citations }]);
      setActiveId(data.conversationId);
      await loadData();
    } catch (e2) {
      setError(e2.response?.data?.message || 'Failed to get an answer');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page chat-page">
      <div className="page-header">
        <div>
          <h1>AI Assistant</h1>
          <p className="muted">Ask questions grounded in your uploaded documents.</p>
        </div>
      </div>

      <div className="chat-layout">
        <aside className="chat-panels">
          <section className="chat-panel">
            <h3>Sources</h3>
            {documents.length === 0 ? (
              <p className="muted small">No ready documents yet.</p>
            ) : (
              <div className="source-list">
                {documents.map((doc) => (
                  <label key={doc._id} className={`source-item ${selectedIds.includes(doc._id) ? 'active' : ''}`}>
                    <input type="checkbox" checked={selectedIds.includes(doc._id)} onChange={() => toggleDocument(doc._id)} />
                    <FileText size={15} />
                    <span>{doc.originalName}</span>
                  </label>
                ))}
              </div>
            )}
          </section>

          <section className="chat-panel">
            <h3>History</h3>
            {conversations.length === 0 ? (
              <p className="muted small">No conversations yet.</p>
            ) : (
              <div className="history-list">
                {conversations.map((conv) => (
                  <button
                    key={conv._id}
                    className={`history-item ${activeId === conv._id ? 'active' : ''}`}
                    onClick={() => openConversation(conv)}
                  >
                    <MessageSquare size={14} />
                    <span>{conv.title}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </aside>

        <section className="chat-main">
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="empty-state">
                <MessageSquare size={26} /> Select documents, ask a question, and get cited answers.
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`message ${msg.role}`}>
                  <div className="bubble">
                    {msg.content}
                    {msg.citations?.length > 0 && (
                      <div className="citations">
                        {msg.citations.map((c, j) => (
                          <span key={j} className="citation">
                            {c.documentName || 'Document'}
                            {c.page != null && ` · p.${c.page}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {busy && (
              <div className="message assistant">
                <div className="bubble">
                  <Loader2 className="spin" size={15} /> Thinking…
                </div>
              </div>
            )}
          </div>

          {error && <div className="error-text banner">{error}</div>}

          <form className="chat-input" onSubmit={send}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={selectedIds.length ? 'Ask anything about the selected documents…' : 'Select a document first…'}
            />
            <button className="primary-btn" disabled={busy}>
              <SendHorizonal size={16} /> Send
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
