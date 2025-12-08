import React, { useState, useEffect } from 'react';
import { Star, MapPin, Award, MessageSquare, ShieldCheck, X, Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { getValidImageUrl } from '../utils/imageUrl';

interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  patient: {
    name: string;
  };
}

interface DoctorProfileViewProps {
  doctor: any;
  onClose?: () => void;
  isModal?: boolean;
  isEditable?: boolean;
}

export const DoctorProfileView: React.FC<DoctorProfileViewProps> = ({ doctor, onClose, isModal = true, isEditable = false }) => {
  const { user, updateUser } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(doctor.profilePicture || null);

  useEffect(() => {
    setProfilePic(doctor.profilePicture);
  }, [doctor]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get(`/api/doctors/${doctor.id}/reviews`);
        setReviews(res.data);
      } catch (e) {
        console.error("Failed to fetch reviews", e);
      }
    };
    fetchReviews();
    fetchReviews();
  }, [doctor.id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/users/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfilePic(res.data.filePath);
      if (isEditable && user && user.id === doctor.id) {
        updateUser({ ...user, profilePicture: res.data.filePath });
      }
    } catch (error) {
      console.error("Failed to upload image", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await axios.post('/api/reviews', {
        doctorId: doctor.id,
        rating: newReview.rating,
        comment: newReview.comment
      });
      setReviews([res.data, ...reviews]);
      setNewReview({ rating: 5, comment: '' });
      alert("Review submitted successfully!");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const Container = isModal ? 'div' : React.Fragment;
  const containerProps = isModal ? { className: "fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" } : {};

  return (
    <Container {...containerProps}>
      <div className={`${isModal ? 'bg-slate-900 border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-8 shadow-2xl relative' : 'space-y-8 animate-fade-in'}`}>
        {isModal && onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {/* Doctor Info */}
          <div className="md:col-span-1 space-y-6">
            <div className="relative group aspect-square bg-slate-800 rounded-2xl overflow-hidden border-4 border-slate-700">
               {profilePic ? (
                  <img 
                    src={getValidImageUrl(profilePic)} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-emerald-500/10 text-emerald-500 text-4xl font-bold">
                    {doctor.name.charAt(0)}
                 </div>
               )}
               
               {isEditable && (
                 <label className="absolute bottom-2 right-2 p-2 bg-emerald-500 hover:bg-emerald-400 rounded-full cursor-pointer transition-colors shadow-lg z-10">
                   {uploading ? <Loader2 className="w-4 h-4 animate-spin text-slate-900" /> : <Camera className="w-4 h-4 text-slate-900" />}
                   <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                 </label>
               )}
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{doctor.name}</h2>
              <p className="text-emerald-400 font-medium mb-4">{doctor.specialization}</p>
              
              <div className="space-y-3 text-sm text-slate-400">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  {doctor.location || "Location not specified"}
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-4 h-4 text-slate-500" />
                  {doctor.experience || 0} Years Experience
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-slate-500" />
                  {doctor.verificationStatus === 'verified' ? 'Verified Specialist' : 'Pending Verification'}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Rating</span>
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-bold">{doctor.rating?.toFixed(1) || "N/A"}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Reviews</span>
                <span className="text-white font-medium">{reviews.length}</span>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="md:col-span-2 space-y-8">
            {/* Write Review */}
            <div className="bg-slate-800/30 rounded-xl p-6 border border-white/5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                Write a Review
              </h3>
              
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className={`p-1 transition-colors ${
                          star <= newReview.rating ? 'text-yellow-400' : 'text-slate-600'
                        }`}
                      >
                        <Star className="w-6 h-6 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Your Review</label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                    rows={3}
                    placeholder="Share your experience..."
                    required
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            </div>

            {/* Reviews List */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Patient Reviews</h3>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-slate-800/30 rounded-xl p-6 border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {review.patient.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{review.patient.name}</p>
                          <p className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-sm font-bold">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <p className="text-slate-500 text-center py-8">No reviews yet. Be the first to review!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};
