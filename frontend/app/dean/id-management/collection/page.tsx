"use client";
import { useState } from "react";
import { Search, Handshake, FileSignature } from "lucide-react";

export default function CollectionPage() {
  const [collectionSearch, setCollectionSearch] = useState("");
  const [assignedCards, setAssignedCards] = useState<any[]>([]);
  const [selectedCollectionCard, setSelectedCollectionCard] = useState<any>(null);
  const [signatureAcknowledged, setSignatureAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearchForCollection = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const url = collectionSearch.trim()
        ? `http://localhost:8000/id-management/cards/pending-collection?search=${encodeURIComponent(collectionSearch)}`
        : `http://localhost:8000/id-management/cards/pending-collection`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setAssignedCards(data);
      if (data.length === 0) {
        alert("No pending collections found. Try a different search or issue a card first.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to search");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordCollection = async () => {
    if (!selectedCollectionCard) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/id-management/collect', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          card_id: selectedCollectionCard.card_id,
          student_id: selectedCollectionCard.student_id,
          signature_acknowledged: signatureAcknowledged,
          notes: `Collected by ${selectedCollectionCard.full_name}`
        })
      });
      if (res.ok) {
        alert(`✅ Collection recorded for ${selectedCollectionCard.full_name}!`);
        setSelectedCollectionCard(null);
        setAssignedCards([]);
        setCollectionSearch("");
        setSignatureAcknowledged(false);
      } else {
        const err = await res.json();
        alert(`❌ Error: ${err.detail}`);
      }
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
        {/* Step 1: Find Pending Collections */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" /> 1. Find Student with Pending ID
          </h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Admission No. or Name..."
              value={collectionSearch}
              onChange={(e) => setCollectionSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchForCollection()}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearchForCollection}
              disabled={loading}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Search
            </button>
          </div>
          <button
            onClick={() => { setCollectionSearch(""); handleSearchForCollection(); }}
            className="text-xs text-blue-600 hover:underline mb-3"
          >
            Show all pending collections
          </button>
          
          {assignedCards.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {assignedCards.map(card => (
                <button
                  key={card.card_id}
                  onClick={() => setSelectedCollectionCard(card)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    selectedCollectionCard?.card_id === card.card_id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{card.full_name}</p>
                      <p className="text-xs font-mono text-blue-600 dark:text-blue-400">{card.admission_number}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Card: {card.card_number} • {card.programme}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      PENDING
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Verify & Record */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Handshake className="w-5 h-5 text-emerald-600" /> 2. Verify & Record Handover
          </h3>
          {selectedCollectionCard ? (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-semibold uppercase text-gray-500">Student</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedCollectionCard.full_name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-semibold uppercase text-gray-500">Admission No.</span>
                  <span className="text-sm font-mono text-blue-600 dark:text-blue-400">{selectedCollectionCard.admission_number}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-semibold uppercase text-gray-500">ID Card</span>
                  <span className="text-sm font-mono text-gray-900 dark:text-white">{selectedCollectionCard.card_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-semibold uppercase text-gray-500">Programme</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{selectedCollectionCard.programme}</span>
                </div>
              </div>

              <label className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={signatureAcknowledged}
                  onChange={(e) => setSignatureAcknowledged(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-amber-900 dark:text-amber-200">
                  <span className="font-semibold block">Student Signature Acknowledged</span>
                  <span className="text-xs opacity-80">I confirm the student has physically received this card and signed the register.</span>
                </span>
              </label>

              <button
                onClick={handleRecordCollection}
                disabled={loading || !signatureAcknowledged}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <FileSignature className="w-5 h-5" />
                )}
                Record Collection & Update Status to ISSUED
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Handshake className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">Select a student from the left to begin verification.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
