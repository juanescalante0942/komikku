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
            className="hidden lg:block mx-auto"
            viewport={{ once: true }}
            initial={{ y: 0 }}
            animate={{ y: [0, -10, 0] }}
            transition={{
              repeat: Infinity,
              repeatType: "loop",
              duration: 1.5,
              ease: "easeInOut",
            }}
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
                className="text-xl text-[var(--secondary)] font-light"
              >
                Discover, read, and fall in love with manga seamlessly.
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
              viewport={{ once: true }}
              className="text-[var(--foreground)] leading-relaxed text-justify flex-col gap-4 flex font-light"
            >
              <div>
                Komikku is your clean, fast, and intuitive manga reader—crafted
                so you can dive straight into the stories you love, no sign-ups,
                no fuss.
              </div>{" "}
              <div>
                From action-packed adventures to heartwarming romances, from
                epic fantasies to everyday slice-of-life moments, Komikku
                delivers a smooth and immersive experience on any device.
              </div>{" "}
              <div>
                With smart tools like MangaAI for personalized recommendations,
                easy browsing by genre, and a favorites system to save your
                progress, exploring manga has never felt this effortless.
              </div>{" "}
              <button
                onClick={() => router.push("/library")}
                className="group flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--foreground)] py-4 px-6 rounded-lg transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg"
              >
                <BookOpen className="w-5 h-5 transition-transform duration-300 group-hover:-rotate-12" />
                Start Reading Now!
              </button>
            </motion.div>
          </div>
        </div>
      </motion.section>
      {/* Dev's Top Picks */}
      <section className="pt-20 lg:pt-30">
        <div className="container text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-semibold tracking-tight text-[var(--foreground)] mb-3"
          >
            Dev&apos;s Top Picks
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="w-30 h-1 mx-auto mb-4 bg-[var(--primary)] rounded-full"
          ></motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-[var(--secondary)] text-md font-light max-w-2xl mx-auto mt-2"
          >
            A selection of handpicked manga chosen by the developer to help you
            discover standout titles worth reading.
          </motion.p>

          <Carousel />
        </div>
      </section>

      {/* Latest Updates */}
      <section className="pt-20 lg:pt-30">
        <div className="container text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-semibold tracking-tight text-[var(--foreground)] mb-3"
          >
            Latest Updates
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="w-30 h-1 mx-auto mb-4 bg-[var(--primary)] rounded-full"
          ></motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-[var(--secondary)] text-md font-light max-w-2xl mx-auto mt-2"
          >
            Stay up to date with the newest chapters and recently added manga so
            you never miss a release.
          </motion.p>

          <Updates />
        </div>
      </section>
    </>
  );
};

export default Hero;
