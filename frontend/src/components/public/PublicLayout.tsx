import { Suspense } from "react";
import { Outlet } from "react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CreoInlineLoader } from "../ui/CreoLoader";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#050810] text-[#F8FAFC]">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<CreoInlineLoader className="min-h-[70vh]" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
