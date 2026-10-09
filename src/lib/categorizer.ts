export function guessCategoryFromMerchantName(name: string): string {
  const lowerName = name.toLowerCase();

  const rules: Record<string, string[]> = {
    'Food & Dining': [
      'restaurant', 'cafe', 'coffee', 'mcdonald', 'starbucks', 'burger', 'pizza',
      'subway', 'wendy', 'taco bell', 'chipotle', 'door dash', 'doordash',
      'uber eats', 'grubhub', 'postmates', 'in n out', 'chick-fil-a', 'sweetgreen',
      'cava', 'panda express', 'domino', 'dunkin'
    ],
    'Shopping': [
      'target', 'walmart', 'amazon', 'amzn', 'costco', 'safeway', 'kroger',
      'ralphs', 'trader joe', 'whole foods', 'walgreens', 'cvs', 'ikea',
      'best buy', 'apple', 'homedepot', 'home depot', 'lowe', 'h&m', 'zara',
      'macys', 'nordstrom', 'sephora', 'ulta', 'cvs/pharm'
    ],
    'Transportation': [
      'uber', 'lyft', 'gas', 'shell', 'chevron', 'arco', 'mobil', 'amtrak',
      'transit', 'parking', 'airlines', 'flight', 'southwest', 'delta', 'united',
      'american airlines', 'alaska air', 'bart', 'mta', 'exxon', 'texaco'
    ],
    'Entertainment': [
      'netflix', 'hulu', 'spotify', 'movie', 'amc', 'regal', 'ticketmaster',
      'steam', 'playstation', 'xbox', 'nintendo', 'disney plus', 'disney+',
      'hbo max', 'peacock', 'paramount'
    ],
    'Bills & Utilities': [
      'pg&e', 'sdge', 'att', 'at&t', 'verizon', 't-mobile', 'tmobile', 'comcast',
      'xfinity', 'water', 'electric', 'internet', 'spectrum', 'cox', 'coned',
      'geico', 'state farm', 'progressive'
    ],
    'Health': [
      'pharmacy', 'hospital', 'dental', 'clinic', 'kaiser', 'quest diag',
      'walgreens', 'cvs'
    ],
    'Education': [
      'ucsd', 'university', 'college', 'tuition', 'bookstore', 'coursera', 'udemy'
    ],
    'Travel': [
      'hotel', 'airbnb', 'expedia', 'booking.com', 'marriott', 'hilton',
      'hyatt', 'motel'
    ],
    'Subscriptions': [
      'patreon', 'gym', 'planet fitness', '24 hour fitness', 'equinox', 'nytimes',
      'wsj', 'washington post'
    ]
  };

  for (const [category, keywords] of Object.entries(rules)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return category;
    }
  }

  return 'Other';
}

export function cleanMerchantName(rawName: string): string {
  let name = rawName;
  
  // Truncate at common location / store number separators
  const storeMarkerRegex = /(#\d+|\bT-\d+|\bStore\s*\d+|\*|\bMktp\b|\.com\b|\bwindcave\b)/i;
  const match = name.match(storeMarkerRegex);
  if (match && match.index !== undefined) {
    name = name.substring(0, match.index);
  }

  // Remove common state codes if they appear at the end
  const stateCodes = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
  const stateRegex = new RegExp(`\\b(${stateCodes.join('|')})\\s*$`, 'i');
  name = name.replace(stateRegex, '');

  name = name.trim().replace(/\s+/g, ' ');

  // Uppercase only first letter and lowercase everything else
  if (name.length > 0) {
    name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }

  return name;
}
