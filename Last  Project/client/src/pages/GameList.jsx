import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { gameApi, platformApi } from '../services/api';

function GameList() {
  const { platformId } = useParams();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [platformId]);

  const fetchData = async () => {
    try {
      const [gamesResponse, platformResponse] = await Promise.all([
        gameApi.getByPlatform(platformId),
        platformApi.getOne(platformId)
      ]);
      setGames(gamesResponse.data);
      setPlatform(platformResponse.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading games...</div>;
  }

  return (
    <div className="game-list">
      <Link to="/" className="back-link">&larr; Back to Platforms</Link>
      <h1>{platform?.name} Games</h1>
      <div className="games-grid">
        {games.map((game) => (
          <div
            key={game.id}
            className="game-card"
            onClick={() => navigate(`/game/${game.id}`)}
          >
            <h3>{game.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GameList;
