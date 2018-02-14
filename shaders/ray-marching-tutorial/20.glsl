precision mediump float;

const int MAX_MARCHING_STEPS = 64;
const float EPSILON = 0.0011;
const float NEAR_CLIP = 0.0;
const float FAR_CLIP = 100.00;

float sdfSphere(vec3 pos, float radius){
    return length(pos) - radius;
}

float map(vec3 pos){
    return sdfSphere(pos, 2.4);
}

vec3 computeNormal(vec3 pos){
    vec2 eps = vec2(0.01, 0.);
    return normalize(vec3(
        map(pos + eps.xyy) - map(pos - eps.xyy),
        map(pos + eps.yxy) - map(pos - eps.yxy),
        map(pos + eps.yyx) - map(pos - eps.yyx)
    ));
}

float raymarching(vec3 eye, vec3 marchingDirection){
    float depth = NEAR_CLIP;
    for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
        float dist = map(eye + depth * marchingDirection);
        if (dist < EPSILON){
            return depth;
        }

        depth += dist;

        if (depth >= FAR_CLIP) {
            return FAR_CLIP;
        }
    }
    return FAR_CLIP;
}

vec3 getRefTexture(vec3 normal, vec3 dir) {
    vec3 eye = -dir;
  	vec3 r = reflect( eye, normal );
    vec4 color = texture2D(iChannel1, (0.5 * (r.xy) + .5));
    //return vec3(r);
    return color.xyz;
}

void main(){
    vec2 uv = 2.0 * gl_FragCoord.xy / iResolution.xy - 1.0;
    uv.x *= iResolution.x / iResolution.y;

    vec3 eye = vec3(0.0, 0.0, -10);
    float fov = 2.;
    vec3 dir = normalize(vec3(uv, fov));

    float shortestDistanceToScene = raymarching(eye, dir);

    vec3 color;
    vec3 bgColor = vec3(0.1, 0.35, 0.75);

    if (shortestDistanceToScene < FAR_CLIP - EPSILON) {
        vec3 collision = (eye += (shortestDistanceToScene*0.995) * dir );
        vec3 normal = computeNormal(collision);
        color = getRefTexture(normal, dir);
    } else {
        color = bgColor;
    }
    
    gl_FragColor = vec4(color , 1.0);
}