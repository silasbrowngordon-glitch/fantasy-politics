export type ScoringType =
  | 'DEMOCRAT'
  | 'REPUBLICAN'
  | 'MEDIA_CHAOS'
  | 'INDEPENDENT'
  | 'INFLUENCE'
  | 'PUNDIT_CHAOS';

export interface ScoringTypeInfo {
  value: ScoringType;
  label: string;
  description: string;
  badgeColor: string;
  rubric: string;
  rows: Array<{ pts: string; label: string }>;
}

export const SCORING_TYPES: ScoringTypeInfo[] = [
  {
    value: 'DEMOCRAT',
    label: 'Democrat',
    description: 'Rewards progressive legislation, Democratic party leadership, and liberal policy wins.',
    badgeColor: 'bg-blue-900 text-blue-300 border-blue-800',
    rows: [
      { pts: '+4', label: 'Progressive bill passed or advanced (climate, healthcare, voting rights)' },
      { pts: '+3', label: 'Publicly defended Democratic platform or core policy position' },
      { pts: '+2', label: 'Called out Republican hypocrisy or obstruction on the floor' },
      { pts: '+2', label: 'Led or organized Democratic caucus on a key vote' },
      { pts: '+1', label: 'Endorsed or campaigned for another Democrat' },
    ],
    rubric: `
DEMOCRAT SCORING ADDITIONS:
- Progressive bill passed or advanced (climate, healthcare, voting rights): +4
- Publicly defended Democratic platform or core policy position: +3
- Called out Republican hypocrisy or obstruction on the floor: +2
- Led or organized Democratic caucus on a key vote: +2
- Endorsed or campaigned for another Democrat: +1
Extra scoring only applies to DEM politicians. REP and IND politicians do not score on these items.`,
  },
  {
    value: 'REPUBLICAN',
    label: 'Republican',
    description: 'Rewards conservative legislation, Republican party leadership, and right-leaning policy wins.',
    badgeColor: 'bg-red-900 text-red-300 border-red-800',
    rows: [
      { pts: '+4', label: 'Conservative bill passed or advanced (border, tax cuts, deregulation)' },
      { pts: '+3', label: 'Publicly defended Republican platform or core conservative position' },
      { pts: '+2', label: 'Led or organized Republican caucus on a key vote' },
      { pts: '+2', label: 'Called out Democratic overreach or government waste' },
      { pts: '+1', label: 'Endorsed or campaigned for another Republican' },
    ],
    rubric: `
REPUBLICAN SCORING ADDITIONS:
- Conservative bill passed or advanced (border, tax cuts, deregulation): +4
- Publicly defended Republican platform or core conservative position: +3
- Led or organized Republican caucus on a key vote: +2
- Called out Democratic overreach or government waste: +2
- Endorsed or campaigned for another Republican: +1
Extra scoring only applies to REP politicians. DEM and IND politicians do not score on these items.`,
  },
  {
    value: 'MEDIA_CHAOS',
    label: 'Media Chaos',
    description: 'Amplifies all chaos and controversy bonuses. Perfect for drama addicts.',
    badgeColor: 'bg-orange-900 text-orange-300 border-orange-800',
    rows: [
      { pts: '×2', label: 'All Chaos Bonus points are doubled (gaffes, ethics, indictments)' },
      { pts: '+5', label: 'Cable news appearance that goes viral or causes outrage' },
      { pts: '+4', label: 'Gets ratio\'d on social media or becomes a meme' },
      { pts: '+3', label: 'Trend on Twitter/X for negative or chaotic reasons' },
    ],
    rubric: `
MEDIA CHAOS SCORING ADDITIONS:
- ALL Chaos Bonus points are DOUBLED for this league (gaffes, fact-check losses, ethics probes, indictments score 2x)
- Cable news appearance that goes viral or causes national outrage: +5
- Gets ratio'd on social media or becomes a widely-shared meme: +4
- Trends on Twitter/X for negative or chaotic reasons: +3
Apply the media chaos multiplier BEFORE adding extra bonus points.`,
  },
  {
    value: 'INDEPENDENT',
    label: 'Independent',
    description: 'Rewards crossing party lines, bipartisan action, and independent thinking.',
    badgeColor: 'bg-purple-900 text-purple-300 border-purple-800',
    rows: [
      { pts: '+6', label: 'Votes against their own party on a high-profile bill' },
      { pts: '+5', label: 'Co-sponsors major legislation with member of opposite party' },
      { pts: '+4', label: 'Publicly criticizes their own party leadership' },
      { pts: '+3', label: 'Breaks from party on committee vote or procedural motion' },
      { pts: '+2', label: 'Issues statement praising a member of the opposing party' },
    ],
    rubric: `
INDEPENDENT SCORING ADDITIONS:
- Votes against their own party on a high-profile bill: +6
- Co-sponsors major legislation with a member of the opposite party: +5
- Publicly criticizes their own party leadership by name: +4
- Breaks from party on a committee vote or procedural motion: +3
- Issues a statement praising a member of the opposing party: +2
NOTE: Standard "Breaking with party" (+2) is replaced by the +6 bonus above when this scoring type is active.`,
  },
  {
    value: 'INFLUENCE',
    label: 'Influence',
    description: 'Rewards power moves, committee leadership, and coalition building.',
    badgeColor: 'bg-yellow-900 text-yellow-300 border-yellow-800',
    rows: [
      { pts: '+6', label: 'Chairs or leads a major committee hearing' },
      { pts: '+5', label: 'Negotiates or brokers a major legislative deal' },
      { pts: '+4', label: 'Issues whip count or floor leadership on a key vote' },
      { pts: '+3', label: 'Secures major federal funding or earmark for home state' },
      { pts: '+2', label: 'Meets with the President, VP, or foreign head of state' },
    ],
    rubric: `
INFLUENCE SCORING ADDITIONS:
- Chairs or leads a major committee hearing as ranking member: +6
- Negotiates or brokers a major legislative deal: +5
- Acts as floor whip or party leader on a key vote: +4
- Secures major federal funding, grant, or earmark for their state or district: +3
- Meets formally with the President, Vice President, or a foreign head of state: +2
These bonuses stack with standard points for the same actions.`,
  },
  {
    value: 'PUNDIT_CHAOS',
    label: 'Pundit Chaos',
    description: 'Rewards pundit feuds, social media wars, and cable news combat.',
    badgeColor: 'bg-pink-900 text-pink-300 border-pink-800',
    rows: [
      { pts: '+6', label: 'Gets into public feud with a major media personality or pundit' },
      { pts: '+5', label: 'Appears on Fox News, MSNBC, or CNN and makes a controversial claim' },
      { pts: '+4', label: 'Attacked by name in primetime cable news commentary' },
      { pts: '+3', label: 'Fact-checked live on air and refuses to back down' },
      { pts: '+2', label: 'Posts something on social media that media pundits debate for 24+ hours' },
    ],
    rubric: `
PUNDIT CHAOS SCORING ADDITIONS:
- Gets into a documented public feud with a major media personality or pundit: +6
- Appears on Fox News, MSNBC, or CNN and makes a controversial or disputed claim: +5
- Is attacked or criticized by name during primetime cable news commentary: +4
- Is fact-checked live on air and doubles down or refuses to retract: +3
- Posts something on social media that media pundits actively debate for 24+ hours: +2
These bonuses are in ADDITION to standard chaos bonuses.`,
  },
];

export const SCORING_TYPE_MAP = new Map<ScoringType, ScoringTypeInfo>(
  SCORING_TYPES.map((t) => [t.value, t])
);

export function buildScoringRubric(selectedTypes: ScoringType[]): string {
  const base = `
You are a Fantasy Politics scoring assistant. Given today's political news, assign point scores to politicians.

STANDARD SCORING RUBRIC (applies to ALL leagues):

Standard Points (legislative activity and media presence):
- Major floor vote or key legislation passed: +5
- Speech, press conference, or policy announcement: +3
- Bipartisan cooperation or cross-aisle action: +3
- Committee action (hearing, subpoena, markup): +2
- Positive news coverage or notable accomplishment: +1 to +3
- Breaking with their own party on a vote or issue: +2 (only if newsworthy)

Chaos Bonus (controversy is rewarded, not punished):
- Fact-check loss (major claim rated false or misleading): +3
- Major gaffe or public embarrassment: +5
- Ethics controversy or investigation launched: +8
- Indictment or resignation: +10

IMPORTANT RULES:
- There are NO negative scores. All point values are zero or positive.
- Points can stack — a politician can earn both a Chaos Bonus and Standard Points on the same day.
- Only score politicians who appear in the news. Omit those with 0 points entirely.
- Be fair and consistent across parties.
- Points should be whole numbers.
- The "note" should be a brief (10 words max) reason.
`.trim();

  if (selectedTypes.length === 0) return base;

  const extras = selectedTypes
    .map((t) => SCORING_TYPE_MAP.get(t)?.rubric ?? '')
    .filter(Boolean)
    .join('\n');

  return `${base}\n\nLEAGUE-SPECIFIC SCORING ADDITIONS:\n${extras}`;
}
