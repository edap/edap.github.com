// In this file we are going to go back to sketch 03.glsl and polish it up a bit, specifically:

// isolate the ray marching algorithm

// define near clip and far clip plane

// make a function called squareFrame that take cares of centrering the coord sistem and fix the ratio


precision mediump float;

const int MAX_MARCHING_STEPS = 64;
const float EPSILON = 0.01;
const float NEAR_CLIP = 0.0;
const float FAR_CLIP = 100.00;

float plane(vec3 pos){
    return pos.y;
}

float roundedBox(vec3 pos, vec3 size, float radius){
    return length(max(abs(pos) - size, 0.0)) - radius;
}

float map(vec3 pos){
    return min(plane(pos), roundedBox(pos, vec3(2.0), 0.8));
}

// ripped from  https://github.com/hughsk/glsl-square-frame
vec2 squareFrame(vec2 res, vec2 coord){
    // The uv here, is used to orientate us in what in ray casting is called "the image plane".
    // The coord -1, -1 is the bottom left corner of the image plane, the 1,1 pixel is the top right corner of the image plane
    // see http://3.bp.blogspot.com/-pooioOCAaf8/UeL7Ebf1ImI/AAAAAAAAAE8/YjgJAg5Rdc4/s1600/window-to-uv.png
    vec2 uv = 2.0 * coord.xy / res.xy - 1.0;
    // fix aspect ratio
    uv.x *= res.x / res.y;
    return uv;
}


// this function just return the distance from the eye to the collision
// with the scene. If there was no collision, it returns the far clipping plane
float raymarching(vec3 eye, vec3 marchingDirection){
    // start to consider distances from the near clipping plane
    float depth = NEAR_CLIP;
    for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
        float dist = map(eye + depth * marchingDirection);
        if (dist < EPSILON){
            return depth;
        }
        // increase the depth based on the distance from the eye to the scene
        depth += dist;

        // do not continue if we are going out of the far clippling plane
        if (depth >= FAR_CLIP) {
            return FAR_CLIP;
        }
    }
    return FAR_CLIP;
}

void main(){
    vec2 uv = squareFrame(iResolution.xy, gl_FragCoord.xy);
    vec3 eye = vec3(0.0, 5.0, -10);
    // ray march direction
    // this part is a simplification, see https://www.shadertoy.com/view/XlBGDW
    float fov = 1.; // this value affects the field of view
    vec3 dir = normalize(vec3(uv, fov));

    // this is the raymarching algorithm separated from the rest
    float shortestDistanceToScene = raymarching(eye, dir);

    vec3 color;
    vec3 bgColor = vec3(0.0);

    if (shortestDistanceToScene < FAR_CLIP - EPSILON    ) {
        // you can easily reconstruct the collision position once you have the distance to it
        vec3 collision = (eye += shortestDistanceToScene * dir );
        color = fract(collision * 0.5);
    } else {
        color = bgColor;
    }

    gl_FragColor = vec4(color, 1.0);
}