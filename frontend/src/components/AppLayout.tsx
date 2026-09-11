"use client";

/**
 * AppLayout Component
 * Main application layout with Header and Footer
 * Use this for authenticated pages
 */
import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface AppLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  showFooter = true 
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default AppLayout;
