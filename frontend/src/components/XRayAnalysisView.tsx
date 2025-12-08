import React, { useState , useEffect} from 'react';
import axios from 'axios';
import { Upload, Activity, AlertCircle, CheckCircle, XCircle, ScanEye, Share2, Search, User, ShieldCheck, X } from 'lucide-react';
import { getValidImageUrl } from '../utils/imageUrl';
import { useAuth } from '../context/AuthContext';

interface PredictionResult {
  prediction: string;
  confidence: string;
  features: {
    mean_intensity: number;
    variance: number;
    edge_density?: number;
  };
  processed_image?: string;
}

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  location: string;
  rating: number;
  isGeneralPractitioner: boolean;
}

export const XRayAnalysisView: React.FC = () => {
  const { activeProfile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [diseaseType, setDiseaseType] = useState<'fracture' | 'tb'>('fracture');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<any[]>([]);
  
  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedXRayId, setSelectedXRayId] = useState<number | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sharingId, setSharingId] = useState<number | null>(null); // Track which doctor is being shared with
  const [revokingId, setRevokingId] = useState<number | null>(null); // Track which doctor is being revoked

  useEffect(() => {
    fetchHistory();
  }, [activeProfile]);

  useEffect(() => {
    if (showShareModal) {
      searchDoctors();
    }
  }, [showShareModal, searchQuery]);

  const fetchHistory = async () => {
    try {
      let url = '/api/xrays/my';
      if (activeProfile?.type === 'family') {
        url += `?family_member_id=${activeProfile.id}`;
      }
      const res = await axios.get(url);
      setHistory(res.data);
    } catch (error) {
      console.error("Failed to fetch history");
    }
  };

  const searchDoctors = async () => {
    try {
      const res = await axios.get(`/api/doctors/search?query=${searchQuery}`);
      setDoctors(res.data);
    } catch (error) {
      console.error("Failed to search doctors", error);
    }
  };

  const handleShare = async (doctorId: number) => {
    if (!selectedXRayId) return;
    setSharingId(doctorId);
    try {
      await axios.post(`/api/xrays/${selectedXRayId}/share?doctor_id=${doctorId}`);
      alert("X-Ray shared successfully!");
      // setShowShareModal(false); // Keep open to allow sharing with multiple or revoking
    } catch (error) {
      console.error("Share failed", error);
      alert("Failed to share X-Ray");
    } finally {
      setSharingId(null);
    }
  };

  const handleRevoke = async (doctorId: number) => {
    if (!selectedXRayId) return;
    setRevokingId(doctorId);
    try {
      await axios.post(`/api/xrays/${selectedXRayId}/revoke?doctor_id=${doctorId}`);
      alert("Access revoked successfully!");
    } catch (error) {
      console.error("Revoke failed", error);
      alert("Failed to revoke access");
    } finally {
      setRevokingId(null);
    }
  };

  const openShareModal = (xrayId: number) => {
    setSelectedXRayId(xrayId);
    setShowShareModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('disease_type', diseaseType);
    
    if (activeProfile?.type === 'family') {
      formData.append('family_member_id', activeProfile.id.toString());
    }

    try {
      const res = await axios.post('/api/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(res.data);
      fetchHistory(); // Refresh history
    } catch (err: any) {
      console.error("Prediction Error", err);
      setError(err.response?.data?.detail || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold gradient-text flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
            <ScanEye className="w-6 h-6 text-blue-400" />
          </div>
          X-Ray Analysis
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="card-premium p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-400" />
            New Analysis
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Analysis Type Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Analysis Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDiseaseType('fracture')}
                  className={`relative group p-3 rounded-xl border transition-all duration-300 overflow-hidden ${
                    diseaseType === 'fracture' 
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/5' 
                      : 'bg-slate-800/50 border-white/5 hover:border-white/10 hover:bg-slate-800'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 ${diseaseType === 'fracture' ? 'opacity-100' : 'group-hover:opacity-50'} transition-opacity`} />
                  <div className="flex items-center gap-3 relative z-10">
                    <Activity className={`w-5 h-5 transition-colors ${diseaseType === 'fracture' ? 'text-emerald-400' : 'text-slate-500 group-hover:text-emerald-400'}`} />
                    <div className="text-left">
                      <div className={`font-bold text-sm leading-tight ${diseaseType === 'fracture' ? 'text-white' : 'text-slate-300'}`}>
                        Bone Fracture
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDiseaseType('tb')}
                  className={`relative group p-3 rounded-xl border transition-all duration-300 overflow-hidden ${
                    diseaseType === 'tb' 
                      ? 'bg-purple-500/10 border-purple-500 shadow-lg shadow-purple-500/5' 
                      : 'bg-slate-800/50 border-white/5 hover:border-white/10 hover:bg-slate-800'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 ${diseaseType === 'tb' ? 'opacity-100' : 'group-hover:opacity-50'} transition-opacity`} />
                  <div className="flex items-center gap-3 relative z-10">
                    <AlertCircle className={`w-5 h-5 transition-colors ${diseaseType === 'tb' ? 'text-purple-400' : 'text-slate-500 group-hover:text-purple-400'}`} />
                    <div className="text-left">
                      <div className={`font-bold text-sm leading-tight ${diseaseType === 'tb' ? 'text-white' : 'text-slate-300'}`}>
                        Tuberculosis
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* File Upload Area */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Upload X-Ray Image</label>
              <div className="relative group perspective-1000">
                <div className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all duration-500 ${
                  file 
                    ? 'border-emerald-500 bg-emerald-500/5' 
                    : 'border-white/10 hover:border-emerald-500/50 hover:bg-white/5'
                }`}>
                  <input 
                    type="file" 
                    onChange={handleFileChange}
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />
                  
                  {file ? (
                    <div className="relative z-10 animate-fade-in-up">
                      <div className="w-10 h-10 mx-auto mb-2 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      </div>
                      <p className="text-sm font-bold text-white mb-0.5 truncate px-4">{file.name}</p>
                      <p className="text-xs text-emerald-400 font-medium">Ready for analysis</p>
                    </div>
                  ) : (
                    <div className="relative z-10 group-hover:scale-105 transition-transform duration-300">
                      <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                        <img 
                          src={getValidImageUrl('scan-upload-zone.png')} 
                          alt="Scan Upload Zone" 
                          className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity animate-pulse-slow"
                        />
                      </div>
                      <p className="text-sm font-bold text-white mb-0.5">Drop X-Ray Scan Here</p>
                      <p className="text-xs text-slate-400">or click to browse</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Compute Button */}
            <button
              disabled={!file || loading}
              className={`
                relative w-full py-3 rounded-xl font-bold text-sm overflow-hidden transition-all duration-300
                ${!file || loading 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5' 
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/20'}
              `}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 relative">
                    <img 
                       src={getValidImageUrl('analysis-processing.png')} 
                       alt="Processing" 
                       className="w-full h-full object-contain animate-spin"
                    />
                  </div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <ScanEye className="w-5 h-5" />
                  <span>Run AI Analysis</span>
                </div>
              )}
            </button>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {result ? (
            <div className="card-premium p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Analysis Results
              </h3>

              {/* Prediction Result */}
              <div className={`p-6 rounded-xl border-2 mb-6 text-center ${
                result.prediction === 'Positive' 
                  ? 'bg-red-500/10 border-red-500/30' 
                  : 'bg-emerald-500/10 border-emerald-500/30'
              }`}>
                {result.prediction === 'Positive' ? (
                  <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                ) : (
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                )}
                <h3 className="text-2xl font-bold text-white mb-1">
                  {result.prediction} for {diseaseType === 'fracture' ? 'Fracture' : 'TB'}
                </h3>
                <p className="text-slate-400">Confidence: {result.confidence}</p>
              </div>

              {result.processed_image && (
                <div className="mb-6 rounded-xl overflow-hidden border border-slate-700">
                  <div className="bg-slate-800 p-2 text-xs text-center text-slate-400">
                    AI Visualization ({diseaseType === 'fracture' ? 'Edge Detection' : 'Heatmap'})
                  </div>
                  <img 
                    src={`data:image/png;base64,${result.processed_image}`} 
                    alt="Processed X-Ray" 
                    className="w-full h-auto"
                  />
                </div>
              )}

              <div className="space-y-4">
                <h4 className="font-medium text-slate-300">Feature Analysis</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Mean Intensity</p>
                    <p className="font-mono text-emerald-400">{result.features.mean_intensity.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Variance</p>
                    <p className="font-mono text-emerald-400">{result.features.variance.toFixed(2)}</p>
                  </div>
                  {result.features.edge_density !== undefined && (
                    <div className="p-3 bg-slate-800 rounded-lg col-span-2">
                      <p className="text-xs text-slate-500 mb-1">Edge Density</p>
                      <p className="font-mono text-emerald-400">{result.features.edge_density.toFixed(4)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
              <ScanEye className="w-16 h-16 mb-4 opacity-20" />
              <p>Upload an X-Ray image to see the analysis results here.</p>
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Activity className="text-purple-400" />
          Previous Scans
        </h2>
        
        {history.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No previous scans found.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((scan) => (
              <div key={scan.id} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-emerald-500/30 transition-colors">
                <div className="aspect-video bg-slate-900 relative">
                  {scan.heatmapPath ? (
                    <img 
                      src={getValidImageUrl(scan.heatmapPath)} 
                      alt="Scan Heatmap" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <ScanEye className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-xs font-bold uppercase">
                    {scan.type}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      scan.prediction === 'Positive' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {scan.prediction}
                    </span>
                    <button 
                      onClick={() => openShareModal(scan.id)}
                      className="p-1.5 bg-slate-700 hover:bg-slate-600 text-blue-400 rounded-lg transition-colors"
                      title="Share with Doctor"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">
                      {new Date(scan.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      ID: #{scan.id}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Share X-Ray Analysis</h3>
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

