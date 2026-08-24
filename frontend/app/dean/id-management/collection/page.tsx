"use client";
import { useState } from "react";
import { Search, Handshake, FileSignature } from "lucide-react";

export default function CollectionPage() {
  const [collectionSearch, setCollectionSearch] = useState("");
  const [assignedCards, setAssignedCards] = useState<any[]>([]);
  const [selectedCollectionCard, setSelectedCollectionCard] = useState<any>(null);
  const [signatureAcknowledged, setSignatureAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearchForCollection = () => {
    if (collectionSearch.toLowerCase() === "john" || collectionSearch === "999") {
      // In a real app, fetch from API. Here we mock it.
      setAssignedCards([{ id: 1, card_number: "CARD-2026-0001", serial_number: "SN20260001", student_name: "John Doe", programme: "BSc Computer Science" }]);
    } else { setAssignedCards([]); alert("No pending collections found. (Try searching 'John')"); }
  };

  const handleRecordCollection = async () => {
    if (!selectedCollectionCard) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/id-management/collect', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: selectedCollectionCard.id, student_id: 999, signature_acknowledged: signatureAcknowledged })
      });
      if (res.ok) { alert("✅ Collection recorded successfully!"); setSelectedCollectionCard(null); setAssignedCards([]); setCollectionSearch(""); setSignatureAcknowledged(false); } 
      else { const err = await res.json(); alert(`❌ Error: ${err.detail}`); }
    } catch (err) { alert("Failed to record collection."); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Record Collection</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Verify student and record physical handover</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Search className="w-5 h-5 text-blue-600" /> 1. Find Student with Pending ID</h3>
          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="Search Student (Try 'John')..." value={collectionSearch} onChange={(e) => setCollectionSearch(e.target.value)} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500" />
            <button onClick={handleSearchForCollection} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Search</button>
          </div>
          {assignedCards.map(card => (
            <button key={card.id} onClick={() => setSelectedCollectionCard(card)} className={`w-full text-left p-3 rounded-lg border transition mb-2 ${selectedCollectionCard?.id === card.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
              <p className="font-medium text-gray-900 dark:text-white">{card.student_name}</p>
              <p className="text-xs text-gray-500">{card.card_number} • {card.programme}</p>
            </button>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Handshake className="w-5 h-5 text-emerald-600" /> 2. Verify & Record Handover</h3>
          {selectedCollectionCard ? (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between mb-2"><span className="text-xs font-semibold uppercase text-gray-500">Student</span><span className="text-sm font-medium text-gray-900 dark:text-white">{selectedCollectionCard.student_name}</span></div>
                <div className="flex justify-between"><span className="text-xs font-semibold uppercase text-gray-500">ID Card</span><span className="text-sm font-mono text-gray-900 dark:text-white">{selectedCollectionCard.card_number}</span></div>
              </div>
              <label className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 cursor-pointer">
                <input type="checkbox" checked={signatureAcknowledged} onChange={(e) => setSignatureAcknowledged(e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                <span className="text-sm text-amber-900 dark:text-amber-200"><span className="font-semibold block">Student Signature Acknowledged</span><span className="text-xs opacity-80">I confirm the student has physically received this card.</span></span>
              </label>
              <button onClick={handleRecordCollection} disabled={loading || !signatureAcknowledged} className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
                {loading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <FileSignature className="w-5 h-5" />} Record Collection
              </button>
            </div>
          ) : <div className="flex flex-col items-center justify-center h-48 text-gray-400"><Handshake className="w-10 h-10 mb-2 opacity-50" /><p className="text-sm">Select a student from the left to begin.</p></div>}
        </div>
      </div>
    </div>
  );
}
