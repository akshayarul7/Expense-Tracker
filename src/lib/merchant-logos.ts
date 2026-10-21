export const KNOWN_MERCHANT_DOMAINS: Record<string, string> = {
  // Fast Food & Dining (Multi-word listed first to avoid partial conflicts)
  "daves hot chicken": "daveshotchicken.com",
  "daves chicken": "daveshotchicken.com",
  "in n out": "in-n-out.com",
  "in-n-out": "in-n-out.com",
  "innout": "in-n-out.com",
  "chick fil a": "chick-fil-a.com",
  "chick-fil-a": "chick-fil-a.com",
  "chickfila": "chick-fil-a.com",
  "burger king": "bk.com",
  "burgerking": "bk.com",
  "taco bell": "tacobell.com",
  "tacobell": "tacobell.com",
  "pizza hut": "pizzahut.com",
  "pizzahut": "pizzahut.com",
  "papa johns": "papajohns.com",
  "little caesars": "littlecaesars.com",
  "raising canes": "raisingcanes.com",
  "five guys": "fiveguys.com",
  "shake shack": "shakeshack.com",
  "panda express": "pandaexpress.com",
  "jack in the box": "jackinthebox.com",
  "sonic drive in": "sonicdrivein.com",
  "smoothie king": "smoothieking.com",
  "dutch bros": "dutchbros.com",
  "peets coffee": "peets.com",

  // Single-word Food & Coffee
  "starbucks": "starbucks.com",
  "dunkin": "dunkindonuts.com",
  "mcdonalds": "mcdonalds.com",
  "chipotle": "chipotle.com",
  "subway": "subway.com",
  "wendys": "wendys.com",
  "dominos": "dominos.com",
  "panera": "panerabread.com",
  "sweetgreen": "sweetgreen.com",
  "cava": "cava.com",
  "crumbl": "crumblcookies.com",
  "wingstop": "wingstop.com",
  "popeyes": "popeyes.com",
  "jamba": "jamba.com",

  // Delivery
  "doordash": "doordash.com",
  "uber eats": "ubereats.com",
  "ubereats": "ubereats.com",
  "grubhub": "grubhub.com",
  "postmates": "postmates.com",
  "instacart": "instacart.com",

  // Retail & Fashion (Multi-word)
  "trader joes": "traderjoes.com",
  "whole foods": "wholefoodsmarket.com",
  "best buy": "bestbuy.com",
  "home depot": "homedepot.com",
  "sams club": "samsclub.com",
  "urban outfitters": "urbanoutfitters.com",
  "brandy melville": "brandymelville.com",
  "bath and body works": "bathandbodyworks.com",
  "victoria secret": "victoriassecret.com",
  "american eagle": "ae.com",
  "old navy": "oldnavy.com",
  "banana republic": "bananarepublic.com",
  "alo yoga": "aloyoga.com",
  "tj maxx": "tjmaxx.com",

  // Single-word Retail & Groceries
  "pacsun": "pacsun.com",
  "target": "target.com",
  "walmart": "walmart.com",
  "costco": "costco.com",
  "kroger": "kroger.com",
  "safeway": "safeway.com",
  "aldi": "aldi.us",
  "heb": "heb.com",
  "cvs": "cvs.com",
  "walgreens": "walgreens.com",
  "amazon": "amazon.com",
  "amzn": "amazon.com",
  "ebay": "ebay.com",
  "lowes": "lowes.com",
  "ikea": "ikea.com",
  "apple": "apple.com",
  "nike": "nike.com",
  "adidas": "adidas.com",
  "lululemon": "lululemon.com",
  "zara": "zara.com",
  "sephora": "sephora.com",
  "ulta": "ulta.com",
  "nordstrom": "nordstrom.com",
  "macys": "macys.com",
  "abercrombie": "abercrombie.com",
  "hollister": "hollisterco.com",
  "aritzia": "aritzia.com",
  "shein": "shein.com",
  "uniqlo": "uniqlo.com",
  "gymshark": "gymshark.com",
  "marshalls": "marshalls.com",
  "ross": "rossstores.com",

  // Rides & Gas & Travel
  "circle k": "circlek.com",
  "7 eleven": "7-eleven.com",
  "7-eleven": "7-eleven.com",
  "7eleven": "7-eleven.com",
  "bucees": "buc-ees.com",
  "quiktrip": "quiktrip.com",
  "american airlines": "aa.com",
  "united airlines": "united.com",
  "delta air": "delta.com",
  "southwest air": "southwest.com",
  "uber": "uber.com",
  "lyft": "lyft.com",
  "chevron": "chevron.com",
  "shell": "shell.com",
  "exxon": "exxon.com",
  "mobil": "mobil.com",
  "bp": "bp.com",
  "arco": "arco.com",
  "valero": "valero.com",
  "wawa": "wawa.com",
  "speedway": "speedway.com",
  "delta": "delta.com",
  "united": "united.com",
  "southwest": "southwest.com",
  "airbnb": "airbnb.com",

  // Entertainment & Tech
  "disney plus": "disneyplus.com",
  "disney+": "disneyplus.com",
  "disney": "disneyplus.com",
  "netflix": "netflix.com",
  "spotify": "spotify.com",
  "hulu": "hulu.com",
  "hbo": "max.com",
  "max": "max.com",
  "youtube": "youtube.com",
  "steam": "steampowered.com",
  "playstation": "playstation.com",
  "psn": "playstation.com",
  "xbox": "xbox.com",
  "nintendo": "nintendo.com",
  "twitch": "twitch.tv",
  "roblox": "roblox.com",
  "google": "google.com",
  "microsoft": "microsoft.com",
  "openai": "openai.com",
  "chatgpt": "openai.com",
  "github": "github.com",
  "zoom": "zoom.us",
  "notion": "notion.so",
  "linkedin": "linkedin.com",
  "patreon": "patreon.com",

  // Utilities & Telco
  "verizon": "verizon.com",
  "t mobile": "t-mobile.com",
  "t-mobile": "t-mobile.com",
  "tmobile": "t-mobile.com",
  "at&t": "att.com",
  "att": "att.com",
  "xfinity": "xfinity.com",
  "comcast": "xfinity.com",
  "pge": "pge.com",

  // Finance
  "bank of america": "bankofamerica.com",
  "wells fargo": "wellsfargo.com",
  "capital one": "capitalone.com",
  "cash app": "cash.app",
  "cashapp": "cash.app",
  "chase": "chase.com",
  "venmo": "venmo.com",
  "paypal": "paypal.com",
  "amex": "americanexpress.com",
  "discover": "discover.com",
  "fidelity": "fidelity.com",
  "schwab": "schwab.com",
  "robinhood": "robinhood.com",
};

export function getMerchantDomain(rawName: string): string | null {
  if (!rawName) return null;

  // Normalize: lowercase, remove apostrophes, replace punctuation with space
  const normalized = rawName
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9&+-]+/g, ' ')
    .trim();

  // Check known merchant domains (keys already sorted from specific/multi-word to general)
  for (const [key, domain] of Object.entries(KNOWN_MERCHANT_DOMAINS)) {
    const cleanKey = key.replace(/['’]/g, '');

    // For multi-word keys or keys >= 4 chars, substring check is safe
    if (cleanKey.includes(' ') || cleanKey.length >= 4) {
      if (normalized.includes(cleanKey)) {
        return domain;
      }
    } else {
      // For short words (e.g. "bp", "heb", "max", "qt"), match whole words only
      const wordRegex = new RegExp(`(^|\\s)${cleanKey}(\\s|$)`, 'i');
      if (wordRegex.test(normalized)) {
        return domain;
      }
    }
  }

  // If not recognized as a known brand, return null
  // Do NOT guess random .com domains to avoid false positive logos
  return null;
}
