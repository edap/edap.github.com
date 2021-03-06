// In this file we are going to use boolean ops

precision mediump float;

const int MAX_MARCHING_STEPS = 64;
const float EPSILON = 0.0015;
const float NEAR_CLIP = 0.0;
const float FAR_CLIP = 100.00;
//vec3 lightDirection = normalize(vec3(sin(iGlobalTime), 0.6, 1.));
vec3 lightDirection = vec3(1.0, 1.0, -1.0);
vec2 rotate(vec2 pos, float angle){
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, s, -s, c) * pos;
} 

float plane(vec3 pos){
    return pos.y;
}

float sdBox( vec3 p, vec3 b ){
    vec3 d = abs(p) - b;
    return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float sphere(vec3 pos, float radius){
    return length(pos) - radius;
}

// operations
float opS( float d1, float d2 ){
    return max(-d2,d1);
}

vec3 opRep( vec3 p, vec3 c ){
    return mod(p,c)-0.5*c;
}

float map(vec3 pos){
    float offset = 0.6;
    float sph = sphere(pos, 7.);
    //return sph;
    // repeat the boxes
    pos = opRep(pos, vec3(offset, offset, offset));
    float box = sdBox(pos, vec3(0.2, 0.2, 0.2));
    float box2 = sdBox(pos, vec3(0.1, 0.1, 0.1));
    //return sphere minus boxes;
    //return box;
    return opS(box, box2);
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
    float ambient = 0.7;
    return clamp( dot(normal, lightDirection) * ambient + ambient, 0.0, 1.0 );
}

float specular(vec3 normal, vec3 dir){
    vec3 h = normalize(normal - dir);
    float specularityCoef = 100.;
    return clamp( pow(max(dot(h, normal), 0.), specularityCoef), 0.0, 1.0);
}

float fresnel(vec3 normal, vec3 dir){
    return pow( clamp(1.0+dot(normal,dir),0.0,1.0), 2.0 );
}

mat3 setCamera( in vec3 ro, in vec3 ta, float cr ){
    vec3 cw = normalize(ta-ro);
    vec3 cp = vec3(sin(cr), cos(cr),0.0);
    vec3 cu = normalize( cross(cw,cp) );
    vec3 cv = normalize( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

void main(){
    vec2 uv = squareFrame(iResolution.xy, gl_FragCoord.xy);
    float camSpeed = 0.2;
    // vec3 eye = vec3( -0.5+3.5*cos(camSpeed*iGlobalTime + 6.0),
    //             3.0,
    //             5.5 + 4.0*abs(sin(camSpeed*iGlobalTime + 6.0))
    // );

    vec3 eye = vec3(3.5, 3.0, 15.5);

    vec3 ta = vec3( -0.5, -0.9, 0.5 );
    mat3 camera = setCamera( eye, ta, 0.0 );
    float fov = 1.;
    vec3 dir = camera * normalize(vec3(uv, fov));

    float shortestDistanceToScene = raymarching(eye, dir);

    vec3 color;
    vec3 bgColor = vec3(0.0);

    if (shortestDistanceToScene < FAR_CLIP - EPSILON) {
        vec3 collision = (eye += (shortestDistanceToScene*0.995) * dir );
        float shadow  = softshadow(collision, lightDirection, 0.02, 2.5 );
        float lightDistance = sphere(collision, 1.0);
        vec3 normal = computeNormal(collision);
        float diffLight = diffuse(normal);
        float specLight = specular(normal, dir);
        float fresnelLight = fresnel(normal, dir);
        float ambientOcc = ao(collision, normal);
        color = (diffLight + specLight + fresnelLight) * vec3(0.2, 0.2, 0.9);
        
        shadow = mix(shadow, 1.0, 0.7);
        color = color * ambientOcc * shadow;

    } else {
        color = bgColor;
    }

    gl_FragColor = vec4(clamp(color,0.0,1.0) , 1.0);
}