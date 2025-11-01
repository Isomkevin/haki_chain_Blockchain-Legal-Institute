import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Scale, Menu, X, LogOut, User } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 text-teal-700 hover:text-teal-800 transition">
            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">HakiChain</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-700 hover:text-teal-600 transition font-medium">
              Home
            </Link>
            <Link to="/bounties" className="text-gray-700 hover:text-teal-600 transition font-medium">
              Explore Bounties
            </Link>
            <Link to="/documentation" className="text-gray-700 hover:text-teal-600 transition font-medium">
              Documentation
            </Link>

            {user && profile ? (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-teal-600 transition font-medium"
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-2">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{profile.full_name}</div>
                    <div className="text-gray-500 capitalize">{profile.user_type}</div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-gray-600 hover:text-red-600 transition"
                    title="Sign out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 ml-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-teal-600 transition font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-full font-medium transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-teal-600"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-4">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-teal-600 transition font-medium"
              >
                Home
              </Link>
              <Link
                to="/bounties"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-teal-600 transition font-medium"
              >
                Explore Bounties
              </Link>
              <Link
                to="/documentation"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-teal-600 transition font-medium"
              >
                Documentation
              </Link>

              {user && profile ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-700 hover:text-teal-600 transition font-medium"
                  >
                    Dashboard
                  </Link>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-sm mb-3">
                      <div className="font-medium text-gray-900">{profile.full_name}</div>
                      <div className="text-gray-500 capitalize">{profile.user_type}</div>
                    </div>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="text-red-600 hover:text-red-700 transition font-medium flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-700 hover:text-teal-600 transition font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-full font-medium transition text-center"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
