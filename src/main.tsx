import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@fontsource/hind-siliguri/300.css";
import "@fontsource/hind-siliguri/400.css";
import "@fontsource/hind-siliguri/500.css";
import "@fontsource/hind-siliguri/600.css";
import "@fontsource/hind-siliguri/700.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
