import ChatGptCleaner from "../tools/daily-tools/ChatGptCleaner";
import TextHumanizer from "../tools/daily-tools/TextHumanizer";
import BulkFileRenamer from "../tools/daily-tools/BulkFileRenamer";
import ChatOptOutGuide from "../tools/daily-tools/ChatOptOutGuide";
import UtilityBillAnalyzer from "../tools/daily-tools/UtilityBillAnalyzer";
import PdfDashboardConverter from "../tools/daily-tools/PdfDashboardConverter";

import TrashCheatSheet from "../tools/business-tools/TrashCheatSheet";
import ThriftAppraisalGrid from "../tools/business-tools/ThriftAppraisalGrid";
import RoadsideEstimateProofer from "../tools/business-tools/RoadsideEstimateProofer";
import DotLogAuditor from "../tools/business-tools/DotLogAuditor";
import AmazonInvoiceAuditor from "../tools/business-tools/AmazonInvoiceAuditor";
import ChargebackWriter from "../tools/business-tools/ChargebackWriter";

import PromptCompressor from "../tools/dev-tools/PromptCompressor";
import LegacyCodeModernizer from "../tools/dev-tools/LegacyCodeModernizer";
import LogicMapStudio from "../tools/dev-tools/LogicMapStudio";
import RepoArchDiagrammer from "../tools/dev-tools/RepoArchDiagrammer";
import MultiAgentBlueprintGenerator from "../tools/dev-tools/MultiAgentBlueprintGenerator";

import ConflictAuditor from "../tools/research-tools/ConflictAuditor";
import TranscriptEvidenceMatrix from "../tools/research-tools/TranscriptEvidenceMatrix";
import AbstractSynthesizer from "../tools/research-tools/AbstractSynthesizer";

import PrivacyShield from "../tools/security-tools/PrivacyShield";
import PhishingDissector from "../tools/security-tools/PhishingDissector";
import DarkPatternAuditor from "../tools/security-tools/DarkPatternAuditor";

import TranscriptCleaner from "../tools/education-tools/TranscriptCleaner";
import UiAccessibilityAuditor from "../tools/education-tools/UiAccessibilityAuditor";


export interface ToolMeta {
  id: string;
  title: string;
  desc: string;
  component: any;
  creator: "Admin" | "Community";
  category:
    | "Daily Tool"
    | "Business Tool"
    | "Dev Tool"
    | "Research Tool"
    | "Security Tool"
    | "Education Tool"
    | "Creator Tool";
  isLive: boolean;
}

export const allTools: ToolMeta[] = [
  // --- Daily Tools ---
  { id: "cleaner", title: "ChatGPT Copy-Paste Formatting Cleaner", desc: "Removes ChatGPT formatting artifacts for clean pasting anywhere.", component: ChatGptCleaner, creator: "Admin", category: "Daily Tool", isLive: true },
  { id: "humanizer", title: "Zero-Cost AI Conversational Text Humanizer", desc: "Rewrites robotic AI writing into natural human sounding text.", component: TextHumanizer, creator: "Admin", category: "Daily Tool", isLive: true },
  { id: "renamer", title: "Smart AI File Renamer", desc: "Generates smart bulk filename mappings.", component: BulkFileRenamer, creator: "Admin", category: "Daily Tool", isLive: true },
  { id: "chatoptout", title: "Customer Service Human Agent Finder", desc: "Find the fastest path to a real human rep instead of a support chatbot.", component: ChatOptOutGuide, creator: "Admin", category: "Daily Tool", isLive: true },
  { id: "utilitybillanalyzer", title: "Utility Bill Analyzer", desc: "Understand every line item on your bill and get a dispute template.", component: UtilityBillAnalyzer, creator: "Admin", category: "Daily Tool", isLive: true },
  { id: "pdfdashboard", title: "PDF Dashboard Converter", desc: "Turn a financial statement or data sheet into an instant visual dashboard.", component: PdfDashboardConverter, creator: "Admin", category: "Daily Tool", isLive: true },

  // --- Business Tools ---
  { id: "trashcheatsheet", title: "Guest Trash & Checkout Cheat Sheet", desc: "Turn a city trash calendar screenshot into a guest-friendly pickup card.", component: TrashCheatSheet, creator: "Admin", category: "Business Tool", isLive: true },
  { id: "thriftappraisal", title: "Visual Thrift Appraisal Grid", desc: "Get an estimated resale value and eBay listing draft from a photo.", component: ThriftAppraisalGrid, creator: "Admin", category: "Business Tool", isLive: true },
  { id: "roadsideestimate", title: "Roadside Estimate Proofer", desc: "Turn a photo and rough notes into a professional repair estimate.", component: RoadsideEstimateProofer, creator: "Admin", category: "Business Tool", isLive: true },
  { id: "dotlogauditor", title: "DOT Log Quick-Check", desc: "A quick first-pass review of your driving log before you submit it.", component: DotLogAuditor, creator: "Admin", category: "Business Tool", isLive: true },
  { id: "amazoninvoiceauditor", title: "Supplier Invoice Field Checker", desc: "Check your supplier invoice against standard commercial invoice fields.", component: AmazonInvoiceAuditor, creator: "Admin", category: "Business Tool", isLive: true },
  { id: "chargebackwriter", title: "Chargeback Dispute Evidence Writer", desc: "Organize evidence into a professional dispute response.", component: ChargebackWriter, creator: "Admin", category: "Business Tool", isLive: true },

  // --- Dev Tools ---
  { id: "promptcompressor", title: "Context-Insulated System Prompt Compressor", desc: "Compress a wordy system prompt into dense, token-efficient syntax.", component: PromptCompressor, creator: "Admin", category: "Dev Tool", isLive: true },
  { id: "legacycodemodernizer", title: "Legacy Code Explainer & Modernizer", desc: "Explain old PHP, jQuery, VB, or COBOL code and get a modern equivalent.", component: LegacyCodeModernizer, creator: "Admin", category: "Dev Tool", isLive: true },
  { id: "logicmap", title: "Code-to-State Logic Map Studio", desc: "Turns pasted code logic into a visual Mermaid flowchart.", component: LogicMapStudio, creator: "Admin", category: "Dev Tool", isLive: true },
  { id: "repoarch", title: "Repo Architecture Diagrammer", desc: "See how your project's files connect as a visual architecture diagram.", component: RepoArchDiagrammer, creator: "Admin", category: "Dev Tool", isLive: true },
  { id: "multiagentblueprint", title: "AI Context-Shift Multi-Agent Blueprint Generator", desc: "Turns a massive project brain dump into a multi-agent architecture with a visual flowchart.", component: MultiAgentBlueprintGenerator, creator: "Admin", category: "Dev Tool", isLive: true },

  // --- Research & Analysis ---
  { id: "conflictauditor", title: "Multi-Source Document Conflict & Gap Auditor", desc: "Cross-reference multiple sources to find conflicting facts and gaps.", component: ConflictAuditor, creator: "Admin", category: "Research Tool", isLive: true },
  { id: "transcriptevidence", title: "Chaotic Transcript-to-Structured Evidence Matrix", desc: "Turn a messy transcript into themed quotes with speakers and takeaways.", component: TranscriptEvidenceMatrix, creator: "Admin", category: "Research Tool", isLive: true },
  { id: "abstractsynthesizer", title: "Academic Abstract Synthesizer", desc: "Turn a dense academic abstract into plain language with limitations and takeaways.", component: AbstractSynthesizer, creator: "Admin", category: "Research Tool", isLive: true },

  // --- Privacy & Security ---
  { id: "privacyshield", title: "Metadata Privacy Shield", desc: "Scan a photo for hidden GPS, camera, and timestamp metadata, then strip it out.", component: PrivacyShield, creator: "Admin", category: "Security Tool", isLive: true },
  { id: "phishingdissector", title: "Phishing / Scam Email Dissector", desc: "Paste an email or upload a screenshot to spot phishing red flags.", component: PhishingDissector, creator: "Admin", category: "Security Tool", isLive: true },
  { id: "darkpatternauditor", title: "Dark Pattern UX Auditor", desc: "Scan a checkout or app screenshot for deceptive UX patterns.", component: DarkPatternAuditor, creator: "Admin", category: "Security Tool", isLive: true },

  // --- Education ---
  { id: "transcript", title: "Intelligent Transcript Structurer", desc: "Cleans messy meeting transcripts or audio into organized summaries.", component: TranscriptCleaner, creator: "Admin", category: "Education Tool", isLive: true },
  { id: "uiaccessibility", title: "UI Accessibility Auditor", desc: "Upload a screenshot of your interface for an advisory accessibility scan.", component: UiAccessibilityAuditor, creator: "Admin", category: "Education Tool", isLive: true },

];

// Kept in case anything else still imports the old name
export const featuredTools = allTools;