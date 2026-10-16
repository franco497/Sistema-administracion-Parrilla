// src/components/Mozos/FormularioMozo.jsx
import React, { useState, useEffect } from "react";
import "./FormularioMozo.css";

const FormularioMozo = ({ mozo, onGuardar, onCancelar, loading }) => {
  const [datos, setDatos] = useState({ nombre: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (mozo) {
      setDatos({ nombre: mozo.nombre || "" });
    } else {
      setDatos({ nombre: "" });
    }
  }, [mozo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatos((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!datos.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    onGuardar(datos);
  };

  return (
    <div className="formulario-overlay" onClick={onCancelar}>
      <div className="formulario-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{mozo ? "✏️ Editar Mozo" : "➕ Nuevo Mozo"}</h3>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-campo">
            <label>Nombre *</label>
            <input
              type="text"
              name="nombre"
              value={datos.nombre}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez"
              autoFocus
              maxLength="100"
              disabled={loading}
            />
          </div>

          <div className="form-acciones">
            <button
              type="button"
              className="btn-cancelar"
              onClick={onCancelar}
              disabled={loading}
            >
              ❌ Cancelar
            </button>
            <button
              type="submit"
              className="btn-guardar"
              disabled={loading}
            >
              {loading
                ? "⏳ Guardando..."
                : mozo
                  ? "💾 Guardar cambios"
                  : "➕ Crear mozo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioMozo;
