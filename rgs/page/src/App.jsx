import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Search, Bell, Map as MapIcon, Filter } from 'lucide-react';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-120.7401); // Washington State center
  const [lat, setLat] = useState(47.7511);
  const [zoom, setZoom] = useState(6.5);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [lng, lat],
      zoom: zoom
    });

    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
  });

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <MapIcon size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Robot Geographical Society</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search campsites in WA..." 
              className="bg-gray-800 border border-gray-700 rounded-full py-2 pl-10 pr-4 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
            />
          </div>
          <button className="p-2 hover:bg-gray-800 rounded-full transition-colors relative">
            <Bell size={20} className="text-gray-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-gray-900"></span>
          </button>
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 border border-gray-700"></div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 border-r border-gray-800 bg-gray-900/95 backdrop-blur overflow-y-auto p-4 flex flex-col gap-6 z-10">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-400 uppercase text-xs tracking-wider">Filters</h2>
              <Filter size={16} className="text-gray-500" />
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Campsite Type</label>
                <select className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none">
                  <option>All Jurisdictions</option>
                  <option>National Parks</option>
                  <option>State Parks</option>
                  <option>National Forests</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Dates</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  <input type="date" className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>

              <div className="pt-2">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors text-sm shadow-md shadow-blue-900/20">
                  Update Availability
                </button>
              </div>
            </div>
          </section>

          <div className="h-px bg-gray-800"></div>

          <section>
            <h2 className="font-semibold text-gray-400 uppercase text-xs tracking-wider mb-4">Upcoming Reminders</h2>
            <div className="space-y-3">
              {[
                { name: 'Kalaloch', date: 'May 12-14', status: 'Pending' },
                { name: 'Mora', date: 'June 05-08', status: 'Book Next Month' }
              ].map((reminder, idx) => (
                <div key={idx} className="p-3 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm group-hover:text-blue-400 transition-colors">{reminder.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">{reminder.status}</span>
                  </div>
                  <div className="text-xs text-gray-500">{reminder.date}</div>
                </div>
              ))}
            </div>
          </section>
        </aside>

        {/* Map View */}
        <main className="flex-1 relative">
          <div ref={mapContainer} className="absolute inset-0" />
          
          {/* Map Controls Floating Overlay */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-2">
            <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-lg p-3 text-xs text-gray-400 shadow-2xl">
              <div className="mb-1 font-mono">LNG: {lng}</div>
              <div className="font-mono">LAT: {lat}</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
