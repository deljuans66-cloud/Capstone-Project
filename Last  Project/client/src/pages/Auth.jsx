import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, platformApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [platforms, setPlatforms] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    platform_id: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const selectedPlatform = localStorage.getItem('selectedPlatform');
      if (selectedPlatform) {
        localStorage.removeItem('selectedPlatform');
        navigate(`/platform/${selectedPlatform}`);
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const fetchPlatforms = async () => {
    try {
      const response = await platformApi.getAll();
      setPlatforms(response.data);
      // Set default platform from localStorage or first platform
      const selectedPlatform = localStorage.getItem('selectedPlatform');
      if (selectedPlatform) {
        setFormData(prev => ({ ...prev, platform_id: selectedPlatform }));
      } else if (response.data.length > 0) {
        setFormData(prev => ({ ...prev, platform_id: response.data[0].id.toString() }));
      }
    } catch (err) {
      console.error('Error fetching platforms:', err);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      if (isLogin) {
        response = await authApi.login({
          email: formData.email,
          password: formData.password
        });
      } else {
        response = await authApi.register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          platform_id: parseInt(formData.platform_id)
        });
      }

      login(response.data.user, response.data.token);

      const selectedPlatform = localStorage.getItem('selectedPlatform');
      if (selectedPlatform) {
        localStorage.removeItem('selectedPlatform');
        navigate(`/platform/${selectedPlatform}`);
      } else {
        navigate(`/platform/${response.data.user.platform_id}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>{isLogin ? 'Login' : 'Register'}</h2>

      <div className="auth-toggle">
        <button
          className={isLogin ? 'active' : ''}
          onClick={() => setIsLogin(true)}
        >
          Login
        </button>
        <button
          className={!isLogin ? 'active' : ''}
          onClick={() => setIsLogin(false)}
        >
          Register
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required={!isLogin}
              minLength={3}
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </div>

        {!isLogin && (
          <div className="form-group">
            <label htmlFor="platform_id">Platform</label>
            <select
              id="platform_id"
              name="platform_id"
              value={formData.platform_id}
              onChange={handleChange}
              required={!isLogin}
            >
              {platforms.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
        </button>
      </form>
    </div>
  );
}

export default Auth;
