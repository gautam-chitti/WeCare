import React, { useState, useEffect } from 'react';
import { Users, Search, MessageSquare, FileText, Calendar } from 'lucide-react';
import axios from 'axios';
import { getValidImageUrl, getDefaultAvatar } from '../utils/imageUrl';
import { Skeleton } from './ui/Skeleton';
import { PrivacyMask } from './PrivacyMask';

interface Patient {
  id: number;
  name: string;
  email: string;
  age?: number;
  sex?: string;
  profilePicture?: string;
}

export const DoctorPatientsView: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await axios.get('/api/doctors/patients');
        setPatients(res.data);
      } catch (e) {
        console.error("Failed to fetch patients", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-main flex items-center gap-2">
            <Users className="text-emerald-500" />
            My Patients
          </h2>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search patients..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-secondary border border-card-border rounded-xl text-main focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-full md:w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
           {Array(6).fill(0).map((_, i) => (
             <div key={i} className="card-premium p-6 space-y-4">
               <div className="flex justify-between items-start">
                 <Skeleton className="w-12 h-12 rounded-full" />
                 <Skeleton className="w-8 h-8 rounded-lg" />
               </div>
               <div className="space-y-2">
                 <Skeleton className="w-3/4 h-6 rounded-md" />
                 <Skeleton className="w-1/2 h-4 rounded-md" />
               </div>
               <div className="grid grid-cols-2 gap-2">
                 <Skeleton className="h-12 rounded-lg" />
                 <Skeleton className="h-12 rounded-lg" />
               </div>
               <div className="flex gap-2 pt-2">
                 <Skeleton className="flex-1 h-10 rounded-lg" />
                 <Skeleton className="flex-1 h-10 rounded-lg" />
               </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <div key={patient.id} className="card-premium p-6 group hover:-translate-y-1 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20 overflow-hidden">
                  {patient.profilePicture ? (
                    <PrivacyMask className="block w-full h-full">
                      <img 
                        src={getValidImageUrl(patient.profilePicture)} 
                        alt={patient.name} 
                        className="w-full h-full object-cover"
                      />
                    </PrivacyMask>
                  ) : (
                    <PrivacyMask className="block w-full h-full">
                      <img 
                        src={getDefaultAvatar(patient.sex)} 
                        alt={patient.name} 
                        className="w-full h-full object-cover"
                      />
                    </PrivacyMask>
                  )}
                </div>
                <button className="p-2 hover:bg-white/5 rounded-lg text-muted hover:text-white transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-main mb-1"><PrivacyMask>{patient.name}</PrivacyMask></h3>
              <p className="text-sm text-muted mb-4"><PrivacyMask>{patient.email}</PrivacyMask></p>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-secondary/50 p-2 rounded-lg text-center">
                  <span className="text-xs text-muted block">Age</span>
                  <span className="font-bold text-main">{patient.age || 'N/A'}</span>
                </div>
                <div className="bg-secondary/50 p-2 rounded-lg text-center">
                  <span className="text-xs text-muted block">Sex</span>
                  <span className="font-bold text-main capitalize">{patient.sex || 'N/A'}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" />
                  History
                </button>
                <button className="flex-1 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  Reports
                </button>
              </div>
            </div>
          ))}
          
          {filteredPatients.length === 0 && (
            <div className="col-span-full text-center py-12 bg-secondary/30 rounded-3xl border border-dashed border-card-border">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-muted">No patients found matching your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
