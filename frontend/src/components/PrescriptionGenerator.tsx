import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import { FileText, Plus, Trash2, Download, X, Building, Search, User } from 'lucide-react';
import { getValidImageUrl } from '../utils/imageUrl';
import { PHARMACIES } from '../constants/pharmacies';

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface PrescriptionGeneratorProps {
  onClose: () => void;
  doctorName?: string;
  doctorSpec?: string;
  patientId?: number; 
}

export const PrescriptionGenerator: React.FC<PrescriptionGeneratorProps> = ({ onClose, doctorName = "Dr. John Doe", doctorSpec = "Cardiologist", patientId }) => {
  // Autocomplete State
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(patientId || null);

  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState(PHARMACIES[0].name);
  const [medicines, setMedicines] = useState<Medicine[]>([
    { name: '', dosage: '', frequency: '', duration: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search Patients
  useEffect(() => {
    const search = async () => {
        if (patientSearch.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const res = await axios.get(`/api/patients/search?query=${patientSearch}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setSearchResults(res.data);
            setShowResults(true);
        } catch (err) {
            console.error(err);
        }
    };
    const timeout = setTimeout(search, 300);
    return () => clearTimeout(timeout);
  }, [patientSearch]);

  const selectPatient = (p: any) => {
    setPatientName(p.name);
    setPatientAge(`${p.age || 'N/A'} / ${p.sex || 'N/A'}`);
    setSelectedPatientId(p.id);
    setPatientSearch(p.name);
    setShowResults(false);
  };

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const removeMedicine = (index: number) => {
    const newMeds = [...medicines];
    newMeds.splice(index, 1);
    setMedicines(newMeds);
  };

  const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
    const newMeds = [...medicines];
    newMeds[index][field] = value;
    setMedicines(newMeds);
  };

  const handleGenerate = async () => {
    if (!selectedPatientId) {
        alert("Please select a valid patient to sync online.");
        // We allow generating PDF still, but warn?
    }

    setIsSubmitting(true);
    
    // 1. Generate PDF (Client Side)
    const doc = new jsPDF();
    
    // Header - Logo & Hospital Name
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // Emerald-500
    doc.text("WeCare Medical Center", 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("123 Health Avenue, Medical District", 20, 26);
    doc.text("Phone: +91 00000 00000 | Email: support@wecare.com", 20, 31);
    
    // Doctor Details (Right Side)
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text(doctorName, 140, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(doctorSpec, 140, 25);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 31);

    // Line Separator
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(20, 35, 190, 35);

    // Patient Details
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Patient Name: ${patientName}`, 20, 45);
    doc.text(`Age/Gender: ${patientAge}`, 140, 45);
    
    doc.setDrawColor(16, 185, 129);
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(20, 50, 170, 15, 3, 3, 'FD');
    doc.setFontSize(11);
    doc.text(`Diagnosis: ${diagnosis}`, 25, 60);

    // Medicines Table
    const tableData = medicines.map(m => [m.name, m.dosage, m.frequency, m.duration]);
    
    autoTable(doc, {
      startY: 75,
      head: [['Medicine Name', 'Dosage', 'Frequency', 'Duration']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 3 },
    });

    // Footer / Advice
    const finalY = (doc as any).lastAutoTable.finalY || 80;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Advice / Notes:", 20, finalY + 10);
    doc.line(20, finalY + 25, 190, finalY + 25);
    doc.text("Drink plenty of water. Follow up in 7 days.", 20, finalY + 20);

    // Signature Area
    doc.text("Doctor's Signature", 140, finalY + 40);
    
    // Footer Branding
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Generated via WeCare Digital Health Platform", 105, 280, { align: 'center' });

    doc.save(`Prescription_${patientName.replace(/\s+/g, '_')}.pdf`);

    // 2. Save to Backend (if patientId is provided)
    if (selectedPatientId) {
        try {
            await axios.post('/api/prescriptions', {
                patientId: selectedPatientId,
                medicines,
                pharmacyName: selectedPharmacy,
                diagnosis
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            // Don't alert blocking, just auto-close
        } catch (error) {
            console.error("Failed to save prescription", error);
            alert("PDF generated, but failed to sync online.");
        }
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
               <FileText className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Digital Prescription</h2>
              <p className="text-sm text-slate-400">Search Patient, Create Rx & Send to Pharmacy</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Patient Search */}
          <div className="relative z-20">
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Search Patient (Start typing name...)</label>
             <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input 
                    type="text"
                    value={patientSearch}
                    onChange={(e) => {
                        setPatientSearch(e.target.value);
                        if (!e.target.value) setShowResults(false);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                    placeholder="e.g. Ali..."
                />
                
                {showResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                        {searchResults.map(p => (
                            <button 
                                key={p.id}
                                onClick={() => selectPatient(p)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-emerald-500/10 transition-colors text-left"
                            >
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                    <User className="w-4 h-4 text-slate-300" />
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm">{p.name}</p>
                                    <p className="text-xs text-slate-500">{p.age} Years • {p.sex}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
             </div>
          </div>

          {/* Patient Details (Auto-filled) */}
          <div className="grid md:grid-cols-3 gap-4">
             <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Patient Name</label>
                <input 
                  type="text" 
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                  placeholder="John Doe"
                  readOnly 
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Age / Gender</label>
                <input 
                  type="text" 
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                  placeholder="25 / Male"
                  readOnly
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Diagnosis</label>
                <input 
                  type="text" 
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                  placeholder="Viral Fever"
                />
             </div>
          </div>

          {/* Medicines List */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Medicines</label>
              <button onClick={addMedicine} className="text-xs flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold">
                <Plus className="w-3 h-3" /> Add Drug
              </button>
            </div>
            
            <div className="space-y-2">
              {medicines.map((med, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-800/50 p-2 rounded-xl border border-white/5">
                   <div className="col-span-4">
                      <input 
                        placeholder="Drug Name"
                        value={med.name}
                        onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-500"
                      />
                   </div>
                   <div className="col-span-3">
                      <input 
                        placeholder="Dosage"
                        value={med.dosage}
                        onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-500"
                      />
                   </div>
                   <div className="col-span-2">
                      <input 
                         placeholder="Freq"
                         value={med.frequency}
                         onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                         className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-500"
                      />
                   </div>
                   <div className="col-span-2">
                      <input 
                         placeholder="Duration"
                         value={med.duration}
                         onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                         className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-500"
                      />
                   </div>
                   <div className="col-span-1 flex justify-center">
                      <button onClick={() => removeMedicine(index)} className="text-red-400 hover:text-red-300 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pharmacy Selection */}
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <label className="flex items-center gap-2 text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2">
                <Building className="w-4 h-4" /> Select Pharmacy
            </label>
            <select
                value={selectedPharmacy}
                onChange={(e) => setSelectedPharmacy(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none cursor-pointer"
            >
                {PHARMACIES.map(p => (
                    <option key={p.id} value={p.name}>{p.name} - {p.address}</option>
                ))}
            </select>
            {selectedPatientId ? (
                <p className="text-xs text-slate-400 mt-2">The prescription will be automatically sent to this pharmacy for the selected patient.</p>
            ) : (
                <p className="text-xs text-yellow-500 mt-2">Please search and select a patient to sync this prescription online.</p>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 flex justify-end gap-4 bg-slate-800/50">
          <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-300 hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleGenerate}
            disabled={isSubmitting}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : (
                <>
                    <Download className="w-5 h-5" />
                    Generate & Send
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
