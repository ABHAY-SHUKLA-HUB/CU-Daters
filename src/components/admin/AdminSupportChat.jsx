import React, { useState, useEffect, useRef } from 'react';
import { X, Send, CheckCircle, Clock } from 'lucide-react';
import { io } from 'socket.io-client';
import './AdminSupportChat.css';

const AdminSupportChat = ({ request, onClose, onUpdate }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    connectToSocket();
  }, [request._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/support/request/${request._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setMessages(data.data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectToSocket = () => {
    try {
      const token = localStorage.getItem('authToken');
      
      const supportSocket = io('http://localhost:5000/support', {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      supportSocket.on('connect', () => {
        console.log('✅ Admin connected to support socket');
        supportSocket.emit('join_support_request', { requestId: request._id });
      });

      supportSocket.on('support_message', (data) => {
        console.log('📨 New message:', data);
        setMessages(prev => [...prev, data]);
      });

      supportSocket.on('user_joined_support', (data) => {
        console.log('👤 User joined:', data);
      });

      supportSocket.on('disconnect', () => {
        console.log('⚠️ Disconnected from support socket');
      });

      supportSocket.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });

      setSocket(supportSocket);
    } catch (error) {
      console.error('Failed to connect to socket:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/support/request/${request._id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: inputMessage.trim() })
      });

      if (response.ok) {
        setInputMessage('');
        const newMessage = {
          _id: Date.now(),
          sender_type: 'admin',
          message: inputMessage.trim(),
          sender_name: 'You',
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleClose = async () => {
    const response = await fetch(`/api/admin/support/request/${request._id}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ notes: '' })
    });

    if (response.ok) {
      onUpdate();
      onClose();
    }
  };

  return (
    <div className="support-chat-modal-overlay" onClick={onClose}>
      <div className="support-chat-modal" onClick={e => e.stopPropagation()}>
        <div className="chat-header">
          <div className="chat-header-info">
            <h3>{request.user_id?.name}</h3>
            <p>{request.category}</p>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="chat-status-bar">
          <div className="status-item">
            <CheckCircle size={16} />
            <span>Category: {request.category}</span>
          </div>
          {request.admin_id && (
            <div className="status-item">
              <span>Admin: {request.admin_id?.name}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="chat-loading">Loading messages...</div>
        ) : (
          <>
            <div className="chat-messages">
              {messages.map((msg, idx) => (
                <div
                  key={msg._id || idx}
                  className={`chat-message ${msg.sender_type}`}
                >
                  <div className="message-bubble">
                    <strong className="sender-name">
                      {msg.sender_type === 'admin' ? 'You (Admin)' : msg.sender_name || request.user_id?.name}
                    </strong>
                    <p>{msg.message}</p>
                    <span className="message-time">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {request.status === 'accepted' && (
              <div className="chat-input-area">
                <div className="input-group">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="message-input"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="send-btn"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            )}

            {request.status === 'accepted' && (
              <div className="chat-footer">
                <button onClick={handleClose} className="close-request-btn">
                  Close Request
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminSupportChat;
