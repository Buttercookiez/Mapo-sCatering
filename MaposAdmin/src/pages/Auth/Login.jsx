// src/pages/Auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios'; // Ensure axios is installed
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  ChefHat 
} from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  
  // State
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        // --- API CALL TO YOUR BACKEND ---
        // Ensure your server is running on port 5000
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: formData.email,
            password: formData.password
        });

        if (response.data.success) {
            // 1. Save Token and User Data
            localStorage.setItem('isAuthenticated', 'true'); 
            localStorage.setItem('token', response.data.token); // Save JWT
            
            // 2. Redirect
            navigate('/dashboard'); 
        }

    } catch (err) {
        // Handle Errors (Backend sends 401 for bad pass, 500 for server error)
        if (err.response && err.response.data) {
            setError(err.response.data.message);
        } else {
            setError('Unable to connect to server.');
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full font-sans bg-[#0c0c0c] text-stone-200 selection:bg-[#C9A25D] selection:text-white">
      
      {/* LEFT SIDE: Image/Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-stone-900 items-center justify-center">
        <div className="absolute inset-0 z-0">
            <img 
                src="https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=2070&auto=format&fit=crop" 
                alt="Fine Dining" 
                className="w-full h-full object-cover opacity-40 grayscale hover:grayscale-0 transition-all duration-[2s] ease-out scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c0c0c] via-[#0c0c0c]/60 to-transparent"></div>
        </div>

        <div className="relative z-10 p-12 max-w-lg animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="w-16 h-16 bg-[#C9A25D] rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(201,162,93,0.3)]">
                <ChefHat className="text-white" size={32} />
            </div>
            <h1 className="font-serif text-5xl leading-tight mb-6">
                Culinary Excellence <br /> <span className="italic text-[#C9A25D]">Redefined.</span>
            </h1>
            <p className="text-stone-400 text-lg leading-relaxed">
                Manage your events, track your inventory, and oversee bookings from one centralized control panel.
            </p>
        </div>
      </div>

      {/* RIGHT SIDE: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 relative">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            <div className="mb-12">
                <h2 className="font-serif text-3xl mb-2 text-white">Welcome Back</h2>
                <p className="text-stone-500 text-sm uppercase tracking-widest">Mapo's Catering Admin Portal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                
                <div className="group">
                    <label className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2 font-bold group-focus-within:text-[#C9A25D] transition-colors">
                        Email Address
                    </label>
                    <div className="relative">
                        <input 
                            type="email" 
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="admin@mapos.com"
                            className="w-full bg-transparent border-b border-stone-800 py-3 pl-10 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#C9A25D] transition-all"
                        />
                        <Mail className="absolute left-0 top-3 text-stone-600 group-focus-within:text-[#C9A25D] transition-colors" size={18} />
                    </div>
                </div>

                <div className="group">
                    <label className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2 font-bold group-focus-within:text-[#C9A25D] transition-colors">
                        Password
                    </label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
                            className="w-full bg-transparent border-b border-stone-800 py-3 pl-10 pr-10 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#C9A25D] transition-all"
                        />
                        <Lock className="absolute left-0 top-3 text-stone-600 group-focus-within:text-[#C9A25D] transition-colors" size={18} />
                        
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-0 top-3 text-stone-600 hover:text-stone-300 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-900/10 border border-red-900/20 text-red-400 text-xs text-center rounded-sm">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <input 
                            id="remember-me"
                            type="checkbox" 
                            className="w-4 h-4 rounded-sm border-stone-700 bg-stone-900 cursor-pointer accent-[#C9A25D] focus:ring-[#C9A25D] focus:ring-offset-0" 
                        />
                        <label 
                            htmlFor="remember-me" 
                            className="text-xs text-stone-500 cursor-pointer hover:text-stone-300 transition-colors select-none"
                        >
                            Remember me
                        </label>
                    </div>
                    
                   
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-[#C9A25D] hover:bg-[#b08d4d] text-white py-4 rounded-sm uppercase tracking-[0.2em] text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(201,162,93,0.1)] hover:shadow-[0_0_30px_rgba(201,162,93,0.3)]"
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" /> 
                            Authenticating...
                        </>
                    ) : (
                        <>
                            LOGIN
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>

            </form>
            
            <div className="mt-12 text-center">
                <p className="text-[10px] text-stone-600 uppercase tracking-widest">
                    &copy; {new Date().getFullYear()} Mapo's Catering Services
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;