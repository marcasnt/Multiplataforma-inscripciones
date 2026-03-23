# 🏆 FENIFISC - Sistema de Inscripción Campeonato Nacional Potosi, Rivas 2026

Sitio web profesional y moderno para inscripciones del **Campeonato Campeonato Nacional Potosi, Rivas 2026**, organizado por FENIFISC.

---

## ✨ Características Principales

### 🎯 Para los Atletas
- ✅ **Formulario intuitivo de 5 pasos** con progreso visual
- 📸 **Carga de fotos** (Selfie + Cédula frente/reverso)
- 🔒 **Validación en tiempo real** con mensajes claros
- 📱 **100% Responsivo** - funciona en móvil, tablet y desktop
- 🌙 **Dark Mode** elegante con colores dorados de FENIFISC
- 💾 **Sin perder datos** - almacenamiento automático

### 🛠️ Para los Organizadores
- 📊 **Google Sheets automático** con todos los datos
- 🗂️ **Google Drive** con fotos organizadas
- 📧 **Notificaciones por email** en tiempo real
- 🔍 **Fácil búsqueda** de inscritos
- 📈 **Reportes automáticos**

---

## 🚀 Inicio Rápido

### Opción 1: Guía Completa (Recomendado)
Sigue la guía paso a paso más detallada:
```bash
📖 Lee: GOOGLE_APPS_SCRIPT_SETUP.md
```

### Opción 2: Guía Rápida (5 minutos)
Para el que no tiene tiempo:
```bash
⚡ Lee: GOOGLE_APPS_SCRIPT_QUICK_START.md
```

### Opción 3: Guía Visual (Con pantallazos)
Con instrucciones detalladas con imágenes:
```bash
📸 Lee: GOOGLE_APPS_SCRIPT_VISUAL_GUIDE.md
```

---

## 📋 Requisitos

- Una cuenta **Google** (Gmail gratuito funciona)
- Navegador web moderno
- Conexión a internet

---

## 🎬 Proceso de Instalación (Resumen)

### 1️⃣ Preparar Google Drive
```
1. Crea una carpeta: "FENIFISC-Inscripciones-2026"
2. Dentro, crea 3 subcarpetas:
   - Selfies
   - Cedulas-Frente
   - Cedulas-Reverso
3. Copia los FOLDER_IDs (de la URL)
```

### 2️⃣ Crear Google Sheet
```
1. sheets.google.com → Nuevo Spreadsheet
2. Nombra: "Inscripciones Campeonato Nacional Potosi, Rivas 2026"
3. Crea los encabezados (ver documentación)
4. Copia el SHEET_ID
```

### 3️⃣ Crear Google Apps Script
```
1. Abre el Google Sheet
2. Herramientas → Editor de secuencias de comandos
3. Copia el código (ver GOOGLE_APPS_SCRIPT_SETUP.md)
4. Reemplaza los IDs
5. Guarda (Ctrl+S)
```

### 4️⃣ Desplegar Script
```
1. Nuevo despliegue → Aplicación web
2. Ejecutar como: Tu cuenta
3. Quién tiene acceso: Cualquiera
4. Desplegar
5. Copia la URL (GOOGLE_SCRIPT_URL)
```

### 5️⃣ Conectar con Formulario
```
1. Abre: src/App.tsx
2. Busca: const GOOGLE_SCRIPT_URL = "..."
3. Reemplaza con tu URL
4. Guarda el archivo
```

### 6️⃣ Probar
```
1. npm run dev
2. Completa el formulario
3. Verifica Google Sheets y Drive
```

---

## 📊 Estructura de Datos

### Que se guarda en Google Sheets
```
Timestamp | Nombre | Cédula | Sexo | Email | Teléfono | Peso | Estatura | Team/Gym | Foto Selfie | Cédula Frente | Cédula Reverso | ...
```

### Que se guarda en Google Drive
```
FENIFISC-Inscripciones-2026/
├── Selfies/
│   └── 001-120695-0001A_selfie.jpg
├── Cedulas-Frente/
│   └── 001-120695-0001A_cedula_frente.jpg
└── Cedulas-Reverso/
    └── 001-120695-0001A_cedula_reverso.jpg
```

---

## 🔑 IDs Necesarios

| ID | Dónde lo encuentras | Ejemplo |
|----|-------------------|---------|
| **SHEET_ID** | URL del Sheet: `/d/[AQUI]/edit` | `1A2B3C4D5E6F7G8H9I0J` |
| **FOLDER_ID** | URL de Drive: `/folders/[AQUI]` | `2X3Y4Z5A6B7C8D9E0F1G` |
| **DEPLOYMENT_ID** | URL del despliegue: `/s/[AQUI]/` | `AKfycbAbCd...` |

---

## 📁 Archivos del Proyecto

### Documentación (IMPORTANTE - Lee esto)
- 📖 **GOOGLE_APPS_SCRIPT_SETUP.md** - Guía completa y detallada
- ⚡ **GOOGLE_APPS_SCRIPT_QUICK_START.md** - Guía rápida (5 min)
- 📸 **GOOGLE_APPS_SCRIPT_VISUAL_GUIDE.md** - Guía con ejemplos visuales
- 📚 **REFERENCE_GUIDE.md** - Guía de referencia técnica
- 📄 **README.md** - Este archivo

### Código Fuente
- 🎨 **src/App.tsx** - Componente principal del formulario
- 🎯 **index.html** - HTML principal
- 🛠️ **vite.config.ts** - Configuración de Vite
- 🎨 **tailwind.config.ts** - Configuración de Tailwind

### Generado al compilar
- 📦 **dist/index.html** - Sitio compilado (listo para desplegar)

---

## 🖥️ Tecnologías Usadas

- **React 18** - Framework de UI
- **TypeScript** - Tipado seguro
- **Tailwind CSS** - Estilos modernos
- **Vite** - Bundler ultra-rápido
- **Lucide React** - Iconos
- **Google Sheets** - Base de datos
- **Google Drive** - Almacenamiento de fotos
- **Google Apps Script** - Backend sin servidor

---

## 📱 Características de Diseño

### 🎨 Diseño
- Tema oscuro profesional con acentos dorados
- **Logo FENIFISC** mejorado y prominente
- Degradados suaves y sombras modernas

- Protegido bajo reglas IFBB
- Organizado por FENIFISC, IND y Alcaldia Municipal de Potosi, Rivas
- Los datos de los inscritos son confidenciales
- Las fotos son para verificación de identidad

---

## 🎯 Próximos Pasos

1. **Lee una de las 3 guías** (elige la que prefieras)
2. **Crea los recursos en Google** (Sheet, Drive, Script)
3. **Conecta el script a tu formulario**
4. **Prueba el sistema**
5. **Comparte el link con los atletas**
6. **¡Listo para recibir inscripciones!**

---

## ✨ ¿Necesitas ayuda?

1. **Guía rápida (5 min):** GOOGLE_APPS_SCRIPT_QUICK_START.md
2. **Guía visual:** GOOGLE_APPS_SCRIPT_VISUAL_GUIDE.md
3. **Guía completa:** GOOGLE_APPS_SCRIPT_SETUP.md
4. **Referencia técnica:** REFERENCE_GUIDE.md
5. **Email:** fenific@gmail.com

---

## 🏆 ¡Que comience el Campeonato!

**Versión:** 1.0
**Actualizado:** 23 de Marzo, 2026
**Estado:** Listo para Producción

¡Bienvenidos al Campeonato Nacional Potosi, Rivas 2026! 🎉

