// forked from https://github.com/superguigui/Wagner/blob/master/example/index.js

import * as THREE from 'three'
import WAGNER from '@superguigui/wagner/'
import AbstractApplication from 'views/AbstractApplication'
import FXAAPass from '@superguigui/wagner/src/passes/fxaa/FXAAPass'
import ZoomBlurPassfrom from '@superguigui/wagner/src/passes/zoom-blur/ZoomBlurPass'
import MultiPassBloomPass from '@superguigui/wagner/src/passes/bloom/MultiPassBloomPass'
import Gui from 'views/gui';
import CollectionMaterials from 'views/materials.js';

const PItoDeg = (Math.PI/180.0);

class Main extends AbstractApplication {

    constructor() {

        super();

        this.objects = [];
        this.flower = new THREE.Group();
        this.n_frames = 0;
        this.angleInRadians = 0;

        this._camera.position.set(-45,-45,45);
        this._camera.lookAt(new THREE.Vector3(0,0,0));
        this.gui = new Gui();

        this.params = {
            usePostProcessing: true,
            useFXAA: true,
            useBloom: true,
            angle: 137.5,
            spread: 10,
            anim_spread: true,
            num: 370,
            amplitude: 1.6,
            zoetrope:true,
            zoetrope_angle:137.05,
            angle_y: 92.3,
            scale_x: 6.0,
            backgroundColor:0x15a774,
            ambientLight:"#ffe62d"

        };
        const ambientLight = new THREE.AmbientLight( 0xa2ac00 );
        this._scene.add( ambientLight );

        const light_p1 = new THREE.PointLight( 0xffffff, 1, 0 );
        const light_p2 = new THREE.PointLight( 0xffffff, 1, 0 );
        light_p1.position.set( 100, 200, 100 );
        light_p2.position.set( - 100, - 200, - 100 );
        this._scene.add( light_p1 );
        this._scene.add( light_p2 );

        this.geometry = new THREE.SphereGeometry(5, 32, 32);
        this.trunkGeometry = new THREE.BoxGeometry(5,5,5);
        this.materials = new CollectionMaterials();

        this.gui.addMaterials(this.materials);

        this.initPostprocessing();

        this.animate();
    }

    populateFlower(selected_geometry, trunk_geom, selected_material) {
        this.angleInRadians = this.gui.params.angle * PItoDeg;
        var coord;
        for (var i = 0; i< this.gui.params.num; i++) {
            var object = new THREE.Mesh(selected_geometry, selected_material);
            coord = this.phyllotaxisApple(i,
                                        this.angleInRadians,
                                        this.gui.params.spread,
                                        this.params.num);
            object.position.set(coord.x, coord.y, coord.z);
            object.rotateZ( i* this.angleInRadians);
            object.rotateY( (90 + this.gui.params.angle_y + i * 100/this.gui.params.num ) * -PItoDeg);
            object.scale.set(this.gui.params.scale_x,1,this.gui.params.scale_z);
            this.objects.push(object);
            this.flower.add(object);
        }
        this._scene.add(this.flower);
    }

    phyllotaxisApple(i, angle, spread, tot){
        var inc = Math.PI / tot;
        var current_angle = i * inc;
        var current_angle_b= i * angle;
        var radius = spread * Math.sqrt(i);
        var x = radius * Math.sin(current_angle) * Math.cos(current_angle_b);
        var y = radius * Math.sin(current_angle) * Math.sin(current_angle_b);
        var z = radius * Math.cos(current_angle);
        return {x:x, y:y, z:z};
    }


    resetFlower(){
        for(var index in this.objects){
            var object = this.objects[index];
            this.flower.remove( object );
        }
        this._scene.remove(this.flower);
        this.objects = [];
    }

    initPostprocessing() {
        this.renderer.setClearColor( this.params.backgroundColor );
        this.composer = new WAGNER.Composer(this._renderer);
        this.fxaaPass = new FXAAPass();
        this.bloomPass = new MultiPassBloomPass({
            blurAmount: 2,
            applyZoomBlur: true
        });

    }

    animate() {
        super.animate();
        this.n_frames ++;
        this.gui.params.spread = Math.abs(Math.sin(this.n_frames/this.gui.params.speed) * this.gui.params.amplitude);
        this.populateFlower(this.geometry, this.trunkGeometry, this.materials[this.gui.params.material]);
        if (this.gui.params.zoetrope) {
            this.flower.rotateZ(this.gui.params.zoetrope_angle * PItoDeg);
        }

        if (this.gui.params.usePostProcessing) {
            this.composer.reset();
            this.composer.render(this._scene, this._camera);
            if (this.gui.params.useFXAA) this.composer.pass(this.fxaaPass);
            if (this.gui.params.useBloom) this.composer.pass(this.bloomPass);
            this.composer.toScreen();
        }
        else {
            this._renderer.render(this._scene, this._camera);
        }

        this.resetFlower();

    }

}
export default Main;
