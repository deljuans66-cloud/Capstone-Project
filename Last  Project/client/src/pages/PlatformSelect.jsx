import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { platformApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

function PlatformSelect() {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const fetchPlatforms = async () => {
    try {
      const response = await platformApi.getAll();
      setPlatforms(response.data);
    } catch (err) {
      console.error("Error fetching platforms:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformSelect = (platformId) => {
    if (isAuthenticated) {
      navigate(`/platform/${platformId}`);
    } else {
      localStorage.setItem("selectedPlatform", platformId);
      navigate("/auth");
    }
  };

  if (loading) {
    return <div className="loading">Loading platforms...</div>;
  }

  return (
    <div className="platform-select">
      <h1>Welcome to Universal Gaming Hub</h1>
      <p>Select your gaming platform to find players</p>
      <div className="platform-grid">
        {platforms.map((platform) => (
          <button
            key={platform.id}
            className="platform-btn"
            onClick={() => handlePlatformSelect(platform.id)}
          >
            {platform.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default PlatformSelect;
