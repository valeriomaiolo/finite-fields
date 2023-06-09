import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BoxLineGeometry } from 'three/addons/geometries/BoxLineGeometry.js';
//import { VRButton } from 'three/addons/webxr/VRButton.js';
import { VRButton } from './myVRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { tuningGen } from './tuningGen1.js';

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
let mixer, mixer1,mixer2,mixer3,mixer4,mixer5,mixer6,mixer7, mixerOpacity;
let ball = new Array(SpheresPerEdge);;
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

const targetQuaternion = new THREE.Quaternion();
const rotationMatrix = new THREE.Matrix4();

const container = document.createElement( 'div' );
document.body.appendChild( container );

initScene();
animate();
setupVR();

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
    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight);
    camera.position.set( -8.5, 5 , 20);
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
	
	//Lattice.position.set(-BallDistance/2, -BallDistance/2, -BallDistance/2);
	
	// Creation of Lattice "Metadata"
	Lattice.name = "Lattice"; // per intersect nel raycaster!

	fundGlow();
	SoundVisualPatching();
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

	mixer = new THREE.AnimationMixer( ball[0][0][0] );
	mixer1 = new THREE.AnimationMixer( ball[0][0][1] );
	mixer2 = new THREE.AnimationMixer( ball[0][1][0] );
	mixer3 = new THREE.AnimationMixer( ball[1][0][0] );
	mixer4 = new THREE.AnimationMixer( ball[1][0][1] );
	mixer5 = new THREE.AnimationMixer( ball[1][1][0] );
	mixer6 = new THREE.AnimationMixer( ball[1][1][1] );
	mixer7 = new THREE.AnimationMixer( ball[0][1][1] );


	//mixLattice = new THREE.AnimationMixer( Lattice );

	//const clipActionOpacity = mixer.clipAction( clipOpacity );
	//clipActionOpacity.play();

	const clipAction = mixer.clipAction( clip );
	clipAction.play();


	const clipAction1 = mixer1.clipAction( clip );
	clipAction1.play();

	const clipAction2 = mixer2.clipAction( clip );
	clipAction2.play();

	const clipAction3 = mixer3.clipAction( clip );
	clipAction3.play();

	const clipAction4 = mixer4.clipAction( clip );
	clipAction4.play();

	const clipAction5 = mixer5.clipAction( clip );
	clipAction5.play();

	const clipAction6 = mixer6.clipAction( clip );
	clipAction6.play();

	const clipAction7 = mixer7.clipAction( clip );
	clipAction7.play();

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
				spherePosition = [i*BallDistance-BallDistance/2-radius/2, j*BallDistance-BallDistance/2-radius/2, k*BallDistance-BallDistance/2-radius/2];
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

function defSoundMatrices(){
	for (var i = 0; i < SpheresPerEdge; i++) {
		intonation[i]= new Array(SpheresPerEdge);
		gainNode[i] = new Array(SpheresPerEdge);
		oscillator[i] = new Array(SpheresPerEdge);
		panner[i] = new Array(SpheresPerEdge);
		sound[i] = new Array(SpheresPerEdge);
	}

	for (var i = 0; i < SpheresPerEdge; i++) {
		for (var j = 0; j < SpheresPerEdge; j++) {
			intonation[i][j]= new Array(SpheresPerEdge);
			gainNode[i][j] = new Array(SpheresPerEdge);
			oscillator[i][j] = new Array(SpheresPerEdge);
			panner[i][j] = new Array(SpheresPerEdge);
			sound[i][j] = new Array(SpheresPerEdge);
		}
	}
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

function initSoundLattice(){
	defSoundMatrices();
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
				sound[i][j][k].setNodeSource(oscillator[i][j][k]);
				sound[i][j][k].gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime);			
				sound[i][j][k].setRefDistance( 60 );
				sound[i][j][k].panner.distanceModel = "exponential";
				sound[i][j][k].panner.rolloffFactor = 30;

				//panner[i][j][k] = sound[i][j][k].getOutput();
				//panner[i][j][k].distanceModel = "inverse";
				//panner[i][j][k].rolloffFactor = 10;
						           
			}
		}
		
        
	}

}

function Routine(){
/*
    let modulator = audioCtx.createOscillator();
    
    let indexNode = createGain();

    modulator.frequency.setValueAtTime(10, audioCtx.currentTime);

    modulator.connect(indexNode);

    let  = 5;

    indexNode.gain.setValueAtTime(index, audioCtx.currentTime);

    oscillator[0][0][0].frequency.setValueAtTime(intonation[0][0][0] + modulator, audioCtx.currentTime);
*/


    let f_c = intonation[0][0][0];
    let CarrierFrequency = new ConstantSourceNode(audioCtx, {offset: f_c});
    let modOsc = audioCtx.createOscillator();
    let modNode = audioCtx.createGain();

    modOsc.start(audioCtx.currentTime);
    CarrierFrequency.start(audioCtx.currentTime);
    //oscillator[0][0][0].start(audioCtx.currentTime);

    modNode.gain.setValueAtTime(100, audioCtx.currentTime )
    console.log(modNode.gain)

    modOsc.frequency.setValueAtTime(5000, audioCtx.currentTime );

    modNode.connect(oscillator[0][0][0].frequency);
    CarrierFrequency.connect(oscillator[0][0][0].frequency);

    modOsc.connect(modNode);
    


    
    setTimeout(() => {
		for(var i = 0; i< SpheresPerEdge; i++){
			for(var j = 0; j< SpheresPerEdge; j++){
				for(var k = 0; k< SpheresPerEdge; k++){
					oscillator[i][j][k].start(audioCtx.currentTime);}}}
	}, 100);




    /*
    let modulator = audioCtx.createOscillator();
    let index = 5, f_m = 10;
    modulator.frequency.setValueAtTime(f_m, audioCtx.currentTime );
    let modNode = createGain();
    modulator.connect(modNode);
    modNode.gain.setValueAtTime(index, audioCtx.currentTime);
    console.log("sono f_c " + f_c);

*/

/*
	let lfo = audioCtx.createOscillator();
	oscillator[0][0][0].type = 'sine';
	  
	lfo.type = 'sine';
	lfo.frequency.setValueAtTime(0.05, audioCtx.currentTime);

	lfo.connect(sound[0][0][0].gain.gain);

	//sound[0][0][0].connect(lfo);

	console.log(sound[0][0][0]);

	//toglie il glitch all'avvio. ok anche con 0 ms.
	
	setTimeout(() => {
		for(var i = 0; i< SpheresPerEdge; i++){
			for(var j = 0; j< SpheresPerEdge; j++){
				for(var k = 0; k< SpheresPerEdge; k++){
					oscillator[i][j][k].start(audioCtx.currentTime);}}}
	}, 100);
	
	lfo.start(audioCtx.currentTime);

	//lfo.start(audioCtx.currentTime);
	//oscillator[0][0][0].start(audioCtx.currentTime);

	sound[0][0][0].gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime);

    */

	//sound[0][0][0].gain.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime);
	//lfo.gain.exponentialRampToValueAtTime(1.0, audioCtx.currentTime+15);

	/*
	let envLoop;
	envLoop = setInterval(
	myArpeggiator, audioCtx.currentTime+32000);
	*/

	//let ms = 1000*60/bpm;

	function myArpeggiator() {
		sound[0][0][0].gain.gain.exponentialRampToValueAtTime(1.0, audioCtx.currentTime+15);
		//sound[0][0][0].gain.gain.setValueAtTime(0.0,audioCtx.currentTime +2);
		sound[0][0][0].gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime+15);
	}
		
	//sound[0][0][0].setVolume(1.0);

	//sound[0][0][0].gain.gain.setTargetAtTime(0.0, audioCtx.currentTime, 5);

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

	if ( mixer ) {
		mixer.update( delta );
	}

	if ( mixer1 ) {
		mixer1.update( delta );
	}

	if ( mixer2 ) {
		mixer2.update( delta );
	}

	if ( mixer3 ) {
		mixer3.update( delta );
	}

	if ( mixer4 ) {
		mixer4.update( delta );
	}

	if ( mixer5 ) {
		mixer5.update( delta );
	}

	if ( mixer6 ) {
		mixer6.update( delta );
	}

	if ( mixer7 ) {
		mixer7.update( delta );
	}


	Lattice.rotation.y += 0.0005;
    Lattice.rotation.x += 0.0005;
    Lattice.rotation.z += 0.0005;
 
	renderer.render(scene, camera );
}