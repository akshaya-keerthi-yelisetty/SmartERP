import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import StockGroupModal from "../components/StockGroupModal";
import StockItemModal from "../components/StockItemModal";

function Inventory() {
  const { activeCompany } = useAuth();
  const navigate = useNavigate();

  const [stockGroups, setStockGroups] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    if (activeCompany) {
      fetchAll();
    }
  }, [activeCompany]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [groupsRes, itemsRes] = await Promise.all([
        api.get("/stock-groups", { params: { companyId: activeCompany.id } }),
        api.get("/stock-items", { params: { companyId: activeCompany.id } }),
      ]);
      setStockGroups(groupsRes.data);
      setStockItems(itemsRes.data);
    } catch (err) {
      setError("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  // Helper to display a group's name next to its items, since stock_items only stores stock_group_id
  const getGroupName = (groupId) => {
    const group = stockGroups.find((g) => g.id === groupId);
    return group ? group.name : "Ungrouped";
  };

  // --- Stock Group handlers ---
  const handleSaveGroup = async (formData) => {
    try {
      if (editingGroup) {
        await api.put(`/stock-groups/${editingGroup.id}`, formData);
      } else {
        await api.post("/stock-groups", { ...formData, companyId: activeCompany.id });
      }
      setGroupModalOpen(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save stock group");
      setGroupModalOpen(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    const confirmed = window.confirm(
      "Delete this stock group? Items in it will become ungrouped, not deleted."
    );
    if (!confirmed) return;
    try {
      await api.delete(`/stock-groups/${groupId}`);
      fetchAll();
    } catch (err) {
      setError("Failed to delete stock group");
    }
  };

  // --- Stock Item handlers ---
  const handleSaveItem = async (formData) => {
    try {
      const payload = {
        ...formData,
        companyId: activeCompany.id,
        stockGroupId: formData.stockGroupId || null,
      };
      if (editingItem) {
        await api.put(`/stock-items/${editingItem.id}`, payload);
      } else {
        await api.post("/stock-items", payload);
      }
      setItemModalOpen(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save stock item");
      setItemModalOpen(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    const confirmed = window.confirm("Delete this stock item? This cannot be undone.");
    if (!confirmed) return;
    try {
      await api.delete(`/stock-items/${itemId}`);
      fetchAll();
    } catch (err) {
      setError("Failed to delete stock item");
    }
  };

  if (!activeCompany) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-600 mb-4">
            Please select a company first to manage inventory.
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
          Managing inventory for: <strong>{activeCompany.name}</strong>
        </div>

        {error && (
          <p className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</p>
        )}

        {loading ? (
          <p className="text-gray-500">Loading inventory...</p>
        ) : (
          <>
            {/* STOCK GROUPS SECTION */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-gray-800">Stock Groups</h2>
                <button
                  onClick={() => {
                    setEditingGroup(null);
                    setGroupModalOpen(true);
                  }}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
                >
                  + New Group
                </button>
              </div>

              {stockGroups.length === 0 ? (
                <p className="text-gray-500 text-sm">No stock groups yet.</p>
              ) : (
                <div className="grid gap-2">
                  {stockGroups.map((group) => (
                    <div
                      key={group.id}
                      className="bg-white rounded shadow p-3 flex justify-between items-center"
                    >
                      <span className="font-medium text-gray-800">{group.name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingGroup(group);
                            setGroupModalOpen(true);
                          }}
                          className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* STOCK ITEMS SECTION */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-gray-800">Stock Items</h2>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setItemModalOpen(true);
                  }}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
                >
                  + New Item
                </button>
              </div>

              {stockItems.length === 0 ? (
                <p className="text-gray-500 text-sm">No stock items yet.</p>
              ) : (
                <div className="grid gap-2">
                  {stockItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded shadow p-3 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {getGroupName(item.stock_group_id)} • {item.quantity} {item.unit} @ ₹{item.rate}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setItemModalOpen(true);
                          }}
                          className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <StockGroupModal
        isOpen={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        onSave={handleSaveGroup}
        editingGroup={editingGroup}
      />

      <StockItemModal
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        onSave={handleSaveItem}
        editingItem={editingItem}
        stockGroups={stockGroups}
      />
    </div>
  );
}

export default Inventory;