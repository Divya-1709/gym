import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Clients from "./components/Clients";
import Login from "./components/Login";
import Inquiry from "./components/Inquiry";
import TrainerPage from "./components/TrainerPage";
import Membership from "./components/ClientEdit";
import FollowUp from "./components/FollowUp";
import ComingSoon from "./components/ComingSoon";
import GymBillForm from "./components/GymBillForm";
import ClientBirthdays from "./components/ClientBirthdays";
import ClientAnniversaries from "./components/ClientAnniversaries";
import Packages from "./components/Packages";
import ManageBalance from "./components/ManageBalance"; // ✅ NEW IMPORT
import Expenses from "./components/Expenses";


function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const storedLogin = localStorage.getItem("isLoggedIn");
    if (storedLogin === "true") setIsLoggedIn(true);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem("isLoggedIn", "true");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("isLoggedIn");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "clients":
        return <Clients />;
      case "inquiry":
        return <Inquiry />;
      case "trainers":
        return <TrainerPage />;
      case "memberships":
        return <Membership />;
      case "followup":
        return <FollowUp />;
      case "gymbill":
        return <GymBillForm />;
      case "birthdays":
        return <ClientBirthdays />;
      case "anniversaries":
        return <ClientAnniversaries />;
      case "packages":
        return <Packages />;
      case "managebalance":
        return <ManageBalance />; // ✅ NEW PAGE
        case "expenses":
      return <Expenses />;
      default:
        return <ComingSoon />;
    }
  };

  if (!isLoggedIn) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      />
      <main className="flex-1 p-4 overflow-y-auto">{renderPage()}</main>
    </div>
  );
}

export default App;
