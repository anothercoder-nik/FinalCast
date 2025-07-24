"use client";

import React from "react";
import { WobbleCard } from "./wobble-card";
import { Link } from "@tanstack/react-router";

export function WobbleCardDemo() {
  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto w-full">
<Link href="/create" className="col-span-1 lg:col-span-2 h-full min-h-[500px] lg:min-h-[300px]">
  <WobbleCard
    containerClassName="w-full h-full bg-gradient-to-l from-[#09122C] to-[#4E6688]"
    className=""
    style={{
        backgroundImage: "url(/noise.webp)",
        backgroundSize: "30%",
      }}>
    <div className="max-w-xs">
      <h2 className="text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
        Create Your Studio
      </h2>
      <p className="mt-4 text-left text-base/6 text-neutral-200">
        Record, edit, and publish your podcasts and videos with ease.
      </p>
    </div>
    <img
      src="/linear.webp"
      width={500}
      height={500}
      alt="linear demo image"
      className="absolute -right-4 lg:-right-[40%] grayscale filter -bottom-10 object-contain rounded-2xl" />
  </WobbleCard>
</Link>
<Link href="#" className="col-span-1 min-h-[300px]">
  <WobbleCard containerClassName="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600" style={{
        backgroundImage: "url(/noise.webp)",
        backgroundSize: "30%",
      }}>
    <h2
      className="max-w-80  text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
     Join the Studio
    </h2>
    <p className="mt-4 max-w-[26rem] text-left  text-base/6 text-neutral-200">
      Join a studio and start recording with your friends.
    </p>
  </WobbleCard>
</Link>
<Link href="/content" className="col-span-1 min-h-[300px]">
  <WobbleCard containerClassName="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600" style={{
        backgroundImage: "url(/noise.webp)",
        backgroundSize: "30%",
      }}>
    <h2
      className="max-w-80  text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
      Your Content
    </h2>
    <p className="mt-4 max-w-[26rem] text-left  text-base/6 text-neutral-200">
      Manage and edit your content with our powerful tools.
    </p>
  </WobbleCard>
</Link>
<Link href="#" className="col-span-2 min-h-[300px]">
<WobbleCard
  containerClassName="col-span-1 lg:col-span-3 bg-gradient-to-l from-blue-500 to-purple-600 min-h-[500px] lg:min-h-[600px] xl:min-h-[300px]"
  style={{
        backgroundImage: "url(/noise.webp)",
        backgroundSize: "30%",
      }}>
  <div className="max-w-sm">
    <h2
      className="max-w-sm md:max-w-lg  text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
      View Your Studios
    </h2>
    <p className="mt-4 max-w-[26rem] text-left  text-base/6 text-neutral-200">
      View and manage all your studios in one place.
    </p>
  </div>
  <img
    src="/linear.webp"
    width={500}
    height={500}
    alt="linear demo image"
    className="absolute -right-10 md:-right-[40%] lg:-right-[20%] -bottom-10 object-contain rounded-2xl" />
</WobbleCard>
</Link>
    </div>
  );
}
