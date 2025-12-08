import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import { Activity, Mail, Lock, Heart, Stethoscope, Shield } from 'lucide-react';

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [serverError, setServerError] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isFamilyLogin, setIsFamilyLogin] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>(); // We'll handle validation manually or dynamic

  const onSubmit = async (data: FormData) => {
    try {
      setServerError("");
      
      if (isFamilyLogin) {
         // Family Login
         const res = await axios.post("/auth/family/login", {
            username: data.email, // reusing the input field
            password: data.password
         });
         // Family login response structure is same as user login response with access_token and user object
         // But we might need to handle the activeProfile part in AuthContext.
         // For now, let's assume login() handles the token and user.
         // We need to update login() signature or handle it here.
         // Actually, standard login() just saves token and user.
         // We might need to manually set the active profile in local storage or context if provided.
         
         login(res.data.access_token, res.data.user);
         
         // Force set active profile if returned
         if (res.data.activeProfile) {
             localStorage.setItem('activeProfile', JSON.stringify(res.data.activeProfile));
             // Trigger a reload or event so context picks it up? 
             // Ideally login() should accept it. For now, strict reload to be safe.
             window.location.href = '/patient'; 
         } else {
             navigate('/patient');
         }

      } else {
         // Standard Login
         const res = await axios.post("/auth/login", data);
         login(res.data.access_token, res.data.user);
         
         const role = res.data.user.role;
         if (role === 'admin') navigate('/admin');
         else if (role === 'doctor') navigate('/doctor');
         else navigate('/patient');
      }

    } catch (err: any) {
      setServerError(err?.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Floating Icons */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <Heart className="absolute top-20 left-10 w-8 h-8 text-emerald-500/20 animate-float" />
        <Stethoscope className="absolute top-40 right-20 w-10 h-10 text-cyan-500/20 animate-float-delayed" />
        <Activity className="absolute bottom-40 left-1/4 w-12 h-12 text-purple-500/20 animate-float" style={{ animationDelay: '1s' }} />
        <Shield className="absolute bottom-20 right-1/3 w-8 h-8 text-blue-500/20 animate-float-delayed" />
      </div>

      <div className={`w-full max-w-md relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Logo/Brand */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8 group">
          <img src="/logo.png" alt="WeCare Logo" className="w-16 h-16 object-contain group-hover:scale-110 transition-transform" />
        </Link>

        <div className="bg-slate-900/50 border border-white/10 p-8 rounded-2xl backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-2">
              {isFamilyLogin ? 'Family Access' : 'Welcome Back'}
            </h2>
            <p className="text-slate-400">
                {isFamilyLogin ? 'Login with your family member credentials' : 'Sign in to continue your health journey'}
            </p>
          </div>

          {serverError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center backdrop-blur-sm animate-shake">
              {serverError}
            </div>
          )}
          
          {/* Toggle Type */}
          <div className="flex bg-slate-800 p-1 rounded-xl mb-6">
             <button 
                type="button"
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!isFamilyLogin ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                onClick={() => { setIsFamilyLogin(false); reset(); }}
             >
                Main User
             </button>
             <button 
                type="button"
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isFamilyLogin ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                onClick={() => { setIsFamilyLogin(true); reset(); }}
             >
                Family Member
             </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                  {isFamilyLogin ? 'Username' : 'Email Address'}
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                <input
                  {...register("email", { required: true })} 
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  placeholder={isFamilyLogin ? "username" : "name@example.com"}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                <input
                  {...register("password", { required: true })}
                  type="password"
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/50 mt-6"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-center text-sm text-slate-400">
              Don't have an account?{" "}
              <Link to="/signup" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                Create one now
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <Link 
          to="/" 
          className="block text-center mt-6 text-sm text-slate-400 hover:text-emerald-400 transition-colors"
        >
          ← Back to Home
        </Link>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-5deg); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Login;
