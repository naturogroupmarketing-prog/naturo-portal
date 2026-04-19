import type { IconName } from "@/components/ui/icon";

// ─── Types ────────────────────────────────────────────────────────────────────

export type IndustryId =
  | "cleaning"
  | "multi-branch"
  | "field-service"
  | "healthcare"
  | "hospitality"
  | "construction";

export interface WorkflowRuleTemplate {
  name: string;
  trigger: string;
  action: string;
  conditions: Record<string, unknown>;
  actionConfig: Record<string, unknown>;
}

export interface IndustryTemplate {
  id: IndustryId;
  name: string;
  tagline: string;
  description: string;
  icon: IconName;
  terminology: {
    location: string;   // e.g. "Site", "Branch", "Ward"
    staff: string;      // e.g. "Cleaners", "Technicians"
    assets: string;     // e.g. "Equipment", "Tools"
    consumables: string; // e.g. "Chemicals", "Supplies"
  };
  assetCategories: string[];
  consumableCategories: string[];
  recommendations: string[];
  defaultWorkflows: WorkflowRuleTemplate[];
  postSetupChecklist: string[];
}

// ─── Industry definitions ─────────────────────────────────────────────────────

export const INDUSTRY_TEMPLATES: Record<IndustryId, IndustryTemplate> = {

  cleaning: {
    id: "cleaning",
    name: "Cleaning & Facilities",
    tagline: "Track equipment, chemicals, and kits across every site.",
    description: "Track vacuums, mops, chemicals, and cleaning supplies across multiple sites.",
    icon: "droplet",
    terminology: {
      location: "Site",
      staff: "Cleaners",
      assets: "Equipment",
      consumables: "Chemicals & Supplies",
    },
    assetCategories: [
      "Vacuums",
      "Mops & Buckets",
      "Steam Cleaners",
      "Vehicles",
      "Phones & Devices",
      "Keys & Access",
      "Safety Equipment",
    ],
    consumableCategories: [
      "Cleaning Chemicals",
      "Bin Liners",
      "Cloths & Wipes",
      "Gloves",
      "Mop Heads",
      "Paper Products",
      "PPE",
    ],
    recommendations: [
      "Cleaning companies usually track vacuums and chemicals first.",
      "Setting up site-level regions helps assign gear to specific locations.",
      "Starter kits work great for equipping new cleaners on day one.",
    ],
    defaultWorkflows: [
      {
        name: "Low Chemical Stock Alert",
        trigger: "stock_below_threshold",
        action: "send_notification",
        conditions: {},
        actionConfig: { priority: "warning", message: "Cleaning chemical stock is below minimum threshold." },
      },
      {
        name: "Missing Key Escalation",
        trigger: "damage_report_unresolved",
        action: "escalate_to_admin",
        conditions: { daysOpen: 1 },
        actionConfig: { message: "A missing key report has not been resolved within 24 hours." },
      },
      {
        name: "Overdue Equipment Return",
        trigger: "asset_overdue_return",
        action: "escalate_to_admin",
        conditions: { daysOverdue: 7 },
        actionConfig: { message: "Equipment has not been returned to site within the expected timeframe." },
      },
    ],
    postSetupChecklist: [
      "Add your first site as a Region",
      "Import or create your cleaning equipment list",
      "Set minimum stock levels for your chemicals",
      "Create a starter kit for new cleaners",
      "Invite your supervisors and area managers",
    ],
  },

  "multi-branch": {
    id: "multi-branch",
    name: "Multi-Branch Operations",
    tagline: "Centralised visibility across every office and branch.",
    description: "Businesses with multiple offices or branches that need centralised asset oversight.",
    icon: "map-pin",
    terminology: {
      location: "Branch",
      staff: "Staff",
      assets: "Equipment",
      consumables: "Office Supplies",
    },
    assetCategories: [
      "Laptops & Computers",
      "Phones & Mobiles",
      "Furniture",
      "Vehicles",
      "Shared Devices",
      "AV Equipment",
      "Security Equipment",
    ],
    consumableCategories: [
      "Office Supplies",
      "Kitchen Supplies",
      "Cleaning Products",
      "Printer Consumables",
      "First Aid",
    ],
    recommendations: [
      "Multi-branch businesses benefit most from region-based asset tracking.",
      "Set up each office as a separate Region to enable branch-vs-branch comparison.",
      "Transfer workflows help you move equipment between locations with accountability.",
    ],
    defaultWorkflows: [
      {
        name: "Branch Low Stock Alert",
        trigger: "stock_below_threshold",
        action: "send_notification",
        conditions: {},
        actionConfig: { priority: "warning", message: "Branch stock has dropped below minimum threshold." },
      },
      {
        name: "Overdue Asset Return",
        trigger: "asset_overdue_return",
        action: "escalate_to_admin",
        conditions: { daysOverdue: 14 },
        actionConfig: { message: "Asset has not been returned after checkout period." },
      },
      {
        name: "Auto-Draft PO on Zero Stock",
        trigger: "stock_critical",
        action: "create_draft_po",
        conditions: {},
        actionConfig: { targetDays: 30 },
      },
    ],
    postSetupChecklist: [
      "Add each office or branch as a Region",
      "Assign a Branch Manager to each location",
      "Import your existing asset register",
      "Set up inter-branch transfer workflows",
      "Invite your regional managers",
    ],
  },

  "field-service": {
    id: "field-service",
    name: "Field Service Teams",
    tagline: "Know who has what before they leave the depot.",
    description: "Equip mobile teams with tracked gear. Know who has what before they leave the depot.",
    icon: "truck",
    terminology: {
      location: "Depot",
      staff: "Technicians",
      assets: "Tools & Gear",
      consumables: "Parts & Fluids",
    },
    assetCategories: [
      "Vehicles & Vans",
      "Toolkits",
      "Tablets & Devices",
      "PPE",
      "Specialist Equipment",
      "Communication Gear",
    ],
    consumableCategories: [
      "Spare Parts",
      "Fasteners & Fixings",
      "Fluids & Lubricants",
      "Fuel Cards",
      "PPE Consumables",
      "Cleaning Supplies",
    ],
    recommendations: [
      "Field teams benefit most from daily van checklists and tool check-in/out.",
      "Track which technician has which tools to eliminate job-site disputes.",
      "Damage reports with photos help resolve accountability quickly.",
    ],
    defaultWorkflows: [
      {
        name: "Missing Tool Escalation",
        trigger: "damage_report_unresolved",
        action: "escalate_to_admin",
        conditions: { daysOpen: 2 },
        actionConfig: { message: "A missing or damaged tool report has not been resolved." },
      },
      {
        name: "Overdue Tool Return",
        trigger: "asset_overdue_return",
        action: "escalate_to_admin",
        conditions: { daysOverdue: 3 },
        actionConfig: { message: "A tool has not been returned to depot within the expected timeframe." },
      },
      {
        name: "Low Parts Stock Alert",
        trigger: "stock_below_threshold",
        action: "send_notification",
        conditions: {},
        actionConfig: { priority: "warning", message: "Parts stock is below minimum — consider reordering." },
      },
    ],
    postSetupChecklist: [
      "Add your depot(s) as Regions",
      "Register your vehicles and tool kits",
      "Set up daily check-out workflows for field crews",
      "Create starter kits for each role (technician, driver, etc.)",
      "Invite your dispatchers and team leaders",
    ],
  },

  healthcare: {
    id: "healthcare",
    name: "Healthcare & Aged Care",
    tagline: "Track PPE, shared equipment, and compliance across facilities.",
    description: "Track consumables, PPE, and shared equipment across wards, facilities, or care homes.",
    icon: "shield",
    terminology: {
      location: "Facility",
      staff: "Carers",
      assets: "Medical Equipment",
      consumables: "PPE & Supplies",
    },
    assetCategories: [
      "Wheelchairs & Mobility",
      "Hoists & Lifts",
      "Medical Beds",
      "Shared Devices",
      "Tablets & Monitors",
      "Maintenance Tools",
    ],
    consumableCategories: [
      "Gloves",
      "Masks & Respirators",
      "Hand Sanitiser",
      "Wipes & Swabs",
      "Aprons & Gowns",
      "First Aid Supplies",
    ],
    recommendations: [
      "Healthcare facilities should prioritise PPE stock levels and set conservative minimums.",
      "Shared equipment sign-out logs are essential for infection control compliance.",
      "Condition checks help ensure equipment meets safety standards.",
    ],
    defaultWorkflows: [
      {
        name: "Critical PPE Stock Alert",
        trigger: "stock_critical",
        action: "escalate_to_admin",
        conditions: {},
        actionConfig: { message: "A critical PPE item has reached zero stock — immediate reorder required." },
      },
      {
        name: "Low PPE Stock Warning",
        trigger: "stock_below_threshold",
        action: "send_notification",
        conditions: {},
        actionConfig: { priority: "critical", message: "PPE stock is below minimum threshold. Please reorder." },
      },
      {
        name: "Equipment Overdue Return",
        trigger: "asset_overdue_return",
        action: "escalate_to_admin",
        conditions: { daysOverdue: 1 },
        actionConfig: { message: "Shared medical equipment has not been returned to its home location." },
      },
    ],
    postSetupChecklist: [
      "Add each ward, floor, or facility as a Region",
      "Register your shared medical equipment",
      "Set conservative minimum stock levels for all PPE",
      "Enable condition check schedules for critical equipment",
      "Invite your facility managers and nurse managers",
    ],
  },

  hospitality: {
    id: "hospitality",
    name: "Hospitality",
    tagline: "Manage linen, amenities, and equipment across venues.",
    description: "Manage linen, amenities, kitchen supplies, and equipment across hotel or venue locations.",
    icon: "award",
    terminology: {
      location: "Venue",
      staff: "Housekeeping",
      assets: "Equipment",
      consumables: "Linen & Amenities",
    },
    assetCategories: [
      "Housekeeping Trolleys",
      "Vacuums",
      "Laundry Equipment",
      "Kitchen Equipment",
      "Tablets & Devices",
      "Maintenance Tools",
    ],
    consumableCategories: [
      "Linen",
      "Towels",
      "Soap & Toiletries",
      "Cleaning Products",
      "Kitchen Consumables",
      "Guest Amenities",
    ],
    recommendations: [
      "Hospitality operations should track linen par levels by room type.",
      "Housekeeping trolley assignments reduce time searching for supplies.",
      "Set automated reorder triggers on high-turnover amenities.",
    ],
    defaultWorkflows: [
      {
        name: "Low Linen Stock Alert",
        trigger: "stock_below_threshold",
        action: "send_notification",
        conditions: {},
        actionConfig: { priority: "warning", message: "Linen or amenity stock is below minimum threshold." },
      },
      {
        name: "Auto-Draft PO on Zero Stock",
        trigger: "stock_critical",
        action: "create_draft_po",
        conditions: {},
        actionConfig: { targetDays: 14 },
      },
      {
        name: "Equipment Overdue Return",
        trigger: "asset_overdue_return",
        action: "escalate_to_admin",
        conditions: { daysOverdue: 3 },
        actionConfig: { message: "Venue equipment has not been returned to storage." },
      },
    ],
    postSetupChecklist: [
      "Add each venue, floor, or wing as a Region",
      "Set up linen par levels per room type",
      "Register your housekeeping equipment",
      "Create a starter kit for new housekeeping staff",
      "Invite your venue managers and supervisors",
    ],
  },

  construction: {
    id: "construction",
    name: "Construction & Trades",
    tagline: "Track tools, safety gear, and supplies across every site.",
    description: "Track tools, safety gear, and job-site supplies. Reduce loss and improve accountability.",
    icon: "wrench",
    terminology: {
      location: "Site",
      staff: "Tradespeople",
      assets: "Tools & Plant",
      consumables: "Site Supplies",
    },
    assetCategories: [
      "Power Tools",
      "Hand Tools",
      "Ladders & Access",
      "Generators & Plant",
      "Vehicles & Trailers",
      "PPE Equipment",
      "Measuring & Survey",
    ],
    consumableCategories: [
      "Fixings & Fasteners",
      "Cutting Blades & Bits",
      "PPE Consumables",
      "Adhesives & Sealants",
      "Fuel & Lubricants",
      "Safety Supplies",
    ],
    recommendations: [
      "Construction sites see the highest tool loss — check-out workflows significantly reduce this.",
      "Track tools by site to know exactly what's on each job.",
      "High-value plant items benefit from photo condition checks on checkout and return.",
    ],
    defaultWorkflows: [
      {
        name: "Overdue Tool Return",
        trigger: "asset_overdue_return",
        action: "escalate_to_admin",
        conditions: { daysOverdue: 3 },
        actionConfig: { message: "A tool or piece of plant has not been returned to the store." },
      },
      {
        name: "Damage Report Escalation",
        trigger: "damage_report_unresolved",
        action: "escalate_to_admin",
        conditions: { daysOpen: 3 },
        actionConfig: { message: "A tool damage or loss report has been open for 3+ days without resolution." },
      },
      {
        name: "Low Site Supplies Alert",
        trigger: "stock_below_threshold",
        action: "send_notification",
        conditions: {},
        actionConfig: { priority: "warning", message: "Site consumable stock is below minimum threshold." },
      },
    ],
    postSetupChecklist: [
      "Add each job site or depot as a Region",
      "Register your power tools and plant equipment",
      "Set minimum stock levels for consumables (PPE, fixings)",
      "Enable photo-based condition checks for high-value tools",
      "Invite your site supervisors and storemen",
    ],
  },
};

export const INDUSTRY_LIST = Object.values(INDUSTRY_TEMPLATES);
