"use client";

import { ReactNode, useEffect } from "react";

export const ErudaProvider = (props: { children: ReactNode }) => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Dynamically import eruda only in the browser
      import("eruda")
        .then((eruda) => {
          try {
            eruda.default.init();
          } catch (error) {
            console.log("Eruda failed to initialize", error);
          }
        })
        .catch((error) => {
          console.log("Eruda failed to load", error);
        });
    }
  }, []);

  return <>{props.children}</>;
};
