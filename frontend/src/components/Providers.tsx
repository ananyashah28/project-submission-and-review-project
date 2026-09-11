"use client";

/**
 * Application Providers
 * Wraps the app with all necessary context providers
 */
import React, { ReactNode } from "react";
import { AuthProvider } from "@/context";
import { ToastProvider } from "./Toast";

interface ProvidersProps {
  children: ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
};

export default Providers;
