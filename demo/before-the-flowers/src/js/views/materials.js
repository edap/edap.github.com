import * as THREE from 'THREE';

export default class CollectionMaterials {
    constructor(){
        let materials = {
            "standard": new THREE.MeshStandardMaterial( {color:0xa0290f} ),
            "wireframe": new THREE.MeshBasicMaterial( {color:0x99ff00,
                                                       wireframe: true
                                                      } ),
            "physical": new THREE.MeshPhysicalMaterial({color: 0xa0290f,
                                                        clearCoat:1.0,
                                                        clearCoatRoughness:0.0,
                                                        reflectivity:0.9}),
            "phong": new THREE.MeshPhongMaterial({color: 0x6b0000,
                                                  emissive: 0x374a26,
                                                  specular: 0xc2dc49,
                                                  shininess: 1.4
                                                 }),
            "lambert": new THREE.MeshPhongMaterial({color: 0x2194CE})
        };
        return materials;
    }
}
