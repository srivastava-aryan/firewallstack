import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/config";
import { onAuthStateChanged, signOut } from "firebase/auth";

function Navbar() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [initials, setInitials] = useState("U");
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Get display name from Firebase user
        const fullName = currentUser.displayName || currentUser.email || "User";
        setDisplayName(fullName);

        // Generate initials
        if (currentUser.displayName) {
          const names = currentUser.displayName.split(" ");
          const firstInitial = names[0]?.charAt(0).toUpperCase() || "";
          const lastInitial = names[1]?.charAt(0).toUpperCase() || "";
          setInitials(firstInitial + lastInitial);
        } else {
          // Use first letter of email if no display name
          setInitials(currentUser.email?.charAt(0).toUpperCase() || "U");
        }
      } else {
        navigate("/login");
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [navigate]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Add your refresh logic here
    const db = window.localStorage;
    db.setItem("id", " ");

    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("token");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg border-b border-gray-700">
      <div className="max-w-screen-2xl mx-auto px-6 flex items-center h-16">
        {/* Logo */}
        <div className="flex items-center">
          <span className="font-bold text-white text-2xl tracking-widest bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            DFX
          </span>
        </div>

        {/* Navigation Links */}
        <ul className="flex space-x-1 ml-12">
          <li className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md cursor-pointer transition-all duration-200 text-sm font-medium">
            Dashboard
          </li>
          <li className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md cursor-pointer transition-all duration-200 text-sm font-medium">
            Inventory
          </li>
          <li className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md cursor-pointer transition-all duration-200 text-sm font-medium">
            Topology
          </li>
          <li className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md cursor-pointer transition-all duration-200 text-sm font-medium">
            Security
          </li>
          <li className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md cursor-pointer transition-all duration-200 text-sm font-medium">
            Routing
          </li>
          <li className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md cursor-pointer transition-all duration-200 text-sm font-medium">
            Auth Settings
          </li>
          <li className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md cursor-pointer transition-all duration-200 text-sm font-medium">
            Catalogue
          </li>
          <li className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md cursor-pointer transition-all duration-200 text-sm font-medium">
            Plugins
          </li>
        </ul>

        {/* Right Side Actions */}
        <div className="ml-auto flex items-center space-x-4">
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-gray-300 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 text-sm font-medium"
            aria-label="Logout"
          >
            Logout
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200 group"
            aria-label="Refresh"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </button>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-600"></div>

          {/* User Section */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">{initials}</span>
            </div>
            <span className="text-white font-medium text-sm">{displayName}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

export { Navbar };
