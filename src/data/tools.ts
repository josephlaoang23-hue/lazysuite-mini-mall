import ChatGptCleaner from "../tools/featured/ChatGptCleaner";
import TextHumanizer from "../tools/featured/TextHumanizer";
import BulkFileRenamer from "../tools/featured/BulkFileRenamer";
import LogicMapStudio from "../tools/my-tools/LogicMapStudio";
import TranscriptCleaner from "../tools/my-tools/TranscriptCleaner";
import PirateTranslator from "../tools/creator-tools/PirateTranslator";
import PdfDashboardConverter from "../tools/my-tools/PdfDashboardConverter";
import PrivacyShield from "../tools/my-tools/PrivacyShield";
import RepoArchDiagrammer from "../tools/my-tools/RepoArchDiagrammer";
import UiAccessibilityAuditor from "../tools/my-tools/UiAccessibilityAuditor";
import TrashCheatSheet from "../tools/business-tools/TrashCheatSheet";
import ThriftAppraisalGrid from "../tools/business-tools/ThriftAppraisalGrid";
import RoadsideEstimateProofer from "../tools/business-tools/RoadsideEstimateProofer";
import DotLogAuditor from "../tools/business-tools/DotLogAuditor";
import AmazonInvoiceAuditor from "../tools/business-tools/AmazonInvoiceAuditor";


export interface ToolMeta {
  id: string;
  title: string;
  desc: string;
  component: any;
  creator: "Admin" | "Community";
  category: "General Utility Tool" | "Business Tools";
  isLive: boolean;
}

export const allTools: ToolMeta[] = [
  {
    id: "cleaner",
    title: "ChatGPT Copy-Paste Formatting Cleaner",
    desc: "Removes ChatGPT formatting artifacts for clean pasting anywhere.",
    component: ChatGptCleaner,
    creator: "Admin",
    category: "General Utility Tool",
    isLive: true,
  },
  {
    id: "humanizer",
    title: "Zero-Cost AI Conversational Text Humanizer",
    desc: "Rewrites robotic AI writing into natural human sounding text.",
    component: TextHumanizer,
    creator: "Admin",
    category: "General Utility Tool",
    isLive: true,
  },
  {
    id: "renamer",
    title: "Smart AI File Renamer",
    desc: "Generates smart bulk filename mappings.",
    component: BulkFileRenamer,
    creator: "Admin",
    category: "General Utility Tool",
    isLive: true,
  },
  {
    id: "logicmap",
    title: "Code-to-State Logic Map Studio",
    desc: "Turns pasted code logic into a visual Mermaid flowchart.",
    component: LogicMapStudio,
    creator: "Admin",
    category: "General Utility Tool",
    isLive: true,
  },
  {
    id: "transcript",
    title: "Intelligent Transcript Structurer",
    desc: "Cleans messy meeting transcripts or audio into organized summaries.",
    component: TranscriptCleaner,
    creator: "Admin",
    category: "General Utility Tool",
    isLive: true,
  },
  {
    id: "pirate",
    title: "Pirate Translator",
    desc: "Converts normal English into classic pirate speech.",
    component: PirateTranslator,
    creator: "Community",
    category: "General Utility Tool",
    isLive: true,
  },
  {
    id: "pdfdashboard",
    title: "PDF Dashboard Converter",
    desc: "Coming Soon",
    component: PdfDashboardConverter,
    creator: "Admin",
    category: "General Utility Tool",
    isLive: false,
  },
  {
    id: "privacyshield",
    title: "Metadata Privacy Shield",
    desc: "Coming Soon",
    component: PrivacyShield,
    creator: "Admin",
    category: "General Utility Tool",
    isLive: false,
  },
  {
    id: "repoarch",
    title: "Repo Architecture Diagrammer",
    desc: "Coming Soon",
    component: RepoArchDiagrammer,
    creator: "Admin",
    category: "General Utility Tool",
    isLive: false,
  },
  {
    id: "uiaccessibility",
    title: "UI Accessibility Auditor",
    desc: "Coming Soon",
    component: UiAccessibilityAuditor,
    creator: "Admin",
    category: "General Utility Tool",
    isLive: false,
  },
  {
    id: "trashcheatsheet",
    title: "Guest Trash & Checkout Cheat Sheet",
    desc: "Turn a city trash calendar screenshot into a guest-friendly pickup card.",
    component: TrashCheatSheet,
    creator: "Admin",
    category: "Business Tools",
    isLive: true,
  },
  {
    id: "thriftappraisal",
    title: "Visual Thrift Appraisal Grid",
    desc: "Get an estimated resale value and eBay listing draft from a photo.",
    component: ThriftAppraisalGrid,
    creator: "Admin",
    category: "Business Tools",
    isLive: true,
  },
  {
    id: "roadsideestimate",
    title: "Roadside Estimate Proofer",
    desc: "Turn a photo and rough notes into a professional repair estimate.",
    component: RoadsideEstimateProofer,
    creator: "Admin",
    category: "Business Tools",
    isLive: true,
  },
  {
    id: "dotlogauditor",
    title: "DOT Log Quick-Check",
    desc: "A quick first-pass review of your driving log before you submit it.",
    component: DotLogAuditor,
    creator: "Admin",
    category: "Business Tools",
    isLive: true,
  },
  {
    id: "amazoninvoiceauditor",
    title: "Supplier Invoice Field Checker",
    desc: "Check your supplier invoice against standard commercial invoice fields.",
    component: AmazonInvoiceAuditor,
    creator: "Admin",
    category: "Business Tools",
    isLive: true,
  },
];

// Kept in case anything else still imports the old name
export const featuredTools = allTools;