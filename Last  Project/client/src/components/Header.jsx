import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <Link to="/" className="header-logo">
        Gaming Hub
      </Link>
      <nav className="header-nav">
        {isAuthenticated ? (
          <>
            <Link to="/profile">Hi, {user?.username}</Link>
            <button className="btn btn-secondary btn-small" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/auth">Login</Link>
        )}
      </nav>
    </header>
  );
}

export default Header;
