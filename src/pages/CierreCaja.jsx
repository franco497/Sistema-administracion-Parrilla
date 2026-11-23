// src/pages/CierreCaja.jsx
import React, { useState, useEffect } from "react";
import { useRestaurante } from "../context/RestauranteContext";
import { generarPDFCierreCaja } from "../services/cierreCajaService";
import "./CierreCaja.css";

const hoyArgentina = () => {
  const now = new Date();
  const art = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return art.toISOString().slice(0, 10);
};

const CierreCaja = ({ onVolver }) => {
  const {
    obtenerVentasDelDia,
    obtenerCierrePorFecha,
    cerrarCajaDelDia,
    session,
  } = useRestaurante();

  const [fecha, setFecha] = useState(hoyArgentina());
  const [resumen, setResumen] = useState(null);
  const [cierre, setCierre] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [cerrando, setCerrando] = useState(false);

  const cargar = async (f) => {
    setLoading(true);
    setMensaje("🔄 Cargando...");
    setResumen(null);
    setCierre(null);

    const cierreResult = await obtenerCierrePorFecha(f);

    if (cierreResult.success && cierreResult.data) {
      setCierre(cierreResult.data);
      setResumen(cierreResult.data.snapshot);
      setMensaje("🔒 Este día ya fue cerrado");
    } else {
      const ventasResult = await obtenerVentasDelDia(f);
      if (ventasResult.success) {
        setResumen(ventasResult.data);
        setMensaje(
          ventasResult.data.cantidadPedidos === 0
            ? "ℹ️ Sin ventas registradas para esta fecha"
            : `✅ ${ventasResult.data.cantidadPedidos} pedidos en el día`,
        );
      } else {
        setMensaje(`❌ Error: ${ventasResult.error}`);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    cargar(fecha);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha]);

  const handleCerrarCaja = async () => {
    if (!resumen || resumen.cantidadPedidos === 0) return;

    const confirmar = confirm(
      `¿Cerrar la caja del ${fecha}?\n\n` +
        `Total: $${resumen.totalDia.toLocaleString("es-AR")}\n` +
        `Pedidos: ${resumen.cantidadPedidos}\n\n` +
        `⚠️ El cierre es INMUTABLE: no se puede deshacer.`,
    );
    if (!confirmar) return;

    setCerrando(true);
    setMensaje("🔄 Cerrando caja...");

    const result = await cerrarCajaDelDia(fecha);
    if (result.success) {
      setMensaje("✅ Caja cerrada correctamente");
      await cargar(fecha);
    } else {
      setMensaje(`❌ ${result.error}`);
    }
    setCerrando(false);
  };

  const handleExportar = () => {
    if (!resumen || resumen.cantidadPedidos === 0) return;
    generarPDFCierreCaja(resumen, {
      esCierreOficial: !!cierre,
      cerradoPor: cierre?.cerrado_por_email || null,
      cerradoAt: cierre?.cerrado_at || null,
    });
  };

  return (
    <div className="cierre-caja-container">
      <div className="cierre-header">
        <button className="btn-volver" onClick={onVolver}>
          ⬅ Volver al Menú
        </button>
        <h1>💰 Cierre de Caja</h1>
        {cierre && <span className="badge-cerrado">🔒 Cerrado</span>}
      </div>

      <div className="filtro-fecha">
        <label>Fecha:</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
        <button onClick={() => setFecha(hoyArgentina())}>Hoy</button>
      </div>

      {mensaje && <div className="mensaje-estado">{mensaje}</div>}
      {loading && <div className="loading">⏳ Cargando...</div>}

      {!loading && resumen && (
        <>
          {cierre && (
            <div className="aviso-cierre">
              🔒 Cerrado el{" "}
              {new Date(cierre.cerrado_at).toLocaleString("es-AR")}
              {cierre.cerrado_por_email && ` por ${cierre.cerrado_por_email}`}
            </div>
          )}

          <div className="resumen-cards">
            <div className="card-total">
              <span>Total del día</span>
              <strong>$ {resumen.totalDia.toLocaleString("es-AR")}</strong>
            </div>
            <div className="card-pedidos">
              <span>Pedidos</span>
              <strong>{resumen.cantidadPedidos}</strong>
            </div>
            <div className="card-promedio">
              <span>Ticket promedio</span>
              <strong>
                $ {Math.round(resumen.ticketPromedio).toLocaleString("es-AR")}
              </strong>
            </div>
          </div>

          {resumen.cantidadPedidos === 0 ? (
            <div className="sin-ventas">
              📭 No hay ventas registradas para esta fecha.
            </div>
          ) : (
            <>
              <div className="seccion">
                <h2>📂 Por categoría</h2>
                <table className="tabla-cierre tabla-categorias">
                  <thead>
                    <tr>
                      <th>Categoría</th>
                      <th>Cantidad</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.desgloseCategorias.map((c) => (
                      <tr key={c.nombre}>
                        <td>{c.nombre}</td>
                        <td>{c.cantidad}</td>
                        <td>$ {c.total.toLocaleString("es-AR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="seccion">
                <h2>🏆 Top productos</h2>
                <table className="tabla-cierre">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Producto</th>
                      <th>Cant.</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.topProductos.map((p, i) => (
                      <tr key={p.id_producto}>
                        <td>{i + 1}</td>
                        <td>{p.nombre}</td>
                        <td>{p.cantidad}</td>
                        <td>$ {p.total.toLocaleString("es-AR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="seccion">
                <h2>🧾 Pedidos del día</h2>
                <table className="tabla-cierre">
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Hora pago</th>
                      <th>Mesa</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.pedidos.map((p) => (
                      <tr key={p.id_pedido}>
                        <td>#{p.id_pedido}</td>
                        <td>
                          {new Date(
                            p.fecha_pago || p.fecha_hora,
                          ).toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td>{p.id_mesa}</td>
                        <td>$ {parseFloat(p.total).toLocaleString("es-AR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="acciones-cierre">
                {!cierre && (
                  <button
                    className="btn-cerrar-caja"
                    onClick={handleCerrarCaja}
                    disabled={cerrando}
                  >
                    {cerrando ? "⏳ Cerrando..." : "🔒 Cerrar Caja del Día"}
                  </button>
                )}
                <button className="btn-exportar" onClick={handleExportar}>
                  📄 {cierre ? "Exportar PDF Oficial" : "Exportar Vista Previa"}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CierreCaja;
