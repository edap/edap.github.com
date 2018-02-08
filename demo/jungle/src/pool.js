import { BoxBufferGeometry, Mesh, Vector3 } from 'three';
import { getRandom, getRandomInt } from './helpers.js';
import Palms from './palms.js';
import { PALM_INITIAL_Y_POSITION, N_LOW_PALMS } from './const';

export default class Pool {
	constructor(size, scene, curve, percent_covered, distance_from_path, materials){
		this.scene = scene;
		this.size = size;
		this.curve = curve;
		this.container = [];
		this.index_positions = []; // keep track of the id of the object and its position on the curve
		this.percent_covered = percent_covered;
		this.distance_from_path = distance_from_path;
		this.step = this.percent_covered / this.size;
		this.materials = materials;
		this.palmTypes = new Palms(); //this return some different palms, one for each type
		this.populatePool();
	}

	populatePool(){
		let tot_lenght_steps = 0;
		let flip_direction = true;
		for (let i = 0; i < this.size; i++){
			tot_lenght_steps += this.step;
			this.index_positions.push(tot_lenght_steps);

			const obj = this.createObject(i);
			obj.name = i;
			obj.position_on_curve = tot_lenght_steps;
			const point = this.curve.getPoint(tot_lenght_steps);
			const tangentVector = this.curve.getTangent(tot_lenght_steps).multiplyScalar(this.distance_from_path, 0, this.distance_from_path);
			const axis = new Vector3(0, 1, 0);
			const angle = Math.PI / 2;
			// there is no function to get the secant. I take the tangen and i rotate it
			const secantVector = tangentVector;
			secantVector.applyAxisAngle(axis, angle);
			const position_offset = Math.sin(i) * 6;
			secantVector.x += position_offset;
			let new_pos;
			if (flip_direction){
				new_pos = point.add(secantVector);
			} else {
				new_pos = point.sub(secantVector);
			}
			let palmY;
			// the animation start with the camera inside the leaves
			// to make it easier, I simply set the position of the first n palm down in
			// the ground

			palmY = PALM_INITIAL_Y_POSITION;
			

			obj.position.set(new_pos.x, palmY, new_pos.z);
			this.container.push(obj);
			this.scene.add(obj);
			flip_direction = !flip_direction;
		}
	}

	_pointsOnTheCurveWithObjects(){
		const validPoints = Math.abs(this.curve.points * this.percent_covered);
	}

	createObject(i){
		const randomIndex = getRandomInt(0, 6);
		//let randomIndex = 5;
		let palm;
		let index;
		if (i < N_LOW_PALMS){
			palm = this.palmTypes[0];
		} else {
			index = i % this.palmTypes.length;
			// the model with index 0 has nice leaves that looks like a bush
			palm = this.palmTypes[index];
		}

		//use this to have high trees of the same color
		//const matIndex = i % (this.materials.length / 2);
		//const matIndex = getRandomInt(1, 3);
		const matIndex = 0;
		let mesh;
		if(palm.attributes.isLeaf !== undefined){
			mesh = new Mesh(palm, [this.materials[1], this.materials[0]]);
		}else{
			mesh = new Mesh(palm, this.materials[1]);
		}
		
		mesh.rotateY(Math.PI / getRandom(-3, 3));

		return mesh;
	}

	update(camera_position_on_spline){
		//if camera position on spline is bigger than a palm
		//it means that this palm is no longer into the scene, put it back
		let flip_direction = true;
		for (let i = 0; i <= this.index_positions.length; i++){
			const object_position = this.index_positions[i];
			let horizon = camera_position_on_spline + this.percent_covered;
			flip_direction = !flip_direction;
			const delay = 0.05; // otherwise object will disapear instanaely, and
			//in case of trees with leaves does not look nice.
			if (object_position + delay < camera_position_on_spline){
				// this condition handles the case when you are at postion 9.5 in the curve
				//and you have still to be able to see the palms in position 0.1
				if (horizon >= 1.0){
					horizon -= 1.0;
					if (object_position + delay > horizon){
						this.putObjectForwardTheCamera(camera_position_on_spline, i, flip_direction);
					}
				} else {
					this.putObjectForwardTheCamera(camera_position_on_spline, i, flip_direction);
				}
			}
		}
	}

	clear(){
		this.container.forEach((mesh) => {
			this.scene.remove(mesh);
		});
		// Do not remove from the mesh from the scene and dispose the geometry in the same loop
		this.container.forEach((mesh) => {
			mesh.geometry.dispose();
			if(Array.isArray(mesh.material)){
				let size = mesh.material.length;
				for(let i = 0; i++; i< size){
					mesh.material[i].dispose()
				}
			}else{
				mesh.material.dispose();
			}
		});
	}

	putObjectForwardTheCamera(camera_position_on_spline, object_index, flip_direction){
		const object = this.container[object_index];
		const new_position_on_curve = this.index_positions[object_index] + this.percent_covered;
		let adjusted_position;
		if (new_position_on_curve >= 1.0){
			adjusted_position = new_position_on_curve - 1.0;
		} else {
			adjusted_position = new_position_on_curve;
		}
		this.index_positions[object_index] = adjusted_position;

		const point = this.curve.getPoint(adjusted_position);
		const tangentVector = this.curve.getTangent(adjusted_position).multiplyScalar(this.distance_from_path, 0, this.distance_from_path);
		const axis = new Vector3(0, 1, 0);
		const angle = Math.PI / 2;
		// there is no function to get the secant. I take the tangen and i rotate it
		const secantVector = tangentVector;
		secantVector.applyAxisAngle(axis, angle);
		const position_offset = Math.sin(object_index) * 6;
		secantVector.x += position_offset;
		let new_pos;

		if (flip_direction){
			new_pos = point.add(secantVector);
		} else {
			new_pos = point.sub(secantVector);
		}
		object.position.set(new_pos.x, PALM_INITIAL_Y_POSITION, new_pos.z);
	}
}
