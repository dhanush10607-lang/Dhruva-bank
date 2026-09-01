import { getUserProfile, getUserAccount } from "@/app/actions/user";
import { User, MapPin, Mail, Phone, Calendar, Briefcase, Hash } from "lucide-react";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getUserProfile();
  const account = await getUserAccount();

  if (!profile || !account) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">My Profile</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your personal information and banking details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Details Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-3xl font-bold mx-auto mb-4">
                {profile.full_name.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{profile.full_name}</h2>
              <p className="text-sm text-zinc-500">Dhruva Bank Customer</p>
              
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                KYC Verified
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-start gap-3">
                <Hash className="text-zinc-400 mt-0.5 shrink-0" size={16} />
                <div>
                  <p className="text-xs text-zinc-500 font-medium">Customer ID</p>
                  <p className="text-sm text-zinc-900 dark:text-white font-mono">{profile.customer_id}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Mail className="text-zinc-400 mt-0.5 shrink-0" size={16} />
                <div>
                  <p className="text-xs text-zinc-500 font-medium">Email Address</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="text-zinc-400 mt-0.5 shrink-0" size={16} />
                <div>
                  <p className="text-xs text-zinc-500 font-medium">Mobile Number</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{profile.mobile}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="text-zinc-400 mt-0.5 shrink-0" size={16} />
                <div>
                  <p className="text-xs text-zinc-500 font-medium">Date of Birth</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{new Date(profile.dob).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-900/50 p-6">
            <h3 className="font-bold text-blue-900 dark:text-blue-400 mb-2 flex items-center gap-2">
              <User size={18} />
              Identity Details
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-300/80 mb-4">
              Your PAN and Aadhaar details are securely stored. To update these, you must visit a home branch.
            </p>
            <div className="space-y-2">
              <div className="bg-white/50 dark:bg-black/20 p-2 rounded-lg text-sm border border-blue-100/50 dark:border-blue-800/30">
                <span className="text-blue-700/70 dark:text-blue-400/70">PAN: </span>
                <span className="font-mono text-blue-900 dark:text-blue-300">{profile.pan_demo || 'Not Provided'}</span>
              </div>
              <div className="bg-white/50 dark:bg-black/20 p-2 rounded-lg text-sm border border-blue-100/50 dark:border-blue-800/30">
                <span className="text-blue-700/70 dark:text-blue-400/70">Aadhaar: </span>
                <span className="font-mono text-blue-900 dark:text-blue-300">•••• •••• {profile.aadhaar_demo?.slice(-4) || 'XXXX'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Update Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Update Profile</h2>
            
            <ProfileForm profile={profile} />
            
          </div>
        </div>

      </div>
    </div>
  );
}
