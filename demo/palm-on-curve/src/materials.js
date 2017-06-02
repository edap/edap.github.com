import * as THREE from 'three';

export default class CollectionMaterials {
    constructor(){
        let materials = {
            "standard": new THREE.MeshStandardMaterial( {
                color: 0xd94e31,
                emissive: 0x2d1200,
                roughness:0.55,
                metalness:0.89,
                vertexColors: THREE.VertexColors
            }),
            "wireframe": new THREE.MeshBasicMaterial( {color: 0x00ff00, wireframe: true} ),
            "phong": new THREE.MeshPhongMaterial({
                color: 0x204d00,
                emissive: 0x78403d,
                specular: 0x413e0f,
                vertexColors: THREE.VertexColors,
                shininess: 26
            }),
            "lambert": new THREE.MeshLambertMaterial({color: 0xffffff})
        };
        return materials;
    }
}
