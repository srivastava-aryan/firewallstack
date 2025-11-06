import { Navbar } from "../components/navbar";
import DataList from "../components/policytable";
import ChatbotUI from "../components/ChatbotUI"; // 👈 Import chatbot

function Dashboard() {
  return (
    <div className="bg-gray-200 min-h-screen flex flex-col relative">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 p-4">
        <DataList />
      </div>

      {/* 💬 Floating Chatbot (bottom-right corner) */}
      <div className="fixed bottom-6 right-6 z-50">
        <ChatbotUI />
      </div>
    </div>
  );
}

export default Dashboard;
