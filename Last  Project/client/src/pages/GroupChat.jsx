import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { groupApi, messageApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

function GroupChat() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [error, setError] = useState('');

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchData();
    setupSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_group', groupId);
        socketRef.current.disconnect();
      }
    };
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchData = async () => {
    try {
      const [groupResponse, messagesResponse] = await Promise.all([
        groupApi.getOne(groupId),
        messageApi.getByGroup(groupId)
      ]);
      setGroup(groupResponse.data);
      setMessages(messagesResponse.data);
      setEditGroupName(groupResponse.data.name);
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err.response?.status === 404) {
        alert('Group not found or expired');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

    socketRef.current = io(socketUrl, {
      auth: { token }
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to socket');
      socketRef.current.emit('join_group', groupId);
    });

    socketRef.current.on('new_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketRef.current.on('group_updated', ({ name }) => {
      setGroup((prev) => ({ ...prev, name }));
    });

    socketRef.current.on('group_deleted', ({ reason }) => {
      if (reason === 'expired') {
        alert('This group has expired');
      } else {
        alert('This group has been deleted');
      }
      navigate('/');
    });

    socketRef.current.on('user_joined', ({ username }) => {
      console.log(`${username} joined the group`);
    });

    socketRef.current.on('user_left', ({ username }) => {
      console.log(`${username} left the group`);
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await messageApi.create({
        group_id: parseInt(groupId),
        content: newMessage.trim()
      });
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert(err.response?.data?.error || 'Error sending message');
    }
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await groupApi.update(groupId, { name: editGroupName });
      setShowEditModal(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating group');
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;

    try {
      await groupApi.leave(groupId);
      navigate(`/game/${group.game_id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Error leaving group');
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Are you sure you want to delete this group? This cannot be undone.')) return;

    try {
      await groupApi.delete(groupId);
      navigate(`/game/${group.game_id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting group');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isCreator = group?.creator_id === user?.id;

  if (loading) {
    return <div className="loading">Loading chat...</div>;
  }

  return (
    <div className="group-chat">
      <div className="chat-header">
        <div>
          <Link to={`/game/${group?.game_id}`} className="back-link">
            &larr; Back
          </Link>
          <h2>{group?.name}</h2>
        </div>
        <div className="chat-actions">
          {isCreator && (
            <>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setShowEditModal(true)}
              >
                Edit
              </button>
              <button
                className="btn btn-danger btn-small"
                onClick={handleDeleteGroup}
              >
                Delete
              </button>
            </>
          )}
          {!isCreator && (
            <button
              className="btn btn-secondary btn-small"
              onClick={handleLeaveGroup}
            >
              Leave
            </button>
          )}
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="message">
              <div className="message-header">
                <span className="message-username">{message.username}</span>
                <span className="message-time">{formatTime(message.created_at)}</span>
              </div>
              <div className="message-content">{message.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          autoFocus
        />
        <button type="submit" className="btn btn-primary">
          Send
        </button>
      </form>

      {showEditModal && (
        <Modal onClose={() => setShowEditModal(false)}>
          <h2>Edit Group Name</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleUpdateGroup}>
            <div className="form-group">
              <label htmlFor="editGroupName">Group Name</label>
              <input
                type="text"
                id="editGroupName"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                required
                minLength={3}
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default GroupChat;
