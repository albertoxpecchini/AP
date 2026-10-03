// Registro delle tavole generate. Nei dati un'immagine segnaposto si scrive così:
//
//   { art: 'floorplan', variant: 'casa', tone: 'paper', alt: 'Pianta del piano terra' }
//
// e si sostituisce con una fotografia reale cambiando la voce in:
//
//   { src: '/media/progetti/nome/01.webp', width: 1600, height: 1200, alt: '…' }

import { floorplan } from './floorplan.js'
import { elevation, section } from './building.js'
import { pointcloud, ortho, cadastral, urban, sitelayout } from './survey.js'
import { canopy, bim, render, workspace } from './axon.js'
import { brandmark, restyle, stationery, poster, social, brochure, packaging, signage, icons, slides, titleblock } from './brand.js'
import { identity } from './identity.js'
import { sitespec } from './sitespec.js'
import { webpage } from './web.js'
import { portrait, areamap } from './misc.js'

const REGISTRY = {
  floorplan,
  elevation,
  section,
  pointcloud,
  ortho,
  cadastral,
  urban,
  sitelayout,
  canopy,
  bim,
  render,
  workspace,
  brandmark,
  restyle,
  stationery,
  poster,
  social,
  brochure,
  packaging,
  signage,
  icons,
  slides,
  titleblock,
  identity,
  sitespec,
  webpage,
  portrait,
  areamap,
}

/** Registra nuovi generatori (usato dagli altri moduli di src/art). */
export function register(map) {
  Object.assign(REGISTRY, map)
}

// Le tavole con squadratura e cartiglio si mostrano intere (come un foglio su un
// tavolo); le altre riempiono il riquadro. `fit: 'cover' | 'contain'` lo forza.
const SHEETS = new Set(['floorplan', 'elevation', 'section', 'pointcloud', 'ortho', 'cadastral', 'urban', 'sitelayout', 'canopy', 'bim'])

export const isSheet = (spec) => Boolean(spec?.art) && (spec.fit ? spec.fit === 'contain' : SHEETS.has(spec.art) && !spec.bare)

export function renderArt(spec = {}) {
  const make = REGISTRY[spec.art]
  if (!make) throw new Error(`Tavola sconosciuta: "${spec.art}". Disponibili: ${Object.keys(REGISTRY).join(', ')}`)
  const { art, alt, ratio, fit, ...options } = spec
  if (ratio && !options.w) {
    const [rw, rh] = String(ratio).split('/').map(Number)
    options.w = 1200
    options.h = Math.round((1200 * rh) / rw)
  }
  const svg = make({ label: alt, ...options })
  const contain = fit ? fit === 'contain' : SHEETS.has(art) && !options.bare
  return contain ? svg.replace('class="art ', 'class="art art--sheet ').replace('preserveAspectRatio="xMidYMid slice"', 'preserveAspectRatio="xMidYMid meet"') : svg
}

export const artNames = () => Object.keys(REGISTRY)
