import React, { useState } from 'react';
import axios from 'axios';
import { Activity, MapPin, Search, Star, Stethoscope } from 'lucide-react';

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  rating: number;
  experience: number;
}

export const SymptomSurveyView: React.FC = () => {
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ specialization: string; doctors: Doctor[] } | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms) return;

    setLoading(true);
    try {
      const res = await axios.post('/api/symptoms/analyze', { symptoms });
      setResult(res.data);
    } catch (error) {
      console.error("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold gradient-text flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-emerald-400" />
          </div>
          Symptom Checker
        </h2>
      </div>

      {/* Search Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/20 via-teal-900/20 to-slate-900 border border-emerald-500/20 p-10 text-center">
        <div className="absolute inset-0 bg-grid-white/5"></div>
        <div className="relative z-10">
          <div className="inline-flex p-4 bg-emerald-500/10 rounded-2xl mb-6 shadow-lg shadow-emerald-500/20">
            <Activity className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Not feeling well?</h3>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">
            Describe your symptoms in plain English, and our AI will find the right specialist for you.
          </p>
          
          <form onSubmit={handleAnalyze} className="max-w-2xl mx-auto relative">
            <input
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full px-6 py-5 bg-slate-950/50 border-2 border-slate-700 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 pr-16 shadow-xl shadow-emerald-900/20 backdrop-blur-sm transition-all"
              placeholder="e.g., I have a severe headache and sensitivity to light..."
            />
            <button 
              disabled={loading || !symptoms}
              className="absolute right-2 top-2 p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-slate-950 hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-105"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Search className="w-6 h-6" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          <div className="card-premium p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-300">
                  Recommended Specialist
                </h3>
                <p className="text-2xl font-bold gradient-text">{result.specialization}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {result.doctors.map((doc, index) => (
                <div 
                  key={doc.id} 
                  className="card-premium-hover p-5 flex gap-4"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-lg text-white">{doc.name}</h4>
                        <p className="text-emerald-400 text-sm font-medium">{doc.specialization}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-500/10 px-2.5 py-1 rounded-lg border border-yellow-500/20">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm text-yellow-500 font-bold">{doc.rating}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-4 h-4" />
                        {doc.experience} Years
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        Online
                      </span>
                    </div>
                    
                    <button className="w-full py-2.5 bg-slate-800/50 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-500 hover:text-slate-950 text-white text-sm font-bold rounded-xl transition-all hover:scale-[1.02]">
                      Book Appointment
                    </button>
                  </div>
                </div>
              ))}
              
              {result.doctors.length === 0 && (
                <div className="col-span-2 text-center py-16 border-2 border-dashed border-slate-800 rounded-xl">
                  <Stethoscope className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500">No doctors found for this specialization yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
