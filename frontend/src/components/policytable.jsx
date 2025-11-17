import { useEffect, useState } from "react";

function DataList({ onSelectRow }) {
  const [data, setData] = useState([]);
  const [loadingRow, setLoadingRow] = useState(null);
  const [selectedRowId, setSelectedRowId] = useState(null);

  useEffect(() => {
    fetch("https://firebott-app-eubrcqh0b5dta3ax.centralindia-01.azurewebsites.net/api/data")
      .then((res) => res.json())
      .then((data) => {
        // 🟢 Add Policy ID dynamically
        const dataWithPolicyId = data.map((item, index) => ({
          ...item,
          policyId: `${index + 1}`,
        }));
        setData(dataWithPolicyId);
      })
      .catch((err) => console.error("Error fetching data:", err));
  }, []);

  const handlePush = async (item) => {
    try {
      setLoadingRow(item.metadata.u_change_id);

      const res = await fetch("https://firebott-app-eubrcqh0b5dta3ax.centralindia-01.azurewebsites.net/api/push-firewall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      const result = await res.json();
      alert(result.message || `Policy ${item.policyId} pushed successfully!`);
    } catch (error) {
      console.error("Error pushing to firewall:", error);
      alert("Failed to push policy.");
    } finally {
      setLoadingRow(null);
    }
  };

  const handleRowSelect = (item) => {
    setSelectedRowId(item.metadata.u_change_id);
    onSelectRow?.(item); // Send selected row data to parent (Dashboard)
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Policy ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Change ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Application
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Source Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Requestor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Push
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item, i) => (
                  <tr
                    key={i}
                    onClick={() => handleRowSelect(item)}
                    className={`transition-colors duration-200 cursor-pointer ${
                      selectedRowId === item.metadata.u_change_id
                        ? "bg-blue-100"
                        : "hover:bg-blue-50"
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.policyId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.metadata.u_change_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.metadata.u_application}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.metadata.u_source_address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.metadata.u_destination_address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.metadata.u_action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.metadata.u_requestor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePush(item);
                        }}
                        disabled={loadingRow === item.metadata.u_change_id}
                        className={`px-4 py-2 text-sm font-semibold rounded-md ${
                          loadingRow === item.metadata.u_change_id
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        }`}
                      >
                        {loadingRow === item.metadata.u_change_id
                          ? "Pushing..."
                          : "Push"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataList;
