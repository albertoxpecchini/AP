#!/usr/bin/env node
// Prepara pzkko/scena/lib/three.js: i pezzi di three.js che servono alla scena 3D
// della home (la strada, la saracinesca, le luci) più gli addon (post-processing,
// specchi, cielo, SVG), in un solo modulo ES minimizzato, così pzkko.it resta
// senza build. È il gemello di tools/pzkko/roulette/motore.mjs. A parte, solo per
// ?glb=1, lib/gltf.js con l'esportatore glTF (porta con sé la sua copia di three:
// si scarica solo quando serve).
//
//   mkdir %TEMP%\motore && cd %TEMP%\motore && npm i three@0.186.1 esbuild
//   node tools/pzkko/scena/motore.mjs --moduli=%TEMP%\motore\node_modules
import { createRequire } from 'node:module'
import { copyFile, mkdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const LIB = join(QUI, '../../../pzkko/scena/lib')
const moduli = (process.argv.find((a) => a.startsWith('--moduli=')) ?? '').split('=')[1]
if (!moduli) { console.error('uso: motore.mjs --moduli=<cartella node_modules con three ed esbuild>'); process.exit(1) }
const req = createRequire(join(moduli, 'x.js'))
const esbuild = req('esbuild')

// tutto quello che la scena importa da './lib/three.js'
export const NOMI = [
  'WebGLRenderer', 'WebGLRenderTarget', 'Scene', 'PerspectiveCamera', 'Group', 'Object3D', 'Mesh',
  'BufferGeometry', 'BufferAttribute', 'Float32BufferAttribute', 'PlaneGeometry', 'BoxGeometry', 'CylinderGeometry', 'SphereGeometry',
  'TorusGeometry', 'CircleGeometry', 'ShapeGeometry', 'Shape', 'Path', 'Vector2', 'Vector3', 'Matrix4', 'Quaternion', 'Euler', 'Color', 'MathUtils',
  'MeshStandardMaterial', 'MeshPhysicalMaterial', 'MeshBasicMaterial', 'ShaderMaterial',
  'DirectionalLight', 'SpotLight', 'PointLight', 'HemisphereLight',
  'CanvasTexture', 'Texture', 'TextureLoader', 'DataTexture', 'SRGBColorSpace', 'NoColorSpace',
  'RepeatWrapping', 'MirroredRepeatWrapping', 'ClampToEdgeWrapping', 'LinearFilter', 'LinearMipmapLinearFilter',
  'AgXToneMapping', 'ACESFilmicToneMapping', 'NoToneMapping', 'PCFShadowMap', 'PMREMGenerator', 'DoubleSide', 'FrontSide', 'BackSide',
  'HalfFloatType', 'Fog', 'NormalBlending', 'MultiplyBlending',
]
const comune = { bundle: true, format: 'esm', minify: true, target: 'es2020', legalComments: 'none' }
await mkdir(LIB, { recursive: true })
const out = join(LIB, 'three.js')
await esbuild.build({ ...comune, stdin: { contents: `export { ${NOMI.join(', ')} } from 'three'
export { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
export { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
export { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
export { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
export { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
export { Reflector } from 'three/addons/objects/Reflector.js'
export { Sky } from 'three/addons/objects/Sky.js'
export { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
export { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
`, resolveDir: moduli, loader: 'js' }, outfile: out, banner: { js: '// three.js r186 (MIT, https://threejs.org) con gli addon che usa la scena 3D della home: vedi tools/pzkko/scena/motore.mjs' } })
const gltf = join(LIB, 'gltf.js')
await esbuild.build({ ...comune, stdin: { contents: `export { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'\n`, resolveDir: moduli, loader: 'js' }, outfile: gltf, banner: { js: '// GLTFExporter di three.js r186 (MIT), con la sua copia di three: si carica solo con ?glb=1. Vedi tools/pzkko/scena/motore.mjs' } })
await copyFile(join(moduli, 'three/LICENSE'), join(LIB, 'LICENSE-three.txt'))
await writeFile(join(LIB, 'LEGGIMI.txt'), 'three.js r186 (MIT) con gli addon della scena (three.js) e l\'esportatore glTF a parte (gltf.js), copiati da tools/pzkko/scena/motore.mjs.\n')
for (const f of [out, gltf]) console.log('scritto', f, Math.round((await stat(f)).size / 1024), 'KB')
