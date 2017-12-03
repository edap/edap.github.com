import DAT from 'dat-gui';
import { Color, Fog, VertexColors, NoColors } from 'three';

export default class Gui extends DAT.GUI {
	constructor(material, trunkMaterial){
		super({
			load: JSON,
			preset: 'Flow'
		});

		this.material = material;
		this.trunkMaterial = trunkMaterial;
		this.params = {
			sceneId: 1,
			cameraHeight: 80,
			cameraSpeed: 0.0001,
			lightIntensity: 1,
			amplitude: 3.5,
			minColor: 0.2,
			maxColor: 0.4,
			saturation: 0.2,
			brightness: 0.0,
			color: 0xefff00,
			emissive: 0x4ca078,
			roughness: 0.55,
			metalness: 0.89,
			vertex_colors: true,
			backgroundColor: '#505050',
			ambientLight: '#34ac0f',

			colorT: 0xefff00,
			emissiveT: 0x4ca078,
			roughnessT: 0.55,
			metalnessT: 0.89,
			vertex_colorsT: true,
			backgroundColorT: '#505050',
			ambientLightT: '#34ac0f'
		};

		//this.add(this.params, 'cameraHeight', 20, 190).step(1);
		//this.add(this.params, 'lightIntensity', 1, 30)
		//	.step(1)
		//	.onChange(this._onLightIntChange());
		this.add(this.params, 'cameraSpeed', 0.0001, 0.0009).step(0.0001);
		this.add(this.params, 'sceneId', [0, 1, 2]);

		const mat = this.addFolder('Foliage Material');
		mat.closed = true;
		mat.add(this.params, 'vertex_colors').onChange(this._handleVertexColorChange(this.material));
		mat.addColor(this.params, 'color').onChange(this._handleColorChange(this.material.color));
		mat.addColor(this.params, 'emissive').onChange(this._handleColorChange(this.material.emissive));
		mat.add(this.params, 'metalness', 0.0, 1.0).onChange(val => {
			this.material.metalness = val;
		});
		mat.add(this.params, 'roughness', 0.0, 1.0).onChange(val => {
			this.material.roughness = val;
		});

		const tmat = this.addFolder('Trunk Material');
		tmat.closed = true;
		tmat.add(this.params, 'vertex_colorsT').onChange(this._handleVertexColorChange(this.trunkMaterial));
		tmat.addColor(this.params, 'colorT').onChange(this._handleColorChange(this.trunkMaterial.color));
		tmat.addColor(this.params, 'emissiveT').onChange(this._handleColorChange(this.trunkMaterial.emissive));
		tmat.add(this.params, 'metalnessT', 0.0, 1.0).onChange(val => {
			this.trunkMaterial.metalness = val;
		});
		tmat.add(this.params, 'roughnessT', 0.0, 1.0).onChange(val => {
			this.trunkMaterial.roughness = val;
		});
	}

	toggleHide(){
		DAT.GUI.toggleHide();
	}

	addMaterial(material){
		this.material = material;
	}

	// credtis to these methods goes to Greg Tatum https://threejs.org/docs/scenes/js/material.js
	addScene(scene, ambientLight, renderer){
		const folder = this.addFolder('Scene');
		const data = {
			'ambient light': ambientLight.color.getHex()
			//'ground Color': ambientLight.groundColor.getHex()
		};

		folder.addColor(data, 'ambient light').onChange(this._handleColorChange(ambientLight.color));
		//folder.addColor(data, 'ground Color').onChange(this._handleColorChange(ambientLight.groundColor));
		this.guiSceneFog(folder, scene);
	}

	guiSceneFog(folder, scene){
		const fogFolder = folder.addFolder('scene.fog');
		const fog = scene.fog;
		const data = {
			fog: {
				'scene.fog.color': fog.color.getHex()
			}
		};
		fogFolder.addColor(data.fog, 'scene.fog.color').onChange(this._handleColorChange(fog.color));
	}

	_handleColorChange(color){
		return function(value){
			if (typeof value === 'string'){
				value = value.replace('#', '0x');
			}
			color.setHex(value);
		};
	}

	_handleVertexColorChange(material){
		return value => {
			if (value === true){
				material.vertexColors = VertexColors;
			} else {
				material.vertexColors = NoColors;
			}
			material.needsUpdate = true;
		};
	}

	_onLightIntChange(){
		return function(value){
			this.ambientLight.intensity = value;
		};
	}
}
