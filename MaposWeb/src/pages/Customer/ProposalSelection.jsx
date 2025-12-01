import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// Import the service functions
import {
  verifyProposalToken,
  confirmProposalSelection,
} from "../../api/bookingService";

const ProposalSelection = () => {
  const { token } = useParams(); // Catches the secure token from URL
  const navigate = useNavigate();

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Proposal Data on Load
  useEffect(() => {
    const fetchProposal = async () => {
      // 🚨 Ensure loading is set to true before the call (it's true by default, but good practice)
      setLoading(true);
      setError(""); // Clear any previous error

      try {
        // Use the service function
        const data = await verifyProposalToken(token);
        setProposal(data);
        // data.success will be true, data.options will be present
      } catch (err) {
        // 🚨 BETTER ERROR HANDLING 🚨
        console.error("Proposal verification failed:", err);
        // Extract a specific message from a failed API response
        const message =
          err.response?.data?.message ||
          "Could not connect to server or proposal is invalid.";
        setError(message);
        setProposal(null); // Clear proposal data on error
      } finally {
        // 🚨 THIS IS THE MISSING LINE 🚨
        setLoading(false);
      }
    };

    if (token) fetchProposal();
    // No need for an else to setLoading(false) here, as we do it in finally.
  }, [token]);

  const handleSelectPackage = async (selectedPkg) => {
    setSubmitting(true); // <--- Added this to explicitly start submitting
    setError("");

    try {
      // Use the service function
      await confirmProposalSelection({
        token: token,
        selectedPackage: selectedPkg,
      });
      navigate("/success"); // Only navigate on success
    } catch (err) {
      console.error("Confirmation failed:", err);
      // Better error handling for the submit failure
      const message =
        err.response?.data?.message || "Failed to confirm selection.";
      setError(message);
    } finally {
      // 🚨 THIS IS THE MISSING LINE 🚨
      setSubmitting(false);
    }
  };

  // --- RENDER STATES ---
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-red-600 px-4 text-center">
        <h1 className="text-3xl font-bold mb-2">Access Unavailable</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h2 className="text-base font-semibold text-yellow-600 tracking-wide uppercase">
            Event Proposal
          </h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Hi, {proposal.clientName}
          </p>
          <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
            We are ready for your event on <strong>{proposal.eventDate}</strong>
            . Please select your preferred package below to proceed.
          </p>
        </div>

        {/* Pricing/Package Cards */}
        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
          {proposal.options.map((pkg, index) => {
            // Highlight the middle package (index 1) usually
            const isHighlight = index === 1;

            return (
              <div
                key={index}
                className={`rounded-lg shadow-lg divide-y divide-gray-200 bg-white flex flex-col border-2 ${
                  isHighlight
                    ? "border-yellow-500 transform scale-105 z-10"
                    : "border-transparent"
                }`}
              >
                <div className="p-6">
                  <h2 className="text-2xl leading-6 font-bold text-gray-900">
                    {pkg.name}
                  </h2>
                  <p className="mt-4">
                    <span className="text-4xl font-extrabold text-gray-900">
                      ₱{pkg.pricePerHead}
                    </span>
                    <span className="text-base font-medium text-gray-500">
                      /head
                    </span>
                  </p>

                  <button
                    onClick={() => handleSelectPackage(pkg)}
                    disabled={submitting}
                    className={`mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium ${
                      isHighlight
                        ? "bg-yellow-600 text-white hover:bg-yellow-700"
                        : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                    } transition duration-150 ease-in-out`}
                  >
                    {submitting ? "Processing..." : `Select ${pkg.name}`}
                  </button>
                </div>
                <div className="pt-6 pb-8 px-6 flex-1">
                  <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">
                    What's included
                  </h3>
                  <ul className="mt-6 space-y-4">
                    {pkg.inclusions.map((feature, i) => (
                      <li key={i} className="flex space-x-3">
                        <svg
                          className="flex-shrink-0 h-5 w-5 text-green-500"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProposalSelection;
