// src/components/Mozos/GestionMozos.jsx
import React, { useState, useMemo } from "react";
import { useRestaurante } from "../../context/RestauranteContext";
import FormularioMozo from "./FormularioMozo";
import "./GestionMozos.css";

const GestionMozos = ({ onVolver }) => {
  const {
    mozos,
    crearMozo,
    actualizarMozo,
    eliminarMozo,
    restaurarMozo,
  } = useRestaurante();

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("activos");
  const [mozoEditando, setMozoEditando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  // Mozos filtrados
  const mozosFiltrados = useMemo(() => {
    let filtrados = [...mozos];

    // Filtro por estado
    if (filtroEstado === "activos") {
      filtrados = filtrados.filter((m) => m.activo !== false);
    } else if (filtroEstado === "inactivos") {
      filtrados = filtrados.filter((m) => m.activo === false);
    }

    // Búsqueda por nombre
    if (busqueda.trim()) {
      const term = busqueda.toLowerCase().trim();
      filtrados = filtrados.filter((m) =>
        m.nombre.toLowerCase().includes(term)
      );
    }

    return filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [mozos, busqueda, filtroEstado]);

  const handleNuevoMozo = () => {
    setMozoEditando(null);
    setMostrarFormulario(true);
  };

  const handleEditarMozo = (mozo) => {
    setMozoEditando(mozo);
    setMostrarFormulario(true);
  };

  const handleEliminarMozo = async (mozo) => {
    const confirmar = window.confirm(
      `¿Eliminar al mozo "${mozo.nombre}"?\n\n` +
        `Se marcará como inactivo y podrá restaurarse después.`
    );
    if (!confirmar) return;

    setLoading(true);
    const result = await eliminarMozo(mozo.id_mozo);
    if (result.success) {
      setMensaje(`✅ "${mozo.nombre}" eliminado`);
      setTimeout(() => setMensaje(""), 2500);
    } else {
      setMensaje(`❌ Error: ${result.error}`);
    }
    setLoading(false);
  };

  const handleRestaurarMozo = async (mozo) => {
    setLoading(true);
    const result = await restaurarMozo(mozo.id_mozo);
    if (result.success) {
      setMensaje(`✅ "${mozo.nombre}" restaurado`);
      setTimeout(() => setMensaje(""), 2500);
    } else {
      setMensaje(`❌ Error: ${result.error}`);
    }
    setLoading(false);
  };

  const handleGuardar = async (datos) => {
    setLoading(true);
    let result;

    if (mozoEditando) {
      result = await actualizarMozo(mozoEditando.id_mozo, datos);
    } else {
      result = await crearMozo(datos);
    }

    if (result.success) {
      setMensaje(
        mozoEditando ? "✅ Mozo actualizado" : "✅ Mozo creado"
      );
      setTimeout(() => setMensaje(""), 2500);
      setMostrarFormulario(false);
      setMozoEditando(null);
    } else {
      setMensaje(`❌ Error: ${result.error}`);
    }
    setLoading(false);
  };

  const handleCancelarFormulario = () => {
    setMostrarFormulario(false);
    setMozoEditando(null);
  };

  return (
    <div className="gestion-mozos">
      {/* Header */}
      <div className="gestion-header">
        <button className="btn-volver" onClick={onVolver}>
          ⬅ Volver al Menú
        </button>
        <h2>👨‍🍳 Gestión de Mozos</h2>
        <button
          className="btn-nuevo"
          onClick={handleNuevoMozo}
          disabled={loading}
        >
          ➕ Nuevo Mozo
        </button>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div
          className={`mensaje ${mensaje.includes("❌") ? "error" : "success"}`}
        >
          {mensaje}
        </div>
      )}

      {/* Filtros */}
      <div className="gestion-filtros">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-busqueda"
        />

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="select-filtro"
        >
          <option value="activos">✅ Activos</option>
          <option value="inactivos">❌ Inactivos</option>
          <option value="todos">📋 Todos</option>
        </select>
      </div>

      {/* Contador */}
      <div className="gestion-contador">
        Mostrando {mozosFiltrados.length} de {mozos.length} mozos
      </div>

      {/* Tabla */}
      <div className="gestion-tabla-wrapper">
        {mozosFiltrados.length === 0 ? (
          <p className="sin-mozos">
            {busqueda
              ? "No se encontraron mozos con ese filtro"
              : "No hay mozos para mostrar"}
          </p>
        ) : (
          <table className="gestion-tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th className="col-estado">Estado</th>
                <th className="col-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mozosFiltrados.map((mozo) => (
                <tr
                  key={mozo.id_mozo}
                  className={mozo.activo === false ? "fila-inactiva" : ""}
                >
                  <td className="col-nombre">{mozo.nombre}</td>
                  <td className="col-estado">
                    {mozo.activo === false ? (
                      <span className="badge-inactivo">❌ Inactivo</span>
                    ) : (
                      <span className="badge-activo">✅ Activo</span>
                    )}
                  </td>
                  <td className="col-acciones">
                    <button
                      className="btn-editar"
                      onClick={() => handleEditarMozo(mozo)}
                      disabled={loading || mozo.activo === false}
                      title="Editar"
                    >
                      Editar
                    </button>
                    {mozo.activo === false ? (
                      <button
                        className="btn-restaurar"
                        onClick={() => handleRestaurarMozo(mozo)}
                        disabled={loading}
                        title="Restaurar"
                      >
                        Restaurar
                      </button>
                    ) : (
                      <button
                        className="btn-eliminar"
                        onClick={() => handleEliminarMozo(mozo)}
                        disabled={loading}
                        title="Eliminar"
                      >
                        Borrar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Formulario modal */}
      {mostrarFormulario && (
        <FormularioMozo
          mozo={mozoEditando}
          onGuardar={handleGuardar}
          onCancelar={handleCancelarFormulario}
          loading={loading}
        />
      )}
    </div>
  );
};

export default GestionMozos;
