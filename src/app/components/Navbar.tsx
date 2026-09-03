"use client";
import { usePathname } from "next/navigation";
import { BookOpen, Heart, House } from "lucide-react";

type NavbarProps = {
  hidden?: boolean;
};

const Navbar = ({ hidden = false }: NavbarProps) => {
  const pathname = usePathname();
  const navItems = [
    {
      label: "Home",
      link: "/",
      icon: House,
    },
    {
      label: "Library",
      link: "/library",
      icon: BookOpen,
    },
    {
      label: "Favorites",
      link: "/favorites",
      icon: Heart,
    },
  ];

  return (
    <nav className={`navbar ${hidden ? "hidden-up" : ""}`} aria-label="Main navigation">
      {navItems.map(({ label, link, icon: Icon }) => (
        <a
          key={link}
          href={link}
          className={`nav-link ${pathname === link ? "active" : ""}`}
          aria-current={pathname === link ? "page" : undefined}
        >
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
};

export default Navbar;
