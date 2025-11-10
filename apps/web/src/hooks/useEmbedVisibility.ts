import { useEffect, useState } from "react";

export function useEmbedVisibility() {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [withExitX, setWithExitX] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const urlParams = new URLSearchParams(window.location.search);
    setWithExitX(urlParams.get("withExitX") === "true");
    setIsVisible(urlParams.get("chatbox") !== "false");
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "openChat") {
        setIsVisible(true);
      } else if (event.data === "closeChat") {
        setIsVisible(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const close = () => {
    setIsVisible(false);
    if (window.parent) {
      window.parent.postMessage("closeChat", "*");
    }
  };

  return { isMounted, isVisible, withExitX, close };
}
