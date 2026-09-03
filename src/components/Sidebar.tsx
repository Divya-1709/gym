import { 
  LayoutDashboard, 
  HelpCircle, 
  RefreshCcw, 
  FileText, 
  Activity, 
  Dumbbell, 
  UserCog, 
  Cake, 
  Heart, 
  LogOut,
  Wallet
} from "lucide-react";

import logo from "../assets/logo.jpeg";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ currentPage, onNavigate, onLogout }: SidebarProps) {

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inquiry", label: "Enquiry", icon: HelpCircle },
    { id: "clients", label: "Renewal", icon: RefreshCcw },
    { id: "gymbill", label: "New Client Bill", icon: FileText },
    { id: "memberships", label: "Client Management", icon: UserCog },
    { id: "followup", label: "Client Follow-up", icon: Activity },
    { id: "trainers", label: "Trainers", icon: Dumbbell },
    { id: "birthdays", label: "Client Birthdays", icon: Cake },
    { id: "anniversaries", label: "Client Anniversaries", icon: Heart },
    { id: "packages", label: "Packages", icon: FileText },
    { id: "managebalance", label: "Manage Balance", icon: Wallet },
    { id: "expenses", label: "Expenses", icon: Wallet },
  ];

  return (
    <div className="
      bg-white text-gray-800 h-screen flex flex-col shadow-md border-r border-gray-200
      w-16 md:w-64 transition-all duration-300
    ">
      
      {/* 🔷 Logo Section */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-center md:justify-start gap-3">
        <img 
          src={logo} 
          alt="H4 Gym Logo" 
          className="w-10 h-10 rounded-full object-cover" 
        />
        <h1 className="text-lg font-bold text-black tracking-wide hidden md:block">
          Gym Management
        </h1>
      </div>

      {/* 🔷 Menu */}
      <nav className="flex-1 overflow-y-auto py-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-center md:justify-start gap-3 px-2 md:px-4 py-2 rounded-md transition-all text-sm ${
                currentPage === item.id
                  ? "bg-yellow-100 text-yellow-700 font-semibold"
                  : "text-gray-700 hover:bg-yellow-50 hover:text-yellow-600"
              }`}
            >
              <Icon size={20} />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 🔷 Footer */}
      <div className="p-4 border-t border-gray-200 flex items-center justify-center md:justify-between">
        
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center">
            <span className="text-xs font-bold text-white">A</span>
          </div>
          <span className="hidden md:inline text-gray-800 font-medium text-sm">
            admin
          </span>
        </div>

        <button
          onClick={onLogout}
          className="text-gray-500 hover:text-red-500 transition-colors ml-2 md:ml-0"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}