"use client";

import { useState, useEffect } from "react";
import { Search, User, CreditCard, CheckCircle } from "lucide-react";

export default function IssueIDPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  useEffect(() => {
    // FIXED: Correct backend endpoint
    fetch("http://127.0.0.1:8000/id-management/cards?status=IN_STOCK", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCards(Array.isArray(data) ? data : []))
      .catch(err => console.error("Failed to fetch cards:", err));
  }, [token]);

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (query.length > 2) {
      try {
        // FIXED: Use the dedicated ID management student search endpoint
        const res = await fetch(`http://127.0.0.1:8000/id-management/students/search?search=${encodeURIComponent(query)}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        setStudents(Array.isArray(data) ? data : []); 
      } catch (err) {
        console.error("Search error:", err);
        setStudents([]);
      }
    } else {
      setStudents([]);
    }
  };

  const handleIssue = async () => {
    if (!selectedStudent || !selectedCard) {
      alert("Please select both a student and an ID card.");
      return;
    }
    setLoading(true);
    try {
      // FIXED: Correct backend endpoint for issuing
      const res = await fetch("http://127.0.0.1:8000/id-management/issue", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          card_id: selectedCard.id,
          student_id: selectedStudent.id,
          student_name: selectedStudent.full_name || "Unknown",
          student_programme: selectedStudent.programme || "N/A",
          student_department: selectedStudent.department || "N/A",
          notes: "Issued via Dean Dashboard"
        })
      });
      
      if (res.ok) {
        alert("✅ ID Card successfully assigned to student!");
        setSelectedStudent(null);
        setSelectedCard(null);
        setSearch("");
        setStudents([]);
        
        // Refresh available cards
        const cardsRes = await fetch("http://127.0.0.1:8000/id-management/cards?status=IN_STOCK", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        setCards(await cardsRes.json());
      } else {
        const err = await res.json();
        alert(`❌ Failed to assign: ${err.detail || "Unknown error"}`);
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
          <CreditCard className="text-blue-600 dark:text-blue-400" /> Issue ID Card
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Assign an in-stock ID card to a student</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Search */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" /> 1. Search Student
          </h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Type admission number or name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors duration-200"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {students.map((s: any) => (
              <div
                key={s.id}
                onClick={() => { setSelectedStudent(s); setSelectedCard(null); }}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-3 transition-colors duration-200 ${
                  selectedStudent?.id === s.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500' 
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{s.full_name || "Unknown"}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{s.admission_number} • {s.programme || "N/A"}</p>
                </div>
              </div>
            ))}
            {search.length > 2 && students.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No students found. Try a different name.</p>
            )}
          </div>
        </div>

        {/* Card Selection */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" /> 2. Select ID Card
          </h2>
          {!selectedStudent ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg">
              <User className="w-8 h-8 mb-2" />
              <p>Select a student first</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">Assigning to:</p>
                <p className="text-blue-900 dark:text-blue-100 font-bold">{selectedStudent.full_name || "Unknown"}</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">{selectedStudent.admission_number}</p>
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {cards.map((card: any) => (
                  <div
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/30 flex items-center justify-between transition-colors duration-200 ${
                      selectedCard?.id === card.id 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30 dark:border-green-500' 
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div>
                      <p className="font-mono font-medium text-gray-900 dark:text-white">{card.card_number}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Batch: {card.batch_number || "N/A"}</p>
                    </div>
                    <CheckCircle className={`w-5 h-5 ${selectedCard?.id === card.id ? 'text-green-600 dark:text-green-400' : 'text-gray-300 dark:text-gray-600'}`} />
                  </div>
                ))}
                {cards.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No IN_STOCK cards available. Go to "Receive Batch" first.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleIssue}
          disabled={!selectedStudent || !selectedCard || loading}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
        >
          {loading ? "Processing..." : "Confirm & Issue ID Card"}
        </button>
      </div>
    </div>
  );
}
