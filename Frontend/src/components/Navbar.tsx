// src/components/Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";
import logo from "../../public/icon.svg"

const Navbar = () => {
  return (
    <nav className="bg-gray-800 text-gray-100 shadow-lg sticky top-0 z-50">
      <div className="px-6 py-4 flex justify-between items-center">
        
         <Link
          to="/"
          className="flex items-center gap-3 text-2xl font-bold text-blue-400 hover:text-blue-300"
        >
          {/* Logo image */}
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <img
              src={logo}
              alt="Logo"
              className="w-6 h-6"
            />
          </div>
          <span>Task Dashboard</span>
        </Link>

        {/* Links */}
        <div className="flex gap-6">
          <Link to="/" className="hover:text-blue-400">
            Dashboard
          </Link>
        
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
