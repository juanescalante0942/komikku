import Image from "next/image";

const sitemap = [
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Contact", href: "#contact" },
];

const socials = [
  {
    label: "GitHub",
    href: "https://github.com/juanescalante0942",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/juanescalante0942/",
  },
  {
    label: "Gmail",
    href: "mailto:juanescalante0942@gmail.com",
  },
];

const Footer = () => {
  return (
    <footer className="w-full text-zinc-400 ">
      <div className="text-center py-6 text-md text-zinc-400">
        © 2025 Juan Escalante. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
