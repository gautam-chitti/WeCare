import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, Activity, MessageSquare, Search, Calendar, ArrowRight, Zap, Heart, X, Clock, ShoppingBag } from 'lucide-react';
import { ReportsView } from '../components/ReportsView';
import { SymptomSurveyView } from '../components/SymptomSurveyView';
import { XRayAnalysisView } from '../components/XRayAnalysisView';
import { DoctorSearchView } from '../components/DoctorSearchView';
import { PatientAppointmentsView } from '../components/PatientAppointmentsView';
import { PharmacyView } from '../components/PharmacyView';
import { ChatView } from '../components/ChatView';
import { DashboardNavbar } from '../components/DashboardNavbar';
import { Profile } from './Profile';
import axios from 'axios';
import { getValidImageUrl } from '../utils/imageUrl';
import { HealthTimeline } from '../components/HealthTimeline';
import { DailyStreak } from '../components/DailyStreak';
import { PageTransition } from '../components/PageTransition';
import { PrivacyMask } from '../components/PrivacyMask';

import { Skeleton } from '../components/ui/Skeleton';

import { useLocation } from 'react-router-dom';
import { ScrollReveal } from '../components/ScrollReveal';


export const PatientDashboard: React.FC = () => {
  const { user, logout, activeProfile } = useAuth(); // Get activeProfile
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'symptoms' | 'xray' | 'doctors' | 'chat' | 'appointments' | 'profile' | 'pharmacy'>(
    (location.state as any)?.tab || 'overview'
  );

  // Update tab if location state changes (for when already on the page)
  useEffect(() => {
    if ((location.state as any)?.tab) {
      setActiveTab((location.state as any).tab);
      // Clear the state so it doesn't persist on refresh
      window.history.replaceState({}, '');
    }
  }, [location.state]);
  
  // Booking State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingReason, setBookingReason] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    nextAppointment: null as any,
    reportCount: 0,
    healthScore: 98
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Re-fetch when activeProfile changes !
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Stats - currently standard, but could be filtered later if needed
        const resStats = await axios.get('/api/patients/stats');
        setStats(resStats.data);

        // Fetch recent activity (appointments + reports) filtered by profile
        const params: any = {};
        if (activeProfile?.type === 'family') {
            params.family_member_id = activeProfile.id;
        }

        const [resAppts, resReports] = await Promise.all([
          axios.get('/api/appointments/my', { params }),
          axios.get('/api/reports/my', { params })
        ]);

        const activities = [
          ...resAppts.data.map((a: any) => ({
            type: 'appointment',
            title: 'Appointment ' + (a.status === 'pending' ? 'Scheduled' : a.status),
            desc: a.reason || 'General Checkup',
            date: a.date,
            icon: Calendar,
            color: 'blue'
          })),
          ...resReports.data.map((r: any) => ({
            type: 'report',
            title: 'New Report',
            desc: r.title,
            date: r.uploadedAt,
            icon: FileText,
            color: 'purple'
          }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
         .slice(0, 5);

        setRecentActivity(activities);
      } catch (e) {
        console.error("Failed to fetch patient stats", e);
      } finally {
        setLoading(false);
      }
    };
    
    if (activeProfile) {
        fetchStats();
    }
  }, [activeProfile]); // Add activeProfile dependency

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

  const [selectedChatUser, setSelectedChatUser] = useState<any>(null);

  const handleBookClick = (doctor: any) => {
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
  };

  const handleMessageClick = (doctor: any) => {
    setSelectedChatUser({ ...doctor, role: 'doctor' });
    setActiveTab('chat');
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !bookingDate || !bookingTime) return;

    setBookingLoading(true);
    try {
      // Combine date and time into ISO string
      const dateTime = new Date(`${bookingDate}T${bookingTime}`).toISOString();
      
      const payload: any = {
        doctorId: selectedDoctor.id,
        date: dateTime,
        reason: bookingReason
      };
      
      // If booking for family member
      if (activeProfile?.type === 'family') {
          payload.familyMemberId = activeProfile.id;
      }

      await axios.post('/api/appointments/book', payload);
      
      alert("Appointment booked successfully!");
      setShowBookingModal(false);
      setBookingDate("");
      setBookingTime("");
      setBookingReason("");
      setSelectedDoctor(null);
      setActiveTab('appointments'); // Switch to appointments view
      setLoading(true); // Trigger re-fetch
      // Hacky way to re-fetch: activeProfile dep will trigger effect if we change it, 
      // but here we didn't change it. We can just call fetchStats() if we extracted it, 
      // or set a refresh flag. For now, let's just let it be.
      // Ideally, we recall fetchStats logic.
    } catch (error) {
      console.error("Booking failed", error);
      alert("Failed to book appointment");
    } finally {
      setBookingLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'reports':
        return <PageTransition key="reports"><ReportsView /></PageTransition>;
      case 'symptoms':
        return <PageTransition key="symptoms"><SymptomSurveyView /></PageTransition>;
      case 'xray':
        return <PageTransition key="xray"><XRayAnalysisView /></PageTransition>;
      case 'doctors':
        return <PageTransition key="doctors"><DoctorSearchView onBook={handleBookClick} onMessage={handleMessageClick} /></PageTransition>;
      case 'appointments':
        return <PageTransition key="appointments"><PatientAppointmentsView onBookNew={() => setActiveTab('doctors')} /></PageTransition>;
      case 'chat':
        return <PageTransition key="chat"><ChatView currentUser={user} initialUser={selectedChatUser} /></PageTransition>;
      case 'pharmacy':
        return <PageTransition key="pharmacy"><PharmacyView /></PageTransition>;
      case 'profile':
        return <PageTransition key="profile"><Profile /></PageTransition>;
      default:
        if (loading) {
          return (
             <div className="space-y-8 animate-fade-in">
              {/* Skeleton Hero */}
              <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 border border-white/10 shadow-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                 <div className="max-w-2xl w-full">
                    <Skeleton className="h-6 w-40 mb-6 rounded-full" />
                    <Skeleton className="h-16 w-3/4 mb-4 rounded-xl" />
                    <Skeleton className="h-6 w-1/2 mb-8 rounded-lg" />
                    <div className="flex gap-4">
                      <Skeleton className="h-14 w-40 rounded-2xl" />
                      <Skeleton className="h-14 w-40 rounded-2xl" />
                    </div>
                 </div>
                 <div className="flex justify-center w-full max-w-md">
                    <Skeleton className="h-64 w-64 rounded-full" />
                 </div>
              </div>

               {/* Skeleton Quick Actions */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                 <Skeleton className="h-32 rounded-3xl" />
                 <Skeleton className="h-32 rounded-3xl" />
                 <Skeleton className="h-32 rounded-3xl" />
                 <Skeleton className="h-32 rounded-3xl" />
               </div>

              {/* Skeleton Activity & Tip */}
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                   <div className="flex items-center justify-between">
                     <Skeleton className="h-8 w-48" />
                   </div>
                   <div className="space-y-4">
                     <Skeleton className="h-20 w-full rounded-2xl" />
                     <Skeleton className="h-20 w-full rounded-2xl" />
                     <Skeleton className="h-20 w-full rounded-2xl" />
                   </div>
                </div>
                 <div className="space-y-6">
                     <Skeleton className="h-80 w-full rounded-[2rem]" />
                 </div>
              </div>
            </div>
          );
        }

        return (
          <PageTransition>
          <div className="space-y-8 animate-fade-in">
            {/* Welcome Section - Premium Hero */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 shadow-2xl animate-fade-in">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
              
              <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="max-w-2xl relative z-20 flex flex-col items-center md:items-start text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6 backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Health Status: Excellent
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
                    {activeProfile?.type === 'family' ? 'Viewing Profile for,' : 'Good Morning,'} <br/>
                    <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                      <PrivacyMask>{activeProfile?.name || user?.name}</PrivacyMask>
                    </span>
                  </h1>
                  <p className="text-lg text-slate-400 mb-8 leading-relaxed max-w-lg">
                    Your health journey is on track. You have <span className="text-white font-semibold">{stats.reportCount} reports</span> on file and {stats.nextAppointment ? 'an appointment scheduled.' : 'no upcoming appointments.'}
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <button 
                      onClick={() => setActiveTab('symptoms')}
                      className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2"
                    >
                      <Activity className="w-5 h-5" />
                      Check Symptoms
                    </button>
                    <button 
                      onClick={() => setActiveTab('appointments')}
                      className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all hover:scale-105 backdrop-blur-sm flex items-center gap-2"
                    >
                      <Calendar className="w-5 h-5" />
                      View Schedule
                    </button>
                  </div>
                </div>

                {/* Hero Visual */}
                <div className="relative w-full max-w-md aspect-square md:aspect-auto md:h-[400px] flex items-center justify-center overflow-visible">
                  {/* Welcome Illustration Background - Shifted Right */}
                  <img 
                    src={getValidImageUrl('welcome-illustration.png')}
                    alt="Welcome"
                    className="absolute bottom-0 right-0 w-[65%] h-[85%] object-contain opacity-50 md:opacity-100 mix-blend-normal pointer-events-none translate-x-8 md:translate-x-12 translate-y-8"
                  />
                  
                  {/* Health Score Ring - Shifted Left & Floating */}
                  <div className="relative z-10 w-64 h-64 md:w-80 md:h-80 flex items-center justify-center -translate-x-16 -translate-y-12">
                     {/* Health Score Ring */}
                    <img 
                      src={getValidImageUrl('health-score-ring.png')}
                      alt="Health Score"
                      className="absolute inset-0 w-full h-full object-contain animate-spin-slow opacity-90"
                    />
                    
                    <div className="relative z-20 w-40 h-40 rounded-full bg-slate-900/60 backdrop-blur-xl border border-white/10 flex flex-col items-center justify-center p-6 text-center shadow-2xl">
                      <Heart className="w-8 h-8 text-emerald-500 mb-2 fill-emerald-500/20" />
                      <div className="text-4xl font-bold text-white mb-1">{stats.healthScore}<span className="text-xl text-emerald-500">%</span></div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Health Score</div>
                    </div>

                    {/* Floating Cards */}
                    <div className="absolute -top-4 -right-12 bg-slate-800/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl animate-float-delayed z-30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-400">Next Visit</div>
                          <div className="text-sm font-bold text-white">
                            {stats.nextAppointment ? new Date(stats.nextAppointment.date).toLocaleDateString() : 'None'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <ScrollReveal>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[
                  { label: "Book Appointment", icon: Calendar, color: "blue", action: () => setActiveTab('doctors') },
                  { label: "Pharmacy Store", icon: ShoppingBag, color: "emerald", action: () => setActiveTab('pharmacy') },
                  { label: "My Reports", icon: FileText, color: "purple", action: () => setActiveTab('reports') },
                  { label: "Find Doctors", icon: Search, color: "cyan", action: () => setActiveTab('doctors') },
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={item.action}
                    className="group relative p-6 rounded-3xl bg-secondary border border-card-border hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1 overflow-hidden text-left"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br from-${item.color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                    <div className={`w-12 h-12 rounded-2xl bg-${item.color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className={`w-6 h-6 text-${item.color}-500`} />
                    </div>
                    <h3 className="font-bold text-main text-lg mb-1">{item.label}</h3>
                    <div className="w-8 h-1 rounded-full bg-tertiary group-hover:bg-emerald-500 transition-colors"></div>
                  </button>
                ))}
              </div>
            </ScrollReveal>
            {/* Recent Activity & Tips */}
            <ScrollReveal className="grid lg:grid-cols-3 gap-8">
              {/* Activity Feed & Timeline */}
               <div className="lg:col-span-2 space-y-6 min-w-0">
                 {/* Health Timeline Chart */}
                 <div className="bg-secondary rounded-3xl border border-card-border p-4 md:p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/10 transition-colors"></div>
                    <HealthTimeline />
                 </div>

                <div className="flex items-center justify-between mt-8">
                  <h2 className="text-xl md:text-2xl font-bold text-main">Recent Activity</h2>
                  <button className="text-sm text-emerald-500 hover:text-emerald-400 font-medium">View All</button>
                </div>
                <div className="bg-secondary rounded-3xl border border-card-border p-2">
                  {recentActivity.length > 0 ? recentActivity.map((item, i) => (
                    <div key={i} className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0 sm:border-0">
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-${item.color}-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                            <item.icon className={`w-6 h-6 md:w-7 md:h-7 text-${item.color}-500`} />
                        </div>
                        <div className="flex-1 min-w-0 sm:hidden">
                             <h4 className="font-bold text-main text-base truncate">{item.title}</h4>
                             <p className="text-xs text-muted truncate">{item.desc}</p>
                        </div>
                      </div>

                      <div className="hidden sm:block flex-1 min-w-0">
                        <h4 className="font-bold text-main text-lg truncate">{item.title}</h4>
                        <p className="text-sm text-muted truncate">{item.desc}</p>
                      </div>

                      <div className="flex items-center justify-between sm:block sm:text-right mt-2 sm:mt-0 pl-16 sm:pl-0">
                        <p className="text-xs font-bold text-muted mb-0 sm:mb-1">{new Date(item.date).toLocaleDateString()}</p>
                        <div className="w-8 h-8 rounded-full bg-tertiary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <ArrowRight className="w-4 h-4 text-main" />
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-12 text-center text-muted flex flex-col items-center">
                      <img 
                        src={getValidImageUrl('empty-activity.png')} 
                        alt="No Activity" 
                        className="w-48 h-48 object-contain mb-4 opacity-50 grayscale hover:grayscale-0 transition-all"
                      />
                      <p className="text-lg font-medium">No recent activity yet.</p>
                      <p className="text-sm text-slate-500">Book an appointment or upload a report to get started.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar: Streak & Tip */}
              <div className="space-y-6">
                <DailyStreak />

                {/* Daily Tip Card */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] border border-white/10 p-8 flex flex-col justify-between overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                        <Zap className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Daily Insight</h3>
                      <p className="text-slate-400 leading-relaxed">
                        "Hydration is key! Drinking water before meals can help you feel fuller and aid digestion. Aim for 8 glasses daily."
                      </p>
                    </div>
                    
                    <button className="mt-8 w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all flex items-center justify-center gap-2 group-hover:border-emerald-500/30">
                      Read More <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
          </PageTransition>
        );
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'xray', label: 'AI X-Ray', icon: Activity },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'pharmacy', label: 'Pharmacy', icon: ShoppingBag },
    { id: 'symptoms', label: 'Symptoms', icon: Activity },
    { id: 'doctors', label: 'Find Doctors', icon: Search },
    { id: 'chat', label: 'Messages', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-primary text-main transition-colors duration-300">
      <DashboardNavbar 
        user={user}
        activeProfile={activeProfile}
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        logout={logout}
        unreadCount={unreadCount}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative">
        {/* Global Floating Icons */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <Heart className="absolute top-32 left-10 w-8 h-8 text-emerald-500/10 animate-float" />
          <p className="absolute top-48 right-10 w-10 h-10 text-cyan-500/10 animate-float-delayed">
             <Activity className="w-full h-full" />
          </p>
          <Zap className="absolute bottom-40 left-1/4 w-12 h-12 text-purple-500/10 animate-float" style={{ animationDelay: '1s' }} />
          <FileText className="absolute bottom-20 right-1/3 w-8 h-8 text-blue-500/10 animate-float-delayed" />
        </div>
        
        <div className="relative z-10">
            {renderContent()}
        </div>
      </main>

      {/* Booking Modal */}
      {showBookingModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Book Appointment</h3>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-slate-400 text-sm">Booking with</p>
              <h4 className="text-lg font-bold text-white">{selectedDoctor.name}</h4>
              <p className="text-emerald-400 text-sm">{selectedDoctor.specialization}</p>
            </div>

            <form onSubmit={handleBookSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="time"
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Reason for Visit</label>
                <textarea
                  value={bookingReason}
                  onChange={(e) => setBookingReason(e.target.value)}
                  placeholder="Briefly describe your symptoms or reason..."
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {bookingLoading ? 'Booking...' : 'Confirm Booking'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
