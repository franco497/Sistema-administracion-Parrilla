// src/components/Productos/FormularioProducto.jsx
import React, { useState, useEffect } from 'react';
import './FormularioProducto.css';

const FormularioProducto = ({ producto, categorias, onGuardar, onCancelar, loading }) => {
  const [datos, setDatos] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    id_categoria: '',
  });
  const [error, setError] = useState('');

  // Cargar datos si es edición
  useEffect(() => {
    if (producto) {
      setDatos({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        precio: producto.precio || '',
        id_categoria: producto.id_categoria || '',
      });
    } else {
      setDatos({
        nombre: '',
        descripcion: '',
        precio: '',
        id_categoria: categorias[0]?.id_categoria || '',
      });
    }
  }, [producto, categorias]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatos(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!datos.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (!datos.precio || parseFloat(datos.precio) <= 0) {
      setError('El precio debe ser mayor a 0');
      return;
    }
    if (!datos.id_categoria) {
      setError('Debes seleccionar una categoría');
      return;
    }

    onGuardar(datos);
  };

  return (
    <div className="formulario-overlay" onClick={onCancelar}>
      <div className="formulario-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{producto ? '✏️ Editar Producto' : '➕ Nuevo Producto'}</h3>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-campo">
            <label>Nombre *</label>
            <input
              type="text"
              name="nombre"
              value={datos.nombre}
              onChange={handleChange}
              placeholder="Ej: Menú Parrillada"
              autoFocus
              maxLength="100"
              disabled={loading}
            />
          </div>

          <div className="form-campo">
            <label>Descripción</label>
            <textarea
              name="descripcion"
              value={datos.descripcion}
              onChange={handleChange}
              placeholder="Descripción opcional..."
              rows="2"
              maxLength="500"
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-campo">
              <label>Precio *</label>
              <input
                type="number"
                name="precio"
                value={datos.precio}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="100"
                disabled={loading}
              />
            </div>

            <div className="form-campo">
              <label>Categoría *</label>
              <select
                name="id_categoria"
                value={datos.id_categoria}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Seleccionar...</option>
                {categorias.map(cat => (
                  <option key={cat.id_categoria} value={cat.id_categoria}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
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
              {loading ? '⏳ Guardando...' : (producto ? '💾 Guardar cambios' : '➕ Crear producto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioProducto;
