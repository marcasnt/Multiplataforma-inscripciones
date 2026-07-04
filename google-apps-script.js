// ============================================================
// CONFIGURACIÓN - REEMPLAZA ESTOS VALORES
// ============================================================

const SHEET_ID = "1NayeOJSdWubRdJbDWKjoMbnTp0Y3KbZ-YhSrC75s5XM";  // ID del Google Sheet oficial

// ID de la carpeta principal de Google Drive donde se guardarán las fotos de los atletas
const MAIN_DRIVE_FOLDER_ID = "1aYiUgtltUMAPntJ6WLlAnFV0gOruiV-l";

// Email para notificaciones
const ADMIN_EMAIL = "marcasnt@gmail.com";

// ============================================================
// FUNCIÓN PRINCIPAL GET: Obtener eventos activos
// ============================================================

function doGet(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    let sheet = spreadsheet.getSheetByName("Eventos");
    
    // Si la pestaña de "Eventos" no existe, la inicializamos con datos de ejemplo de Julio y Agosto
    if (!sheet) {
      sheet = spreadsheet.insertSheet("Eventos");
      inicializarEventosDemo(sheet);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const activeEvents = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const event = {};
      
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        let val = row[j];
        
        // Formatear fechas para evitar problemas de zona horaria o de tipo en JS/React
        if (val instanceof Date) {
          val = val.toISOString().split('T')[0];
        }
        event[header] = val;
      }
      
      // Validar si el evento está activo (compara si es "SÍ" o "SI" de manera tolerante)
      const activoStr = event.activo ? event.activo.toString().toUpperCase().trim() : "";
      if (activoStr === "SÍ" || activoStr === "SI") {
        activeEvents.push(event);
      }
    }
    
    // Devolver JSON con CORS habilitado por Google
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      eventos: activeEvents
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// FUNCIÓN PARA EJECUTAR MANUALMENTE EN EL DROPDOWN (SIN PARÁMETROS)
// ============================================================

function inicializarEventosManual() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName("Eventos");
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet("Eventos");
  } else {
    sheet.clear(); // Limpia la hoja si ya existe para no duplicar
  }
  
  inicializarEventosDemo(sheet);
  Logger.log("✅ Pestaña 'Eventos' inicializada con éxito.");
}

// ============================================================
// FUNCIÓN AUXILIAR: Inicializar eventos por defecto
// ============================================================

function inicializarEventosDemo(sheet) {
  const headers = ["id", "nombre", "fecha", "lugar", "limiteInscripcion", "sheetName", "horaPesaje", "activo"];
  sheet.appendRow(headers);
  
  const demoEvents = [
    [
      "1", 
      "Copa Regional del Pacífico 2026", 
      "2026-07-12", 
      "Polideportivo Alexis Argüello, Managua", 
      "2026-07-06", 
      "Pacífico_12-07-2026", 
      "12:00 MD a 3:00 PM", 
      "SÍ"
    ],
    [
      "2", 
      "Campeonato Departamental de León 2026", 
      "2026-07-26", 
      "Auditorio Ruiz Ayesta, León", 
      "2026-07-20", 
      "León_26-07-2026", 
      "12:00 MD a 3:00 PM", 
      "SÍ"
    ],
    [
      "3", 
      "Campeonato Regional del Sur 2026 (Rivas)", 
      "2026-08-16", 
      "Gimnasio Humberto Mendez, Rivas", 
      "2026-08-10", 
      "Sur_Rivas_16-08-2026", 
      "12:00 MD a 3:00 PM", 
      "SÍ"
    ],
    [
      "4", 
      "Copa Nacional de Fisicoculturismo FENIFISC 2026", 
      "2026-08-30", 
      "Centro de Convenciones Olof Palme, Managua", 
      "2026-08-24", 
      "Copa_Nacional_30-08-2026", 
      "11:00 AM a 2:00 PM", 
      "SÍ"
    ]
  ];
  
  for (let i = 0; i < demoEvents.length; i++) {
    sheet.appendRow(demoEvents[i]);
  }
  
  // Dar formato visual
  sheet.getRange("A1:H1").setFontWeight("bold");
  sheet.autoResizeColumns();
}

// ============================================================
// FUNCIÓN PRINCIPAL POST: recibir datos del formulario e inscribir
// ============================================================

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    
    // Obtener carpeta principal y crear subcarpeta para el atleta
    const parentFolder = DriveApp.getFolderById(MAIN_DRIVE_FOLDER_ID);
    const athleteFolderName = `${payload.nombreCompleto.trim()} - ${payload.cedula.trim()}`;
    const athleteFolder = parentFolder.createFolder(athleteFolderName);
    const athleteFolderId = athleteFolder.getId();
    
    // Procesar fotos una sola vez y guardarlas en la carpeta del atleta
    const fotoSelfieUrl = procesarFoto(
      payload.fotoSelfie.base64, 
      `${payload.cedula}_selfie.jpg`,
      athleteFolderId
    );
    
    const fotoCedulaFrenteUrl = procesarFoto(
      payload.fotoCedulaFrente.base64,
      `${payload.cedula}_cedula_frente.jpg`,
      athleteFolderId
    );
    
    const fotoCedulaReversoUrl = procesarFoto(
      payload.fotoCedulaReverso.base64,
      `${payload.cedula}_cedula_reverso.jpg`,
      athleteFolderId
    );
    
    // Preparar fila común para Google Sheets
    const row = [
      payload.timestamp || new Date().toLocaleString("es-NI", { timeZone: "America/Managua" }),
      payload.nombreCompleto,
      payload.cedula,
      payload.sexo === "masculino" ? "M" : "F",
      payload.edad || calcularEdad(payload.fechaNacimiento),
      payload.fechaNacimiento,
      payload.telefono,
      payload.email,
      payload.departamento,
      payload.ciudad,
      payload.direccion,
      payload.club || (payload.atletaLibre ? "ATLETA LIBRE" : ""),
      payload.atletaLibre ? "SÍ" : "NO",
      payload.entrenador || "",
      payload.telefonoEntrenador || "",
      payload.experienciaEntrenador || "",
      payload.pesoActual,
      payload.estatura,
      payload.contactoEmergencia,
      payload.telefonoEmergencia,
      payload.parentesco || "",
      fotoSelfieUrl,
      fotoCedulaFrenteUrl,
      fotoCedulaReversoUrl
    ];
    
    // Lista de eventos seleccionados enviados por el frontend
    const eventosSeleccionados = payload.eventosSeleccionados || [];
    
    if (eventosSeleccionados.length === 0) {
      throw new Error("Debe seleccionar al menos una competencia para inscribirse");
    }
    
    // Registrar en cada pestaña de evento escogido
    for (let i = 0; i < eventosSeleccionados.length; i++) {
      const evento = eventosSeleccionados[i];
      agregarFila(row, evento.sheetName);
    }
    
    // Enviar notificación al administrador consolidando los eventos elegidos
    if (ADMIN_EMAIL && ADMIN_EMAIL !== "tu_email@gmail.com") {
      enviarNotificacion(payload, fotoSelfieUrl);
    }
    
    // Respuesta exitosa
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Inscripción registrada correctamente en todos los eventos seleccionados",
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log("Error: " + error);
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// FUNCIÓN: Calcular edad a partir de fecha de nacimiento
// ============================================================

function calcularEdad(fechaNacimiento) {
  try {
    const birthDate = new Date(fechaNacimiento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age.toString();
  } catch (error) {
    return "";
  }
}

// ============================================================
// FUNCIÓN: Procesar y guardar foto en Google Drive
// ============================================================

function procesarFoto(base64String, nombreArchivo, folderId) {
  try {
    // Limpiar el base64 si tiene prefijo
    let cleanBase64 = base64String;
    if (base64String.startsWith('data:image/')) {
      cleanBase64 = base64String.split(',')[1];
    }
    
    // Decodificar Base64
    const binaryString = Utilities.base64Decode(cleanBase64);
    const blob = Utilities.newBlob(binaryString, "image/jpeg", nombreArchivo);
    
    // Obtener carpeta y guardar archivo
    const folder = DriveApp.getFolderById(folderId);
    const file = folder.createFile(blob);
    
    // Obtener URL de descarga
    const fileUrl = file.getUrl();
    
    Logger.log(`Foto guardada: ${nombreArchivo} - ${fileUrl}`);
    return fileUrl;
    
  } catch (error) {
    Logger.log("Error procesando foto: " + error);
    return "Error al guardar";
  }
}

// ============================================================
// FUNCIÓN: Agregar fila a una pestaña específica de Google Sheets
// ============================================================

function agregarFila(row, sheetName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    // Si la hoja no existe, crearla dinámicamente
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      setupSheet(sheet);
    }
    
    // Obtener última fila y agregar nueva
    const lastRow = sheet.getLastRow();
    const range = sheet.getRange(lastRow + 1, 1, 1, row.length);
    range.setValues([row]);
    
    Logger.log(`Fila ${lastRow + 1} agregada exitosamente en pestaña: ${sheetName}`);
    
  } catch (error) {
    Logger.log(`Error agregando fila en pestaña ${sheetName}: ` + error);
    throw error;
  }
}

// ============================================================
// FUNCIÓN: Configurar hoja con encabezados
// ============================================================

function setupSheet(sheet) {
  const headers = [
    "Timestamp", "Nombre", "Cédula", "Sexo", "Edad", "Fecha Nac", "Teléfono", "Email", 
    "Depto", "Ciudad", "Dirección", "Club", "Atleta Libre", "Entrenador", "Telf Entrenador", 
    "Años Exp", "Peso (Kg)", "Estatura (Mt)", "Emergencia", "Telf Emerg", "Parentesco", 
    "Selfie URL", "Cédula Frente URL", "Cédula Reverso URL"
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  sheet.autoResizeColumns();
}

// ============================================================
// FUNCIÓN: Enviar notificación consolidada por email
// ============================================================

function enviarNotificacion(payload, fotoSelfieUrl) {
  try {
    const eventosNombres = payload.eventosSeleccionados.map(function(e) { return e.nombre; }).join(", ");
    const asunto = `✅ Inscripción Multi-evento: ${payload.nombreCompleto}`;
    
    let eventosHtml = "<ul>";
    payload.eventosSeleccionados.forEach(function(e) {
      eventosHtml += `<li><strong>${e.nombre}</strong> (Pestaña: ${e.sheetName})</li>`;
    });
    eventosHtml += "</ul>";

    const cuerpo = `
      <h2>🏆 Inscripción Registrada - FENIFISC 2026</h2>
      <p><strong>Atleta:</strong> ${payload.nombreCompleto}</p>
      <p><strong>Cédula:</strong> ${payload.cedula}</p>
      <p><strong>Eventos Inscritos:</strong></p>
      ${eventosHtml}
      <p><strong>Sexo:</strong> ${payload.sexo}</p>
      <p><strong>Teléfono:</strong> ${payload.telefono}</p>
      <p><strong>Email:</strong> ${payload.email || "No proporcionado"}</p>
      <p><strong>Club/Team:</strong> ${payload.atletaLibre ? "Atleta Libre" : (payload.club || "No especificado")}</p>
      <p><strong>Peso Actual:</strong> ${payload.pesoActual} Kg</p>
      <p><strong>Estatura:</strong> ${payload.estatura} Mt</p>
      <p><strong>Contacto Emergencia:</strong> ${payload.contactoEmergencia} (${payload.telefonoEmergencia})</p>
      <hr>
      <p><em>📸 Fotos procesadas y almacenadas en Google Drive</em></p>
      <p><a href="${fotoSelfieUrl}">Ver Selfie en Drive</a></p>
    `;
    
    MailApp.sendEmail(ADMIN_EMAIL, asunto, "", { htmlBody: cuerpo });
    Logger.log("Notificación unificada enviada a " + ADMIN_EMAIL);
    
  } catch (error) {
    Logger.log("Error enviando email: " + error);
  }
}
