#define PI 3.14159265359


//glslViewer ../../8depth.frag ../../textures/pink-necked-green-pigeon-resized.jpg ../../textures/sol.jpg
const int MAX_MARCHING_STEPS = 64;
const float EPSILON = 0.0015;
const float NEAR_CLIP = 0.0;
const float FAR_CLIP = 80.00;

uniform float u_time;
uniform vec2 u_resolution;


vec2 squareFrame(vec2 res, vec2 coord){
    vec2 uv = 2.0 * coord.xy / res.xy - 1.0;
    uv.x *= res.x / res.y;
    return uv;
}

vec3 lightDirection = vec3(0.702, 1.9686, 0.6745);

float sphere(vec3 pos, float radius){
    return length(pos) - radius;
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

vec2 rotate(vec2 pos, float angle){
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, s, -s, c) * pos;
} 

float smin( float a, float b, float k ){    
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}
float smins( float a, float b ){
    return smin(a, b, .24);
}


// blocco copiata
float asphere(in vec3 ro, in vec3 rd, in vec3 sp, in float sr){ 
    // geometric solution
    float sr2 = sr*sr;
    vec3 e0 = sp - ro; 
    float e1 = dot(e0,rd);
    float r2 = dot(e0,e0) - e1*e1; 
    if (r2 > sr2) return 1000.0; 
    float e2 = sqrt(sr2 - r2); 
    return e1-e2; 
}

float mapa(in vec3 ro, in vec3 rd){ 
    return min(asphere(ro,rd,vec3(0.0,0.0,0.0), 1.5),
               min(asphere(ro,rd,vec3(-2,0.0,0.0),1.0), 
                   min(asphere(ro,rd,vec3(0.0,-2,0.0),1.0),
                       min(asphere(ro,rd,vec3(1.15,1.15,1.15),1.0),
                           min(asphere(ro,rd,vec3(0.0,0.0,-2),1.0),
                              asphere(ro,rd,vec3(3.,3.,3.),0.2))))));
}


vec3 ascene(in vec3 ro, in vec3 rd){
    float t = mapa(ro,rd);
    vec3 col = vec3(0);
    if (t==1000.0){col +=0.5;}
    
    else {
        vec3 loc = t*rd+ro;
        loc = loc*0.5;
        col =  vec3(clamp(loc.x,0.0,1.0),clamp(loc.y,0.0,1.0),clamp(loc.z,0.0,1.0));
    }
    return col;
}

// fine blocco copiato

float map(vec3 pos){
    pos.x -= 0.35;
    pos.y -= 0.97;
    vec3 rpos = pos;
    vec3 pos1 = rpos;
    pos1.x += 0.2;

    rpos.zx =  rpos.zx * rotate2d(sin(u_time*2.0) * 0.2);

    float s = sphere(rpos, 0.08 + abs(sin(u_time*0.25) * 0.35));
    float s1 = sphere(pos1, 0.18 - abs(cos(u_time*0.25) * 0.35));

    return smins(s,s1);
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

float softshadow( in vec3 ro, in vec3 rd, in float mint, in float tmax) {
    float res = 1.0;
    float t = mint;
    for( int i=0; i<16; i++ ) {
        float h = map( ro + rd);
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
        float dd = map( aopos);
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
//glslViewer ../../pattern1.frag ../../textures/tangara-velia.jpg ../../textures/pink-necked-green-pigeon-resized.jpg ../../textures/sol.jpg -w 2048 -h 2048 --headless -s 5 -o fourth.png
float diffuse(vec3 normal){
    float ambient = 0.4;
    return clamp( dot(normal, lightDirection) * ambient + ambient, 0.0, 1.0 );
}

float specular(vec3 normal, vec3 dir){
    vec3 h = normalize(normal - dir);
    float specularityCoef = 40.;
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

void main(void){
    // this is the accumulated color
    vec3 color = vec3(0.0,0.0,0.0);

    vec3 red = vec3(1.0, 0.353, 0.208);
    vec3 blu = vec3(0.086, 0.29, 0.8);

    vec2 st = squareFrame(u_resolution.xy, gl_FragCoord.xy);

    // DOF Variables
    float lensAperture = 3.0;
    float focalLenght = 20.0;
    float shiftIteration = 0.0;
    float lstep = 1.0/lensAperture;
    float lstart = lstep/2.0-0.5;

    // camera setup
    vec3 eye = vec3(0.5,1.0,20.0);
    vec3 ta = vec3(0.3, 1.0, -1.0);  
    mat3 camera = setCamera( eye, ta, 0.0 );
    float fov = 20.4;
    vec3 dir = camera * normalize(vec3(st, fov));

    // calculate the focal point
    vec3 focalPoint = eye + (dir * focalLenght);

    // loop that shift the ray origin, calculate the color
    // anad accumulate it in the vec3 color
    for (float lx = lstart; lx < 0.5; lx+=lstep){
        for (float ly = lstart; ly < 0.5; ly+=lstep){

            vec3 shiftedRayOrigin = eye;
            shiftedRayOrigin.x += lx;
            shiftedRayOrigin.y += ly;
            vec3 shiftedRay = normalize(focalPoint - shiftedRayOrigin);


            vec3 rayDir = normalize(focalPoint - shiftedRayOrigin);
            //color += ascene(shiftedRay,rayDir);

            float shortestDistanceToScene = raymarching(shiftedRayOrigin, rayDir);

            if (shortestDistanceToScene < FAR_CLIP - EPSILON) {
                vec3 collision = (shiftedRayOrigin += (shortestDistanceToScene*0.995) * rayDir );

                float shadow  = softshadow(collision, lightDirection, 0.02, 2.5 );
                float lightDistance = sphere(collision, 1.0);
                vec3 normal = computeNormal(collision);
                float diffLight = diffuse(normal);
                float specLight = specular(normal, rayDir);
                float fresnelLight = fresnel(normal, rayDir);
                //float ambientOcc = ao(collision, normal);
                color += (diffLight + specLight + fresnelLight) * red;
            } else {
                color += blu;
            }
            shiftIteration += 1.0;
        }
    }

    gl_FragColor = vec4(vec3(color/shiftIteration), 1.0);
}