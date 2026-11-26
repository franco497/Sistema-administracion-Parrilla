// src/services/cierreCajaService.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- Helpers (mismos que pdfService.js) ---
const limpiarTexto = (texto) => {
  if (!texto) return "";
  let limpio = texto.toString();
  limpio = limpio.replace(/^[\uFEFF\uFFFE\u200B\u2060\uFEFF]+/, "");
  limpio = limpio.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  limpio = limpio.replace(/^[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s,.!¡?¿-]+/, "");
  return limpio.trim();
};

const formatearMoneda = (monto) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monto || 0);

const formatearFecha = (fecha) =>
  new Intl.DateTimeFormat("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(fecha));

const textoParaPDF = (texto) => {
  if (!texto) return "";
  return limpiarTexto(texto).replace(/\s+/g, " ").trim();
};

/**
 * @param {Object} resumen  - snapshot del cierre o ventas del día
 * @param {Object} meta     - { cerradoPor, cerradoAt, esCierreOficial }
 */
export const generarPDFCierreCaja = (resumen, meta = {}) => {
  const {
    fecha,
    totalDia,
    cantidadPedidos,
    ticketPromedio,
    topProductos,
    desgloseCategorias,
    pedidos,
  } = resumen;

  const { cerradoPor = null, cerradoAt = null, esCierreOficial = false } = meta;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 15;
  const marginRight = 15;
  const tableWidth = pageWidth - marginLeft - marginRight;

  const fechaLegible = textoParaPDF(formatearFecha(`${fecha}T12:00:00-03:00`));
  const generado = new Intl.DateTimeFormat("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());

  // HEADER
  doc.setFontSize(24);
  doc.setTextColor(200, 70, 0);
  doc.text("Parrilla Milver", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(16);
  doc.setTextColor(50);
  doc.text(
    esCierreOficial ? "CIERRE DE CAJA OFICIAL" : "REPORTE DE VENTAS DEL DÍA",
    pageWidth / 2,
    30,
    { align: "center" },
  );

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Fecha: ${fechaLegible}`, pageWidth / 2, 38, { align: "center" });
  doc.text(`Generado: ${generado}`, pageWidth / 2, 43, { align: "center" });

  if (esCierreOficial && cerradoAt) {
    const cerradoFormateado = new Intl.DateTimeFormat("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(cerradoAt));

    doc.text(`Cerrado: ${cerradoFormateado}`, pageWidth / 2, 48, {
      align: "center",
    });
    if (cerradoPor) {
      doc.text(`Operador: ${textoParaPDF(cerradoPor)}`, pageWidth / 2, 53, {
        align: "center",
      });
    }
  }

  doc.setDrawColor(200, 70, 0);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, 58, pageWidth - marginRight, 58);

  // RESUMEN
  autoTable(doc, {
    startY: 64,
    head: [["RESUMEN", ""]],
    body: [
      ["Total del día", formatearMoneda(totalDia)],
      ["Cantidad de pedidos", String(cantidadPedidos)],
      ["Ticket promedio", formatearMoneda(ticketPromedio)],
    ],
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: {
      fillColor: [200, 70, 0],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 90 } },
    margin: { left: marginLeft, right: marginRight },
    tableWidth: tableWidth,
  });

  // DESGLOSE POR CATEGORÍA
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [["Categoría", "Cantidad", "Total"]],
    body: desgloseCategorias.map((c) => [
      textoParaPDF(c.nombre),
      String(c.cantidad),
      formatearMoneda(c.total),
    ]),
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255] },
    columnStyles: {
      1: { halign: "center", cellWidth: 30 },
      2: { halign: "right", cellWidth: 45 },
    },
    margin: { left: marginLeft, right: marginRight },
    tableWidth: tableWidth,
  });

  // TOP PRODUCTOS
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [["#", "Producto", "Cant.", "Total"]],
    body: topProductos.map((p, i) => [
      String(i + 1),
      textoParaPDF(p.nombre),
      String(p.cantidad),
      formatearMoneda(p.total),
    ]),
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 40, halign: "right" },
    },
    margin: { left: marginLeft, right: marginRight },
    tableWidth: tableWidth,
  });

  // DETALLE DE PEDIDOS
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [["Pedido", "Hora pago", "Mesa", "Total"]],
    body: pedidos.map((p) => [
      `#${p.id_pedido}`,
      new Date(p.fecha_pago || p.fecha_hora).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      String(p.id_mesa),
      formatearMoneda(p.total),
    ]),
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: {
      fillColor: [200, 70, 0],
      textColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 25, halign: "center" },
      3: { halign: "right" },
    },
    margin: { left: marginLeft, right: marginRight },
    tableWidth: tableWidth,
  });

  // FIRMA
  let y = doc.lastAutoTable.finalY + 20;
  if (y > 270) {
    doc.addPage();
    y = 30;
  }
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text("Firma: _______________________________", marginLeft, y);
  doc.text("Aclaración: __________________________", marginLeft, y + 10);

  // PIE
  y += 22;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Parrilla Milver - Cierre de Caja", pageWidth / 2, y, {
    align: "center",
  });

  const nombreArchivo = esCierreOficial
    ? `Cierre_Caja_Oficial_${fecha}.pdf`
    : `Reporte_Ventas_${fecha}.pdf`;
  doc.save(nombreArchivo);
};
