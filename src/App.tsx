import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Terminal as TerminalIcon, 
  Copy, 
  FileText, 
  Settings, 
  Sparkles, 
  ExternalLink, 
  TrendingUp, 
  Layers, 
  Info,
  Check,
  Send,
  RefreshCw,
  Eye,
  UserCheck,
  Share2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Extend global window interface for GA4 dataLayer and gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: "info" | "success" | "warn" | "event";
  message: string;
  params?: any;
}

export default function App() {
  // GA4 Configuration State
  const [measurementId, setMeasurementId] = useState<string>(() => {
    return localStorage.getItem("ga_measurement_id") || (import.meta as any).env?.VITE_GA_MEASUREMENT_ID || "";
  });
  const [isGAConnected, setIsGAConnected] = useState<boolean>(false);
  const [isCopyingId, setIsCopyingId] = useState<boolean>(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formCategory, setFormCategory] = useState("conversion");
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Live Event Logger State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  // Helper: Get formatted current time
  const getFormattedTime = () => {
    const now = new Date();
    return now.toTimeString().split(" ")[0];
  };

  // Helper: Add a new log entry
  const addLog = (type: "info" | "success" | "warn" | "event", message: string, params?: any) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: getFormattedTime(),
      type,
      message,
      params,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // Setup / Load GA4 script dynamically
  const connectGA4 = (id: string) => {
    if (!id || !id.trim().startsWith("G-")) {
      addLog("warn", "ID de Medición inválido. Debe comenzar con 'G-' (ej. G-XXXXXXXXXX)");
      setIsGAConnected(false);
      return;
    }

    try {
      const cleanId = id.trim();
      
      // Clean existing scripts if any
      const existingScript = document.getElementById("ga4-script-tag");
      if (existingScript) existingScript.remove();
      const existingGtag = document.getElementById("ga4-gtag-init");
      if (existingGtag) existingGtag.remove();

      // Setup dataLayer
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };

      // Initialize analytics
      window.gtag("js", new Date());
      window.gtag("config", cleanId, {
        send_page_view: true,
        debug_mode: true // Force DebugView in GA4 console
      });

      // Inject GA4 external library script tag
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${cleanId}`;
      script.id = "ga4-script-tag";
      document.head.appendChild(script);

      localStorage.setItem("ga_measurement_id", cleanId);
      setIsGAConnected(true);
      addLog("success", `Google Analytics 4 conectado con éxito (${cleanId})`);
      addLog("event", "page_view", { 
        page_title: document.title, 
        page_location: window.location.href,
        debug_mode: true
      });
    } catch (error) {
      addLog("warn", `Error al conectar GA4: ${String(error)}`);
      setIsGAConnected(false);
    }
  };

  // Trigger GA4 event (both mock console and actual script)
  const triggerGA4Event = (eventName: string, params: Record<string, any> = {}) => {
    const cleanParams = {
      ...params,
      timestamp_local: new Date().toISOString(),
      debug_mode: true // Highlights event in GA4 DebugView immediately
    };

    // Log internally
    addLog("event", `Evento '${eventName}' registrado`, cleanParams);

    // Call GA4 gtag if connected
    if (isGAConnected && window.gtag) {
      try {
        window.gtag("event", eventName, cleanParams);
      } catch (err) {
        addLog("warn", `Fallo al enviar a Google Analytics: ${String(err)}`);
      }
    }
  };

  // Handle connection submit
  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    connectGA4(measurementId);
  };

  // Disconnect GA4
  const handleDisconnect = () => {
    const existingScript = document.getElementById("ga4-script-tag");
    if (existingScript) existingScript.remove();
    setIsGAConnected(false);
    localStorage.removeItem("ga_measurement_id");
    addLog("info", "Google Analytics 4 desconectado. Los eventos ahora son simulados.");
  };

  // Handle test form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    addLog("info", "Procesando envío de formulario de prueba...");

    // Simulate server delay and beautiful animation
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      // Trigger GA4 custom and standard lead events
      triggerGA4Event("form_test_submission", {
        test_user_name: formName || "Anónimo",
        test_user_email: formEmail || "no-email@test.com",
        test_category: formCategory,
        test_message_length: formMessage.length,
        is_simulated_only: !isGAConnected
      });

      triggerGA4Event("generate_lead", {
        value: 10.0,
        currency: "USD",
        lead_source: "GA4_Test_Landing",
        category: formCategory
      });

      addLog("success", "¡Formulario enviado con éxito! No se enviaron datos personales al servidor.");
    }, 1200);
  };

  // Auto-connect on mount if ID is preset
  useEffect(() => {
    addLog("info", "Entorno de Pruebas GA4 inicializado.");
    if (measurementId && measurementId.trim().startsWith("G-")) {
      connectGA4(measurementId);
    } else {
      addLog("info", "Sin ID de medición activo. Configure su ID G-XXXXXXXXXX arriba para enviar datos reales.");
      // Trigger simulated page_view
      addLog("event", "page_view (Simulado)", { 
        page_title: document.title, 
        page_location: window.location.href 
      });
    }
  }, []);

  // Clear Event Logs
  const clearLogs = () => {
    setLogs([]);
    addLog("info", "Historial de consola borrado.");
  };

  // Mock Copy Helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopyingId(true);
    setTimeout(() => setIsCopyingId(false), 2000);
  };

  return (
    <div id="ga4_test_app" className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-900">
      
      {/* 1. Header Bar following "Professional Polish" structure exactly */}
      <header className="h-16 flex items-center justify-between px-6 sm:px-10 bg-white border-b border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rounded-sm" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900">AnalyticsLab</span>
        </div>
        
        <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-500">
          <a href="https://support.google.com/analytics/answer/7201382" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            Documentación <ExternalLink className="w-3 h-3" />
          </a>
          <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            Herramientas <ExternalLink className="w-3 h-3" />
          </a>
          <span className="text-blue-600 font-semibold cursor-default">Test de Eventos</span>
        </nav>

        <div className="px-4 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 uppercase tracking-wide">
          {isGAConnected ? "CONEXIÓN REAL ACTIVA" : "MODO PRUEBA ACTIVO"}
        </div>
      </header>

      {/* Main Container Area with Gradient Background */}
      <main className="flex-1 p-6 sm:p-10 lg:p-12 bg-gradient-to-br from-slate-50 to-blue-50 relative">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Split Top Layout Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Hero Content Section */}
            <section className="space-y-6">
              <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] uppercase tracking-widest font-bold rounded">
                Entorno de Validación
              </div>
              
              <h1 id="main_title" className="text-5xl sm:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
                Esto es una prueba.
              </h1>
              
              <p id="main_subtitle" className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
                Utiliza este formulario para verificar que tu configuración de <strong className="text-slate-800">Google Analytics 4</strong> está capturando eventos correctamente en el DebugView.
              </p>

              {/* Connected States indicator cards */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isGAConnected ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">gtag.js</div>
                    <div className="text-xs text-slate-500">
                      {isGAConnected ? "Conectado al script oficial" : "Cargado localmente"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex-1">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Eventos</div>
                    <div className="text-xs text-slate-500">Escuchando 'generate_lead'</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Right Interactive Form Section */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden transition-all duration-300">
              
              <AnimatePresence mode="wait">
                {!isSuccess ? (
                  <motion.form
                    key="ga4-form-polish"
                    onSubmit={handleFormSubmit}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        onFocus={() => triggerGA4Event("input_focus", { field_name: "name" })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        required
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="test@example.com"
                        onFocus={() => triggerGA4Event("input_focus", { field_name: "email" })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Motivo del Test / Tipo de Evento
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => {
                          setFormCategory(e.target.value);
                          triggerGA4Event("select_category_change", { selected_value: e.target.value });
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 font-medium"
                      >
                        <option value="conversion">Validación de GA4 (generate_lead)</option>
                        <option value="lead_alta_prioridad">Prueba de GTM (VIP Lead)</option>
                        <option value="quick_feedback">Test de Animación (Feedback)</option>
                        <option value="demo_request">Solicitud de Demo de Prueba</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Comentarios opcionales
                      </label>
                      <textarea
                        value={formMessage}
                        onChange={(e) => setFormMessage(e.target.value)}
                        placeholder="Ej. Prueba de registro de lead en la consola local"
                        rows={2}
                        onFocus={() => triggerGA4Event("input_focus", { field_name: "message" })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-80 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin text-white" />
                          <span>Procesando Activadores...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 text-white" />
                          <span>Simular Envío de Datos</span>
                        </>
                      )}
                    </button>

                    <p className="text-center text-[11px] text-slate-400 mt-4 italic">
                      Este formulario es una simulación visual. No se enviarán datos reales a ningún servidor externo, excepto los activadores de GA4 locales si están configurados.
                    </p>
                  </motion.form>
                ) : (
                  <motion.div
                    key="ga4-success-polish"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="py-12 text-center flex flex-col items-center justify-center"
                  >
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-6 text-white shadow-lg shadow-emerald-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 mb-2">¡Evento Enviado con Éxito!</h3>
                    
                    <p className="text-slate-500 text-center px-6 max-w-md text-sm leading-relaxed mb-6">
                      El evento virtual <code className="bg-slate-100 text-xs px-1.5 py-0.5 rounded font-mono text-indigo-600 font-bold">generate_lead</code> ha sido disparado. Revisa tu consola de desarrollador, el visor del tiempo real abajo o tu panel de GA4 DebugView.
                    </p>

                    <button
                      onClick={() => {
                        setIsSuccess(false);
                        setFormName("");
                        setFormEmail("");
                        setFormMessage("");
                        addLog("info", "Formulario reiniciado para nuevas pruebas de conversión.");
                      }}
                      className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 transition-all"
                    >
                      Probar de nuevo
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

          </div>

          {/* Bottom Grid: Live Event Console, Quick Triggers & Measurement ID Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
            
            {/* Left Column: ID Config & Quick Triggers (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Measurement ID Setup Card */}
              <div id="ga4_id_card" className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Settings className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">ID de Medición de tu Propiedad</h3>
                    <p className="text-[11px] text-slate-500">Vincula tu propio flujo web para ver estadísticas reales</p>
                  </div>
                </div>

                <form onSubmit={handleConnect} className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={measurementId}
                      onChange={(e) => setMeasurementId(e.target.value)}
                      placeholder="Ej. G-Y49X2L3M21"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                    />
                    <button
                      type="submit"
                      disabled={!measurementId.trim()}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      Conectar
                    </button>
                  </div>

                  {isGAConnected ? (
                    <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 px-3 py-2 rounded-xl border border-emerald-100">
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Conectado a {measurementId}
                      </span>
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="text-[10px] text-red-600 hover:underline font-bold"
                      >
                        Desconectar
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                      💡 El ID de medición suele comenzar con "G-". Si no configuras ninguno, se simulará el envío de eventos de manera local en la consola interactiva.
                    </div>
                  )}
                </form>
              </div>

              {/* Quick Trigger Buttons */}
              <div id="quick_events_card" className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Play className="w-4 h-4 text-emerald-500" />
                    Disparadores de Eventos Rápidos
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Dispara eventos estándar con parámetros simulados instantáneamente para depurar.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => triggerGA4Event("view_item", {
                      item_id: "prod_001",
                      item_name: "Guía de Optimización GA4",
                      item_category: "Ebooks",
                      price: 19.99,
                      currency: "USD"
                    })}
                    className="flex flex-col items-start p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-left transition-all"
                  >
                    <span className="text-xs font-bold text-slate-800">Ver Producto</span>
                    <span className="text-[10px] text-slate-400 font-mono">view_item</span>
                  </button>

                  <button
                    onClick={() => triggerGA4Event("purchase", {
                      transaction_id: `T_${Math.floor(Math.random() * 900000 + 100000)}`,
                      value: 49.99,
                      tax: 4.0,
                      shipping: 0.0,
                      currency: "USD",
                      items: [
                        { item_id: "premium_access", item_name: "Suscripción Premium GA4 Sandbox", price: 49.99, quantity: 1 }
                      ]
                    })}
                    className="flex flex-col items-start p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-left transition-all"
                  >
                    <span className="text-xs font-bold text-slate-800">Simular Compra</span>
                    <span className="text-[10px] text-slate-400 font-mono">purchase</span>
                  </button>

                  <button
                    onClick={() => triggerGA4Event("file_download", {
                      file_name: "manual_usuario_ga4.pdf",
                      file_extension: "pdf",
                      link_text: "Descargar Manual de Instalación"
                    })}
                    className="flex flex-col items-start p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-left transition-all"
                  >
                    <span className="text-xs font-bold text-slate-800">Descarga PDF</span>
                    <span className="text-[10px] text-slate-400 font-mono">file_download</span>
                  </button>

                  <button
                    onClick={() => triggerGA4Event("share", {
                      method: "copiar_enlace",
                      content_type: "sandbox_landing",
                      item_id: "ga4_test_page"
                    })}
                    className="flex flex-col items-start p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-left transition-all"
                  >
                    <span className="text-xs font-bold text-slate-800">Compartir</span>
                    <span className="text-[10px] text-slate-400 font-mono">share</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column: Console/Terminal Output (7 Cols) */}
            <div className="lg:col-span-7">
              
              <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[400px]">
                {/* Console header */}
                <div className="bg-slate-950 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400 ml-2 flex items-center gap-1.5">
                      <TerminalIcon className="w-3.5 h-3.5 text-blue-400" />
                      Consola GA4 (Tiempo Real)
                    </span>
                  </div>
                  
                  <button
                    onClick={clearLogs}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-all"
                    title="Limpiar Consola"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Console logs list */}
                <div className="flex-grow p-4 overflow-y-auto font-mono text-[11px] space-y-3.5 scrollbar-thin">
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center px-4">
                      <ActivityIcon className="w-8 h-8 text-slate-700 mb-2 animate-pulse" />
                      <p className="font-semibold text-slate-400">Esperando eventos en tiempo real...</p>
                      <p className="text-[10px] mt-1 max-w-[250px]">
                        Interactúa con el formulario o dispara eventos usando los botones para ver los parámetros detallados.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {logs.map((log) => (
                        <div key={log.id} className="border-b border-slate-800/40 pb-2 last:border-0">
                          <div className="flex items-start gap-2">
                            <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                            
                            <div className="flex-grow space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {log.type === "success" && (
                                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded text-[9px] font-bold">
                                    SUCC
                                  </span>
                                )}
                                {log.type === "warn" && (
                                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1 py-0.2 rounded text-[9px] font-bold">
                                    WARN
                                  </span>
                                )}
                                {log.type === "info" && (
                                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 py-0.2 rounded text-[9px] font-bold">
                                    INFO
                                  </span>
                                )}
                                {log.type === "event" && (
                                  <span className="bg-amber-500/15 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded text-[9px] font-bold">
                                    GA4 EVENT
                                  </span>
                                )}
                                
                                <span className={`font-semibold ${log.type === "event" ? "text-amber-300" : log.type === "success" ? "text-emerald-300" : log.type === "warn" ? "text-rose-300" : "text-blue-200"}`}>
                                  {log.message}
                                </span>
                              </div>

                              {log.params && (
                                <pre className="text-[10px] text-slate-400 bg-slate-950/80 p-2 rounded-lg border border-slate-800/40 overflow-x-auto whitespace-pre-wrap max-w-full">
                                  {JSON.stringify(log.params, null, 2)}
                                </pre>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div ref={consoleBottomRef} />
                </div>

                {/* Console footer */}
                <div className="bg-slate-950 px-4 py-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Modo: {isGAConnected ? "Analytics Real Gtag" : "Simulado local"}</span>
                  <span>{logs.length} eventos registrados</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </main>

      {/* 3. Footer following "Professional Polish" structure exactly */}
      <footer className="h-12 bg-slate-900 flex items-center justify-between px-6 sm:px-10 text-[11px] font-medium text-slate-400 shrink-0">
        <div className="flex gap-4 sm:gap-6 overflow-x-auto whitespace-nowrap scrollbar-none">
          <span>STATUS: ONLINE</span>
          <span>ID DE MEDICIÓN: {measurementId || "G-TEST123456"}</span>
          <span>VERSION: 4.1.0</span>
        </div>
        <div className="hidden sm:block">
          &copy; {new Date().getFullYear()} Analytics Testing Environment • Visual Demo Only
        </div>
      </footer>
    </div>
  );
}

// Custom Micro-Icons fallback to keep code self-contained and super lightweight
function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
