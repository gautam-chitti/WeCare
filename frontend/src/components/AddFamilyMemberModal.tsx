import React, { useState } from 'react';
import axios from 'axios';
import { X, UserPlus, Camera, Upload, Shield, User, Heart, Calendar } from 'lucide-react';

interface AddFamilyMemberModalProps {
  onClose: () => void;
  onSuccess: (newMember: any) => void;
}

export const AddFamilyMemberModal: React.FC<AddFamilyMemberModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    relation: 'Child',
    age: '',
    sex: 'Male',
    username: '',
    password: '',
    allowLogin: false
  });
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create Member
      const res = await axios.post('/api/family/members', {
        name: formData.name,
        relation: formData.relation,
        age: parseInt(formData.age),
        sex: formData.sex,
        username: formData.allowLogin ? formData.username : undefined,
        password: formData.allowLogin ? formData.password : undefined,
        allowLogin: formData.allowLogin
      });

      const newMemberId = res.data.id;

      // 2. Upload Photo (if selected)
      let finalMember = res.data;
      if (file) {
        const payload = new FormData();
        payload.append('file', file);
        const uploadRes = await axios.post(`/api/family/members/${newMemberId}/profile-picture`, payload, {
           headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalMember.profilePicture = uploadRes.data.filePath;
      }

      onSuccess(finalMember);
      onClose();
    } catch (err) {
      console.error("Failed to add family member", err);
      alert("Failed to add family member. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-slate-900/90 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-auto max-h-[90vh]">
        
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        {/* Sidebar / Image Section */}
        <div className="md:w-1/3 bg-slate-800/50 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
            
            <h3 className="text-lg font-bold text-white mb-6 relative z-10 text-center">Profile Photo</h3>
            
            <div className="relative group cursor-pointer w-32 h-32 mb-4">
              <div className="w-32 h-32 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden hover:border-emerald-500 transition-all duration-300 shadow-xl group-hover:shadow-emerald-500/20">
                {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="text-center p-2">
                        <Camera className="w-8 h-8 text-slate-500 mx-auto mb-2 group-hover:text-emerald-500 transition-colors" />
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Upload</span>
                    </div>
                )}
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="absolute bottom-1 right-1 bg-emerald-500 rounded-full p-2 shadow-lg hover:scale-110 transition-transform">
                <Upload className="w-4 h-4 text-slate-900" />
              </div>
            </div>
            
            <p className="text-xs text-slate-400 text-center relative z-10 px-4">
                Adding a photo helps identifying profiles easier.
            </p>
        </div>

        {/* Form Section */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Add Family Member</h2>
                    <p className="text-slate-400 text-sm">Create a profile for your loved ones.</p>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-4">
                    {/* Name Input */}
                    <div className="group relative">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                                placeholder="e.g. Grandma Alice"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Relation Select */}
                        <div className="group">
                             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Relation</label>
                             <div className="relative">
                                 <Heart className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-red-400 transition-colors" />
                                 <select
                                    value={formData.relation}
                                    onChange={(e) => setFormData({...formData, relation: e.target.value})}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer hover:bg-slate-900 transition-colors"
                                 >
                                    <option value="Child">Child</option>
                                    <option value="Spouse">Spouse</option>
                                    <option value="Parent">Parent</option>
                                    <option value="Sibling">Sibling</option>
                                    <option value="Other">Other</option>
                                 </select>
                             </div>
                        </div>

                        {/* Age Input */}
                        <div className="group">
                             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Age</label>
                             <div className="relative">
                                 <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                 <input
                                    type="number"
                                    required
                                    min="0"
                                    max="120"
                                    value={formData.age}
                                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                    placeholder="Age"
                                 />
                             </div>
                        </div>
                    </div>

                    {/* Sex Selection */}
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Sex</label>
                        <div className="flex gap-2 p-1 bg-slate-950/30 rounded-xl border border-white/5">
                            {['Male', 'Female', 'Other'].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setFormData({...formData, sex: s})}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        formData.sex === s 
                                        ? 'bg-emerald-500 text-slate-900 shadow-lg' 
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                     </div>
                </div>

                {/* Independent Access Toggle Section */}
                <div className="pt-6 border-t border-white/5">
                    <label className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${formData.allowLogin ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-transparent border-white/5 hover:border-white/10'}`}>
                       <div className="relative flex items-center mt-1">
                         <input 
                            type="checkbox"
                            checked={formData.allowLogin}
                            onChange={(e) => setFormData({...formData, allowLogin: e.target.checked})}
                            className="sr-only"
                         />
                         <div className={`w-11 h-6 rounded-full transition-colors duration-300 ${formData.allowLogin ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                         <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${formData.allowLogin ? 'translate-x-5' : 'translate-x-0'}`}></div>
                       </div>
                       
                       <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                              <Shield className={`w-4 h-4 ${formData.allowLogin ? 'text-emerald-500' : 'text-slate-400'}`} />
                              <span className={`font-bold text-sm ${formData.allowLogin ? 'text-white' : 'text-slate-400'}`}>Independent Access</span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">
                              Allow this family member to log in to their own dashboard using a username and password.
                          </p>
                       </div>
                    </label>

                    {/* Collapsible Credentials Fields */}
                    <div className={`grid grid-cols-2 gap-4 overflow-hidden transition-all duration-300 ${formData.allowLogin ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Username</label>
                             <input
                                type="text"
                                required={formData.allowLogin}
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                className="w-full px-4 py-2 bg-slate-950/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                placeholder="username"
                             />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                             <input
                                type="password"
                                required={formData.allowLogin}
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="w-full px-4 py-2 bg-slate-950/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                placeholder="••••••••"
                             />
                         </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 mt-auto">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-slate-300 font-bold hover:bg-white/5 hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Adding...' : 'Add Family Member'}
                        {!loading && <UserPlus className="w-4 h-5" />}
                    </button>
                </div>

            </form>
        </div>
      </div>
    </div>
  );
};
