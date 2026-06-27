import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import VoucherModal from "../components/VoucherModal";
import { generateInvoicePDF } from "../utils/generateInvoicePDF";

function Vouchers() {
  const { activeCompany } = useAuth();
  const navigate = useNavigate();

  const [vouchers, setVouchers] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("purchase");

  useEffect(() => {
    if (activeCompany) {
      fetchAll();
    }
  }, [activeCompany, filterType]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const voucherParams = { companyId: activeCompany.id };
      if (filterType !== "all") voucherParams.voucherType = filterType;

      const [vouchersRes, ledgersRes, itemsRes] = await Promise.all([
        api.get("/vouchers", { params: voucherParams }),
        api.get("/ledgers", { params: { companyId: activeCompany.id } }),
        api.get("/stock-items", { params: { companyId: activeCompany.id } }),
      ]);
      setVouchers(vouchersRes.data);
      setLedgers(ledgersRes.data);
      setStockItems(itemsRes.data);
    } catch (err) {
      setError("Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      const payload = { ...formData, companyId: activeCompany.id };
      await api.post(`/vouchers/${modalType}`, payload);
      setModalOpen(false);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save voucher");
    }
  };

  const handleDownloadInvoice = async (voucherId) => {
    try {
      const res = await api.get(`/vouchers/${voucherId}`);
      generateInvoicePDF(res.data.voucher, res.data.items, activeCompany.name);
    } catch (err) {
      alert("Failed to generate invoice");
    }
  };

  if (!activeCompany) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-600 mb-4">
            Please select a company first to manage vouchers.
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
          Vouchers for: <strong>{activeCompany.name}</strong>
        </div>

        {error && (
          <p className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</p>
        )}

        <div className="flex justify-between items-center mb-4 gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded p-2"
          >
            <option value="all">All Vouchers</option>
            <option value="purchase">Purchases</option>
            <option value="sales">Sales</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => handleOpenCreate("purchase")}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              + Purchase Voucher
            </button>
            <button
              onClick={() => handleOpenCreate("sales")}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              + Sales Voucher
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading vouchers...</p>
        ) : vouchers.length === 0 ? (
          <p className="text-gray-500">No vouchers yet. Create one to get started.</p>
        ) : (
          <div className="grid gap-3">
            {vouchers.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-lg shadow p-4 flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        v.voucher_type === "purchase"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {v.voucher_type.toUpperCase()}
                    </span>
                    <h3 className="font-semibold text-gray-800">{v.ledger_name}</h3>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(v.voucher_date).toLocaleDateString()}
                    {v.notes && ` • ${v.notes}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-800">₹{v.grand_total}</span>
                  <button
                    onClick={() => handleDownloadInvoice(v.id)}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200"
                  >
                    Download Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <VoucherModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        voucherType={modalType}
        ledgers={ledgers}
        stockItems={stockItems}
      />
    </div>
  );
}

export default Vouchers;