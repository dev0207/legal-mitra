"use client";

import { type ReactNode } from "react";
import { DocumentProvider } from "../contexts/DocumentContext";

export default function Providers({ children }: { children: ReactNode }) {
  return <DocumentProvider>{children}</DocumentProvider>;
}
