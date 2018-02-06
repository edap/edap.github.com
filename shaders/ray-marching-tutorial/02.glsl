precision mediump float;

// how many marching steps
const int MAX_MARCHING_STEPS = 64;
const float EPSILON = 0.01;

float map(vec3 pos){
    return pos.y;
}

//now instead of calculating the interesection with this method, we use distance field
// float intersectPlane(vec3 pos, vec3 dir){
//     return -pos.y / dir.y;
// }

void main(){
    vec2 uv = 2.0 * gl_FragCoord.xy / iResolution.xy - 1.0;

    vec3 pos = vec3(0.0, 5.0, -10.);
    vec3 dir = normalize(vec3(uv, 1.0));

    vec3 color = vec3(0.0);

    for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
        float d = map(pos);
        if (d < EPSILON){
            // hit! stop and calculate the color
            color = fract(pos * 0.5);
            break;
        }
        // did not hit, marche one step forward
        pos += d * dir;
    }

    gl_FragColor = vec4(color, 1.0);
}