import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Heart, Stethoscope, Shield, Zap, Users, Award, CheckCircle, Star, ArrowRight, Menu, X } from 'lucide-react';
import { ScrollReveal } from '../components/ScrollReveal';
import { ThemeToggle } from '../components/ThemeToggle';
import { getValidImageUrl } from '../utils/imageUrl';

const LandingPage: React.FC = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    { name: "Sarah Johnson", role: "Patient", text: "WeCare's AI diagnosis helped me catch a health issue early. The doctors are professional and caring!", rating: 5 },
    { name: "Dr. Michael Chen", role: "Verified Doctor", text: "The platform makes it easy to connect with patients and provide quality care remotely.", rating: 5 },
    { name: "Emily Rodriguez", role: "Patient", text: "Fast, reliable, and secure. I can access my medical records anytime, anywhere!", rating: 5 },
  ];

  const features = [
    { icon: Zap, title: "Instant AI Diagnosis", desc: "Get preliminary health insights in seconds using advanced AI models.", color: "from-yellow-400 to-orange-500", imageKey: 'feature-ai.png' },
    { icon: Stethoscope, title: "Expert Consultations", desc: "Connect with verified, licensed doctors for professional medical advice.", color: "from-blue-400 to-cyan-500", imageKey: 'feature-247.png' },
    { icon: Shield, title: "Secure & Private", desc: "Your health data is encrypted and protected with enterprise-grade security.", color: "from-emerald-400 to-teal-500", imageKey: 'feature-secure.png' },
    { icon: Activity, title: "X-Ray Analysis", desc: "AI-powered fracture and TB detection from X-ray images with explainable results.", color: "from-purple-400 to-pink-500", imageKey: 'feature-xray.png' },
    { icon: Heart, title: "Health Tracking", desc: "Monitor your health journey with comprehensive reports and analytics.", color: "from-red-400 to-rose-500", imageKey: 'feature-healthtracking.png' },
    { icon: Users, title: "Family Care", desc: "Manage health records for your entire family in one secure place.", color: "from-indigo-400 to-violet-500", imageKey: 'feature-familycare.png' },
  ];

  const steps = [
    { icon: Users, title: "Sign Up", desc: "Create your free account in under 60 seconds" },
    { icon: Activity, title: "Describe Symptoms", desc: "Our AI analyzes your symptoms instantly" },
    { icon: Stethoscope, title: "Consult Doctor", desc: "Get connected with verified healthcare professionals" },
    { icon: CheckCircle, title: "Get Better", desc: "Follow personalized treatment plans" },
  ];

  return (
    <div className="min-h-screen bg-primary text-main selection:bg-emerald-500/30 overflow-hidden transition-colors duration-300">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Floating Icons */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <Heart className="absolute top-20 left-10 w-8 h-8 text-emerald-500/20 animate-float" />
        <Stethoscope className="absolute top-40 right-20 w-10 h-10 text-cyan-500/20 animate-float-delayed" />
        <Activity className="absolute bottom-40 left-1/4 w-12 h-12 text-purple-500/20 animate-float" style={{ animationDelay: '1s' }} />
        <Shield className="absolute bottom-20 right-1/3 w-8 h-8 text-blue-500/20 animate-float-delayed" />
      </div>

      {/* Navbar */}
      <nav className="fixed w-full z-50 border-b border-card-border bg-primary/80 backdrop-blur-xl transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="WeCare Logo" className="w-10 h-10 object-contain" />
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                WeCare
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <ThemeToggle />
              <Link to="/login" className="text-sm font-medium text-muted hover:text-main transition-colors">
                Log in
              </Link>
              <Link to="/signup" className="px-6 py-2.5 text-sm font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 rounded-full transition-all hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/50">
                Get Started Free
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-4">
              <ThemeToggle />
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-white"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-slate-900/95 backdrop-blur-xl absolute w-full">
            <div className="px-4 py-6 space-y-4">
              <Link 
                to="/login" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full py-3 text-center text-slate-300 hover:text-white font-medium border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
              >
                Log in
              </Link>
              <Link 
                to="/signup" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full py-3 text-center font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 rounded-xl shadow-lg shadow-emerald-500/20"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ScrollReveal className="text-center">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left relative z-20">
              <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 mb-8 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                </span>
                AI-Powered Healthcare Platform
              </div>
              
              <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-8 leading-tight">
                <span className="bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent animate-gradient">
                  Your Health,
                </span>
                <br />
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x">
                  Reimagined with AI
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto lg:mx-0 mb-12 leading-relaxed">
                Experience the future of healthcare with instant AI symptom analysis, verified doctor consultations, 
                and secure medical records—all in one intelligent platform.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-16">
                <Link 
                  to="/signup" 
                  className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/50 flex items-center justify-center gap-2"
                >
                  Start Free Checkup
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="relative h-[400px] lg:h-[600px] w-full flex items-center justify-center">
              {/* Decorative Circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] lg:w-[500px] lg:h-[500px] bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
              
              {/* Doctor Images - Optimized for Mobile */}
              <div className="relative w-full h-full max-w-[500px] lg:max-w-[900px] mx-auto">
                 {/* Male Doctor - Positioned Right */}
                 <div className="absolute bottom-0 right-0 lg:right-0 w-48 lg:w-96 animate-float-delayed z-10 opacity-90 lg:opacity-100">
                  <img 
                    src="/mdoctor.png" 
                    alt="Male Doctor" 
                    className="w-full h-auto drop-shadow-2xl"
                  />
                 </div>
                 
                 {/* Female Doctor - Positioned Left */}
                 <div className="absolute bottom-0 left-0 lg:left-0 w-48 lg:w-96 animate-float z-20">
                  <img 
                    src="/fdoctor.png" 
                    alt="Female Doctor" 
                    className="w-full h-auto drop-shadow-2xl"
                  />
                 </div>

                 {/* Floating Badge - Verified */}
                 <div className="absolute top-10 right-4 lg:right-32 bg-slate-900/80 backdrop-blur-md border border-white/10 p-3 lg:p-4 rounded-2xl shadow-xl animate-float z-30 scale-90 lg:scale-100">
                    <div className="flex items-center gap-2 lg:gap-3">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Shield className="w-4 h-4 lg:w-6 lg:h-6 text-emerald-500" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm lg:text-base">Verified Doctors</div>
                        <div className="text-[10px] lg:text-xs text-emerald-400">100% Certified</div>
                      </div>
                    </div>
                 </div>

                 {/* Floating Badge - AI */}
                 {/* Fixed mobile overlap by moving it higher (bottom-48 instead of bottom-20) */}
                 {/* Fixed desktop overlap by moving it to the left (lg:-left-20) */}
                 <div className="absolute bottom-48 lg:bottom-56 left-0 lg:-left-24 bg-slate-900/80 backdrop-blur-md border border-white/10 p-3 lg:p-4 rounded-2xl shadow-xl animate-float-delayed z-30 scale-90 lg:scale-100">
                    <div className="flex items-center gap-2 lg:gap-3">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Activity className="w-4 h-4 lg:w-6 lg:h-6 text-blue-500" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm lg:text-base">AI Diagnosis</div>
                        <div className="text-[10px] lg:text-xs text-blue-400">99.9% Accuracy</div>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" />
              <span>ISO Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Verified Doctors</span>
            </div>
          </div>
        </ScrollReveal>

        {/* Stats Section */}
        <ScrollReveal className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { label: "Patients Served", value: 50000, suffix: "+" },
            { label: "Verified Doctors", value: 500, suffix: "+" },
            { label: "Success Rate", value: 98, suffix: "%" },
          ].map((stat, i) => (
            <div key={i} className="p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 backdrop-blur-sm hover:border-emerald-500/50 transition-all hover:scale-105">
              <div className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                <CountUp end={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-slate-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </ScrollReveal>

        {/* Features Grid */}
        <ScrollReveal className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Everything You Need
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Comprehensive healthcare tools powered by cutting-edge AI technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="group p-8 rounded-2xl bg-slate-900/50 border border-white/10 backdrop-blur-sm hover:border-emerald-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/20"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110 group-hover:rotate-6 ${feature.imageKey ? '' : `bg-gradient-to-br ${feature.color}`}`}>
                  {feature.imageKey ? (
                    <img 
                      src={getValidImageUrl(feature.imageKey)} 
                      alt={feature.title} 
                      className="w-full h-full object-contain drop-shadow-lg"
                    />
                  ) : (
                    <feature.icon className="w-8 h-8 text-white" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* How It Works */}
        <ScrollReveal className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Get started in minutes with our simple 4-step process
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Connection Line */}
            <div className="absolute top-12 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hidden lg:block"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, i) => (
                <div key={i} className="relative text-center">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mb-4 hover:scale-110 transition-transform shadow-lg shadow-emerald-500/50">
                    <step.icon className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-950 border-4 border-emerald-500 flex items-center justify-center font-bold text-emerald-400 text-sm">
                    {i + 1}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Testimonials */}
        <ScrollReveal className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Loved by Thousands
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              See what our users have to say about their experience
            </p>
          </div>

          <div className="max-w-4xl mx-auto relative">
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 backdrop-blur-sm p-12">
              {testimonials.map((testimonial, i) => (
                <div
                  key={i}
                  className={`transition-all duration-500 ${
                    i === currentTestimonial ? 'opacity-100 translate-x-0' : 'opacity-0 absolute translate-x-full'
                  }`}
                >
                  <div className="flex gap-1 mb-4 justify-center">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-xl text-slate-300 mb-6 text-center leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  <div className="text-center">
                    <div className="font-bold text-white">{testimonial.name}</div>
                    <div className="text-sm text-slate-400">{testimonial.role}</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentTestimonial(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentTestimonial ? 'bg-emerald-500 w-8' : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Final CTA */}
        <ScrollReveal className="mt-32 text-center">
          <div className="relative rounded-3xl bg-gradient-to-r from-emerald-600 to-cyan-600 p-12 overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/10"></div>
            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                Ready to Transform Your Healthcare?
              </h2>
              <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
                Join thousands of users who trust WeCare for their health needs
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 font-bold rounded-xl hover:bg-slate-100 transition-all hover:scale-105 shadow-2xl"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-32 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center text-slate-400">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/logo.png" alt="WeCare Logo" className="w-6 h-6 object-contain" />
            <span className="font-bold text-white">WeCare</span>
          </div>
          <p className="text-sm">© 2024 WeCare. All rights reserved.</p>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-5deg); }
        }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }

        .bg-grid-white\\/10 {
          background-image: linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
};

// Counter Component
const CountUp: React.FC<{ end: number; suffix: string }> = ({ end, suffix }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = end / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [end]);

  return <>{count.toLocaleString()}{suffix}</>;
};

export default LandingPage;
