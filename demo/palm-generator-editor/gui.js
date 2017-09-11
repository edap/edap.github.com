import DAT from 'dat-gui';
import {Color, Fog} from 'three';

export default class Gui extends DAT.GUI{
    constructor(material){
        super(
            {
                load: JSON,
                preset: 'Default'
            }
        );
        this.material = material;
        this.params = {
            spread: 0.1,
            angle: 137.5,
            num: 406,
            growth: 0.12,
            foliage_start_at: 40,
            trunk_regular: false,
            angle_open: 36.17438258159361,
            starting_angle_open: 47,
            length: 50,
            length_stem: 20,
            width_stem: 0.2,
            leaf_width: 0.8,
            leaf_up: 1.5,
            density: 11,
            curvature: 0.04,
            curvature_border: 0.005,
            leaf_inclination: 0.9,

            anim_spread: false,
            zoom_x: false,
            zoom_y: false,
            zoom_z: false,
            zoom_amplitude: 20,
            zoom_velocity: 100,
            anim_growth_objects: false,
            zoetrope_rotation: 137.035,
            zoetrope:false,
            zoetrope_angle:139.71,

            color: 0xefff00,
            emissive: 0x4ca078,
            roughness:0.55,
            metalness:0.89,
            backgroundColor:"#505050",
            ambientLight:"#34ac0f"
        };
        this.remember(this.params);

        this.add(this.params, "spread").min(0).max(0.7).step(0.1).listen();
        this.add(this.params, "angle").min(132.0).max(138.0).step(0.01);
        this.add(this.params, "num").min(60).max(1200).step(1).listen();
        this.add(this.params, "growth").min(0.04).max(0.25).step(0.01);
        this.add(this.params, "foliage_start_at").min(10).max(320);
        this.add(this.params, "angle_open").min(0).max(80);
        this.add(this.params, "starting_angle_open").min(50).max(100);
        this.add(this.params, "trunk_regular");

        let leaf = this.addFolder('leaf Geometry');
        leaf.closed=true;
        leaf.add(this.params, "length").min(20).max(90).step(1);
        leaf.add(this.params, "length_stem").min(2).max(40).step(1);
        leaf.add(this.params, "width_stem").min(0.2).max(2.4).step(0.1);
        leaf.add(this.params, "leaf_width").min(0.1).max(1.0).step(0.1);
        leaf.add(this.params, "leaf_up").min(0.1).max(6.0).step(0.1);
        leaf.add(this.params, "density").min(15).max(180).step(1);
        leaf.add(this.params, "curvature").min(0.01).max(0.06).step(0.01);
        leaf.add(this.params, "curvature_border").min(0.001).max(0.01).step(0.001);
        leaf.add(this.params, "leaf_inclination").min(0.1).max(1.0).step(0.1);

        let mat = this.addFolder('Material');
        mat.closed=true;
        mat.addColor(this.params, 'color' ).onChange( this._handleColorChange( this.material.color ) );
        mat.addColor(this.params, 'emissive' ).onChange( this._handleColorChange( this.material.emissive ) );
        mat.add(this.params, 'metalness', 0.0, 1.0).onChange( (val)=>{this.material.metalness = val;});
        mat.add(this.params, 'roughness', 0.0, 1.0).onChange( (val)=>{this.material.roughness = val;});

        let anim = this.addFolder('animation');
        anim.closed=true;
        anim.add(this.params, "anim_spread");
        // anim.add(this.params, "zoom_x");
        // anim.add(this.params, "zoom_y");
        // anim.add(this.params, "zoom_z");
        // anim.add(this.params, "zoom_amplitude").min(2).max(500).step(1);
        // anim.add(this.params, "zoom_velocity").min(40).max(300).step(1);
        anim.add(this.params, "anim_growth_objects");
        anim.add(this.params, "zoetrope");
        anim.add(this.params, "zoetrope_angle").min(130).max(150).step(0.01);
    }

    // credtis to these methods goes to Greg Tatum https://threejs.org/docs/scenes/js/material.js
    addScene ( scene, ambientLight, renderer ) {
          let folder = this.addFolder('Scene');
        folder.closed=true;
          let color = new Color();
          let colorConvert = this._handleColorChange( color );

          folder.addColor( this.params, "backgroundColor" ).onChange( function ( value ) {
                colorConvert( value );
                renderer.setClearColor( color.getHex() );

          } );

          folder.addColor( this.params, "ambientLight" ).onChange( this._handleColorChange( ambientLight.color ) );
          //this.guiSceneFog( folder, scene );
    }

    guiSceneFog ( folder, scene ) {
          let fogFolder = folder.addFolder('scene.fog');
          let fog = new Fog( 0x3f7b9d, 0.9, 20 );
          let data = {
                fog : {
                      "THREE.Fog()" : false,
                      "scene.fog.color" : fog.color.getHex()
                }
          };

          fogFolder.add( data.fog, 'THREE.Fog()' ).onChange( function ( useFog ) {
                if ( useFog ) {
                      scene.fog = fog;
                } else {
                      scene.fog = null;
                }
          } );
          fogFolder.addColor( data.fog, 'scene.fog.color').onChange( this._handleColorChange( fog.color ) );
    }

    _handleColorChange ( color ) {
          return ( value ) => {
                if (typeof value === "string") {
                      value = value.replace('#', '0x');
                }
                color.setHex( value );
        };
    }

}



// WEBPACK FOOTER //
// ./src/gui.js