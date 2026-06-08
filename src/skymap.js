/* skymap.js — bright-star catalog + alt/az computation for the live sky map.
   Coordinates J2000 (RA in hours, Dec in degrees). Horizontal coordinates are
   computed with astronomy-engine for the given moment/place, so the dome always
   matches the real sky over Aripuanã. */

import * as Astronomy from "astronomy-engine";

/* naked-eye bright stars — chosen for constellations visible from lat ~-10 */
export const STARS = [
  { id: "sirius", name: "Sirius", ra: 6.7525, dec: -16.716, mag: -1.46 },
  { id: "canopus", name: "Canopus", ra: 6.399, dec: -52.696, mag: -0.74 },
  { id: "alpha_cen", name: "Rigil Kentaurus", ra: 14.66, dec: -60.835, mag: -0.27 },
  { id: "arcturus", name: "Arcturus", ra: 14.261, dec: 19.182, mag: -0.05 },
  { id: "vega", name: "Vega", ra: 18.6156, dec: 38.784, mag: 0.03 },
  { id: "capella", name: "Capella", ra: 5.278, dec: 45.998, mag: 0.08 },
  { id: "rigel", name: "Rigel", ra: 5.2423, dec: -8.2017, mag: 0.13 },
  { id: "procyon", name: "Procyon", ra: 7.655, dec: 5.225, mag: 0.34 },
  { id: "achernar", name: "Achernar", ra: 1.6286, dec: -57.2367, mag: 0.46 },
  { id: "betelgeuse", name: "Betelgeuse", ra: 5.9195, dec: 7.407, mag: 0.5 },
  { id: "hadar", name: "Hadar", ra: 14.0637, dec: -60.373, mag: 0.61 },
  { id: "altair", name: "Altair", ra: 19.846, dec: 8.868, mag: 0.77 },
  { id: "acrux", name: "Acrux", ra: 12.4433, dec: -63.099, mag: 0.77 },
  { id: "aldebaran", name: "Aldebaran", ra: 4.5987, dec: 16.509, mag: 0.85 },
  { id: "antares", name: "Antares", ra: 16.49, dec: -26.432, mag: 1.09 },
  { id: "spica", name: "Spica", ra: 13.4199, dec: -11.161, mag: 0.97 },
  { id: "pollux", name: "Pollux", ra: 7.7553, dec: 28.026, mag: 1.14 },
  { id: "fomalhaut", name: "Fomalhaut", ra: 22.9608, dec: -29.622, mag: 1.16 },
  { id: "deneb", name: "Deneb", ra: 20.69, dec: 45.28, mag: 1.25 },
  { id: "mimosa", name: "Mimosa", ra: 12.7953, dec: -59.689, mag: 1.25 },
  { id: "regulus", name: "Regulus", ra: 10.1395, dec: 11.967, mag: 1.35 },
  { id: "adhara", name: "Adhara", ra: 6.977, dec: -28.972, mag: 1.5 },
  { id: "castor", name: "Castor", ra: 7.5767, dec: 31.888, mag: 1.57 },
  { id: "gacrux", name: "Gacrux", ra: 12.5194, dec: -57.113, mag: 1.63 },
  { id: "shaula", name: "Shaula", ra: 17.5601, dec: -37.104, mag: 1.63 },
  { id: "bellatrix", name: "Bellatrix", ra: 5.4188, dec: 6.35, mag: 1.64 },
  { id: "elnath", name: "Elnath", ra: 5.4382, dec: 28.608, mag: 1.65 },
  { id: "miaplacidus", name: "Miaplacidus", ra: 9.22, dec: -69.717, mag: 1.67 },
  { id: "alnilam", name: "Alnilam", ra: 5.6036, dec: -1.2019, mag: 1.69 },
  { id: "alnitak", name: "Alnitak", ra: 5.6793, dec: -1.9426, mag: 1.77 },
  { id: "dubhe", name: "Dubhe", ra: 11.0621, dec: 61.751, mag: 1.79 },
  { id: "kaus", name: "Kaus Australis", ra: 18.4029, dec: -34.385, mag: 1.85 },
  { id: "sargas", name: "Sargas", ra: 17.6219, dec: -42.998, mag: 1.87 },
  { id: "atria", name: "Atria", ra: 16.811, dec: -69.028, mag: 1.91 },
  { id: "saiph", name: "Saiph", ra: 5.7959, dec: -9.6696, mag: 2.07 },
  { id: "nunki", name: "Nunki", ra: 18.9211, dec: -26.297, mag: 2.05 },
  { id: "denebola", name: "Denebola", ra: 11.8177, dec: 14.572, mag: 2.11 },
  { id: "mintaka", name: "Mintaka", ra: 5.5334, dec: -0.2991, mag: 2.23 },
  { id: "merak", name: "Merak", ra: 11.0307, dec: 56.382, mag: 2.37 },
  { id: "dschubba", name: "Dschubba", ra: 16.0056, dec: -22.622, mag: 2.29 },
  { id: "delta_cru", name: "Delta Crucis", ra: 12.2525, dec: -58.749, mag: 2.79 },
];

/* constellation stick figures — pairs of star ids */
export const LINES = [
  // Cruzeiro do Sul
  ["acrux", "gacrux"],
  ["mimosa", "delta_cru"],
  // Centauro (apontadores)
  ["alpha_cen", "hadar"],
  // Órion
  ["betelgeuse", "bellatrix"],
  ["bellatrix", "mintaka"],
  ["mintaka", "alnilam"],
  ["alnilam", "alnitak"],
  ["alnitak", "betelgeuse"],
  ["mintaka", "rigel"],
  ["alnitak", "saiph"],
  ["rigel", "saiph"],
  // Escorpião
  ["antares", "dschubba"],
  ["antares", "shaula"],
  ["shaula", "sargas"],
  // Leão
  ["regulus", "denebola"],
  // Gêmeos
  ["castor", "pollux"],
  // Sagitário
  ["kaus", "nunki"],
  // Touro
  ["aldebaran", "elnath"],
  // Ursa Maior (parte)
  ["dubhe", "merak"],
];

const PLANETS = [
  { body: "Mercury", name: "Mercúrio", sym: "☿", color: "#c0b8a8" },
  { body: "Venus", name: "Vênus", sym: "♀", color: "#f5e6b0" },
  { body: "Mars", name: "Marte", sym: "♂", color: "#e07a5f" },
  { body: "Jupiter", name: "Júpiter", sym: "♃", color: "#e8c88a" },
  { body: "Saturn", name: "Saturno", sym: "♄", color: "#d9c27a" },
];

function horOf(time, observer, body) {
  const e = Astronomy.Equator(body, time, observer, true, true);
  const h = Astronomy.Horizon(time, observer, e.ra, e.dec, "normal");
  return { alt: h.altitude, az: h.azimuth };
}

/* compute alt/az for stars, planets, Sun and Moon at the given moment.
   Returns everything (even below horizon) — the renderer clips to alt >= 0. */
export function computeSky(date = new Date(), lat, lon) {
  try {
    const observer = new Astronomy.Observer(lat, lon, 200);
    const time = Astronomy.MakeTime(date);

    const stars = STARS.map((s) => {
      const h = Astronomy.Horizon(time, observer, s.ra, s.dec, "normal");
      return { id: s.id, name: s.name, mag: s.mag, alt: h.altitude, az: h.azimuth };
    });

    const sun = horOf(time, observer, Astronomy.Body.Sun);
    const moonHor = horOf(time, observer, Astronomy.Body.Moon);
    const moonIllum = Astronomy.Illumination(Astronomy.Body.Moon, time);
    const moon = {
      alt: moonHor.alt,
      az: moonHor.az,
      illumination: moonIllum.phase_fraction,
      phaseAngle: moonIllum.phase_angle,
    };

    const planets = PLANETS.map((p) => {
      const body = Astronomy.Body[p.body];
      const h = horOf(time, observer, body);
      const mag = Astronomy.Illumination(body, time).mag;
      return { name: p.name, sym: p.sym, color: p.color, alt: h.alt, az: h.az, mag };
    });

    return { ok: true, stars, planets, sun, moon, isNight: sun.alt < -6 };
  } catch {
    return { ok: false, stars: [], planets: [], sun: null, moon: null, isNight: false };
  }
}
