import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import LedgerModal from "../components/LedgerModal";

const LEDGER_TYPES = ["customer", "supplier", "expense", "income", "cash", "bank"];

function Ledgers() {
  const { activeCompany } = useAuth();
  const navigate = useNavigate();

  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLedger, setEditingLedger] = useState(null);

  useEffect(() => {
    if (activeCompany) {
      fetchLedgers();
    }
  }, [activeCompany, filterType]);

  const fetchLedgers = async () => {
    setLoading(true);
    try {
      const params = { companyId: activeCompany.id };
      if (filterType !== "all") {
        params.type = filterType;
      }
      const res = await api.get("/ledgers", { params });
      setLedgers(res.data);
    } catch (err) {
      setError("Failed to load ledgers");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingLedger(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (ledger) => {
    setEditingLedger(ledger);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      if (editingLedger) {
        await api.put(`/ledgers/${editingLedger.id}`, formData);
      } else {
        await api.post("/ledgers", { ...formData, companyId: activeCompany.id });
      }
      setModalOpen(false);
      fetchLedgers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save ledger");
      setModalOpen(false);
    }
  };

  const handleDelete = async (ledgerId) => {
    const confirmed = window.confirm("Delete this ledger? This cannot be undone.");
    if (!confirmed) return;

    try {
      await api.delete(`/ledgers/${ledgerId}`);
      fetchLedgers();
    } catch (err) {
      setError("Failed to delete ledger");
    }
  };

  // If no company is selected, don't show a broken/empty page — guide the user back
  if (!activeCompany) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-600 mb-4">
            Please select a company first to manage its ledgers.
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
          Managing ledgers for: <strong>{activeCompany.name}</strong>
        </div>

        {error && (
          <p className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">
            {error}
          </p>
        )}

        <div className="flex justify-between items-center mb-4 gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded p-2"
          >
            <option value="all">All Types</option>
            {LEDGER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>

          <button
            onClick={handleOpenCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + New Ledger
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading ledgers...</p>
        ) : ledgers.length === 0 ? (
          <p className="text-gray-500">No ledgers found. Create one to get started.</p>
        ) : (
          <div className="grid gap-3">
            {ledgers.map((ledger) => (
              <div
                key={ledger.id}
                className="bg-white rounded-lg shadow p-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold text-gray-800">{ledger.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">
                    {ledger.type} • {ledger.balance_type} balance
                  </p>
                  <p className="text-sm text-gray-600">
                    Opening Balance: ₹{ledger.opening_balance}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(ledger)}
                    className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(ledger.id)}
                    className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <LedgerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editingLedger={editingLedger}
      />
    </div>
  );
}

export default Ledgers;