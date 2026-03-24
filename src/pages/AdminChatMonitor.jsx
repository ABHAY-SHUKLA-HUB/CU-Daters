import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminChatMonitor() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Check if user is admin
    const currentUser = localStorage.getItem('current_user');
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    try {
      const user = JSON.parse(currentUser);
      if (!['admin', 'super_admin', 'moderator'].includes(user.role)) {
        navigate('/admin-login');
        return;
      }
    } catch {
      navigate('/login');
      return;
    }

    fetchConversations();
  }, [navigate]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/monitor-chats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      setConversations(data.data || data.conversations || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setLoadingMessages(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/monitor-chats/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data.data || data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      alert(err.message || 'Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation._id);
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    const participantNames = conv.participants
      ?.map(p => p.name?.toLowerCase())
      .join(' ') || '';
    return participantNames.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-creamyWhite via-warmCream to-softPink pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="card mb-6">
          <h1 className="text-3xl font-bold gradient-text">🔍 Chat/Message Monitoring</h1>
          <p className="text-softBrown mt-1">View and search all user conversations (Read-only)</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by user name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-creamyWhite"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Chat List */}
          <div className="md:col-span-2">
            <div className="card max-h-[700px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-8 text-softBrown">
                  <p>Loading conversations...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  <p>{error}</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-softBrown">
                  <p className="text-lg">No conversations found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation._id}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`p-4 rounded-lg cursor-pointer transition ${
                        selectedConversation?._id === conversation._id
                          ? 'bg-blushPink/20 border-l-4 border-blushPink'
                          : 'hover:bg-warmCream border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-bold text-darkBrown">
                            {conversation.participants
                              ?.map((p) => p.name)
                              .join(' ↔️ ') || 'Unknown Users'}
                          </p>
                          <p className="text-sm text-softBrown truncate mt-1">
                            {conversation.lastMessage || 'No messages yet'}
                          </p>
                        </div>
                        {conversation.lastMessageTime && (
                          <p className="text-xs text-softBrown ml-2">
                            {new Date(conversation.lastMessageTime).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Detail Panel */}
          <div>
            <div className="card max-h-[700px] flex flex-col">
              {selectedConversation ? (
                <>
                  <h3 className="text-lg font-bold text-darkBrown mb-4">📋 Conversation Details</h3>
                  
                  <div className="space-y-3 mb-6">
                    <div>
                      <p className="text-xs text-softBrown">👥 Participants</p>
                      {selectedConversation.participants?.map((p) => (
                        <div key={p._id} className="mt-2">
                          <p className="font-bold text-darkBrown">{p.name}</p>
                          <p className="text-xs text-softBrown">{p.college || 'N/A'}</p>
                          <p className="text-xs text-softBrown">{p.email}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-softPink pt-4">
                    <p className="text-sm font-bold text-darkBrown mb-3">💬 Messages ({messages.length})</p>
                    <div className="overflow-auto max-h-96 space-y-2">
                      {loadingMessages ? (
                        <p className="text-center text-softBrown">Loading messages...</p>
                      ) : messages.length === 0 ? (
                        <p className="text-center text-softBrown text-sm">No messages</p>
                      ) : (
                        messages.map((msg, idx) => (
                          <div key={idx} className="bg-creamyWhite p-2 rounded text-xs">
                            <span className="font-bold text-blushPink">{msg.sender?.name || 'Unknown'}:</span>
                            <p className="text-darkBrown mt-1">{msg.text}</p>
                            <p className="text-softBrown text-[10px] mt-1">
                              {new Date(msg.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                    <p><strong>👓 Read-only:</strong> Conversation monitoring only. No edits or deletions available.</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-softBrown">
                  <p className="text-4xl mb-2">💬</p>
                  <p>Select a conversation to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
