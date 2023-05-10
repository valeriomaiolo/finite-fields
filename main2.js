import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BoxLineGeometry } from 'three/addons/geometries/BoxLineGeometry.js';
//import { VRButton } from 'three/addons/webxr/VRButton.js';
import { VRButton } from './myVRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { tuningGen } from './tuningGen2.js';

// POLYFILL
// provides support for mobile devices and devices which do not support WebVR (To be removed when WebXR will be widely supported)
import {QueryArgs} from './query-args.js';
import WebXRPolyfill from './webxr-polyfill.module.js';
if (QueryArgs.getBool('usePolyfill', true)) {
    let polyfill = new WebXRPolyfill();
}

let camera, listener, scene, raycaster, renderer, controls, pointer, CLICKED;
let light1, room, floor;
let clock = new THREE.Clock();
let spherePosition, radius = 4;
let BallDistance = 30; // Distance between two balls
let SpheresPerEdge = 2; // per Edge
let Lattice = new THREE.Group();
let oscillator = new Array(SpheresPerEdge);
let panner = new Array(SpheresPerEdge);
let gainNode = [];
let intonation = new Array(SpheresPerEdge);
let mixer = new Array(SpheresPerEdge);
let clipAction = new Array(SpheresPerEdge);
let ball = new Array(SpheresPerEdge);
let audioCtx;
let ArpOn, switch_arp = 0, bpm=300, steps=5, pattern='Ascending', arp_f0, arp_index=1, count = 0, temp = 0;
let notes = [arp_f0, arp_f0*Math.pow(2, 4/12), arp_f0*Math.pow(2, 7/12), arp_f0*Math.pow(2, 10/12), arp_f0*Math.pow(2, 13/12), arp_f0*Math.pow(2, 16/12)];
let f0 = 65.406; //Lattice Fundamental Frequency
let Oct = 3;
let k = 100;
let t = k * (1/f0);
let normAmp = 1/Math.pow(SpheresPerEdge, 3); //volume normalization
let xAxisInterval = 7; //Fifths default
let yAxisInterval = 4; //Maj.Thirds default
let zAxisInterval = 10; // min.Seventh default
let name = "Sphere";
let sound = [];
let fc = new Array(SpheresPerEdge);
let CarrierFrequency = new Array(SpheresPerEdge);
let modNode = new Array(SpheresPerEdge);
let modOsc = new Array(SpheresPerEdge);

const targetQuaternion = new THREE.Quaternion();
const rotationMatrix = new THREE.Matrix4();

const container = document.createElement( 'div' );
document.body.appendChild( container );

initAllTensors();
initScene();
animate();
setupVR();

function initAllTensors(){
	for (var i = 0; i < SpheresPerEdge; i++) {
		intonation[i]= new Array(SpheresPerEdge);
		gainNode[i] = new Array(SpheresPerEdge);
		oscillator[i] = new Array(SpheresPerEdge);
		panner[i] = new Array(SpheresPerEdge);
		sound[i] = new Array(SpheresPerEdge);
		mixer[i] = new Array(SpheresPerEdge);
		clipAction[i] = new Array(SpheresPerEdge);
		ball[i] = new Array(SpheresPerEdge);
		fc[i] = new Array(SpheresPerEdge);
		CarrierFrequency[i] = new Array(SpheresPerEdge);
		modNode[i] = new Array(SpheresPerEdge);
		modOsc[i]= new Array(SpheresPerEdge);
	}

	for (var i = 0; i < SpheresPerEdge; i++) {
		for (var j = 0; j < SpheresPerEdge; j++) {
			intonation[i][j]= new Array(SpheresPerEdge);
			gainNode[i][j] = new Array(SpheresPerEdge);
			oscillator[i][j] = new Array(SpheresPerEdge);
			panner[i][j] = new Array(SpheresPerEdge);
			sound[i][j] = new Array(SpheresPerEdge);
			mixer[i][j] = new Array(SpheresPerEdge);
			clipAction[i][j] = new Array(SpheresPerEdge);
			ball[i][j] = new Array(SpheresPerEdge);
			fc[i][j] = new Array(SpheresPerEdge);
			CarrierFrequency[i][j] = new Array(SpheresPerEdge);
			modNode[i][j] = new Array(SpheresPerEdge);
			modOsc[i][j] = new Array(SpheresPerEdge);
		}
	}
}

function initScene(){

    // SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x000000 );

    // LISTENER
    listener = new THREE.AudioListener();
	audioCtx = listener.context;
/*
    // CAMERA
    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight);
    camera.lookAt(new THREE.Vector3(0,0,0));
    camera.position.set( 0,  -60 , 0);
    camera.add(listener);
*/
	// CAMERA
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 10, 10000);
    //camera.position.set( -8.5, 5 , 20);
	camera.position.set( 0, 0 , 20);

    camera.add(listener);

    // LIGHT
	const ambienceLight = new THREE.HemisphereLight( 0x606060, 0x404040 );
	const light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 1, 1, 1 ).normalize();
	light.intensity = 0.4;
	ambienceLight.intensity = 0.5;
	scene.add( ambienceLight);
	scene.add( light );

	const color = 'pink';
    const intensity = 1;
    const light2 = new THREE.DirectionalLight(color, intensity);
    light2.position.set(-10, 10, 0);
    light2.target.position.set(-5, 0, 0);
    scene.add(light2);
    scene.add(light2.target);

	const color2 = 'red';
    const intensity2 = 1;
    const light3 = new THREE.DirectionalLight(color2, intensity2);
    light3.position.set(-10, 10, 10);
    light3.target.position.set(-5, 0, 0);
    scene.add(light3);
    scene.add(light3.target);

    // LATTICE
    initLatticeNEW();

	initSoundLattice();
	
	//Lattice.position.set(-10-BallDistance/2, -BallDistance/2, -BallDistance/2);
	
	// Creation of Lattice "Metadata"
	Lattice.name = "Lattice"; // per intersect nel raycaster!

	fundGlow();
	//SoundVisualPatching();
	Routine();

    // RENDERER
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.xr.enabled = true;
	document.body.appendChild( renderer.domElement );

    // CONTROLS
	controls = new OrbitControls( camera, renderer.domElement );
	controls.target = new THREE.Vector3(0, 3, -6);
	controls.update();

	// SYSTEM - for centering wrt the user
	var system = new THREE.Group();
	scene.add(system);
	system.add(Lattice);
	system.position.set(0,10,-45);
	//system.position.set(0,18,-10);

	window.addEventListener('resize', onWindowResize, false );
}

function fundGlow(){
	t = 900 * (1/f0);
	// create some keyframe tracks
	const roughness = new THREE.KeyframeTrack( '.material.roughness', [ 0, 1*t, 2*t], [ 0, 1, 0] );
	const colorKF = new THREE.ColorKeyframeTrack( '.material.emissiveIntensity', [ 0, 1*t, 2*t ], [ 0, 1, 0]);

	//const opacityFund = new THREE.KeyframeTrack( '.material.opacity', [ 0, 0.5*t, 1*t], [ 0, 1, 0] );


	const clip = new THREE.AnimationClip( 'default', 2*t, [colorKF, roughness]);
	//const clipOpacity = new THREE.AnimationClip( 'default', 2*t, [opacityFund]);

	//mixerOpacity = new THREE.AnimationMixer( ball[0][0][0] );

	for(var i = 0; i<SpheresPerEdge; i++){
		for(var j = 0; j<SpheresPerEdge; j++){
			for(var k = 0; k<SpheresPerEdge; k++){
				mixer[i][j][k] = new THREE.AnimationMixer( ball[i][j][k] );
				
				clipAction[i][j][k] = mixer[i][j][k].clipAction( clip );
				clipAction[i][j][k].play();
			}
		}
	}

	//mixLattice = new THREE.AnimationMixer( Lattice );

	//const clipActionOpacity = mixer.clipAction( clipOpacity );
	//clipActionOpacity.play();

}

function defBallMatrix(){

	for (var i = 0; i < SpheresPerEdge; i++) {
		ball[i] = new Array(SpheresPerEdge);
	}

	for (var i = 0; i < SpheresPerEdge; i++) {
		for (var j = 0; j < SpheresPerEdge; j++) {
			ball[i][j] = new Array(SpheresPerEdge);
		}
	}

    // controllare per bene quello che succede qui:
	for(var i = 0; i<SpheresPerEdge; i++){
		for(var j = 0; j<SpheresPerEdge; j++){
			for(var k = 0; k<SpheresPerEdge; k++){
				spherePosition = [i*BallDistance-(((SpheresPerEdge-1)/2)*BallDistance), j*BallDistance-(((SpheresPerEdge-1)/2)*BallDistance), k*BallDistance-(((SpheresPerEdge-1)/2)*BallDistance)];
				ball[i][j][k] = Ball();
				ball[i][j][k].name = name.concat(i, j, k);
				ball[i][j][k].userData[0] = {MODEL: false, PREVIOUS: false};
				ball[i][j][k].userData[1] = {Arp: false, freqArp: 440}
			}
		}
	}
}

function Ball(){
	const BallGeometry = new THREE.SphereGeometry(radius, 100, 100);
	const material1 = new THREE.MeshStandardMaterial( { color: 'white', roughness: 0, metalness: 0.6, transparent: true, emissiveIntensity: 1 } ) ;
	const material2 = new THREE.MeshPhongMaterial( {
		color: 'white',
		opacity: 1,

	} );

	var ball = new THREE.Mesh( BallGeometry, material1);
	ball.position.set(spherePosition[0],spherePosition[1],spherePosition[2]);

	//light1 = new THREE.PointLight( 0xff0040, 100, 50 );
	//ball.add(light1);
	ball.material.emissive = {r:1,g:0,b:0.25};
	return ball;
}

function initLatticeNEW(){
	defBallMatrix();
	for(var i = 0; i<SpheresPerEdge; i++){
		for(var j = 0; j<SpheresPerEdge; j++){
			for(var k = 0; k<SpheresPerEdge; k++){
				Lattice.add(ball[i][j][k]);
			}
		}
	}
	scene.add(Lattice);
}

function initIntonation(){
	for(var i = 0; i<SpheresPerEdge; i++){
		for(var j = 0; j<SpheresPerEdge; j++){
			for(var k = 0; k<SpheresPerEdge; k++){
				intonation[i][j][k]=(f0 *(Math.pow(2, Oct) * Math.pow(2, ((i-1)*xAxisInterval)/12)) * Math.pow(2, ((j-1)*yAxisInterval)/12))* Math.pow(2, ((k-1)*zAxisInterval)/12);

				ball[i][j][k].userData[1].freqArp = intonation[i][j][k];
			}
		}
	}
	return intonation;
}

function initOscFreqs(){

	for(var i = 0; i<SpheresPerEdge; i++){
		for(var j = 0; j<SpheresPerEdge; j++){
			for(var k = 0; k<SpheresPerEdge; k++){
				oscillator[i][j][k].frequency.setValueAtTime(intonation[i][j][k], audioCtx.currentTime);

			}
		}
	}
} 

function yRotationToVector(degrees){
	// convert degrees to radians and offset the angle so 0 points towards the listener
	const radians = (degrees - 90) * (Math.PI / 180);
	// using cosine and sine here ensures the output values are always normalized
	// i.e. they range between -1 and 1
	const x = Math.cos(radians);
	const z = Math.sin(radians);
  
	// we hard-code the Y component to 0, as Y is the axis of rotation
	return [x, 0, z];
  };
  

function initSoundLattice(){
	//initIntonation();
	tuningGen(SpheresPerEdge, intonation);
    
	for(var i = 0; i< SpheresPerEdge; i++){
		for(var j = 0; j< SpheresPerEdge; j++){
			for(var k = 0; k< SpheresPerEdge; k++){
				oscillator[i][j][k]= audioCtx.createOscillator();
				oscillator[i][j][k].type ='sine';
				oscillator[i][j][k].frequency.setValueAtTime(intonation[i][j][k], audioCtx.currentTime);

				// connect oscillator to gain node to speakers
				//gainNode[i][j][k].connect(audioCtx.destination);
				//gainNode[i][j][k].gain.value = 0;     
				//oscillator[i][j][k].connect(gainNode[i][j][k]);

				sound[i][j][k] = new THREE.PositionalAudio( listener );


				//oscillator[i][j][k].connect(sound[i][j][k].gain);
				sound[i][j][k].setNodeSource(oscillator[i][j][k]);


				sound[i][j][k].gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime);
				sound[i][j][k].setRefDistance( 60 );
				sound[i][j][k].panner.distanceModel = "exponential";
				sound[i][j][k].panner.rolloffFactor = 30;
				//sound[i][j][k].setDirectionalCone ( 360, 360, 0 );
				//sound[i][j][k].setDirectionalCone ( 360, 360, 0 );
				//panner[i][j][k] = sound[i][j][k].getOutput();		

				/*
				let x1, y1, z1;
				let degrees = 180;
				[x1, y1, z1] = yRotationToVector(degrees);
				sound[i][j][k].panner.orientationX.value = x1;
				sound[i][j][k].panner.orientationY.value = y1;
				sound[i][j][k].panner.orientationZ.value = z1;
				*/
				ball[i][j][k].add(sound[i][j][k]); // Molto importante, per incollare l'audio posizionale alle palle

				

				console.log(sound[i][j][k])

				


				//oscillator[i][j][k].start(audioCtx.currentTime);


				/*
				coneInnerAngle: 
				A parameter for directional audio sources, 
				this is an angle, inside of which there will be no volume reduction. 
				The default value is 360.

				coneOuterAngle: 
				A parameter for directional audio sources, 
				this is an angle, outside of which the volume will be reduced to a constant value of coneOuterGain. 
				The default value is 360.

				coneOuterGain: 
				A parameter for directional audio sources, 
				this is the amount of volume reduction outside of the coneOuterAngle. 
				The default value is 0.
				*/

				/*
				
				let degrees = 360;
				let radians = (degrees - 90) * (Math.PI / 180);
  				// using cosine and sine here ensures the output values are always normalized
  				// i.e. they range between -1 and 1
  				let x = Math.cos(radians);
  				let z = Math.sin(radians);
			
				panner[i][j][k] = sound[i][j][k].getOutput();
				panner[i][j][k].distanceModel = "inverse";
				panner[i][j][k].rolloffFactor = 10;
		
				panner[i][j][k].coneInnerAngle = 30;
				panner[i][j][k].coneOuterAngle = 50;
				panner[i][j][k].coneOuterGain = 0;

				//panner[i][j][k].orientationX.setValueAtTime(-90, audioCtx.currentTime);
				panner[i][j][k].orientationY.setValueAtTime(90, audioCtx.currentTime);
				panner[i][j][k].orientationZ.setValueAtTime(50, audioCtx.currentTime);

				*/
				           
			}
		}
		
	}

}

function Routine(){

	

	for(var i = 0; i< SpheresPerEdge; i++){
		for(var j = 0; j< SpheresPerEdge; j++){
			for(var k = 0; k< SpheresPerEdge; k++){
				fc[i][j][k] = intonation[i][j][k];
				CarrierFrequency[i][j][k] = new ConstantSourceNode(audioCtx, {offset: fc[i][j][k]});
				modNode[i][j][k] = audioCtx.createGain();
				modOsc[i][j][k] = audioCtx.createOscillator();
				modNode[i][j][k].connect(oscillator[i][j][k].frequency);
				CarrierFrequency[i][j][k].connect(oscillator[i][j][k].frequency);
				modOsc[i][j][k].connect(modNode[i][j][k]);
				modOsc[i][j][k].start(audioCtx.currentTime);
				modNode[i][j][k].gain.setValueAtTime(500, audioCtx.currentTime);
				modOsc[i][j][k].frequency.setValueAtTime(500, audioCtx.currentTime );
			}
		}
	}

	

    setTimeout(() => {
		for(var i = 0; i< SpheresPerEdge; i++){
			for(var j = 0; j< SpheresPerEdge; j++){
				for(var k = 0; k< SpheresPerEdge; k++){
					CarrierFrequency[i][j][k].start(audioCtx.currentTime);
					oscillator[i][j][k].start(audioCtx.currentTime);}}}
	}, 100);
}

	
function SoundVisualPatching(){

	let soundTempinRaw = new Array();

	for(var i = 0; i < SpheresPerEdge; i++){
		for(var j = 0; j < SpheresPerEdge; j++){
			for(var k = 0; k < SpheresPerEdge; k++){
				soundTempinRaw.push(sound[i][j][k]);
			}
		}
	}

	for(var i = 0; i<Math.pow(SpheresPerEdge,3); i++){
		Lattice.children[i].add(soundTempinRaw[i]);
	}
}

function setupVR(){
    renderer.xr.enabled = true;

    // VR BUTTON
    const button = new VRButton( renderer);
}

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    renderer.setAnimationLoop( render );
    
	controls.update();
}

function render() {
	const delta = clock.getDelta();

	//if ( mixerOpacity ) {
	//	mixerOpacity.update( delta );
	//}

	for(var i = 0; i<SpheresPerEdge; i++){
		for(var j = 0; j<SpheresPerEdge; j++){
			for(var k = 0; k<SpheresPerEdge; k++){
				if ( mixer[i][j][k] ) {
					mixer[i][j][k].update( delta );
				}
			}
		}
	}

	Lattice.rotation.y += 0.00045;
    Lattice.rotation.x += 0.00035;
    Lattice.rotation.z += 0.00035;
 
	renderer.render(scene, camera );
}