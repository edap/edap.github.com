import {map} from './helpers.js';
import {BoxGeometry, Mesh, MeshBasicMaterial, VertexColors, NoColors} from 'three';

export default class Scenography {
    constructor(camera, spline, t, cameraHeight, cameraSpeed, materialTrunk, materialFoliage){
        this.dimLight = false;
        this.debug = false;
        this.vertexColorsT = NoColors,
        this.vertexColorsF = NoColors,
        this.colorT = 0xd94e31;
        this.emissiveT = 0x2d1200;
        this.roughnessT = 0.55;
        this.metalnessT =0.89;
        this.colorF = 0xd94e31;
        this.emissiveF = 0x2d1200;
        this.roughnessF = 0.55;
        this.metalnessF =0.89;
        this.selectedBin = 0;
        this.kopfhoch = 0;
        this.cameraLowestSpeed = 0.0001;
        this.cameraHighestSpeed = 0.0004;
        this.cameraHighest = 120;
        this.cameraLowest = 27;
        this.materialTrunk = materialTrunk;
        this.materialFoliage = materialFoliage;
        this.current_index_scene = null;
        this.spline = spline;
        this.camera = camera;
        this.t = t;
        this.cameraHeight = cameraHeight;
        this.cameraSpeed = cameraSpeed;
        this.scenes = this._populateScenes();

        if (this.debug) {
            let geom =  new BoxGeometry(5,5,5);
            let mat = new MeshBasicMaterial();
            let fakeCamera = new Mesh(geom, mat);
            this.camera = fakeCamera;
        } else {
            this.camera = camera;
        }
    }

    getSelectedBin(){
        return this.selectedBin;
    }

    lightShouldDim(){
        return this.dimLight;
    }

    setSelectedBin(bin){
        this.selectedBin = bin;
    }

    update(time_in_seconds){
        let current_schedule = this._schedule(time_in_seconds);
        this._handleBlackAndWhite(current_schedule,time_in_seconds);
        this._handleCameraSpeed(current_schedule,time_in_seconds);
        this._handleDisplacement(current_schedule,time_in_seconds);
        this._handleColorPalette(current_schedule,time_in_seconds);
        if (current_schedule !== this.current_index_scene) {
            console.log("Imp scene "+ current_schedule);
            this.current_index_scene = current_schedule;
            this._implementScene(current_schedule);
            console.log(this.scenes[current_schedule]);
        }
        this._maybeMoveCamera(current_schedule);
    }

    _handleBlackAndWhite(scene_id, time){
        //in the scene with id 1 the brightness goes up
        let maxBrightness = 0.5;
        if (scene_id === 1) {
            let bright = map(time, 26, 45, 0.0, maxBrightness);
            //this.material.uniforms.brightness.value = bright;
        }

        // in the last scene the color goes back to black and white
        if (scene_id === 5) {
            let bright = map(time, 120, 138, maxBrightness, 0.0);
            //this.material.uniforms.brightness.value = bright;
        }
    }

    _handleCameraSpeed(scene_id, time){
        // in the last scene the camera slows down
        if (scene_id === 2 || scene_id === 3) {
            let speed = map(time, 49, 95, this.cameraLowestSpeed, this.cameraHighestSpeed);
            this.cameraSpeed = speed;
        }
        if (scene_id === 4) {
            let speed = map(time, 95, 120, this.cameraHighestSpeed, this.cameraLowestSpeed);
            this.cameraSpeed = speed;
        }
    }

    _handleDisplacement(scene_id, time){
        // in the last scene the camera slows down
        if (scene_id === 2 || scene_id === 3) {
            let disp = map(time, 49, 65, 0.0, 6.0);
            //this.material.uniforms.displacement.value = disp;
        }
    }

    _handleColorPalette(scene_id, time){
        // scene 4 goes from 95 to 120
        if(scene_id === 4){
            if(time > 95 && time <= 103) {
                this._changePalette('0xffffff', '0xe32e2e');
            } else if(time > 103 && time <= 111) {
                this._changePalette('0xffd100', '0x001c78');
            } else if(time > 111 & time <= 120) {
                this._changePalette('0xd8e600','0xaf2950');
            }
        }
    }

    _changePalette(color,emissive){
        this.materialFoliage.color.setHex(color);
        this.materialFoliage.emissive.setHex(emissive);
        this.materialFoliage.needsUpdate = true;
    }

    _maybeMoveCamera(scene_id){
        let scene = this.scenes[scene_id];
        if (scene.followPath) {
            this._moveCamera();
        }
    }

    _moveCamera() {
        var camPos = this.spline.getPoint(this.t);
        this.camera.position.set(camPos.x, this.cameraHeight, camPos.z);

        // the lookAt position is just 20 points ahead the current position
        // but when we are close to the end of the path, the look at point
        // is the first point in the curve
        var next = this.t + this.cameraSpeed * 20;
        var lookAtPoint = (next > 1) ? 0 : next;
        var look = this.spline.getPoint(lookAtPoint);
        look.y = this.cameraHeight + this.kopfhoch;
        this.camera.lookAt(look);

        var limit = 1 - this.cameraSpeed;
        this.t = (this.t >= limit) ? 0 : this.t += this.cameraSpeed;
    }

    _implementScene(scene_id){
        let scene = this.scenes[scene_id];
        if(scene.hasOwnProperty("dimLight")){
            this.dimLight = scene.dimLight;
        }

        if(scene.hasOwnProperty("kopfhoch")){
            if(scene.kopfhoch){
                this.kopfhoch = 6.0;
            }else{
                this.kopfhoch = 0.0;
            }
        }

        if(scene.hasOwnProperty("colorT")){
            this.materialTrunk.color.setHex(scene.colorT);
            this.materialTrunk.needsUpdate = true;
        }

        if(scene.hasOwnProperty("emissiveT")){
            this.materialTrunk.emissive.setHex(scene.emissiveT);
            this.materialTrunk.needsUpdate = true;
        }

        if(scene.hasOwnProperty("vertexColorsT")){
            if(scene.vertexColorsT){
                this.materialTrunk.vertexColors = VertexColors;
            }else{
                this.materialTrunk.vertexColors = NoColors;
            }
            this.materialTrunk.needsUpdate = true;
        }

        if(scene.hasOwnProperty("vertexColorsF")){
            if(scene.vertexColorsF){
                this.materialFoliage.vertexColors = VertexColors;
            }else{
                this.materialFoliage.vertexColors = NoColors;
            }
            this.materialFoliage.needsUpdate = true;
        }

        if (scene.hasOwnProperty("colorF")) {
            this.materialFoliage.color.setHex(scene.colorF);
            this.materialFoliage.needsUpdate = true;
        }

        if (scene.hasOwnProperty("emissiveF")) {
            this.materialFoliage.emissive.setHex(scene.emissiveF);
            this.materialFoliage.needsUpdate = true;
        }

        if (scene.hasOwnProperty("selectedBin")) {
            this.setSelectedBin(scene.selectedBin);
        }

        if(scene.hasOwnProperty("cameraHeight")){
            this.cameraHeight = scene.cameraHeight;
        }

        if(scene.hasOwnProperty("cameraSpeed") && scene.hasOwnProperty("followPath") === true){
            this.cameraSpeed = scene.cameraSpeed;
        }
    }

    getCameraPositionOnSpline(){
        // it returns a value between 0 and 1. O when at the beginning
        // of the spline, 1 when at the end
        return this.t;
    }

    _schedule(time_in_seconds){
        let testing = false;
        let sceneToTest = 1;
        if(!testing){
            if (time_in_seconds >= 0 && time_in_seconds <= 25) {
            //if (time_in_seconds >= 0 && time_in_seconds <= 25) {
                return 0;
            } else if (time_in_seconds > 25 && time_in_seconds <= 49) {
                return 1;
            } else if (time_in_seconds > 49 && time_in_seconds <=73) {
                return 2;
            } else if (time_in_seconds > 73 && time_in_seconds <=95) {
                return 3;
            } else if (time_in_seconds > 95 && time_in_seconds <= 120) {
                return 4;
            } else if (time_in_seconds >120 && time_in_seconds < 138) {
                return 5;
            }else{
                return 6;
            }
        }else{
            return sceneToTest;
        }

    }

    _populateScenes(){
        //walk slow in BN
        let black = {
            dimLight:false,
            cameraHeight:this.cameraLowest,
            cameraSpeed:this.cameraLowestSpeed,
            followPath: true
        };

        // enter the color
        let intro = {
            dimLight:false,
            followPath:true,
            vertexColorsF: true,
            vertexColorsT: false,
            colorF : '0xf0068',
            emissiveF : '0x004825',
            roughnessF : 0.55,
            cameraHeight:this.cameraLowest,
            cameraSpeed:0.0001
        };
        //enter color, run faster
        let middle = {
            dimLight:true,
            vertexColorsT: true,
            colorT : '0xffc741',
            emissiveT : '0x340031',
            colorF : '0x0077ff',
            emissiveF : '0xe84444',
            roughnessT : 0.55,
            metalnessT : 0.89,
            cameraHeight:this.cameraLowest,
            selectedBin: 3,
            speed: 0.005,
            followPath: true
        };
        let lookUp = {
            dimLight:true,
            kopfhoch:true,
            followPath: true
        };

        //fly into leaves
        let end = {
            dimLight:false,
            kopfhoch:false,
            colorT : '0x000000',
            emissiveT : '0x000000',
            selectedBin: 2,
            followPath: false,
            cameraHeight: this.cameraHighest,
            displacement: 0.01,
            followPath: true
        };

        //vertex displacement, slowly back to BN
        let last = {
            dimLight:true,
            emissiveF:'0x370013',
            colorT : '0xffc741',
            emissiveT : '0x000000',
            cameraHeight:this.cameraLowest,
            selectedBin: 3,
            followPath: true
        };

        let stop ={
            followPath:false,
            brightness:0.0
        };

        return [black, intro, middle, lookUp, end, last, stop];
    }
}



