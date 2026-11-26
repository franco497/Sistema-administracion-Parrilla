
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  // Recuperar la vista desde la URL
  const obtenerVistaInicial = () => {
    const params = new URLSearchParams(location.search);
    return params.get("vista") === "mesas" ? "mesas" : "principal";
  };

  const [vistaActual, setVistaActual] = useState(obtenerVistaInicial);

  // Sincronizar la vista cuando cambia la URL
  useEffect(() => {
    setVistaActual(obtenerVistaInicial());
  }, [location.search]);

const handleSeleccionarModulo = (moduloId) => {
  if (moduloId === "mesas") {
    navigate("/dashboard?vista=mesas");
    return;
  }

  setVistaActual(moduloId);
};

  const handleVolverMenu = () => {
    setVistaActual("principal");

    // Limpiar el parámetro de la URL
    navigate("/dashboard", { replace: true });
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

        {vistaActual === "mesas" && (
          <GrillaMesas onVolver={handleVolverMenu} />
        )}

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
