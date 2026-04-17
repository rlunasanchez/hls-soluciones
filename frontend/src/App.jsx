import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Home from "./pages/Home";
import GestionUsuarios from "./pages/GestionUsuarios";
import Equipos from "./pages/Equipos";
import Clientes from "./pages/Clientes";
import "./index.css";

function App() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setAuthenticated(!!token);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.replace("/login");
      } else {
        setAuthenticated(true);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleLogin = () => {
    setAuthenticated(true);
    window.history.replaceState(null, "", "/home");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthenticated(false);
    window.history.replaceState(null, "", "/login");
    window.location.replace("/login");
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/" element={<Login onLogin={handleLogin} />} />
        <Route 
          path="/usuarios" 
          element={
            authenticated ? <GestionUsuarios onLogout={handleLogout} /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/equipos" 
          element={
            authenticated ? <Equipos onLogout={handleLogout} /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/clientes" 
          element={
            authenticated ? <Clientes onLogout={handleLogout} /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/home" 
          element={
            authenticated ? <Home onLogout={handleLogout} /> : <Navigate to="/login" />
          } 
        />
        <Route path="*" element={<Navigate to={authenticated ? "/home" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;