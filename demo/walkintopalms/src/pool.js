import {BoxBufferGeometry, Mesh, Vector3} from 'three';
import {getRandom, getRandomInt} from './helpers.js';
import Palms from './palms.js';
export default class Pool {
    constructor(size, scene, curve, percent_covered, distance_from_path, material){
        this.scene = scene;
        this.size = size;
        this.curve = curve;
        this.container = [];
        this.index_positions = []; // keep track of the id of the object and its position on the curve
        this.percent_covered = percent_covered;
        this.distance_from_path = distance_from_path;
        this.step = this.percent_covered / this.size;
        this.material = material;

        this.palmTypes = new Palms(); //this return some different palms, one for each type
        this.populatePool();
    }

    populatePool(){
        let tot_lenght_steps = 0;
        let flip_direction = true;
        for (let i = 0; i < this.size; i++) {
            tot_lenght_steps += this.step;
            this.index_positions.push(tot_lenght_steps);

            let obj = this.createObject(i);
            obj.name = i;
            obj.position_on_curve = tot_lenght_steps;
            let point = this.curve.getPoint(tot_lenght_steps);
            let tangentVector = this.curve.getTangent(tot_lenght_steps).multiplyScalar(
                this.distance_from_path, 0, this.distance_from_path);
            let axis = new Vector3( 0, 1, 0 );
            let angle = Math.PI / 2;
            // there is no function to get the secant. I take the tangen and i rotate it
            let secantVector = tangentVector;
            secantVector.applyAxisAngle( axis, angle );
            let position_offset = Math.sin(i) * 6;
            secantVector.x += position_offset;
            let new_pos;
            if (flip_direction) {
                new_pos = point.add(secantVector);
            }else{
                new_pos = point.sub(secantVector);
            }
            obj.position.set(new_pos.x, new_pos.y, new_pos.z);
            this.container.push(obj);
            this.scene.add(obj);
            flip_direction = !flip_direction;
        }
    }

    _pointsOnTheCurveWithObjects(){
        let validPoints = Math.abs(this.curve.points * this.percent_covered);

    }

    createObject(i){
        //let randomIndex = getRandomInt(0, (palms.length));
        let randomIndex = getRandomInt(0,6);
        //let randomIndex = 5;
        let index = i% this.palmTypes.length;
        let palm = this.palmTypes[index];
        let mesh = new Mesh(palm, this.material);
        mesh.rotateY(Math.PI / getRandom(-3, 3));

        return mesh;
    }

    update(camera_position_on_spline){
        //if camera position on spline is bigger than a palm
        //it means that this palm is no longer into the scene, put it back
        let flip_direction = true;
        for(let i = 0; i <= this.index_positions.length; i++ ){
            let object_position = this.index_positions[i];
            let horizon = camera_position_on_spline + this.percent_covered;
            flip_direction = !flip_direction;
            let delay = 0.05;// otherwise object will disapear instanaely, and
            //in case of trees with leaves does not look nice.
            if (object_position+delay < camera_position_on_spline) {
                // this condition handles the case when you are at postion 9.5 in the curve
                //and you have still to be able to see the palms in position 0.1
                if (horizon >= 1.0){
                    horizon = horizon - 1.0;
                    if (object_position+delay > horizon){
                        this.putObjectForwardTheCamera(camera_position_on_spline, i, flip_direction);
                    }
                } else {
                    this.putObjectForwardTheCamera(camera_position_on_spline, i, flip_direction);
                }
            }
        }
    }

    putObjectForwardTheCamera(camera_position_on_spline, object_index, flip_direction){
        let object = this.container[object_index];
        let new_position_on_curve = this.index_positions[object_index] + this.percent_covered;
        let adjusted_position;
        if(new_position_on_curve >= (1.0)){
            adjusted_position = (new_position_on_curve - 1.0);
        }else{
            adjusted_position = new_position_on_curve;
        }
        this.index_positions[object_index] = adjusted_position;

        let point = this.curve.getPoint(adjusted_position);
        let tangentVector = this.curve.getTangent(adjusted_position).multiplyScalar(
            this.distance_from_path, 0, this.distance_from_path);
        let axis = new Vector3( 0, 1, 0 );
        let angle = Math.PI / 2;
        // there is no function to get the secant. I take the tangen and i rotate it
        let secantVector = tangentVector;
        secantVector.applyAxisAngle( axis, angle );
        let position_offset = Math.sin(object_index) * 6;
        secantVector.x += position_offset;
        let new_pos;

        if (flip_direction) {
            new_pos = point.add(secantVector);
        } else {
            new_pos = point.sub(secantVector);
        }
        object.position.set(new_pos.x, new_pos.y, new_pos.z);

    }
}
