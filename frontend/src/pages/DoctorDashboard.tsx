import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Calendar, Clock, FileText, MessageSquare, LogOut, Activity, ArrowRight, Star, Shield } from 'lucide-react';
import axios from 'axios';
import { XRayAnalysisView } from '../components/XRayAnalysisView';
import { DoctorAppointmentsView } from '../components/DoctorAppointmentsView';
import { ChatView } from '../components/ChatView';
import { DashboardNavbar } from '../components/DashboardNavbar';
import { DoctorProfileView } from '../components/DoctorProfileView';
import { DoctorPatientsView } from '../components/DoctorPatientsView';
import { PrescriptionGenerator } from '../components/PrescriptionGenerator';
import { PageTransition } from '../components/PageTransition';
import { PrivacyMask } from '../components/PrivacyMask';

import { getValidImageUrl } from '../utils/imageUrl';

import { Skeleton } from '../components/ui/Skeleton';

interface SharedReport {
  id: number;
  title: string;
  summary: string;
  uploadedAt: string;
  filePath: string;
  patient: {
    name: string;
    email: string;
  };
}

import { useLocation } from 'react-router-dom';

export const DoctorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'xray' | 'chat' | 'appointments' | 'reports' | 'profile'>(
    (location.state as any)?.tab || 'overview'
  );

  // Update tab if location state changes
  useEffect(() => {
    if ((location.state as any)?.tab) {
      setActiveTab((location.state as any).tab);
      // Clear state to prevent persistence on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [sharedReports, setSharedReports] = useState<SharedReport[]>([]);
  const [sharedXRays, setSharedXRays] = useState<any[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    rating: 0,
    reviews: 0,
    patients: 0,
    todayAppointments: 0
  });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await axios.get('/api/messages/unread-count');
        setUnreadCount(res.data.count);
      } catch (e: any) {
        console.error("Failed to fetch unread count", e);
      }
    };
    
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch real stats
        const resStats = await axios.get('/api/doctors/stats');
        setStats(resStats.data);

        
        // Fetch shared reports
        const resReports = await axios.get('/api/doctors/shared-reports');
        setSharedReports(resReports.data);

        // Fetch shared xrays
        const resXRays = await axios.get('/api/doctors/shared-xrays');
        setSharedXRays(resXRays.data);

        // Fetch appointments
        const resAppts = await axios.get('/api/appointments/my');
        const today = new Date().toISOString().split('T')[0];
        const todaysAppts = resAppts.data.filter((appt: any) => 
          appt.date.startsWith(today) && appt.status !== 'cancelled'
        );
        setTodayAppointments(todaysAppts);
      } catch (e) {
        console.error("Failed to fetch dashboard data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  const [selectedItem, setSelectedItem] = useState<{ type: 'report' | 'xray', data: any } | null>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  const handleRemoveReport = async (reportId: number) => {
    if (!confirm("Remove this report from your list?")) return;
    try {
      await axios.delete(`/api/doctors/shared-reports/${reportId}`);
      setSharedReports(prev => prev.filter(r => r.id !== reportId));
      if (selectedItem?.data.id === reportId) setSelectedItem(null);
    } catch (e) {
      console.error("Failed to remove report", e);
    }
  };

  const handleRemoveXRay = async (xrayId: number) => {
    if (!confirm("Remove this X-Ray from your list?")) return;
    try {
      await axios.delete(`/api/doctors/shared-xrays/${xrayId}`);
      setSharedXRays(prev => prev.filter(x => x.id !== xrayId));
      if (selectedItem?.data.id === xrayId) setSelectedItem(null);
    } catch (e) {
      console.error("Failed to remove xray", e);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'xray':
        return <PageTransition key="xray"><XRayAnalysisView /></PageTransition>;
      case 'appointments':
        return <PageTransition key="appointments"><DoctorAppointmentsView /></PageTransition>;
      case 'chat':
        return <PageTransition key="chat"><ChatView currentUser={user} /></PageTransition>;
      case 'patients':
        return <PageTransition key="patients"><DoctorPatientsView /></PageTransition>;
      case 'profile':
        return <PageTransition key="profile"><DoctorProfileView doctor={user} isModal={false} isEditable={true} /></PageTransition>;
      case 'reports':
        return (
          <PageTransition>
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-main flex items-center gap-2">
              <FileText className="text-blue-500" />
              Patient Records
            </h2>
            
            <div className="grid gap-6">
              {/* Reports Section */}
              <div>
                <h3 className="text-lg font-bold text-muted mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Shared Reports
                </h3>
                <div className="grid gap-4">
                  {sharedReports.map((report) => (
                    <div 
                      key={report.id} 
                      onClick={() => setSelectedItem({ type: 'report', data: report })}
                      className="card-premium p-6 cursor-pointer group"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-xs rounded-full font-medium">
                              <PrivacyMask>{report.patient.name}</PrivacyMask>
                            </span>
                            <span className="text-muted text-xs">{report.patient.email}</span>
                          </div>
                          <h3 className="text-lg font-bold text-main mb-1 group-hover:text-emerald-500 transition-colors">{report.title}</h3>
                          <p className="text-xs text-muted mb-4">Uploaded on {new Date(report.uploadedAt).toLocaleDateString()}</p>
                          {report.summary && (
                            <div className="bg-secondary/50 rounded-lg p-4 mb-4 max-w-2xl border border-card-border">
                              <p className="text-sm text-muted leading-relaxed line-clamp-2">
                                {report.summary}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRemoveReport(report.id); }}
                            className="p-2 bg-secondary hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                            title="Remove from list"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {sharedReports.length === 0 && (
                    <p className="text-muted text-sm italic">No reports shared.</p>
                  )}
                </div>
              </div>

              {/* X-Rays Section */}
              <div>
                <h3 className="text-lg font-bold text-muted mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Shared X-Rays
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {sharedXRays.map((xray) => (
                    <div 
                      key={xray.id} 
                      onClick={() => setSelectedItem({ type: 'xray', data: xray })}
                      className="bg-secondary border border-card-border rounded-xl p-4 hover:border-emerald-500/30 transition-colors flex gap-4 relative group cursor-pointer"
                    >
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRemoveXRay(xray.id); }}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                        title="Remove"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                      <div className="w-24 h-24 bg-slate-800 rounded-lg flex-shrink-0 overflow-hidden">
                        {xray.heatmapPath ? (
                          <img 
                            src={getValidImageUrl(xray.heatmapPath)} 
                            alt="X-Ray" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Activity className="text-slate-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-full font-medium">
                            <PrivacyMask>{xray.patient.name}</PrivacyMask>
                          </span>
                        </div>
                        <h4 className="font-bold text-main text-sm mb-1 group-hover:text-emerald-400 transition-colors">
                          {xray.type} Analysis
                        </h4>
                        <div className={`text-xs font-bold mb-2 ${
                          xray.prediction === 'Positive' ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {xray.prediction} ({xray.confidence})
                        </div>
                        <p className="text-xs text-muted">
                          {new Date(xray.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {sharedXRays.length === 0 && (
                    <p className="text-muted text-sm italic col-span-2">No X-Rays shared.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          </PageTransition>
        );
      default:
        if (loading) {
          return (
            <div className="space-y-8 animate-fade-in">
              {/* Skeleton Hero */}
              <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 border border-white/10 shadow-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                 <div className="max-w-2xl w-full">
                    <Skeleton className="h-8 w-48 mb-6 rounded-full" />
                    <Skeleton className="h-16 w-3/4 mb-4 rounded-xl" />
                    <Skeleton className="h-6 w-1/2 mb-8 rounded-lg" />
                    <div className="flex gap-4">
                      <Skeleton className="h-14 w-40 rounded-2xl" />
                      <Skeleton className="h-14 w-40 rounded-2xl" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                    <Skeleton className="h-40 rounded-3xl" />
                    <Skeleton className="h-40 rounded-3xl" />
                 </div>
              </div>

              {/* Skeleton Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Skeleton className="h-32 rounded-3xl" />
                 <Skeleton className="h-32 rounded-3xl" />
                 <Skeleton className="h-32 rounded-3xl" />
              </div>

              {/* Skeleton Schedule */}
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                   <div className="flex items-center justify-between">
                     <Skeleton className="h-8 w-48" />
                     <Skeleton className="h-6 w-32" />
                   </div>
                   <div className="space-y-4">
                     <Skeleton className="h-24 w-full rounded-2xl" />
                     <Skeleton className="h-24 w-full rounded-2xl" />
                     <Skeleton className="h-24 w-full rounded-2xl" />
                   </div>
                </div>
                 <div className="space-y-6">
                     <Skeleton className="h-8 w-40 mb-4" />
                     <div className="grid gap-4">
                        <Skeleton className="h-20 w-full rounded-2xl" />
                        <Skeleton className="h-20 w-full rounded-2xl" />
                        <Skeleton className="h-20 w-full rounded-2xl" />
                     </div>
                 </div>
              </div>
            </div>
          );
        }

        return (
          <PageTransition>
          <div className="space-y-8 animate-fade-in">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 shadow-2xl animate-fade-in">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 animate-pulse-glow"></div>
              
              <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6 backdrop-blur-sm">
                    <Shield className="w-4 h-4" />
                    Verified Specialist
                  </div>
                  
                  <div className="flex items-center gap-6 mb-6">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg flex-shrink-0 hidden sm:block bg-slate-800">
                      {user?.profilePicture ? (
                        <img 
                          src={user.profilePicture.startsWith('/') ? `http://localhost:8000${user.profilePicture}` : user.profilePicture} 
                          alt={user.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-500/10 text-blue-500 text-2xl font-bold">
                          {user?.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                      Welcome Dr. <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"><PrivacyMask>{user?.name}</PrivacyMask></span>
                    </h1>
                  </div>
                  <p className="text-lg text-slate-400 mb-8 leading-relaxed max-w-lg">
                    You have <span className="text-white font-semibold">{stats.todayAppointments} appointments</span> today and <span className="text-white font-semibold">{sharedReports.length} shared reports</span> to review.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => setActiveTab('appointments')}
                      className="px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-2xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
                    >
                      <Calendar className="w-5 h-5" />
                      View Schedule
                    </button>
                    <button 
                      onClick={() => setActiveTab('patients')}
                      className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all hover:scale-105 backdrop-blur-sm flex items-center gap-2"
                    >
                      <Users className="w-5 h-5" />
                      Patient List
                    </button>
                  </div>
                </div>

                {/* Stats Visual */}
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                  <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center group hover:bg-slate-800/80 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Star className="w-6 h-6 text-emerald-500 fill-emerald-500" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats.rating?.toFixed(1) || 0}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">Rating</div>
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center group hover:bg-slate-800/80 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats.patients}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">Patients</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Today's Appointments", value: stats.todayAppointments, icon: Calendar, color: "blue", sub: "Scheduled" },
                { label: "Shared Reports", value: sharedReports.length, icon: FileText, color: "purple", sub: "Total Access" },
                { label: "Total Patients", value: stats.patients, icon: Users, color: "emerald", sub: "Active" },
              ].map((stat, i) => (
                <div key={i} className="card-premium p-6 group hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full bg-${stat.color}-500/10 text-${stat.color}-500`}>
                      {stat.sub}
                    </span>
                  </div>
                  <div className="text-4xl font-bold text-main mb-1">{stat.value}</div>
                  <div className="text-muted font-medium">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Schedule & Activity */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Today's Schedule */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-main">Today's Schedule</h2>
                  <button onClick={() => setActiveTab('appointments')} className="text-sm text-blue-500 hover:text-blue-400 font-medium flex items-center gap-1">
                    View Calendar <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-secondary rounded-3xl border border-card-border p-2 space-y-2">
                  {todayAppointments.length > 0 ? todayAppointments.map((apt, i) => (
                    <div key={i} className="group flex items-center gap-6 p-4 rounded-2xl hover:bg-white/5 transition-colors">
                      <div className="w-20 text-center">
                        <div className="text-sm font-bold text-main">
                          {new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className={`text-xs font-medium ${
                          apt.status === 'completed' ? 'text-emerald-500' :
                          apt.status === 'pending' ? 'text-blue-500' : 'text-slate-500'
                        }`}>
                          {apt.status}
                        </div>
                      </div>
                      <div className="w-px h-10 bg-card-border"></div>
                      <div className="flex-1 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex-shrink-0">
                        {apt.patient?.profilePicture ? (
                            <img 
                              src={getValidImageUrl(apt.patient.profilePicture)} 
                              alt={apt.patient.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-emerald-500/10 text-emerald-500 font-bold">
                              {apt.patient?.name?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-main text-lg"><PrivacyMask>{apt.patient?.name || 'Unknown Patient'}</PrivacyMask></h4>
                          <p className="text-sm text-muted">{apt.reason || 'No reason provided'}</p>
                        </div>
                      </div>
                      <button className="p-2 rounded-xl hover:bg-white/10 text-muted hover:text-main transition-colors">
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-muted italic">
                      No appointments scheduled for today.
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-main">Quick Actions</h2>
                <div className="grid gap-4">
                  {[
                    // { label: "Rate Patient", icon: Star, color: "yellow", action: () => alert("Rating feature coming soon!") }, // Removed per user request
                    { label: "Write Prescription", icon: FileText, color: "emerald", action: () => setShowPrescriptionModal(true) },
                    { label: "Review Reports", icon: FileText, color: "purple", action: () => setActiveTab('reports') },
                    { label: "Patient Messages", icon: MessageSquare, color: "blue", action: () => setActiveTab('chat') },
                    { label: "Update Availability", icon: Clock, color: "teal", action: () => setActiveTab('profile') },
                  ].map((action, i) => (
                    <button 
                      key={i}
                      onClick={action.action}
                      className="group w-full p-4 rounded-2xl bg-secondary border border-card-border hover:border-blue-500/30 transition-all flex items-center gap-4 text-left hover:-translate-y-1"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-${action.color}-500/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <action.icon className={`w-6 h-6 text-${action.color}-500`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-main">{action.label}</div>
                        <div className="text-xs text-muted">Click to open</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted group-hover:text-main group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </PageTransition>
        );
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'appointments', label: 'Schedule', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'chat', label: 'Messages', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-primary text-main transition-colors duration-300">
      <DashboardNavbar 
        user={user}
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        logout={logout}
        unreadCount={unreadCount}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {renderContent()}
      </main>

      {showPrescriptionModal && (
        <PrescriptionGenerator 
          onClose={() => setShowPrescriptionModal(false)}
          doctorName={user?.name}
          doctorSpec={user?.specialization || "General Physician"}
        />
      )}
    </div>
  );
};
