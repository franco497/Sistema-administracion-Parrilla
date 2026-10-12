// src/components/Navbar.jsx
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const confirmar = window.confirm("¿Seguro que quieres cerrar sesión?");
    if (!confirmar) return;

    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error);
      alert("No se pudo cerrar la sesión. Intenta nuevamente.");
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo / Título */}
        <div className="navbar-brand">
          <span className="navbar-brand-icon">🍖</span>
          <span className="navbar-brand-text">Parrilla Milver</span>
        </div>

        {/* Botón cerrar sesión */}
        <button
          className="navbar-logout-btn"
          onClick={handleLogout}
          title="Cerrar Sesión"
        >
          <span className="navbar-logout-icon">🚪</span>
          <span className="navbar-logout-text">Cerrar Sesión</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;