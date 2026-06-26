import { useState, useEffect } from "react";

function StockItemModal({ isOpen, onClose, onSave, editingItem, stockGroups }) {
  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    rate: "",
    quantity: "",
    stockGroupId: "",
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || "",
        unit: editingItem.unit || "",
        rate: editingItem.rate || "",
        quantity: editingItem.quantity || "",
        stockGroupId: editingItem.stock_group_id || "",
      });
    } else {
      setFormData({ name: "", unit: "", rate: "", quantity: "", stockGroupId: "" });
    }
  }, [editingItem]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-md p-6 w-96">
        <h2 className="text-xl font-bold text-blue-600 mb-4">
          {editingItem ? "Edit Stock Item" : "Create Stock Item"}
        </h2>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Item Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock Group
          </label>
          <select
            name="stockGroupId"
            value={formData.stockGroupId}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No group</option>
            {stockGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unit (e.g. pcs, kg, litre)
          </label>
          <input
            type="text"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rate (per unit)
          </label>
          <input
            type="number"
            name="rate"
            value={formData.rate}
            onChange={handleChange}
            step="0.01"
            className="w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            step="0.01"
            className="w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StockItemModal;