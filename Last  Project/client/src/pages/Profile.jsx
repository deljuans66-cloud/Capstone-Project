import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { userApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await userApi.getOne(user.id);
      setProfile(response.data);
      setFormData({
        username: response.data.username,
        email: response.data.email,
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const updates = {};
      if (formData.username !== profile.username) {
        updates.username = formData.username;
      }
      if (formData.email !== profile.email) {
        updates.email = formData.email;
      }

      if (Object.keys(updates).length === 0) {
        setError("No changes to save");
        setSaving(false);
        return;
      }

      const response = await userApi.update(user.id, updates);

      updateUser({
        ...user,
        username: response.data.user.username,
        email: response.data.user.email,
      });

      setProfile(response.data.user);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(err.response?.data?.error || "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      <Link to="/" className="back-link">
        &larr; Back to Home
      </Link>
      <h1>Your Profile</h1>

      <div className="profile-info">
        <p>
          <strong>Platform:</strong> <span>{profile?.platform_name}</span>
        </p>
        <p>
          <strong>Member since:</strong>{" "}
          <span>{new Date(profile?.created_at).toLocaleDateString()}</span>
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && (
        <div className="error-message" style={{ color: "#4caf50" }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            minLength={3}
          />
        </div>

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

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%" }}
          disabled={saving}
        >
          {saving ? "Saving..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
}

export default Profile;
