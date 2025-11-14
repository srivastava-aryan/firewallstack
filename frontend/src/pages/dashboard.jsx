// Dashboard.jsx
import { Navbar } from "../components/navbar";
import DataList from "../components/policytable";
import ChatbotUI from "../components/ChatbotUI";
import { useState } from "react";

function Dashboard() {
  const [selectedRow, setSelectedRow] = useState(null);

  return (
    <div className="bg-gray-200 min-h-screen flex flex-col relative">
      <Navbar />

      {/* Pass setter to table so it can set the selected row */}
      <div className="flex-1 p-4">
        <DataList onSelectRow={setSelectedRow} />
      </div>

      {/* Floating Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        <ChatbotUI selectedMetadata={selectedRow} />
      </div>
    </div>
  );
}

export default Dashboard;
