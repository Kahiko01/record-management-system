"use client";

import { useState, useEffect } from "react";
import { Search, User, AlertTriangle, CreditCard, CheckCircle, ShieldAlert } from "lucide-react";

export default function ReplacePage() {
  const [issuedCards, setIssuedCards] = useState<any[]>([]);
  const [inStockCards, setInStockCards] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedOldCard, setSelectedOldCard] = useState<any>(null);
  const [selectedNewCard, setSelectedNewCard] = useState<any>(null);
  const [reason, setReason] = useState<"LOST" | "DAMAGED">("LOST");
  const [feePaid, setFeePaid] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  useEffect(() => {
    fetchInStockCards();
  }, [token]);

  const fetchInStockCards = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/id-management/cards?status=IN_STOCK", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      setInStockCards(await res.json());
    } catch (err) {
      console.error("Failed to fetch IN_STOCK cards:", err);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const url = search.trim() 
        ? `http://127.0.0.1:8000/id-management/cards/issued?search=${encodeURIComponent(search)}`
        : `http://127.0.0.1:8000/id-management/cards/issued`;
      
      const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
      const data = await res.json();
      setIssuedCards(Array.isArray(data) ? data : []);
      
      if (Array.isArray(data) && data.length === 0 && search.trim()) {
        alert("No ISSUED cards found for this search.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to search issued cards.");
    } finally {
      setLoading(false);
    }
  };

  const handleReplace = async () => {
    if (!selectedOldCard || !selectedNewCard) {
      alert("Please select both the old card to replace and a new IN_STOCK card.");
      return;
    }
    if (!feePaid) {
      alert("⚠️ Zero Trust Policy: You must confirm that the replacement fee has been paid before proceeding.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/id-management/replace", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          old_card_id: selectedOldCard.card_id,
          new_card_id: selectedNewCard.id,
          reason: reason,
          fee_paid: true,
          notes: notes || `${reason} replacement for ${selectedOldCard.full_name}`
        })
      });
      
      if (res.ok) {
        alert(`✅ Replacement successful for ${selectedOldCard.full_name}!`);
        setSelectedOldCard(null);
        setSelectedNewCard(null);
        setReason("LOST");
        setFeePaid(false);
        setNotes("");
        setSearch("");
        setIssuedCards([]);
        fetchInStockCards(); // Refresh available new cards
      } else {
        const err = await res.json();
        alert(`❌ Error: ${err.detail || "Unknown error"}`);
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
          <ShieldAlert className="text-red-600 dark:text-red-400" /> Lost/Damaged & Replace
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Anti-fraud workflow: Deactivate old card and issue a new one</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Find the Old Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <Search className="w-5 h-5 text-red-600 dark:text-red-400" /> 1. Find Issued Card to Replace
          </h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Search student name or admission number..."
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button 
              onClick={handleSearch}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Search
            </button>
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-2">
            {issuedCards.map((c: any) => (
              <div
                key={c.card_id}
                onClick={() => { setSelectedOldCard(c); setSelectedNewCard(null); }}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-between transition ${
                  selectedOldCard?.card_id === c.card_id 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500' 
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{c.full_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{c.admission_number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-gray-700 dark:text-gray-300">{c.card_number}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">ISSUED</p>
                </div>
              </div>
            ))}
            {issuedCards.length === 0 && search && !loading && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No issued cards found.</p>
            )}
          </div>
        </div>

        {/* Step 2: Replacement Details & New Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" /> 2. Replacement Details
          </h2>
          
          {!selectedOldCard ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg">
              <ShieldAlert className="w-12 h-12 mb-3" />
              <p>Select an issued card from the left to begin</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Old Card Info */}
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-xs text-red-800 dark:text-red-200 font-medium uppercase tracking-wide">Deactivating:</p>
                <p className="font-bold text-gray-900 dark:text-white">{selectedOldCard.full_name} ({selectedOldCard.admission_number})</p>
                <p className="font-mono text-sm text-gray-600 dark:text-gray-400">Old Card: {selectedOldCard.card_number}</p>
              </div>

              {/* Reason & Fee */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason</label>
                  <select 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value as "LOST" | "DAMAGED")}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  >
                    <option value="LOST">Lost</option>
                    <option value="DAMAGED">Damaged</option>
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none w-full">
                    <input 
                      type="checkbox" 
                      checked={feePaid} 
                      onChange={(e) => {
                        console.log("Checkbox clicked! New state:", e.target.checked);
                        setFeePaid(e.target.checked);
                      }}
                      className="w-5 h-5 text-red-600 rounded focus:ring-red-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Replacement fee paid</span>
                  </label>
                </div>
              </div>

              {/* New Card Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select New IN_STOCK Card</label>
                <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-900/50">
                  {inStockCards.map((card: any) => (
                    <div
                      key={card.id}
                      onClick={() => {
                        console.log("New card selected:", card.card_number);
                        setSelectedNewCard(card);
                      }}
                      className={`p-2 border rounded cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center justify-between transition ${
                        selectedNewCard?.id === card.id 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-500' 
                          : 'border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <span className="font-mono text-sm text-gray-900 dark:text-white">{card.card_number}</span>
                      <CheckCircle className={`w-4 h-4 ${selectedNewCard?.id === card.id ? 'text-green-600 dark:text-green-400' : 'text-gray-300 dark:text-gray-600'}`} />
                    </div>
                  ))}
                  {inStockCards.length === 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">No IN_STOCK cards available.</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Internal Notes (Optional)</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Student reported wallet stolen..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                  rows={2}
                />
              </div>

              {/* Debug Status Indicator */}
              <div className="text-xs font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                System Check: 
                {selectedOldCard ? " ✅ Old Card" : " ❌ Old Card"} | 
                {selectedNewCard ? " ✅ New Card" : " ❌ New Card"} | 
                {feePaid ? " ✅ Fee Paid" : " ❌ Fee Not Paid"}
              </div>

              {/* Action Button */}
              <button
                onClick={handleReplace}
                disabled={!selectedNewCard || !feePaid || loading}
                className="w-full py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading ? "Processing Anti-Fraud Workflow..." : "Confirm & Process Replacement"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
