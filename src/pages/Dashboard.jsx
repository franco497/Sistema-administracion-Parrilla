// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useRestaurante } from "../context/RestauranteContext";
import MenuPrincipal from "../components/MenuPrincipal/MenuPrincipal";
import GrillaMesas from "../components/Mesas/GrillaMesas";
import Navbar from "../components/Navbar";
import "./Dashboard.css";
import GestionProductos from "../components/Productos/GestionProductos";
import GestionMozos from "../components/Mozos/GestionMozos";
import CierreCaja from "./CierreCaja";

const Dashboard = () => {
  const { loading } = useRestaurante();
  const location = useLocation();
  const [vistaActual, setVistaActual] = useState("principal");

  useEffect(() => {
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
    <>
      <Navbar />
      <div className="dashboard-container">
        {vistaActual === "principal" && (
          <MenuPrincipal onSeleccionarModulo={handleSeleccionarModulo} />
        )}

        {vistaActual === "mesas" && <GrillaMesas onVolver={handleVolverMenu} />}

        {vistaActual === "cargar" && (
          <GestionProductos onVolver={handleVolverMenu} />
        )}

        {vistaActual === "cierre-caja" && (
          <CierreCaja onVolver={handleVolverMenu} />
        )}

        {vistaActual === "mozos" && (
          <GestionMozos onVolver={handleVolverMenu} />
        )}
      </div>
    </>
  );
};

export default Dashboard;