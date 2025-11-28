import React, { useState, useEffect, useRef } from 'react';
import { X, Search, MapPin, Loader2, Check, MousePointerClick, Navigation } from 'lucide-react';
import L from 'leaflet'; 

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const GoogleMapModal = ({ isOpen, onClose, onSelect, darkMode }) => {
  // ✅ YOUR API KEY
  const API_KEY = "pk.3afdd6de186ee932339deec83a4c2882"; 

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const observerRef = useRef(null); // ✅ New Ref to track the observer
  const searchRequestId = useRef(0);

  const [selectedLocation, setSelectedLocation] = useState(null);

  // --- MAP INITIALIZATION ---
  useEffect(() => {
    if (!isOpen) return;

    // 1. Force Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // 2. Initialize Map
    const timer = setTimeout(() => {
      if (mapContainerRef.current && !mapInstanceRef.current) {
        
        const map = L.map(mapContainerRef.current, { 
            zoomControl: false,
            attributionControl: false 
        }).setView([14.5995, 120.9842], 12); 
        
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        L.tileLayer(`https://{s}-tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=${API_KEY}`, {
          maxZoom: 18
        }).addTo(map);

        mapInstanceRef.current = map;
        const marker = L.marker([14.5995, 120.9842]).addTo(map);
        markerRef.current = marker;

        // Click Logic
        map.on('click', async (e) => {
            const { lat, lng } = e.latlng;
            if (!mapInstanceRef.current) return; // Safety check

            marker.setLatLng([lat, lng]);
            
            try {
                const res = await fetch(`https://us1.locationiq.com/v1/reverse?key=${API_KEY}&lat=${lat}&lon=${lng}&format=json`);
                const data = await res.json();
                const name = data.display_name || "Pinned Location";
                
                setQuery(name);
                setSelectedLocation({ name, lat, lon: lng });
                marker.bindPopup(`<div style="font-family: sans-serif; font-size: 12px;">${name}</div>`).openPopup();
            } catch (err) {
                const coordsName = `Pinned (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
                setQuery(coordsName);
                setSelectedLocation({ name: coordsName, lat, lon: lng });
            }
        });

        // 3. SAFE RESIZE OBSERVER
        // We assign it to a ref so we can disconnect it in the cleanup function
        observerRef.current = new ResizeObserver(() => {
            // Only invalidate if map instance AND container still exist
            if (mapInstanceRef.current && mapInstanceRef.current._container) {
                mapInstanceRef.current.invalidateSize();
            }
        });
        observerRef.current.observe(mapContainerRef.current);
      }
    }, 100);

    // --- CLEANUP FUNCTION ---
    return () => {
      clearTimeout(timer);
      
      // A. Kill the observer first
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      // B. Kill the map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off(); // Remove all event listeners
        mapInstanceRef.current.remove(); // Destroy map
        mapInstanceRef.current = null;
        markerRef.current = null;
      }

      // C. Remove CSS
      if (document.head.contains(link)) document.head.removeChild(link);
    };
  }, [isOpen]);

  // --- RESET STATE ---
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSelectedLocation(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // --- SEARCH ---
  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (val.length > 2) {
      setIsSearching(true);
      const currentRequestId = searchRequestId.current + 1;
      searchRequestId.current = currentRequestId;

      const timeoutId = setTimeout(async () => {
        try {
          const response = await fetch(
            `https://api.locationiq.com/v1/autocomplete?key=${API_KEY}&q=${encodeURIComponent(val)}&limit=5&countrycodes=ph`
          );
          const data = await response.json();
          
          if (currentRequestId === searchRequestId.current) {
             setResults(Array.isArray(data) ? data : []);
             setIsSearching(false);
          }
        } catch (error) {
           if (currentRequestId === searchRequestId.current) setIsSearching(false);
        }
      }, 500); 

      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
      setIsSearching(false);
    }
  };

  const handleSelectResult = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    
    setResults([]); 
    setQuery(item.display_name); 
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lon], 16); 
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lon]);
        markerRef.current.bindPopup(item.display_name).openPopup();
      }
      mapInstanceRef.current.invalidateSize();
    }

    setSelectedLocation({ name: item.display_name, lat, lon });
  };

  const handleConfirm = () => {
    const finalLocation = selectedLocation 
        ? { id: 'custom', name: selectedLocation.name, type: 'custom', lat: selectedLocation.lat, lng: selectedLocation.lon }
        : { id: 'custom', name: query, type: 'custom', capacity: 'Unknown' };
    
    onSelect(finalLocation);
    onClose();
  };

  // --- THEME ---
  const theme = {
    overlay: darkMode ? 'bg-black/80' : 'bg-stone-900/20',
    bg: darkMode ? 'bg-[#18181b]' : 'bg-white',
    border: darkMode ? 'border-stone-800' : 'border-stone-200',
    heading: darkMode ? 'text-stone-100' : 'text-stone-900',
    text: darkMode ? 'text-stone-200' : 'text-stone-800',
    subText: darkMode ? 'text-stone-400' : 'text-stone-500',
    inputBg: darkMode ? 'bg-stone-900' : 'bg-white',
    inputBorder: darkMode ? 'border-stone-700' : 'border-stone-300', 
    shadow: darkMode ? 'shadow-none' : 'shadow-lg shadow-stone-200/50',
    hover: darkMode ? 'hover:bg-stone-800' : 'hover:bg-stone-100',
    pillBg: darkMode ? 'bg-stone-900/90 border-stone-700' : 'bg-white border-stone-200',
    pillText: darkMode ? 'text-stone-200' : 'text-stone-700',
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      
      {/* Backdrop */}
      <div className={`absolute inset-0 backdrop-blur-sm transition-opacity ${theme.overlay}`} onClick={onClose}></div>

      {/* Modal Container */}
      <div className={`relative w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden ${theme.bg} flex flex-col max-h-[85vh] animate-[fadeIn_0.3s_ease-out]`}>
        
        {/* HEADER */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${theme.border} bg-inherit z-30 h-16 flex-shrink-0`}>
            <div>
                <h3 className={`font-serif text-lg font-bold tracking-wide ${theme.heading}`}>Select Location</h3>
            </div>
            <button 
                onClick={onClose} 
                className={`p-2 rounded-full ${theme.hover} transition-colors text-stone-400 hover:text-stone-900 dark:hover:text-stone-100`}
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* CONTENT */}
        <div className="relative flex-1 w-full min-h-[400px] bg-stone-100 overflow-hidden">
            
            {/* FLOATING SEARCH BAR */}
            <div className="absolute top-4 left-4 right-4 z-[500] max-w-lg mx-auto">
                <div className={`
                    flex items-center h-12 rounded-lg px-4 
                    border ${theme.inputBorder} ${theme.inputBg} ${theme.shadow}
                    focus-within:ring-2 focus-within:ring-[#C9A25D]/50 focus-within:border-[#C9A25D]
                    transition-all
                `}>
                    <Search className="w-5 h-5 text-[#C9A25D] mr-3 flex-shrink-0" />
                    <input 
                        type="text"
                        placeholder="Search venue, street, or city..."
                        value={query}
                        onChange={handleSearch}
                        className={`w-full h-full bg-transparent outline-none text-sm font-medium ${theme.text} placeholder-stone-400`}
                    />
                    <div className="flex-shrink-0 w-6 flex justify-center">
                        {(isSearching) ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[#C9A25D]" />
                        ) : (query && (
                            <button onClick={() => { setQuery(''); setResults([]); }} className="text-stone-400 hover:text-stone-600">
                                <X className="w-4 h-4" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* RESULTS */}
                {results.length > 0 && (
                    <div className={`mt-2 rounded-lg overflow-hidden max-h-60 overflow-y-auto ${theme.bg} ${theme.shadow} border ${theme.border}`}>
                        {results.map((res, idx) => {
                             const name = res.display_name.split(',')[0];
                             const detail = res.display_name.substring(name.length + 2);
                             
                             return (
                                <button 
                                    key={idx} 
                                    onMouseDown={() => handleSelectResult(res)}
                                    className={`w-full text-left px-4 py-3 border-b ${theme.border} last:border-0 ${theme.hover} transition-colors flex items-center gap-3 group`}
                                >
                                    <div className="flex-shrink-0 mt-0.5 p-1.5 rounded-full bg-stone-100 dark:bg-stone-800 group-hover:bg-[#C9A25D] group-hover:text-white transition-colors text-stone-500">
                                        <Navigation className="w-3 h-3" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className={`text-sm font-semibold block truncate ${theme.text}`}>{name}</span>
                                        <span className={`text-[11px] block truncate ${theme.subText}`}>{detail}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MAP DIV (Strict sizing) */}
            <div className="absolute inset-0 w-full h-full">
                <div 
                    ref={mapContainerRef} 
                    className={`w-full h-full cursor-crosshair z-0 outline-none ${darkMode ? 'map-tiles-dark' : ''}`}
                />
            </div>
             
             {/* FLOATING HINT PILL */}
             <div className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[400] ${theme.pillBg} backdrop-blur-md px-4 py-2 rounded-full shadow-lg border pointer-events-none flex items-center gap-2 transition-colors`}>
                 <MousePointerClick className="w-4 h-4 text-[#C9A25D]" />
                 <span className={`text-xs font-medium ${theme.pillText}`}>Click map to pin exact spot</span>
             </div>

             <style>
                {`
                    .map-tiles-dark .leaflet-tile-pane {
                        filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
                    }
                    .leaflet-container { font-family: inherit; }
                `}
            </style>
        </div>

        {/* FOOTER */}
        <div className={`flex items-center justify-between px-6 py-4 border-t ${theme.border} bg-inherit z-30 h-20 flex-shrink-0`}>
            <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                    <MapPin className={`w-4 h-4 ${selectedLocation ? 'text-[#C9A25D]' : 'text-stone-400'}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${selectedLocation ? theme.text : 'text-stone-400'}`}>
                        {selectedLocation ? "Selected" : "No Location"}
                    </span>
                </div>
                <p className={`text-[10px] max-w-[200px] truncate ${theme.subText}`}>
                    {selectedLocation ? selectedLocation.name : "Search or pin on map"}
                </p>
            </div>
            
            <button 
                onClick={handleConfirm}
                disabled={!query}
                className={`
                    px-8 py-3 rounded-md text-xs uppercase font-bold tracking-widest transition-all duration-300 shadow-md flex items-center gap-2
                    ${!query 
                        ? 'bg-stone-200 text-stone-400 cursor-not-allowed dark:bg-stone-800 dark:text-stone-600' 
                        : 'bg-[#C9A25D] text-white hover:bg-[#b08d4b] hover:shadow-lg hover:-translate-y-0.5'
                    }
                `}
            >
                <Check className="w-4 h-4" />
                Confirm
            </button>
        </div>

      </div>
    </div>
  );
};

export default GoogleMapModal;