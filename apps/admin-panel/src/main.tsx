import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import App from "./App";
import { store } from "./store";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";

const brandColor = "#1c2a4e";
const brandLight = "#3d4d72"; // lighter version for primary/mandatory

const theme = createTheme({
  colors: {
    brand: [
      "#e3e7f2", // 0
      "#c6cfe5", // 1
      "#aab7d8", // 2
      "#8d9fcb", // 3
      "#7187be", // 4
      "#546fb1", // 5
      brandLight, // 6
      brandColor, // 7 (main)
      "#16203a", // 8
      "#0f1526", // 9
    ],
  },
  primaryColor: "brand",
  primaryShade: 7,
  components: {
    Button: {
      defaultProps: {
        color: "brand",
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <MantineProvider theme={theme}>
          <Notifications />
          <App />
        </MantineProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
