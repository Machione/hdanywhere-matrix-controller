import { init, updateAll } from "./page.js";

init();
window.setInterval(updateAll, 10000); // Auto refresh the page every x milliseconds
updateAll();
