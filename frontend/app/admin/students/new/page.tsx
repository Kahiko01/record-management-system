"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "../../../components/TopBar";
import Sidebar from "../../../components/Sidebar";
import { UserPlus, ArrowLeft, Save, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function AddStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    admission_number: "",
    full_name: "",
    programme: "",
    department: "",
    school: "",
    registration_year: new Date().getFullYear().toString(),
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/students/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create student");
      }

      toast.success(`✅ Student ${formData.full_name} added successfully!`);
      router.push("/admin/students");
    } catch (error: any) {
      toast.error(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/admin/students" className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-emerald-500" />
                Add New Student
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Enter the student's academic and personal details</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
            
            {/* Section 1: Academic Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
                Academic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Admission Number *</label>
                  <input required name="admission_number" value={formData.admission_number} onChange={handleChange} placeholder="e.g., KNP/2024/001" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input required name="full_name" value={formData.full_name} onChange={handleChange} placeholder="e.g., John Kamau Mwangi" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Programme *</label>
                  <input required name="programme" value={formData.programme} onChange={handleChange} placeholder="e.g., Diploma in IT" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Department</label>
                  <input name="department" value={formData.department} onChange={handleChange} placeholder="e.g., Computing" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">School</label>
                  <input name="school" value={formData.school} onChange={handleChange} placeholder="e.g., School of ICT" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Registration Year</label>
                  <input type="number" name="registration_year" value={formData.registration_year} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
              </div>
            </div>

            <hr className="border-gray-200 dark:border-slate-800" />

            {/* Section 2: Personal Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">National ID</label>
                  <input name="national_id" value={formData.national_id} onChange={handleChange} placeholder="e.g., 12345678" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Date of Birth</label>
                  <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="student@email.com" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Phone</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} placeholder="07XX XXX XXX" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
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

            {/* Section 3: Guardian Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-amber-500 rounded-full"></span>
                Guardian / Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Guardian Name</label>
                  <input name="guardian_name" value={formData.guardian_name} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Guardian Phone</label>
                  <input name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} placeholder="07XX XXX XXX" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Link href="/admin/students" className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </Link>
              <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20">
                {loading ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Saving...</>
                ) : (
                  <><Save className="h-4 w-4" /> Save Student</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
