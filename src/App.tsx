import { useState, useRef, useCallback, useEffect } from "react";
import {
  User,
  Dumbbell,
  Camera,
  Trophy,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Upload,
  Trash2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Scale,
  Ruler,
  Calendar,
  Clock,
  Check
} from "lucide-react";

// ============================================================
// CONFIGURATION & CONSTANTS
// ============================================================
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzaobTRXlq83wOppavOWR20n3jCzS7eeX2cuXMCYizzSi2scNNkIS6MpePa91sC06ei/exec";

interface EventoConvocado {
  id: string;
  nombre: string;
  fecha: string;
  lugar: string;
  limiteInscripcion: string;
  sheetName: string;
  horaPesaje: string;
  activo?: string;
}

const BACKUP_EVENTOS: EventoConvocado[] = [
  {
    id: "1",
    nombre: "Copa Regional del Pacífico 2026",
    fecha: "2026-07-12",
    lugar: "Polideportivo Alexis Argüello, Managua",
    limiteInscripcion: "2026-07-06",
    sheetName: "Pacífico_12-07-2026",
    horaPesaje: "12:00 MD a 3:00 PM"
  },
  {
    id: "2",
    nombre: "Campeonato Departamental de León 2026",
    fecha: "2026-07-26",
    lugar: "Auditorio Ruiz Ayesta, León",
    limiteInscripcion: "2026-07-20",
    sheetName: "León_26-07-2026",
    horaPesaje: "12:00 MD a 3:00 PM"
  },
  {
    id: "3",
    nombre: "Campeonato Regional del Sur 2026 (Rivas)",
    fecha: "2026-08-16",
    lugar: "Gimnasio Humberto Méndez, Rivas",
    limiteInscripcion: "2026-08-10",
    sheetName: "Sur_Rivas_16-08-2026",
    horaPesaje: "12:00 MD a 3:00 PM"
  },
  {
    id: "4",
    nombre: "Copa Nacional de Fisicoculturismo FENIFISC 2026",
    fecha: "2026-08-30",
    lugar: "Centro de Convenciones Olof Palme, Managua",
    limiteInscripcion: "2026-08-24",
    sheetName: "Copa_Nacional_30-08-2026",
    horaPesaje: "11:00 AM a 2:00 PM"
  }
];

const DEPARTAMENTOS_NI = [
  "Matagalpa", "Jinotega", "Estelí", "Madriz", "Nueva Segovia",
  "Managua", "León", "Chinandega", "Masaya", "Granada", "Carazo",
  "Rivas", "Boaco", "Chontales", "Río San Juan", "RACCN", "RACCS"
];

const CATEGORIAS_MASCULINAS = {
  "Fisicoculturismo": ["Hasta 65 Kg", "Hasta 70 Kg", "Hasta 75 Kg", "Hasta 80 Kg", "Hasta 85 Kg", "Más de 85 Kg"],
  "Men's Physique": ["Hasta 1.74 Mt", "Más de 1.74 Mt"],
  "Muscular Men's Physique": ["OPEN"],
  "Físico Clásico": ["Hasta 1.71 Mt", "Más de 1.71 Mt"],
  "Classic Physique": ["Hasta 1.71 Mt", "Más de 1.71 Mt"],
};

const CATEGORIAS_FEMENINAS = {
  "Women's Physique": ["Única Categoría"],
  "Bikini": ["Categoría Alta", "Categoría Baja"],
  "Body Fitness": ["Categoría Baja", "Categoría Alta"],
  "Wellness": ["Categoría Libre"],
};

const PASOS = [
  { title: "Competencias", icon: <Trophy className="w-5 h-5" /> },
  { title: "Personales", icon: <User className="w-5 h-5" /> },
  { title: "Deportiva", icon: <Dumbbell className="w-5 h-5" /> },
  { title: "Documentos", icon: <Camera className="w-5 h-5" /> },
  { title: "Confirmar", icon: <CheckCircle className="w-5 h-5" /> },
];

// ============================================================
// UTILITIES
// ============================================================

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const isDeadlinePassed = (deadlineStr: string) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(deadlineStr);
    deadline.setHours(23, 59, 59, 999);
    return today > deadline;
  } catch (e) {
    return false;
  }
};

const getDaysLeft = (deadlineStr: string) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(deadlineStr);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (e) {
    return -1;
  }
};

// ============================================================
// COMPONENTS
// ============================================================

const InputField = ({ label, icon: Icon, value, onChange, error, placeholder, type = "text", required = false }: any) => (
  <div className="mb-4">
    <label className="block text-gray-300 text-sm font-semibold mb-2 flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-amber-500" />}
      {label} {required && <span className="text-amber-500">*</span>}
    </label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-gray-900/50 border rounded-xl px-4 py-3 text-white placeholder-gray-500 transition-all focus:ring-2 focus:ring-amber-500 outline-none ${error ? "border-red-500" : "border-gray-700 hover:border-gray-600"
          }`}
      />
    </div>
    {error && <p className="text-red-400 text-xs mt-1 animate-pulse">{error}</p>}
  </div>
);

const PhotoUploader = ({ label, description, photo, onFileChange, onRemove, error, aspect = "square" }: any) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="mb-6">
      <label className="block text-gray-200 text-sm font-bold mb-1">{label}</label>
      <p className="text-gray-500 text-xs mb-3">{description}</p>

      {photo.preview ? (
        <div className="relative group">
          <div className={`overflow-hidden rounded-2xl border-2 border-amber-500/50 bg-black ${aspect === 'square' ? 'w-40 h-40' : 'w-full h-48'}`}>
            <img src={photo.preview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button onClick={onRemove} className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="mt-2 text-green-400 text-xs flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Imagen cargada correctamente
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-amber-500/5 ${error ? "border-red-500 bg-red-500/5" : "border-gray-700 hover:border-amber-500/50"
            }`}
        >
          <Upload className={`w-10 h-10 mx-auto mb-3 ${error ? 'text-red-400' : 'text-gray-500'}`} />
          <p className="text-gray-300 font-medium">Subir Imagen</p>
          <p className="text-gray-500 text-xs mt-1">Click para seleccionar (Max 5MB)</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileChange(file);
        }}
      />
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
};

// ============================================================
// MAIN APPLICATION
// ============================================================
export default function App() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<any>({});

  // Dynamic events state
  const [eventos, setEventos] = useState<EventoConvocado[]>([]);
  const [eventosSeleccionados, setEventosSeleccionados] = useState<string[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [errorEventos, setErrorEventos] = useState<string | null>(null);
  const [showReglamento, setShowReglamento] = useState(false);

  const [form, setForm] = useState({
    nombreCompleto: "", cedula: "", fechaNacimiento: "",
    sexo: "", telefono: "", email: "",
    departamento: "Matagalpa", ciudad: "", direccion: "",
    atletaLibre: false, club: "", entrenador: "",
    pesoActual: "", estatura: "",
    contactoEmergencia: "", telefonoEmergencia: "",
    aceptaReglamento: false, aceptaHorario: false, autorizaDatos: false,
  });

  const [photos, setPhotos] = useState<any>({
    selfie: { file: null, preview: "", base64: "" },
    cedulaFrente: { file: null, preview: "", base64: "" },
    cedulaReverso: { file: null, preview: "", base64: "" },
  });

  // Load active events from database on mount
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        setLoadingEventos(true);
        const response = await fetch(GOOGLE_SCRIPT_URL);
        if (!response.ok) {
          throw new Error("Respuesta de red no satisfactoria");
        }
        const data = await response.json();
        if (data.status === "success" && data.eventos && data.eventos.length > 0) {
          // Sort events by date ascending
          const sorted = [...data.eventos].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
          setEventos(sorted);
        } else {
          console.warn("La base de datos de eventos retornó vacía, usando respaldo.");
          setEventos(BACKUP_EVENTOS);
        }
      } catch (err) {
        console.error("Error al conectar con la base de datos de eventos:", err);
        setErrorEventos("No se pudo sincronizar el calendario de eventos en tiempo real. Mostrando eventos programados locales.");
        setEventos(BACKUP_EVENTOS);
      } finally {
        setLoadingEventos(false);
      }
    };
    fetchEventos();
  }, []);

  const updateField = useCallback((name: string, value: any) => {
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev: any) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, [errors]);

  const handlePhoto = useCallback(async (name: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev: any) => ({ ...prev, [name]: "El archivo es demasiado grande (Máx 5MB)" }));
      return;
    }
    const base64 = await fileToBase64(file);
    const preview = URL.createObjectURL(file);
    setPhotos((prev: any) => ({
      ...prev,
      [name]: { file, preview, base64 }
    }));
    setErrors((prev: any) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const validateStep = () => {
    const newErrors: any = {};
    if (step === 0) {
      if (eventosSeleccionados.length === 0) {
        newErrors.eventos = "Debe elegir al menos un evento para continuar";
      }
    } else if (step === 1) {
      if (!form.nombreCompleto) newErrors.nombreCompleto = "El nombre es obligatorio";
      if (!form.cedula) newErrors.cedula = "La cédula es obligatoria";
      if (!form.fechaNacimiento) newErrors.fechaNacimiento = "Fecha requerida";
      if (!form.sexo) newErrors.sexo = "Seleccione sexo";
      if (!form.telefono) newErrors.telefono = "Teléfono requerido";
    } else if (step === 2) {
      if (!form.atletaLibre && !form.club) newErrors.club = "Especifique club o marque Atleta Libre";
      if (!form.pesoActual) newErrors.pesoActual = "Peso requerido";
      if (!form.estatura) newErrors.estatura = "Estatura requerida";
    } else if (step === 3) {
      if (!photos.selfie.file) newErrors.selfie = "Foto de perfil obligatoria";
      if (!photos.cedulaFrente.file) newErrors.cedulaFrente = "Foto de cédula obligatoria";
      if (!photos.cedulaReverso.file) newErrors.cedulaReverso = "Foto de reverso obligatoria";
    } else if (step === 4) {
      if (!form.contactoEmergencia) newErrors.contactoEmergencia = "Requerido";
      if (!form.telefonoEmergencia) newErrors.telefonoEmergencia = "Requerido";
      if (!form.aceptaReglamento) newErrors.aceptaReglamento = "Debe aceptar";
      if (!form.aceptaHorario) newErrors.aceptaHorario = "Debe aceptar";
      if (!form.autorizaDatos) newErrors.autorizaDatos = "Debe aceptar";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(s => s + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setStep(s => s - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const selectedEventsData = eventos
        .filter(e => eventosSeleccionados.includes(e.id))
        .map(e => ({ id: e.id, nombre: e.nombre, sheetName: e.sheetName }));
      
      const payload = {
        ...form,
        evento: selectedEventsData.map(e => e.nombre).join(" y "), // Backward compatibility
        eventosSeleccionados: selectedEventsData,
        fotoSelfie: {
          base64: photos.selfie.base64,
          name: "selfie.jpg",
          type: "image/jpeg"
        },
        fotoCedulaFrente: {
          base64: photos.cedulaFrente.base64,
          name: "cedula_frente.jpg",
          type: "image/jpeg"
        },
        fotoCedulaReverso: {
          base64: photos.cedulaReverso.base64,
          name: "cedula_reverso.jpg",
          type: "image/jpeg"
        },
        timestamp: new Date().toLocaleString("es-NI", { timeZone: "America/Managua" })
      };

      // Send to GAS
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload)
      });

      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Hubo un problema al enviar los datos. Por favor intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-gray-900 border border-amber-500/30 rounded-3xl p-8 text-center shadow-2xl relative">
          <img
            src="https://fenifisc.com/logo-fenifisc.png"
            alt="FENIFISC"
            className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-amber-500/40 bg-gray-800 p-1 object-contain"
            loading="lazy"
            decoding="async"
          />
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">¡Inscripción Exitosa!</h2>
          <p className="text-gray-400 mb-6 text-sm">
            Tu registro ha sido procesado de forma correcta. Se han creado tus inscripciones en las bases de datos oficiales de FENIFISC de los siguientes eventos:
          </p>
          
          <div className="my-5 text-left bg-gray-950/60 p-4 border border-amber-500/10 rounded-2xl">
            <p className="text-amber-500 text-xs font-bold uppercase tracking-wider mb-2">Eventos registrados:</p>
            <ul className="space-y-2">
              {eventos.filter(e => eventosSeleccionados.includes(e.id)).map(e => (
                <li key={e.id} className="text-white text-xs font-semibold flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>{e.nombre} ({new Date(e.fecha + "T00:00:00").toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })})</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-gray-400 mb-6 text-xs leading-relaxed">
            Recuerda presentarte puntualmente el día del evento en el horario de pesaje correspondiente para registrar tu peso y confirmar tu categoría oficial.
          </p>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 rounded-2xl transition-all"
          >
            Finalizar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-amber-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-gray-950 to-black" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/3 rounded-full" />
        <div className="absolute top-1/4 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/10 to-transparent" />
        <div className="absolute top-3/4 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/10 to-transparent" />
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-amber-500/20" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-amber-500/20" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-amber-500/20" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-amber-500/20" />
      </div>

      {/* Header */}
      <header className="relative pt-12 pb-8 px-4 text-center">
        <div className="relative inline-flex justify-center w-full mb-8">
          <div className="absolute inset-0 flex justify-center">
            <div className="w-40 h-40 bg-linear-to-br from-amber-400/10 via-amber-500/5 to-amber-600/10 rounded-full" />
          </div>
          <img
            src="https://fenifisc.com/logo-fenifisc.png"
            alt="FENIFISC Logo"
            className="relative w-36 h-36 rounded-full border-3 border-amber-500/40 p-2 bg-gray-900/80 object-contain"
            loading="lazy"
            decoding="async"
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 uppercase">
          SISTEMA DE <span className="text-amber-500">INSCRIPCIÓN MULTIPLATAFORMA</span>
        </h1>
        <p className="text-amber-200/60 font-bold tracking-[0.5em] uppercase text-sm">FENIFISC 2026</p>
        <p className="text-amber-200/50 italic text-sm mb-1">Inscripción para competencias oficiales de Julio y Agosto</p>
      </header>

      {/* Main Content */}
      <main className="relative max-w-4xl mx-auto px-4 pb-20">

        {/* Progress Bar */}
        <div className="mb-10 flex justify-between items-center bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
          {PASOS.map((p, i) => (
            <div key={i} className="flex flex-col items-center flex-1 relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i <= step ? "bg-amber-500 text-black" : "bg-gray-800 text-gray-500"
                }`}>
                {i < step ? <CheckCircle className="w-6 h-6" /> : p.icon}
              </div>
              <span className={`text-[10px] mt-2 font-bold uppercase tracking-wider hidden md:block ${i <= step ? "text-amber-500" : "text-gray-600"
                }`}>{p.title}</span>
              {i < PASOS.length - 1 && (
                <div className={`absolute top-5 left-[60%] w-[80%] h-[2px] -z-10 ${i < step ? "bg-amber-500" : "bg-gray-800"
                  }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Container */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 md:p-10">

          {/* STEP 0: SELECCIÓN DE COMPETENCIAS */}
          {step === 0 && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Trophy className="text-amber-500" /> Selección de Competencias
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Selecciona una o más competencias en las que deseas participar en Julio y Agosto. Tus datos se agregarán a la base de datos de cada evento escogido.
              </p>

              {loadingEventos ? (
                <div className="py-16 text-center">
                  <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">Sincronizando con la base de datos de FENIFISC...</p>
                </div>
              ) : (
                <>
                  {errorEventos && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs p-4 rounded-xl mb-6 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{errorEventos}</span>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    {eventos.map((evt) => {
                      const selected = eventosSeleccionados.includes(evt.id);
                      const closed = isDeadlinePassed(evt.limiteInscripcion);
                      const daysLeft = getDaysLeft(evt.limiteInscripcion);
                      
                      const isAugust = evt.fecha.includes("-08-");
                      const monthBadgeColor = isAugust 
                        ? "bg-pink-500/15 border-pink-500/30 text-pink-400" 
                        : "bg-amber-500/15 border-amber-500/30 text-amber-400";
                      
                      const dateObj = new Date(evt.fecha + "T00:00:00");
                      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
                      const fechaFormatted = dateObj.toLocaleDateString('es-ES', options);

                      return (
                        <div
                          key={evt.id}
                          onClick={() => {
                            if (closed) return;
                            if (selected) {
                              setEventosSeleccionados(eventosSeleccionados.filter(id => id !== evt.id));
                            } else {
                              setEventosSeleccionados([...eventosSeleccionados, evt.id]);
                            }
                          }}
                          className={`relative border rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between h-full group ${
                            closed 
                              ? "border-gray-800/80 bg-gray-900/20 opacity-50 cursor-not-allowed" 
                              : selected
                                ? "bg-amber-500/5 border-amber-500 shadow-lg shadow-amber-500/5"
                                : "bg-gray-900/50 border-gray-700 hover:border-amber-500/40 hover:bg-gray-900/80"
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 border rounded-full ${monthBadgeColor}`}>
                                {isAugust ? "Agosto" : "Julio"}
                              </span>

                              {closed ? (
                                <span className="text-[10px] font-extrabold uppercase bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1 rounded-full">
                                  Cerrado
                                </span>
                              ) : daysLeft >= 0 && daysLeft <= 3 ? (
                                <span className="text-[10px] font-extrabold uppercase bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1 rounded-full animate-pulse">
                                  ¡Últimos {daysLeft} días!
                                </span>
                              ) : (
                                <span className="text-[10px] font-extrabold uppercase bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1 rounded-full">
                                  Abierto
                                </span>
                              )}
                            </div>

                            <h3 className={`font-black text-lg mb-4 transition-colors leading-snug ${selected ? "text-amber-500" : "text-white"}`}>
                              {evt.nombre}
                            </h3>

                            <div className="space-y-2 text-xs text-gray-400 mb-6">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-amber-500/60 shrink-0" />
                                <span>{fechaFormatted}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-amber-500/60 shrink-0" />
                                <span className="line-clamp-2">{evt.lugar}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-500/60 shrink-0" />
                                <span>Pesaje: {evt.horaPesaje}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-auto pt-4 border-t border-gray-800/40 flex justify-between items-center">
                            <span className="text-[10px] text-gray-500">
                              Límite: {new Date(evt.limiteInscripcion + "T00:00:00").toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </span>
                            
                            {!closed && (
                              <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                                selected 
                                  ? "bg-amber-500 border-amber-500 text-black scale-110" 
                                  : "border-gray-700 bg-gray-900 group-hover:border-gray-500"
                              }`}>
                                {selected && <Check className="w-4 h-4 stroke-[3px]" />}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {errors.eventos && (
                    <p className="text-red-400 text-xs mt-4 animate-pulse">{errors.eventos}</p>
                  )}

                  <div className="mt-8 border-t border-gray-800 pt-6">
                    <button
                      onClick={() => setShowReglamento(!showReglamento)}
                      type="button"
                      className="w-full flex items-center justify-between p-4 bg-gray-900/40 border border-gray-800 rounded-2xl hover:bg-gray-800/40 transition-all text-amber-500 font-bold"
                    >
                      <span className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        Ver Categorías Oficiales y Reglamento IFBB
                      </span>
                      <span>{showReglamento ? "▲ Ocultar" : "▼ Mostrar"}</span>
                    </button>

                    {showReglamento && (
                      <div className="mt-4 space-y-8 p-6 bg-gray-900/20 border border-gray-800/60 rounded-2xl animate-in fade-in duration-300">
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
                          <h3 className="text-amber-400 font-bold mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                            REGLAMENTO OFICIAL IFBB
                          </h3>
                          <div className="space-y-3 text-xs text-amber-200/70 leading-relaxed">
                            <p className="flex items-start gap-2">
                              <span className="text-amber-500 mt-1">•</span>
                              <span>Esta Competencia estará regida por las reglas y reglamentos de la Federación Internacional de Fitness y Fisicoculturismo (IFBB).</span>
                            </p>
                            <p className="flex items-start gap-2">
                              <span className="text-amber-500 mt-1">•</span>
                              <span>Cualquier atleta que se presente después de la hora estipulada para el pesaje, no tendrá derecho de ser pesado y pierde todo derecho de competir.</span>
                            </p>
                            <p className="flex items-start gap-2">
                              <span className="text-amber-500 mt-1">•</span>
                              <span>A los atletas que se inscriben para participar en CLASSIC PHYSIQUE, se le hace de su conocimiento que el requisito para poder participar en dicha modalidad es hacer el VACIO ABDOMINAL que se les pedirá en la mesa de inscripción y pesaje, en el entendido que quienes no pueden hacer el Vacío Abdominal, pierden el derecho de participar en dicha modalidad.</span>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <h3 className="text-amber-500 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Rama Masculina
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {Object.keys(CATEGORIAS_MASCULINAS).map(cat => (
                                <div key={cat} className="bg-gray-900/40 p-4 rounded-xl border border-gray-800/85">
                                  <p className="font-bold text-white text-sm mb-2">{cat}</p>
                                  <div className="space-y-1">
                                    {(CATEGORIAS_MASCULINAS as any)[cat].map((s: string) => (
                                      <p key={s} className="text-gray-500 text-xs">• {s}</p>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-pink-500 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 bg-pink-500 rounded-full" /> Rama Femenina
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {Object.keys(CATEGORIAS_FEMENINAS).map(cat => (
                                <div key={cat} className="bg-gray-900/40 p-4 rounded-xl border border-gray-800/85">
                                  <p className="font-bold text-white text-sm mb-2">{cat}</p>
                                  <div className="space-y-1">
                                    {(CATEGORIAS_FEMENINAS as any)[cat].map((s: string) => (
                                      <p key={s} className="text-gray-500 text-xs">• {s}</p>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 1: PERSONAL */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <User className="text-amber-500" /> Información Personal
              </h2>
              <div className="grid md:grid-cols-2 gap-x-6">
                <InputField
                  label="Nombre Completo"
                  required
                  value={form.nombreCompleto}
                  onChange={(v: any) => updateField("nombreCompleto", v)}
                  error={errors.nombreCompleto}
                  placeholder="Ej: Juan Pérez Artola"
                />
                <InputField
                  label="Cédula de Identidad"
                  required
                  value={form.cedula}
                  onChange={(v: any) => updateField("cedula", v)}
                  error={errors.cedula}
                  placeholder="000-000000-0000X"
                />
                <InputField
                  label="Fecha de Nacimiento"
                  type="date"
                  required
                  value={form.fechaNacimiento}
                  onChange={(v: any) => updateField("fechaNacimiento", v)}
                  error={errors.fechaNacimiento}
                />
                <div className="mb-4">
                  <label className="block text-gray-300 text-sm font-semibold mb-2">Sexo *</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['Masculino', 'Femenino'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updateField("sexo", s.toLowerCase())}
                        className={`py-3 rounded-xl border transition-all ${form.sexo === s.toLowerCase()
                          ? "bg-amber-500/10 border-amber-500 text-amber-500"
                          : "border-gray-700 bg-gray-900/50 text-gray-400 hover:border-gray-600"
                          }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  {errors.sexo && <p className="text-red-400 text-xs mt-1">{errors.sexo}</p>}
                </div>
                <InputField
                  label="Teléfono WhatsApp"
                  icon={Phone}
                  required
                  value={form.telefono}
                  onChange={(v: any) => updateField("telefono", v)}
                  error={errors.telefono}
                  placeholder="8888-8888"
                />
                <InputField
                  label="Email"
                  icon={Mail}
                  type="email"
                  value={form.email}
                  onChange={(v: any) => updateField("email", v)}
                  placeholder="atleta@ejemplo.com"
                />
                <div className="mb-4">
                  <label className="block text-gray-300 text-sm font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-500" /> Departamento
                  </label>
                  <select
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    value={form.departamento}
                    onChange={(e) => updateField("departamento", e.target.value)}
                  >
                    {DEPARTAMENTOS_NI.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <InputField
                  label="Ciudad / Municipio"
                  value={form.ciudad}
                  onChange={(v: any) => updateField("ciudad", v)}
                  placeholder="Ej: Managua"
                />
              </div>
            </div>
          )}

          {/* STEP 2: DEPORTIVA */}
          {step === 2 && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Dumbbell className="text-amber-500" /> Datos de Competencia
              </h2>
              <div className="mb-8">
                <button
                  type="button"
                  onClick={() => updateField("atletaLibre", !form.atletaLibre)}
                  className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all ${form.atletaLibre ? "bg-amber-500/10 border-amber-500" : "bg-gray-900/50 border-gray-700"
                    }`}
                >
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${form.atletaLibre ? "bg-amber-500 border-amber-500" : "border-gray-500"
                    }`}>
                    {form.atletaLibre && <CheckCircle className="w-4 h-4 text-black" />}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-white">Soy Atleta Libre</p>
                    <p className="text-gray-500 text-xs">No represento a ningún Team o Gimnasio</p>
                  </div>
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-x-6">
                {!form.atletaLibre && (
                  <>
                    <InputField
                      label="Team / Gimnasio"
                      required
                      value={form.club}
                      onChange={(v: any) => updateField("club", v)}
                      error={errors.club}
                      placeholder="Nombre de tu gimnasio"
                    />
                    <InputField
                      label="Entrenador"
                      value={form.entrenador}
                      onChange={(v: any) => updateField("entrenador", v)}
                      placeholder="Nombre del coach"
                    />
                  </>
                )}
                <InputField
                  label="Peso Actual (Kg)"
                  icon={Scale}
                  required
                  value={form.pesoActual}
                  onChange={(v: any) => updateField("pesoActual", v)}
                  error={errors.pesoActual}
                  placeholder="Ej: 75"
                />
                <InputField
                  label="Estatura (Metros)"
                  icon={Ruler}
                  required
                  value={form.estatura}
                  onChange={(v: any) => updateField("estatura", v)}
                  error={errors.estatura}
                  placeholder="Ej: 1.70"
                />
              </div>

              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 mt-6 flex gap-4">
                <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                <p className="text-amber-200/70 text-xs leading-relaxed">
                  El pesaje oficial de cada competencia se realiza en la fecha indicada en horarios de mañana/tarde según el cronograma. Recuerda presentarte con vestimenta adecuada y tu cédula de identidad original.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: DOCUMENTS */}
          {step === 3 && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Camera className="text-amber-500" /> Galería de Validación
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <PhotoUploader
                  label="Foto de Perfil (Selfie)"
                  description="Rostro descubierto y buena iluminación"
                  photo={photos.selfie}
                  onFileChange={(f: any) => handlePhoto("selfie", f)}
                  onRemove={() => setPhotos((p: any) => ({ ...p, selfie: { file: null, preview: "", base64: "" } }))}
                  error={errors.selfie}
                />
                <PhotoUploader
                  label="Cédula (Frente)"
                  description="Asegúrese que los datos sean legibles"
                  photo={photos.cedulaFrente}
                  aspect="card"
                  onFileChange={(f: any) => handlePhoto("cedulaFrente", f)}
                  onRemove={() => setPhotos((p: any) => ({ ...p, cedulaFrente: { file: null, preview: "", base64: "" } }))}
                  error={errors.cedulaFrente}
                />
                <PhotoUploader
                  label="Cédula (Reverso)"
                  description="Fotografía del reverso del documento"
                  photo={photos.cedulaReverso}
                  aspect="card"
                  onFileChange={(f: any) => handlePhoto("cedulaReverso", f)}
                  onRemove={() => setPhotos((p: any) => ({ ...p, cedulaReverso: { file: null, preview: "", base64: "" } }))}
                  error={errors.cedulaReverso}
                />
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRMATION */}
          {step === 4 && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <CheckCircle className="text-amber-500" /> Finalizar Registro
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Por favor, verifica tus datos de contacto y acepta los términos para procesar tu inscripción en las competencias elegidas.
              </p>

              {/* Eventos seleccionados resumen */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 mb-8">
                <h3 className="text-amber-500 text-xs font-bold uppercase tracking-wider mb-3">
                  Resumen de competencias elegidas:
                </h3>
                <div className="space-y-3">
                  {eventos.filter(e => eventosSeleccionados.includes(e.id)).map(e => (
                    <div key={e.id} className="flex justify-between items-center text-xs text-gray-300 border-b border-gray-800/50 pb-2 last:border-0 last:pb-0">
                      <span className="font-semibold text-white">{e.nombre}</span>
                      <span className="text-amber-400/80">{new Date(e.fecha + "T00:00:00").toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <InputField
                  label="Contacto de Emergencia"
                  required
                  value={form.contactoEmergencia}
                  onChange={(v: any) => updateField("contactoEmergencia", v)}
                  error={errors.contactoEmergencia}
                  placeholder="Nombre de familiar"
                />
                <InputField
                  label="Teléfono Emergencia"
                  required
                  value={form.telefonoEmergencia}
                  onChange={(v: any) => updateField("telefonoEmergencia", v)}
                  error={errors.telefonoEmergencia}
                  placeholder="8888-8888"
                />
              </div>

              <div className="space-y-4">
                {[
                  { id: "aceptaReglamento", text: "Acepto el reglamento oficial de la IFBB y FENIFISC." },
                  { id: "aceptaHorario", text: "Confirmo que me presentaré puntualmente en los lugares y horarios de pesaje estipulados para cada competencia seleccionada. De lo contrario, seré penalizado con la pérdida del derecho a participar." },
                  { id: "autorizaDatos", text: "Autorizo el uso de mi imagen y datos para fines del evento, y FENIFISC estime conveniente." }
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${(form as any)[item.id] ? "bg-amber-500/10 border-amber-500" : "bg-gray-900/50 border-gray-700"
                      }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 accent-amber-500"
                      checked={(form as any)[item.id]}
                      onChange={(e) => updateField(item.id, e.target.checked)}
                    />
                    <span className="text-sm text-gray-300 leading-snug">{item.text}</span>
                  </label>
                ))}
              </div>
              {(errors.aceptaReglamento || errors.aceptaHorario || errors.autorizaDatos) && (
                <p className="text-red-400 text-xs mt-2">Debe aceptar los tres términos para finalizar la inscripción.</p>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-10 pt-8 border-t border-gray-800 flex justify-between gap-4">
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex-1 max-w-[200px] py-4 rounded-2xl border border-gray-700 font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" /> Atrás
              </button>
            )}

            {step < PASOS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-4 rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 ml-auto max-w-[300px]"
              >
                Siguiente <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-black font-bold hover:from-amber-500 hover:to-amber-400 transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 ml-auto max-w-[300px] disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Finalizar Inscripción <CheckCircle className="w-5 h-5" /></>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <footer className="mt-12 text-center text-gray-600 text-xs">
          <p className="mb-2">Federación Nicaragüense de Fisicoculturismo (FENIFISC) • Instituto Nicaragüense de Deportes (IND) • Comité Olímpico Nicaragüense 2026</p>
          <p>© Todos los derechos reservados</p>
        </footer>
      </main>
    </div>
  );
}
