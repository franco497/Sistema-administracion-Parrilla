// src/components/Productos/GestionProductos.jsx
import React, { useState, useMemo } from 'react';
import { useRestaurante } from '../../context/RestauranteContext';
import FormularioProducto from './FormularioProducto';
import './GestionProductos.css';

const GestionProductos = ({ onVolver }) => {
  const {
    productos,
    categorias,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    restaurarProducto,
  } = useRestaurante();

  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('activos'); // activos | inactivos | todos
  const [productoEditando, setProductoEditando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  // Productos filtrados
  const productosFiltrados = useMemo(() => {
    let filtrados = [...productos];

    // Filtro por estado
    if (filtroEstado === 'activos') {
      filtrados = filtrados.filter(p => p.activo !== false);
    } else if (filtroEstado === 'inactivos') {
      filtrados = filtrados.filter(p => p.activo === false);
    }

    // Filtro por categoría
    if (filtroCategoria) {
      filtrados = filtrados.filter(p => p.id_categoria === parseInt(filtroCategoria));
    }

    // Búsqueda por nombre
    if (busqueda.trim()) {
      const term = busqueda.toLowerCase().trim();
      filtrados = filtrados.filter(p => 
        p.nombre.toLowerCase().includes(term)
      );
    }

    return filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [productos, busqueda, filtroCategoria, filtroEstado]);

  const getNombreCategoria = (idCategoria) => {
    const cat = categorias.find(c => c.id_categoria === idCategoria);
    return cat?.nombre || 'Sin categoría';
  };

  const handleNuevoProducto = () => {
    setProductoEditando(null);
    setMostrarFormulario(true);
  };

  const handleEditarProducto = (producto) => {
    setProductoEditando(producto);
    setMostrarFormulario(true);
  };

  const handleEliminarProducto = async (producto) => {
    const confirmar = window.confirm(
      `¿Eliminar el producto "${producto.nombre}"?\n\n` +
      `Se marcará como inactivo y podrá restaurarse después.`
    );
    if (!confirmar) return;

    setLoading(true);
    const result = await eliminarProducto(producto.id_producto);
    if (result.success) {
      setMensaje(`✅ "${producto.nombre}" eliminado`);
      setTimeout(() => setMensaje(''), 2500);
    } else {
      setMensaje(`❌ Error: ${result.error}`);
    }
    setLoading(false);
  };

  const handleRestaurarProducto = async (producto) => {
    setLoading(true);
    const result = await restaurarProducto(producto.id_producto);
    if (result.success) {
      setMensaje(`✅ "${producto.nombre}" restaurado`);
      setTimeout(() => setMensaje(''), 2500);
    } else {
      setMensaje(`❌ Error: ${result.error}`);
    }
    setLoading(false);
  };

  const handleGuardar = async (datos) => {
    setLoading(true);
    let result;
    
    if (productoEditando) {
      result = await actualizarProducto(productoEditando.id_producto, datos);
    } else {
      result = await crearProducto(datos);
    }

    if (result.success) {
      setMensaje(productoEditando ? '✅ Producto actualizado' : '✅ Producto creado');
      setTimeout(() => setMensaje(''), 2500);
      setMostrarFormulario(false);
      setProductoEditando(null);
    } else {
      setMensaje(`❌ Error: ${result.error}`);
    }
    setLoading(false);
  };

  const handleCancelarFormulario = () => {
    setMostrarFormulario(false);
    setProductoEditando(null);
  };

  return (
    <div className="gestion-productos">
      {/* Header */}
      <div className="gestion-header">
        <button className="btn-volver" onClick={onVolver}>
          ⬅ Volver al Menú
        </button>
        <h2>📦 Gestión de Productos</h2>
        <button 
          className="btn-nuevo" 
          onClick={handleNuevoProducto}
          disabled={loading}
        >
          ➕ Nuevo Producto
        </button>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`mensaje ${mensaje.includes('❌') ? 'error' : 'success'}`}>
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
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="select-filtro"
        >
          <option value="">Todas las categorías</option>
          {categorias.map(cat => (
            <option key={cat.id_categoria} value={cat.id_categoria}>
              {cat.nombre}
            </option>
          ))}
        </select>

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
        Mostrando {productosFiltrados.length} de {productos.length} productos
      </div>

      {/* Tabla */}
      <div className="gestion-tabla-wrapper">
        {productosFiltrados.length === 0 ? (
          <p className="sin-productos">
            {busqueda || filtroCategoria 
              ? 'No se encontraron productos con esos filtros' 
              : 'No hay productos para mostrar'}
          </p>
        ) : (
          <table className="gestion-tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th className="col-precio">Precio</th>
                <th className="col-estado">Estado</th>
                <th className="col-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map(producto => (
                <tr 
                  key={producto.id_producto}
                  className={producto.activo === false ? 'fila-inactiva' : ''}
                >
                  <td className="col-nombre">{producto.nombre}</td>
                  <td>{getNombreCategoria(producto.id_categoria)}</td>
                  <td className="col-precio">
                    ${parseFloat(producto.precio).toLocaleString('es-AR')}
                  </td>
                  <td className="col-estado">
                    {producto.activo === false ? (
                      <span className="badge-inactivo">❌ Inactivo</span>
                    ) : (
                      <span className="badge-activo">✅ Activo</span>
                    )}
                  </td>
                  <td className="col-acciones">
                    <button
                      className="btn-editar"
                      onClick={() => handleEditarProducto(producto)}
                      disabled={loading || producto.activo === false}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    {producto.activo === false ? (
                      <button
                        className="btn-restaurar"
                        onClick={() => handleRestaurarProducto(producto)}
                        disabled={loading}
                        title="Restaurar"
                      >
                        ♻️
                      </button>
                    ) : (
                      <button
                        className="btn-eliminar"
                        onClick={() => handleEliminarProducto(producto)}
                        disabled={loading}
                        title="Eliminar"
                      >
                        🗑️
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
        <FormularioProducto
          producto={productoEditando}
          categorias={categorias}
          onGuardar={handleGuardar}
          onCancelar={handleCancelarFormulario}
          loading={loading}
        />
      )}
    </div>
  );
};

export default GestionProductos;
