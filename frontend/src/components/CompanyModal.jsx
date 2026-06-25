import { useState, useEffect } from "react";

function CompanyModal({ isOpen, onClose, onSave, editingCompany }) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    gstin: "",
  });

  // Whenever editingCompany changes (i.e., user clicked "Edit" on a specific company),
  // pre-fill the form with that company's existing data
  useEffect(() => {
    if (editingCompany) {
      setFormData({
        name: editingCompany.name || "",
        address: editingCompany.address || "",
        gstin: editingCompany.gstin || "",
      });
    } else {
      setFormData({ name: "", address: "", gstin: "" });
    }
  }, [editingCompany]);

  if (!isOpen) return null; // Don't render anything if the modal is closed

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
          {editingCompany ? "Edit Company" : "Create Company"}
        </h2>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name
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
            Address
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label className="block text-sm font-medium text-gray-700 mb-1">
            GSTIN (optional)
          </label>
          <input
            type="text"
            name="gstin"
            value={formData.gstin}
            onChange={handleChange}
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

export default CompanyModal;