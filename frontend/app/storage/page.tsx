"use client";

import { useState, useEffect } from "react";
import { useAuth, Permission } from "../context/AuthContext";
import { storageApi, registryApi } from "../lib/api";
import { StorageLocation } from "../types";
import { MapPin, Search, RefreshCw, Plus, Edit, Trash2, X, Package } from "lucide-react";

export default function StoragePage() {
  const { hasPermission } = useAuth();
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'locations' | 'inventory'>('locations');
  const [filters, setFilters] = useState({ search: "", building: "" });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLocation, setNewLocation] = useState({ building: "", room: "", shelf: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [locationsRes, inventoryRes] = await Promise.all([
        storageApi.getLocations(),
        registryApi.getCertificates(filters),
      ]);
      setLocations(locationsRes.data || []);
      setInventory(inventoryRes.data || []);
    } catch (error) {
      console.error("Failed to fetch storage data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocation = async () => {
    try {
      await storageApi.createLocation(newLocation);
      alert("Storage location created successfully!");
      setShowCreateModal(false);
      setNewLocation({ building: "", room: "", shelf: "" });
      fetchData();
    } catch (error) {
      console.error("Failed to create storage location:", error);
      alert("Failed to create storage location.");
    }
  };

  const handleDeleteLocation = async (locationId: number) => {
    if (!confirm("Are you sure you want to delete this storage location?")) return;
    try {
      await storageApi.deleteLocation(locationId);
      fetchData();
    } catch (error) {
      console.error("Failed to delete storage location:", error);
      alert("Failed to delete storage location.");
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-slate-800 border-t-emerald-500"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200">
      <div className="flex">
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><MapPin className="h-6 w-6 text-emerald-500" /> Storage Management</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage physical storage locations and certificate inventory</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
              {hasPermission(Permission.STORAGE_MANAGE) && (
                <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-blue-900/20">
                  <Plus className="h-4 w-4" /> Add Location
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-1 mb-6">
            <button onClick={() => setActiveTab('locations')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'locations' ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}>
              <MapPin className="h-4 w-4" /> Storage Locations
            </button>
            <button onClick={() => setActiveTab('inventory')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'inventory' ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}>
              <Package className="h-4 w-4" /> Inventory by Location
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Search</label>
                <input type="text" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} onKeyPress={(e) => e.key === "Enter" && fetchData()} placeholder="e.g. Building A or CERT/2024/001" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div className="w-40">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Building</label>
                <select value={filters.building} onChange={(e) => setFilters({ ...filters, building: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                  <option value="">All Buildings</option>
                  <option value="Building A">Building A</option>
                  <option value="Building B">Building B</option>
                  <option value="Building C">Building C</option>
                  <option value="Main Library">Main Library</option>
                </select>
              </div>
              <button onClick={fetchData} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20">Search</button>
              <button onClick={() => { setFilters({ search: "", building: "" }); setTimeout(fetchData, 100); }} className="px-4 py-2.5 text-sm font-medium text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors">Clear</button>
            </div>
          </div>

          {/* Storage Locations Table */}
          {activeTab === 'locations' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Building</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Room</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Shelf</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Certificates</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                    {locations.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-500 dark:text-slate-500"><MapPin className="h-12 w-12 text-emerald-500/30 mx-auto mb-3" /><p className="font-medium">No storage locations found</p></td></tr>
                    ) : (
                      locations.map((location) => (
                        <tr key={location.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{location.building}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">{location.room}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">{location.shelf}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">{location.certificate_count || 0}</td>
                          <td className="px-6 py-4">
                            {hasPermission(Permission.STORAGE_MANAGE) && (
                              <div className="flex gap-2">
                                <button onClick={() => alert(`Edit location: ${location.building}`)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleDeleteLocation(location.id)} className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Inventory by Location Table */}
          {activeTab === 'inventory' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Certificate No</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                    {inventory.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-16 text-center text-gray-500 dark:text-slate-500"><Package className="h-12 w-12 text-emerald-500/30 mx-auto mb-3" /><p className="font-medium">No inventory found</p></td></tr>
                    ) : (
                      inventory.map((item: any) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{item.certificate_number}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">{item.student_name}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">{item.building} - Room {item.room} - Shelf {item.shelf}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${item.status === 'collected' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'}`}>
                              {item.status === 'collected' ? ' Collected' : ' In Storage'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Location Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="text-emerald-500" /> Add Storage Location
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Building</label>
                <input type="text" value={newLocation.building} onChange={(e) => setNewLocation({ ...newLocation, building: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="e.g. Building A" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Room</label>
                <input type="text" value={newLocation.room} onChange={(e) => setNewLocation({ ...newLocation, room: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="e.g. Room 101" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Shelf</label>
                <input type="text" value={newLocation.shelf} onChange={(e) => setNewLocation({ ...newLocation, shelf: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="e.g. Shelf A-1" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleCreateLocation} className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors">Create Location</button>
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 px-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold rounded-xl transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
