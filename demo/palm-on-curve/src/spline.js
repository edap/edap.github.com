import * as THREE from 'three';

export default class Spline {
    constructor(){
        this.curve = null;
        this.points = [];
    }

    hasPoints(){
        return this.points.length;
    }

    getCurve(){
        if (!this.curve) {
            return this.defaultCurve();
        } else {
            return this.curve;
        }
    }

    reset(){
        this.points = [];
        this.curve = null;
    }

    defaultCurve(){
        let curve = new THREE.CatmullRomCurve3( [
	          new THREE.Vector3( -40, 150, 0 ),
	          new THREE.Vector3( -40, 100, 0 ),
	          new THREE.Vector3( 0, 60, 0 ),
	          new THREE.Vector3( 0, 0, 0 ),
        ] );
        return curve;
    }

    addPoint(vec3){
        this.points.push(vec3);
    }

    generateCurve(){
        this.points.reverse();
        this.curve = new THREE.CatmullRomCurve3(this.points);
    }
}
