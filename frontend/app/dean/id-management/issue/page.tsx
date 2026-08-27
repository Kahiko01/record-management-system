"use client";

import { useState, useEffect } from "react";
import { Search, CreditCard, User, CheckCircle } from "lucide-react";

export default function IssueID() {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<any>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  useEffect(() => {
    // Fetch available IN_STOCK cards
    fetch("http://127.0.0.1:8000/id-cards?status=IN_STOCK", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCards(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  }, [token]);

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (query.length > 2) {
      const res = await fetch(`http://127.0.0.1:8000/students?search=${query}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      // Handle pagination wrapper if your backend returns {items: []} or just []
      setStudents(data.items || data); 
    } else {
      setStudents([]);
    }
  };

  const handleIssue = async () => {
    if (!selectedStudent || !selectedCard) return alert("Select a student and a card!");
    
    const res = await fetch(`http://127.0.0.1:8000/id-cards/${selectedCard.id}/assign`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ student_id: selectedStudent.id })
    });

    if (res.ok) {
      alert("✅ ID Card Assigned Successfully!");
      setSelectedStudent(null);
      setSelectedCard(null);
      // Refresh available cards
      const refreshRes = await fetch("http://127.0.0.1:8000/id-cards?status=IN_STOCK", { headers: { "Authorization": `Bearer ${token}` } });
      setCards(await refreshRes.json());
    } else {
      alert("❌ Failed to assign card. Check backend logs.");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <CreditCard className="text-blue-600" /> Issue ID Card
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Student Search */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">1. Search Student</h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Type admission number or name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {students.map((s: any) => (
              <div
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-blue-50 flex items-center gap-3 ${selectedStudent?.id === s.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              >
                <User className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="font-medium">{s.first_name} {s.last_name}</p>
                  <p className="text-sm text-gray-500">{s.student_id} - {s.program || s.programme}</p>
                </div>
              </div>
            ))}
          </div>
          {selectedStudent && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Selected: {selectedStudent.first_name} {selectedStudent.last_name}
            </div>
          )}
        </div>

        {/* Card Selection */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">2. Select Available Card</h2>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {cards.length === 0 && <p className="text-gray-500">No IN_STOCK cards available. Receive a batch first.</p>}
            {cards.map((c: any) => (
              <div
                key={c.id}
                onClick={() => setSelectedCard(c)}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-blue-50 ${selectedCard?.id === c.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              >
                <p className="font-mono font-medium">{c.card_number}</p>
                <p className="text-sm text-gray-500">Serial: {c.serial_number}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={handleIssue}
          disabled={!selectedStudent || !selectedCard}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          Issue Card to Student
        </button>
      </div>
    </div>
  );
}
