import { useState, useEffect } from "react";

function VoucherModal({ isOpen, onClose, onSave, voucherType, ledgers, stockItems }) {
  const [ledgerId, setLedgerId] = useState("");
  const [voucherDate, setVoucherDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [gstPercent, setGstPercent] = useState("0");
  const [items, setItems] = useState([{ stockItemId: "", quantity: "", rate: "" }]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setLedgerId("");
      setVoucherDate(new Date().toISOString().split("T")[0]);
      setNotes("");
      setGstPercent("0");
      setItems([{ stockItemId: "", quantity: "", rate: "" }]);
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleAddItem = () => {
    setItems([...items, { stockItemId: "", quantity: "", rate: "" }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const total = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    return sum + qty * rate;
  }, 0);

  const gstAmount = (total * (parseFloat(gstPercent) || 0)) / 100;
  const grandTotal = total + gstAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!ledgerId) {
      setError("Please select a ledger");
      return;
    }

    const validItems = items.filter((item) => item.stockItemId && item.quantity && item.rate);
    if (validItems.length === 0) {
      setError("Please add at least one valid item");
      return;
    }

    onSave({
      ledgerId,
      voucherDate,
      notes,
      gstPercent: parseFloat(gstPercent) || 0,
      items: validItems.map((item) => ({
        stockItemId: parseInt(item.stockItemId),
        quantity: parseFloat(item.quantity),
        rate: parseFloat(item.rate),
      })),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-blue-600 mb-4">
          New {voucherType === "purchase" ? "Purchase" : "Sales"} Voucher
        </h2>

        {error && (
          <p className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {voucherType === "purchase" ? "Supplier Ledger" : "Customer Ledger"}
              </label>
              <select
                value={ledgerId}
                onChange={(e) => setLedgerId(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
              >
                <option value="">Select ledger</option>
                {ledgers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={voucherDate}
                onChange={(e) => setVoucherDate(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
              />
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Items
          </label>

          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
              <select
                value={item.stockItemId}
                onChange={(e) => handleItemChange(index, "stockItemId", e.target.value)}
                className="col-span-5 border border-gray-300 rounded p-2 text-sm"
              >
                <option value="">Select item</option>
                {stockItems.map((si) => (
                  <option key={si.id} value={si.id}>
                    {si.name} ({si.unit})
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                step="0.01"
                className="col-span-2 border border-gray-300 rounded p-2 text-sm"
              />

              <input
                type="number"
                placeholder="Rate"
                value={item.rate}
                onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                step="0.01"
                className="col-span-2 border border-gray-300 rounded p-2 text-sm"
              />

              <span className="col-span-2 text-sm text-gray-600 text-right">
                ₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)).toFixed(2)}
              </span>

              <button
                type="button"
                onClick={() => handleRemoveItem(index)}
                className="col-span-1 text-red-600 hover:text-red-800 text-sm"
                disabled={items.length === 1}
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddItem}
            className="text-blue-600 hover:underline text-sm mb-4"
          >
            + Add another item
          </button>

          <label className="block text-sm font-medium text-gray-700 mb-1">
            GST % (optional)
          </label>
          <input
            type="number"
            value={gstPercent}
            onChange={(e) => setGstPercent(e.target.value)}
            step="0.01"
            placeholder="e.g. 18"
            className="w-full border border-gray-300 rounded p-2 mb-4"
          />

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 mb-4"
          />

          <div className="border-t pt-3 mb-4 space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Items Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            {parseFloat(gstPercent) > 0 && (
              <>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>CGST ({(parseFloat(gstPercent) / 2).toFixed(2)}%):</span>
                  <span>₹{(gstAmount / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>SGST ({(parseFloat(gstPercent) / 2).toFixed(2)}%):</span>
                  <span>₹{(gstAmount / 2).toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center pt-1">
              <span className="font-semibold text-gray-700">Grand Total:</span>
              <span className="font-bold text-lg text-blue-600">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Save Voucher
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

export default VoucherModal;