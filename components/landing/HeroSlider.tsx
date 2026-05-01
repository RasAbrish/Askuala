"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1400&h=600&fit=crop&q=80",
    alt: "Students studying together",
    headline: "Learn smarter with AI",
    sub: "Askuala turns your textbook into an interactive study companion.",
  },
  {
    src: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1400&h=600&fit=crop&q=80",
    alt: "Open textbook on desk",
    headline: "Flashcards & Quizzes in seconds",
    sub: "Upload any PDF — get AI-generated study tools instantly.",
  },
  {
    src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&h=600&fit=crop&q=80",
    alt: "Collaborative learning",
    headline: "Built for Ethiopian students",
    sub: "Supports Amharic, Oromo, Tigrinya & English — with the national curriculum in mind.",
  },
  {
    src: "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=1400&h=600&fit=crop&q=80",
    alt: "Student on laptop",
    headline: "Track your progress",
    sub: "Dashboard streaks, exam readiness scores, and timed practice quizzes.",
  },
];

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, paused]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {SLIDES.map((slide, i) => (
          <div key={i} className="relative min-w-full">
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              sizes="100vw"
              className="object-cover"
              priority={i === 0}
            />
            <div className="h-[340px] w-full sm:h-[420px]" />
            <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-black/70 via-black/30 to-transparent pb-10 text-center text-white">
              <h2 className="text-2xl font-bold drop-shadow-lg sm:text-4xl">
                {slide.headline}
              </h2>
              <p className="mt-2 max-w-lg text-sm opacity-90 drop-shadow sm:text-base">
                {slide.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === current
                ? "w-6 bg-white"
                : "w-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={() => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length)}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur transition hover:bg-black/50"
      >
        ‹
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur transition hover:bg-black/50"
      >
        ›
      </button>
    </div>
  );
}
