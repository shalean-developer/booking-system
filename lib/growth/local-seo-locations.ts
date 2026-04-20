import type { LocalSeoLocation } from '@/lib/growth/local-seo-types';

/**
 * Structured location corpus — scale by appending rows or syncing from Supabase later.
 * Each row must have a unique `localizedIntro` for SEO quality.
 */
export const LOCAL_SEO_LOCATIONS: LocalSeoLocation[] = [
  {
    slug: 'cape-town',
    name: 'Cape Town',
    displayName: 'Cape Town',
    region: 'Citywide',
    parentCity: 'Cape Town',
    nearbySlugs: ['sea-point', 'claremont', 'milnerton', 'stellenbosch'],
    landmarks: ['Table Mountain', 'V&A Waterfront'],
    localizedIntro:
      'Cape Town homeowners juggle wind, dust, and busy schedules — professional cleaning keeps apartments and houses guest-ready without the weekend scramble. Shalean matches you with vetted cleaners across the metro, with upfront pricing before you pay. Whether you are in the City Bowl or the Northern Suburbs, you can book online in a few minutes.',
    neighborhoodNote: 'Atlantic Seaboard to Northern Suburbs — we route by suburb during booking.',
  },
  {
    slug: 'sea-point',
    name: 'Sea Point',
    displayName: 'Sea Point',
    region: 'Atlantic Seaboard',
    parentCity: 'Cape Town',
    nearbySlugs: ['cape-town', 'claremont', 'milnerton'],
    landmarks: ['Sea Point Promenade', 'Main Road'],
    localizedIntro:
      'Sea Point apartments and older homes need regular attention to salt air and high foot traffic near the promenade. Our cleaners focus on kitchens, bathrooms, and floors so your space feels fresh after every visit. Book recurring or once-off cleans with transparent V4 pricing tailored to your bedroom and bathroom count.',
    neighborhoodNote: 'Popular for compact apartments — quick cleans and deep refreshes.',
  },
  {
    slug: 'claremont',
    name: 'Claremont',
    displayName: 'Claremont',
    region: 'Southern Suburbs',
    parentCity: 'Cape Town',
    nearbySlugs: ['cape-town', 'sea-point', 'newlands'],
    landmarks: ['Cavendish Square', 'Main Road'],
    localizedIntro:
      'Claremont blends family homes, student flats, and busy professionals — cleaning needs vary from quick weekly upkeep to full deep cleans before handovers. Shalean uses the same V4 engine as live booking, so the examples you see on this page match what you will pay at checkout. Add extras like ovens or fridges when you book.',
    neighborhoodNote: 'Close to schools and malls — ideal for recurring weekly plans.',
  },
  {
    slug: 'milnerton',
    name: 'Milnerton',
    displayName: 'Milnerton',
    region: 'Northern Suburbs',
    parentCity: 'Cape Town',
    nearbySlugs: ['cape-town', 'sea-point', 'durbanville'],
    landmarks: ['Milnerton Lagoon', 'Century Boulevard'],
    localizedIntro:
      'Milnerton and Blouberg-side homes often battle beach sand and pet hair — a structured clean saves hours every week. We send experienced cleaners with clear job duration estimates, so you know how long the team will be on site. Book online and choose a slot that fits your work-from-home or school-run rhythm.',
  },
  {
    slug: 'newlands',
    name: 'Newlands',
    displayName: 'Newlands',
    region: 'Southern Suburbs',
    parentCity: 'Cape Town',
    nearbySlugs: ['claremont', 'cape-town', 'sea-point'],
    landmarks: ['Newlands Cricket Ground', 'Newlands Forest edge'],
    localizedIntro:
      'Newlands properties range from gracious family houses to compact townhouses — each needs a tailored time and crew size. Shalean’s V4 pricing scales with bedrooms, bathrooms, and extras, so you are not guessing. Use this page to compare typical prices, then jump straight into booking when you are ready.',
  },
  {
    slug: 'durbanville',
    name: 'Durbanville',
    displayName: 'Durbanville',
    region: 'Northern Suburbs',
    parentCity: 'Cape Town',
    nearbySlugs: ['milnerton', 'cape-town', 'stellenbosch'],
    landmarks: ['Durbanville CBD', 'Wine route access'],
    localizedIntro:
      'Durbanville families often want dependable recurring cleans and occasional deep sessions before entertaining. Our teams are briefed on realistic time on site — deep and move-out jobs may use a two- or three-person crew depending on hours. Everything is priced before payment, aligned with the live booking flow.',
  },
  {
    slug: 'stellenbosch',
    name: 'Stellenbosch',
    displayName: 'Stellenbosch',
    region: 'Cape Winelands',
    parentCity: 'Cape Town',
    nearbySlugs: ['cape-town', 'durbanville', 'paarl'],
    landmarks: ['Dorp Street', 'University precinct'],
    localizedIntro:
      'Stellenbosch mixes student housing, wine-estate cottages, and family homes — each with different cleaning expectations. Shalean serves the town with the same vetted standard as greater Cape Town: instant quotes, optional extras, and clear duration estimates derived from the V4 pricing engine.',
  },
  {
    slug: 'paarl',
    name: 'Paarl',
    displayName: 'Paarl',
    region: 'Cape Winelands',
    parentCity: 'Cape Town',
    nearbySlugs: ['stellenbosch', 'cape-town', 'durbanville'],
    landmarks: ['Main Street', 'Paarl Mall'],
    localizedIntro:
      'Paarl’s larger plots and family homes often need longer job times — our pricing tables reflect that with real hour estimates from V4. Whether you need a standard refresh or a full deep clean before guests, you will see indicative totals here before you commit to a slot.',
  },
  {
    slug: 'rondebosch',
    name: 'Rondebosch',
    displayName: 'Rondebosch',
    region: 'Southern Suburbs',
    parentCity: 'Cape Town',
    nearbySlugs: ['claremont', 'newlands', 'observatory'],
    landmarks: ['Rondebosch Common', 'Main Road'],
    localizedIntro:
      'Rondebosch homes and rentals often need reliable recurring cleaning to stay ahead of weekly traffic. Shalean keeps pricing and service windows clear from quote to checkout.',
  },
  {
    slug: 'observatory',
    name: 'Observatory',
    displayName: 'Observatory',
    region: 'City Bowl',
    parentCity: 'Cape Town',
    nearbySlugs: ['woodstock', 'salt-river', 'rondebosch'],
    landmarks: ['Lower Main Road', 'Observatory Station'],
    localizedIntro:
      'Observatory combines compact apartments and shared homes where efficient cleaning windows matter. Our cleaners focus on practical, high-impact cleaning with transparent pricing.',
  },
  {
    slug: 'salt-river',
    name: 'Salt River',
    displayName: 'Salt River',
    region: 'City Bowl',
    parentCity: 'Cape Town',
    nearbySlugs: ['woodstock', 'observatory', 'city-centre'],
    landmarks: ['Salt River Circle', 'Victoria Road'],
    localizedIntro:
      'Salt River households often need flexible timing around work and commute schedules. Shalean gives upfront V4 totals and realistic durations for easier planning.',
  },
  {
    slug: 'woodstock',
    name: 'Woodstock',
    displayName: 'Woodstock',
    region: 'City Bowl',
    parentCity: 'Cape Town',
    nearbySlugs: ['salt-river', 'observatory', 'city-centre'],
    landmarks: ['Old Biscuit Mill', 'Albert Road'],
    localizedIntro:
      'Woodstock apartments and mixed-use homes benefit from consistent cleaning that keeps high-traffic spaces under control. Compare service options and book online quickly.',
  },
  {
    slug: 'gardens',
    name: 'Gardens',
    displayName: 'Gardens',
    region: 'City Bowl',
    parentCity: 'Cape Town',
    nearbySlugs: ['city-centre', 'green-point', 'sea-point'],
    landmarks: ['Kloof Street', 'Companys Garden'],
    localizedIntro:
      'Gardens residents often need flexible cleaning around workdays and visitors. Our teams provide practical, detailed service with clear totals before you pay.',
  },
  {
    slug: 'city-centre',
    name: 'City Centre',
    displayName: 'City Centre',
    region: 'City Bowl',
    parentCity: 'Cape Town',
    nearbySlugs: ['gardens', 'green-point', 'woodstock'],
    landmarks: ['Long Street', 'Adderley Street'],
    localizedIntro:
      'City Centre apartments need dependable cleaning that fits urban schedules. Shalean shows service time and pricing up front, aligned to the same booking engine used at checkout.',
  },
  {
    slug: 'camps-bay',
    name: 'Camps Bay',
    displayName: 'Camps Bay',
    region: 'Atlantic Seaboard',
    parentCity: 'Cape Town',
    nearbySlugs: ['sea-point', 'green-point', 'clifton'],
    landmarks: ['Camps Bay Beach', 'Victoria Road'],
    localizedIntro:
      'Camps Bay homes often need detailed, reliable cleaning around hosting and seasonal demand. We keep scope and pricing transparent from the first quote.',
  },
  {
    slug: 'green-point',
    name: 'Green Point',
    displayName: 'Green Point',
    region: 'Atlantic Seaboard',
    parentCity: 'Cape Town',
    nearbySlugs: ['sea-point', 'camps-bay', 'city-centre'],
    landmarks: ['Green Point Park', 'Somerset Road'],
    localizedIntro:
      'Green Point properties benefit from recurring cleaning plans and reliable turnaround windows. Shalean focuses on practical service quality and predictable V4 pricing.',
  },
  {
    slug: 'bellville',
    name: 'Bellville',
    displayName: 'Bellville',
    region: 'Northern Suburbs',
    parentCity: 'Cape Town',
    nearbySlugs: ['durbanville', 'parow', 'brackenfell'],
    landmarks: ['Voortrekker Road', 'Tygerberg area'],
    localizedIntro:
      'Bellville combines family homes and apartments where consistent upkeep is key. Our cleaners provide reliable service with transparent time and price examples.',
  },
  {
    slug: 'parow',
    name: 'Parow',
    displayName: 'Parow',
    region: 'Northern Suburbs',
    parentCity: 'Cape Town',
    nearbySlugs: ['bellville', 'durbanville', 'brackenfell'],
    landmarks: ['Voortrekker Road', 'N1 City area'],
    localizedIntro:
      'Parow residents often need straightforward, efficient cleaning plans. Shalean offers clear booking inputs and realistic durations before checkout.',
  },
  {
    slug: 'brackenfell',
    name: 'Brackenfell',
    displayName: 'Brackenfell',
    region: 'Northern Suburbs',
    parentCity: 'Cape Town',
    nearbySlugs: ['durbanville', 'bellville', 'parow'],
    landmarks: ['Old Paarl Road', 'CapeGate corridor'],
    localizedIntro:
      'Brackenfell homes often benefit from recurring cleans and periodic deep sessions. Our V4 examples help you choose the right service before committing.',
  },
  {
    slug: 'table-view',
    name: 'Table View',
    displayName: 'Table View',
    region: 'Northern Suburbs',
    parentCity: 'Cape Town',
    nearbySlugs: ['milnerton', 'bloubergstrand', 'cape-town'],
    landmarks: ['Blaauwberg Road', 'Beachfront'],
    localizedIntro:
      'Table View households often deal with coastal dust and daily traffic. Shalean provides practical cleaning options with transparent pricing and booking windows.',
  },
  {
    slug: 'bloubergstrand',
    name: 'Bloubergstrand',
    displayName: 'Bloubergstrand',
    region: 'Northern Suburbs',
    parentCity: 'Cape Town',
    nearbySlugs: ['table-view', 'milnerton', 'cape-town'],
    landmarks: ['Blouberg Beach', 'Marine Circle'],
    localizedIntro:
      'Bloubergstrand properties often need regular upkeep for coastal living conditions. Our teams deliver reliable cleaning with clear V4 totals before payment.',
  },
  {
    slug: 'tokai',
    name: 'Tokai',
    displayName: 'Tokai',
    region: 'Southern Suburbs',
    parentCity: 'Cape Town',
    nearbySlugs: ['bergvliet', 'constantia', 'wynberg'],
    landmarks: ['Tokai Road', 'Blue Route area'],
    localizedIntro:
      'Tokai homes often require planned recurring cleaning with occasional deep sessions. Shalean keeps service details clear and scheduling flexible.',
  },
  {
    slug: 'bergvliet',
    name: 'Bergvliet',
    displayName: 'Bergvliet',
    region: 'Southern Suburbs',
    parentCity: 'Cape Town',
    nearbySlugs: ['tokai', 'constantia', 'plumstead'],
    landmarks: ['Ladies Mile', 'Childrens Way'],
    localizedIntro:
      'Bergvliet families typically need dependable cleaning that fits school and work routines. We provide transparent pricing and realistic team-time expectations.',
  },
  {
    slug: 'constantia',
    name: 'Constantia',
    displayName: 'Constantia',
    region: 'Southern Suburbs',
    parentCity: 'Cape Town',
    nearbySlugs: ['claremont', 'tokai', 'newlands'],
    landmarks: ['Constantia Main Road', 'Wine estates'],
    localizedIntro:
      'Constantia homes often need detail-focused cleaning for larger layouts and premium finishes. Shalean provides clear V4 pricing guidance and flexible booking.',
  },
  {
    slug: 'wynberg',
    name: 'Wynberg',
    displayName: 'Wynberg',
    region: 'Southern Suburbs',
    parentCity: 'Cape Town',
    nearbySlugs: ['claremont', 'plumstead', 'tokai'],
    landmarks: ['Wynberg Main Road', 'Chelsea Village'],
    localizedIntro:
      'Wynberg properties benefit from recurring cleaning plans that stay consistent over time. Our service flow keeps pricing and duration transparent from start to finish.',
  },
  {
    slug: 'plumstead',
    name: 'Plumstead',
    displayName: 'Plumstead',
    region: 'Southern Suburbs',
    parentCity: 'Cape Town',
    nearbySlugs: ['wynberg', 'bergvliet', 'claremont'],
    landmarks: ['Main Road', 'Gabriel Road corridor'],
    localizedIntro:
      'Plumstead households often need practical, reliable cleaning for busy weekly schedules. Shalean provides clear quote details and easy online booking.',
  },
  {
    slug: 'fish-hoek',
    name: 'Fish Hoek',
    displayName: 'Fish Hoek',
    region: 'False Bay',
    parentCity: 'Cape Town',
    nearbySlugs: ['kalk-bay', 'muizenberg', 'simons-town'],
    landmarks: ['Fish Hoek Beach', 'Main Road'],
    localizedIntro:
      'Fish Hoek homes often require regular maintenance cleans with seasonal deep options. We keep quotes transparent and service windows realistic for your suburb.',
  },
  {
    slug: 'kalk-bay',
    name: 'Kalk Bay',
    displayName: 'Kalk Bay',
    region: 'False Bay',
    parentCity: 'Cape Town',
    nearbySlugs: ['fish-hoek', 'muizenberg', 'simons-town'],
    landmarks: ['Kalk Bay Harbour', 'Main Road'],
    localizedIntro:
      'Kalk Bay properties often need flexible cleaning around coastal conditions and hosting cycles. Shalean provides practical service options with upfront pricing.',
  },
  {
    slug: 'muizenberg',
    name: 'Muizenberg',
    displayName: 'Muizenberg',
    region: 'False Bay',
    parentCity: 'Cape Town',
    nearbySlugs: ['fish-hoek', 'kalk-bay', 'simons-town'],
    landmarks: ['Surfers Corner', 'Beach Road'],
    localizedIntro:
      'Muizenberg homes and rentals benefit from dependable cleaning routines that fit active schedules. Our booking flow shows V4-backed totals before payment.',
  },
  {
    slug: 'simons-town',
    name: 'Simons Town',
    displayName: 'Simons Town',
    region: 'False Bay',
    parentCity: 'Cape Town',
    nearbySlugs: ['fish-hoek', 'kalk-bay', 'muizenberg'],
    landmarks: ['Naval base area', 'Boulders approach'],
    localizedIntro:
      'Simons Town properties often need reliable service windows and practical deep-clean planning. Shalean keeps service scope and pricing straightforward.',
  },
  {
    slug: 'johannesburg',
    name: 'Johannesburg',
    displayName: 'Johannesburg',
    region: 'Citywide',
    parentCity: 'Johannesburg',
    nearbySlugs: ['pretoria', 'sandton'],
    landmarks: ['Sandton CBD', 'Rosebank'],
    localizedIntro:
      'Johannesburg’s fast pace means many households want cleaning that fits around meetings, school runs, and estate security. Shalean offers online booking with the same transparent engine used nationally: you choose bedrooms, bathrooms, and extras, then see price and duration before paying. Sandton, Rosebank, and wider JHB are covered where we have capacity.',
  },
  {
    slug: 'sandton',
    name: 'Sandton',
    displayName: 'Sandton',
    region: 'Northern Suburbs',
    parentCity: 'Johannesburg',
    nearbySlugs: ['johannesburg', 'pretoria'],
    landmarks: ['Sandton City', 'Rivonia Road'],
    localizedIntro:
      'Sandton apartments and cluster homes often need discreet, punctual service — we focus on predictable arrival times and thorough kitchen and bathroom work. Pricing on this page is generated with calculateBookingV4 (labour line) so it stays aligned with checkout. Book recurring cleans if you travel often or host clients at home.',
  },
  {
    slug: 'pretoria',
    name: 'Pretoria',
    displayName: 'Pretoria',
    region: 'Citywide',
    parentCity: 'Pretoria',
    nearbySlugs: ['johannesburg', 'sandton'],
    landmarks: ['Menlyn', 'Centurion'],
    localizedIntro:
      'Pretoria’s mix of estates and apartments benefits from clear, repeatable cleaning — same crew logic, same V4 tables. Use the examples below to benchmark a typical family home or small apartment, then customise bedrooms and bathrooms in the booking flow to match your space.',
  },
  {
    slug: 'durban',
    name: 'Durban',
    displayName: 'Durban',
    region: 'Citywide',
    parentCity: 'Durban',
    nearbySlugs: ['umhlanga', 'ballito'],
    landmarks: ['Durban North', 'Morningside'],
    localizedIntro:
      'Durban’s humidity means mould-prone bathrooms and salty air near the coast — regular professional cleaning helps protect finishes and keeps homes feeling fresh. Shalean routes bookings by area; you will confirm your suburb during checkout. Indicative prices below use the national V4 engine for consistency.',
  },
  {
    slug: 'umhlanga',
    name: 'Umhlanga',
    displayName: 'Umhlanga',
    region: 'Coastal North',
    parentCity: 'Durban',
    nearbySlugs: ['durban', 'ballito'],
    landmarks: ['Umhlanga Ridge', 'Lighthouse area'],
    localizedIntro:
      'Umhlanga’s high-rise and coastal homes often need flexible scheduling around tourism peaks. Our cleaners work from the same duration and price models you see here — no separate “coastal surcharge” hidden on this page. Deep and move-out options are popular before holiday lets and lease ends.',
  },
  {
    slug: 'ballito',
    name: 'Ballito',
    displayName: 'Ballito',
    region: 'Coastal North',
    parentCity: 'Durban',
    nearbySlugs: ['umhlanga', 'durban'],
    landmarks: ['Ballito Junction', 'Compensation Beach'],
    localizedIntro:
      'Ballito families balance beach life with work-from-home — recurring cleaning is a practical way to reclaim weekends. Compare standard, deep, and move-out examples on this page, then book a slot that matches your calendar. All figures are produced by Shalean’s V4 pricing engine.',
  },
];

export function getLocalSeoLocation(slug: string): LocalSeoLocation | undefined {
  return LOCAL_SEO_LOCATIONS.find((l) => l.slug === slug);
}

export function resolveNearbyLocations(
  location: LocalSeoLocation,
  limit = 5
): LocalSeoLocation[] {
  const out: LocalSeoLocation[] = [];
  for (const s of location.nearbySlugs) {
    const loc = getLocalSeoLocation(s);
    if (loc) out.push(loc);
    if (out.length >= limit) break;
  }
  return out;
}

export function slugifyRegion(region: string): string {
  return region
    .toLowerCase()
    .replace(/['’&]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getLocationsByRegion(regionSlug: string): LocalSeoLocation[] {
  return LOCAL_SEO_LOCATIONS.filter((l) => slugifyRegion(l.region) === regionSlug);
}

export function getRegionSlugs(): string[] {
  return Array.from(new Set(LOCAL_SEO_LOCATIONS.map((l) => slugifyRegion(l.region))));
}

export function slugifyCity(city: string): string {
  return city
    .toLowerCase()
    .replace(/['’&]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getLocationsByParentCity(parentCity: string): LocalSeoLocation[] {
  return LOCAL_SEO_LOCATIONS.filter((l) => l.parentCity === parentCity);
}

export function getRegionsByParentCity(parentCity: string): string[] {
  return Array.from(new Set(getLocationsByParentCity(parentCity).map((l) => l.region)));
}

function assertUniqueLocationSlugs() {
  const seen = new Set<string>();
  for (const location of LOCAL_SEO_LOCATIONS) {
    if (seen.has(location.slug)) {
      throw new Error(`[growth-seo] Duplicate location slug detected: ${location.slug}`);
    }
    seen.add(location.slug);
  }
}

assertUniqueLocationSlugs();
