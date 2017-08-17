import {phyllotaxisConical, phyllotaxisOnCurve} from './phyllotaxis.js';
import * as THREE from 'three';

export default class PalmGenerator{
    // keep in mind, palm grows along the z axis. Specifically, from positive
    // z axis to negative z-axis
    constructor(leaf_geometry, trunk_geometry, options={}, curve=false){
        let buffers;
        let geometry;
        let objects;
        let result;
        let cleaned_options =
            this._merge_and_validate_options(options, this._default_options());

        if (cleaned_options.buffers){
            let hash_vertex_info = this._getTotNumVertices(leaf_geometry,
                                                      trunk_geometry,
                                                      cleaned_options.num,
                                                      cleaned_options.foliage_start_at);

            buffers = this._createBuffers(hash_vertex_info.tot_vertices, hash_vertex_info.tot_vertices_in_leafs);
            objects = this._buildPalm(leaf_geometry,
                                      trunk_geometry,
                                      cleaned_options,
                                      curve);
            geometry = this._mergeObjectsInOneGeometryAndFullfilBuffers(objects,
                                                                           cleaned_options,
                                                                           hash_vertex_info,
                                                                           buffers);
            this._repositionGeometryAndRotateIt(geometry);
            this._assignUVs(geometry);
            geometry.computeFaceNormals();
            result =  { geometry:geometry, buffers: buffers };
        } else {
            objects = this._buildPalm(leaf_geometry,
                                      trunk_geometry,
                                      cleaned_options,
                                      curve);
            geometry = this._mergeObjectsInOneGeometry(objects, cleaned_options);
            this._repositionGeometryAndRotateIt(geometry);
            this._assignUVs(geometry);
            geometry.computeFaceNormals();
            result =  { geometry:geometry };
        }
        return result;
    }

    _default_options(){
        return {
            spread: 0.2,
            angle: 137.5,
            num: 500,
            growth: 0.05,
            foliage_start_at: 50,
            starting_angle_open: 50,
            angle_open: 29,
            trunk_regular:true,
            buffers:false
        };
    }

    _merge_and_validate_options(options, defaults){
        let opt = Object.assign(defaults, options);
        return opt;
    }

    _buildPalm(leaf_geometry, trunk_geometry, options, curve){
        let material = new THREE.MeshBasicMaterial();
        let objects;
        if (curve) {
            //TODO implement validations, check if the first point in the
            // curve as a y value bigger than the last one
            let curve_geometry = this._createGeometryCurve(curve, options.num);
            objects = this._populatePalmOnCurve(
                leaf_geometry, trunk_geometry, options, material, curve_geometry);
        } else {
            objects = this._populatePalm(
                leaf_geometry, trunk_geometry, options, material);
        }
        return objects;
    }

    _populatePalm(foliage_geometry, trunk_geometry, options, material) {
        let objs = [];
        let PItoDeg = (Math.PI/180.0);
        let angleInRadians = options.angle * PItoDeg;
        for (var i = 0; i< options.num; i++) {
            let isALeaf = (i <= options.foliage_start_at)? true : false;
            let geometry = isALeaf ? foliage_geometry : trunk_geometry;
            let object = new THREE.Mesh(geometry, material);
            //object.angle = angleInRadians * i;
            object.angle = (options.angle * i) % 256;
            //object.angle = i;
            let coord = phyllotaxisConical(i, angleInRadians, options.spread, options.growth);
            object.position.set(coord.x, coord.y, coord.z);
            if (isALeaf) {
                this._transformIntoLeaf(object, i, angleInRadians, options);
            } else {
                object.rotateZ( i* angleInRadians);
                if(options.trunk_regular){
                    object.rotateY( (90 + options.angle_open ) * -PItoDeg );
                }else{
                    object.rotateY( (90 + options.angle_open + i * 100/options.num ) * -PItoDeg );
                }
            }
            objs.push(object);
        }
        return objs;
    }
    _populatePalmOnCurve(foliage_geometry, trunk_geometry, options, material, curve_geometry) {
        let objects = [];
        let PItoDeg = (Math.PI/180.0);
        let angleInRadians = options.angle * PItoDeg;
        for (var i = 0; i< options.num; i++) {
            let isALeaf = (i <= options.foliage_start_at)? true : false;
            let geometry = isALeaf ? foliage_geometry : trunk_geometry;
            let object = new THREE.Mesh(geometry, material);
            object.angle = (options.angle * i) % 256;
            let coord = phyllotaxisOnCurve(i, angleInRadians, options.spread, curve_geometry);
            object.position.set(coord.x, coord.y, coord.z);
            object.lookAt(coord.prev);
            if (isALeaf) {
                // rotate the first leave, otherwise it looks at her self and goes in gimbal lock
                if (i===0) {
                    object.rotateY( (40 + options.angle_open * 100/options.num ) * -PItoDeg );
                }
                this._transformIntoLeaf(object, i, angleInRadians, options);
            } else {
                object.lookAt(coord.prev);
                object.rotateZ(i* angleInRadians);
                object.rotateY((90 + options.angle_open + i * 100/options.num ) * -PItoDeg);
            }
            objects.push(object);
        }
        return objects;
    }

    _createGeometryCurve(curve, number_tot_objects){
        // First point of the curve is the top of the foliage
        // Last point of the curve is the bottom, where the root are.
        // Curve is expected to be a CatmullRomCurve3
        // that has as last vertex the position of the root
        let curveGeometry = new THREE.Geometry();
        curveGeometry.vertices = curve.getPoints(number_tot_objects);
        // The origina phyllotaxis pattern in 2d was developing on axes
        // x and y. When moving to 3d I've simply used the same algorithm
        // and added a third dimension, z. The tree was growing from the leafs
        // to the roots along the negative z axis. This turns out to be a bit impractical when positioning the palms on a scene, that's why i make here 2 operation.
        // 1) I rotate the palm on the x axis, so that it looks like the palm grows along the y axis, not the z
        // 2) I move the palms up un the y axis, so that the roots are at 0
        curveGeometry.rotateX(-(Math.PI+ Math.PI/2));
        return curveGeometry;
    }


    _transformIntoLeaf(object, iter, angleInRadians, options){
        let random = false;
        let randomDivergence = 0.2;
        let PItoDeg = (Math.PI/180.0);
        // The scale ratio is a value between 0.001 and 1.
        // It is 0.0001 for the first leaves, and 1 for the last one
        let ratio = Math.abs(iter/options.foliage_start_at);
        // This is to avaoid a scaleRatio of 0, that would cause a warning while scaling
        // an object for 0
        let scaleRatio = ratio === 0 ? 0.001 : ratio;
        //TODO implement random rotation
        if (random) {
            let angleRandomizedZ = this._getRandomArbitrary(angleInRadians, (angleInRadians + randomDivergence));
            object.rotateZ( iter* angleRandomizedZ);

            let y_angle = options.angle_open * scaleRatio;
            let angleRandomizedY = this._getRandomArbitrary(angleInRadians, (y_angle + randomDivergence));
            object.rotateY( (options.starting_angle_open + angleRandomizedY + iter * 200/options.num ) * -PItoDeg );
        } else {
            object.rotateZ( iter* angleInRadians);
            let y_angle = options.angle_open * scaleRatio;
            object.rotateY( (options.starting_angle_open + y_angle + iter * 200/options.num ) * -PItoDeg );
        }
        // as leaves grow up, they become bigger
        object.scale.set(5 * scaleRatio ,1 ,1);
        object.rotateZ(-(Math.PI/2));
    }

    _mergeObjectsInOneGeometryAndFullfilBuffers(objs, opt, vertex_info, buffers){
        let geometry = new THREE.Geometry();
        let current_pos = 0; // current position in the buffers
        for (let i = 0; i < objs.length; i++){
            if (i <= opt.foliage_start_at) {
                for(let pos=0; pos < vertex_info.n_vertices_leaf; pos++){
                    let angleColor = new THREE.Color().setHSL((objs[i].angle / 360.0), 0.5, 0.5);
                    buffers.color[current_pos*3] = angleColor.r;
                    buffers.color[current_pos*3 +1] = angleColor.g;
                    buffers.color[current_pos*3 +2] = angleColor.b;
                    buffers.angle[current_pos] = objs[i].angle;
                    buffers.isLeaf[current_pos] = 1.0;
                    current_pos ++;
                }
            } else {
                for(let pos=0; pos < vertex_info.n_vertices_trunk; pos++){
                    let angleColor = new THREE.Color().setHSL((objs[i].angle / 360.0), 0.5, 0.5);
                    buffers.color[current_pos*3] = angleColor.r;
                    buffers.color[current_pos*3 +1] = angleColor.g;
                    buffers.color[current_pos*3 +2] = angleColor.b;
                    buffers.angle[current_pos] = objs[i].angle;
                    buffers.isLeaf[current_pos] = 0.0;
                    current_pos ++;
                }
            }

            let mesh = objs[i];
            mesh.updateMatrix();
            geometry.merge(mesh.geometry, mesh.matrix);
        }
        return geometry;
    }
    _mergeObjectsInOneGeometry(objects){
        let geometry = new THREE.Geometry();
        for (let i = 0; i < objects.length; i++){
            let mesh = objects[i];
            mesh.updateMatrix();
            geometry.merge(mesh.geometry, mesh.matrix);
        }
        return geometry;
    }

    _createBuffers(n_vert, n_foliage_vertices){
        return {
            angle: new Float32Array(n_vert),
            color: new Float32Array(n_vert * 3),
            isLeaf: new Float32Array(n_vert),
            totVertices: n_vert,
            totFoliageVertices: n_foliage_vertices
        };
    }

    _getTotNumVertices(foliage_geometry, trunk_geometry, tot_objects, foliage_start_at){
        let adjusted_foliage_start_at = foliage_start_at + 1; //counting the 0 too
        let vertices_in_leaf = foliage_geometry.faces.length * 3;
        let vertices_in_trunk = trunk_geometry.faces.length * 3;
        let n_vertices_in_leaf = adjusted_foliage_start_at * vertices_in_leaf;
        let n_vertices_in_trunk = (tot_objects - adjusted_foliage_start_at) * vertices_in_trunk;
        return{
            tot_vertices: (n_vertices_in_trunk + n_vertices_in_leaf),
            n_vertices_leaf: vertices_in_leaf,
            n_vertices_trunk: vertices_in_trunk,
            tot_vertices_in_leafs: n_vertices_in_leaf
        };
    }

    _repositionGeometryAndRotateIt(geometry){
        //The origina phyllotaxis pattern in 2d was developing on axes
        // x and y. When moving to 3d I've simply used the same algorithm
        // and added a third dimension, z. The tree was growing from the leafs
        // to the roots along the negative z axis. This turns out to be a bit impractical when positioning the palms on a scene, that's why i make here 2 operation.
        // 1) I rotate the palm on the x axis, so that it looks like the palm grows along the y axis, not the z
        // 2) I move the palms up un the y axis, so that the roots are at 0
        geometry.rotateX(-Math.PI/2);
        let box = new THREE.Box3().setFromPoints(geometry.vertices);
        geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, (box.min.y * -1), 0));
    }

    _getRandomArbitrary(min, max){
        return Math.random() * (max -min) +min;
    }
    _assignUVs(geometry) {
        geometry.faceVertexUvs[0] = [];
        geometry.faces.forEach(function(face) {
            var components = ['x', 'y', 'z'].sort(function(a, b) {
                return Math.abs(face.normal[a]) > Math.abs(face.normal[b]);
            });

            var v1 = geometry.vertices[face.a];
            var v2 = geometry.vertices[face.b];
            var v3 = geometry.vertices[face.c];
            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(v1[components[0]], v1[components[1]]),
                new THREE.Vector2(v2[components[0]], v2[components[1]]),
                new THREE.Vector2(v3[components[0]], v3[components[1]])
            ]);
        });

        geometry.uvsNeedUpdate = true;
    }
}
