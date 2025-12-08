import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Clock, Check, MoreVertical, ChevronLeft, ChevronRight, User, MapPin } from 'lucide-react';
import { getValidImageUrl, getDefaultAvatar } from '../utils/imageUrl';
import { PrivacyMask } from './PrivacyMask';

interface Appointment {
  id: number;
  patient_id: number;
  patientId?: number;
  doctor_id: number;
  date: string;
  reason: string;
  status: string;
  patient: {
    name: string;
    sex: string;
    profilePicture?: string;
    email?: string;
  };
}

export const DoctorAppointmentsView: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/appointments/my');
      setAppointments(res.data);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
    } finally {
        setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await axios.put(`/api/appointments/${id}/status`, { status });
      fetchAppointments();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  // --- Calendar Logic ---
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const appointmentsForSelectedDate = appointments.filter(appt => 
    isSameDay(new Date(appt.date), selectedDate) && appt.status === 'confirmed'
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pendingAppointments = appointments.filter(a => a.status === 'pending');

  const renderCalendarDays = () => {
    const totalDays = getDaysInMonth(currentDate);
    const startDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className="min-h-[60px] md:min-h-[80px] p-2 bg-secondary/30 border border-white/5 opacity-50"></div>);
    }

    // Days
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayAppts = appointments.filter(a => isSameDay(new Date(a.date), date) && a.status === 'confirmed');
        const isSelected = isSameDay(date, selectedDate);
        const isToday = isSameDay(date, new Date());

        days.push(
            <div 
                key={day} 
                onClick={() => setSelectedDate(date)}
                className={`min-h-[60px] md:min-h-[80px] p-2 border transition-all cursor-pointer relative group flex flex-col items-start justify-between
                    ${isSelected 
                        ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500 z-10' 
                        : 'bg-secondary border-white/5 hover:bg-white/5 hover:border-emerald-500/30'}
                `}
            >
                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mb-1
                    ${isToday ? 'bg-emerald-500 text-slate-950' : 'text-main/70 group-hover:text-main'}
                `}>
                    {day}
                </span>
                
                <div className="flex gap-1 flex-wrap content-end w-full">
                    {dayAppts.length > 0 && (
                       <div className="w-full">
                          {dayAppts.length <= 2 ? (
                             <div className="flex gap-1">
                               {dayAppts.map((_, i) => <div key={i} className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>)}
                             </div>
                          ) : (
                             <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full w-fit">
                               {dayAppts.length} appts
                             </span>
                          )}
                       </div>
                    )}
                </div>
            </div>
        );
    }
    return days;
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 flex items-center justify-center border border-emerald-500/20">
                <CalendarIcon className="w-6 h-6 text-emerald-500" />
             </div>
             Schedule & Appointments
          </h1>
          <p className="text-muted mt-2 text-lg">Manage your bookings and availability efficiently.</p>
        </div>
        
        {/* Pending Requests Badge/Toggle could go here on mobile, or just integrated below */}
        <div className="hidden md:flex items-center gap-3 bg-secondary p-1 rounded-xl border border-white/5 shadow-sm">
            <button 
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    viewMode === 'calendar' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-muted hover:text-main'
                }`}
            >
                Calendar View
            </button>
            <button 
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    viewMode === 'list' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-muted hover:text-main'
                }`}
            >
                List View
            </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Calendar & Agenda (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Calendar Card */}
          <div className="bg-secondary rounded-3xl border border-white/10 shadow-xl overflow-hidden">
            {/* Calendar Controls */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-primary/30 backdrop-blur-sm">
               <h2 className="text-xl font-bold text-main">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
               </h2>
               <div className="flex gap-2">
                  <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-xl text-muted hover:text-main transition-colors border border-transparent hover:border-white/10">
                     <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-xl text-muted hover:text-main transition-colors border border-transparent hover:border-white/10">
                     <ChevronRight className="w-5 h-5" />
                  </button>
               </div>
            </div>

            {viewMode === 'calendar' ? (
                <>
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 bg-primary/20 border-b border-white/5">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="py-4 text-center text-xs font-bold text-muted uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 bg-primary/5">
                        {loading ? (
                            [...Array(35)].map((_, i) => <div key={i} className="h-24 border border-white/5 bg-secondary/50 animate-pulse"></div>)
                        ) : renderCalendarDays()}
                    </div>
                </>
            ) : (
                <div className="p-12 text-center text-muted">List view coming soon.</div>
            )}
          </div>

          {/* Selected Day Agenda */}
          <div className="space-y-4">
             <h3 className="text-xl font-bold text-main flex items-center gap-3">
                 <span className="w-1.5 h-8 bg-emerald-500 rounded-full"></span>
                 Schedule for 
                 <span className="text-emerald-500">
                    {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                 </span>
             </h3>

             <div className="grid gap-4">
                {appointmentsForSelectedDate.length > 0 ? (
                    appointmentsForSelectedDate.map((appt) => (
                        <div key={appt.id} className="group relative flex items-start gap-6 p-6 bg-secondary rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all hover:-translate-y-1 hover:shadow-xl">
                            {/* Time Column */}
                            <div className="flex flex-col items-center min-w-[80px]">
                                <span className="text-lg font-bold text-main">
                                    {new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(/^0/, '')}
                                </span>
                                <div className="h-full w-px bg-gradient-to-b from-emerald-500/50 to-transparent my-2"></div>
                            </div>

                            {/* Info Card */}
                            <div className="flex-1">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-14 h-14 rounded-2xl bg-primary overflow-hidden border-2 border-white/10 group-hover:border-emerald-500/50 transition-colors shadow-lg">
                                            <PrivacyMask className="block w-full h-full">
                                                <img 
                                                    src={appt.patient.profilePicture ? getValidImageUrl(appt.patient.profilePicture) : getDefaultAvatar(appt.patient.sex)} 
                                                    alt="Patient" 
                                                    className="w-full h-full object-cover" 
                                                />
                                            </PrivacyMask>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-main">
                                                <PrivacyMask>{appt.patient.name}</PrivacyMask>
                                            </h4>
                                            <p className="text-emerald-500 text-sm font-medium">Confirmed Appointment</p>
                                        </div>
                                    </div>
                                    <button className="p-2 text-muted hover:text-emerald-500 transition-colors">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                <div className="bg-primary/50 rounded-xl p-4 border border-white/5 flex flex-wrap gap-6 text-sm text-muted">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-emerald-500" />
                                        <span>Patient ID: <PrivacyMask>#{appt.patientId || appt.patient_id}</PrivacyMask></span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-emerald-500" />
                                        <span>Online Consultation</span>
                                    </div>
                                    <div className="w-full h-px bg-white/5 my-1"></div>
                                    <p className="italic w-full">" {appt.reason} "</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-12 text-center bg-secondary/30 rounded-3xl border border-dashed border-white/10">
                        <CalendarIcon className="w-12 h-12 text-muted/30 mx-auto mb-4" />
                        <p className="text-muted text-lg">No appointments scheduled for this day.</p>
                        <p className="text-sm text-muted/50">Select another date from the calendar.</p>
                    </div>
                )}
             </div>
          </div>
        </div>

        {/* Right Column: Pending Requests (4 cols) */}
        <div className="lg:col-span-4 space-y-8">
           <div className="sticky top-24 space-y-6">
                <div className="flex items-center justify-between">
                   <h2 className="text-xl font-bold text-main">Pending Requests</h2>
                   <span className="bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-xs font-bold border border-orange-500/20">
                      {pendingAppointments.length} New
                   </span>
                </div>

                <div className="space-y-4">
                    {pendingAppointments.length > 0 ? (
                        pendingAppointments.map((appt) => (
                        <div key={appt.id} className="p-5 bg-secondary rounded-2xl border border-white/10 hover:border-orange-500/30 transition-all hover:shadow-lg group">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-primary flex-shrink-0 overflow-hidden border border-white/10">
                                    <PrivacyMask className="block w-full h-full">
                                        <img 
                                            src={appt.patient.profilePicture ? getValidImageUrl(appt.patient.profilePicture) : getDefaultAvatar(appt.patient.sex)} 
                                            alt="Patient" 
                                            className="w-full h-full object-cover" 
                                        />
                                    </PrivacyMask>
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-main text-sm truncate"><PrivacyMask>{appt.patient.name}</PrivacyMask></h4>
                                    <p className="text-xs text-muted truncate">Requests an appointment</p>
                                </div>
                            </div>

                            <div className="bg-primary/50 rounded-xl p-3 mb-4 space-y-2 border border-white/5">
                                 <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted flex items-center gap-2">
                                        <CalendarIcon className="w-3.5 h-3.5 text-orange-500" /> Date
                                    </span>
                                    <span className="font-medium text-main">
                                        {new Date(appt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                 </div>
                                 <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-orange-500" /> Time
                                    </span>
                                    <span className="font-medium text-main">
                                        {new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                 </div>
                                 {appt.reason && (
                                     <div className="pt-2 mt-2 border-t border-white/5 text-xs italic text-muted">
                                         "{appt.reason}"
                                     </div>
                                 )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => handleStatusUpdate(appt.id, 'cancelled')}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold border border-transparent hover:border-red-400"
                                >
                                    Decline
                                </button>
                                <button 
                                    onClick={() => handleStatusUpdate(appt.id, 'confirmed')}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all text-xs font-bold shadow-lg shadow-emerald-500/20"
                                >
                                    Accept
                                </button>
                            </div>
                        </div>
                        ))
                    ) : (
                        <div className="p-8 text-center bg-secondary/30 rounded-2xl border border-dashed border-white/10">
                            <Check className="w-8 h-8 text-emerald-500/30 mx-auto mb-2" />
                            <p className="text-muted text-sm">All caught up!</p>
                            <p className="text-xs text-muted/50">No pending requests.</p>
                        </div>
                    )}
                </div>
           </div>
        </div>
      </div>
    </div>
  );
};
