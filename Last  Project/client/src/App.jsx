import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import PlatformSelect from './pages/PlatformSelect';
import Auth from './pages/Auth';
import GameList from './pages/GameList';
import GameDetail from './pages/GameDetail';
import GroupChat from './pages/GroupChat';
import Profile from './pages/Profile';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<PlatformSelect />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/platform/:platformId"
            element={
              <ProtectedRoute>
                <GameList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game/:gameId"
            element={
              <ProtectedRoute>
                <GameDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/group/:groupId"
            element={
              <ProtectedRoute>
                <GroupChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
