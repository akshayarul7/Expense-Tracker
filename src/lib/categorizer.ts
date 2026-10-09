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

