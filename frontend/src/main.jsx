import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#1B2740",
            border: "1px solid rgba(201,154,74,0.25)",
            color: "#F2EDE3",
            fontFamily: '"Archivo", Inter, system-ui, sans-serif',
            fontSize: "14px",
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>
);
