import {PlaneBufferGeometry, Mesh, MeshLambertMaterial, ShadowMaterial} from 'three';

export default class Plane {
    constructor(width, height, resolution){

        let geom = new PlaneBufferGeometry(width, height, resolution, resolution);
        //let mat = new MeshLambertMaterial({color:0x00FF00});
				let mat = new ShadowMaterial( { opacity: 0.2} );
        this.mesh = new Mesh(geom, mat);
				this.mesh.receiveShadow = true;
        return this.mesh;
    }
}
