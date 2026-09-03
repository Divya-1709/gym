import React, { useState, FormEvent } from 'react';
import bgImage from '../assets/login-bg.jpg';
import logo from '../assets/logo.jpeg';

// ✅ Import Common API URL
import { API_URI } from "../api/api";

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URI}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        onLogin();
      } else {
        setError(data.message || 'Invalid username or password');
      }
    } catch (err) {
      console.error(err);
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="h-screen w-full flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      {/* Login Card */}
      <div className="relative z-10 bg-[#111827]/90 text-white shadow-2xl rounded-2xl p-8 w-full max-w-md">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center mb-6">
          <img
            src={logo}
            alt="FitPass Logo"
            className="w-16 h-16 mb-2 rounded-full shadow-lg border border-yellow-400"
          />
        </div>

        <h1 className="text-center text-yellow-400 mb-6 text-xl">
          H4 Fitness Studio Semmancheri
        </h1>

        <p className="text-center text-gray-400 mb-6 text-sm">
          Login to continue to your dashboard
        </p>

        {error && (
          <div className="text-red-400 text-center mb-4 bg-red-900/30 py-2 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-300 mb-1 text-sm">Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-[#1F2937] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1 text-sm">Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#1F2937] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${
              loading ? 'bg-yellow-300' : 'bg-yellow-400 hover:bg-yellow-500'
            } text-black py-2 font-semibold rounded-lg transition-all`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          Don’t have an account?{' '}
          <span className="text-yellow-400">Ask admin to create one.</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
