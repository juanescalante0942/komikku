"use client";
import { useKeenSlider } from "keen-slider/react";
import { motion } from "framer-motion";
import "keen-slider/keen-slider.min.css";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";

type MangaPick = {
  id: string;
  title: string;
  image: string;
  imageChar: string;
  titleImage: string;
};

const picks: MangaPick[] = [
  {
    id: "jujutsu-kaisen",
    title: "Jujutsu Kaisen",
    image: "/images/carousel/background/jjk.jpg",
    imageChar: "/images/carousel/character/jjk.png",
    titleImage: "/images/carousel/title/jjk.png",
  },
  {
    id: "chainsaw-man",
    title: "Chainsawman",
    image: "/images/carousel/background/chainsawman.jpg",
    imageChar: "/images/carousel/character/chainsawman.png",
    titleImage: "/images/carousel/title/chainsawman.png",
  },
  {
    id: "jojo-s-bizarre-adventure-part-3-stardust-crusaders-colored",
    title: "Jojo's Bizarre Adventure: Stardust Crusaders",
    image: "/images/carousel/background/jojo.png",
    imageChar: "/images/carousel/character/jojo.png",
    titleImage: "/images/carousel/title/jojo.png",
  },
  {
    id: "vinland-saga",
    title: "Vinland Saga",
    image: "/images/carousel/background/vinland.png",
    imageChar: "/images/carousel/character/vinland.png",
    titleImage: "/images/carousel/title/vinland.png",
  },
  {
    id: "oyasumi-punpun",
    title: "Oyasumi Punpun",
    image: "/images/carousel/background/punpun.jpg",
    imageChar: "/images/carousel/character/punpun.png",
    titleImage: "/images/carousel/title/punpun.png",
  },
  {
    id: "kuroko-no-basket",
    title: "Kuroko's Basketball",
    image: "/images/carousel/background/kuroko.jpg",
    imageChar: "/images/carousel/character/kuroko.png",
    titleImage: "/images/carousel/title/kuroko.png",
  },
];

export default function DevTopPicks() {
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    slides: {
      origin: "center",
      perView: 2,
      spacing: 16,
    },
    breakpoints: {
      "(max-width: 768px)": {
        slides: { perView: 1, spacing: 8 },
      },
      "(min-width: 769px) and (max-width: 1024px)": {
        slides: { perView: 2, spacing: 12 },
      },
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      instanceRef.current?.next();
    }, 3000);
    return () => clearInterval(interval);
  }, [instanceRef]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative mt-4"
    >
      {/* Blur overlays */}
      <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-16 bg-gradient-to-r from-zinc-950 to-transparent" />
      <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-16 bg-gradient-to-l from-zinc-950 to-transparent" />

      {/* Arrows */}
      <button
        onClick={() => instanceRef.current?.prev()}
        className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-lg backdrop-blur-xl p-2 hover:bg-zinc-700 transition"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>
      <button
        onClick={() => instanceRef.current?.next()}
        className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-lg backdrop-blur-xl p-2 hover:bg-zinc-700 transition"
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>

      {/* Carousel */}
      <div ref={sliderRef} className="keen-slider">
        {picks.map((manga) => (
          <Link
            href={`/manga/${manga.id}`}
            key={manga.id}
            className="keen-slider__slide relative w-120 h-80 flex items-center justify-center group drop-shadow-lg"
          >
            {/* Background box with blur + gradient */}
            <div className="absolute inset-0 rounded-lg overflow-hidden z-0">
              <Image
                src={manga.image}
                alt={`${manga.title} background`}
                fill
                className="object-cover brightness-50"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent 
                 transition-colors duration-300 group-hover:from-black/80 group-hover:via-black/40"
              />
            </div>

            {/* Foreground character + Title */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <div className="relative w-full h-full">
                <Image
                  src={manga.imageChar}
                  alt={manga.title}
                  fill
                  className="object-cover drop-shadow-2xl hover:scale-110 transition-transform duration-200"
                />
              </div>

              {/* Title image above character */}
              <div className="absolute bottom-4 z-20 w-3/4 max-w-[240px] group-hover:scale-110 group-hover:-translate-y-5 transition-transform duration-300">
                <Image
                  src={manga.titleImage}
                  alt={`${manga.title} logo`}
                  width={240}
                  height={120}
                  className="object-contain mx-auto drop-shadow-lg"
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
