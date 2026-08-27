"use client";
import { useState } from "react";
import { Package, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export default function ReceiveBatchPage() {
  const [batchNumber, setBatchNumber] = useState("");
  const [supplier, setSupplier] = useState("");
  const [quantity, setQuantity] = useState<number>(100);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://127.0.0.1:8000/id-management/batches', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batch_number: batchNumber,
          supplier: supplier,
          quantity: quantity,
          notes: notes
        })
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
        // Reset form
        setBatchNumber("");
        setSupplier("");
        setQuantity(100);
        setNotes("");
      } else {
        setError(data.detail || "Failed to receive batch");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Receive ID Batch</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Log a new delivery of blank ID cards from supplier</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Batch Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Batch Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="e.g., BATCH-2026-002"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Must be unique. Cards will be numbered: {batchNumber || "BATCH-XXXX"}-0001, -0002, etc.</p>
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Supplier Name
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g., CardTech Solutions Ltd"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantity Received <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                min="1"
                max="10000"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">This will create {quantity} individual card records in the system.</p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes / Delivery Details
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details about this delivery..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900 dark:text-red-100">Error</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {result && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-emerald-900 dark:text-emerald-100">Batch Received Successfully!</p>
                  <div className="mt-2 space-y-1 text-sm text-emerald-700 dark:text-emerald-300">
                    <p>✅ Batch ID: <strong>{result.batch_id}</strong></p>
                    <p>✅ Cards Created: <strong>{result.cards_created}</strong></p>
                    <p>✅ Card Range: <strong>{result.first_card}</strong> to <strong>{result.last_card}</strong></p>
                  </div>
                  <a href="/dean/id-management/inventory" className="inline-block mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:underline">
                    → View in Inventory
                  </a>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !batchNumber || quantity < 1}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing {quantity} cards...
                </>
              ) : (
                <>
                  <Package className="w-5 h-5" />
                  Receive Batch & Generate Cards
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">ℹ️ What happens when you receive a batch?</h3>
          <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
            <li>• A batch record is created with the supplier and quantity details</li>
            <li>• Individual card records are auto-generated with sequential numbers</li>
            <li>• All cards are set to <strong>IN_STOCK</strong> status</li>
            <li>• Cards become immediately available for issuance</li>
            <li>• The entire batch is tracked in the audit logs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
