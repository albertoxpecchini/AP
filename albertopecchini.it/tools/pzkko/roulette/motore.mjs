#!/usr/bin/env node
// Prepara pzkko/games/roulette/lib/three.js: i pezzi di three.js che servono alla
// ruota 3D (più RoomEnvironment e mergeGeometries), in un solo modulo ES
// minimizzato, così pzkko.it resta senza build. Rapier si copia così com'è
// (lib/rapier.mjs, la versione «compat» col WebAssembly dentro).
//
//   mkdir %TEMP%\motore && cd %TEMP%\motore && npm i three@0.186.1 @dimforge/rapier3d-compat@0.21.0 esbuild
//   node tools/pzkko/roulette/motore.mjs --moduli=%TEMP%\motore\node_modules
import { createRequire } from 'node:module'
import { copyFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const LIB = join(QUI, '../../../pzkko/games/roulette/lib')
const moduli = (process.argv.find((a) => a.startsWith('--moduli=')) ?? '').split('=')[1]
if (!moduli) { console.error('uso: motore.mjs --moduli=<cartella node_modules con three, rapier ed esbuild>'); process.exit(1) }
const req = createRequire(join(moduli, 'x.js'))
const esbuild = req('esbuild')

// tutto quello che roulette.js importa da './lib/three.js'
export const NOMI = [
  'WebGLRenderer', 'Scene', 'PerspectiveCamera', 'Group', 'Object3D', 'Mesh', 'InstancedMesh', 'BufferGeometry', 'BufferAttribute',
  'Float32BufferAttribute', 'LatheGeometry', 'CylinderGeometry', 'SphereGeometry', 'BoxGeometry', 'TorusGeometry', 'PlaneGeometry', 'CircleGeometry',
  'ExtrudeGeometry', 'Shape', 'MeshStandardMaterial', 'MeshPhysicalMaterial', 'MeshBasicMaterial', 'ShadowMaterial', 'Color', 'Vector2', 'Vector3',
  'Quaternion', 'Matrix4', 'Euler', 'DirectionalLight', 'HemisphereLight', 'AmbientLight', 'SpotLight', 'CanvasTexture', 'TextureLoader',
  'SRGBColorSpace', 'RepeatWrapping', 'MirroredRepeatWrapping', 'ClampToEdgeWrapping', 'ACESFilmicToneMapping', 'NeutralToneMapping',
  'PCFSoftShadowMap', 'PMREMGenerator', 'DoubleSide', 'FrontSide', 'MathUtils', 'LinearFilter', 'LinearMipmapLinearFilter', 'Raycaster', 'Plane',
]
const entrata = `export { ${NOMI.join(', ')} } from 'three'
export { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
export { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
`
const out = join(LIB, 'three.js')
await esbuild.build({ stdin: { contents: entrata, resolveDir: moduli, loader: 'js' }, bundle: true, format: 'esm', minify: true, target: 'es2020', outfile: out, legalComments: 'none', banner: { js: '// three.js r186 (MIT, https://threejs.org), solo i pezzi che usa la ruota: vedi tools/pzkko/roulette/motore.mjs' } })
await copyFile(join(moduli, '@dimforge/rapier3d-compat/dist/rapier.mjs'), join(LIB, 'rapier.mjs'))
await copyFile(join(moduli, 'three/LICENSE'), join(LIB, 'LICENSE-three.txt'))
await copyFile(join(moduli, '@dimforge/rapier3d-compat/LICENSE'), join(LIB, 'LICENSE-rapier.txt'))
await writeFile(join(LIB, 'LEGGIMI.txt'), 'three.js r186 (MIT) e Rapier 0.21 (Apache 2.0), copiati da tools/pzkko/roulette/motore.mjs.\n')
console.log('scritto', out)
