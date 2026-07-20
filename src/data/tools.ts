import ChatGptCleaner from "../tools/featured/ChatGptCleaner";
import TextHumanizer from "../tools/featured/TextHumanizer";
import BulkFileRenamer from "../tools/featured/BulkFileRenamer";
import LogicMapStudio from "../tools/my-tools/LogicMapStudio";
import TranscriptCleaner from "../tools/my-tools/TranscriptCleaner";


export interface ToolMeta {
  id: string;
  title: string;
  desc: string;
  component: any;
  creator: "Admin" | "Community";
  category: "General Utility Tools" | "Business Tools";
}

export const allTools: ToolMeta[] = [
  {
    id: "cleaner",
    title: "ChatGPT Copy-Paste Formatting Cleaner",
    desc: "Removes ChatGPT formatting artifacts for clean pasting anywhere.",
    component: ChatGptCleaner,
    creator: "Admin",
    category: "General Utility Tools",
  },
  {
    id: "humanizer",
    title: "Zero-Cost AI Conversational Text Humanizer",
    desc: "Rewrites robotic AI writing into natural human sounding text.",
    component: TextHumanizer,
    creator: "Admin",
    category: "General Utility Tools",
  },
  {
    id: "renamer",
    title: "Smart AI File Renamer",
    desc: "Generates smart bulk filename mappings.",
    component: BulkFileRenamer,
    creator: "Admin",
    category: "General Utility Tools",
  },
  {
    id: "logicmap",
    title: "Code-to-State Logic Map Studio",
    desc: "Turns pasted code logic into a visual Mermaid flowchart.",
    component: LogicMapStudio,
    creator: "Admin",
    category: "General Utility Tools",
  },
  {
    id: "transcript",
    title: "Intelligent Transcript Structurer",
    desc: "Cleans messy meeting transcripts or audio into organized summaries.",
    component: TranscriptCleaner,
    creator: "Admin",
    category: "General Utility Tools",
  },
];

// Kept in case anything else still imports the old name
export const featuredTools = allTools;