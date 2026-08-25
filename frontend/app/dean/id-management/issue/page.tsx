"use client";
import { useState, useEffect } from "react";
import { UserSearch, CreditCard, CheckCircle2, Search, Users } from "lucide-react";

export default function IssueIDPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedCard, setSelectedCard] = useState<string>("");

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

  const handleStudentSearch = async () => {
    if (studentSearch.length < 2) {
      alert("Please enter at least 2 characters to search");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(
        `http://localhost:8000/id-management/students/search?search=${encodeURIComponent(studentSearch)}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      setStudentResults(data);
      if (data.length === 0) {
        alert("No students found. Try a different search term.");
      }
    } catch (err) { 
      console.error(err);
      alert("Failed to search students");
    } finally { 
      setLoading(false); 
    }
  };

  const handleIssueID = async () => {
    if (!selectedStudent || !selectedCard) return alert("Please select a student and an ID card.");
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/id-management/issue', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          card_id: parseInt(selectedCard),
          student_id: selectedStudent.id,
          student_name: selectedStudent.full_name,
          student_programme: selectedStudent.programme,
          student_department: selectedStudent.department,
          notes: `Issued to ${selectedStudent.admission_number}`
        })
      });
      if (res.ok) {
        alert(`✅ ID Card issued successfully to ${selectedStudent.full_name}!`);
        setSelectedStudent(null);
        setSelectedCard("");
        setStudentSearch("");
        setStudentResults([]);
        fetchCards();
      } else {
        const err = await res.json();
        alert(`❌ Error: ${err.detail}`);
      }
    } catch (err) { alert("Failed to issue ID card."); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Issue New ID</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Assign an IN_STOCK card to a real student</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Search Real Student */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <UserSearch className="w-5 h-5 text-blue-600" /> 1. Search Student
          </h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Admission No. or Name (e.g., ADM/2024 or John)..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStudentSearch()}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleStudentSearch}
                disabled={loading}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {studentResults.length > 0 && !selectedStudent && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <p className="text-xs font-semibold uppercase text-gray-500">Search Results:</p>
                {studentResults.map(student => (
                  <button
                    key={student.id}
                    onClick={() => {
                      setSelectedStudent(student);
                      setStudentResults([]);
                    }}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-500 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{student.full_name}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">{student.admission_number}</p>
                        <p className="text-xs text-gray-500 mt-1">{student.programme}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        student.status === 'ACTIVE' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {student.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedStudent && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100">{selectedStudent.full_name}</p>
                    <p className="text-sm font-mono text-blue-700 dark:text-blue-300">{selectedStudent.admission_number}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedStudent(null); setStudentSearch(""); }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Change
                  </button>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">{selectedStudent.programme}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {selectedStudent.department} • Year {selectedStudent.year_of_study}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Select Card & Issue */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" /> 2. Select Card & Issue
          </h3>
          <div className="space-y-4">
            <select
              value={selectedCard}
              onChange={(e) => setSelectedCard(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select an IN_STOCK card...</option>
              {cards.filter(c => c.status === 'IN_STOCK').map((card) => (
                <option key={card.id} value={card.id}>
                  {card.card_number} ({card.serial_number})
                </option>
              ))}
            </select>

            {selectedStudent && selectedCard && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 text-sm">
                <p className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">Ready to Issue:</p>
                <p className="text-emerald-700 dark:text-emerald-300">
                  Card <strong>{cards.find(c => c.id === parseInt(selectedCard))?.card_number}</strong> → {selectedStudent.full_name}
                </p>
              </div>
            )}

            <button
              onClick={handleIssueID}
              disabled={loading || !selectedStudent || !selectedCard}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              Confirm Issuance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
