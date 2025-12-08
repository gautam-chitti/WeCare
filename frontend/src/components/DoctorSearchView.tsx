import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, Star, Stethoscope, User, ShieldCheck, Eye, Calendar, MessageCircle, Navigation } from 'lucide-react';
import { DoctorProfileView } from './DoctorProfileView';
import { getValidImageUrl, getDefaultAvatar } from '../utils/imageUrl';

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  location: string;
  rating: number;
  experience: number;
  isGeneralPractitioner: boolean;
  verificationStatus: string;
  bio?: string;
  profilePicture?: string;
  sex?: string;
  coordinates?: { lat: number; lng: number };
  distance?: number;
}

interface DoctorSearchViewProps {
  onBook?: (doctor: Doctor) => void;
  onMessage?: (doctor: Doctor) => void;
}

const CITY_CENTER = { lat: 28.6139, lng: 77.2090 }; // Default center (New Delhi) if user location fails

export const DoctorSearchView: React.FC<DoctorSearchViewProps> = ({ onBook, onMessage }) => {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [includeGp, setIncludeGp] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Doctor | null>(null);

  // Geolocation State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    searchDoctors();
  }, [includeGp, sortByDistance, userLocation]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const handleNearMeClick = () => {
    if (sortByDistance) {
      setSortByDistance(false);
      return;
    }

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setSortByDistance(true);
        setLoading(false);
        setLocationError("");
      },
      (error) => {
        console.error("Error getting location", error);
        setLocationError("Unable to retrieve your location");
        setLoading(false);
      }
    );
  };

  const searchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (location) params.append('location', location);
      if (specialization) params.append('specialization', specialization);
      if (includeGp) params.append('include_gp', 'true');

      const res = await axios.get(`/api/doctors/search?${params.toString()}`);
      let fetchedDoctors: Doctor[] = res.data;

      // 1. Assign Mock Coordinates (Deterministic based on ID)
      fetchedDoctors = fetchedDoctors.map(doc => {
        // Create a pseudo-random offset based on ID to keep it consistent
        // Spread roughly within 10km of "City Center"
        const latOffset = ((doc.id * 12345) % 100) / 1000 - 0.05; 
        const lngOffset = ((doc.id * 67890) % 100) / 1000 - 0.05;
        
        // If we have a user location, generate relative to them for better demo experience
        // otherwise use static city center
        const center = userLocation || CITY_CENTER;
        
        return {
          ...doc,
          coordinates: {
            lat: center.lat + latOffset,
            lng: center.lng + lngOffset
          }
        };
      });

      // 2. Calculate Distances if enabled
      if (sortByDistance && userLocation) {
        fetchedDoctors = fetchedDoctors.map(doc => ({
          ...doc,
          distance: calculateDistance(
            userLocation.lat,
            userLocation.lng,
            doc.coordinates!.lat,
            doc.coordinates!.lng
          )
        }));

        // 3. Sort by Distance
        fetchedDoctors.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }

      setDoctors(fetchedDoctors);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  const getSpecialtyIcon = (spec: string) => {
    const map: Record<string, string> = {
      'Cardiologist': 'specialty-cardiology.png',
      'Dermatologist': 'specialty-dermatology.png',
      'Neurologist': 'specialty-neurology.png',
      'Pediatrician': 'specialty-pediatrics.png'
    };
    return map[spec] ? getValidImageUrl(map[spec]) : null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold gradient-text flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
            <Search className="w-6 h-6 text-blue-400" />
          </div>
          Find a Doctor
        </h2>
      </div>

      {/* Search Bar */}
      <div className="card-premium p-6">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-400" />
            Search Filters
            </h3>
            {locationError && (
                <span className="text-red-400 text-sm">{locationError}</span>
            )}
        </div>
        
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Doctor Name"
              className="w-full pl-9 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
          </div>
          
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (e.g. Lallian)"
              disabled={sortByDistance}
              className={`w-full pl-9 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all ${sortByDistance ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>

          <div className="relative">
            <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
            >
              <option value="">All Specializations</option>
              <option value="Cardiologist">Cardiologist</option>
              <option value="Dermatologist">Dermatologist</option>
              <option value="Neurologist">Neurologist</option>
              <option value="Pediatrician">Pediatrician</option>
              <option value="Orthopedic Surgeon">Orthopedic Surgeon</option>
              <option value="General Practitioner">General Practitioner</option>
            </select>
          </div>

          <button 
            onClick={searchDoctors}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors"
          >
            Search
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <input
                type="checkbox"
                id="includeGp"
                checked={includeGp}
                onChange={(e) => setIncludeGp(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/50"
            />
            <label htmlFor="includeGp" className="text-sm text-slate-300">
                Include General Practitioners in results
            </label>
          </div>

          <div className="w-px h-6 bg-slate-700 hidden md:block"></div>

          <button
            onClick={handleNearMeClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                sortByDistance 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Navigation className={`w-4 h-4 ${sortByDistance ? 'fill-current' : ''}`} />
            {sortByDistance ? "Near Me Active" : "Find Near Me"}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="grid md:grid-cols-2 gap-4">
        {doctors.map((doc) => (
          <div key={doc.id} className="bg-slate-900/50 border border-white/10 rounded-xl p-4 hover:border-emerald-500/30 transition-colors flex gap-4 relative overflow-hidden group">
            {/* Distance Badge */}
            {doc.distance !== undefined && (
                <div className="absolute top-0 right-0 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-bl-xl z-10 flex items-center gap-1 shadow-lg">
                    <Navigation className="w-3 h-3 fill-current" />
                    {doc.distance.toFixed(1)} km
                </div>
            )}

            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-slate-700 group-hover:border-emerald-500/50 transition-colors">
                {doc.profilePicture ? (
                <img 
                  src={getValidImageUrl(doc.profilePicture)} 
                  alt={doc.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <img 
                  src={getDefaultAvatar(doc.sex)} 
                  alt={doc.name} 
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    {doc.name}
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getSpecialtyIcon(doc.specialization) && (
                      <img 
                        src={getSpecialtyIcon(doc.specialization)!} 
                        alt={doc.specialization} 
                        className="w-5 h-5 object-contain" 
                      />
                    )}
                    <p className="text-emerald-400 text-sm font-medium">{doc.specialization}</p>
                  </div>
                  {doc.isGeneralPractitioner && doc.specialization !== "General Practitioner" && (
                    <span className="text-xs bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full mt-1 inline-block">
                      Also GP
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg self-start mt-2 md:mt-0">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-yellow-500 font-bold text-sm">{doc.rating?.toFixed(1) || "N/A"}</span>
                </div>
              </div>
              
              <div className="mt-3 flex items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {doc.location || "Unknown Location"}
                </div>
                <div>
                  {doc.experience} years exp.
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                 <button 
                  onClick={() => setSelectedProfile(doc)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Profile
                </button>
                {onBook && (
                  <button 
                    onClick={() => onBook(doc)}
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Book
                  </button>
                )}
                {onMessage && (
                  <button 
                    onClick={() => onMessage(doc)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-sm transition-colors flex items-center gap-2"
                    title="Send Message"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
             </div>
            </div>
           ))}
        
        {doctors.length === 0 && !loading && (
          <div className="col-span-2 text-center py-12 text-slate-500">
            No doctors found matching your criteria.
          </div>
        )}
      </div>

      {selectedProfile && (
        <DoctorProfileView 
          doctor={selectedProfile} 
          onClose={() => setSelectedProfile(null)} 
        />
      )}
    </div>
  );
};
