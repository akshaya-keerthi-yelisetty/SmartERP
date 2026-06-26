import { useState, useEffect } from "react";

const LEDGER_TYPES = ["customer", "supplier", "expense", "income", "cash", "bank"];

function LedgerModal({ isOpen, onClose, onSave, editingLedger }) {
  const [formData, setFormData] = useState({
    name: "",
    type: "customer",
    openingBalance: "",
    balanceType: "debit",
  });

  useEffect(() => {
    if (editingLedger) {
      setFormData({
        name: editingLedger.name || "",
        type: editingLedger.type || "customer",
        openingBalance: editingLedger.opening_balance || "",
        balanceType: editingLedger.balance_type || "debit",
      });
    } else {
      setFormData({ name: "", type: "customer", openingBalance: "", balanceType: "debit" });
    }
  }, [editingLedger]);

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
          {editingLedger ? "Edit Ledger" : "Create Ledger"}
        </h2>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ledger Name
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
            Ledger Type
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {LEDGER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Opening Balance
          </label>
          <input
            type="number"
            name="openingBalance"
            value={formData.openingBalance}
            onChange={handleChange}
            step="0.01"
            className="w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Balance Type
          </label>
          <select
            name="balanceType"
            value={formData.balanceType}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>

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

export default LedgerModal;