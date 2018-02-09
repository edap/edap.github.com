// In this file we are going to add shadow

precision mediump float;

const int MAX_MARCHING_STEPS = 64;
const float EPSILON = 0.01;
const float NEAR_CLIP = 0.0;
const float FAR_CLIP = 100.00;

vec3 lightDirection = normalize(vec3(1.0, 0.6, 1.));

float plane(vec3 pos){
    return pos.y;
}

float roundedBox(vec3 pos, vec3 size, float radius){
    return length(max(abs(pos) - size, 0.0)) - radius;
}

float sphere(vec3 pos, float radius){
    return length(pos) - radius;
}

float map(vec3 pos){
    return min(
        plane(pos),
        min(
        roundedBox(pos+vec3(1.5,0.,0.5), vec3(1.0), 0.8),
        sphere(pos-vec3(2.5,1.,0.), 2.)));
}

vec2 squareFrame(vec2 res, vec2 coord){
    vec2 uv = 2.0 * coord.xy / res.xy - 1.0;
    uv.x *= res.x / res.y;
    return uv;
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


vec3 albedo(vec3 pos){
    pos *= 0.5;
    float f = smoothstep(0.27, 0.3, fract(pos.x + sin(pos.z) * 0.4));
    return f * vec3(1.0);
}

vec3 computeNormal(vec3 pos){
    vec2 eps = vec2(0.01, 0.);
    return normalize(vec3(
        map(pos + eps.xyy) - map(pos - eps.xyy),
        map(pos + eps.yxy) - map(pos - eps.yxy),
        map(pos + eps.yyx) - map(pos - eps.yyx)
    ));
}

float diffuse(vec3 normal){
    float ambient = 0.7;
    return clamp( dot(normal, lightDirection) * ambient + ambient, 0.0, 1.0 );
}

float specular(vec3 normal, vec3 dir){
    vec3 h = normalize(normal - dir);
    float specularityCoef = 100.;
    return clamp( pow(max(dot(h, normal), 0.), specularityCoef), 0.0, 1.0);
}

// https://www.shadertoy.com/view/Xds3zN
mat3 setCamera( in vec3 ro, in vec3 ta, float cr ){
    vec3 cw = normalize(ta-ro);
    vec3 cp = vec3(sin(cr), cos(cr),0.0);
    vec3 cu = normalize( cross(cw,cp) );
    vec3 cv = normalize( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

void main(){
    vec2 uv = squareFrame(iResolution.xy, gl_FragCoord.xy);
    float camSpeed = 0.9;
    // move the camera around
    vec3 eye = vec3( -0.5+3.5*cos(camSpeed*iGlobalTime + 6.0),
                3.0,
                3.5 + 4.0*sin(camSpeed*iGlobalTime + 6.0)
    );

    // this vector change the orientation of the camera
    vec3 ta = vec3( -0.5, -0.9, 0.5 );
    mat3 camera = setCamera( eye, ta, 0.0 );
    float fov = 1.;

    // to transform the camera, you apply a mtarix to the direction of the ray
    vec3 dir = camera * normalize(vec3(uv, fov));

    float shortestDistanceToScene = raymarching(eye, dir);

    vec3 color;
    vec3 bgColor = vec3(0.0);

    if (shortestDistanceToScene < FAR_CLIP - EPSILON) {
        vec3 collision = (eye += shortestDistanceToScene * dir );
        float lightDistance = sphere(collision, 1.0);
        vec3 normal = computeNormal(collision);
        float diffLight = diffuse(normal);
        float specLight = specular(normal, dir);
        color = (diffLight + specLight ) * vec3(0.9, 0.7, 0.6) ;
    } else {
        color = bgColor;
    }

    gl_FragColor = vec4(color, 1.0);
}