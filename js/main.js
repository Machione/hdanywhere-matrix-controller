import { init, updateAll } from "./page.js";
init();
window.setInterval(updateAll, 30000);
updateAll();
