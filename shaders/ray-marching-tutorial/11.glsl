// In this file we are going to add shadow

precision mediump float;

const int MAX_MARCHING_STEPS = 64;
const float EPSILON = 0.001;
const float NEAR_CLIP = 0.0;
const float FAR_CLIP = 100.00;

vec3 lightDirection = normalize(vec3(sin(iGlobalTime), 0.6, 1.));

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

// Inigo http://www.iquilezles.org/www/articles/rmshadows/rmshadows.htm
float softshadow( in vec3 ro, in vec3 rd, in float mint, in float tmax ) {
	float res = 1.0;
    float t = mint;
    for( int i=0; i<16; i++ ) {
		float h = map( ro + rd*t );
        res = min( res, 8.0*h/t );
        t += clamp( h, 0.02, 0.10 );
        if( h<0.001 || t>tmax ) break;
    }
    return clamp( res, 0.0, 1.0 );
}

float ao( in vec3 pos, in vec3 nor ){
    // ambient occlusion
	float occ = 0.0;
    float sca = 1.0;
    for( int i=0; i<5; i++ )
    {
        float hr = 0.01 + 0.06*float(i)/4.0;
        vec3 aopos =  nor * hr + pos;
        float dd = map( aopos );
        occ += -(dd-hr)*sca;
        sca *= 0.95;
    }
    return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );    
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
    float ambient = 0.4;
    return dot(normal, lightDirection) * ambient + ambient;
}

float specular(vec3 normal, vec3 dir){
    vec3 h = normalize(normal - dir);
    float specularityCoef = 100.;
    return pow(max(dot(h, normal), 0.), specularityCoef);
}

void main(){
    vec2 uv = squareFrame(iResolution.xy, gl_FragCoord.xy);
    vec3 eye = vec3(0.0, 5.0, -10);
    float fov = 1.;
    vec3 dir = normalize(vec3(uv, fov));

    float shortestDistanceToScene = raymarching(eye, dir);

    vec3 color;
    vec3 bgColor = vec3(0.0);

    if (shortestDistanceToScene < FAR_CLIP - EPSILON) {
        vec3 collision = (eye += shortestDistanceToScene * dir );
        float shadow  = softshadow(collision, lightDirection, 0.02, 2.5 );
        float lightDistance = sphere(collision, 1.0);
        vec3 normal = computeNormal(collision);
        float diffLight = diffuse(normal);
        float specLight = specular(normal, dir);
        float ambientOcc = ao(collision, normal);
        color = (diffLight + specLight ) * vec3(0.6, 0.7, 0.2) ;
        color = color * ambientOcc * shadow;
    } else {
        color = bgColor;
    }

    gl_FragColor = vec4(color, 1.0);
}