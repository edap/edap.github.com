import PalmGenerator from './PalmGenerator.js';
import { BoxGeometry, BufferAttribute, BufferGeometry, Vector3, CatmullRomCurve3 } from 'three';
import LeafGeometry from './LeafGeometry.js';

export default class Palms {
	constructor(){
		const trunkGeometry = new BoxGeometry(5, 5, 5);
		const leafGeometry = new LeafGeometry(this.leafOptions());
		const curve = this.getCurve();
		const palm = new PalmGenerator(leafGeometry, trunkGeometry, this.palmOptions(), curve);

		const geometry = palm.geometry;
		const bufGeometry = new BufferGeometry().fromGeometry(geometry);
		bufGeometry.clearGroups();

		return bufGeometry;
	}

	leafOptions(){
		return {
			length: 90,
			length_stem: 2,
			width_stem: 0.2,
			leaf_width: 1,
			leaf_up: 6,
			density: 8,
			curvature: 0.01,
			curvature_border: 0.002,
			leaf_inclination: 0.8
		};
	}

	palmOptions(){
		return {
			spread: 0.03,
			angle: 137.66,
			num: 140,
			growth: 0.25,
			foliage_start_at: 42,
			trunk_regular: true,
			buffers: false,
			angle_open: 16.87,
			starting_angle_open: 51.65
		};
	}

	getCurve(){
		return new CatmullRomCurve3([
			new Vector3(-15, 120, -11),
			new Vector3(-8, 90, -9),
			new Vector3(0, 50, -5),
			new Vector3(0, 0, 0)
		]);
	}
}
