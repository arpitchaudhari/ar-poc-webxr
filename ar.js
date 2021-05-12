import * as THREE from 'https://unpkg.com/three@0.120.1/build/three.module.js'
import { ARButton } from 'https://unpkg.com/three@0.120.1/examples/jsm/webxr/ARButton.js'
import { GLTFLoader } from 'https://unpkg.com/three@0.120.1/examples/jsm/loaders/GLTFLoader.js';

//Variables
let container;
let camera, scene, renderer;
let controller;
let reticle;
let hitTestSource = null;
let hitTestSourceRequested = false;

init();
animate();

function init() {
    container = document.createElement('div');
    document.body.appendChild(container);

    /**
     * Scene allows to setup what and where to render. 
     * It is a place where we put object, lights and camera.
     */
    scene = new THREE.Scene();
    /**
     * Its a camera that uses perspective projection.
     * Its a projection mode that is designed to mimic the way eyes see.
     * Its an common mode for rendering a 3D scene.
     */
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    /**
     * Light source positioned directly above the scene.
     */
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    /**
     * Its a WebGL renderer that display scene using WebGL.
     * setPixelRatio : It sets device pixel ratio. 
     * setSize : It resize output canvas.
     * xr : Provices access to WebXR interface of renderer.
     */
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    //Adds Button for in augmented reality scene for user interaction.
    document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

    //This function activitates when user taps on the screen to place the object
    function onSelect() {

        if (reticle.visible) {
            /**
             * GLTFLoader loafs the glFT content.
             * Its an open format specification for effectively deverling of 3D content.
             */
            const loader = new GLTFLoader().setPath('/glTFk/');
            loader.load('MaterialsVariantsShoe.gltf', function (gltf) {
                gltf.scene.scale.set(1, 1, 1);
                scene.add(gltf.scene);
            });

        }

    }

    //Adding Event Listener to HTML DOM and adding scene
    controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect);
    scene.add(controller);

    /**
     * Its a class that represents triangular polygon mesh based objects.
     */
    reticle = new THREE.Mesh(
        //Class for generating 2D ring geometry.
        new THREE.RingGeometry(0.15, 0.2, 32).rotateX(- Math.PI / 2),
        new THREE.MeshBasicMaterial()
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    //Adding EventListener for window resize
    window.addEventListener('resize', onWindowResize);
}

//Resize the renderer dimesion
function onWindowResize() {
    //Sets aspect ratio for the camera
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    //Updates the camera projection matrix.
    renderer.setSize(window.innerWidth, window.innerHeight);

}

/**
 * This function is called for every available frame. 
 * If there is no frame than it will stop any ongoing animation
 */
function animate() {
    renderer.setAnimationLoop(render);
}

//Renders the frame in Augmented Reality Space
function render(timestamp, frame) {

    if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();
        if (hitTestSourceRequested === false) {
            session.requestReferenceSpace('viewer').then(function (referenceSpace) {
                session.requestHitTestSource({ space: referenceSpace }).then(function (source) {
                    hitTestSource = source;
                });
            });

            session.addEventListener('end', function () {
                hitTestSourceRequested = false;
                hitTestSource = null;
            });
            hitTestSourceRequested = true;
        }

        if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length) {
                const hit = hitTestResults[0];
                reticle.visible = true;
                reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
            } else {
                reticle.visible = false;
            }
        }
    }
    renderer.render(scene, camera);
}
