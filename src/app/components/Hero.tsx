import Link from "next/link";
import { Coffee } from "lucide-react";

import Carousel from "../components/Carousel";
import ContinueReading from "../components/ContinueReading";
import MangaShelf from "../components/MangaShelf";
import Updates from "../components/Updates";

type SectionHeaderProps = {
  title: string;
  description: string;
};

function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="home-section-header">
      <h2>{title}</h2>
      <div className="home-section-rule" />
      <p>{description}</p>
    </div>
  );
}

const Hero = () => {
  return (
    <>
      <section className="home-hero">
        <div className="container home-hero-editorial-intro">
          <h1>One chapter is a lie we tell ourselves.</h1>
          <p>Six stories with absolutely no respect for your bedtime.</p>
          <div className="home-hero-editorial-actions">
            <Link href="/library">Browse the full library</Link>
            <a
              href="https://www.buymeacoffee.com/juandev_"
              target="_blank"
              rel="noreferrer"
            >
              <Coffee className="h-4 w-4" aria-hidden="true" />
              Buy me a coffee
            </a>
          </div>
        </div>
        <div className="home-hero-editorial-carousel">
          <Carousel />
        </div>
      </section>
      <ContinueReading />
      <section className="home-section home-section-updates">
        <div className="container home-split-section">
          <SectionHeader title="Latest Updates" description="New chapters, ready when you are." />
          <Updates />
        </div>
      </section>

      <section className="home-section home-section-popular home-section-secondary">
        <div className="container home-split-section">
          <SectionHeader
            title="Most Popular"
            description="The highest-rated manga on MangaDex, ready for your next obsession."
          />
          <MangaShelf sort="rating" limit={6} />
        </div>
      </section>

      <section className="home-section home-section-new home-section-secondary home-section-last">
        <div className="container">
          <SectionHeader
            title="New on Komikku"
            description="Freshly catalogued series to explore before they find everyone else's list."
          />
          <MangaShelf sort="createdAt" limit={6} />
        </div>
      </section>
    </>
  );
};

export default Hero;
