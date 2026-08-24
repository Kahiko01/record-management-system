"use client";
import { useState, useEffect } from "react";
import { UserSearch, CreditCard, CheckCircle2 } from "lucide-react";

export default function IssueIDPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedCard, setSelectedCard] = useState<string>("");

  useEffect(() => { fetchCards(); }, []);

  const fetchCards = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/id-management/cards', { headers: { 'Authorization': `Bearer ${token}` } });
      setCards(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleIssueID = async () => {
    if (!selectedStudent || !selectedCard) return alert("Please select a student and an ID card.");
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/id-management/issue', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: parseInt(selectedCard), student_id: selectedStudent.id, student_name: selectedStudent.name, student_programme: selectedStudent.programme, student_department: selectedStudent.department })
      });
      if (res.ok) { alert("✅ ID Card issued successfully!"); setSelectedStudent(null); setSelectedCard(""); fetchCards(); } 
      else { const err = await res.json(); alert(`❌ Error: ${err.detail}`); }
    } catch (err) { alert("Failed to issue ID card."); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Issue New ID</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Assign an IN_STOCK card to a student</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><UserSearch className="w-5 h-5 text-blue-600" /> 1. Search Student</h3>
          <button onClick={() => setSelectedStudent({ id: 999, name: "John Doe", programme: "BSc Computer Science", department: "School of ICT" })} className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition">
            Search (Demo: Click to mock select)
          </button>
          {selectedStudent && (
            <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="font-semibold text-blue-900 dark:text-blue-100">{selectedStudent.name}</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">{selectedStudent.programme}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">ID: {selectedStudent.id} • {selectedStudent.department}</p>
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-emerald-600" /> 2. Select Card & Issue</h3>
          <select value={selectedCard} onChange={(e) => setSelectedCard(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 mb-4">
            <option value="">Select an IN_STOCK card...</option>
            {cards.filter(c => c.status === 'IN_STOCK').map((card) => (
              <option key={card.id} value={card.id}>{card.card_number} ({card.serial_number})</option>
            ))}
          </select>
          <button onClick={handleIssueID} disabled={loading || !selectedStudent || !selectedCard} className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
            {loading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <CheckCircle2 className="w-5 h-5" />} Confirm Issuance
          </button>
        </div>
      </div>
    </div>
  );
}
