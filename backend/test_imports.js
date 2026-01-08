
(async () => {
    try {
        const { RecursiveCharacterTextSplitter } = await import("@langchain/textsplitters");
        console.log("Splitter OK");
    } catch (e) { console.log("Splitter Failed: " + e.message); }
})();
