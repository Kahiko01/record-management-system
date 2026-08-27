"use client";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";

export default function InventoryPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/id-management/cards?search=${searchQuery}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCards(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ID Inventory</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage and search all ID cards</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search by Card Number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchInventory()} className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={fetchInventory} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Search</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3 font-medium">Card Number</th>
                <th className="px-6 py-3 font-medium">Serial Number</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr> :
               cards.length === 0 ? <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No cards found.</td></tr> :
               cards.map((card) => (
                 <tr key={card.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                   <td className="px-6 py-4 font-mono text-gray-900 dark:text-white">{card.card_number}</td>
                   <td className="px-6 py-4 font-mono text-gray-500">{card.serial_number}</td>
                   <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                       card.status === 'IN_STOCK' ? 'bg-emerald-100 text-emerald-700' :
                       card.status === 'ISSUED' ? 'bg-blue-100 text-blue-700' :
                       card.status === 'ASSIGNED' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                     }`}>{card.status}</span>
                   </td>
                   <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{card.assigned_to_student_id ? `Student ID: ${card.assigned_to_student_id}` : '-'}</td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
