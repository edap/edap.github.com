import {map} from './helpers.js';
import {BoxGeometry, Mesh, MeshBasicMaterial} from 'three';

export default class Scenography {
    constructor(camera, spline, t, cameraHeight, cameraSpeed, palmMaterial){
        this.debug = false;

        this.selectedBin = 0;
        this.kopfhoch = 0;
        this.cameraLowestSpeed = 0.0001;
        this.cameraHighestSpeed = 0.0004;
        this.cameraHighest = 120;
        this.cameraLowest = 27;
        this.material = palmMaterial;
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
            this.material.uniforms.brightness.value = bright;
        }

        // in the last scene the color goes back to black and white
        if (scene_id === 5) {
            let bright = map(time, 120, 138, maxBrightness, 0.0);
            this.material.uniforms.brightness.value = bright;
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
            this.material.uniforms.displacement.value = disp;
        }
    }

    _handleColorPalette(scene_id, time){
        // scene 3 goes from 95 to 120
        if(scene_id === 4){
            if(time > 95 && time <= 103) {
                this._changePalette(0.4, 0.6);
            } else if(time > 103 && time <= 111) {
                this._changePalette(0.11, 0.41);
            } else if(time > 111 & time <= 120) {
                this._changePalette(0.58, 1.00);
            }
        }
    }

    _changePalette(min,max){
        this.material.uniforms.maxColor.value = max;
        this.material.uniforms.minColor.value = min;
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
        //console.log(scene);
        if(scene.hasOwnProperty("displacement")){
            this.material.uniforms.displacement.value = scene.displacement;
        }

        if(scene.hasOwnProperty("kopfhoch")){
            if(scene.kopfhoch){
                this.kopfhoch = 6.0;
            }else{
                this.kopfhoch = 0.0;
            }
        }

        if(scene.hasOwnProperty("brightness")){
            this.material.uniforms.brightness.value = scene.brightness;
        }

        if(scene.hasOwnProperty("saturation")){
            this.material.uniforms.saturation.value = scene.saturation;
        }

        if(scene.hasOwnProperty("maxColor")){
            this.material.uniforms.maxColor.value = scene.maxColor;
        }

        if(scene.hasOwnProperty("selectedBin")){
            this.setSelectedBin(scene.selectedBin);
        }


        if(scene.hasOwnProperty("minColor")){
            this.material.uniforms.minColor.value = scene.minColor;
        }

        if(scene.hasOwnProperty("amplitude")){
            this.material.uniforms.amplitude.value = scene.amplitude;
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
        if (time_in_seconds >= 0 && time_in_seconds <= 25) {
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
    }

    _populateScenes(){
        //walk slow in BN
        let black = {
            cameraHeight:this.cameraLowest,
            cameraSpeed:this.cameraLowestSpeed,
            selectedBin: 7,
            amplitude:0.0,
            maxColor:0.9,
            minColor: 0.6,
            saturation: 0.9,
            brightness: 0.0,
            followPath: true
        };

        // enter the color
        let intro = {
            cameraHeight:this.cameraLowest,
            cameraSpeed:0.0001,
            selectedBin: 12,
            amplitude:0.0,
            maxColor:0.9,
            minColor: 0.6,
            saturation: 0.9,
            brightness: 0.5,
            followPath: true
        };
        //enter color, run faster
        let middle = {
            cameraHeight:this.cameraLowest,
            amplitude:0.0,
            selectedBin: 15,
            speed: 0.005,
            maxColor:0.72,
            minColor: 0.06,
            saturation: 0.9,
            followPath: true
        };
        let lookUp = {
            kopfhoch:true,
            followPath: true
        };

        //fly into leaves
        let end = {
            kopfhoch:false,
            selectedBin: 19,
            amplitude:3.0,
            followPath: false,
            maxColor:0.53,
            minColor: 0.36,
            saturation: 0.9,
            cameraHeight: this.cameraHighest,
            displacement: 0.01,
            followPath: true
        };

        //vertex displacement, slowly back to BN
        let last = {
            amplitude:3.5,
            cameraHeight:this.cameraLowest,
            selectedBin: 19,
            followPath: true
        };

        let stop ={
            followPath:false,
            brightness:0.0
        };

        return [black, intro, middle, lookUp, end, last, stop];
    }

}



