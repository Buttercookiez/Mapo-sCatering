// src/components/customer/Footer.jsx
import React from 'react';
import { Instagram, Facebook, Mail } from 'lucide-react';

const Footer = ({ darkMode }) => {
  return (
    <footer className="bg-stone-900 text-stone-400 py-12 border-t border-stone-800">
      <div className="max-w-screen-xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-serif text-white mb-4">Mapo's Catering</h3>
            <p className="text-sm max-w-md">
              Bespoke culinary experiences tailored to the finest detail. 
              From intimate gatherings to grand celebrations.
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex gap-4 text-white">
              <a href="#" className="hover:text-[#C9A25D] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.facebook.com/maposcatering" className="hover:text-[#C9A25D] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="mailto:cateringmapo@gmail.com" className="hover:text-[#C9A25D] transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
            <div className="text-xs tracking-widest uppercase">
              &copy; {new Date().getFullYear()} Mapo's Catering
            </div>
          </div>
        </div>
        
        <div className="border-t border-stone-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-8 text-xs tracking-widest uppercase">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="text-xs text-stone-500">
            Crafted with excellence
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;