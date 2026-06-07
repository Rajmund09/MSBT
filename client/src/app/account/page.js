"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/Toast";
import { Camera } from "lucide-react";

export default function AccountSettings() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    password: "",
  });
  const [photoData, setPhotoData] = useState(null);

  useEffect(() => {
    if (user) {
      setForm(f => ({ ...f, fullName: user.full_name || "", phone: user.phone || "" }));
      setPhotoData(user.profile_photo || null);
    }
  }, [user]);

  if (!user) return null;

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast("Image must be smaller than 2MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoData(event.target.result);
      
      // Auto-save photo instantly
      api.updateProfile({ profile_photo: event.target.result })
        .then(() => {
          toast("Profile photo updated", "success");
          refreshUser();
        })
        .catch(err => toast(err.message, "error"));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateProfile({
        fullName: form.fullName,
        phone: form.phone,
      });
      toast("Profile updated successfully", "success");
      refreshUser();
    } catch (err) {
      toast(err.message || "Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!form.password || form.password.length < 6) {
      toast("Password must be at least 6 characters", "error");
      return;
    }
    setLoading(true);
    try {
      await api.updateProfile({
        password: form.password,
      });
      toast("Password updated successfully", "success");
      setForm(prev => ({ ...prev, password: "" }));
      refreshUser();
    } catch (err) {
      toast(err.message || "Failed to update password", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 sm:px-6 md:px-12 py-8 sm:py-12 max-w-4xl"
    >
      <div className="mb-10">
        <h1 className="font-display text-4xl text-[#1a2b4b] dark:text-[var(--fg)] tracking-tight mb-2">Account</h1>
        <p className="text-[#4a5568] dark:text-[var(--fg-muted)] font-medium text-lg">Your profile and security settings.</p>
      </div>

      <div className="flex flex-col gap-8">
        {/* Profile Card */}
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-gray-100 dark:border-[var(--border)] gap-6">
            <div>
              <h2 className="font-display text-2xl text-[#1a2b4b] dark:text-[var(--fg)]">Profile</h2>
            </div>
            
            {/* Photo Avatar */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-full border border-gray-200 dark:border-[var(--border)] overflow-hidden bg-gray-50 dark:bg-[var(--bg)] flex items-center justify-center">
                {photoData ? (
                  <img src={photoData} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display text-2xl text-[#1a2b4b] dark:text-[var(--fg)]">
                    {user?.full_name?.[0] || user?.username?.[0]}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#0e1629] dark:bg-[var(--fg)] text-white dark:text-[var(--bg)] flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                title="Update Photo"
              >
                <Camera size={14} />
              </button>
              <input 
                type="file" 
                ref={fileRef} 
                onChange={handlePhotoUpload} 
                accept="image/jpeg, image/png, image/webp" 
                className="hidden" 
              />
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-[var(--fg-muted)] uppercase tracking-wider mb-2">Full Name</label>
              <input 
                value={form.fullName}
                onChange={e => setForm({...form, fullName: e.target.value})}
                className="w-full px-4 h-11 rounded-lg border border-gray-200 dark:border-[var(--border)] bg-transparent text-gray-900 dark:text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[#1a2b4b]/20 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-[var(--fg-muted)] uppercase tracking-wider mb-2">Username</label>
              <input 
                value={user.username}
                disabled
                className="w-full px-4 h-11 rounded-lg border-none bg-transparent text-gray-900 dark:text-[var(--fg)] font-medium p-0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-[var(--fg-muted)] uppercase tracking-wider mb-2">User ID</label>
              <p className="text-gray-900 dark:text-[var(--fg)] font-medium h-11 flex items-center font-mono text-sm">{user.id}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-[var(--fg-muted)] uppercase tracking-wider mb-2">Roles</label>
              <p className="text-gray-900 dark:text-[var(--fg)] font-medium h-11 flex items-center">{user.role || "No roles assigned"}</p>
            </div>
            
            <div className="sm:col-span-2 pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 h-11 rounded-lg bg-[#0e1629] dark:bg-[var(--fg)] text-white dark:text-[var(--bg)] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Update Profile
              </button>
            </div>
          </form>
        </div>

        {/* Security Card */}
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="mb-8">
            <h2 className="font-display text-2xl text-[#1a2b4b] dark:text-[var(--fg)] mb-1">Change password</h2>
            <p className="text-sm text-gray-500 dark:text-[var(--fg-muted)]">At least 6 characters.</p>
          </div>

          <form onSubmit={handleUpdatePassword} className="flex flex-col sm:flex-row items-end gap-4 max-w-lg">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-gray-500 dark:text-[var(--fg-muted)] uppercase tracking-wider mb-2">New Password</label>
              <input 
                type="password"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                placeholder="••••••"
                className="w-full px-4 h-11 rounded-lg border border-gray-200 dark:border-[var(--border)] bg-gray-50 dark:bg-[#0f0f0f] text-gray-900 dark:text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[#1a2b4b]/20"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || !form.password}
              className="w-full sm:w-auto px-8 h-11 rounded-lg bg-[#0e1629] dark:bg-[var(--fg)] text-white dark:text-[var(--bg)] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Update
            </button>
          </form>
        </div>
      </div>
    </motion.main>
  );
}
