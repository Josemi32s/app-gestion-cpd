// src/components/UserList.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useUsuarios } from "../../hooks/useUsuarios";
import UserForm from "./UserForm";
import UserActions from "./UserActions";
import toast, { Toaster } from "react-hot-toast";
import Modal from "../ui/Modal";
import { updateUsuario } from "../../services/api";

const UserList = () => {
  const {
    usuarios: allUsuarios,
    roles,
    loading,
    error,
    refetch,
  } = useUsuarios();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"activos" | "inactivos">("activos");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<number | "all">("all");
  const [onlyBirthdaySoon, setOnlyBirthdaySoon] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Fecha de referencia (hoy) para cálculos relativos
  const hoy = useMemo(() => new Date(), []);

  // --- Utilidades de cálculo de métricas ---
  const diffEnDias = (a: Date, b: Date) => {
    return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysUntilNextBirthday = (dateString: string | null) => {
    if (!dateString) return Infinity;
    const base = new Date(dateString);
    const month = base.getMonth();
    const day = base.getDate();
    // Próximo cumpleaños en el año actual o siguiente
    const thisYear = new Date(hoy.getFullYear(), month, day);
    const nextYear = new Date(hoy.getFullYear() + 1, month, day);
    const target = thisYear >= hoy ? thisYear : nextYear;
    return diffEnDias(target, hoy);
  };

  // Filtrado compuesto (estado -> rol -> búsqueda)
  const usuariosFiltrados = allUsuarios.filter((user) => {
    if (activeTab === "activos" && user.estado !== "activo") return false;
    if (activeTab === "inactivos" && user.estado !== "inactivo") return false;
    if (roleFilter !== "all" && user.rol_id !== roleFilter) return false;
    if (onlyBirthdaySoon && !(user.cumple_anios && daysUntilNextBirthday(user.cumple_anios) <= 30)) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const texto = `${user.nombres} ${user.apellidos} ${user.usuario}`.toLowerCase();
      if (!texto.includes(q)) return false;
    }
    return true;
  });

  // Métricas rápidas
  const totalActivos = useMemo(
    () => allUsuarios.filter((u) => u.estado === "activo").length,
    [allUsuarios]
  );
  const totalInactivos = useMemo(
    () => allUsuarios.filter((u) => u.estado === "inactivo").length,
    [allUsuarios]
  );
  const proximosCumples = useMemo(
    () =>
      allUsuarios.filter(
        (u) => u.estado === "activo" && daysUntilNextBirthday(u.cumple_anios) <= 30
      ),
    [allUsuarios]
  );
  const ingresosRecientes = useMemo(
    () =>
      allUsuarios.filter((u) => {
        if (!u.fecha_ingreso) return false;
        const fi = new Date(u.fecha_ingreso);
        const dias = diffEnDias(hoy, fi);
        return dias >= 0 && dias <= 30;
      }),
    [allUsuarios, hoy]
  );

  const handleUserCreatedOrUpdated = () => {
    refetch();
  };

  // Función para activar usuario
  const handleActivarUsuario = async (usuarioId: number) => {
    try {
      await updateUsuario(usuarioId, { estado: "activo" });
      toast.success("Usuario activado correctamente");
      refetch();
    } catch (err: any) {
      toast.error(
        "❌ Error al activar usuario: " +
          (err.response?.data?.detail || err.message)
      );
    }
  };

  // Mapeo de grupos (manteniendo tu lógica)
  const mapearGrupo = (nombreRol: string): string => {
    const normalizado = nombreRol.toLowerCase().trim();
    if (normalizado.includes("jefe")) return "Jefes de Turno";
    if (normalizado.includes("operador")) return "Operador";
    if (normalizado.includes("emc")) return "EMC";
    return "Otros";
  };

  const gruposOrdenados = ["Jefes de Turno", "Operador", "EMC"];

  const usuariosAgrupados = () => {
    const grupos: Record<string, any[]> = {};
    gruposOrdenados.forEach((grupo) => (grupos[grupo] = []));
    grupos["Otros"] = [];

    usuariosFiltrados.forEach((usuario) => {
      const nombreRol =
        roles.find((r) => r.id === usuario.rol_id)?.nombre || "Desconocido";
      const grupo = mapearGrupo(nombreRol);
      grupos[grupo].push(usuario);
    });

    return grupos;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  };

  const grupos = usuariosAgrupados();
  // Ordenación
  type SortKey = 'nombre' | 'telefono' | 'cumple' | 'ingreso' | 'salida' | 'estado';
  const [sortKey, setSortKey] = useState<SortKey>('nombre');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const SORT_STORAGE_KEY = 'userlist.sort';
  const FILTERS_STORAGE_KEY = 'userlist.filters';
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SORT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.key) setSortKey(parsed.key);
        if (parsed.dir) setSortDir(parsed.dir);
      }
    } catch {/* ignore */}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify({ key: sortKey, dir: sortDir })); } catch {}
  }, [sortKey, sortDir]);
  // Cargar filtros
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.activeTab) setActiveTab(p.activeTab);
        if (p.roleFilter !== undefined) setRoleFilter(p.roleFilter);
        if (p.search) setSearch(p.search);
        if (p.onlyBirthdaySoon) setOnlyBirthdaySoon(true);
      }
    } catch {/* ignore */}
  }, []);
  // Guardar filtros
  useEffect(() => {
    try { localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify({ activeTab, roleFilter, search, onlyBirthdaySoon })); } catch {}
  }, [activeTab, roleFilter, search, onlyBirthdaySoon]);
  const toggleSort = (key: SortKey) => {
    setSortKey(prev => {
      if (prev === key) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return prev; }
      setSortDir('asc');
      return key;
    });
  };
  const comparator = (a:any,b:any) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    const nombre = (u:any)=>`${u.nombres||''} ${u.apellidos||''}`.toLowerCase();
    const fecha = (f:string|null)=> f? new Date(f).getTime():0;
    switch (sortKey){
      case 'nombre': return nombre(a).localeCompare(nombre(b))*dir;
      case 'telefono': return ((a.telefono||'').localeCompare(b.telefono||''))*dir;
      case 'cumple': return (fecha(a.cumple_anios)-fecha(b.cumple_anios))*dir;
      case 'ingreso': return (fecha(a.fecha_ingreso)-fecha(b.fecha_ingreso))*dir;
      case 'salida': return (fecha(a.fecha_salida)-fecha(b.fecha_salida))*dir;
      case 'estado': return ((a.estado||'').localeCompare(b.estado||''))*dir;
      default: return 0;
    }
  };
  const gruposOrdenadosDatos = useMemo(()=>{
    const copia:Record<string,any[]> = {}; Object.keys(grupos).forEach(g=>{copia[g]=[...grupos[g]].sort(comparator);}); return copia;
  },[grupos,sortKey,sortDir]);
  const sortIndicator = (key:SortKey)=>{
    const active = sortKey===key;
    const asc = sortDir==='asc';
    return (
      <span className={`ml-1 inline-block w-3 h-3 ${active? 'opacity-90':'opacity-0 group-hover:opacity-40'} transition-opacity`}>
        <svg viewBox="0 0 20 20" fill="currentColor" className={`text-slate-500 ${active && !asc ? 'rotate-180': ''}`}><path d="M10 5l6 8H4l6-8z"/></svg>
      </span>
    );
  };
  // Tooltip fecha larga (preparado para futura ordenación completa)
  const longDate = (dateString: string | null) => {
    if (!dateString) return '';
    try { return new Date(dateString).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'}); } catch { return dateString; }
  };


  const toggleGroup = (grupo: string) => {
    setCollapsedGroups(prev => ({ ...prev, [grupo]: !prev[grupo] }));
  };

  const upcomingSoon = (dateString: string | null) => dateString && daysUntilNextBirthday(dateString) <= 7;

  // Helpers visuales para avatar e iniciales
  const avatarColorClasses = (rolId:number) => {
    switch (rolId) {
      case 1: return 'bg-blue-100 text-blue-700 border-blue-200';
      case 2: return 'bg-amber-100 text-amber-700 border-amber-200';
      case 3: return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };
  const initials = (n?:string, a?:string) => {
    const ni = (n||'').trim().charAt(0);
    const ai = (a||'').trim().charAt(0);
    const combo = (ni+ai).toUpperCase();
    return combo || '?';
  };

  return (
    <div className="w-full">
      <Toaster />
      <div className="flex flex-col gap-4 mb-4">
        {/* Toolbar Sticky */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200 pt-3 pb-3 px-1 rounded-md">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Gestión de Usuarios</h1>
              <p className="text-xs text-slate-500 mt-0.5">Administración de personal operativo</p>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === "activos" && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded-md text-xs shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 4v12M4 10h12"/></svg>
                  Nuevo
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-white border border-blue-100">
              <p className="text-[10px] uppercase font-semibold text-blue-600 tracking-wide">Activos</p>
              <p className="text-lg font-semibold text-blue-800 leading-none mt-1">{totalActivos}</p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-slate-50 to-white border border-slate-200">
              <p className="text-[10px] uppercase font-semibold text-slate-600 tracking-wide">Inactivos</p>
              <p className="text-lg font-semibold text-slate-700 leading-none mt-1">{totalInactivos}</p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-white border border-amber-200">
              <p className="text-[10px] uppercase font-semibold text-amber-600 tracking-wide">Próx. Cumple (30d)</p>
              <p className="text-lg font-semibold text-amber-700 leading-none mt-1">{proximosCumples.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-white border border-emerald-200">
              <p className="text-[10px] uppercase font-semibold text-emerald-600 tracking-wide">Ingresos 30d</p>
              <p className="text-lg font-semibold text-emerald-700 leading-none mt-1">{ingresosRecientes.length}</p>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-end">
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-md w-fit shadow-inner">
              <button
                onClick={() => setActiveTab("activos")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  activeTab === "activos"
                    ? "bg-white text-blue-700 shadow"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                Activos ({totalActivos})
              </button>
              <button
                onClick={() => setActiveTab("inactivos")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  activeTab === "inactivos"
                    ? "bg-white text-blue-700 shadow"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                Inactivos ({totalInactivos})
              </button>
            </div>
            <div className="flex-1 flex gap-3">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar nombre o usuario..."
                  className="w-full text-sm rounded-md border border-slate-300 bg-white pl-6 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    aria-label="Limpiar búsqueda"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) =>
                    setRoleFilter(
                      e.target.value === "all" ? "all" : parseInt(e.target.value)
                    )
                  }
                  className="text-sm rounded-md border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los roles</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setOnlyBirthdaySoon(v=>!v)}
                  className={`px-3 py-2 rounded-md text-xs font-medium border transition ${onlyBirthdaySoon ? 'bg-pink-600 border-pink-600 text-white shadow':'border-pink-300 text-pink-600 hover:bg-pink-50'}`}
                  aria-pressed={onlyBirthdaySoon}
                >
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18"/><path d="M12 3v9"/><path d="M8 21h8"/><path d="M7 12c-1.5-3 .5-5 2-5 1.2 0 2 .8 2 2"/><path d="M17 12c1.5-3-.5-5-2-5-1.2 0-2 .8-2 2"/></svg>
                    30d {onlyBirthdaySoon && <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 10l3 3 7-7"/></svg>}
                  </span>
                </button>
              </div>
              {(search || roleFilter !== "all" || onlyBirthdaySoon) && (
                <button
                  onClick={() => { setSearch(""); setRoleFilter("all"); setOnlyBirthdaySoon(false); }}
                  className="text-xs underline text-slate-500 hover:text-slate-700 self-center"
                >
                  Reset filtros
                </button>
              )}
            </div>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 flex justify-between">
            <span>Mostrando {usuariosFiltrados.length} de {allUsuarios.length} usuarios</span>
            {onlyBirthdaySoon && <span className="text-pink-600">Filtrando próximos cumpleaños (≤30d)</span>}
          </div>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {loading ? (
        <div className="bg-white shadow rounded-lg p-4">
          <div className="space-y-2 animate-pulse">
            {Array.from({length:8}).map((_,i)=>(
              <div key={i} className="h-6 bg-slate-100 rounded" />
            ))}
          </div>
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <div className="bg-white border border-dashed rounded-lg p-8 text-center text-sm text-gray-500">
          No hay usuarios que coincidan con los filtros.
        </div>
      ) : (
  <div className="bg-gradient-to-br from-slate-50 via-white to-white shadow-sm rounded-xl overflow-hidden ring-1 ring-slate-200/60">
          <div className="w-full overflow-x-hidden hidden sm:block">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-100 to-slate-50/70 backdrop-blur sticky top-0 z-20">
                <tr className="text-[10px] uppercase tracking-wide text-slate-600 group">
                  <th aria-sort={sortKey==='nombre'? (sortDir==='asc'?'ascending':'descending'):'none'} onClick={()=>toggleSort('nombre')} className="px-3 py-2 text-left font-semibold cursor-pointer select-none whitespace-nowrap">Usuario {sortIndicator('nombre')}</th>
                  <th aria-sort={sortKey==='telefono'? (sortDir==='asc'?'ascending':'descending'):'none'} onClick={()=>toggleSort('telefono')} className="px-3 py-2 text-left font-semibold cursor-pointer select-none">Teléfono {sortIndicator('telefono')}</th>
                  <th aria-sort={sortKey==='cumple'? (sortDir==='asc'?'ascending':'descending'):'none'} onClick={()=>toggleSort('cumple')} className="px-3 py-2 text-left font-semibold cursor-pointer select-none">Cumple {sortIndicator('cumple')}</th>
                  <th aria-sort={sortKey==='ingreso'? (sortDir==='asc'?'ascending':'descending'):'none'} onClick={()=>toggleSort('ingreso')} className="px-3 py-2 text-left font-semibold cursor-pointer select-none">Ingreso {sortIndicator('ingreso')}</th>
                  <th aria-sort={sortKey==='salida'? (sortDir==='asc'?'ascending':'descending'):'none'} onClick={()=>toggleSort('salida')} className="px-3 py-2 text-left font-semibold cursor-pointer select-none">Salida {sortIndicator('salida')}</th>
                  <th aria-sort={sortKey==='estado'? (sortDir==='asc'?'ascending':'descending'):'none'} onClick={()=>toggleSort('estado')} className="px-3 py-2 text-left font-semibold cursor-pointer select-none">Estado {sortIndicator('estado')}</th>
                  <th className="px-3 py-2 text-left font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {gruposOrdenados.map((grupo) => {
                  const usuariosDelGrupo = gruposOrdenadosDatos[grupo] || [];
                  if (usuariosDelGrupo.length === 0) return null;

                  return (
                    <React.Fragment key={grupo}>
                      <tr className="hover:bg-slate-50">
                        <td colSpan={8} className="bg-white cursor-pointer" onClick={()=>toggleGroup(grupo)}>
                          <div className="flex items-center gap-2 mt-6 mb-1 pl-1 select-none">
                            <span className="text-[10px] text-slate-400 w-4 flex justify-center">
                              {collapsedGroups[grupo] ? (
                                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 5l6 5-6 5"/></svg>
                              ) : (
                                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8l5 6 5-6"/></svg>
                              )}
                            </span>
                            <div className={`h-4 w-1.5 rounded-full ${
                              grupo === 'Jefes de Turno' ? 'bg-blue-500' :
                              grupo === 'Operador' ? 'bg-amber-500' :
                              grupo === 'EMC' ? 'bg-purple-500' : 'bg-slate-400'
                            }`}></div>
                            <h3 className="text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
                              {grupo} <span className="text-slate-400 font-normal">({usuariosDelGrupo.length})</span>
                            </h3>
                          </div>
                        </td>
                      </tr>
                      {!collapsedGroups[grupo] && usuariosDelGrupo.map((user, idx) => (
                        <tr key={user.id} className={`group transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} ${upcomingSoon(user.cumple_anios)?'ring-1 ring-pink-200':''}`}> 
                          {/* Usuario (Nombre + login + badges rol) */}
                          <td className={`px-3 py-2 align-top whitespace-nowrap`}>
                            <div className="flex items-start gap-3">
                              <div className={`h-9 w-9 rounded-full border flex items-center justify-center text-[11px] font-semibold tracking-wide shadow-sm ${avatarColorClasses(user.rol_id)}`}>
                                {initials(user.nombres, user.apellidos)}
                              </div>
                              <div className="flex flex-col leading-tight -mt-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[13px] md:text-[14px] font-semibold text-slate-800">
                                    {user.nombres} {user.apellidos}
                                  </span>
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-600 tracking-wide">@{user.usuario}</span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ring-1 ring-inset ${
                                    user.rol_id === 1 ? 'bg-blue-50 text-blue-700 ring-blue-200' :
                                    user.rol_id === 2 ? 'bg-amber-50 text-amber-700 ring-amber-200' :
                                    user.rol_id === 3 ? 'bg-purple-50 text-purple-700 ring-purple-200' : 'bg-slate-50 text-slate-600 ring-slate-200'
                                  }`}>
                                    {roles.find(r => r.id === user.rol_id)?.nombre || 'Rol'}
                                  </span>
                                  {user.cumple_anios && daysUntilNextBirthday(user.cumple_anios) <= 30 && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-pink-50 text-pink-600 ring-1 ring-pink-200 flex items-center gap-1">
                                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18"/><path d="M12 3v9"/><path d="M8 21h8"/><path d="M7 12c-1.5-3 .5-5 2-5 1.2 0 2 .8 2 2"/><path d="M17 12c1.5-3-.5-5-2-5-1.2 0-2 .8-2 2"/></svg>
                                      <span>{daysUntilNextBirthday(user.cumple_anios)}d</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          {/* Rol separado eliminado (ya mostrado como badge) */}
                          <td className={`px-3 py-2 align-top text-[11px] text-slate-600`}>
                            {user.telefono || '-'}
                          </td>
                          <td className={`px-3 py-2 align-top text-[11px] text-slate-600`} title={longDate(user.cumple_anios)}>{formatDate(user.cumple_anios)}</td>
                          <td className={`px-3 py-2 align-top text-[11px] text-slate-600`} title={longDate(user.fecha_ingreso)}>{formatDate(user.fecha_ingreso)}</td>
                          <td className={`px-3 py-2 align-top text-[11px] text-slate-600`} title={longDate(user.fecha_salida)}>{formatDate(user.fecha_salida)}</td>
                          <td className={`px-3 py-2 align-top`}>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 ring-inset ${
                              user.estado === 'activo'
                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                : 'bg-rose-50 text-rose-700 ring-rose-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${user.estado === 'activo' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                              {user.estado === 'activo' ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className={`px-3 py-2 align-top`}>
                            {activeTab === 'activos' ? (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                <UserActions
                                  usuario={user}
                                  roles={roles}
                                  onUserUpdated={handleUserCreatedOrUpdated}
                                />
                              </div>
                            ) : (
                              <button
                                onClick={() => handleActivarUsuario(user.id)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-600 text-white text-[10px] rounded hover:bg-emerald-700 transition focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 10l3 3 7-7"/></svg>
                                Activar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}

                {grupos["Otros"].length > 0 && (
                  <>
                    <tr className="hover:bg-slate-50">
                      <td colSpan={8} className="bg-white cursor-pointer" onClick={()=>toggleGroup('Otros')}>
                        <div className="flex items-center gap-2 mt-6 mb-1 pl-1 select-none">
                          <span className="text-[10px] text-slate-400 w-4 flex justify-center">
                            {collapsedGroups['Otros'] ? (
                              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 5l6 5-6 5"/></svg>
                            ) : (
                              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8l5 6 5-6"/></svg>
                            )}
                          </span>
                          <div className="h-4 w-1.5 rounded-full bg-slate-400"></div>
                          <h3 className="text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
                            Otros <span className="text-slate-400 font-normal">({grupos["Otros"].length})</span>
                          </h3>
                        </div>
                      </td>
                    </tr>
                    {!collapsedGroups['Otros'] && grupos["Otros"].map((user) => (
                        <tr key={user.id} className={`group transition ${upcomingSoon(user.cumple_anios)?'bg-pink-50/50':'hover:bg-slate-50'}`}>
                        <td className="px-3 py-2 align-top whitespace-nowrap">
                          <div className="flex items-start gap-3">
                            <div className={`h-9 w-9 rounded-full border flex items-center justify-center text-[11px] font-semibold tracking-wide shadow-sm bg-slate-100 text-slate-600 border-slate-200`}>
                              {initials(user.nombres, user.apellidos)}
                            </div>
                            <div className="flex flex-col leading-tight -mt-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[13px] md:text-[14px] font-semibold text-slate-800">
                                  {user.nombres} {user.apellidos}
                                </span>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-600 tracking-wide">@{user.usuario}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ring-1 ring-inset bg-slate-50 text-slate-600 ring-slate-200`}>
                                  {roles.find(r => r.id === user.rol_id)?.nombre || 'Rol'}
                                </span>
                                {user.cumple_anios && daysUntilNextBirthday(user.cumple_anios) <= 30 && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-pink-50 text-pink-600 ring-1 ring-pink-200 flex items-center gap-1">
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18"/><path d="M12 3v9"/><path d="M8 21h8"/><path d="M7 12c-1.5-3 .5-5 2-5 1.2 0 2 .8 2 2"/><path d="M17 12c1.5-3-.5-5-2-5-1.2 0-2 .8-2 2"/></svg>
                                    {daysUntilNextBirthday(user.cumple_anios)}d
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top text-[11px] text-slate-600">{user.telefono || '-'}</td>
                        <td className="px-3 py-2 align-top text-[11px] text-slate-600" title={longDate(user.cumple_anios)}>{formatDate(user.cumple_anios)}</td>
                        <td className="px-3 py-2 align-top text-[11px] text-slate-600" title={longDate(user.fecha_ingreso)}>{formatDate(user.fecha_ingreso)}</td>
                        <td className="px-3 py-2 align-top text-[11px] text-slate-600" title={longDate(user.fecha_salida)}>{formatDate(user.fecha_salida)}</td>
                        <td className="px-3 py-2 align-top">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 ring-inset ${
                            user.estado === 'activo'
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                              : 'bg-rose-50 text-rose-700 ring-rose-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.estado === 'activo' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            {user.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-top">
                          {activeTab === 'activos' ? (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                              <UserActions
                                usuario={user}
                                roles={roles}
                                onUserUpdated={handleUserCreatedOrUpdated}
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => handleActivarUsuario(user.id)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-600 text-white text-[10px] rounded hover:bg-emerald-700 transition focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 10l3 3 7-7"/></svg>
                              Activar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
          {/* Vista móvil tipo cards */}
          <div className="sm:hidden p-3 space-y-4 bg-gradient-to-b from-white via-slate-50 to-white">
            {gruposOrdenados.map(grupo => {
              const usuariosDelGrupo = gruposOrdenadosDatos[grupo] || [];
              if (!usuariosDelGrupo.length) return null;
              return (
                <div key={grupo}>
                  <div className="flex items-center gap-2 mb-2 pl-1">
                    <div className={`h-4 w-1.5 rounded-full ${
                      grupo==='Jefes de Turno'? 'bg-blue-500': grupo==='Operador'? 'bg-amber-500': grupo==='EMC'? 'bg-purple-500':'bg-slate-400'
                    }`}></div>
                    <h3 className="text-[11px] font-semibold tracking-wide text-slate-600 uppercase">{grupo} <span className="text-slate-400 font-normal">({usuariosDelGrupo.length})</span></h3>
                  </div>
                  <div className="grid gap-3">
                    {usuariosDelGrupo.map(user => (
                      <div key={user.id} className="rounded-lg border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-white p-3 shadow flex flex-col gap-2">
                        <div className="flex items-start gap-3">
                          <div className={`h-10 w-10 rounded-full border flex items-center justify-center text-[12px] font-semibold tracking-wide shadow ${avatarColorClasses(user.rol_id)}`}>
                            {initials(user.nombres, user.apellidos)}
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-0.5">
                              <span className="text-[14px] font-semibold text-slate-800">{user.nombres} {user.apellidos}</span>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-600 tracking-wide">@{user.usuario}</span>
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ring-1 ring-inset ${user.rol_id===1?'bg-blue-50 text-blue-700 ring-blue-200':user.rol_id===2?'bg-amber-50 text-amber-700 ring-amber-200':user.rol_id===3?'bg-purple-50 text-purple-700 ring-purple-200':'bg-slate-50 text-slate-600 ring-slate-200'}`}>{roles.find(r=>r.id===user.rol_id)?.nombre || 'Rol'}</span>
                              {user.cumple_anios && daysUntilNextBirthday(user.cumple_anios)<=30 && (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-pink-50 text-pink-600 ring-1 ring-pink-200 inline-flex items-center gap-1">
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18"/><path d="M12 3v9"/><path d="M8 21h8"/><path d="M7 12c-1.5-3 .5-5 2-5 1.2 0 2 .8 2 2"/><path d="M17 12c1.5-3-.5-5-2-5-1.2 0-2 .8-2 2"/></svg>
                                  {daysUntilNextBirthday(user.cumple_anios)}d
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600 mb-1">
                              <div><span className="font-medium text-slate-500">Tel:</span> {user.telefono || '-'}</div>
                              <div title={longDate(user.cumple_anios)}><span className="font-medium text-slate-500">Cumple:</span> {formatDate(user.cumple_anios)||'-'}</div>
                              <div title={longDate(user.fecha_ingreso)}><span className="font-medium text-slate-500">Ingreso:</span> {formatDate(user.fecha_ingreso)||'-'}</div>
                              <div title={longDate(user.fecha_salida)}><span className="font-medium text-slate-500">Salida:</span> {formatDate(user.fecha_salida)||'-'}</div>
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 ring-inset ${user.estado==='activo'?'bg-emerald-50 text-emerald-700 ring-emerald-200':'bg-rose-50 text-rose-700 ring-rose-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.estado==='activo'?'bg-emerald-500':'bg-rose-500'}`}></span>
                            {user.estado==='activo'?'Activo':'Inactivo'}
                          </span>
                        </div>
                        <div>
                          {activeTab==='activos' ? (
                            <UserActions usuario={user} roles={roles} onUserUpdated={handleUserCreatedOrUpdated} />
                          ) : (
                            <button onClick={()=>handleActivarUsuario(user.id)} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white text-[11px] rounded hover:bg-emerald-700 transition w-full justify-center">
                              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 10l3 3 7-7"/></svg>
                              Activar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Modal Crear Usuario */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Crear Nuevo Usuario"
      >
        <UserForm
          roles={roles}
          onUserCreated={() => {
            setShowCreateForm(false);
            handleUserCreatedOrUpdated();
            toast.success("Usuario creado correctamente");
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      </Modal>
    </div>
  );
};

export default UserList;
