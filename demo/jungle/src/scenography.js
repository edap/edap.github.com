import { map } from './helpers.js';
import { BoxGeometry, Mesh, MeshBasicMaterial, VertexColors, NoColors } from 'three';

const DURATION = 10;
const DURATION_MOVE_UP_PERCENT = 0.5;

export default class Scenography {
	constructor(camera, spline, t, cameraHeight, cameraSpeed, materialTrunk, materialFoliage, fadeCallback){
		this.dimLight = false;
		this.debug = false;
		(this.vertexColorsT = NoColors), (this.vertexColorsF = NoColors), (this.colorT = 0xd94e31);
		this.emissiveT = 0x2d1200;
		this.roughnessT = 0.55;
		this.metalnessT = 0.89;
		this.colorF = 0xd94e31;
		this.emissiveF = 0x2d1200;
		this.roughnessF = 0.55;
		this.metalnessF = 0.89;
		this.kopfhoch = 0;
		this.cameraHighest = 120;
		this.cameraLowest = 27;
		this.materialTrunk = materialTrunk;
		this.materialFoliage = materialFoliage;
		this.current_index_scene = null;
		this.spline = spline;
		this.camera = camera;
		this.t = t;
		this.cameraHeight = cameraHeight;
		this.cameraSpeed = cameraSpeed;
		this.scenes = this._populateScenes();
		this.fadeCallback = fadeCallback;

		if (this.debug){
			const geom = new BoxGeometry(5, 5, 5);
			const mat = new MeshBasicMaterial();
			const fakeCamera = new Mesh(geom, mat);
			this.camera = fakeCamera;
		} else {
			this.camera = camera;
		}
	}

	lightShouldDim(){
		return this.dimLight;
	}

	update(speed, sceneId, elapsedSeconds){
		this.cameraSpeed = speed;
		const current_schedule = sceneId;
		if (elapsedSeconds > DURATION){
			this.fadeCallback();
			//return true;
			// should we stop the camera? the camera move unless we are voer the duration
		}
		if (current_schedule !== this.current_index_scene){
			this.current_index_scene = current_schedule;
			this._implementScene(current_schedule);
		}
		this._moveCamera(elapsedSeconds);
	}

	_moveCamera(elapsedSeconds){
		const camPos = this.spline.getPoint(this.t);
		// the lookAt position is just 20 points ahead the current position
		// but when we are close to the end of the path, the look at point
		// is the first point in the curve
		const next = this.t + this.cameraSpeed * 20;
		const lookAtPoint = next > 1 ? 0 : next;
		const look = this.spline.getPoint(lookAtPoint);

		// this is the place where the camera down
		this._moveDownAndLookUp(camPos, look, elapsedSeconds);
		const limit = 1 - this.cameraSpeed;
		this.t = this.t >= limit ? 0 : (this.t += this.cameraSpeed);
	}

	_moveDownAndLookUp(camPos, look, elapsedSeconds){
		const cameraY = this._getCameraY(elapsedSeconds, this.cameraHeight);
		//move camera forward
		this.camera.position.set(camPos.x, cameraY, camPos.z);
		// adjust lookup
		look.y = this.cameraHeight + this.kopfhoch;
		this.camera.lookAt(look);
		//console.log(this.cameraHeight);
	}

	_getCameraY(elapsedSeconds, cameraHeight){
		const timing = this._getTimingLookUp();
		let cameraY;
		if (elapsedSeconds > timing.end){
			cameraY = 0;
		} else if (elapsedSeconds < timing.start){
			cameraY = cameraHeight;
		} else {
			cameraY = map(elapsedSeconds, timing.start, timing.end, cameraHeight, 0);
		}
		return cameraY;
	}
	_getTimingLookUp(){
		const half = DURATION / 2.0;
		const durationLookUp = DURATION * DURATION_MOVE_UP_PERCENT;
		return {
			start: half - durationLookUp / 2.0,
			end: half + durationLookUp / 2.0
		};
	}

	_implementScene(scene_id){
		const scene = this.scenes[scene_id];
		if (scene.hasOwnProperty('dimLight')){
			this.dimLight = scene.dimLight;
		}

		if (scene.hasOwnProperty('kopfhoch')){
			if (scene.kopfhoch){
				this.kopfhoch = 6.0;
			} else {
				this.kopfhoch = 0.0;
			}
		}

		if (scene.hasOwnProperty('colorT')){
			this.materialTrunk.color.setHex(scene.colorT);
			this.materialTrunk.needsUpdate = true;
		}

		if (scene.hasOwnProperty('emissiveT')){
			this.materialTrunk.emissive.setHex(scene.emissiveT);
			this.materialTrunk.needsUpdate = true;
		}

		if (scene.hasOwnProperty('vertexColorsT')){
			if (scene.vertexColorsT){
				this.materialTrunk.vertexColors = VertexColors;
			} else {
				this.materialTrunk.vertexColors = NoColors;
			}
			this.materialTrunk.needsUpdate = true;
		}

		if (scene.hasOwnProperty('vertexColorsF')){
			if (scene.vertexColorsF){
				this.materialFoliage.vertexColors = VertexColors;
			} else {
				this.materialFoliage.vertexColors = NoColors;
			}
			this.materialFoliage.needsUpdate = true;
		}

		if (scene.hasOwnProperty('colorF')){
			this.materialFoliage.color.setHex(scene.colorF);
			this.materialFoliage.needsUpdate = true;
		}

		if (scene.hasOwnProperty('emissiveF')){
			this.materialFoliage.emissive.setHex(scene.emissiveF);
			this.materialFoliage.needsUpdate = true;
		}

		if (scene.hasOwnProperty('cameraHeight')){
			this.cameraHeight = scene.cameraHeight;
		}

		if (scene.hasOwnProperty('cameraSpeed') === true){
			// TODO, re-enable if you want to control the speed through the scenographer
			//this.cameraSpeed = scene.cameraSpeed;
		}
	}

	getCameraPositionOnSpline(){
		// it returns a value between 0 and 1. O when at the beginning
		// of the spline, 1 when at the end
		return this.t;
	}

	_populateScenes(){
		const lookUp = {
			dimLight: true,
			kopfhoch: true,
			colorT: '0xff00a5',
			emissiveT: '0x0f4129',
			colorF: '0x0077ff',
			emissiveF: '0xe84444',
			cameraHeight: this.cameraLowest
		};

		//fly into leaves
		const end = {
			dimLight: false,
			kopfhoch: false,
			colorF: '0xf5a615',
			emissiveF: '0x005004',
			colorT: '0xf5a615',
			emissiveT: '0x005004',
			cameraHeight: this.cameraHighest
		};

		//vertex displacement, slowly back to BN
		//'0xffd100', '0x001c78'
		// 0xffc741, 0x000000
		const last = {
			vertexColorsT: true,
			dimLight: true,
			emissiveF: '0x370013',
			colorF: '0xf1db174',
			colorT: '0x00ffe1',
			emissiveT: '0x00192a',
			cameraHeight: this.cameraLowest
		};

		return [lookUp, end, last];
	}
}
