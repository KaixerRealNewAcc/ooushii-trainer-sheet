const INLINE_SPLIT_ITEM_ICON_BASE = 'https://play.pokemonshowdown.com/sprites/itemicons/';
const INLINE_SPLIT_ITEM_ICON_ALT_BASE = 'https://img.pokemondb.net/sprites/items/';
const INLINE_SPLIT_ITEM_ICON_FALLBACK = `${INLINE_SPLIT_ITEM_ICON_BASE}0.png`;
const SPLIT_BARE_BERRY_ITEMS = new Set([
  'aspear', 'cheri', 'chesto', 'chople', 'custap', 'jaboca', 'lansat', 'leppa',
  'lum', 'micle', 'oran', 'pecha', 'persim', 'rawst', 'rindo',
  'rowap', 'salac', 'sitrus',
]);
const SPLIT_STATIC_ITEM_ALIASES = {
  'new encounter location': ['old-sea-map'],
  'berry juices': ['berry-juice'],
  'dive balls': ['dive-ball'],
  'dusk balls': ['dusk-ball'],
  'quick balls': ['quick-ball'],
  'sitrus berries': ['sitrus-berry'],
  'pearls': ['pearl'],
  'revives': ['revive'],
  'lure': ['lure-ball'],
};
const SPLIT_DIRECT_ITEM_ICON_URLS = {
  'loaded dice': 'https://archives.bulbagarden.net/wiki/Special:FilePath/Bag_Loaded_Dice_SV_Sprite.png',
  'clear amulet': 'https://archives.bulbagarden.net/wiki/Special:FilePath/Bag_Clear_Amulet_SV_Sprite.png',
  'covert cloak': 'https://archives.bulbagarden.net/wiki/Special:FilePath/Bag_Covert_Cloak_SV_Sprite.png',
  'room service': 'https://archives.bulbagarden.net/wiki/Special:FilePath/Bag_Room_Service_SV_Sprite.png',
  'ability shield': 'https://archives.bulbagarden.net/wiki/Special:FilePath/Bag_Ability_Shield_SV_Sprite.png',
  'throat spray': 'https://archives.bulbagarden.net/wiki/Special:FilePath/Bag_Throat_Spray_SV_Sprite.png',
  'mirror herb': 'https://archives.bulbagarden.net/wiki/Special:FilePath/Bag_Mirror_Herb_SV_Sprite.png',
  'hyper candy': 'https://archives.bulbagarden.net/wiki/Special:FilePath/Bag_Exp._Candy_XL_SV_Sprite.png',
  'endless candy': 'https://archives.bulbagarden.net/wiki/Special:FilePath/Bag_Rare_Candy_SV_Sprite.png',
};
const SPLIT_MACHINE_MOVE_TYPES = {
  'attract': 'normal',
  'breaking swipe': 'dragon',
  'bulldoze': 'ground',
  'defog': 'flying',
  'electroweb': 'electric',
  'facade': 'normal',
  'flash': 'normal',
  'focus punch': 'fighting',
  'foul play': 'dark',
  'hidden power': 'normal',
  'hyper voice': 'normal',
  'magical leaf': 'grass',
  'rock smash': 'fighting',
  'rock tomb': 'rock',
  'self destruct': 'normal',
  'smack down': 'rock',
  'solar beam': 'grass',
  'solar blade': 'grass',
  'surf': 'water',
  'swift': 'normal',
  'torment': 'dark',
  'whirlpool': 'water',
};
const SPLIT_MACHINE_ICON_TYPES = new Set([
  'bug', 'dark', 'dragon', 'electric', 'fighting', 'fire', 'flying', 'ghost',
  'grass', 'ground', 'ice', 'normal', 'poison', 'psychic', 'rock', 'steel', 'water',
]);

function toSplitItemHyphenId(name) {
  return name
    .toLowerCase()
    .replace(/[.'"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toSplitItemCompactId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeSplitItemName(name) {
  return name
    .replace(/^\s*[-.:]\s*/, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/^\d+\s*x?\s*/i, '')
    .replace(/\.{3}.*/, '')
    .replace(/\b(?:berry trees?|gym leader rewards?|npc items?|overworld items?|delibird deliveries?):.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSplitLookupKey(name) {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

function getSplitMachineIconId(cleanName) {
  const normalized = normalizeSplitLookupKey(cleanName);

  const tmMatch = normalized.match(/^(?:tm|tms|tr|trs)\s+(.+)$/i);
  if (tmMatch) {
    const moveName = tmMatch[1].trim();
    const moveType = SPLIT_MACHINE_MOVE_TYPES[moveName];
    if (moveType && SPLIT_MACHINE_ICON_TYPES.has(moveType)) return `tm-${moveType}`;
    return 'tm-normal';
  }

  const hmMatch = normalized.match(/^hm\d*\s+(.+)$/i);
  if (hmMatch) {
    const moveName = hmMatch[1].trim();
    const moveType = SPLIT_MACHINE_MOVE_TYPES[moveName];
    if (moveType && SPLIT_MACHINE_ICON_TYPES.has(moveType)) return `hm-${moveType}`;
    return 'hm-normal';
  }

  if (/^hm\d*\b/i.test(normalized)) return 'hm-normal';
  return null;
}

function createSplitItemFallbackImage(candidates, altText) {
  if (!candidates.length) return null;

  const img = document.createElement('img');
  img.className = 'ts-inline-item-sprite';
  img.alt = altText;
  img.loading = 'lazy';

  let index = 0;
  img.src = candidates[index];
  img.addEventListener('error', () => {
    index += 1;
    if (index < candidates.length) {
      img.src = candidates[index];
      return;
    }
    img.remove();
  });

  return img;
}

function makeSplitItemIcon(itemText) {
  const cleanName = normalizeSplitItemName(itemText);
  if (!cleanName) return null;

  const idCandidates = [];
  const normalized = normalizeSplitLookupKey(cleanName);
  const hyphenId = toSplitItemHyphenId(cleanName);
  const compactId = toSplitItemCompactId(cleanName);

  if (hyphenId) idCandidates.push(hyphenId);
  if (compactId) idCandidates.push(compactId);

  const aliasIds = SPLIT_STATIC_ITEM_ALIASES[normalized];
  if (aliasIds) idCandidates.push(...aliasIds);

  const singularHyphen = hyphenId ? hyphenId.replace(/s$/, '') : '';
  if (singularHyphen && singularHyphen !== hyphenId) idCandidates.push(singularHyphen);

  if (SPLIT_BARE_BERRY_ITEMS.has(normalized)) {
    idCandidates.push(`${hyphenId}-berry`);
  }

  const machineIconId = getSplitMachineIconId(cleanName);
  if (machineIconId) {
    idCandidates.push(machineIconId);
    if (machineIconId.startsWith('tm-')) idCandidates.push('tm-normal', 'tm-case');
    if (machineIconId.startsWith('hm-')) idCandidates.push('hm-normal');
  }

  if (/ite$/i.test(cleanName)) {
    idCandidates.push('eviolite');
  }

  const uniqueIds = [...new Set(idCandidates.filter(Boolean))];
  const candidates = [];
  const directIconUrl = SPLIT_DIRECT_ITEM_ICON_URLS[normalized];
  if (directIconUrl) candidates.push(directIconUrl);
  uniqueIds.forEach((id) => {
    candidates.push(`${INLINE_SPLIT_ITEM_ICON_BASE}${id}.png`);
    candidates.push(`${INLINE_SPLIT_ITEM_ICON_ALT_BASE}${id}.png`);
  });
  candidates.push(INLINE_SPLIT_ITEM_ICON_FALLBACK);

  return createSplitItemFallbackImage([...new Set(candidates)], `${cleanName} icon`);
}

function decorateSplitItemSprites() {
  const tables = document.querySelectorAll('.content-table');

  tables.forEach((table) => {
    const rows = table.querySelectorAll('tbody tr');
    if (rows.length < 4) return;

    const itemRow = rows[3];
    Array.from(itemRow.cells).forEach((cell) => {
      const itemName = cell.textContent.trim();
      if (!itemName || cell.querySelector('.ts-inline-item-sprite')) return;

      const icon = makeSplitItemIcon(itemName);
      if (!icon) return;

      const wrapper = document.createElement('span');
      wrapper.className = 'ts-inline-label';
      wrapper.appendChild(icon);
      wrapper.appendChild(document.createTextNode(itemName));

      cell.textContent = '';
      cell.appendChild(wrapper);
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', decorateSplitItemSprites);
} else {
  decorateSplitItemSprites();
}
