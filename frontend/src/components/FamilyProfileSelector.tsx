import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, type ActiveProfile } from '../context/AuthContext';
import { Plus, Check, Users, ChevronRight } from 'lucide-react';
import { getValidImageUrl, getDefaultAvatar } from '../utils/imageUrl';
import { AddFamilyMemberModal } from './AddFamilyMemberModal';
import { PrivacyMask } from './PrivacyMask';

interface FamilyProfileSelectorProps {
    variant?: 'standalone' | 'dropdown' | 'mobile';
}

export const FamilyProfileSelector: React.FC<FamilyProfileSelectorProps> = ({ variant = 'standalone' }) => {
    const { user, activeProfile, switchProfile, isFamilySession } = useAuth();
    
    if (isFamilySession) return null;

    const [members, setMembers] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false); // For standalone dropdown or collapsible sections
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        if (user?.role === 'patient') {
            fetchFamilyMembers();
        }
    }, [user, activeProfile]); 

    const fetchFamilyMembers = async () => {
        try {
            const res = await axios.get('/api/family/members');
            setMembers(res.data);
        } catch (err) {
            console.error("Failed to fetch family members", err);
        }
    };

    const handleSwitch = (profile: ActiveProfile) => {
        switchProfile(profile);
        setIsOpen(false);
    };

    if (user?.role !== 'patient') return null;
    if (!activeProfile) return null;

    // --- Render Logic for List Items ---
    const renderProfileList = (compact = false) => (
        <div className={`space-y-1 ${compact ? '' : 'mt-2'}`}>
             {/* Main User */}
             <button
                onClick={() => handleSwitch({
                    type: 'user',
                    id: user!.id,
                    name: user!.name || 'Me',
                    profilePicture: user!.profilePicture,
                    age: user!.age,
                    sex: user!.sex
                })}
                className={`w-full flex items-center gap-3 ${compact ? 'px-2 py-1.5' : 'p-2'} rounded-xl transition-colors ${activeProfile.type === 'user' ? 'bg-emerald-500/10 border border-emerald-500/30' : 'hover:bg-white/5 border border-transparent'}`}
            >
                    <div className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-slate-800 overflow-hidden`}>
                    <img src={user?.profilePicture ? getValidImageUrl(user.profilePicture) : getDefaultAvatar(user?.sex)} className="w-full h-full object-cover" alt="Me" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                    <p className={`text-sm font-bold truncate ${activeProfile.type === 'user' ? 'text-emerald-500' : 'text-slate-300'}`}>Me (Primary)</p>
                    </div>
                    {activeProfile.type === 'user' && <Check className="w-4 h-4 text-emerald-500" />}
            </button>

            {/* Family Members */}
            {members.map(member => (
                <button
                    key={member.id}
                    onClick={() => handleSwitch({
                        type: 'family',
                        id: member.id,
                        name: member.name,
                        profilePicture: member.profilePicture,
                        age: member.age,
                        sex: member.sex,
                        relation: member.relation
                    })}
                    className={`w-full flex items-center gap-3 ${compact ? 'px-2 py-1.5' : 'p-2'} rounded-xl transition-colors ${activeProfile.type === 'family' && activeProfile.id === member.id ? 'bg-blue-500/10 border border-blue-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                >
                    <div className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-slate-800 overflow-hidden`}>
                        <img src={member.profilePicture ? getValidImageUrl(member.profilePicture) : getDefaultAvatar(member.sex)} className="w-full h-full object-cover" alt={member.name} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                        <p className={`text-sm font-bold truncate ${activeProfile.type === 'family' && activeProfile.id === member.id ? 'text-blue-400' : 'text-slate-300'}`}><PrivacyMask>{member.name}</PrivacyMask></p>
                        {!compact && <p className="text-[10px] text-slate-500">{member.relation}</p>}
                    </div>
                    {activeProfile.type === 'family' && activeProfile.id === member.id && <Check className="w-4 h-4 text-blue-400" />}
                </button>
            ))}

            <button 
                onClick={() => { setShowAddModal(true); setIsOpen(false); }}
                className={`w-full flex items-center justify-center gap-2 ${compact ? 'py-1.5' : 'py-2'} mt-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider`}
            >
                <Plus className="w-3 h-3" /> Add New
            </button>
        </div>
    );


    // --- VARIANT: DROPDOWN (Embedded inside desktop dropdown) ---
    if (variant === 'dropdown') {
        return (
            <>
            <div className="border-t border-white/10 pt-2 mt-2">
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors group"
                >
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">Switch Profile</span>
                    </div>
                    <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[300px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                    <div className="px-1 pb-1">
                        {renderProfileList(true)}
                    </div>
                </div>
            </div>
            {showAddModal && <AddFamilyMemberModal onClose={() => setShowAddModal(false)} onSuccess={(newMember) => setMembers([...members, newMember])} />}
            </>
        );
    }

    // --- VARIANT: MOBILE (Embedded inside mobile menu) ---
    if (variant === 'mobile') {
        return (
            <>
            <div className="border-t border-b border-white/10 py-4 my-4">
                <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Users className="w-3 h-3" /> Family Profiles
                </p>
                <div className="px-2">
                    {renderProfileList(false)}
                </div>
            </div>
            {showAddModal && <AddFamilyMemberModal onClose={() => setShowAddModal(false)} onSuccess={(newMember) => setMembers([...members, newMember])} />}
            </>
        );
    }

    // --- VARIANT: STANDALONE (Original button, backup) ---
    // Not managing this anymore based on user feedback, but keeping for backup if needed.
    return null;
};
