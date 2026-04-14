import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import GestionUsuarios from "./pages/GestionUsuarios";
import Equipos from "./pages/Equipos";
import "./index.css";

function App() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setAuthenticated(!!token);
  }, []);

  const handleLogin = () => {
    setAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthenticated(false);
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
        <Route path="*" element={<Navigate to={authenticated ? "/usuarios" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;