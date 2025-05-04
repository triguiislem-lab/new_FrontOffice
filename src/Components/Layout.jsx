import React from 'react';
import Navbar from '../widgets/layout/navbar';
import { Footer } from '../widgets/layout';

/**
 * Layout component that wraps the application with a consistent navbar and footer
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render within the layout
 * @returns {JSX.Element} Layout component with navbar, content, and footer
 */
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800 font-serif">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
