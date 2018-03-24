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

	update(gui, mouseY){
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

		this._moveCamera(mouseY);
	}

	_moveCamera(mouseY){
		let resetValue = this.cameraSpeed; // once the circuit is finished, the camera 
		// is moved back to the original point

		// the lookAt position is just CAMERA_LOOK_FORWARD points ahead the current position
		const next = this.t + CAMERA_LOOK_FORWARD;
		let look;
		let camPos;

		// lookAt position
		if (next >= 1.0) {
			let diff = 1.0 - this.t;
			look = this.spline.getPoint(CAMERA_LOOK_FORWARD-diff);
		} else {
			look = this.spline.getPoint(next);
		}
		
		// camera position
		if (this.t >= 1.0) {
			this.t = resetValue;
		} else {
			this.t += this.cameraSpeed
		}
		camPos = this.spline.getPoint(this.t);

		this._setLookUp(camPos, look, mouseY);
	}

	_setLookUp(camPos, look, mouseY){
		const cameraY = CAMERA_HEIGHT;
		this.camera.position.set(camPos.x, cameraY, camPos.z);
		// the camera always look a bit depending on mouse y position
		look.y = this._calcHeight(mouseY);
		this.camera.lookAt(look);
	}

	_calcHeight(mouseY){
		if (mouseY === undefined) {
			return 26;
		}else{
			return map(mouseY, 0, 1, 30, 22);
		}
	}

	getCameraPositionOnSpline(){
		// it returns a value between 0 and 1. O when at the beginning
		// of the spline, 1 when at the end
		return this.t;
	}
}
