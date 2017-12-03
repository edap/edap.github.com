import { map } from './helpers.js';
import { BoxGeometry, Mesh, VertexColors, NoColors } from 'three';

const DURATION = 15;
const DURATION_MOVE_UP_PERCENT = 0.5;
const CAMERA_LOWEST_POSITION = 0;
const CAMERA_HIGHEST_POSITION = 120;
const CAMERA_LOOK_FORWARD = 5;

export default class Scenography {
	constructor(camera, spline, t, cameraSpeed, fadeCallback){
		this.spline = spline;
		this.camera = camera;
		this.t = t;
		this.cameraSpeed = cameraSpeed;
		this.fadeCallback = fadeCallback;
		this.camera = camera;
	}

	update(speed, stop, elapsedSeconds){
		this.cameraSpeed = speed;
		if (stop){
			return;
		}
		if (elapsedSeconds > DURATION){
			this.fadeCallback();
			//return true;
			// should we stop the camera? the camera move unless we are voer the duration
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
		const cameraY = this._getCameraY(elapsedSeconds);
		//move camera forward
		this.camera.position.set(camPos.x, cameraY, camPos.z);
		// adjust lookup
		look.y = CAMERA_HIGHEST_POSITION;
		look.z += CAMERA_LOOK_FORWARD;
		this.camera.lookAt(look);
	}

	_getCameraY(elapsedSeconds){
		const timing = this._getTimingLookUp();
		let cameraY;
		if (elapsedSeconds > timing.end){
			cameraY = 0;
		} else if (elapsedSeconds < timing.start){
			cameraY = CAMERA_HIGHEST_POSITION;
		} else {
			cameraY = map(elapsedSeconds, timing.start, timing.end, CAMERA_HIGHEST_POSITION, CAMERA_LOWEST_POSITION);
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

	getCameraPositionOnSpline(){
		// it returns a value between 0 and 1. O when at the beginning
		// of the spline, 1 when at the end
		return this.t;
	}
}
