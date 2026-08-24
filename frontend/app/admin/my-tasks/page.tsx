"use client";

import { useState, useEffect } from "react";
import { clearanceApi } from "@/app/lib/api";
import { CheckCircle, XCircle, Clock, Loader2, AlertTriangle } from "lucide-react";
import Sidebar from "@/app/components/Sidebar";
import TopBar from "@/app/components/TopBar";
import { useWebSocket } from "@/app/hooks/useWebSocket";

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [modalAction, setModalAction] = useState<"cleared" | "not_cleared">("cleared");
  const [modalNotes, setModalNotes] = useState("");

  const fetchTasks = async () => {
    try {
      const res = await clearanceApi.getMyTasks();
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useWebSocket({
    onMessage: (message) => {
      if (message.type === "TASK_UPDATED") {
        fetchTasks();
      }
    }
  });

  const handleClaimTask = async (taskId: number) => {
    setUpdating(taskId);
    try {
      await clearanceApi.updateTaskStatus(taskId, { 
        status: "in_review", 
        notes: `Claimed at ${new Date().toLocaleTimeString()}` 
      });
      await fetchTasks(); // Refresh immediately
    } catch (err: any) {
      console.error("Claim failed:", err);
      alert(`Failed to claim: ${err.response?.data?.detail || "Unknown error"}`);
    } finally {
      setUpdating(null);
    }
  };

  const openModal = (task: any, action: "cleared" | "not_cleared") => {
    setSelectedTask(task);
    setModalAction(action);
    setModalNotes("");
    setShowModal(true);
  };

  const handleModalConfirm = async () => {
    if (!selectedTask) return;
    
    setUpdating(selectedTask.id);
    setShowModal(false);
    
    try {
      await clearanceApi.updateTaskStatus(selectedTask.id, { 
        status: modalAction, 
        notes: modalNotes || `Updated at ${new Date().toLocaleTimeString()}` 
      });
      await fetchTasks();
    } catch (err: any) {
      alert(`Failed: ${err.response?.data?.detail || "Unknown error"}`);
    } finally {
      setUpdating(null);
      setSelectedTask(null);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Clearance Tasks</h1>
              <button onClick={fetchTasks} className="text-sm text-blue-600 hover:underline">
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border">
                <p className="text-gray-500">No tasks assigned to you.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {tasks.map((task) => (
                  <div key={task.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{task.template_name}</h3>
                        <p className="text-sm text-gray-500">
                          Status: <span className="font-bold uppercase">{task.status}</span> • 
                          Department: <span className="capitalize">{task.department}</span>
                        </p>
                        {task.notes && (
                          <p className="text-sm text-gray-600 mt-2 italic">"{task.notes}"</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {task.status === "pending" && (
                          <button
                            onClick={() => handleClaimTask(task.id)}
                            disabled={updating === task.id}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {updating === task.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Claim & Review"
                            )}
                          </button>
                        )}
                        
                        {task.status === "in_review" && (
                          <>
                            <button
                              onClick={() => openModal(task, "cleared")}
                              disabled={updating === task.id}
                              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 inline mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => openModal(task, "not_cleared")}
                              disabled={updating === task.id}
                              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                              <XCircle className="w-4 h-4 inline mr-1" />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {showModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {modalAction === "cleared" ? "Approve Task" : "Reject Task"}
            </h2>
            <p className="mb-4">Confirm: <strong>{selectedTask.template_name}</strong></p>
            <textarea
              value={modalNotes}
              onChange={(e) => setModalNotes(e.target.value)}
              placeholder="Add notes..."
              className="w-full p-2 border rounded mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded">
                Cancel
              </button>
              <button
                onClick={handleModalConfirm}
                className={`flex-1 px-4 py-2 text-white rounded ${
                  modalAction === "cleared" ? "bg-green-600" : "bg-red-600"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
