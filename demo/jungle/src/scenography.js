import { map } from './helpers.js';
import { BoxGeometry, Mesh, VertexColors, NoColors } from 'three';
import {
	DURATION,
	DURATION_MOVE_UP_PERCENT,
	CAMERA_LOOK_FORWARD,
	CAMERA_HIGHEST_POSITION_LOOKAT,
	CAMERA_LOWEST_POSITION_LOOKAT,
	CAMERA_HEIGHT
} from './const';

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
		const next = this.t + this.cameraSpeed + CAMERA_LOOK_FORWARD;
		const lookAtPoint = next > 1 ? 0 : next;
		//console.log(lookAtPoint);
		const look = this.spline.getPoint(lookAtPoint);

		// this is the place where the camera look up at a certain moment
		this._setLookUp(camPos, look, elapsedSeconds);
		const limit = 1 - this.cameraSpeed;
		this.t = this.t >= limit ? 0 : (this.t += this.cameraSpeed);
	}

	_setLookUp(camPos, look, elapsedSeconds){
		const cameraY = CAMERA_HEIGHT;
		//move camera forward
		this.camera.position.set(camPos.x, cameraY, camPos.z);
		look.y = this._getCameraLooKY(elapsedSeconds);
		this.camera.lookAt(look);
	}

	_getCameraLooKY(elapsedSeconds){
		const timing = this._getTimingLookUp();
		let cameraYLookAt;
		if (elapsedSeconds > timing.end){
			cameraYLookAt = CAMERA_HIGHEST_POSITION_LOOKAT;
		} else if (elapsedSeconds < timing.start){
			cameraYLookAt = CAMERA_LOWEST_POSITION_LOOKAT;
		} else {
			cameraYLookAt = map(elapsedSeconds, timing.start, timing.end, CAMERA_LOWEST_POSITION_LOOKAT, CAMERA_HIGHEST_POSITION_LOOKAT);
		}
		return cameraYLookAt;
	}

	_getTimingLookUp(){
		//const half = DURATION / 2.0;
		const half = DURATION/4.50;
		// start the camera movement at one third of the animation
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
