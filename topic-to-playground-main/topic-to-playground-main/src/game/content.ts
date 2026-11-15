// Game content: the types and the fixed lists (jobs, buildings, crew, techs, places,
// chapters, achievements). Plain TypeScript, no React. The rules that use them live in sim.ts.
import { FACTS, type Fact } from "./data";

export const MISSION_SOLS = 30;
/** Game safety limit for the stay (mSv). Real NASA career limit is 600 mSv. */
export const DOSE_LIMIT = 40;
/** Extra radiation for one spacewalk (game estimate). */
export const EVA_DOSE = 1;

export type ResourceKey = "oxygen" | "power" | "water" | "food" | "shielding";
export type StatKey = ResourceKey | "materials" | "research" | "morale" | "health" | "dose";
export type Effects = Partial<Record<StatKey, number>>;
export type BuildingKey = "habitat" | "solar" | "greenhouse" | "moxie" | "recycler" | "antenna" | "rover";
export type Role = "engineer" | "botanist" | "scientist" | "pilot";
export type Tab = "build" | "manage" | "research" | "communicate" | "explore" | "tech";
/** Where an astronaut stands while working: a building, or out on the open ground. */
export type WorkSite = BuildingKey | "field";
export type MiniKind = "pipes" | "solar" | "rover" | "greenhouse";
export type TechKey = "o2" | "solar" | "rad" | "hydro" | "water" | "rover";
export type LocationKey = "canyon" | "rocks" | "crater" | "site" | "ice";

export const RESOURCE_KEYS: ResourceKey[] = ["oxygen", "power", "water", "food", "shielding"];

// ---------- jobs ----------
export interface Action {
  id: string;
  tab: Exclude<Tab, "explore" | "tech">;
  title: string;
  blurb: string;
  /** Paid when the job starts. Positive = gain, negative = cost. */
  effects: Effects;
  /** Energy the astronaut doing the job uses. */
  energy: number;
  /** Where the astronaut goes to do this job (shown in the base scene). */
  site: WorkSite;
  build?: BuildingKey;
  max?: number;
  /** This job is played as a mini-game; the result decides the reward. */
  task?: MiniKind;
  /** Which speciality gets a bonus, shown on the card. */
  bonus?: { role: Role; text: string };
  needsRover?: boolean;
  needsAntenna?: boolean;
  forecast?: boolean;
  mapPhotos?: boolean;
  fact: Fact;
}

export const ACTIONS: Action[] = [
  // Build
  { id: "build-solar", site: "solar", tab: "build", title: "Add a solar panel", blurb: "+6 power every sol", effects: { materials: -8, power: -4 }, energy: 35, build: "solar", max: 6, bonus: { role: "engineer", text: "Engineer builds with 3 fewer materials" }, fact: FACTS.solar },
  { id: "build-greenhouse", site: "greenhouse", tab: "build", title: "Grow the greenhouse", blurb: "+5 food and +2 oxygen every sol, drinks 2 water", effects: { materials: -10, water: -8 }, energy: 40, build: "greenhouse", max: 3, bonus: { role: "engineer", text: "Engineer builds with 3 fewer materials" }, fact: FACTS.veggie },
  { id: "build-moxie", site: "moxie", tab: "build", title: "Build an oxygen maker", blurb: "+6 oxygen every sol, uses 3 power", effects: { materials: -10, power: -6 }, energy: 40, build: "moxie", max: 3, bonus: { role: "engineer", text: "Engineer builds with 3 fewer materials" }, fact: FACTS.moxie },
  { id: "build-recycler", site: "recycler", tab: "build", title: "Add a water recycler", blurb: "+6 water every sol, uses 2 power", effects: { materials: -10, power: -6 }, energy: 40, build: "recycler", max: 3, bonus: { role: "engineer", text: "Engineer builds with 3 fewer materials" }, fact: FACTS.water },
  { id: "build-shield", site: "habitat", tab: "build", title: "Pile soil on the habitat", blurb: "+15 shielding against radiation", effects: { shielding: 15, power: -5, dose: EVA_DOSE }, energy: 45, bonus: { role: "engineer", text: "Engineer adds 5 more shielding" }, fact: FACTS.regolith },
  // Manage
  { id: "manage-clean", site: "solar", tab: "manage", title: "Clean the solar panels", blurb: "Brush off dust so panels make full power", effects: { oxygen: -2, dose: 0.5 }, energy: 30, task: "solar", fact: FACTS.dust2018 },
  { id: "manage-garden", site: "greenhouse", tab: "manage", title: "Tend the greenhouse", blurb: "Water the plants well for a bigger harvest", effects: { water: -4 }, energy: 25, task: "greenhouse", bonus: { role: "botanist", text: "Botanist grows 3 extra food" }, fact: FACTS.zinnia },
  { id: "manage-water", site: "recycler", tab: "manage", title: "Run recycler on max", blurb: "Squeeze out extra water today", effects: { water: 12, power: -12 }, energy: 20, fact: FACTS.water },
  { id: "manage-salvage", site: "field", tab: "manage", title: "Salvage spare parts", blurb: "Take apart the landing stage for materials", effects: { materials: 7, power: -4 }, energy: 40, bonus: { role: "engineer", text: "Engineer finds 3 extra materials" }, fact: FACTS.rocks },
  { id: "manage-powersave", site: "habitat", tab: "manage", title: "Power-saving mode", blurb: "Switch off extras to charge batteries", effects: { power: 12, morale: -5 }, energy: 10, fact: FACTS.solar },
  { id: "manage-movie", site: "habitat", tab: "manage", title: "Host a movie night", blurb: "Popcorn for everyone at the base", effects: { morale: 10, food: -3, power: -4 }, energy: 10, fact: FACTS.exercise },
  // Research
  { id: "research-drive", site: "rover", tab: "research", title: "Rock-sample drive", blurb: "Drive the rover to collect samples", effects: { power: -8 }, energy: 35, task: "rover", needsRover: true, bonus: { role: "pilot", text: "Pilot earns 1 extra research point" }, fact: FACTS.rocks },
  { id: "research-plants", site: "greenhouse", tab: "research", title: "Plant experiment", blurb: "Test how seeds grow in Mars soil", effects: { research: 1, food: -4, water: -4 }, energy: 30, bonus: { role: "scientist", text: "Scientist earns 1 extra research point" }, fact: FACTS.veggie },
  { id: "research-quake", site: "field", tab: "research", title: "Listen for marsquakes", blurb: "Run the seismometer all sol", effects: { research: 1, power: -10 }, energy: 20, bonus: { role: "scientist", text: "Scientist earns 1 extra research point" }, fact: FACTS.quakes },
  { id: "research-ice", site: "field", tab: "research", title: "Dig for ice", blurb: "Melt underground ice into water", effects: { water: 14, power: -10, dose: EVA_DOSE }, energy: 45, fact: FACTS.ice },
  // Communicate
  { id: "comm-forecast", site: "antenna", tab: "communicate", title: "Ask Earth for a Sun forecast", blurb: "Learn about solar flares in the next 3 sols", effects: { power: -6 }, energy: 15, needsAntenna: true, forecast: true, fact: FACTS.delay },
  { id: "comm-science", site: "antenna", tab: "communicate", title: "Beam science data home", blurb: "Scientists on Earth send ideas back", effects: { research: 2, power: -14 }, energy: 20, needsAntenna: true, fact: FACTS.delay },
  { id: "comm-family", site: "antenna", tab: "communicate", title: "Video call families", blurb: "Seeing home makes everyone smile", effects: { morale: 12, power: -8 }, energy: 10, needsAntenna: true, fact: FACTS.family },
  { id: "comm-photos", site: "antenna", tab: "communicate", title: "Ask for orbit photos", blurb: "A satellite finds a new place to explore", effects: { power: -8 }, energy: 15, needsAntenna: true, mapPhotos: true, fact: FACTS.hirise },
];

// ---------- buildings ----------
export interface BuildingDef {
  key: BuildingKey;
  name: string;
  description: string;
  /** Condition lost every sol from wear and dust. */
  wear: number;
  repairMaterials: number;
  /** Repair is a pipe puzzle instead of an instant fix. */
  repairTask?: MiniKind;
  upgradeText: string;
  fact: Fact;
}

export const BUILDINGS: Record<BuildingKey, BuildingDef> = {
  habitat: { key: "habitat", name: "Habitat", description: "Where the crew eats, sleeps and works. Heaters keep it warm.", wear: 1, repairMaterials: 5, upgradeText: "Better insulation: heaters use 2 less power per level", fact: FACTS.thinAir },
  solar: { key: "solar", name: "Solar panels", description: "Turn sunlight into power. Dust on the panels lowers how much they make.", wear: 3, repairMaterials: 4, upgradeText: "Each panel makes 30% more power per level", fact: FACTS.solar },
  greenhouse: { key: "greenhouse", name: "Greenhouse", description: "Grows food and adds a little oxygen. Plants drink water.", wear: 2, repairMaterials: 4, upgradeText: "Each greenhouse grows 30% more food per level", fact: FACTS.veggie },
  moxie: { key: "moxie", name: "Oxygen maker", description: "Turns carbon dioxide from Mars air into oxygen to breathe. Needs power.", wear: 3, repairMaterials: 4, repairTask: "pipes", upgradeText: "Each machine makes 30% more oxygen per level", fact: FACTS.moxie },
  recycler: { key: "recycler", name: "Water recycler", description: "Cleans used water so it can be used again. Needs power.", wear: 3, repairMaterials: 4, repairTask: "pipes", upgradeText: "Each recycler cleans 30% more water per level", fact: FACTS.water },
  antenna: { key: "antenna", name: "Antenna", description: "Talks to Earth. If it breaks, the Communicate jobs stop working.", wear: 1, repairMaterials: 4, upgradeText: "Forecasts reach 2 sols further per level", fact: FACTS.delay },
  rover: { key: "rover", name: "Rover", description: "Carries crew to explore. Rough trips wear it down.", wear: 0, repairMaterials: 5, upgradeText: "Tougher wheels: 30% less trip danger per level", fact: FACTS.spirit },
};

export const BUILDING_ORDER: BuildingKey[] = ["habitat", "solar", "greenhouse", "moxie", "recycler", "antenna", "rover"];
export const MAX_LEVEL = 3;

// ---------- crew ----------
export interface CrewDef {
  id: string;
  name: string;
  role: Role;
  roleLabel: string;
  perk: string;
}

export const CREW_ROSTER: CrewDef[] = [
  { id: "ava", name: "Ava Okafor", role: "engineer", roleLabel: "Engineer", perk: "Fixes buildings faster and builds with fewer materials" },
  { id: "leo", name: "Leo Martinez", role: "botanist", perk: "Each greenhouse grows +1 food while Leo is at base", roleLabel: "Botanist" },
  { id: "priya", name: "Priya Sharma", role: "scientist", perk: "Earns +1 research point from experiments", roleLabel: "Scientist" },
  { id: "sonam", name: "Sonam Sherpa", role: "pilot", perk: "Makes rover trips safer and shorter", roleLabel: "Pilot" },
];

// ---------- technology ----------
export interface TechDef {
  key: TechKey;
  name: string;
  benefit: string;
  cost: number;
  effects: Effects;
  /** A place the crew must visit first. */
  needsVisit?: LocationKey;
  fact: Fact;
}

export const TECHS: TechDef[] = [
  { key: "o2", name: "Advanced oxygen recycling", benefit: "Crew breathe 2 less oxygen every sol", cost: 3, effects: { power: -8 }, fact: FACTS.moxie },
  { key: "solar", name: "Efficient solar panels", benefit: "Panels gather dust half as fast and make 1 more power each", cost: 3, effects: { materials: -6 }, fact: FACTS.solar },
  { key: "rad", name: "Improved radiation shielding", benefit: "Flares and daily radiation hurt 30% less", cost: 4, effects: { materials: -8 }, fact: FACTS.regolith },
  { key: "hydro", name: "Advanced hydroponics", benefit: "Greenhouses grow 2 more food and drink 1 less water", cost: 4, effects: { water: -8 }, fact: FACTS.veggie },
  { key: "water", name: "Water extraction", benefit: "Ice digging gives 8 more water, plus 2 water every sol", cost: 3, effects: { power: -10 }, needsVisit: "crater", fact: FACTS.ice },
  { key: "rover", name: "Autonomous rover", benefit: "The rover can explore with no crew aboard, and trips are safer", cost: 4, effects: { materials: -6 }, needsVisit: "site", fact: FACTS.autonav },
];

// ---------- exploration ----------
export interface LocationDef {
  key: LocationKey;
  name: string;
  /** Pin position on the map image, in percent. */
  x: number;
  y: number;
  distanceKm: number;
  sols: number;
  cost: Effects;
  /** Chance (0..1) something goes wrong on the trip. */
  risk: number;
  reward: Effects;
  rewardText: string;
  discovery: string;
  fact: Fact;
}

export const LOCATIONS: LocationDef[] = [
  { key: "canyon", name: "Rocky Canyon", x: 30, y: 30, distanceKm: 4, sols: 1, cost: { power: -8 }, risk: 0.15, reward: { materials: 10, research: 1 }, rewardText: "Metal-rich rocks for building", discovery: "The canyon walls are striped with layers, like a giant cake of rock.", fact: FACTS.lakes },
  { key: "rocks", name: "Ancient Rock Field", x: 74, y: 38, distanceKm: 6, sols: 1, cost: { power: -10 }, risk: 0.2, reward: { research: 2, materials: 4 }, rewardText: "Old rocks full of clues", discovery: "One rock has strange spots. Priya wants to send it to Earth one day!", fact: FACTS.leopard },
  { key: "crater", name: "Frozen Crater", x: 18, y: 68, distanceKm: 9, sols: 2, cost: { power: -12, oxygen: -4 }, risk: 0.25, reward: { water: 20, research: 1 }, rewardText: "Ice to melt into water, unlocks Water extraction tech", discovery: "Bright white ice sparkles at the bottom of the crater.", fact: FACTS.ice },
  { key: "site", name: "Abandoned Research Site", x: 86, y: 72, distanceKm: 12, sols: 2, cost: { power: -14, oxygen: -4 }, risk: 0.3, reward: { materials: 15, research: 2 }, rewardText: "Old parts and data, unlocks Autonomous rover tech", discovery: "An old robot lander still has working parts and a hard drive full of data.", fact: FACTS.ingenuity },
  { key: "ice", name: "Underground Ice Deposit", x: 50, y: 14, distanceKm: 15, sols: 3, cost: { power: -16, oxygen: -6, food: -4 }, risk: 0.35, reward: { water: 25, research: 3 }, rewardText: "A huge ice supply: +3 water every sol for the rest of the mission", discovery: "Radar shows a frozen lake hiding under the dust. Water for years!", fact: FACTS.ice },
];

export const START_LOCATIONS: LocationKey[] = ["canyon", "rocks"];

// ---------- chapters & goals ----------
export type ObjectiveKey = "build1" | "fix1" | "minigame" | "tech1" | "trips2" | "find4" | "flares2" | "tech3" | "visit4" | "healthy";

export interface ChapterDef {
  n: number;
  name: string;
  from: number;
  to: number;
  story: string;
  objectives: { key: ObjectiveKey; text: string }[];
}

export const CHAPTERS: ChapterDef[] = [
  {
    n: 1,
    name: "Landing",
    from: 1,
    to: 5,
    story: "After touchdown, Ava catches a faint signal from an abandoned lander beyond the canyon. The message is too broken to decode, but it keeps repeating.",
    objectives: [
      { key: "build1", text: "Build something new" },
      { key: "fix1", text: "Repair or upgrade a building" },
    ],
  },
  {
    n: 2,
    name: "Survival",
    from: 6,
    to: 10,
    story: "While the crew keeps the base alive, Priya pieces together the signal: the old lander found water ice. Its map is incomplete, so the rover must finish the search.",
    objectives: [
      { key: "minigame", text: "Score 60% or more in a hands-on job" },
      { key: "tech1", text: "Unlock your first technology" },
    ],
  },
  {
    n: 3,
    name: "Exploration",
    from: 11,
    to: 15,
    story: "Sonam follows the beacon across the red plains. Each stop reveals another clue—and a route to a buried ice deposit that could sustain the outpost.",
    objectives: [
      { key: "trips2", text: "Finish 2 rover trips" },
      { key: "find4", text: "Find 4 places on the map" },
    ],
  },
  {
    n: 4,
    name: "Major Challenges",
    from: 16,
    to: 23,
    story: "A powerful solar storm threatens the base just as the team recovers the lander's final data. Protect the crew, keep Leo's greenhouse growing, and get the discovery through to Earth.",
    objectives: [
      { key: "flares2", text: "Get through 2 solar flares" },
      { key: "tech3", text: "Unlock 3 technologies" },
    ],
  },
  {
    n: 5,
    name: "Final Mission",
    from: 24,
    to: 30,
    story: "Earth confirms the return rocket is on its way. Use what the crew learned to hold the outpost together through the final sols and bring all four astronauts home.",
    objectives: [
      { key: "visit4", text: "Visit 4 places with the rover" },
      { key: "healthy", text: "Bring all 4 astronauts home healthy" },
    ],
  },
];

/** Reward for finishing any objective. */
export const OBJECTIVE_REWARD: Effects = { materials: 5, morale: 5 };

export type AchievementKey = "builder" | "fixer" | "greenThumb" | "pipeMaster" | "sparkle" | "driver" | "explorer" | "brain" | "storm" | "sunShield" | "safe" | "team";

export const ACHIEVEMENTS: { key: AchievementKey; name: string; text: string }[] = [
  { key: "builder", name: "Builder", text: "Build a new facility" },
  { key: "fixer", name: "Fix-It Pro", text: "Repair buildings 3 times" },
  { key: "greenThumb", name: "Green Thumb", text: "Score 90% in the greenhouse" },
  { key: "pipeMaster", name: "Pipe Master", text: "Solve a pipe puzzle perfectly" },
  { key: "sparkle", name: "Sparkly Panels", text: "Clean 90% of the solar dust" },
  { key: "driver", name: "Ace Driver", text: "Bring home all 3 rock samples" },
  { key: "explorer", name: "Explorer", text: "Find all 5 places on the map" },
  { key: "brain", name: "Big Brain", text: "Unlock 3 technologies" },
  { key: "storm", name: "Storm Chaser", text: "Get through a dust storm" },
  { key: "sunShield", name: "Sun Shield", text: "Get through 3 solar flares" },
  { key: "safe", name: "Safe Crew", text: "Finish with under 20 mSv of radiation" },
  { key: "team", name: "Dream Team", text: "Finish with every astronaut healthy and happy" },
];
