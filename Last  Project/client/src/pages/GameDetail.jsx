import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { gameApi, groupApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

function GameDetail() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [game, setGame] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [gameId]);

  const fetchData = async () => {
    try {
      const [gameResponse, groupsResponse] = await Promise.all([
        gameApi.getOne(gameId),
        groupApi.getByGame(gameId)
      ]);
      setGame(gameResponse.data);
      setGroups(groupsResponse.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const response = await groupApi.create({
        name: newGroupName,
        game_id: parseInt(gameId)
      });

      // Navigate to the new group's chat
      navigate(`/group/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating group');
      setCreating(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await groupApi.join(groupId);
      navigate(`/group/${groupId}`);
    } catch (err) {
      if (err.response?.data?.error === 'Already a member of this group') {
        // Already a member, just navigate
        navigate(`/group/${groupId}`);
      } else {
        alert(err.response?.data?.error || 'Error joining group');
      }
    }
  };

  const formatTimeLeft = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m left`;
    }
    return `${diffMins}m left`;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="game-detail">
      <Link to={`/platform/${game?.platform_id}`} className="back-link">
        &larr; Back to Games
      </Link>

      <div className="game-header">
        <h1>{game?.title}</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          Create Group
        </button>
      </div>

      <div className="groups-list">
        {groups.length === 0 ? (
          <div className="no-groups">
            <p>No active groups for this game.</p>
            <p>Be the first to create one!</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.id} className="group-card">
              <div className="group-info">
                <h3>{group.name}</h3>
                <p>
                  Created by {group.creator_name} | {formatTimeLeft(group.expires_at)}
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => handleJoinGroup(group.id)}
              >
                {group.creator_id === user?.id ? 'Open' : 'Join'}
              </button>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <h2>Create New Group</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleCreateGroup}>
            <div className="form-group">
              <label htmlFor="groupName">Group Name</label>
              <input
                type="text"
                id="groupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g., Looking for raid team"
                required
                minLength={3}
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default GameDetail;
