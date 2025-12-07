import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { 
  LayoutGrid, Calendar, Users, 
  Package, BookOpen, FileText, 
  MenuSquareIcon, ChartAreaIcon, 
  ChevronLeft, ChevronRight
} from 'lucide-react';

const Sidebar = ({ sidebarOpen, setSidebarOpen, theme }) => {
  const navigate = useNavigate(); 
  const location = useLocation(); 
  
  // Toggle Function that saves to LocalStorage
  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarState', newState); 
  };

  // Navigation Map
  const menuGroups = [
    {
      label: "Management",
      items: [
        { id: 'Overview', icon: LayoutGrid, label: 'Dashboard', path: '/dashboard' },
        { id: 'Bookings', icon: BookOpen, label: 'Booking Details', path: '/bookings' },
        { id: 'Calendar', icon: Calendar, label: 'Events Calendar', path: '/events' },
        { id: 'Clients', icon: Users, label: 'Client Records', path: '/clients' },
        { id: 'Transactions', icon: FileText, label: 'Transaction Records', path: '/transactions' },
      ]
    },
    {
      label: "Operations",
      items: [
        { id: 'Packages', icon: MenuSquareIcon, label: 'Packages', path: '/package' },
        { id: 'Inventory', icon: Package, label: 'Inventory', path: '/inventory' },
      ]
    },
    {
      label: "Analytics",
      items: [
        { id: 'Finance', icon: ChartAreaIcon, label: 'Finance', path: '/finance' },
      ]
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} flex-shrink-0 flex flex-col border-r ${theme.border} ${theme.sidebarBg} transition-all duration-500 z-30 relative`}>
      
      {/* Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className={`absolute -right-3 top-10 w-6 h-6 rounded-full border ${theme.border} ${theme.cardBg} flex items-center justify-center z-50 hover:text-[#C9A25D] transition-colors shadow-sm`}
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>

      {/* Logo */}
      <div className={`h-24 flex items-center ${sidebarOpen ? 'px-8' : 'justify-center'}`}>
        {sidebarOpen ? (
          <div onClick={() => navigate('/')} className="cursor-pointer">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#C9A25D] font-bold block mb-1">Admin</span>
            <h1 className="text-3xl font-serif tracking-wide uppercase">Mapo's</h1>
          </div>
        ) : (
          <h1 className="text-2xl font-serif text-[#C9A25D] cursor-pointer" onClick={() => navigate('/')}>M</h1>
        )}
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-8 space-y-8 no-scrollbar">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="px-4">
            {sidebarOpen && (
              <h3 className={`px-4 mb-4 text-[10px] uppercase tracking-[0.2em] font-medium ${theme.subText}`}>
                {group.label}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.path);
                // Check if label is long (like Transaction Records) to adjust styling
                const isLongLabel = item.label.length > 18; 

                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    title={!sidebarOpen ? item.label : ''}
                    className={`
                      w-full flex items-center gap-4 px-4 py-3 rounded-md transition-all duration-300 group
                      ${active ? `bg-[#C9A25D]/10 text-[#C9A25D]` : `${theme.text} ${theme.hoverBg}`}
                      ${!sidebarOpen ? 'justify-center' : ''}
                    `}
                  >
                    <item.icon strokeWidth={1.5} size={20} className={active ? 'text-[#C9A25D] flex-shrink-0' : 'text-stone-400 group-hover:text-[#C9A25D] flex-shrink-0'} />
                    
                    {sidebarOpen && (
                      <span className={`
                        uppercase font-medium whitespace-nowrap transition-all duration-200
                        ${/* Logic: If active AND long text, shrink font size and tracking slightly */
                          active && isLongLabel 
                            ? 'text-[10px] tracking-wider' 
                            : 'text-xs tracking-widest'
                        }
                      `}>
                        {item.label}
                      </span>
                    )}
                    
                    {sidebarOpen && active && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C9A25D] flex-shrink-0"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Profile */}
      <div className={`p-6 border-t ${theme.border}`}>
        <div className={`flex items-center gap-3 w-full ${!sidebarOpen ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-200 grayscale hover:grayscale-0 transition-all cursor-pointer flex-shrink-0">
             <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Admin" className="w-full h-full object-cover" />
          </div>
          {sidebarOpen && (
            <div className="text-left overflow-hidden">
              <p className="text-sm font-medium truncate">Chef Mavirick Exconde</p>
              <p className={`text-[10px] uppercase tracking-wider ${theme.subText}`}>Mapo's Owner </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;