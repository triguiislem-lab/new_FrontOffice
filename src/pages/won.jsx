// Create a reusable button component for dynamic label and destination
import React from "react";
import { Link } from "react-router-dom";

const DynamicButton = ({ label, to }) => {
  return (
    <Link
      to={to}
      className="inline-block font-light text-[#9D7553] border border-[#9D7553] bg-transparent px-8 py-3 rounded-md text-md tracking-wider transition-all duration-300 shadow-sm relative overflow-hidden group"
    >
      <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
        {label}
      </span>
      <span className="absolute inset-0 w-0 bg-[#9D7553] transition-all duration-300 ease-out group-hover:w-full left-0"></span>
    </Link>
  );
};

export default DynamicButton;