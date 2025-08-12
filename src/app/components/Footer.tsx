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
    <footer className=" text-zinc-400 ">
      <div className="container  max-w-6xl mx-auto py-16 px-4">
        <div className="flex flex-col items-center justify-center gap-12 md:flex-row md:items-start md:justify-between">
          <div className="flex-shrink-0">
            <Image
              src="/images/logo.svg"
              alt="Juan Escalante Logo"
              width={200}
              height={200}
              className="mx-auto md:mx-0"
            />
          </div>
          <div>
            <h4 className="text-zinc-100 font-semibold mb-4 text-center md:text-left">
              Sitemap
            </h4>
            <ul className="space-y-2 text-center md:text-left">
              {sitemap.map(({ label, href }, idx) => (
                <li key={idx}>
                  <a href={href} className="hover:text-white transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-zinc-100 font-semibold mb-4 text-center md:text-left">
              Connect with the Creator
            </h4>
            <ul className="space-y-2 text-center md:text-left">
              {socials.map(({ label, href }, idx) => (
                <li key={idx}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="text-center py-6 text-md text-zinc-400">
        © 2025 Juan Escalante. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
