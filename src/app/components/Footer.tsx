const Footer = () => {
  return (
    <footer className="w-full text-zinc-400">
      <div className="text-center py-6 text-md">
        <p>© 2025 Juan Escalante. All rights reserved.</p>
        <p className="text-sm text-zinc-500">
          All manga content belongs to their respective creators and publishers.
        </p>
        <p className="text-sm text-zinc-500">
          Manga data and reading images provided by{" "}
          <a
            href="https://mangadex.org"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--secondary)] hover:underline"
          >
            MangaDex
          </a>
          .
        </p>
      </div>
    </footer>
  );
};

export default Footer;
