/**
 * kolkataMockData.ts
 * ------------------
 * Kolkata neighborhood dataset for frontend rendering.
 *
 * Used by MapView to pre-render all neighborhood circles on load
 * (before any analysis). The backend scoring_engine.py holds the
 * authoritative copy used for computation.
 *
 * Index scale: 0–100. Higher = more of that attribute.
 *   income_index            — average consumer purchasing power
 *   foot_traffic_proxy      — pedestrian & commuter volume estimate
 *   population_density_index — resident density per sq km
 *   competition_index       — density of similar businesses
 *   commercial_rent_index   — relative monthly rent cost
 */

export interface AreaData {
  name: string;
  latitude: number;
  longitude: number;
  population_density_index: number;
  income_index: number;
  competition_index: number;
  foot_traffic_proxy: number;
  commercial_rent_index: number;
}

export const KOLKATA_AREAS: AreaData[] = [
  {
    name: "Park Street",
    latitude: 22.5517,
    longitude: 88.3509,
    income_index: 85,
    foot_traffic_proxy: 88,
    population_density_index: 65,
    competition_index: 90,
    commercial_rent_index: 82,
  },
  {
    name: "New Town",
    latitude: 22.5747,
    longitude: 88.4647,
    income_index: 72,
    foot_traffic_proxy: 62,
    population_density_index: 52,
    competition_index: 40,
    commercial_rent_index: 55,
  },
  {
    name: "Salt Lake Sector V",
    latitude: 22.5697,
    longitude: 88.429,
    income_index: 78,
    foot_traffic_proxy: 85,
    population_density_index: 60,
    competition_index: 60,
    commercial_rent_index: 72,
  },
  {
    name: "Behala",
    latitude: 22.5016,
    longitude: 88.3107,
    income_index: 52,
    foot_traffic_proxy: 62,
    population_density_index: 88,
    competition_index: 36,
    commercial_rent_index: 28,
  },
  {
    name: "Ballygunge",
    latitude: 22.5311,
    longitude: 88.359,
    income_index: 82,
    foot_traffic_proxy: 70,
    population_density_index: 55,
    competition_index: 62,
    commercial_rent_index: 78,
  },
  {
    name: "Shyambazar",
    latitude: 22.6041,
    longitude: 88.3765,
    income_index: 60,
    foot_traffic_proxy: 80,
    population_density_index: 80,
    competition_index: 68,
    commercial_rent_index: 45,
  },
  {
    name: "Esplanade",
    latitude: 22.5647,
    longitude: 88.3511,
    income_index: 68,
    foot_traffic_proxy: 92,
    population_density_index: 75,
    competition_index: 88,
    commercial_rent_index: 72,
  },
  {
    name: "Gariahat",
    latitude: 22.5218,
    longitude: 88.3633,
    income_index: 70,
    foot_traffic_proxy: 82,
    population_density_index: 68,
    competition_index: 78,
    commercial_rent_index: 62,
  },
  {
    name: "Rajarhat",
    latitude: 22.6078,
    longitude: 88.4785,
    income_index: 65,
    foot_traffic_proxy: 50,
    population_density_index: 40,
    competition_index: 33,
    commercial_rent_index: 38,
  },
  {
    name: "Jadavpur",
    latitude: 22.4999,
    longitude: 88.3697,
    income_index: 62,
    foot_traffic_proxy: 68,
    population_density_index: 72,
    competition_index: 55,
    commercial_rent_index: 50,
  },
  {
    name: "Alipore",
    latitude: 22.5266,
    longitude: 88.3363,
    income_index: 92,
    foot_traffic_proxy: 42,
    population_density_index: 35,
    competition_index: 28,
    commercial_rent_index: 88,
  },
  {
    name: "Tollygunge",
    latitude: 22.4981,
    longitude: 88.3424,
    income_index: 60,
    foot_traffic_proxy: 65,
    population_density_index: 78,
    competition_index: 52,
    commercial_rent_index: 46,
  },
  {
    name: "Dum Dum",
    latitude: 22.6452,
    longitude: 88.3978,
    income_index: 52,
    foot_traffic_proxy: 72,
    population_density_index: 85,
    competition_index: 38,
    commercial_rent_index: 30,
  },
  {
    name: "Kasba",
    latitude: 22.5135,
    longitude: 88.3837,
    income_index: 65,
    foot_traffic_proxy: 70,
    population_density_index: 70,
    competition_index: 48,
    commercial_rent_index: 55,
  },
  {
    name: "Howrah",
    latitude: 22.5958,
    longitude: 88.2636,
    income_index: 48,
    foot_traffic_proxy: 76,
    population_density_index: 90,
    competition_index: 55,
    commercial_rent_index: 26,
  },
];
