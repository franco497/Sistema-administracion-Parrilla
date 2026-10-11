// src/pages/MesaView.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRestaurante } from "../context/RestauranteContext";
import FormularioReservaSimple from "../components/Mesas/FormularioReservaSimple";
import { generarFacturaPDF, generarTicketPDF } from "../services/pdfService";
import "./MesaView.css";
import { supabase } from "../lib/supabase";
import SelectorMozo from "../components/Mesas/SelectorMozo";

const MesaView = () => {
  const { mesaId } = useParams();
  const navigate = useNavigate();

  const {
    mesas,
    productos,
    categorias,
    pedidosActivos,
    agregarItemPedido,
    obtenerItemsPedido,
    cobrarPedido,
    cancelarPedido,
    crearReserva,
    cancelarReserva,
    obtenerReservaPorMesa,
    crearPedido,
    actualizarPedido,
    mozos,
    mozosActivos,
    asignarMozo,
    removerMozo,
  } = useRestaurante();

  const mesa = mesas[parseInt(mesaId)];
  const reservaExistente = obtenerReservaPorMesa(parseInt(mesaId));
  const pedidoId = pedidosActivos[parseInt(mesaId)];
  const mozoActual = mesa?.mozoNombre || null;

  // Estado local para el nombre de la reserva
  const [nombreReservaLocal, setNombreReservaLocal] = useState("");
  const [adultos, setAdults] = useState(mesa?.adultos || 0);
  const [menores, setMenores] = useState(mesa?.menores || 0);
  const [itemsPedido, setItemsPedido] = useState([]);
  const [total, setTotal] = useState(0);
  const [mostrarFormularioReserva, setMostrarFormularioReserva] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [cantidades, setCantidades] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [editandoPedido, setEditandoPedido] = useState(false);
  const [cantidadesEdit, setCantidadesEdit] = useState({});

  const handleVolver = () => {
    // ✅ Volver al dashboard y mostrar la grilla de mesas
    navigate("/dashboard", { state: { mostrarMesas: true } });
  };

  // Inicializar nombre de reserva
  useEffect(() => {
    if (reservaExistente) {
      setNombreReservaLocal(reservaExistente.nombre_cliente);
    } else if (mesa?.reservaNombre) {
      setNombreReservaLocal(mesa.reservaNombre);
    }
  }, [reservaExistente, mesa]);

  // Cargar items del pedido
  useEffect(() => {
    if (pedidoId) {
      cargarItemsPedido();
    } else {
      setItemsPedido([]);
      setTotal(0);
    }
  }, [pedidoId]);

  // Si no existe la mesa, redirigir
  useEffect(() => {
    if (!mesa) {
      navigate("/dashboard");
    }
  }, [mesa, navigate]);

  const cargarItemsPedido = async () => {
    if (!pedidoId) {
      setItemsPedido([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setMensaje("🔄 Cargando pedido...");

    try {
      const result = await obtenerItemsPedido(parseInt(mesaId));
      if (result.success) {
        const items = result.data || [];
        setItemsPedido(items);
        const totalCalculado = items.reduce(
          (sum, item) => sum + (parseFloat(item.subtotal) || 0),
          0,
        );
        setTotal(totalCalculado);
        setMensaje(
          `✅ ${items.length} items - Total: $${totalCalculado.toLocaleString()}`,
        );
      }
    } catch (error) {
      console.error("Error cargando items:", error);
      setMensaje("❌ Error al cargar el pedido");
    } finally {
      setLoading(false);
    }
  };

  const handleCantidadChange = (productoId, cantidad) => {
    setCantidades((prev) => ({
      ...prev,
      [productoId]: Math.max(0, parseInt(cantidad) || 0),
    }));
  };

  const handleAgregarItem = async (productoId) => {
    const cantidad = cantidades[productoId] || 0;
    if (cantidad <= 0) {
      setMensaje("⚠️ La cantidad debe ser mayor a 0");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }

    setLoading(true);
    setMensaje("🔄 Agregando item...");

    try {
      const result = await agregarItemPedido(
        parseInt(mesaId),
        productoId,
        cantidad,
      );
      if (result.success) {
        setMensaje(`✅ ${cantidad}x agregado`);
        await cargarItemsPedido();
        setCantidades((prev) => ({ ...prev, [productoId]: 0 }));
        setTimeout(() => setMensaje(""), 2000);
      }
    } catch (error) {
      console.error("Error agregando item:", error);
      setMensaje("❌ Error al agregar el item");
    } finally {
      setLoading(false);
    }
  };

  const calcularTotal = async () => {
    setMensaje("🔄 Calculando total...");
    await cargarItemsPedido();
    setMensaje(`💰 Total: $${total.toLocaleString()}`);
    setTimeout(() => setMensaje(""), 3000);
  };

  const handleGuardar = () => {
    if (itemsPedido.length === 0) {
      setMensaje("⚠️ No hay items para guardar");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }
    setMensaje(`✅ Pedido guardado - Total: $${total.toLocaleString()}`);
    setTimeout(() => {
      setMensaje("");
      navigate("/dashboard", { state: { mostrarMesas: true } });
    }, 1500);
  };

  const handleCobrar = async () => {
    if (itemsPedido.length === 0) {
      setMensaje("⚠️ No hay items para cobrar");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }

    const nombreCliente = nombreReservaLocal || "Consumidor Final";
    const confirmar = confirm(
      `¿Cobrar $${total.toLocaleString()} de la Mesa ${mesaId}?\n\n` +
        `Cliente: ${nombreCliente}`,
    );

    if (!confirmar) return;

    setLoading(true);
    setMensaje("🔄 Procesando cobro...");

    try {
      const result = await cobrarPedido(parseInt(mesaId));
      if (result.success) {
        const pedidoCompleto = {
          id_pedido: result.pedidoId,
          total: result.total,
          estado: "pagado",
          created_at: new Date().toISOString(),
        };

        try {
          generarTicketPDF(
            pedidoCompleto,
            itemsPedido,
            parseInt(mesaId),
            { nombre: nombreCliente }, // ← Cliente (igual que antes)
            mozoActual, // ← MOZO (NUEVO)
          );
          console.log("✅ Ticket generado correctamente");
        } catch (pdfError) {
          console.error("Error generando PDF:", pdfError);
        }

        setMensaje(`✅ Cobrado: $${result.total.toLocaleString()}`);
        setItemsPedido([]);
        setTotal(0);

        // ✅ Redirigir a la grilla de mesas después de cobrar
        setTimeout(() => {
          setMensaje("");
          navigate("/dashboard", { state: { mostrarMesas: true } });
        }, 1500);
      } else {
        setMensaje(`❌ Error al cobrar: ${result.error}`);
      }
    } catch (error) {
      console.error("Error cobrando:", error);
      setMensaje("❌ Error al procesar el cobro");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarPedido = async () => {
    if (!pedidoId) {
      setMensaje("⚠️ No hay pedido activo");
      setTimeout(() => setMensaje(""), 2000);
      return;
    }

    const confirmar = confirm(`¿Cancelar el pedido de la Mesa ${mesaId}?`);
    if (!confirmar) return;

    setLoading(true);
    setMensaje("🔄 Cancelando pedido...");

    try {
      const result = await cancelarPedido(parseInt(mesaId));
      if (result.success) {
        setMensaje("✅ Pedido cancelado");
        setItemsPedido([]);
        setTotal(0);

        // ✅ PERMANECER EN LA VISTA
        setTimeout(() => {
          setMensaje("");
        }, 2000);
      } else {
        setMensaje(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error cancelando:", error);
      setMensaje("❌ Error al cancelar");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarReserva = async () => {
    if (!reservaExistente) {
      setMensaje("⚠️ No hay reserva para cancelar");
      return;
    }

    const confirmar = confirm(
      `¿Cancelar reserva de ${reservaExistente.nombre_cliente}?`,
    );
    if (!confirmar) return;

    setLoading(true);
    setMensaje("🔄 Cancelando reserva...");

    try {
      const result = await cancelarReserva(
        parseInt(mesaId),
        reservaExistente.id_reserva,
      );
      if (result.success) {
        setMensaje("✅ Reserva cancelada");
        setNombreReservaLocal("");
        setMostrarFormularioReserva(false);
        setTimeout(() => setMensaje(""), 2000);
      }
    } catch (error) {
      console.error("Error cancelando reserva:", error);
      setMensaje("❌ Error al cancelar");
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicion = () => {
    const cantidadesActuales = {};
    itemsPedido.forEach((item) => {
      cantidadesActuales[item.id_producto] = item.cantidad;
    });
    setCantidadesEdit(cantidadesActuales);
    setEditandoPedido(true);
    setMensaje("✏️ Editando pedido - Modifica las cantidades");
  };

  const cancelarEdicion = () => {
    setEditandoPedido(false);
    setCantidadesEdit({});
    setMensaje("");
  };

  const guardarEdicion = async () => {
    setLoading(true);
    setMensaje("🔄 Guardando cambios...");

    try {
      // Preparar los items actualizados
      const itemsActualizados = Object.entries(cantidadesEdit).map(
        ([productoId, cantidad]) => ({
          id_producto: parseInt(productoId),
          cantidad: cantidad,
        }),
      );

      // ✅ Usar la función del Context
      const result = await actualizarPedido(
        parseInt(mesaId),
        itemsActualizados,
      );

      if (result.success) {
        await cargarItemsPedido();
        setEditandoPedido(false);
        setCantidadesEdit({});
        setMensaje("✅ Pedido actualizado correctamente");
        setTimeout(() => setMensaje(""), 2000);
      } else {
        setMensaje(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error guardando edición:", error);
      setMensaje("❌ Error al guardar los cambios");
    } finally {
      setLoading(false);
    }
  };

  // Agrupar productos por categoría (solo activos)
  const productosPorCategoria = {};
  categorias.forEach((cat) => {
    productosPorCategoria[cat.id_categoria] = {
      ...cat,
      productos: productos.filter(
        (p) =>
          p.id_categoria === cat.id_categoria &&
          p.disponible &&
          p.activo !== false, //  Excluir productos eliminados lógicamente
      ),
    };
  });

  if (!mesa) {
    return <div className="mesa-view-loading">Cargando...</div>;
  }

  return (
    <div className="mesa-view-container">
      {/* Header */}
      <div className="mesa-view-header">
        <button className="btn-volver-mesa" onClick={handleVolver}>
          ⬅ Volver a Mesas
        </button>
        <h1>Mesa {mesaId}</h1>
        <div className="header-badges">
          {pedidoId && <span className="badge-pedido">Pedido #{pedidoId}</span>}
          {mesa.estado === "ocupada" && (
            <span className="badge-ocupada">🟢 Ocupada</span>
          )}
          {nombreReservaLocal && (
            <span className="badge-reservada">📅 {nombreReservaLocal}</span>
          )}
          {/* ✅ AGREGAR MOZO ASIGNADO */}
          {mozoActual && <span className="badge-mozo">👨‍🍳 {mozoActual}</span>}
        </div>
      </div>

      {/* Mensaje de estado */}
      {mensaje && (
        <div
          className={`mensaje-estado ${mensaje.includes("Error") || mensaje.includes("⚠️") ? "error" : "success"}`}
        >
          {mensaje}
        </div>
      )}

      {/* Contenido - 2 columnas */}
      <div className="mesa-view-content">
        {/* Columna izquierda: Menú */}
        <div className="columna-menu">
          <h2>🍽️ Menú</h2>
          <div className="menu-productos">
            {Object.values(productosPorCategoria).map(
              (categoria) =>
                categoria.productos.length > 0 && (
                  <div key={categoria.id_categoria} className="categoria-menu">
                    <h5>{categoria.nombre}</h5>
                    <div className="productos-lista">
                      {categoria.productos.map((producto) => (
                        <div
                          key={producto.id_producto}
                          className="producto-item"
                        >
                          <div className="producto-info">
                            <span className="producto-nombre">
                              {producto.nombre}
                            </span>
                            <span className="producto-precio">
                              ${producto.precio.toLocaleString()}
                            </span>
                          </div>
                          <div className="producto-accion">
                            <div className="cantidad-control">
                              <button
                                className="btn-cantidad btn-cantidad-menos"
                                onClick={() => {
                                  const actual =
                                    cantidades[producto.id_producto] || 0;
                                  if (actual > 0) {
                                    handleCantidadChange(
                                      producto.id_producto,
                                      actual - 1,
                                    );
                                  }
                                }}
                                disabled={
                                  loading ||
                                  (cantidades[producto.id_producto] || 0) <= 0
                                }
                              >
                                −
                              </button>
                              <span className="cantidad-valor">
                                {cantidades[producto.id_producto] || 0}
                              </span>
                              <button
                                className="btn-cantidad btn-cantidad-mas"
                                onClick={() => {
                                  const actual =
                                    cantidades[producto.id_producto] || 0;
                                  if (actual < 99) {
                                    handleCantidadChange(
                                      producto.id_producto,
                                      actual + 1,
                                    );
                                  }
                                }}
                                disabled={
                                  loading ||
                                  (cantidades[producto.id_producto] || 0) >= 99
                                }
                              >
                                +
                              </button>
                            </div>
                            <button
                              className="btn-agregar"
                              onClick={() =>
                                handleAgregarItem(producto.id_producto)
                              }
                              disabled={
                                loading ||
                                !(cantidades[producto.id_producto] > 0)
                              }
                            >
                              Agregar al pedido
                            </button>
                          </div>{" "}
                        </div>
                      ))}
                    </div>
                  </div>
                ),
            )}
          </div>
        </div>

        {/* Columna derecha: Pedido actual */}
        <div className="columna-pedido">
          {/* Sección de reserva */}
          <div className="reserva-section">
            {nombreReservaLocal ? (
              <div className="reserva-activa">
                <div className="reserva-icono">📅</div>
                <div className="reserva-info">
                  <p className="reserva-cliente">
                    <strong>{nombreReservaLocal}</strong>
                  </p>
                  {reservaExistente && (
                    <p className="reserva-detalle">
                      <span>
                        🗓️{" "}
                        {new Date(
                          reservaExistente.fecha_reserva,
                        ).toLocaleDateString("es-AR")}
                      </span>
                      <span>🕐 {reservaExistente.hora_reserva}</span>
                    </p>
                  )}
                </div>
                <button
                  className="btn-cancelar-reserva"
                  onClick={handleCancelarReserva}
                >
                  ❌
                </button>
              </div>
            ) : (
              <div className="sin-reserva">
                {!mostrarFormularioReserva ? (
                  <>
                    <p>🪑 Sin reserva</p>
                    <button
                      className="btn-reservar"
                      onClick={() => setMostrarFormularioReserva(true)}
                    >
                      📅 Reservar
                    </button>
                  </>
                ) : (
                  <FormularioReservaSimple
                    mesaId={parseInt(mesaId)}
                    onGuardar={crearReserva}
                    onCancelar={() => setMostrarFormularioReserva(false)}
                  />
                )}
              </div>
            )}
          </div>

          {/* Sección de Mozo */}
          <div className="mozo-section">
            <SelectorMozo
              mesaId={parseInt(mesaId)}
              mozos={mozos} // ← Debe ser un array
              mozoActual={mozoActual} // ← Debe ser string o null
              onAsignar={asignarMozo} // ← Función
              onRemover={removerMozo} // ← Función
              loading={loading} // ← boolean
            />
          </div>

          {/* Items del pedido */}
          {/* Items del pedido */}
          <div className="items-pedido-container">
            <div className="items-header">
              <h4>📋 Pedido Actual</h4>
              {itemsPedido.length > 0 && !editandoPedido && (
                <button className="btn-editar-pedido" onClick={iniciarEdicion}>
                  ✏️ Editar
                </button>
              )}
              {editandoPedido && (
                <div className="acciones-edicion">
                  <button
                    className="btn-guardar-edicion"
                    onClick={guardarEdicion}
                  >
                    ✅ Guardar cambios
                  </button>
                  <button
                    className="btn-cancelar-edicion"
                    onClick={cancelarEdicion}
                  >
                    ❌ Cancelar
                  </button>
                </div>
              )}
            </div>

            {itemsPedido.length === 0 ? (
              <p className="sin-items">No hay items cargados</p>
            ) : editandoPedido ? (
              // Modo edición - mostrar inputs para cada item
              <div className="items-pedido-edicion">
                {itemsPedido.map((item) => (
                  <div key={item.id_detalle} className="item-pedido-edit">
                    <span className="item-nombre">
                      {item.productos?.nombre || "Producto"}
                    </span>
                    <div className="item-edit-control">
                      <button
                        className="btn-edit-cantidad"
                        onClick={() => {
                          const actual = cantidadesEdit[item.id_producto] || 0;
                          if (actual > 0) {
                            setCantidadesEdit((prev) => ({
                              ...prev,
                              [item.id_producto]: actual - 1,
                            }));
                          }
                        }}
                        disabled={
                          loading ||
                          (cantidadesEdit[item.id_producto] || 0) <= 0
                        }
                      >
                        −
                      </button>
                      <span className="cantidad-edit-valor">
                        {cantidadesEdit[item.id_producto] || 0}
                      </span>
                      <button
                        className="btn-edit-cantidad"
                        onClick={() => {
                          const actual = cantidadesEdit[item.id_producto] || 0;
                          setCantidadesEdit((prev) => ({
                            ...prev,
                            [item.id_producto]: actual + 1,
                          }));
                        }}
                        disabled={loading}
                      >
                        +
                      </button>
                      <span className="item-subtotal-edit">
                        $
                        {(cantidadesEdit[item.id_producto] || 0) *
                          item.precio_unitario}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Modo visualización normal
              <div className="items-pedido">
                {itemsPedido.map((item) => (
                  <div key={item.id_detalle} className="item-pedido">
                    <span className="item-cantidad">{item.cantidad}x</span>
                    <span className="item-nombre">
                      {item.productos?.nombre || "Producto"}
                    </span>
                    <span className="item-subtotal">
                      ${parseFloat(item.subtotal).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="total-display">
            <span>💰 Total:</span>
            <span className="total-monto">${total.toLocaleString()}</span>
          </div>

          {/* Botones */}
          <div className="acciones-pedido">
            <button
              className="btn-calcular"
              onClick={calcularTotal}
              disabled={loading}
            >
              {loading ? "⏳" : "1. Calcular total"}
            </button>
            <button
              className="btn-guardar"
              onClick={handleGuardar}
              disabled={loading || itemsPedido.length === 0}
            >
              2. Guardar siguen comiendo
            </button>
            <button
              className="btn-cobrar"
              onClick={handleCobrar}
              disabled={loading || itemsPedido.length === 0}
            >
              💳 3. Cobrar y liberar mesa
            </button>
            {pedidoId && (
              <button
                className="btn-cancelar-pedido"
                onClick={handleCancelarPedido}
                disabled={loading}
              >
                ❌ Cancelar Pedido
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MesaView;
