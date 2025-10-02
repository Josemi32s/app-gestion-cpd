import React, { useCallback, useEffect, useRef } from 'react';

interface NavItem {
  id: string;
  label: string;
  icon?: React.ReactNode; // SVG inline
}

interface MainNavProps {
  active: string;
  onChange: (id: string) => void;
  title?: string;
  sticky?: boolean;
}

// Componente de navegación accesible con soporte de teclado (flechas izquierda/derecha)
const DEFAULT_ITEMS: NavItem[] = [
  { id: 'turnos', label: 'Turnos', icon: <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4'><rect x='3' y='4' width='18' height='18' rx='2'/><line x1='16' y1='2' x2='16' y2='6'/><line x1='8' y1='2' x2='8' y2='6'/><line x1='3' y1='10' x2='21' y2='10'/></svg> },
  { id: 'usuarios', label: 'Usuarios', icon: <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4'><path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M22 21v-2a4 4 0 0 0-3-3.87'/><path d='M16 3.13a4 4 0 0 1 0 7.75'/></svg> },
  { id: 'festivos', label: 'Festivos', icon: <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4'><path d='m5 8 6 6'/><path d='M4 14V4h10'/><path d='M5 19h8'/><path d='M19 5v8'/><path d='M17 7h4'/></svg> },
  { id: 'reportes', label: 'Reportes', icon: <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4'><path d='M3 3v18h18'/><path d='M18 17V9'/><path d='M13 17V5'/><path d='M8 17v-3'/></svg> }
];

const MainNav: React.FC<MainNavProps> = ({ active, onChange, title = 'Gestión Operación CPD', sticky = true }) => {
  const items = DEFAULT_ITEMS;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const underlineRef = useRef<HTMLSpanElement | null>(null);
  const navWrapperRef = useRef<HTMLDivElement | null>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    const idx = items.findIndex(i => i.id === active);
    if (idx === -1) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (idx + 1) % items.length;
      onChange(items[next].id);
      buttonsRef.current[next]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (idx - 1 + items.length) % items.length;
      onChange(items[prev].id);
      buttonsRef.current[prev]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(items[0].id);
      buttonsRef.current[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(items[items.length - 1].id);
      buttonsRef.current[items.length - 1]?.focus();
    }
  }, [active, items, onChange]);

  // Auto scroll del elemento activo si está fuera de viewport horizontal del nav
  useEffect(() => {
    const idx = items.findIndex(i => i.id === active);
    const btn = buttonsRef.current[idx];
    if (btn && containerRef.current) {
      const c = containerRef.current;
      const rectBtn = btn.getBoundingClientRect();
      const rectC = c.getBoundingClientRect();
      if (rectBtn.left < rectC.left || rectBtn.right > rectC.right) {
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [active, items]);

  // Paleta oscura fija: removido toggle de tema

  // Posicionar subrayado animado
  const positionUnderline = () => {
    const idx = items.findIndex(i => i.id === active);
    const btn = buttonsRef.current[idx];
    if (btn && underlineRef.current && navWrapperRef.current) {
      const rect = btn.getBoundingClientRect();
      const containerRect = navWrapperRef.current.getBoundingClientRect();
      underlineRef.current.style.width = rect.width + 'px';
      underlineRef.current.style.transform = `translateX(${rect.left - containerRect.left}px)`;
    }
  };
  useEffect(() => { positionUnderline(); /* eslint-disable-next-line */ }, [active, items.length]);
  useEffect(() => {
    window.addEventListener('resize', positionUnderline);
    return () => window.removeEventListener('resize', positionUnderline);
  }, []);

  // toggle de tema eliminado (tema oscuro fijo)

  return (
  <header className={`${sticky ? 'sticky top-0 z-40' : ''} bg-[#1e293b]/95 border-b border-[#334155] shadow-sm backdrop-blur supports-[backdrop-filter]:backdrop-blur`}> 
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center gap-4">
          {/* Branding + Mobile toggle */}
          <div className="flex items-center gap-2 min-w-fit">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white text-sm font-semibold shadow-sm select-none">CPD</div>
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-slate-100 whitespace-nowrap hidden xs:block">{title}</h1>
            <button
              className="sm:hidden inline-flex items-center justify-center rounded-md p-2 text-slate-300 hover:bg-slate-700/60"
              onClick={() => setMobileOpen(o=>!o)}
              aria-label="Abrir menú"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg className='w-5 h-5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M18 6 6 18'/><path d='m6 6 12 12'/></svg>
              ) : (
                <svg className='w-5 h-5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><line x1='3' y1='6' x2='21' y2='6'/><line x1='3' y1='12' x2='21' y2='12'/><line x1='3' y1='18' x2='21' y2='18'/></svg>
              )}
            </button>
          </div>
          {/* Desktop nav */}
          <nav
            ref={containerRef}
            className="flex-1 overflow-x-auto no-scrollbar -ml-2 hidden sm:block"
            role="tablist"
            aria-label="Secciones principales"
            onKeyDown={handleKey}
          >
            <div ref={navWrapperRef} className="relative flex gap-1 sm:gap-2 px-2">
              <span ref={underlineRef} className="pointer-events-none absolute bottom-0 h-0.5 bg-blue-400 rounded-full transition-all duration-300 ease-out" />
              {items.map((item, i) => {
                const activeItem = active === item.id;
                return (
                  <button
                    key={item.id}
                    ref={(el) => { buttonsRef.current[i] = el; }}
                    role="tab"
                    aria-selected={activeItem}
                    aria-controls={`panel-${item.id}`}
                    tabIndex={activeItem ? 0 : -1}
                    onClick={() => { onChange(item.id); setMobileOpen(false); }}
                    className={`group relative inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs sm:text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 
                      ${activeItem
                        ? 'text-blue-300'
                        : 'text-slate-300 hover:text-slate-100 hover:bg-slate-700/50'}
                    `}
                  >
                    {item.icon && <span className="w-4 h-4 flex items-center justify-center text-current">{item.icon}</span>}
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
          {/* Acciones derechas */}
            {/* Eliminado badge 'Operación' a petición */}
        </div>
        {/* Breadcrumbs */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 pb-2 pl-1">
          <span className="cursor-pointer hover:text-slate-200" onClick={()=>onChange('turnos')}>Inicio</span>
          <svg className='w-3 h-3' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='m9 18 6-6-6-6'/></svg>
          <span className='capitalize text-slate-300'>{items.find(i=>i.id===active)?.label}</span>
        </div>
      </div>
      {/* Mobile menu */}
      {mobileOpen && (
  <div className="sm:hidden border-t border-[#334155] bg-[#1e293b]/95 px-4 pb-4 animate-fadeIn">
          <div ref={navWrapperRef} className="relative flex flex-col gap-1 pt-2">
            <span ref={underlineRef} className="pointer-events-none absolute bottom-0 h-0.5 bg-blue-600 rounded-full transition-all duration-300 ease-out hidden" />
            {items.map((item, i) => {
              const activeItem = active === item.id;
              return (
                <button
                  key={item.id}
                  ref={(el) => { buttonsRef.current[i] = el; }}
                  role="tab"
                  aria-selected={activeItem}
                  aria-controls={`panel-${item.id}`}
                  tabIndex={activeItem ? 0 : -1}
                  onClick={() => { onChange(item.id); setMobileOpen(false); }}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition text-left 
                    ${activeItem ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-700/60'}`}
                >
                  {item.icon && <span className="w-4 h-4 flex items-center justify-center text-current">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <style>{`
        .no-scrollbar::-webkit-scrollbar{display:none}
        .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        .animate-fadeIn{animation:fadeIn .18s ease-out}
      `}</style>
    </header>
  );
};

export default MainNav;
