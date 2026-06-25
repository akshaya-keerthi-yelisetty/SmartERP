import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import CompanyModal from "../components/CompanyModal";

function Dashboard() {
  const { user, logout, activeCompany, selectCompany } = useAuth();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  // Fetch the user's companies when the page first loads
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await api.get("/companies");
      setCompanies(res.data);
    } catch (err) {
      setError("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleOpenCreate = () => {
    setEditingCompany(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (company) => {
    setEditingCompany(company);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      if (editingCompany) {
        // Editing an existing company
        const res = await api.put(`/companies/${editingCompany.id}`, formData);

        // If we just edited the company that's currently "active,"
        // update the banner's data too so it doesn't show stale info
        if (activeCompany?.id === editingCompany.id) {
          selectCompany(res.data.company);
        }
      } else {
        // Creating a new company
        await api.post("/companies", formData);
      }
      setModalOpen(false);
      fetchCompanies(); // refresh the list
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save company");
      setModalOpen(false);
    }
  };

  const handleDelete = async (companyId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this company? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      await api.delete(`/companies/${companyId}`);

      // If the deleted company was the active one, clear the active company
      // so the banner doesn't keep pointing at something that no longer exists
      if (activeCompany?.id === companyId) {
        selectCompany(null);
      }

      fetchCompanies();
    } catch (err) {
      setError("Failed to delete company");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">SmartERP</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-700">Hello, {user?.name}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="p-6 max-w-4xl mx-auto">
        {activeCompany && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded mb-4 flex justify-between items-center">
            <span>
              Active company: <strong>{activeCompany.name}</strong>
            </span>
            <button
              onClick={() => selectCompany(null)}
              className="text-blue-600 hover:underline text-sm"
            >
              Clear
            </button>
          </div>
        )}

        {error && (
          <p className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">
            {error}
          </p>
        )}

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Your Companies ({companies.length}/5)
          </h2>
          <button
            onClick={handleOpenCreate}
            disabled={companies.length >= 5}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + New Company
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading companies...</p>
        ) : companies.length === 0 ? (
          <p className="text-gray-500">
            No companies yet. Create one to get started.
          </p>
        ) : (
          <div className="grid gap-3">
            {companies.map((company) => (
              <div
                key={company.id}
                className="bg-white rounded-lg shadow p-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {company.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {company.address || "No address"}
                  </p>
                  {company.gstin && (
                    <p className="text-xs text-gray-400">
                      GSTIN: {company.gstin}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => selectCompany(company)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Select
                  </button>
                  <button
                    onClick={() => handleOpenEdit(company)}
                    className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(company.id)}
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

      <CompanyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editingCompany={editingCompany}
      />
    </div>
  );
}

export default Dashboard;