import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, User, X } from 'lucide-react';
import { PrivacyMask } from './PrivacyMask';

interface Appointment {
  id: number;
  date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reason: string;
  doctor: {
    name: string;
    specialization: string;
    location: string;
  };
}

import { useAuth } from '../context/AuthContext';

interface Appointment {
  id: number;
  date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reason: string;
  doctor: {
    name: string;
    specialization: string;
    location: string;
  };
}

export const PatientAppointmentsView: React.FC<{ onBookNew: () => void }> = ({ onBookNew }) => {
  const { activeProfile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, [activeProfile]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (activeProfile?.type === 'family') {
        params.family_member_id = activeProfile.id;
      }
      
      const res = await axios.get('/api/appointments/my', { params });
      setAppointments(res.data);
    } catch (error) {
      console.error("Failed to fetch appointments", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await axios.delete(`/api/appointments/${id}`);
      fetchAppointments(); // Refresh list
    } catch (error) {
      console.error("Failed to cancel appointment", error);
      alert("Failed to cancel appointment");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'pending': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'cancelled': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'completed': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold gradient-text flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            {activeProfile?.type === 'family' ? (
                <span><PrivacyMask>{activeProfile.name}</PrivacyMask>'s Appointments</span>
            ) : (
                "My Appointments"
            )}
          </h2>
        </div>
        <div className="w-full sm:w-auto flex justify-center">
            <button 
              onClick={onBookNew}
              className="w-full sm:w-auto px-6 py-3 btn-gradient text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2"
            >
              <Clock className="w-5 h-5" />
              Book New Appointment
            </button>
        </div>
      </div>
    
      <div className="grid gap-4">
        {appointments.map((appt) => {
          const date = new Date(appt.date);
          return (
            <div key={appt.id} className="group bg-slate-900/50 border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 hover:bg-slate-800/50 transition-all duration-300">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex items-start gap-4">
                  {/* Calendar Leaf Date */}
                  <div className="flex-shrink-0 w-16 h-16 bg-slate-800 rounded-xl border border-white/5 flex flex-col items-center justify-center overflow-hidden group-hover:border-emerald-500/30 transition-colors">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-widest bg-red-500/10 w-full text-center py-1">
                      {date.toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-2xl font-bold text-white flex-1 flex items-center justify-center">
                      {date.getDate()}
                    </span>
                    <span className="text-[10px] text-slate-500 pb-1 uppercase">
                      {date.toLocaleString('default', { weekday: 'short' })}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-xl text-white mb-1 group-hover:text-emerald-400 transition-colors"><PrivacyMask>{appt.doctor.name}</PrivacyMask></h3>
                    <div className="flex items-center gap-2 text-emerald-500/80 font-medium text-sm mb-3">
                      <User className="w-4 h-4" />
                      {appt.doctor.specialization}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-white/5">
                        <Clock className="w-4 h-4 text-blue-400" />
                        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                        <PrivacyMask>{appt.doctor.location}</PrivacyMask>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 md:gap-4 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                  <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${getStatusColor(appt.status)}`}>
                    <span className="relative flex h-2 w-2">
                       {appt.status === 'pending' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current"></span>}
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                    </span>
                    {appt.status}
                  </div>
                  
                  {appt.status === 'pending' && (
                     <button 
                       onClick={() => handleCancel(appt.id)}
                       className="text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                     >
                       <X className="w-4 h-4" />
                       <span className="hidden sm:inline">Cancel</span>
                     </button>
                  )}
                  {appt.reason && (
                    <div className="md:text-right w-full md:w-auto hidden md:block">
                      <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800 inline-block max-w-[200px] truncate">
                        Using Reason: "{appt.reason}"
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {appointments.length === 0 && !loading && (
          <div className="text-center py-16 text-slate-500 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 opacity-50" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Appointments Yet</h3>
            <p className="mb-6">Schedule your first consultation with our specialists.</p>
            <button 
              onClick={onBookNew}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-colors"
            >
              Find a Doctor
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
