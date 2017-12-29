import { BoxBufferGeometry, Mesh, Vector3,InstancedBufferGeometry, InstancedBufferAttribute,ShaderMaterial } from 'three';
import { getRandom, getRandomInt } from './helpers.js';
import Palms from './palms.js';
import {vertexShader, fragmentShader} from './shaders';
import { PALM_LOWEST_POSITION, PALM_HIGHEST_POSITION, N_LOW_PALMS } from './const';

export default class Pool {
	constructor(size, scene, curve, percent_covered, distance_from_path, materials){
		this.scene = scene;
		this.size = size;
		this.curve = curve;
		this.index_positions = []; // keep track of the id of the object and its position on the curve
		this.percent_covered = percent_covered;
		this.distance_from_path = distance_from_path;
		this.step = this.percent_covered / this.size;
		this.materials = materials;
		this.palmTypes = new Palms(); //this return some different palms, one for each type
		this.populatePool();
	}

	populatePool(){
		// get the buffer geometry from the Palms
		let palmTypeIndex = 0;
		let tot_lenght_steps = 0;
		let flip_direction = true;

		let instancePositions = [];
		let instanceQuaternions = [];
		let instanceScales = [];

		for (let i = 0; i < this.size; i++){
			tot_lenght_steps += this.step;
			this.index_positions.push(tot_lenght_steps);

			const obj = this.createObject(palmTypeIndex);
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
			if (i < N_LOW_PALMS){
				palmY = PALM_LOWEST_POSITION;
			} else {
				palmY = PALM_HIGHEST_POSITION;
			}

			obj.position.set(new_pos.x, palmY, new_pos.z);
			
			let position = obj.position;
			let quaternion = obj.quaternion;
			let scale = obj.scale;

			// fullfill the array containing the data that will be used
			// to create the transformation that will be applied to each instance in the vertex shader
			instancePositions.push( position.x, position.y, position.z );
			instanceQuaternions.push( quaternion.x, quaternion.y, quaternion.z, quaternion.w );
			instanceScales.push( scale.x, scale.y, scale.z );

			flip_direction = !flip_direction;

		}
		let instGeometry = this.getInstanceGeomFromPalm(this.palmTypes[palmTypeIndex]);
		instGeometry.addAttribute( 'instancePosition', new InstancedBufferAttribute( new Float32Array( instancePositions ), 3 ) );
		instGeometry.addAttribute( 'instanceQuaternion', new InstancedBufferAttribute( new Float32Array( instanceQuaternions ), 4 ) );
		instGeometry.addAttribute( 'instanceScale', new InstancedBufferAttribute( new Float32Array( instanceScales ), 3 ) );

		var shaderMaterial = new ShaderMaterial( {
			uniforms: {},
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
			vertexColors: true
		} );
		// counterparts are drawn all at once with a single draw call (via instanced rendering)
		var instancedMesh = new Mesh( instGeometry, shaderMaterial );
		instancedMesh.position.x = 0.1;
		this.scene.add( instancedMesh );
	}

	getInstanceGeomFromPalm(palmBuffGeom){
		let instGeom = new InstancedBufferGeometry();
		instGeom.attributes.position = palmBuffGeom.attributes.position;
		instGeom.attributes.color = palmBuffGeom.attributes.color;
		return instGeom;
	}

	createObject(palmIndex){
		let palm = this.palmTypes[palmIndex];
		const mesh = new Mesh(palm, [this.materials[1], this.materials[0]]);
		mesh.rotateY(Math.PI / getRandom(-3, 3));
		return mesh;
	}
}
