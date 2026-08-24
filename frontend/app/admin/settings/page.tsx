"use client";

import { useState, useRef } from "react";
import Sidebar from "@/app/components/Sidebar";
import TopBar from "@/app/components/TopBar";
import { useTheme } from "@/app/context/ThemeContext";
import { useAuth } from "@/app/context/AuthContext";
import {
  User, Shield, Bell, Building2, Save, Monitor, Moon, Sun,
  Mail, Lock, Camera, Phone, AlertCircle
} from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, isAdmin } = useAuth(); // Get user and role checks

  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications" | "institution">("profile");
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Granular Tabs: Institution is ONLY visible to Admins/Super Admins
  const baseTabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  const allTabs = isAdmin()
    ? [...baseTabs, { id: "institution", label: "Institution", icon: Building2 }]
    : baseTabs;

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1500); // Simulate API save
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoString = reader.result as string;
        setProfileImage(photoString);
        
        // Save to localStorage so TopBar can access it
        // Save to localStorage scoped to the current user
if (user?.username) {
  localStorage.setItem(`profile_photo_${user.username}`, photoString);
}
        
        // Tell the TopBar to update instantly
        window.dispatchEvent(new Event('profilePhotoUpdated'));
      };
      reader.readAsDataURL(file);
    }
  };

  const userInitials = user?.username?.substring(0, 2).toUpperCase() || "U";

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage your account preferences and system configurations.
              </p>
              {user?.role && (
                <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  <AlertCircle className="w-3 h-3" />
                  Viewing as: {user.role.replace('_', ' ').toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Sidebar Tabs */}
              <div className="w-full md:w-64 flex-shrink-0">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  {allTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors border-l-4 ${
                          activeTab === tab.id
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-600"
                            : "text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">

                {/* PROFILE TAB */}
                {activeTab === "profile" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" /> Profile Settings
                    </h2>

                    {/* Profile Photo Upload */}
                    <div className="flex items-center gap-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <div className="relative">
                        {profileImage ? (
                          <img src={profileImage} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm" />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xl font-bold border-2 border-white dark:border-gray-700 shadow-sm">
                            {userInitials}
                          </div>
                        )}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition"
                          title="Change Photo"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Profile Photo</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">JPG, GIF or PNG. Max size 2MB.</p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Upload new photo
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                        <input type="text" defaultValue={user?.username || "User"} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                        <input type="email" defaultValue="user@knp.ac.ke" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> Phone Number
                        </label>
                        <input type="tel" defaultValue="+254 700 000 000" placeholder="+254 7XX XXX XXX" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department / Role</label>
                        <input type="text" defaultValue={user?.role?.replace('_', ' ').toUpperCase()} disabled className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                      </div>
                    </div>
                  </div>
                )}

                {/* SECURITY TAB */}
                {activeTab === "security" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" /> Security & Access
                    </h2>

                    {/* Change Password Form */}
                    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 space-y-4">
                      <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Lock className="w-4 h-4 text-blue-600" /> Change Password
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                          <input type="password" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                          <input type="password" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                          <input type="password" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
                          Update Password
                        </button>
                      </div>
                    </div>

                    {/* Active Sessions */}
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Active Sessions</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage devices where you are currently logged in.</p>
                      </div>
                      <button className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition">
                        Sign Out All
                      </button>
                    </div>
                  </div>
                )}

                {/* NOTIFICATIONS TAB */}
                {activeTab === "notifications" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Bell className="w-5 h-5 text-blue-600" /> Notification Preferences
                    </h2>
                    <div className="space-y-4">
                      {[
                        { title: "Email Notifications", desc: "Receive email alerts for task assignments and approvals.", icon: Mail },
                        { title: "In-App Notifications", desc: "Show pop-up notifications within the dashboard.", icon: Bell },
                        { title: "System Updates", desc: "Get notified about maintenance and new feature releases.", icon: Monitor },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                              <item.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* INSTITUTION TAB (Granular: Admin Only) */}
                {activeTab === "institution" && isAdmin() && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-600" /> Institution Settings
                    </h2>
                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-4">
                      <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        These settings affect the entire institution. Proceed with caution.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Institution Name</label>
                        <input type="text" defaultValue="Kabete National Polytechnic" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Academic Year</label>
                        <input type="text" defaultValue="2025/2026" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">System Theme (Global)</label>
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => setTheme("light")} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition ${theme === 'light' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
                            <Sun className="w-4 h-4" /> Light
                          </button>
                          <button onClick={() => setTheme("dark")} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition ${theme === 'dark' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
                            <Moon className="w-4 h-4" /> Dark
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {saving ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
