export function phyllotaxisSimple(i, angleInRadians, spread, extrude){
    let current_angle = i * angleInRadians;
    let radius = spread * Math.sqrt(i);
    let x = radius * Math.cos(current_angle);
    let y = radius * Math.sin(current_angle);
    let z = 0.0;
    if (extrude) {
        z = i * -.05;
    }
    return {x, y, z};
}

export function phyllotaxisConical(i, angleInRadians, spread, extrude){
    let current_angle = i * angleInRadians;
    let radius = spread * Math.sqrt(i);
    let x = radius * Math.cos(current_angle);
    let y = radius * Math.sin(current_angle);
    let z = i * - extrude;
    return {x, y, z};
}

export function phyllotaxisOnCurve(i, angleInRadians, spread, curve){
    let vertexOnCurve = curve.vertices[i];
    let curve_start = curve.vertices[0];
    // the vertices on the trunk will be looking at some vertices before them
    // "some vertices" is defined by a percentage value, like, the vertices
    // of the trunk should look at a point the 10% of the curve behind them.
    // Consider that the palms grows in the opposite direction. This palm grow from the top
    // to the bottom, not like real palms. Also the curve has to be defined as a curve that moves from the top to
    // the bottom
    let percent_of_the_curve = Math.floor(curve.vertices.length * 0.02);
    let prev = (i < percent_of_the_curve )? curve_start : curve.vertices[i-percent_of_the_curve];
    //console.log(curve.vertices.length);
    //console.log(vertexOnCurve.z);

    let current_angle = i * angleInRadians;
    let radius = spread * Math.sqrt(i);
    let x = radius * Math.cos(current_angle)+ vertexOnCurve.x;
    let y = radius * Math.sin(current_angle)+ vertexOnCurve.y;
    let z = vertexOnCurve.z;
    return {x, y, z, prev, curve_start};
}


export function phyllotaxisApple(i, angle, spread, tot){
    let inc = Math.PI / tot;
    let current_angle = i * inc;
    let current_angle_b= i * angle;
    let radius = spread * Math.sqrt(i);
    let x = radius * Math.sin(current_angle) * Math.cos(current_angle_b);
    let y = radius * Math.sin(current_angle) * Math.sin(current_angle_b);
    let z = radius * Math.cos(current_angle);
    return {x, y, z};
}

// this function is called Wrong because it is wrong! it was born as mistake
// while i was passing angles in degreees without converting them to radians.
// But sometimes there are strange patterns that generate a nice effect,
// and I've decided to keep it
// To use it, pass the angles in degrees
export function phyllotaxisWrong(i, angle, spread, tot){
    //let inc = Math.PI / tot;
    let inc = 180.0 / tot;
    let current_angle = i * inc;
    let current_angle_b= i * angle;
    let radius = spread * Math.sqrt(i);
    let x = radius * Math.sin(current_angle) * Math.cos(current_angle_b);
    let y = radius * Math.sin(current_angle) * Math.sin(current_angle_b);
    let z = radius * Math.cos(current_angle);
    return {x, y, z};
}
