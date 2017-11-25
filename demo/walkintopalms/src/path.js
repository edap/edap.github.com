import {Perlin} from './perlin.js';
import {CatmullRomCurve3, Vector3} from 'three';
export function createPath(radius, radius_offset, definition = 0.05){
    //definition: the smaller, the higher the definition of the curve
    let complete_round = Math.PI * 2;
    let vertices = [];
    let perlin = new Perlin(Math.random());
    let x_offset = 0;
    for (let angle = 0; angle <= complete_round; angle+= definition){
        let noise = perlin.noise(x_offset, 0, 0);
        let smoothed_offset = smoothLastPoints(radius_offset, angle, complete_round);
        let offset = map(noise, 0 ,1 , -smoothed_offset, smoothed_offset);
        let r = radius + offset;
        let x = r * Math.cos(angle);
        let z = r * Math.sin(angle);
        let v = new Vector3(x,0, z);
        vertices.push(v);
        x_offset += 0.1;
    }
    let curve = new CatmullRomCurve3(vertices);
    curve.closed = true;
    return curve;
}

function smoothLastPoints(offset, angle, round){
    // this function is to close the circle in a more uniform way
    let arc_to_smooth =round * 0.92;
    if(angle >= arc_to_smooth){
        let smoothed = map(angle,arc_to_smooth, round, offset, 0);
        return smoothed;
    }else{
        return offset;
    }
}

function map(val, in_min, in_max, out_min, out_max) {
    return (val - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

