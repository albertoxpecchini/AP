#!/usr/bin/env node
// Prepara pzkko/scena/lib/three.js: i pezzi di three.js che servono alla scena 3D
// della home (la strada, la saracinesca, le luci) più gli addon (post-processing,
// specchi, cielo, SVG, esportazione glTF), in un solo modulo ES minimizzato, così
// pzkko.it resta senza build. È il gemello di tools/pzkko/roulette/motore.mjs.
//
//   mkdir %TEMP%\motore && cd %TEMP%\motore && npm i three@0.186.1 esbuild
//   node tools/pzkko/scena/motore.mjs --moduli=%TEMP%\motore\node_modules
import { createRequire } from 'node:module'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const LIB = join(QUI, '../../../pzkko/scena/lib')
const moduli = (process.argv.find((a) => a.startsWith('--moduli=')) ?? '').split('=')[1]
if (!moduli) { console.error('uso: motore.mjs --moduli=<cartella node_modules con three ed esbuild>'); process.exit(1) }
const req = createRequire(join(moduli, 'x.js'))
const esbuild = req('esbuild')

// tutto quello che scena.js importa da './lib/three.js'
export const NOMI = [
  'WebGLRenderer', 'WebGLRenderTarget', 'Scene', 'PerspectiveCamera', 'OrthographicCamera', 'Group', 'Object3D', 'Mesh', 'InstancedMesh',
  'BufferGeometry', 'BufferAttribute', 'Float32BufferAttribute', 'PlaneGeometry', 'BoxGeometry', 'CylinderGeometry', 'SphereGeometry',
  'CapsuleGeometry', 'TorusGeometry', 'CircleGeometry', 'RingGeometry', 'ExtrudeGeometry', 'ShapeGeometry', 'LatheGeometry', 'TubeGeometry',
  'Shape', 'Path', 'Vector2', 'Vector3', 'Vector4', 'Matrix4', 'Matrix3', 'Quaternion', 'Euler', 'Color', 'MathUtils',
  'MeshStandardMaterial', 'MeshPhysicalMaterial', 'MeshBasicMaterial', 'MeshLambertMaterial', 'ShaderMaterial', 'ShadowMaterial',
  'SpriteMaterial', 'Sprite', 'PointsMaterial', 'Points', 'LineBasicMaterial', 'Line', 'LineSegments',
  'DirectionalLight', 'SpotLight', 'PointLight', 'HemisphereLight', 'AmbientLight', 'RectAreaLight',
  'CanvasTexture', 'Texture', 'TextureLoader', 'DataTexture', 'SRGBColorSpace', 'LinearSRGBColorSpace', 'NoColorSpace',
  'RepeatWrapping', 'MirroredRepeatWrapping', 'ClampToEdgeWrapping', 'LinearFilter', 'LinearMipmapLinearFilter', 'NearestFilter',
  'ACESFilmicToneMapping', 'AgXToneMapping', 'NeutralToneMapping', 'NoToneMapping', 'PCFSoftShadowMap', 'PCFShadowMap', 'VSMShadowMap',
  'PMREMGenerator', 'DoubleSide', 'FrontSide', 'BackSide', 'AdditiveBlending', 'NormalBlending', 'MultiplyBlending', 'CustomBlending',
  'HalfFloatType', 'FloatType', 'UnsignedByteType', 'RGBAFormat', 'RedFormat', 'Raycaster', 'Plane', 'Frustum', 'Box3', 'Sphere',
  'Fog', 'FogExp2', 'Clock', 'Layers', 'Curve', 'CatmullRomCurve3', 'LineCurve3', 'CurvePath', 'QuadraticBezierCurve3',
  'EquirectangularReflectionMapping', 'CubeReflectionMapping', 'Uniform', 'UniformsUtils', 'UniformsLib', 'ShaderLib', 'ShaderChunk',
  'SpotLightHelper', 'DirectionalLightHelper', 'CameraHelper', 'AxesHelper', 'Cache',
]
const entrata = `export { ${NOMI.join(', ')} } from 'three'
export { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
export { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
export { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
export { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
export { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
export { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'
export { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js'
export { Reflector } from 'three/addons/objects/Reflector.js'
export { Sky } from 'three/addons/objects/Sky.js'
export { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
export { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
export { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
export { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js'
export { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
`
await mkdir(LIB, { recursive: true })
const out = join(LIB, 'three.js')
await esbuild.build({ stdin: { contents: entrata, resolveDir: moduli, loader: 'js' }, bundle: true, format: 'esm', minify: true, target: 'es2020', outfile: out, legalComments: 'none', banner: { js: '// three.js r186 (MIT, https://threejs.org) con gli addon che usa la scena 3D della home: vedi tools/pzkko/scena/motore.mjs' } })
await copyFile(join(moduli, 'three/LICENSE'), join(LIB, 'LICENSE-three.txt'))
await writeFile(join(LIB, 'LEGGIMI.txt'), 'three.js r186 (MIT) con gli addon della scena, copiato da tools/pzkko/scena/motore.mjs.\n')
console.log('scritto', out)
