// src/components/MenuPrincipal/MenuPrincipal.jsx
import React from 'react';
import './MenuPrincipal.css';

const MenuPrincipal = ({ onSeleccionarModulo }) => {
  const modulos = [
    {
      id: 'mesas',
      icono: '🪑',
      titulo: 'Elegir Mesas',
      descripcion: 'Controlá el estado del salón, abrí mesas y cargá los pedidos de los comensales.',
    },
    {
      id: 'cargar',
      icono: '📦',
      titulo: 'Cargar Mercadería',
      descripcion: 'Gestioná el menú y los productos del restaurante.',
    },
    {
      id: 'stock',
      icono: '📊',
      titulo: 'Ver Stock',
      descripcion: 'Consultá el inventario actual y alertas de bajo stock.',
    },
    {
      id: 'mozos',
      icono: '👨‍🍳',
      titulo: 'Gestionar Mozos',
      descripcion: 'Administrá el personal del salón.',
    },
  ];

  return (
    <div className="menu-principal">
      <header className="menu-header">
        <h1>🔥 Gestión de la Parrilla</h1>
        <p>Sistema de Control de Salón y Stock</p>
      </header>

      <div className="contenedor-modulos">
        {modulos.map(modulo => (
          <div key={modulo.id} className="tarjeta-modulo">
            <div className="icono">{modulo.icono}</div>
            <h2>{modulo.titulo}</h2>
            <p>{modulo.descripcion}</p>
            <button onClick={() => onSeleccionarModulo(modulo.id)}>
              Ir a {modulo.titulo}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuPrincipal;