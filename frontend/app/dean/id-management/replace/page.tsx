"use client";
import { useState, useEffect } from "react";
import { AlertTriangle, CreditCard, CheckCircle2 } from "lucide-react";

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
      const res = await fetch('http://localhost:8000/id-management/cards', { headers: { 'Authorization': `Bearer ${token}` } });
      setCards(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleSearchForReplacement = () => {
    const issued = cards.filter(c => c.status === "ISSUED");
    if (issued.length > 0 && (replaceSearch.toLowerCase() === "john" || replaceSearch === "999")) { setFoundIssuedCards(issued); } 
    else { setFoundIssuedCards([]); alert("No ISSUED cards found. (Try searching 'John')"); }
  };

  const handleReplaceID = async () => {
    if (!selectedOldCard || !selectedNewCard) return alert("Please select the old card and a new IN_STOCK card.");
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/id-management/replace', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_card_id: selectedOldCard.id, new_card_id: parseInt(selectedNewCard), reason: replaceReason, fee_paid: feePaid, notes: replaceNotes })
      });
      if (res.ok) { alert(`✅ Replacement successful!`); setSelectedOldCard(null); setSelectedNewCard(""); setReplaceNotes(""); setFeePaid(false); setFoundIssuedCards([]); setReplaceSearch(""); fetchCards(); } 
      else { const err = await res.json(); alert(`❌ Error: ${err.detail}`); }
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-600" /> 1. Report Lost/Damaged Card</h3>
          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="Search Student (Try 'John')..." value={replaceSearch} onChange={(e) => setReplaceSearch(e.target.value)} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-red-500" />
            <button onClick={handleSearchForReplacement} className="px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Search</button>
          </div>
          {foundIssuedCards.map(card => (
            <button key={card.id} onClick={() => setSelectedOldCard(card)} className={`w-full text-left p-3 rounded-lg border transition mb-2 ${selectedOldCard?.id === card.id ? "border-red-500 bg-red-50 dark:bg-red-900/20" : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
              <p className="font-medium text-gray-900 dark:text-white">{card.card_number}</p>
              <p className="text-xs text-gray-500">Student ID: {card.assigned_to_student_id}</p>
            </button>
          ))}
          {selectedOldCard && (
            <div className="mt-4 space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <button onClick={() => setReplaceReason("LOST")} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${replaceReason === "LOST" ? "bg-red-100 border-red-500 text-red-700" : "border-gray-300 dark:border-gray-600"}`}>Lost</button>
                <button onClick={() => setReplaceReason("DAMAGED")} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${replaceReason === "DAMAGED" ? "bg-amber-100 border-amber-500 text-amber-700" : "border-gray-300 dark:border-gray-600"}`}>Damaged</button>
              </div>
              <textarea placeholder="Incident details..." value={replaceNotes} onChange={(e) => setReplaceNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm h-20" />
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={feePaid} onChange={(e) => setFeePaid(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" /> Replacement Fee Paid
              </label>
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-emerald-600" /> 2. Assign New Card</h3>
          {selectedOldCard ? (
            <div className="space-y-4">
              <select value={selectedNewCard} onChange={(e) => setSelectedNewCard(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500">
                <option value="">Select an IN_STOCK card...</option>
                {cards.filter(c => c.status === 'IN_STOCK').map(card => (<option key={card.id} value={card.id}>{card.card_number} ({card.serial_number})</option>))}
              </select>
              <button onClick={handleReplaceID} disabled={loading || !selectedNewCard} className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
                {loading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <CheckCircle2 className="w-5 h-5" />} Confirm Replacement
              </button>
            </div>
          ) : <div className="flex flex-col items-center justify-center h-48 text-gray-400"><AlertTriangle className="w-10 h-10 mb-2 opacity-50" /><p className="text-sm">Select a lost/damaged card from the left.</p></div>}
        </div>
      </div>
    </div>
  );
}
