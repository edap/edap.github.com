import LeafGeometry from './LeafGeometry.js';
import * as THREE from 'three';

export default class CollectionGeometries{
    constructor(radius){
        let widthSegments = 32;
        let heightSegments = 32;
        let geometries = {
            "sphere": new THREE.SphereGeometry(radius, widthSegments, heightSegments),
            "box": new THREE.BoxGeometry( radius, radius, radius, 4, 4, 4 )
        };
        return geometries;
    }
}


