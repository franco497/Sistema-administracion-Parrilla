// src/services/pdfService.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ✅ FUNCIÓN MEJORADA: Limpiar texto completamente
const limpiarTexto = (texto) => {
  if (!texto) return "";

  // Convertir a string
  let limpio = texto.toString();

  // ✅ ELIMINAR CARACTERES DE CONTROL Y BOM
  // Eliminar BOM (Byte Order Mark) y caracteres no imprimibles
  limpio = limpio.replace(/^[\uFEFF\uFFFE\u200B\u2060\uFEFF]+/, "");

  // Eliminar caracteres de control (excepto espacios, saltos de línea básicos)
  limpio = limpio.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Eliminar caracteres raros al inicio
  limpio = limpio.replace(/^[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s,.!¡?¿-]+/, "");

  // Normalizar espacios
  limpio = limpio.trim();

  return limpio;
};

// Formatear moneda
const formatearMoneda = (monto) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monto);
};

// Formatear fecha
const formatearFecha = (fecha) => {
  return new Intl.DateTimeFormat("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fecha));
};

// ✅ Función para texto seguro en PDF
const textoParaPDF = (texto) => {
  if (!texto) return "";
  // Limpiar y eliminar cualquier carácter que pueda causar problemas
  return limpiarTexto(texto)
    .replace(/\s+/g, " ") // Múltiples espacios a uno
    .trim();
};

// Función para generar factura
export const generarFacturaPDF = (
  pedido,
  items,
  mesaNumero,
  cliente = null,
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 15;
  const marginRight = 15;
  const tableWidth = pageWidth - marginLeft - marginRight;

  // ==========================================
  // HEADER - FACTURA
  // ==========================================
  doc.setFontSize(24);
  doc.setTextColor(200, 70, 0);
  // ✅ TEXTO SEGURO
  doc.text("Parrilla Milver", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(16);
  doc.setTextColor(50);
  doc.text("FACTURA", pageWidth / 2, 32, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `N° Factura: F-${String(pedido.id_pedido).padStart(6, "0")}`,
    pageWidth / 2,
    40,
    { align: "center" },
  );

  // Línea decorativa
  doc.setDrawColor(200, 70, 0);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, 45, pageWidth - marginRight, 45);

  // ==========================================
  // DATOS DEL CLIENTE
  // ==========================================
  let yPos = 55;
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text("DATOS DEL CLIENTE:", marginLeft, yPos);

  yPos += 6;
  doc.setFontSize(10);
  doc.setTextColor(50);
  // ✅ TEXTO SEGURO
  const nombreCliente = textoParaPDF(cliente?.nombre || "Consumidor Final");
  doc.text(`Nombre: ${nombreCliente}`, marginLeft, yPos);

  yPos += 5;
  doc.text(`Mesa: ${mesaNumero}`, marginLeft, yPos);

  yPos += 5;
  const fechaLimpia = textoParaPDF(formatearFecha(pedido.created_at));
  doc.text(`Fecha: ${fechaLimpia}`, marginLeft, yPos);

  yPos += 10;
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += 8;

  // ==========================================
  // DETALLE DE PRODUCTOS
  // ==========================================
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text("DETALLE DE PRODUCTOS", marginLeft, yPos);
  yPos += 6;

  // ✅ TEXTO SEGURO en productos
  const tableHeaders = ["Cant.", "Producto", "Precio", "Total"];
  const tableData = items.map((item) => {
    const nombreProducto = textoParaPDF(item.productos?.nombre || "Producto");
    return [
      `${item.cantidad}x`,
      nombreProducto,
      formatearMoneda(item.precio_unitario),
      formatearMoneda(item.subtotal),
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [tableHeaders],
    body: tableData,
    theme: "striped",
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [200, 70, 0],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { cellWidth: 20, halign: "center" },
      1: { cellWidth: "auto", halign: "left" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },
    margin: { left: marginLeft, right: marginRight },
    tableWidth: tableWidth,
    didDrawPage: (data) => {
      yPos = data.cursor.y;
    },
  });

  // ==========================================
  // RESUMEN DE PAGO
  // ==========================================
  yPos += 10;

  // Línea separadora
  doc.setDrawColor(200, 70, 0);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - 80, yPos, pageWidth - marginRight, yPos);
  yPos += 6;

  // Total
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("TOTAL A PAGAR:", pageWidth - 80, yPos);
  doc.setFontSize(16);
  doc.setTextColor(200, 70, 0);
  doc.setFont(undefined, "bold");
  doc.text(formatearMoneda(pedido.total), pageWidth - marginRight, yPos, {
    align: "right",
  });
  doc.setFont(undefined, "normal");

  yPos += 12;
  doc.setDrawColor(200, 70, 0);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += 10;

  // ==========================================
  // PIE DE PÁGINA
  // ==========================================
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text("¡Gracias por elegirnos!", pageWidth / 2, yPos, { align: "center" });

  yPos += 5;
  doc.setFontSize(8);
  doc.text(
    "Parrilla Milver - Todos los derechos reservados",
    pageWidth / 2,
    yPos,
    { align: "center" },
  );

  // ==========================================
  // DESCARGAR PDF
  // ==========================================
  const nombreArchivo = `Factura_${pedido.id_pedido}_Mesa_${mesaNumero}.pdf`;
  doc.save(nombreArchivo);
};

// Función para generar ticket pequeño (formato térmico)
export const generarTicketPDF = (
  pedido,
  items,
  mesaNumero,
  cliente = null,
  mozo = null,
) => {
  // 📏 CONFIGURACIÓN PARA IMPRESORA TÉRMICA 58mm
  const doc = new jsPDF({
    unit: "mm",
    format: [58, 250],
    compress: true,
  });

  const pageWidth = 58;
  const margin = 3;
  const maxWidth = pageWidth - margin * 2;

  // ==========================================
  // HEADER - LOGO Y TÍTULO
  // ==========================================
  let yPos = 5;

  // Título principal (centrado)
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Parrilla Milver", pageWidth / 2, yPos, { align: "center" });

  yPos += 5;

  // Línea separadora (punteada)
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  doc.setLineDashPattern([], 0);

  yPos += 4;

  // ==========================================
  // DATOS DEL PEDIDO
  // ==========================================
  doc.setFontSize(8);
  doc.setTextColor(50);

  // Número de pedido y mesa
  const pedidoTexto = `#${pedido.id_pedido}  |  Mesa ${mesaNumero}`;
  doc.text(pedidoTexto, pageWidth / 2, yPos, { align: "center" });

  yPos += 4;

  // Fecha
  const fechaLimpia = textoParaPDF(formatearFecha(pedido.created_at));
  doc.text(fechaLimpia, pageWidth / 2, yPos, { align: "center" });

  yPos += 4;

  // ✅ CLIENTE (igual que antes)
  const nombreCliente = textoParaPDF(cliente?.nombre || "Consumidor Final");
  doc.text(`Cliente: ${nombreCliente}`, margin, yPos);

  yPos += 4;

  // ✅ MOZO (NUEVO)
  const nombreMozo = textoParaPDF(mozo || "Sin mozo asignado");
  doc.text(`Mozo: ${nombreMozo}`, margin, yPos);

  yPos += 5;

  // Línea separadora
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 4;

  // ==========================================
  // ENCABEZADO DE PRODUCTOS
  // ==========================================
  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.setFont(undefined, "bold");

  // Cabecera: Cantidad, Producto, Total
  const colCant = 8;
  const colProducto = 32;
  const colTotal = 12;

  doc.text("Cant", margin, yPos);
  doc.text("Producto", margin + colCant, yPos);
  doc.text("Total", pageWidth - margin, yPos, { align: "right" });

  yPos += 3;
  doc.setDrawColor(200);
  doc.setLineWidth(0.2);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 3;

  // ==========================================
  // LISTA DE PRODUCTOS
  // ==========================================
  doc.setFontSize(7);
  doc.setFont(undefined, "normal");
  doc.setTextColor(30);

  items.forEach((item) => {
    const nombreProducto = textoParaPDF(item.productos?.nombre || "Producto");
    const cantidad = item.cantidad;
    const subtotal = formatearMoneda(item.subtotal);

    // Producto y cantidad en la misma línea
    const lineaProducto = `${cantidad}x ${nombreProducto}`;
    const textWidth = doc.getTextWidth(lineaProducto);

    // Si el producto es muy largo, truncar
    let textoMostrar = lineaProducto;
    if (textWidth > maxWidth - colTotal - 4) {
      while (
        doc.getTextWidth(textoMostrar + "...") > maxWidth - colTotal - 4 &&
        textoMostrar.length > 5
      ) {
        textoMostrar = textoMostrar.slice(0, -1);
      }
      textoMostrar = textoMostrar + "...";
    }

    doc.text(textoMostrar, margin, yPos);
    doc.text(subtotal, pageWidth - margin, yPos, { align: "right" });

    yPos += 4;

    if (yPos > 220) {
      doc.addPage();
      yPos = 5;
    }
  });

  yPos += 3;

  // Línea separadora
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 4;

  // ==========================================
  // RESUMEN DE PAGO
  // ==========================================

  // Subtotal
  doc.setFontSize(8);
  doc.setTextColor(80);
  doc.text("Subtotal:", margin, yPos);
  doc.text(formatearMoneda(pedido.total), pageWidth - margin, yPos, {
    align: "right",
  });

  yPos += 4;

  // Línea separadora
  doc.setDrawColor(200);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  doc.setLineDashPattern([], 0);
  yPos += 4;

  // TOTAL (destacado)
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.setFont(undefined, "bold");
  doc.text("TOTAL:", margin, yPos);
  doc.text(formatearMoneda(pedido.total), pageWidth - margin, yPos, {
    align: "right",
  });
  doc.setFont(undefined, "normal");

  yPos += 6;

  // Línea separadora final
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // ==========================================
  // PIE DE PÁGINA
  // ==========================================
  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text("¡Gracias por su visita!", pageWidth / 2, yPos, { align: "center" });

  yPos += 4;
  doc.setFontSize(6);
  doc.setTextColor(150);
  doc.text(
    "Parrilla Milver - Todos los derechos reservados",
    pageWidth / 2,
    yPos,
    { align: "center" },
  );

  // ==========================================
  // DESCARGAR TICKET
  // ==========================================
  const nombreArchivo = `Ticket_${pedido.id_pedido}_Mesa_${mesaNumero}.pdf`;
  doc.save(nombreArchivo);
};

// Función para generar comprobante simple
export const generarPDFPedido = (pedido, items, mesaNumero) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 15;
  const marginRight = 15;
  const tableWidth = pageWidth - marginLeft - marginRight;

  // Header - TEXTO SEGURO
  doc.setFontSize(22);
  doc.setTextColor(200, 70, 0);
  doc.text("Parrilla Milver", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(100);
  doc.text("Comprobante de Pedido", pageWidth / 2, 30, { align: "center" });

  doc.setDrawColor(200, 70, 0);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, 35, pageWidth - marginRight, 35);

  let yPos = 45;

  // Información del pedido - TEXTO SEGURO
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Pedido #${pedido.id_pedido}`, marginLeft, yPos);
  doc.text(`Mesa ${mesaNumero}`, pageWidth - marginRight, yPos, {
    align: "right",
  });

  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(80);
  const fechaLimpia = textoParaPDF(formatearFecha(pedido.created_at));
  doc.text(`Fecha: ${fechaLimpia}`, marginLeft, yPos);

  yPos += 8;
  doc.text(`Estado: ${pedido.estado.toUpperCase()}`, marginLeft, yPos);

  yPos += 10;
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += 8;

  // Tabla de items - TEXTO SEGURO
  const tableHeaders = ["Cant.", "Producto", "Precio Unit.", "Subtotal"];
  const tableData = items.map((item) => {
    const nombreProducto = textoParaPDF(item.productos?.nombre || "Producto");
    return [
      item.cantidad,
      nombreProducto,
      formatearMoneda(item.precio_unitario),
      formatearMoneda(item.subtotal),
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [tableHeaders],
    body: tableData,
    theme: "striped",
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [200, 70, 0],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: "bold",
    },
    bodyStyles: {
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { cellWidth: 18, halign: "center" },
      1: { cellWidth: "auto", halign: "left" },
      2: { cellWidth: 38, halign: "right" },
      3: { cellWidth: 38, halign: "right" },
    },
    margin: { left: marginLeft, right: marginRight },
    tableWidth: tableWidth,
    didDrawPage: (data) => {
      yPos = data.cursor.y;
    },
  });

  yPos += 10;

  // Total
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - 80, yPos, pageWidth - marginRight, yPos);
  yPos += 6;

  doc.setFontSize(14);
  doc.setTextColor(200, 70, 0);
  doc.setFont(undefined, "bold");
  doc.text("TOTAL:", pageWidth - 80, yPos);
  doc.text(formatearMoneda(pedido.total), pageWidth - marginRight, yPos, {
    align: "right",
  });
  doc.setFont(undefined, "normal");

  yPos += 12;
  doc.setDrawColor(200, 70, 0);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += 10;

  // Pie
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("¡Gracias por su visita!", pageWidth / 2, yPos, { align: "center" });

  doc.save(`Pedido_${pedido.id_pedido}_Mesa_${mesaNumero}.pdf`);
};
