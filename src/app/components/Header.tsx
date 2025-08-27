/* eslint-disable @next/next/no-html-link-for-pages */
"use client";
import Navbar from "./Navbar";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const Header = () => {
  const [mounted, setMounted] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return; // Don't run scroll logic until after hydration

    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mounted]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/search/${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full h-20 flex items-center z-40 bg-gradient-to-b from-zinc-900 to-zinc-900/0 transition-transform duration-300 ${
          mounted && hidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="max-w-screen-2xl w-full mx-auto px-4 flex justify-between items-center md:px-6 gap-4">
          {/* Logo */}
          <h1>
            <a href="/" className="logo">
              <Image
                src="/images/logo.svg"
                width={200}
                height={20}
                alt="Komikku"
              />
            </a>
          </h1>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Menu button */}
            <button
              className="menu-btn"
              onClick={() => setNavOpen((prev) => !prev)}
            >
              <span className="material-symbols-rounded">
                {navOpen ? "close" : "menu"}
              </span>
            </button>

            <Navbar navOpen={navOpen} />
            {/* Search button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-xl ring-inset ring-1 ring-zinc-50/[0.02] backdrop-blur-lg hover:bg-zinc-50/15 transition-[transform,background-color] active:scale-95"
            >
              <span className="material-symbols-rounded text-white">
                search
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 p-4 flex justify-center"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSearchOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-md mt-24"
              onClick={(e) => e.stopPropagation()}
            >
              <form
                onSubmit={handleSearch}
                className="relative flex bg-zinc-900 border border-[var(--border)] rounded-lg overflow-hidden shadow-lg"
              >
                {/* Search icon */}
                <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  search
                </span>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search manga..."
                  className="flex-1 pl-10 pr-4 p-4 bg-transparent text-white placeholder-gray-400 focus:outline-none"
                  autoFocus
                />

                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="px-4 flex items-center justify-center text-white hover:bg-zinc-800"
                >
                  <span className="material-symbols-rounded">close</span>
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
