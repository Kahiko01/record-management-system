"use client";

import { useState, useEffect } from "react";
import { Search, User, CheckCircle, FileSignature } from "lucide-react";

export default function CollectionPage() {
  const [pendingCards, setPendingCards] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [signatureAck, setSignatureAck] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  useEffect(() => {
    fetchPendingCards();
  }, [token]);

  const fetchPendingCards = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/id-management/cards/pending-collection", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setPendingCards(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch pending cards:", err);
    }
  };

  const filteredCards = pendingCards.filter((c: any) => 
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.admission_number.toLowerCase().includes(search.toLowerCase())
  );

  const handleCollect = async () => {
    if (!selectedCard || !signatureAck) {
      alert("Please select a card and confirm the signature acknowledgment.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/id-management/collect", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          card_id: selectedCard.card_id,
          student_id: selectedCard.student_id,
          signature_acknowledged: true,
          notes: "Collected via Dean Dashboard"
        })
      });
      
      if (res.ok) {
        alert("✅ ID Card successfully collected and marked as ISSUED!");
        setSelectedCard(null);
        setSignatureAck(false);
        fetchPendingCards(); // Refresh the list
      } else {
        const err = await res.json();
        alert(`❌ Failed to collect: ${err.detail || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <FileSignature className="text-purple-600 dark:text-purple-400" /> Record Collection
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Record physical handover of assigned ID cards</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Cards List */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <User className="w-5 h-5 text-purple-600 dark:text-purple-400" /> 1. Select Student for Collection
          </h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or admission number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-colors duration-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredCards.map((c: any) => (
              <div
                key={c.card_id}
                onClick={() => { setSelectedCard(c); setSignatureAck(false); }}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center justify-between transition-colors duration-200 ${
                  selectedCard?.card_id === c.card_id 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 dark:border-purple-500' 
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{c.full_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{c.admission_number} • {c.programme || "N/A"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-gray-700 dark:text-gray-300">{c.card_number}</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">PENDING</p>
                </div>
              </div>
            ))}
            {filteredCards.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No pending collections found.</p>
            )}
          </div>
        </div>

        {/* Collection Confirmation */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" /> 2. Confirm Handover
          </h2>
          
          {!selectedCard ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg">
              <FileSignature className="w-12 h-12 mb-3" />
              <p>Select a student from the list to begin</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg">
                <p className="text-sm text-purple-800 dark:text-purple-200 font-medium mb-1">Collecting for:</p>
                <p className="text-xl font-bold text-purple-900 dark:text-purple-100">{selectedCard.full_name}</p>
                <p className="text-sm text-purple-700 dark:text-purple-300">{selectedCard.admission_number}</p>
                <p className="text-sm font-mono mt-2 text-gray-600 dark:text-gray-400">Card: {selectedCard.card_number}</p>
              </div>

              <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <input
                  type="checkbox"
                  id="signature"
                  checked={signatureAck}
                  onChange={(e) => setSignatureAck(e.target.checked)}
                  className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-purple-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="signature" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                  I confirm that the student has <strong>physically signed</strong> the collection register and presented valid identification.
                </label>
              </div>

              <button
                onClick={handleCollect}
                disabled={!signatureAck || loading}
                className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {loading ? "Processing..." : "Confirm Physical Collection"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
