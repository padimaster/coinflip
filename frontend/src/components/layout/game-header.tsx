import React from "react";

export default function GameHeader({ headerText }: { headerText: string }) {
  return (
    <div className="mb-8">
      <h1 className="pixel-font text-white text-2xl md:text-3xl text-center">
        {headerText}
      </h1>
    </div>
  );
}
