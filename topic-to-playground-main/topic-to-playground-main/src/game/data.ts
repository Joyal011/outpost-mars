// Real NASA facts and archived data the game is built on. Every number here is
// sourced; see /science for the full list. Keep this file free of React.

export interface Flare {
  classType: string; // e.g. "X8.7"
  date: string; // YYYY-MM-DD (UTC peak/begin date)
  note?: string;
  /** Where this record came from. Missing means an archived record bundled with the game. */
  source?: "live" | "archived";
  /** DONKI flare ID, e.g. "2024-10-03T12:08:00-FLR-001" (live records only). */
  id?: string;
  /** Position on the Sun, e.g. "S15W03" (live records only). */
  location?: string;
  /** NOAA active region number (live records only). */
  region?: number;
}

/** Notable real flares from NASA DONKI / GOES records, used when the live feed is unreachable. */
export const ARCHIVED_FLARES: Flare[] = [
  { classType: "X28", date: "2003-11-04", note: "The biggest flare ever measured by GOES satellites (the Halloween storms)." },
  { classType: "X9.3", date: "2017-09-06", note: "The strongest flare of Solar Cycle 24." },
  { classType: "X8.2", date: "2017-09-10", note: "Curiosity's radiation detector saw Mars surface radiation more than double." },
  { classType: "X9.0", date: "2024-10-03", note: "One of the strongest flares of the current solar cycle." },
  { classType: "X8.7", date: "2024-05-14", note: "Part of the May 2024 storms that lit up auroras across Earth." },
  { classType: "X5.8", date: "2024-05-11", note: "Fired during the May 2024 'Gannon' geomagnetic storm." },
  { classType: "X6.3", date: "2024-02-22", note: "A powerful flare spotted by NASA's Solar Dynamics Observatory." },
  { classType: "X5.4", date: "2012-03-07", note: "Sent a fast cloud of solar particles through the solar system." },
  { classType: "X2.2", date: "2011-02-15", note: "The first X-class flare of Solar Cycle 24." },
  { classType: "X1.2", date: "2014-01-07", note: "Pointed almost straight at Earth." },
  { classType: "X1.0", date: "2021-10-28", note: "Its particles were detected all the way down at Earth's surface." },
  { classType: "M7.9", date: "2015-06-25", note: "A mid-level flare seen by the Solar Dynamics Observatory." },
  { classType: "M6.7", date: "2016-04-17", note: "A mid-level flare seen by the Solar Dynamics Observatory." },
];

export interface Fact {
  text: string;
  source: string;
}

export const FACTS = {
  sol: {
    text: "A 'sol' is one day on Mars. It lasts 24 hours, 39 minutes and 35 seconds, a little longer than an Earth day.",
    source: "NASA Mars Exploration",
  },
  rad: {
    text: "Curiosity's Radiation Assessment Detector (RAD) measured about 0.64 mSv of radiation per sol on the Martian surface. Mars has no global magnetic field and very thin air to block it.",
    source: "Hassler et al., Science (2014), Curiosity RAD",
  },
  flareClass: {
    text: "Solar flares are graded C, M and X. Each letter is 10 times stronger than the one before, so an X flare is 100 times stronger than a C flare.",
    source: "NASA Space Weather / DONKI",
  },
  may2024: {
    text: "In May 2024 a giant solar storm reached Mars. Curiosity's RAD measured 8,100 micrograys, about the same as 30 chest X-rays, in one blast.",
    source: "NASA JPL, Curiosity RAD (2024)",
  },
  regolith: {
    text: "Mars soil is called regolith. Piling a thick layer of it on a habitat is one way NASA studies for blocking space radiation.",
    source: "NASA Human Research Program",
  },
  solar: {
    text: "Mars is about 1.5 times farther from the Sun than Earth, so sunlight there is less than half as strong (around 43%).",
    source: "NASA Mars Fact Sheet",
  },
  dust2018: {
    text: "In 2018 a planet-wide dust storm blocked so much sunlight that the solar-powered Opportunity rover ran out of power and never woke up again.",
    source: "NASA JPL, Opportunity mission",
  },
  moxie: {
    text: "Perseverance's MOXIE turned Mars air (carbon dioxide) into oxygen. It made 122 grams in total, about what a small dog breathes in 10 hours.",
    source: "NASA JPL, MOXIE (2021–2023)",
  },
  water: {
    text: "In 2023 the Space Station's life support recycled 98% of the crew's water, including sweat and urine!",
    source: "NASA ECLSS, International Space Station",
  },
  veggie: {
    text: "In 2015 astronauts on the Space Station ate the first lettuce grown in space, red romaine from the Veggie plant chamber.",
    source: "NASA Veggie experiment",
  },
  ice: {
    text: "Mars has water ice hidden under its surface. NASA's Phoenix lander scraped some up in 2008.",
    source: "NASA Phoenix Mars Lander",
  },
  quakes: {
    text: "NASA's InSight lander felt 1,319 marsquakes between 2018 and 2022.",
    source: "NASA JPL, InSight mission",
  },
  delay: {
    text: "Radio messages take about 3 to 22 minutes to travel between Earth and Mars one way, depending on where both planets are in their orbits.",
    source: "NASA Mars Exploration",
  },
  rocks: {
    text: "Perseverance drills rock cores and seals them in tubes so scientists can one day study them on Earth.",
    source: "NASA Mars Sample Return",
  },
  exercise: {
    text: "Space Station astronauts exercise about 2 hours a day and get time off to stay healthy and happy.",
    source: "NASA Human Research Program",
  },
  family: {
    text: "Astronauts on the Space Station get private video calls with their families to help with being so far from home.",
    source: "NASA Human Research Program",
  },
  limit: {
    text: "NASA's real career radiation limit for astronauts is 600 mSv. This game uses a smaller limit for a short 30-sol stay.",
    source: "NASA-STD-3001 (2022)",
  },
  cold: {
    text: "Mars is very cold. Curiosity's weather station has measured nights colder than −70 °C, so a habitat needs heaters all night.",
    source: "NASA JPL, Curiosity REMS weather station",
  },
  spirit: {
    text: "In 2009 NASA's Spirit rover got stuck in soft sand. Engineers tried for months, but it never drove again.",
    source: "NASA JPL, Spirit rover mission",
  },
  conjunction: {
    text: "About every 26 months the Sun moves between Earth and Mars. For about 2 weeks NASA stops sending commands to Mars, because the Sun can scramble radio signals.",
    source: "NASA, Mars solar conjunction",
  },
  zinnia: {
    text: "In 2016 flowers growing on the Space Station got sick with mold. Astronaut Scott Kelly nursed them back to health and they bloomed.",
    source: "NASA Veggie experiment (2016)",
  },
  lakes: {
    text: "Curiosity found layered rocks in Gale crater that formed at the bottom of an ancient lake billions of years ago.",
    source: "NASA JPL, Curiosity rover",
  },
  leopard: {
    text: "In 2024 Perseverance found a rock nicknamed 'Cheyava Falls' with 'leopard spots'. Scientists are studying it for possible signs of ancient life.",
    source: "NASA JPL, Perseverance (2024)",
  },
  hirise: {
    text: "NASA's Mars Reconnaissance Orbiter carries a camera called HiRISE that can spot things about 1 meter across from orbit.",
    source: "NASA JPL, Mars Reconnaissance Orbiter",
  },
  autonav: {
    text: "Perseverance can drive itself with 'AutoNav', picking a safe path around rocks without waiting for drivers on Earth.",
    source: "NASA JPL, Perseverance AutoNav",
  },
  ingenuity: {
    text: "Ingenuity, a tiny helicopter, made 72 flights on Mars between 2021 and 2024, scouting ahead for Perseverance.",
    source: "NASA JPL, Ingenuity Mars Helicopter",
  },
  thinAir: {
    text: "Mars air is about 100 times thinner than Earth's and is mostly carbon dioxide, so a habitat leak is serious.",
    source: "NASA Mars Fact Sheet",
  },
} satisfies Record<string, Fact>;

const DAY_MS = 86_400_000;
const MARS_OPPOSITION_2025 = Date.UTC(2025, 0, 16); // Earth and Mars lined up
const EARTH_YEAR = 365.256;
const MARS_YEAR = 686.98;
const MARS_AU = 1.524;
const LIGHT_SECONDS_PER_AU = 499.0;

/**
 * Approximate one-way Earth–Mars light delay in minutes for a date, using
 * circular orbits measured from the 16 Jan 2025 opposition. Good to roughly ±2 min.
 */
export function earthMarsDelayMinutes(date: Date): number {
  const days = (date.getTime() - MARS_OPPOSITION_2025) / DAY_MS;
  const angle = 2 * Math.PI * days * (1 / EARTH_YEAR - 1 / MARS_YEAR);
  const au = Math.sqrt(1 + MARS_AU * MARS_AU - 2 * MARS_AU * Math.cos(angle));
  return (au * LIGHT_SECONDS_PER_AU) / 60;
}
