import { useEffect } from "react";

export default function HubPageStyle() {
  useEffect(() => {
    document.body.classList.add("nd-hub-page");
    return () => document.body.classList.remove("nd-hub-page");
  }, []);
  return null;
}
