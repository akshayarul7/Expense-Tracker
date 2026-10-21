export const KNOWN_STORES: Record<string, string> = {
  pacsun: 'PacSun',
  amazon: 'Amazon',
  amzn: 'Amazon',
  target: 'Target',
  walmart: 'Walmart',
  bestbuy: 'Best Buy',
  apple: 'Apple',
  nike: 'Nike',
  adidas: 'Adidas',
  lululemon: 'Lululemon',
  zara: 'Zara',
  hm: 'H&M',
  asos: 'ASOS',
  nordstrom: 'Nordstrom',
  macys: "Macy's",
  sephora: 'Sephora',
  ulta: 'Ulta Beauty',
  costco: 'Costco',
  homedepot: 'Home Depot',
  lowes: "Lowe's",
  ikea: 'IKEA',
  ebay: 'eBay',
  etsy: 'Etsy',
  steampowered: 'Steam',
  steam: 'Steam',
  shein: 'SHEIN',
  abercrombie: 'Abercrombie & Fitch',
  hollisterco: 'Hollister',
  hollister: 'Hollister',
  urbanoutfitters: 'Urban Outfitters',
  brandymelville: 'Brandy Melville',
  aritzia: 'Aritzia',
  gap: 'Gap',
  oldnavy: 'Old Navy',
  bananarepublic: 'Banana Republic',
  gymshark: 'Gymshark',
  aloyoga: 'Alo Yoga',
  alo: 'Alo Yoga',
  patagonia: 'Patagonia',
  rei: 'REI',
  ssense: 'SSENSE',
  farfetch: 'Farfetch',
  stockx: 'StockX',
  goat: 'GOAT',
  newegg: 'Newegg',
  bhphotovideo: 'B&H Photo',
  microcenter: 'Micro Center',
  uniqlo: 'Uniqlo',
  anthropologie: 'Anthropologie',
  freepeople: 'Free People',
  skims: 'SKIMS',
  glossier: 'Glossier',
  revolve: 'Revolve',
  tillys: 'Tillys',
  journeys: 'Journeys',
  vans: 'Vans',
  converse: 'Converse',
  crocs: 'Crocs',
  ugg: 'UGG',
  newbalance: 'New Balance',
  asics: 'ASICS',
  underarmour: 'Under Armour',
  zumiez: 'Zumiez',
  marshalls: 'Marshalls',
  tjmaxx: 'T.J.Maxx',
  ross: 'Ross',
};

export function getStoreNameFromUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const validUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const urlObj = new URL(validUrl);
    let hostname = urlObj.hostname.toLowerCase().split(':')[0];

    const parts = hostname.split('.');

    // Check known stores across the parts or full hostname
    for (const [key, displayName] of Object.entries(KNOWN_STORES)) {
      if (parts.some((p) => p === key) || hostname.includes(key)) {
        return displayName;
      }
    }

    const filteredParts = parts.filter(
      (p) => !['www', 'm', 'mobile', 'shop', 'store', 'app', 'secure'].includes(p)
    );

    let mainDomain = filteredParts[0];
    if (filteredParts.length >= 2) {
      const commonTlds = ['com', 'org', 'net', 'io', 'co', 'us', 'uk', 'ca', 'edu', 'gov', 'store', 'shop'];
      if (commonTlds.includes(filteredParts[filteredParts.length - 1])) {
        mainDomain = filteredParts[filteredParts.length - 2];
      }
    }

    if (mainDomain && mainDomain.length >= 2) {
      return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
    }
  } catch {
    const match = trimmed.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+)\./i);
    if (match && match[1]) {
      const name = match[1].toLowerCase();
      if (KNOWN_STORES[name]) return KNOWN_STORES[name];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
  }

  return null;
}
