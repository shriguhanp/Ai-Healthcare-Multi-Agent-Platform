import { initRAG } from "./ragEngine.js";
console.log("Imported ragEngine OK");
initRAG().then(() => console.log("initRAG completed")).catch(e => console.error(e));
