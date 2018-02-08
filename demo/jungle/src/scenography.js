import { map } from './helpers.js';
import { BoxGeometry, Mesh, VertexColors, NoColors } from 'three';
import {
	CAMERA_LOOK_FORWARD,
	CAMERA_HEIGHT,
	DEFAULT_SPEED
} from './const';

export default class Scenography {
	constructor(camera, spline, t, gui){
		this.spline = spline;
		this.camera = camera;
		this.t = t;
		this.cameraSpeed = (gui !== undefined) ? gui.params.cameraSpeed : DEFAULT_SPEED;
		this.camera = camera;
	}

	update(gui){
		let speed, stop;
		if(gui){
			speed = gui.params.cameraSpeed;
			stop = gui.params.stop;
		} else {
			speed = DEFAULT_SPEED;
			stop = false;
		}

		this.cameraSpeed = speed;
		if (stop){
			return;
		}

		this._moveCamera();
	}

	_moveCamera(){
		const camPos = this.spline.getPoint(this.t);
		// the lookAt position is just 20 points ahead the current position
		// but when we are close to the end of the path, the look at point
		// is the first point in the curve
		const next = this.t + this.cameraSpeed + CAMERA_LOOK_FORWARD;
		const lookAtPoint = next > 1 ? 0 : next;
		//console.log(lookAtPoint);
		const look = this.spline.getPoint(lookAtPoint);
		look.y = 30;

		// this is the place where the camera look up at a certain moment
		this._setLookUp(camPos, look);
		const limit = 1 - this.cameraSpeed;
		this.t = this.t >= limit ? 0 : (this.t += this.cameraSpeed);
	}

	_setLookUp(camPos, look){
		const cameraY = CAMERA_HEIGHT;
		//move camera forward
		this.camera.position.set(camPos.x, cameraY, camPos.z);
		//look.y = this._getCameraLooKY(elapsedSeconds);
		this.camera.lookAt(look);
	}

	getCameraPositionOnSpline(){
		// it returns a value between 0 and 1. O when at the beginning
		// of the spline, 1 when at the end
		return this.t;
	}
}
