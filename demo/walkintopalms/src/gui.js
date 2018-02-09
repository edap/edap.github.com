import DAT from 'dat-gui';
import {Color, Fog} from 'three';

export default class Gui extends DAT.GUI{
    constructor(material){
        super(
            {
                load: JSON,
                preset: 'Flow'
            }
        );
        this.params = {
            freq: 0.0005,
            pathAmplitude: 0.2,
            scattering: 11,
            cameraHeight:80,
            cameraSpeed: 0.0008,
            amplitude: 3.5,
            minColor:0.2,
            maxColor:0.4,
            saturation: 0.2,
            brightness: 0.0,
            displacement:0.9,
            selectedBin:0
        };
        this.material = material;

        this.add(this.params, 'freq',  0.000001,0.001).step(0.000005);
        this.add(this.params, 'pathAmplitude',  0.1,9).step(0.2);
        this.add(this.params, 'scattering',  3,300).step(1);
        this.add(this.params, 'cameraHeight', 20, 190).step(1);
        this.add(this.params, 'cameraSpeed', 0.0001, 0.0012).step(0.0001);
        this.add(this.params, 'amplitude', 0.0, 15.0).step(0.1).onChange(this._onAmplitudeUpdate(this.material));
        this.add(this.params, 'selectedBin', 0, 32).step(1);
        this.add(this.params, 'minColor', 0.00, 1.0).step(0.01).onChange(this._onMinColorUpdate(this.material));
        this.add(this.params, 'maxColor', 0.00, 1.0).step(0.01).onChange(this._onMaxColorUpdate(this.material));
        this.add(this.params, 'saturation', 0.01, 1.0).step(0.01).onChange(this._onSaturationUpdate(this.material));
        this.add(this.params, 'brightness', 0.01, 1.0).step(0.01).onChange(this._onBrightnessUpdate(this.material));
        this.add(this.params, 'displacement', 0.0, 10.0).step(0.01).onChange(this._onDisplacementUpdate(this.material));;

    }

    toggleHide(){
        DAT.GUI.toggleHide();
    }

    addMaterial(material){
        this.material = material;
    }

    // credtis to these methods goes to Greg Tatum https://threejs.org/docs/scenes/js/material.js
    addScene ( scene, ambientLight, renderer ) {
	      let folder = this.addFolder('Scene');
	      let data = {
		        background : "#000000",
		        "ambient light" : ambientLight.color.getHex()
	      };

	      let color = new Color();
	      let colorConvert = this._handleColorChange( color );

	      folder.addColor( data, "background" ).onChange( function ( value ) {
		        colorConvert( value );
		        renderer.setClearColor( color.getHex() );

	      } );

	      folder.addColor( data, "ambient light" ).onChange( this._handleColorChange( ambientLight.color ) );
	      this.guiSceneFog( folder, scene );
    }

    guiSceneFog ( folder, scene ) {
	      let fogFolder = folder.addFolder('scene.fog');
	      let fog = scene.fog;
	      let data = {
		        fog : {
			          "scene.fog.color" : fog.color.getHex()
		        }
	      };
	      fogFolder.addColor( data.fog, 'scene.fog.color').onChange( this._handleColorChange( fog.color ) );
    }

    _handleColorChange ( color ) {
	      return function ( value ){
		        if (typeof value === "string") {
			          value = value.replace('#', '0x');
		        }
		        color.setHex( value );
        };
    }

    _onMinColorUpdate(material) {
	      return function ( value ){
            material.uniforms.minColor.value = value;
        };
    }

    _onMaxColorUpdate(material) {
	      return function ( value ){
            material.uniforms.maxColor.value = value;
        };
    }

    _onSaturationUpdate(material) {
	      return function ( value ){
            material.uniforms.saturation.value = value;
        };
    }

    _onBrightnessUpdate(material) {
	      return function ( value ){
            material.uniforms.brightness.value = value;
        };
    }

    _onDisplacementUpdate(material) {
	      return function ( value ){
            material.uniforms.displacement.value = value;
        };
    }

    _onAmplitudeUpdate(material) {
	      return function ( value ){
            material.uniforms.amplitude.value = value;
        };
    }

}
