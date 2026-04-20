export type LinkStatus = "pending" | "live";

export type BacklinkRecord = {
  source: string;
  category: "directory" | "partnership" | "testimonial" | "content-mention";
  targetUrl: string;
  anchorHint?: string;
  status: LinkStatus;
  lastChecked?: string;
  notes?: string;
};

export const BACKLINK_NAP = {
  name: "Shalean Cleaning Services",
  phone: "+27 87 153 5250",
  website: "https://shalean.co.za",
} as const;

export const DIRECTORY_SUBMISSION_TARGETS: Array<{ platform: string; status: LinkStatus; notes?: string }> = [
  { platform: "Google Business Profile", status: "pending", notes: "Primary local entity profile" },
  { platform: "Snupit", status: "pending" },
  { platform: "Yalwa South Africa", status: "pending" },
  { platform: "Cylex South Africa", status: "pending" },
  { platform: "Hotfrog South Africa", status: "pending" },
  { platform: "Local property/rental supplier directories", status: "pending" },
];

export const PARTNERSHIP_OUTREACH_TARGETS: Array<{ type: string; status: LinkStatus; notes?: string }> = [
  { type: "Estate agents (Cape Town)", status: "pending", notes: "Offer handover-clean partnership listing" },
  { type: "Airbnb hosts/managers", status: "pending", notes: "Offer turnover cleaning partner page link" },
  { type: "Property managers", status: "pending", notes: "Offer recurring cleaning partnership profile" },
];

export const TESTIMONIAL_LINK_PIPELINE: Array<{ supplierOrService: string; status: LinkStatus; notes?: string }> = [
  { supplierOrService: "Payments/fintech vendor", status: "pending" },
  { supplierOrService: "Scheduling/ops tool", status: "pending" },
  { supplierOrService: "Equipment/supplies provider", status: "pending" },
];

export const BACKLINK_TRACKER: BacklinkRecord[] = [
  {
    source: "Google Business Profile",
    category: "directory",
    targetUrl: "/growth/local/cleaning-services/cape-town",
    anchorHint: "cleaning services in Cape Town",
    status: "pending",
  },
  {
    source: "Partner listing: Airbnb host network",
    category: "partnership",
    targetUrl: "/growth/local/deep-cleaning/claremont",
    anchorHint: "deep cleaning in Claremont",
    status: "pending",
  },
];
