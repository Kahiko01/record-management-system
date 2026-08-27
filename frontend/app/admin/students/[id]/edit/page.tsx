"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Loader2, User } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    admission_number: "",
    full_name: "",
    programme: "",
    department: "",
    school: "",
    registration_year: "",
    status: "ACTIVE",
    gender: "",
    date_of_birth: "",
    national_id: "",
    email: "",
    phone: "",
    address: "",
    guardian_name: "",
    guardian_phone: ""
  });

  useEffect(() => {
    if (studentId) {
      fetchStudent();
    }
  }, [studentId]);

  const fetchStudent = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://127.0.0.1:8000/students/${studentId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const student = await res.json();
        setFormData({
          admission_number: student.admission_number || "",
          full_name: student.full_name || "",
          programme: student.programme || "",
          department: student.department || "",
          school: student.school || "",
          registration_year: student.registration_year || "",
          status: student.status || "ACTIVE",
          gender: student.gender || "",
          date_of_birth: student.date_of_birth || "",
          national_id: student.national_id || "",
          email: student.email || "",
          phone: student.phone || "",
          address: student.address || "",
          guardian_name: student.guardian_name || "",
          guardian_phone: student.guardian_phone || ""
        });
      } else {
        toast.error("Student not found");
        router.push("/admin/students");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load student data");
      router.push("/admin/students");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // TODO: Implement PUT /students/{id} in backend
      toast.success("Edit form loaded and ready! (Backend save endpoint coming next)");
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200">
      <div className="flex">
        <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <div className="flex items-center gap-4 mb-8">
            <Link href="/admin/students" className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="h-6 w-6 text-blue-500" />
                Edit Student: {formData.full_name || "Loading..."}
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Update student academic and personal details</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                Academic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Admission Number</label>
                  <input name="admission_number" value={formData.admission_number} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-500 cursor-not-allowed" readOnly />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input required name="full_name" value={formData.full_name} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Programme *</label>
                  <input required name="programme" value={formData.programme} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Department</label>
                  <input name="department" value={formData.department} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">School</label>
                  <input name="school" value={formData.school} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                    <option value="ACTIVE">Active</option>
                    <option value="GRADUATED">Graduated</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="WITHDRAWN">Withdrawn</option>
                    <option value="DEFERRED">Deferred</option>
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-gray-200 dark:border-slate-800" />

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
                Contact & Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">National ID</label>
                  <input name="national_id" value={formData.national_id} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Phone</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/admin/students" className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </Link>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-blue-900/20">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
