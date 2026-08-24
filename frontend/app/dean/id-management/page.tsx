"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/app/components/Sidebar";
import TopBar from "@/app/components/TopBar";
import {
  CreditCard, Package, CheckCircle2, AlertTriangle, XCircle,
  Clock, Search, Activity, UserSearch, FileSignature, Handshake,
  RefreshCw, FileText
} from "lucide-react";

export default function IDManagementPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "inventory" | "issue" | "collection" | "replace" | "audit">("dashboard");
  const [stats, setStats] = useState({ total_cards: 0, in_stock: 0, issued: 0, lost: 0, damaged: 0, pending_collection: 0 });
  const [cards, setCards] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Issue State
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedCard, setSelectedCard] = useState<string>("");

  // Collection State
  const [collectionSearch, setCollectionSearch] = useState("");
  const [assignedCards, setAssignedCards] = useState<any[]>([]);
  const [selectedCollectionCard, setSelectedCollectionCard] = useState<any>(null);
  const [signatureAcknowledged, setSignatureAcknowledged] = useState(false);

  // --- REPLACEMENT LOGIC ---
  const [replaceSearch, setReplaceSearch] = useState("");
  const [foundIssuedCards, setFoundIssuedCards] = useState<any[]>([]);
  const [selectedOldCard, setSelectedOldCard] = useState<any>(null);
  const [replaceReason, setReplaceReason] = useState<"LOST" | "DAMAGED">("LOST");
  const [replaceNotes, setReplaceNotes] = useState("");
  const [feePaid, setFeePaid] = useState(false);
  const [selectedNewCard, setSelectedNewCard] = useState<string>("");

  useEffect(() => {
    if (activeTab === "dashboard") fetchDashboardStats();
    if (activeTab === "inventory" || activeTab === "issue" || activeTab === "replace") fetchInventory();
    if (activeTab === "audit") fetchAuditLogs();
  }, [activeTab]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/id-management/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/id-management/cards', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // DEBUG: Alert if the API fails
      if (!res.ok) {
        const errText = await res.text();
        alert(`❌ API Error: ${res.status} - ${errText}`);
        return;
      }

      const data = await res.json();
      console.log("✅ Fetched cards:", data);
      setCards(data);
    } catch (err) {
      console.error(err);
      alert("❌ Network error fetching cards. Is the backend running?");
    }
    finally { setLoading(false); }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/id-management/audit-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAuditLogs(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // --- ISSUE LOGIC ---
  const handleIssueID = async () => {
    if (!selectedStudent || !selectedCard) return alert("Please select a student and an ID card.");
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/id-management/issue', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: parseInt(selectedCard),
          student_id: selectedStudent.id,
          student_name: selectedStudent.name,
          student_programme: selectedStudent.programme,
          student_department: selectedStudent.department,
          notes: "Issued via Dean Dashboard"
        })
      });
      if (res.ok) {
        alert("✅ ID Card issued successfully! Status is now ASSIGNED.");
        setSelectedStudent(null); setSelectedCard(""); setStudentSearch("");
        fetchInventory(); // Refresh the card list
      } else {
        const err = await res.json();
        alert(`❌ Backend blocked this action:\n\n${err.detail}`);
      }
    } catch (err) { alert("Failed to issue ID card."); }
    finally { setLoading(false); }
  };

  // --- COLLECTION LOGIC ---
  const handleSearchForCollection = () => {
    // Mock search: In production, this calls GET /students?search=...
    if (collectionSearch.toLowerCase() === "john" || collectionSearch === "999") {
      setAssignedCards([
        { id: 1, card_number: "CARD-2026-0001", serial_number: "SN20260001", student_name: "John Doe", programme: "BSc Computer Science" }
      ]);
    } else {
      setAssignedCards([]);
      alert("No pending collections found for this student. (Try searching 'John')");
    }
  };

  const handleRecordCollection = async () => {
    if (!selectedCollectionCard) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/id-management/collect', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: selectedCollectionCard.id,
          student_id: 999, // Mock student ID
          signature_acknowledged: signatureAcknowledged,
          notes: "Collected in person at Dean's Office"
        })
      });
      if (res.ok) {
        alert("✅ Collection recorded successfully! Card status is now ISSUED.");
        setSelectedCollectionCard(null);
        setAssignedCards([]);
        setCollectionSearch("");
        setSignatureAcknowledged(false);
        fetchInventory(); // Refresh the card list
      } else {
        const err = await res.json();
        alert(`❌ Backend blocked this action:\n\n${err.detail}`);
      }
    } catch (err) { alert("Failed to record collection."); }
    finally { setLoading(false); }
  };

  // --- REPLACEMENT LOGIC ---
  const handleSearchForReplacement = () => {
    // Mock search: Finds an ISSUED card in our local state
    const issued = cards.filter(c => c.status === "ISSUED");
    if (issued.length > 0 && (replaceSearch.toLowerCase() === "john" || replaceSearch === "999")) {
      setFoundIssuedCards(issued);
    } else {
      setFoundIssuedCards([]);
      alert("No ISSUED cards found for this student. (Try searching 'John' after issuing a card first).");
    }
  };

  const handleReplaceID = async () => {
    if (!selectedOldCard || !selectedNewCard) return alert("Please select the old card and a new IN_STOCK card.");
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/id-management/replace', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          old_card_id: selectedOldCard.id,
          new_card_id: parseInt(selectedNewCard),
          reason: replaceReason,
          fee_paid: feePaid,
          notes: replaceNotes
        })
      });
      if (res.ok) {
        alert(`✅ Replacement successful! Old card marked as ${replaceReason}.`);
        setSelectedOldCard(null); setSelectedNewCard(""); setReplaceNotes(""); setFeePaid(false);
        setFoundIssuedCards([]); setReplaceSearch("");
        setActiveTab("inventory"); // Go to inventory to see the changes
        fetchInventory();
      } else {
        const err = await res.json();
        alert(`❌ Backend blocked this action:\n\n${err.detail}`);
      }
    } catch (err) { alert("Failed to process replacement."); }
    finally { setLoading(false); }
  };

  const statCards = [
    { label: "Total Cards", value: stats.total_cards, icon: CreditCard, color: "bg-blue-500" },
    { label: "In Stock", value: stats.in_stock, icon: Package, color: "bg-emerald-500" },
    { label: "Issued", value: stats.issued, icon: CheckCircle2, color: "bg-purple-500" },
    { label: "Pending Collection", value: stats.pending_collection, icon: Clock, color: "bg-amber-500" },
    { label: "Lost", value: stats.lost, icon: AlertTriangle, color: "bg-red-500" },
    { label: "Damaged", value: stats.damaged, icon: XCircle, color: "bg-rose-500" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">

            {/* Clean Header - No Dropdown */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ID Dashboard</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Overview of ID Card Custody</p>
            </div>

            {/* DASHBOARD TAB */}
            {activeTab === "dashboard" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statCards.map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                          <Icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? "..." : stat.value}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* INVENTORY TAB */}
            {activeTab === "inventory" && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400">
                      <tr>
                        <th className="px-6 py-3 font-medium">Card Number</th>
                        <th className="px-6 py-3 font-medium">Serial Number</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Assigned To</th>
                        <th className="px-6 py-3 font-medium">Issued Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {loading ? (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading inventory...</td></tr>
                      ) : cards.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No cards found.</td></tr>
                      ) : (
                        cards.map((card) => (
                          <tr key={card.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                            <td className="px-6 py-4 font-mono text-gray-900 dark:text-white">{card.card_number}</td>
                            <td className="px-6 py-4 font-mono text-gray-500">{card.serial_number}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                card.status === 'IN_STOCK' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                card.status === 'ISSUED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                card.status === 'ASSIGNED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>{card.status}</span>
                            </td>
                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{card.assigned_to_student_id ? `Student ID: ${card.assigned_to_student_id}` : '-'}</td>
                            <td className="px-6 py-4 text-gray-500">{card.issued_date ? new Date(card.issued_date).toLocaleDateString() : '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ISSUE ID TAB */}
            {activeTab === "issue" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <UserSearch className="w-5 h-5 text-blue-600" /> 1. Search Student
                  </h3>
                  <div className="space-y-4">
                    <input type="text" placeholder="Enter Admission Number or Name..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500" />
                    <button onClick={() => setSelectedStudent({ id: 999, name: "John Doe", programme: "BSc Computer Science", department: "School of ICT" })} className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                      Search (Demo: Click to mock select)
                    </button>
                    {selectedStudent && (
                      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <p className="font-semibold text-blue-900 dark:text-blue-100">{selectedStudent.name}</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">{selectedStudent.programme}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">ID: {selectedStudent.id} • {selectedStudent.department}</p>
                      </div>
                    )}
                  </div>
                </div>
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
                      {/* Dynamically map over cards that are IN_STOCK */}
                      {cards.filter(c => c.status === 'IN_STOCK').map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.card_number} ({card.serial_number})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleIssueID}
                      className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                    >
                      {loading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <CheckCircle2 className="w-5 h-5" />}
                      Confirm Issuance
                    </button>
                    {cards.filter(c => c.status === 'IN_STOCK').length === 0 && (
                      <p className="text-sm text-amber-600 dark:text-amber-400 text-center">⚠️ No IN_STOCK cards available. Please receive a new batch.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* RECORD COLLECTION TAB */}
            {activeTab === "collection" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Step 1: Find Pending Collections */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-600" /> 1. Find Student with Pending ID
                  </h3>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter Admission No. or Name (Try 'John')..."
                        value={collectionSearch}
                        onChange={(e) => setCollectionSearch(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={handleSearchForCollection} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                        Search
                      </button>
                    </div>

                    {assignedCards.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase text-gray-500">Pending Collections:</p>
                        {assignedCards.map(card => (
                          <button
                            key={card.id}
                            onClick={() => setSelectedCollectionCard(card)}
                            className={`w-full text-left p-3 rounded-lg border transition ${
                              selectedCollectionCard?.id === card.id
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                          >
                            <p className="font-medium text-gray-900 dark:text-white">{card.student_name}</p>
                            <p className="text-xs text-gray-500">{card.card_number} • {card.programme}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2: Verify & Record Collection */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Handshake className="w-5 h-5 text-emerald-600" /> 2. Verify & Record Handover
                  </h3>

                  {selectedCollectionCard ? (
                    <div className="space-y-6">
                      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between mb-2">
                          <span className="text-xs font-semibold uppercase text-gray-500">Student</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedCollectionCard.student_name}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-xs font-semibold uppercase text-gray-500">ID Card</span>
                          <span className="text-sm font-mono text-gray-900 dark:text-white">{selectedCollectionCard.card_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs font-semibold uppercase text-gray-500">Serial</span>
                          <span className="text-sm font-mono text-gray-500">{selectedCollectionCard.serial_number}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                        <input
                          type="checkbox"
                          id="signature"
                          checked={signatureAcknowledged}
                          onChange={(e) => setSignatureAcknowledged(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="signature" className="text-sm text-amber-900 dark:text-amber-200">
                          <span className="font-semibold block">Student Signature Acknowledged</span>
                          <span className="text-xs opacity-80">I confirm that the student has physically received this card and signed the register.</span>
                        </label>
                      </div>

                      <button
                        onClick={handleRecordCollection}
                        disabled={loading || !signatureAcknowledged}
                        className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                      >
                        {loading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <FileSignature className="w-5 h-5" />}
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
            )}

            {/* LOST/DAMAGED & REPLACE TAB */}
            {activeTab === "replace" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Step 1: Find the Issued Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" /> 1. Report Lost/Damaged Card
                  </h3>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text" placeholder="Search Student (Try 'John')..."
                        value={replaceSearch} onChange={(e) => setReplaceSearch(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-red-500"
                      />
                      <button onClick={handleSearchForReplacement} className="px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Search</button>
                    </div>

                    {foundIssuedCards.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase text-gray-500">Currently ISSUED Cards:</p>
                        {foundIssuedCards.map(card => (
                          <button key={card.id} onClick={() => setSelectedOldCard(card)}
                            className={`w-full text-left p-3 rounded-lg border transition ${selectedOldCard?.id === card.id ? "border-red-500 bg-red-50 dark:bg-red-900/20" : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                            <p className="font-medium text-gray-900 dark:text-white">{card.card_number}</p>
                            <p className="text-xs text-gray-500">Student ID: {card.assigned_to_student_id}</p>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedOldCard && (
                      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Reason for Replacement</label>
                          <div className="flex gap-2">
                            <button onClick={() => setReplaceReason("LOST")} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${replaceReason === "LOST" ? "bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "border-gray-300 dark:border-gray-600"}`}>Lost</button>
                            <button onClick={() => setReplaceReason("DAMAGED")} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${replaceReason === "DAMAGED" ? "bg-amber-100 border-amber-500 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "border-gray-300 dark:border-gray-600"}`}>Damaged</button>
                          </div>
                        </div>
                        <textarea placeholder="Incident details..." value={replaceNotes} onChange={(e) => setReplaceNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm h-20" />
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                          <input type="checkbox" checked={feePaid} onChange={(e) => setFeePaid(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                          Replacement Fee Paid (KES 500)
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2: Select New Card & Confirm */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-600" /> 2. Assign New Card
                  </h3>
                  {selectedOldCard ? (
                    <div className="space-y-4">
                      <select value={selectedNewCard} onChange={(e) => setSelectedNewCard(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500">
                        <option value="">Select an IN_STOCK card...</option>
                        {cards.filter(c => c.status === 'IN_STOCK').map(card => (
                          <option key={card.id} value={card.id}>{card.card_number} ({card.serial_number})</option>
                        ))}
                      </select>

                      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-xs text-gray-500">
                        <p className="font-semibold mb-1">🛡️ Anti-Fraud Audit:</p>
                        <p>• Old card will be permanently marked as <strong>{replaceReason}</strong>.</p>
                        <p>• New card will be linked to the old card's history.</p>
                        <p>• Action will be logged with your user ID and timestamp.</p>
                      </div>

                      <button onClick={handleReplaceID} disabled={loading || !selectedNewCard} className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
                        {loading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <CheckCircle2 className="w-5 h-5" />}
                        Confirm Replacement
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                      <AlertTriangle className="w-10 h-10 mb-2 opacity-50" />
                      <p className="text-sm">Select a lost/damaged card from the left to begin.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AUDIT LOGS TAB */}
            {activeTab === "audit" && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" /> Unified Audit Trail
                  </h3>
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {auditLogs.length} records found
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400">
                      <tr>
                        <th className="px-6 py-3 font-medium">Timestamp</th>
                        <th className="px-6 py-3 font-medium">Action</th>
                        <th className="px-6 py-3 font-medium">Card Number</th>
                        <th className="px-6 py-3 font-medium">Student</th>
                        <th className="px-6 py-3 font-medium">Officer</th>
                        <th className="px-6 py-3 font-medium">IP Address</th>
                        <th className="px-6 py-3 font-medium">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {loading ? (
                        <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading audit logs...</td></tr>
                      ) : auditLogs.length === 0 ? (
                        <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No audit logs found. Perform an action to generate logs.</td></tr>
                      ) : (
                        auditLogs.map((log, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                            <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                log.action.includes("ISSUED") ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                log.action.includes("COLLECTED") ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-gray-900 dark:text-white">{log.card_number}</td>
                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{log.student_name}</td>
                            <td className="px-6 py-4 text-gray-500">{log.officer}</td>
                            <td className="px-6 py-4 font-mono text-xs text-gray-500">{log.ip_address}</td>
                            <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate" title={log.details}>{log.details}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
