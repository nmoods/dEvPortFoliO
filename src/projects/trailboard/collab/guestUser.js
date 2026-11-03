const ADJECTIVES = ['Swift', 'Quiet', 'Bold', 'Sunny', 'Misty', 'Rocky', 'Lucky', 'Brave']
const ANIMALS = ['Marmot', 'Ibex', 'Falcon', 'Lynx', 'Otter', 'Heron', 'Fox', 'Bison']
const COLORS = ['#0ea5e9', '#f97316', '#22c55e', '#eab308', '#ef4444', '#14b8a6', '#6366f1', '#ec4899']

const pick = (list) => list[Math.floor(Math.random() * list.length)]

export function createGuestUser() {
  return { name: `${pick(ADJECTIVES)} ${pick(ANIMALS)}`, color: pick(COLORS) }
}
