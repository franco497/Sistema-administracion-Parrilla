// src/pages/Dashboard.jsx
// Verificar que al entrar al dashboard, muestre la grilla si venimos de una mesa

import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom"; // ← Importar
import { useRestaurante } from "../context/RestauranteContext";
import MenuPrincipal from "../components/MenuPrincipal/MenuPrincipal";
import GrillaMesas from "../components/Mesas/GrillaMesas";
import LogoutButton from "../components/LogoutButton";
import "./Dashboard.css";
import GestionProductos from "../components/Productos/GestionProductos";

const Dashboard = () => {
  const { loading } = useRestaurante();
  const location = useLocation(); // ← Obtener la ubicación actual
  const [vistaActual, setVistaActual] = useState("principal");

  // ✅ Si venimos de una mesa, mostrar la grilla automáticamente
  useEffect(() => {
    // Si el state tiene 'mostrarMesas', cambiar a la vista de mesas
    if (location.state?.mostrarMesas) {
      setVistaActual("mesas");
    }
  }, [location]);

  const handleSeleccionarModulo = (moduloId) => {
    setVistaActual(moduloId);
  };

  const handleVolverMenu = () => {
    setVistaActual("principal");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <h2>Cargando sistema...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <LogoutButton />

      {vistaActual === "principal" && (
        <MenuPrincipal onSeleccionarModulo={handleSeleccionarModulo} />
      )}

      {vistaActual === "mesas" && <GrillaMesas onVolver={handleVolverMenu} />}

      {/*       {vistaActual === 'cargar' && (
        <div className="seccion-en-construccion">
          <button className="btn-volver" onClick={handleVolverMenu}>
            ⬅ Volver al Menú
          </button>
          <h2>📦 Cargar Mercadería</h2>
          <p>Próximamente: Formulario para cargar compras</p>
        </div>
      )} */}

      {vistaActual === "cargar" && (
        <GestionProductos onVolver={handleVolverMenu} />
      )}

      {vistaActual === "stock" && (
        <div className="seccion-en-construccion">
          <button className="btn-volver" onClick={handleVolverMenu}>
            ⬅ Volver al Menú
          </button>
          <h2>📊 Ver Stock</h2>
          <p>Próximamente: Tabla de inventario con alertas</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
