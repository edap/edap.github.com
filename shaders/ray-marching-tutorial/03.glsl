precision mediump float;

// how many marching steps
const int MAX_MARCHING_STEPS = 64;
const float EPSILON = 0.01;

// let's use the SDF function for plane and sphere
float plane(vec3 pos){
    return pos.y;
}

float sphere(vec3 pos, float radius){
    return length(pos) - radius;
}

// and now merge the plane and the sphere together.
// simply return the closest point between the two object
float map(vec3 pos){
    return min(plane(pos), sphere(pos, 2.0));
}

void main(){
    vec2 uv = 2.0 * gl_FragCoord.xy / iResolution.xy - 1.0;

    // the value of pos, before the ray marching, is the position of the eye
    vec3 pos = vec3(0.0, 5.0, -10.);
    // try to move the eye around
    //vec3 pos = vec3(sin(iGlobalTime), 5.+sin(iGlobalTime*0.7) * 3.0, -10.);
    vec3 dir = normalize(vec3(uv, 1.0));

    vec3 color = vec3(0.0);

    for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
        float d = map(pos); // this value defines the surface of the scene
        // the scene in this sketch it is composed by a plane and a sphere
        if (d < EPSILON){
            color = fract(pos * 0.5);
            break;
        }

        pos += d * dir;
    }

    gl_FragColor = vec4(color, 1.0);
}