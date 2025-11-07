export type SuburbEntry = {
  name: string;
  slug: string;
};

export type CityArea = {
  slug: string;
  label: string;
  suburbs: SuburbEntry[];
};

/**
 * Canonical list of areas and suburbs for each serviced city.
 * This powers location hubs, suburb templates, and internal linking helpers.
 */
export const CITY_AREA_DATA: Record<string, CityArea[]> = {
  "cape-town": [
    {
      slug: "atlantic-seaboard",
      label: "Atlantic Seaboard",
      suburbs: [
        { name: "Camps Bay", slug: "camps-bay" },
        { name: "Sea Point", slug: "sea-point" },
        { name: "Green Point", slug: "green-point" },
        { name: "Clifton", slug: "clifton" },
        { name: "Bantry Bay", slug: "bantry-bay" },
        { name: "Fresnaye", slug: "fresnaye" },
        { name: "Mouille Point", slug: "mouille-point" },
        { name: "V&A Waterfront", slug: "waterfront" }
      ],
    },
    {
      slug: "city-bowl",
      label: "City Bowl",
      suburbs: [
        { name: "City Centre", slug: "city-centre" },
        { name: "Gardens", slug: "gardens" },
        { name: "Tamboerskloof", slug: "tamboerskloof" },
        { name: "Oranjezicht", slug: "oranjezicht" },
        { name: "Woodstock", slug: "woodstock" },
        { name: "Observatory", slug: "observatory" }
      ],
    },
    {
      slug: "northern-suburbs",
      label: "Northern Suburbs",
      suburbs: [
        { name: "Table View", slug: "table-view" },
        { name: "Bloubergstrand", slug: "bloubergstrand" },
        { name: "Milnerton", slug: "milnerton" },
        { name: "Parow", slug: "parow" },
        { name: "Bellville", slug: "bellville" },
        { name: "Durbanville", slug: "durbanville" },
        { name: "Brackenfell", slug: "brackenfell" }
      ],
    },
    {
      slug: "southern-suburbs",
      label: "Southern Suburbs",
      suburbs: [
        { name: "Claremont", slug: "claremont" },
        { name: "Newlands", slug: "newlands" },
        { name: "Rondebosch", slug: "rondebosch" },
        { name: "Wynberg", slug: "wynberg" },
        { name: "Kenilworth", slug: "kenilworth" },
        { name: "Plumstead", slug: "plumstead" },
        { name: "Constantia", slug: "constantia" },
        { name: "Bishopscourt", slug: "bishopscourt" },
        { name: "Tokai", slug: "tokai" },
        { name: "Bergvliet", slug: "bergvliet" }
      ],
    },
    {
      slug: "false-bay",
      label: "False Bay",
      suburbs: [
        { name: "Muizenberg", slug: "muizenberg" },
        { name: "Fish Hoek", slug: "fish-hoek" },
        { name: "Kalk Bay", slug: "kalk-bay" },
        { name: "Simon's Town", slug: "simons-town" },
        { name: "Lakeside", slug: "lakeside" },
        { name: "Noordhoek", slug: "noordhoek" },
        { name: "Kommetjie", slug: "kommetjie" },
        { name: "Scarborough", slug: "scarborough" }
      ],
    },
    {
      slug: "west-coast",
      label: "West Coast",
      suburbs: [
        { name: "Hout Bay", slug: "hout-bay" },
        { name: "Noordhoek", slug: "noordhoek" },
        { name: "Kommetjie", slug: "kommetjie" },
        { name: "Scarborough", slug: "scarborough" }
      ],
    },
    {
      slug: "helderberg-winelands",
      label: "Helderberg & Winelands",
      suburbs: [
        { name: "Somerset West", slug: "somerset-west" },
        { name: "Strand", slug: "strand" },
        { name: "Stellenbosch", slug: "stellenbosch" }
      ],
    },
  ],
  "johannesburg": [
    {
      slug: "northern-suburbs",
      label: "Northern Suburbs",
      suburbs: [
        { name: "Sandton", slug: "sandton" },
        { name: "Rosebank", slug: "rosebank" },
        { name: "Fourways", slug: "fourways" },
        { name: "Bryanston", slug: "bryanston" },
        { name: "Randburg", slug: "randburg" },
        { name: "Hyde Park", slug: "hyde-park" },
        { name: "Parktown North", slug: "parktown-north" },
        { name: "Melrose", slug: "melrose" }
      ],
    },
    {
      slug: "midrand",
      label: "Midrand",
      suburbs: [
        { name: "Midrand", slug: "midrand" },
        { name: "Waterfall", slug: "waterfall" },
        { name: "Halfway House", slug: "halfway-house" }
      ],
    },
    {
      slug: "eastern-suburbs",
      label: "Eastern Suburbs",
      suburbs: [
        { name: "Bedfordview", slug: "bedfordview" },
        { name: "Edenvale", slug: "edenvale" },
        { name: "Kempton Park", slug: "kempton-park" },
        { name: "Benoni", slug: "benoni" },
        { name: "Boksburg", slug: "boksburg" }
      ],
    },
    {
      slug: "southern-suburbs",
      label: "Southern Suburbs",
      suburbs: [
        { name: "Rosettenville", slug: "rosettenville" },
        { name: "Southgate", slug: "southgate" },
        { name: "Mondeor", slug: "mondeor" },
        { name: "Turffontein", slug: "turffontein" }
      ],
    },
    {
      slug: "western-suburbs",
      label: "Western Suburbs",
      suburbs: [
        { name: "Roodepoort", slug: "roodepoort" },
        { name: "Florida", slug: "florida" },
        { name: "Honeydew", slug: "honeydew" }
      ],
    },
    {
      slug: "inner-city",
      label: "Inner City",
      suburbs: [
        { name: "Johannesburg CBD", slug: "johannesburg-cbd" },
        { name: "Braamfontein", slug: "braamfontein" },
        { name: "Parktown", slug: "parktown" },
        { name: "Houghton", slug: "houghton" },
        { name: "Westcliff", slug: "westcliff" }
      ],
    },
  ],
  "pretoria": [
    {
      slug: "central",
      label: "Central",
      suburbs: [
        { name: "Centurion", slug: "centurion" },
        { name: "Pretoria CBD", slug: "pretoria-cbd" },
        { name: "Arcadia", slug: "arcadia" },
        { name: "Sunnyside", slug: "sunnyside" },
        { name: "Hatfield", slug: "hatfield" }
      ],
    },
    {
      slug: "eastern-suburbs",
      label: "Eastern Suburbs",
      suburbs: [
        { name: "Menlyn", slug: "menlyn" },
        { name: "Lynnwood", slug: "lynnwood" },
        { name: "Brooklyn", slug: "brooklyn" },
        { name: "Waterkloof", slug: "waterkloof" },
        { name: "Garsfontein", slug: "garsfontein" },
        { name: "Faerie Glen", slug: "faerie-glen" },
        { name: "Moreleta Park", slug: "moreleta-park" }
      ],
    },
    {
      slug: "northern-suburbs",
      label: "Northern Suburbs",
      suburbs: [
        { name: "Montana", slug: "montana" },
        { name: "Wonderboom", slug: "wonderboom" },
        { name: "Pretoria North", slug: "pretoria-north" },
        { name: "Annlin", slug: "annlin" }
      ],
    },
    {
      slug: "western-suburbs",
      label: "Western Suburbs",
      suburbs: [
        { name: "Constantia Park", slug: "constantia-park" },
        { name: "Eldoraigne", slug: "eldoraigne" },
        { name: "Heuwelsig", slug: "heuwelsig" }
      ],
    },
    {
      slug: "southern-suburbs",
      label: "Southern Suburbs",
      suburbs: [
        { name: "Groenkloof", slug: "groenkloof" },
        { name: "Erasmuskloof", slug: "erasmuskloof" },
        { name: "Elarduspark", slug: "elarduspark" },
        { name: "Irene", slug: "irene" }
      ],
    },
    {
      slug: "golf-estates",
      label: "Golf Estates",
      suburbs: [
        { name: "Silver Lakes", slug: "silver-lakes" },
        { name: "Woodhill", slug: "woodhill" },
        { name: "Mooikloof", slug: "mooikloof" }
      ],
    },
  ],
  "durban": [
    {
      slug: "coastal-north",
      label: "Coastal North",
      suburbs: [
        { name: "Umhlanga", slug: "umhlanga" },
        { name: "Ballito", slug: "ballito" },
        { name: "La Lucia", slug: "la-lucia" },
        { name: "Durban North", slug: "durban-north" },
        { name: "Umdloti", slug: "umdloti" }
      ],
    },
    {
      slug: "central",
      label: "Central",
      suburbs: [
        { name: "Morningside", slug: "morningside" },
        { name: "Berea", slug: "berea" },
        { name: "Musgrave", slug: "musgrave" },
        { name: "Greyville", slug: "greyville" },
        { name: "Windermere", slug: "windermere" }
      ],
    },
    {
      slug: "western-suburbs",
      label: "Western Suburbs",
      suburbs: [
        { name: "Westville", slug: "westville" },
        { name: "Hillcrest", slug: "hillcrest" },
        { name: "Kloof", slug: "kloof" },
        { name: "Pinetown", slug: "pinetown" },
        { name: "Queensburgh", slug: "queensburgh" }
      ],
    },
    {
      slug: "southern-suburbs",
      label: "Southern Suburbs",
      suburbs: [
        { name: "Bluff", slug: "bluff" },
        { name: "Wentworth", slug: "wentworth" },
        { name: "Montclair", slug: "montclair" },
        { name: "Chatsworth", slug: "chatsworth" }
      ],
    },
    {
      slug: "south-coast",
      label: "South Coast",
      suburbs: [
        { name: "Amanzimtoti", slug: "amanzimtoti" },
        { name: "Umkomaas", slug: "umkomaas" },
        { name: "Warner Beach", slug: "warner-beach" }
      ],
    },
    {
      slug: "upper-areas",
      label: "Upper Areas",
      suburbs: [
        { name: "Glenwood", slug: "glenwood" },
        { name: "Sherwood", slug: "sherwood" },
        { name: "Durban CBD", slug: "durban-cbd" }
      ],
    },
  ],
};

const SPECIAL_SUBURB_LABELS: Record<string, string> = {
  "simons-town": "Simon's Town",
  "waterfront": "V&A Waterfront",
};

const CITY_LABEL_OVERRIDES: Record<string, string> = {
  "cape-town": "Cape Town",
  "johannesburg": "Johannesburg",
  "pretoria": "Pretoria",
  "durban": "Durban",
};

export function slugifyLocation(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’&]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getCitySlug(city: string): string {
  const slug = slugifyLocation(city);
  return CITY_LABEL_OVERRIDES[slug] ? slug : slug;
}

export function getCityLabel(citySlug: string): string {
  return CITY_LABEL_OVERRIDES[citySlug] ?? citySlug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getCityAreas(city: string): CityArea[] {
  const citySlug = getCitySlug(city);
  return CITY_AREA_DATA[citySlug] ?? [];
}

export function getRelatedSuburbs(
  city: string,
  suburb: string,
  limit = 6
): Array<{ name: string; href: string }> {
  const citySlug = getCitySlug(city);
  const suburbSlug = slugifyLocation(suburb);
  const areas = CITY_AREA_DATA[citySlug];
  if (!areas) return [];

  const area = areas.find((areaEntry) =>
    areaEntry.suburbs.some((entry) => entry.slug === suburbSlug)
  );

  const candidates = area?.suburbs ?? areas.flatMap((areaEntry) => areaEntry.suburbs);

  return candidates
    .filter((entry) => entry.slug !== suburbSlug)
    .slice(0, limit)
    .map((entry) => ({
      name: SPECIAL_SUBURB_LABELS[entry.slug] ?? entry.name,
      href: `/location/${citySlug}/${entry.slug}`,
    }));
}

export function getAllSuburbsForCity(city: string): SuburbEntry[] {
  const citySlug = getCitySlug(city);
  const areas = CITY_AREA_DATA[citySlug];
  if (!areas) return [];
  const seen = new Set<string>();
  return areas.flatMap((area) =>
    area.suburbs.filter((suburb) => {
      if (seen.has(suburb.slug)) return false;
      seen.add(suburb.slug);
      return true;
    })
  );
}

