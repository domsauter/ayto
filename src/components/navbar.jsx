import { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [state, setState] = useState(false);
  const { user, profile, signOut } = useAuth();

  const navigation = [
    { title: "Staffel", path: "/" },
    { title: "Kandidaten", path: "/candidates" },
    { title: "Matching Night", path: "/matching-night" },
    { title: "Match Box", path: "/matching-box" },
    { title: "Meine Predictions", path: "/my-predictions" },
    { title: "Predictions", path: "/predictions" },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-md w-full border-b border-gray-100 sticky top-0 z-50 shadow-sm transition-all duration-300">
      <div className="items-center px-4 max-w-7xl mx-auto md:flex md:px-8">
        <div className="flex items-center justify-between py-3 md:py-4 md:block">
          <Link to="/">
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-pink-600 to-indigo-600 bg-clip-text text-transparent">AYTO Solver</h1>
          </Link>
          <div className="md:hidden z-50 relative">
            <button
              className="text-gray-500 hover:text-pink-600 outline-none p-2 rounded-md transition-colors"
              onClick={() => setState(!state)}
            >
              {state ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8h16M4 16h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay - Portal to body to avoid layout constraints */}
        {createPortal(
          <div className={`fixed inset-0 bg-white z-[60] transform transition-transform duration-300 ease-in-out md:hidden ${state ? "translate-x-0" : "translate-x-full"} overflow-y-auto`}>
            <div className="flex flex-col items-center justify-start pt-24 min-h-full space-y-8 pb-10">
              {navigation.map((item, idx) => (
                <Link
                  key={idx}
                  to={item.path}
                  className="text-2xl font-bold text-gray-900 hover:text-pink-600 transition-colors"
                  onClick={() => setState(false)}
                >
                  {item.title}
                </Link>
              ))}
              {profile?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-2xl font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                  onClick={() => setState(false)}
                >
                  Admin
                </Link>
              )}

              <div className="pt-8 w-64">
                {user ? (
                  <button
                    onClick={() => { signOut(); setState(false); }}
                    className="block w-full py-4 text-center text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg text-xl font-semibold transform hover:scale-105 transition-all"
                  >
                    Logout
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setState(false)}
                    className="block w-full py-4 text-center text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg text-xl font-semibold transform hover:scale-105 transition-all"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Desktop Menu */}
        <div className="hidden md:flex flex-1 justify-center">
          <ul className="justify-center items-center space-y-8 md:flex md:space-x-8 md:space-y-0">
            {navigation.map((item, idx) => {
              return (
                <li key={idx} className="text-gray-600 hover:text-pink-600 font-medium transition-colors">
                  <Link to={item.path}>{item.title}</Link>
                </li>
              );
            })}
            {profile?.role === 'admin' && (
              <li className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                <Link to="/admin">Admin</Link>
              </li>
            )}
          </ul>
        </div>

        <div className="hidden md:inline-block">
          {user ? (
            <button
              onClick={signOut}
              className="py-2.5 px-6 text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-lg hover:shadow-xl transition-all font-medium"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/auth"
              className="py-2.5 px-6 text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-lg hover:shadow-xl transition-all font-medium"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}