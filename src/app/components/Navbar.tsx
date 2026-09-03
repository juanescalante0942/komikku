"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { BookOpen, Heart, House } from "lucide-react";

const Navbar = () => {
  const pathname = usePathname();
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.5,
    };

    const sectionIds = navItems.map((item) => item.link.replace("#", ""));
    const sectionElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver((entries) => {
      const visibleEntry = entries.find((entry) => entry.isIntersecting);
      if (!visibleEntry) return;

      const id = visibleEntry.target.id;
      const link = document.querySelector(
        `.nav-link[href="#${id}"]`
      ) as HTMLAnchorElement | null;
      if (!link) return;
      link.classList.add("active");
    }, observerOptions);

    sectionElements.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <nav className="navbar" aria-label="Main navigation">
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
