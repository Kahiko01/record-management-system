"use client";
import { useState, useEffect } from "react";
import { AlertTriangle, CreditCard, CheckCircle2, Search } from "lucide-react";

export default function ReplacePage() {
  const [cards, setCards] = useState<any[]>([]);
  const [replaceSearch, setReplaceSearch] = useState("");
  const [foundIssuedCards, setFoundIssuedCards] = useState<any[]>([]);
  const [selectedOldCard, setSelectedOldCard] = useState<any>(null);
  const [replaceReason, setReplaceReason] = useState<"LOST" | "DAMAGED">("LOST");
  const [replaceNotes, setReplaceNotes] = useState("");
  const [feePaid, setFeePaid] = useState(false);
  const [selectedNewCard, setSelectedNewCard] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchCards(); }, []);

  const fetchCards = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/id-management/cards', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      setCards(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleSearchForReplacement = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const url = replaceSearch.trim()
        ? `http://localhost:8000/id-management/cards/issued?search=${encodeURIComponent(replaceSearch)}`
        : `http://localhost:8000/id-management/cards/issued`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setFoundIssuedCards(data);
      if (data.length === 0) {
        alert("No ISSUED cards found for this search. Issue a card first.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to search");
    } finally {
      setLoading(false);
    }
  };

  const handleReplaceID = async () => {
    if (!selectedOldCard || !selectedNewCard) return alert("Please select the old card and a new IN_STOCK card.");
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/id-management/replace', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          old_card_id: selectedOldCard.card_id,
          new_card_id: parseInt(selectedNewCard),
          reason: replaceReason,
          fee_paid: feePaid,
          notes: replaceNotes || `${replaceReason} replacement for ${selectedOldCard.full_name}`
        })
      });
      if (res.ok) {
        alert(`✅ Replacement successful for ${selectedOldCard.full_name}!`);
        setSelectedOldCard(null);
        setSelectedNewCard("");
        setReplaceNotes("");
        setFeePaid(false);
        setFoundIssuedCards([]);
        setReplaceSearch("");
        fetchCards();
      } else {
        const err = await res.json();
        alert(`❌ Error: ${err.detail}`);
      }
    } catch (err) { alert("Failed to process replacement."); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lost/Damaged & Replace</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Anti-fraud replacement workflow</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" /> 1. Report Lost/Damaged Card
          </h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Admission No. or Name..."
              value={replaceSearch}
              onChange={(e) => setReplaceSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchForReplacement()}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-red-500"
            />
            <button
              onClick={handleSearchForReplacement}
              disabled={loading}
              className="px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
          
          {foundIssuedCards.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {foundIssuedCards.map(card => (
                <button
                  key={card.card_id}
                  onClick={() => setSelectedOldCard(card)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    selectedOldCard?.card_id === card.card_id
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <p className="font-medium text-gray-900 dark:text-white">{card.full_name}</p>
                  <p className="text-xs font-mono text-blue-600 dark:text-blue-400">{card.admission_number}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Card: {card.card_number} • Collected: {card.collection_date ? new Date(card.collection_date).toLocaleDateString() : 'N/A'}
                  </p>
                </button>
              ))}
            </div>
          )}

          {selectedOldCard && (
            <div className="mt-4 space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <button
                  onClick={() => setReplaceReason("LOST")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                    replaceReason === "LOST"
                      ? "bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  Lost
                </button>
                <button
                  onClick={() => setReplaceReason("DAMAGED")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                    replaceReason === "DAMAGED"
                      ? "bg-amber-100 border-amber-500 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  Damaged
                </button>
              </div>
              <textarea
                placeholder="Incident details..."
                value={replaceNotes}
                onChange={(e) => setReplaceNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm h-20"
              />
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={feePaid}
                  onChange={(e) => setFeePaid(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                Replacement Fee Paid (KES 500)
              </label>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" /> 2. Assign New Card
          </h3>
          {selectedOldCard ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-sm">
                <p className="text-xs text-gray-500">Replacing card for:</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedOldCard.full_name}</p>
                <p className="text-xs font-mono text-blue-600 dark:text-blue-400">{selectedOldCard.admission_number}</p>
                <p className="text-xs text-gray-500 mt-1">Old card: {selectedOldCard.card_number}</p>
              </div>

              <select
                value={selectedNewCard}
                onChange={(e) => setSelectedNewCard(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select an IN_STOCK card...</option>
                {cards.filter(c => c.status === 'IN_STOCK').map(card => (
                  <option key={card.id} value={card.id}>
                    {card.card_number} ({card.serial_number})
                  </option>
                ))}
              </select>

              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
                <p className="font-semibold mb-1">🛡️ Anti-Fraud Audit:</p>
                <p>• Old card will be permanently marked as <strong>{replaceReason}</strong></p>
                <p>• New card will be linked to the old card's history</p>
                <p>• Action logged with your user ID, IP, and timestamp</p>
              </div>

              <button
                onClick={handleReplaceID}
                disabled={loading || !selectedNewCard}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                Confirm Replacement
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <AlertTriangle className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">Select a lost/damaged card from the left.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
