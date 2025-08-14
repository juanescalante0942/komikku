"use client";
import { useEffect } from "react";

type NavbarProps = {
  navOpen: boolean;
};

const Navbar = ({ navOpen }: NavbarProps) => {
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
      className: "nav-link",
    },
    {
      label: "Library",
      link: "/library",
      className: "nav-link",
    },
    {
      label: "MangAI",
      link: "/mangai",
      className: "nav-link",
    },
    {
      label: "Favorites",
      link: "/favorites",
      className: "nav-link",
    },
  ];

  return (
    <nav className={"navbar gap-2 " + (navOpen ? "active" : "")}>
      {navItems.map(({ label, link, className }, key) => (
        <a key={key} href={link} className={className}>
          {label}
        </a>
      ))}
      <div className="active-box"></div>
    </nav>
  );
};

export default Navbar;
