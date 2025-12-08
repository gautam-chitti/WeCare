import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Users, AlertTriangle, Check, X, Trash2, Search, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Doctor {
  id: number;
  name: string;
  email: string;
  doctorProfile: {
    licenseNumber: string;
    specialization: string;
    location: string;
    verificationStatus: 'pending' | 'verified' | 'banned';
    rating: number;
  };
}

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'banned'>('all');
  const [search, setSearch] = useState('');

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/admin/doctors');
      setDoctors(res.data);
    } catch (error) {
      console.error("Failed to fetch doctors", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await axios.patch(`/admin/doctors/${id}/status`, { status });
      // Optimistic update
      setDoctors(doctors.map(doc => 
        doc.id === id ? { ...doc, doctorProfile: { ...doc.doctorProfile, verificationStatus: status as any } } : doc
      ));
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this doctor? This action cannot be undone.")) return;
    try {
      await axios.delete(`/admin/doctors/${id}`);
      setDoctors(doctors.filter(doc => doc.id !== id));
    } catch (error) {
      console.error("Failed to delete doctor", error);
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const matchesFilter = filter === 'all' || doc.doctorProfile.verificationStatus === filter;
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase()) || 
                          doc.email.toLowerCase().includes(search.toLowerCase()) ||
                          doc.doctorProfile.licenseNumber.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: doctors.length,
    verified: doctors.filter(d => d.doctorProfile.verificationStatus === 'verified').length,
    pending: doctors.filter(d => d.doctorProfile.verificationStatus === 'pending').length,
    banned: doctors.filter(d => d.doctorProfile.verificationStatus === 'banned').length,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="WeCare Logo" className="w-8 h-8 object-contain" />
            <h1 className="text-xl font-bold text-white tracking-tight">WeCare <span className="text-slate-500 font-normal">Admin</span></h1>
          </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-slate-500">Super Admin</p>
            </div>
            <button 
              onClick={logout}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-white/5"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 border border-white/10 p-5 rounded-xl backdrop-blur-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-slate-400 text-sm font-medium">Total Doctors</p>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-3xl font-bold text-white">{stats.total}</h3>
          </div>
          <div className="bg-slate-900/50 border border-white/10 p-5 rounded-xl backdrop-blur-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-slate-400 text-sm font-medium">Verified</p>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-3xl font-bold text-white">{stats.verified}</h3>
          </div>
          <div className="bg-slate-900/50 border border-white/10 p-5 rounded-xl backdrop-blur-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-slate-400 text-sm font-medium">Pending Review</p>
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-3xl font-bold text-white">{stats.pending}</h3>
          </div>
          <div className="bg-slate-900/50 border border-white/10 p-5 rounded-xl backdrop-blur-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-slate-400 text-sm font-medium">Banned</p>
              <X className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-3xl font-bold text-white">{stats.banned}</h3>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by name, email, or license..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {(['all', 'pending', 'verified', 'banned'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-all ${
                  filter === status 
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' 
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Doctors List */}
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No doctors found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Doctor</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Specialization</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">License</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredDoctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white">{doc.name}</p>
                          <p className="text-xs text-slate-500">{doc.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{doc.doctorProfile.specialization}</td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">{doc.doctorProfile.licenseNumber}</td>
                      <td className="px-6 py-4 text-slate-300">{doc.doctorProfile.location || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          doc.doctorProfile.verificationStatus === 'verified' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : doc.doctorProfile.verificationStatus === 'banned'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {doc.doctorProfile.verificationStatus === 'verified' && <Check className="w-3 h-3" />}
                          {doc.doctorProfile.verificationStatus === 'banned' && <X className="w-3 h-3" />}
                          {doc.doctorProfile.verificationStatus === 'pending' && <AlertTriangle className="w-3 h-3" />}
                          <span className="capitalize">{doc.doctorProfile.verificationStatus}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {doc.doctorProfile.verificationStatus !== 'verified' && (
                            <button 
                              onClick={() => handleStatusUpdate(doc.id, 'verified')}
                              className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                              title="Verify Doctor"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {doc.doctorProfile.verificationStatus !== 'banned' && (
                            <button 
                              onClick={() => handleStatusUpdate(doc.id, 'banned')}
                              className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors"
                              title="Ban Doctor"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(doc.id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                            title="Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
