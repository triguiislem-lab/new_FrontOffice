/**
=========================================================
* Material Tailwind Kit React - v2.1.0
=========================================================
* Product Page: https://www.creative-tim.com/product/material-tailwind-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/material-tailwind-dashboard-react/blob/main/LICENSE.md)
* Coded by Creative Tim
=========================================================
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import React from "react";
import ReactDOM from "react-dom/client";
import App from './App.jsx';
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@material-tailwind/react";
import theme from "./theme";
import "./style/tailwind.css";
import "./style/animations.css";
import "./style/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <BrowserRouter>
      <ThemeProvider value={theme}>
        <App />
      </ThemeProvider>
    </BrowserRouter>
);
