// src/pages/Customer/ClientProposal.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

// --- IMPORTANT: FIX THE IMPORT PATH HERE IF RED ---
// Try: '../api/bookingService' OR '../../api/bookingService'
import { getBookingByRefId } from '../../api/bookingService'; 

import { Loader2, CheckCircle, CreditCard, Calendar, MapPin, Users } from 'lucide-react';

const ClientProposal = () => {
  const { refId } = useParams(); // Get ID from URL (e.g., BK-008)
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        if (!refId) throw new Error("No Booking ID provided");
        const result = await getBookingByRefId(refId);
        setData(result);
      } catch (err) {
        console.error("Error loading proposal", err);
        setError("Could not load proposal details.");
      } finally {
        setLoading(false);
      }
    };
    fetchProposal();
  }, [refId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="animate-spin text-[#C9A25D]" size={40} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md border border-red-100">
           <h2 className="text-xl font-bold text-red-500 mb-2">Unable to Load Proposal</h2>
           <p className="text-stone-600 mb-4">{error || "Proposal not found."}</p>
           <p className="text-xs text-stone-400">Reference ID: {refId}</p>
        </div>
      </div>
    );
  }

  // --- CALCULATE TOTALS ---
  const guests = data.estimatedGuests || data.guests || 0;
  // Try to find the calculated grand total, otherwise fallback to estimated budget
  const grandTotal = data.proposal?.costBreakdown?.grandTotal || data.estimatedBudget || 0;
  const menuPrice = data.proposal?.costBreakdown?.food || 0;
  const serviceCharge = data.proposal?.costBreakdown?.serviceCharge || 0;

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 font-sans">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden border border-stone-200">
        
        {/* Header */}
        <div className="bg-[#1c1c1c] text-white p-8 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-serif text-[#C9A25D] mb-2">Event Proposal</h1>
            <p className="text-stone-400 text-sm uppercase tracking-widest">Ref: {data.refId || data.id}</p>
          </div>
          {/* Decorative Circle */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#C9A25D]/10 rounded-full blur-2xl"></div>
        </div>

        <div className="p-6 md:p-10">
          {/* Greeting */}
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold mb-2 text-stone-800">Hi, {data.fullName || data.client}</h2>
            <p className="text-stone-600">
              We are honored to be part of your special day. Please review the details below.
            </p>
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="bg-stone-50 p-6 rounded-lg border border-stone-100 flex flex-col items-center text-center">
              <Calendar className="text-[#C9A25D] mb-3" size={24} />
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Date</p>
              <p className="font-medium text-stone-800">{data.dateOfEvent || data.date}</p>
            </div>
            <div className="bg-stone-50 p-6 rounded-lg border border-stone-100 flex flex-col items-center text-center">
              <Users className="text-[#C9A25D] mb-3" size={24} />
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Guests</p>
              <p className="font-medium text-stone-800">{guests} Pax</p>
            </div>
            <div className="bg-stone-50 p-6 rounded-lg border border-stone-100 flex flex-col items-center text-center">
              <MapPin className="text-[#C9A25D] mb-3" size={24} />
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Venue</p>
              <p className="font-medium text-stone-800">{data.venueName || data.venue || "TBD"}</p>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="border border-stone-100 rounded-lg p-6 mb-8 shadow-sm">
            <h3 className="font-serif text-lg mb-6 text-stone-800 border-b border-stone-100 pb-2">Cost Summary</h3>
            
            <div className="space-y-3 text-sm text-stone-600">
              {menuPrice > 0 && (
                 <div className="flex justify-between">
                    <span>Food & Beverage Package</span>
                    <span>₱ {Number(menuPrice).toLocaleString()}</span>
                 </div>
              )}
              {serviceCharge > 0 && (
                 <div className="flex justify-between text-stone-400">
                    <span>Service Charge (10%)</span>
                    <span>₱ {Number(serviceCharge).toLocaleString()}</span>
                 </div>
              )}
              
              <div className="flex justify-between text-stone-800 font-bold text-lg pt-4 border-t border-dashed border-stone-200 mt-4 items-end">
                <span>Grand Total Estimate</span>
                <span className="text-[#C9A25D] text-2xl font-serif">₱ {Number(grandTotal).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button 
              className="w-full bg-[#C9A25D] hover:bg-[#b08d55] text-white font-bold py-4 rounded-md flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-[#C9A25D]/30 transform hover:-translate-y-0.5"
              onClick={() => alert("Payment Gateway Integration (GCash/Stripe) goes here!")}
            >
              <CreditCard size={20} />
              Proceed to Payment
            </button>
            
            <p className="text-[10px] text-center text-stone-400 mt-6 leading-relaxed">
              By proceeding, you agree to the catering terms of service.<br/>
              A receipt will be sent to <strong>{data.email}</strong> upon completion.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ClientProposal;