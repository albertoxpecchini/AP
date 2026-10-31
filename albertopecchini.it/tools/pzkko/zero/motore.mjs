#!/usr/bin/env node
// Prepara pzkko/telefono/zero/lib/three.js: i pezzi di three.js che servono al cercapersone «zero» in 3D
// (telefono/zero/zero.js) più il caricatore glTF, la stanza di luce (RoomEnvironment) e le scatole stondate, in un solo
// modulo ES minimizzato, così pzkko.it resta senza build. È il fratello di tools/pzkko/scena/motore.mjs (la scena della
// home ha la sua copia: non si toccano a vicenda).
//
//   mkdir %TEMP%\motore && cd %TEMP%\motore && npm i three@0.186.1 esbuild
//   node tools/pzkko/zero/motore.mjs --moduli=%TEMP%\motore\node_modules
import { createRequire } from 'node:module'
import { copyFile, mkdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const LIB = join(QUI, '../../../pzkko/telefono/zero/lib')
const moduli = (process.argv.find((a) => a.startsWith('--moduli=')) ?? '').split('=')[1]
if (!moduli) { console.error('uso: motore.mjs --moduli=<cartella node_modules con three ed esbuild>'); process.exit(1) }
const req = createRequire(join(moduli, 'x.js'))
const esbuild = req('esbuild')

// tutto quello che zero.js importa da './lib/three.js'
const NOMI = [
  'WebGLRenderer', 'Scene', 'PerspectiveCamera', 'Group', 'Object3D', 'Mesh',
  'BufferGeometry', 'BufferAttribute', 'Float32BufferAttribute', 'PlaneGeometry', 'BoxGeometry', 'CylinderGeometry', 'SphereGeometry', 'CapsuleGeometry',
  'TubeGeometry', 'CatmullRomCurve3', 'ExtrudeGeometry', 'Shape', 'Path',
  'Vector2', 'Vector3', 'Vector4', 'Matrix4', 'Quaternion', 'Euler', 'Color', 'MathUtils', 'Raycaster', 'Box3', 'Sphere', 'Plane', 'Clock',
  'MeshStandardMaterial', 'MeshPhysicalMaterial', 'MeshBasicMaterial',
  'DirectionalLight', 'SpotLight', 'PointLight', 'HemisphereLight', 'AmbientLight', 'RectAreaLight',
  'CanvasTexture', 'Texture', 'SRGBColorSpace', 'NoColorSpace', 'LinearFilter', 'LinearMipmapLinearFilter', 'RepeatWrapping', 'ClampToEdgeWrapping',
  'ACESFilmicToneMapping', 'NeutralToneMapping', 'NoToneMapping', 'PMREMGenerator', 'DoubleSide', 'FrontSide', 'BackSide', 'HalfFloatType', 'PCFSoftShadowMap',
  // l'ambiente dal sito (luce.js): il cielo disegnato (equirettangolare) o le sei facce fotografate nella scena della home
  'EquirectangularReflectionMapping', 'CubeReflectionMapping', 'CubeTexture', 'DataTexture', 'RGBAFormat', 'UnsignedByteType',
]
await mkdir(LIB, { recursive: true })
const out = join(LIB, 'three.js')
await esbuild.build({
  bundle: true, format: 'esm', minify: true, target: 'es2020', legalComments: 'none',
  stdin: { contents: `export { ${NOMI.join(', ')} } from 'three'
export { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
export { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
export { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
export { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
`, resolveDir: moduli, loader: 'js' },
  outfile: out, banner: { js: '// three.js r186 (MIT, https://threejs.org) con GLTFLoader, RoomEnvironment e RoundedBoxGeometry, per il cercapersone zero: vedi tools/pzkko/zero/motore.mjs' },
})
await copyFile(join(moduli, 'three/LICENSE'), join(LIB, 'LICENSE-three.txt'))
await writeFile(join(LIB, 'LEGGIMI.txt'), 'three.js r186 (MIT) coi pezzi che servono al cercapersone zero (telefono/zero/zero.js), copiati da tools/pzkko/zero/motore.mjs.\n')
console.log('scritto', out, Math.round((await stat(out)).size / 1024), 'KB')
