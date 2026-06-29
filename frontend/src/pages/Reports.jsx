import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

function Reports() {
  const { activeCompany } = useAuth();
  const navigate = useNavigate();

  const [stockSummary, setStockSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (activeCompany) {
      fetchStockSummary();
    }
  }, [activeCompany]);

  const fetchStockSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/stock-summary", {
        params: { companyId: activeCompany.id },
      });
      setStockSummary(res.data);
    } catch (err) {
      setError("Failed to load stock summary");
    } finally {
      setLoading(false);
    }
  };

  if (!activeCompany) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-600 mb-4">
            Please select a company first to view reports.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">SmartERP</h1>
        <Link to="/dashboard" className="text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </nav>

      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded mb-4">
          Reports for: <strong>{activeCompany.name}</strong>
        </div>

        {error && (
          <p className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</p>
        )}

        <h2 className="text-lg font-semibold text-gray-800 mb-3">Stock Summary</h2>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : !stockSummary || stockSummary.items.length === 0 ? (
          <p className="text-gray-500">No stock items to summarize yet.</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-700">Item</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Group</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Qty</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Rate</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Value</th>
                </tr>
              </thead>
              <tbody>
                {stockSummary.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="p-3 text-gray-800">{item.name}</td>
                    <td className="p-3 text-gray-500">{item.group_name}</td>
                    <td className="p-3 text-right text-gray-700">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="p-3 text-right text-gray-700">₹{item.rate}</td>
                    <td className="p-3 text-right font-medium text-gray-800">
                      ₹{parseFloat(item.value).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50 border-t">
                  <td colSpan={4} className="p-3 font-semibold text-blue-800 text-right">
                    Total Stock Value:
                  </td>
                  <td className="p-3 font-bold text-blue-800 text-right">
                    ₹{stockSummary.grandTotal}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;