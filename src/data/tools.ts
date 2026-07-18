import ChatGptCleaner from "../tools/featured/ChatGptCleaner";
import TextHumanizer from "../tools/featured/TextHumanizer";
import BulkFileRenamer from "../tools/featured/BulkFileRenamer";


export const featuredTools = [
  {
    id: "cleaner",
    title: "ChatGPT Copy-Paste Formatting Cleaner",
    desc: "Removes ChatGPT formatting artifacts for clean pasting anywhere.",
    component: ChatGptCleaner,
  },
  {
    id: "humanizer",
    title: "Zero-Cost AI Conversational Text Humanizer",
    desc: "Rewrites robotic AI writing into natural human sounding text.",
    component: TextHumanizer,
  },
  {
    id: "renamer",
    title: "Smart AI File Renamer",
    desc: "Generates smart bulk filename mappings.",
    component: BulkFileRenamer,
  },
];