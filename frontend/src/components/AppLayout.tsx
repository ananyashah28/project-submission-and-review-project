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
  fluid?: boolean;
  hideNavLinks?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  showFooter = true,
  fluid = false,
  hideNavLinks = false,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header fluid={fluid} hideNavLinks={hideNavLinks} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default AppLayout;
