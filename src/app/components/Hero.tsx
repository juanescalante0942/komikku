"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";

import Carousel from "../components/Carousel";
import Updates from "../components/Updates";

const Hero = () => {
  const router = useRouter();

  return (
    <>
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, staggerChildren: 0.15 },
          },
        }}
        className="pt-28 lg:pt-38"
      >
        <div className="container items-center lg:grid lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="hidden lg:block"
          >
            <figure className="w-full max-w-[380px] overflow-hidden">
              <Image
                src="/images/Hero.svg"
                width={400}
                height={400}
                alt="Komikku"
                className="w-full"
              />
            </figure>
          </motion.div>

          <div className="flex flex-col gap-5">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                visible: { transition: { staggerChildren: 0.15 } },
              }}
              className="flex flex-col gap-3"
            >
              <motion.p
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.4 }}
                className="text-5xl font-semibold text-[var(--foreground)]"
              >
                Welcome to{" "}
                <span className="text-[var(--primary)] font-bold">Komikku</span>
              </motion.p>
              <motion.p
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.4 }}
                className="text-2xl text-[var(--secondary)] font-light"
              >
                Your Seamless Manga Reading Experience
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
              viewport={{ once: true }}
              className="text-[var(--foreground)] leading-relaxed text-justify flex-col gap-4 flex"
            >
              <div>
                Komikku is a clean, fast, and intuitive manga reader that lets
                you dive straight into your favorite stories — no login
                required.
              </div>{" "}
              <div>
                Whether you’re into action, romance, fantasy, or slice of life,
                Komikku delivers a smooth reading experience across devices.
              </div>{" "}
              <div>
                Explore by genre, search smarter with <strong>MangAI</strong>,
                and pick up right where you left off by adding it to your
                favorites.{" "}
              </div>
              <button
                onClick={() => router.push("/library")}
                className="group flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--foreground)] py-4 px-6 rounded-lg transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg"
              >
                <BookOpen className="w-5 h-5 transition-transform duration-300 group-hover:-rotate-12" />
                Start Reading!
              </button>
            </motion.div>
          </div>
        </div>
      </motion.section>
      {/* Dev top picks */}
      <section className="pt-20 lg:pt-30">
        <div className="container">
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.4 }}
            className="text-3xl font-semibold text-[var(--secondary)] text-center"
          >
            Dev&apos;s Top Picks
          </motion.p>
          <Carousel />
        </div>
      </section>
      {/* Latest Updates */}
      <section className="pt-20 lg:pt-30">
        <div className="container">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-semibold text-[var(--secondary)] text-center"
          >
            Latest Updates
          </motion.p>
          <Updates />
        </div>
      </section>
    </>
  );
};

export default Hero;
