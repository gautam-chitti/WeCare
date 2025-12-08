import React, { useState, useEffect } from 'react';
import { FileText, Upload, Eye, Share2, Trash2, X, Search, User, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getValidImageUrl } from '../utils/imageUrl';

import { PrivacyMask } from './PrivacyMask';

interface Report {
  id: number;
  title: string;
  summary: string;
  filePath: string;
  uploadedAt: string;
}

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  location: string;
  rating: number;
  isGeneralPractitioner: boolean;
}

export const ReportsView: React.FC = () => {
  const { activeProfile } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  
  // Share Modal State
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sharingId, setSharingId] = useState<number | null>(null); // Track which doctor is being shared with
  const [revokingId, setRevokingId] = useState<number | null>(null); // Track which doctor is being revoked

  useEffect(() => {
    fetchReports();
  }, [activeProfile]);

  useEffect(() => {
    if (showShareModal) {
      searchDoctors();
    }
  }, [showShareModal, searchQuery]);

  const fetchReports = async () => {
    try {
      const params: any = {};
      if (activeProfile?.type === 'family') {
        params.family_member_id = activeProfile.id;
      }
      
      const res = await axios.get('/api/reports/my', { params });
      setReports(res.data);
    } catch (error) {
      console.error("Failed to fetch reports", error);
    }
  };

  const searchDoctors = async () => {
    try {
      // In a real app, we might want to also fetch which doctors ALREADY have access
      // For now, we'll just search all doctors. 
      // Ideally, the backend search response would include an "hasAccess" flag for the current report context.
      const res = await axios.get(`/api/doctors/search?query=${searchQuery}`);
      setDoctors(res.data);
    } catch (error) {
      console.error("Failed to search doctors", error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace('.pdf', ''));
    
    if (activeProfile?.type === 'family') {
        formData.append('family_member_id', activeProfile.id.toString());
    }

    setUploading(true);
    try {
      await axios.post('/api/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchReports();
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload report");
    } finally {
      setUploading(false);
    }
  };

  const handleShare = async (doctorId: number) => {
    if (!selectedReportId) return;
    setSharingId(doctorId);
    try {
      await axios.post(`/api/reports/${selectedReportId}/share?doctor_id=${doctorId}`);
      alert("Report shared successfully!");
      // Optional: Refresh list or update UI state to show "Shared"
    } catch (error) {
      console.error("Share failed", error);
      alert("Failed to share report");
    } finally {
      setSharingId(null);
    }
  };

  const handleRevoke = async (doctorId: number) => {
    if (!selectedReportId) return;
    setRevokingId(doctorId);
    try {
      await axios.post(`/api/reports/${selectedReportId}/revoke?doctor_id=${doctorId}`);
      alert("Access revoked successfully!");
    } catch (error) {
      console.error("Revoke failed", error);
      alert("Failed to revoke access");
    } finally {
      setRevokingId(null);
    }
  };

  const openShareModal = (reportId: number) => {
    setSelectedReportId(reportId);
    setShowShareModal(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold gradient-text flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
            {activeProfile?.type === 'family' ? (
                <span><PrivacyMask>{activeProfile.name}</PrivacyMask>'s Medical Reports</span>
            ) : (
                "My Medical Reports"
            )}
          </h2>
        </div>
        <div className="w-full sm:w-auto flex justify-center">
            <label className={`
              flex items-center justify-center gap-2 px-6 py-3 btn-gradient-purple text-white font-bold rounded-xl cursor-pointer transition-all hover:scale-105 w-full sm:w-auto
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}>
              <Upload className="w-5 h-5" />
              {uploading ? 'Uploading...' : 'Upload PDF'}
              <input 
                type="file" 
                accept=".pdf" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4">
        {reports.map((report, index) => (
          <div 
            key={report.id} 
            className="card-premium-hover p-5 md:p-6 group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-1 w-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors truncate">
                      {report.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Uploaded on {new Date(report.uploadedAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                
                {report.summary && (
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-4 border border-emerald-500/20 w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-emerald-400 font-bold text-sm">AI Summary</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed line-clamp-3 md:line-clamp-none">
                      {report.summary}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Action Buttons - Full width on mobile */}
              <div className="flex sm:flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
                <a 
                  href={getValidImageUrl(report.filePath)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none p-3 bg-slate-800/50 hover:bg-slate-700/50 text-blue-400 rounded-xl transition-all hover:scale-110 flex items-center justify-center"
                  title="View PDF"
                >
                  <Eye className="w-5 h-5" />
                </a>
                <button 
                  onClick={() => openShareModal(report.id)}
                  className="flex-1 sm:flex-none p-3 bg-slate-800/50 hover:bg-slate-700/50 text-emerald-400 rounded-xl transition-all hover:scale-110 flex items-center justify-center"
                  title="Share with Doctor"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button 
                  className="flex-1 sm:flex-none p-3 bg-slate-800/50 hover:bg-slate-700/50 text-red-400 rounded-xl transition-all hover:scale-110 flex items-center justify-center"
                  title="Delete Report"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {/* Empty State */}
        {reports.length === 0 && (
          <div className="card-premium text-center py-16">
            <div className="w-20 h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Upload className="w-10 h-10 text-purple-400/50" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Reports Yet</h3>
            <p className="text-slate-400 mb-6">Upload your first medical report to get started</p>
            <label className="inline-flex items-center gap-2 px-6 py-3 btn-gradient-purple text-white font-bold rounded-xl cursor-pointer hover:scale-105 transition-all">
              <Upload className="w-5 h-5" />
              Upload Your First Report
              <input 
                type="file" 
                accept=".pdf" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Share Report</h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search doctors by name..."
                className="w-full pl-9 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
              {doctors.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white flex items-center gap-2">
                        {doc.name}
                        <ShieldCheck className="w-3 h-3 text-blue-400" />
                      </h4>
                      <p className="text-xs text-emerald-400">{doc.specialization}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleShare(doc.id)}
                      disabled={sharingId === doc.id}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      {sharingId === doc.id ? 'Sharing...' : 'Share'}
                    </button>
                    <button
                      onClick={() => handleRevoke(doc.id)}
                      disabled={revokingId === doc.id}
                      className="px-4 py-2 bg-slate-700 hover:bg-red-500/20 text-slate-300 hover:text-red-400 font-bold rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      {revokingId === doc.id ? 'Revoking...' : 'Revoke'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
