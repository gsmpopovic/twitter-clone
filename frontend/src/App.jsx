import { Navigate, Route, Routes } from "react-router-dom";
import { useState } from "react";

import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/auth/login/LoginPage";
import SignUpPage from "./pages/auth/signup/SignUpPage";
import NotificationPage from "./pages/notification/NotificationPage";
import ProfilePage from "./pages/profile/ProfilePage";
import DashboardPage from "./pages/dashboard/DashboardPage";

import Sidebar from "./components/common/Sidebar";
import RightPanel from "./components/common/RightPanel";
import { Toaster } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "./components/common/LoadingSpinner";

// Import the icons from react-icons
import { FiMenu, FiX } from "react-icons/fi";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Toggle sidebar for mobile
  const { data: authUser, isLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.error) return null;
        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row max-w-6xl mx-auto">
      {/* Toggle button for Sidebar in mobile view */}
      {authUser && (
        <button
          className="lg:hidden p-4 text-2xl"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle Sidebar"
        >
          {isSidebarOpen ? <FiX /> : <FiMenu />}
        </button>
      )}

      {/* Sidebar for desktop, overlay for mobile */}
      {authUser && (
        <>
          <div
            className={`lg:flex ${isSidebarOpen ? "fixed inset-0 z-50 bg-gray-800 bg-opacity-75" : "hidden"}`}
            onClick={() => setIsSidebarOpen(false)}
          >
            <Sidebar />
          </div>
          <div className={`lg:hidden ${isSidebarOpen ? "fixed inset-0 z-40" : "hidden"}`} onClick={() => setIsSidebarOpen(false)} />
        </>
      )}

      {/* Main content */}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
          <Route path="/notifications" element={authUser ? <NotificationPage /> : <Navigate to="/login" />} />
          <Route path="/profile/:username" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/dashboard" element={authUser ? <DashboardPage /> : <Navigate to="/login" />} />
        </Routes>
      </div>

      {/* Right Panel only shows on larger screens */}
      {authUser && <RightPanel className="hidden lg:flex" />}

      <Toaster />
    </div>
  );
}

export default App;
