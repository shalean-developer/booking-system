export type ServiceType = "standard" | "deep" | "move" | "airbnb" | "carpet";

export type ServiceIconName = "Sparkles" | "Layers" | "Home" | "Calendar" | "Wind";

export interface Service {
  id: ServiceType;
  title: string;
  description: string;
  price: number;
  iconName: ServiceIconName;
}

export const SERVICES: Service[] = [
  { id: "standard", title: "Standard Cleaning", description: "Regular upkeep for your living space.", price: 450, iconName: "Sparkles" },
  { id: "deep", title: "Deep Cleaning", description: "Thorough intensive cleaning for every corner.", price: 850, iconName: "Layers" },
  { id: "move", title: "Move In / Out", description: "Specialized cleaning for transitions.", price: 1200, iconName: "Home" },
  { id: "airbnb", title: "Airbnb Cleaning", description: "Fast turnaround for guest satisfaction.", price: 650, iconName: "Calendar" },
  { id: "carpet", title: "Carpet Cleaning", description: "Professional stain and dirt removal.", price: 350, iconName: "Wind" },
];

export const LOCATIONS = [
  { name: "Sea Point", slug: "sea-point" },
  { name: "Claremont", slug: "claremont" },
  { name: "Durbanville", slug: "durbanville" },
  { name: "Observatory", slug: "observatory" },
  { name: "Century City", slug: "century-city" },
  { name: "Table View", slug: "table-view" },
  { name: "Gardens", slug: "gardens" },
  { name: "Constantia", slug: "constantia" },
] as const;

export const FAQS: { q: string; a: string }[] = [
  { q: "Are your cleaners vetted?", a: "Yes, every professional on our platform undergoes a rigorous background check and vetting process." },
  { q: "Do I need to be home?", a: "It's entirely up to you. Many clients provide access instructions, while others prefer to be present." },
  { q: "What if I'm not happy?", a: "We offer a 100% satisfaction guarantee. If anything is missed, we'll return to fix it at no cost." },
  { q: "Do you bring your own supplies?", a: "By default, our cleaners bring standard supplies. Heavy equipment like vacuum cleaners can be requested for a small fee." },
];

export const LOCATION_BASE = "/growth/local/cleaning-services/cape-town" as const;
