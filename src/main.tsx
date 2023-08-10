import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "normalize.css";
import "./styles.css";
import { getName, getVersion } from "@tauri-apps/api/app";
import { appWindow } from "@tauri-apps/api/window";
import { checkUpdate } from "@tauri-apps/api/updater";

(() => {
  /** 设置窗口标题加入版本号 */
  (async () => {
    try {
      appWindow.setTitle(`${await getName()} ${await getVersion()}`);
    } catch {
      throw new Error("设置窗口标题失败");
    }
  })();

  /** 检查版本 */
  (async () => {
    const update = await checkUpdate();
    console.log(update);
  })();
})();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
