// imports ->
import * as THREE from 'three'
import { FontLoader, OrbitControls, TextGeometry } from 'three/examples/jsm/Addons.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import fragment from './shaders/frag.glsl'
import vertex from './shaders/vert.glsl'

// constants ->
const device = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: window.devicePixelRatio
}

export class Sketch {
    canvas: HTMLCanvasElement
    renderer: THREE.WebGLRenderer
    camera: THREE.OrthographicCamera
    scene: THREE.Scene
    clock: THREE.Clock
    time: number
    controls: OrbitControls
    stats?: Stats
    mesh?: THREE.Mesh
    material?: THREE.ShaderMaterial
    mouse: THREE.Vector2 = new THREE.Vector2(0, 0)
    mouseTarget: THREE.Vector2 = new THREE.Vector2(0, 0)
    textMesh?: THREE.Mesh

    constructor(canvas: HTMLCanvasElement) {
        this.time = 0

        this.canvas = canvas
        this.scene = new THREE.Scene()
        this.camera = this.getOrthographicCamera()
        this.camera.position.set(0, 0, 10)
        this.scene.add(this.camera)

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
        this.renderer.setSize(device.width, device.height)
        this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2))
        this.renderer.setClearColor(0xeeeeee, 1)

        this.controls = new OrbitControls(this.camera, canvas)
        this.clock = new THREE.Clock()
        this.addMouseEvents()

        this.initStats()
        this.init()
    }

    init(): void {
        this.addLights()
        this.addGeometry()
        this.resize()
        this.render()
    }

    addGeometry(): void {
        const aspect = device.width / device.height

        const plane = new THREE.PlaneGeometry(
            3 * aspect - 0.2 / aspect,
            2.8,
            1,
            1
        )
        this.material = new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            fragmentShader: fragment,
            vertexShader: vertex,
            uniforms: {
                time: { value: 0 },
                rotation: { value: Math.PI / 4 },
                lineWidth: { value: 0.45 },
                repeat: { value: 5 },
                resolution: { value: new THREE.Vector2(device.width, device.height) },
                uvRate1: { value: new THREE.Vector2(1, 1) }
            }
        })

        // const box = new THREE.BoxGeometry(1, 1, 1)
        // const boxMesh = new THREE.Mesh(box, this.material)
        // this.scene.add(boxMesh)
        this.addText()

        this.mesh = new THREE.Mesh(plane, this.material)
        this.scene.add(this.mesh)
    }

    addText(): void {
        const loader = new FontLoader()
        loader.load('../font.json', (font) => {
            const textGeo = new TextGeometry('currents', {
                font,
                size: 0.95,
                depth: 0.15,
                curveSegments: 12,
                bevelEnabled: false,
            })

            // center the axis of rotation ->
            textGeo.computeBoundingBox()
            const centerOffset = new THREE.Vector3()
            textGeo.boundingBox.getCenter(centerOffset)
            centerOffset.multiplyScalar(-1)
            textGeo.translate(centerOffset.x, centerOffset.y, centerOffset.z)

            this.textMesh = new THREE.Mesh(textGeo, this.material)
            this.textMesh.position.z = 1
            this.textMesh.position.x = 0
            this.textMesh.position.y = 0
            this.scene.add(this.textMesh)
        })
    }

    render(): void {
        this.stats?.begin()
        this.time += 0.005
        this.controls.update()
        this.material!.uniforms.time.value = this.time

        this.mouseTarget.x -= (this.mouseTarget.x - this.mouse.x) * 0.5
        this.mouseTarget.y -= (this.mouseTarget.y - this.mouse.y) * 0.5

        if (this.textMesh) {
            this.textMesh.rotation.x = this.mouseTarget.y * 0.5
            this.textMesh.rotation.y = this.mouseTarget.x * 0.25
        }


        this.renderer.render(this.scene, this.camera)
        this.stats?.end()
        requestAnimationFrame(this.render.bind(this))
    }

    initStats(): void {
        this.stats = new Stats()
        this.stats.showPanel(0)
        this.stats.addPanel(new Stats.Panel('MB', '#f8f', '#212'))
        // this.memPanel = this.stats.panels[2]
        this.stats.dom.style.cssText = 'position:absolute;top:0;left:0;'
        document.body.appendChild(this.stats.dom)
    }

    addLights(): void {
        // const pointLight = new THREE.PointLight(0xffffff, 100)
        // pointLight.position.set(10, 10, 10)
        this.scene.add(new THREE.AmbientLight(new THREE.Color(1, 1, 1), 10))
        // this.scene.add(pointLight)
    }

    addMouseEvents(): void {
        document.addEventListener('mousemove', (event: MouseEvent) => {
            this.mouse.x = (event.pageX / device.width - 0.5) * 2
            this.mouse.y = (event.pageY / device.height - 0.5) * 2
        })
    }

    resize(): void {
        window.addEventListener('resize', this.onResize.bind(this))
    }

    onResize(): void {
        device.width = window.innerWidth
        device.height = window.innerHeight

        this.camera.aspect = device.width / device.height
        this.camera.updateProjectionMatrix()

        this.renderer.setSize(device.width, device.height)
    }

    getOrthographicCamera(): THREE.OrthographicCamera {
        const frustum = 3
        const aspect = device.width / device.height

        return new THREE.OrthographicCamera(frustum * aspect / -2, frustum * aspect / 2, frustum / 2, frustum / -2, -1000)
    }
}
