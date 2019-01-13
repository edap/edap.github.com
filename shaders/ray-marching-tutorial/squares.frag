const int MAX_MARCHING_STEPS = 64;
const float EPSILON = 0.0011;
const float NEAR_CLIP = 0.0;
const float FAR_CLIP = 100.00;
const float PI = 3.14159265358979323846;

//merc
// Repeat in two dimensions
vec2 pMod2(inout vec2 p, vec2 size) {
    vec2 c = floor((p + size*0.5)/size);
    p = mod(p + size*0.5,size) - size*0.5;
    return c;
}

// Repeat in three dimensions
vec3 pMod3(inout vec3 p, vec3 size) {
    vec3 c = floor((p + size*0.5)/size);
    p = mod(p + size*0.5, size) - size*0.5;
    return c;
}

// end mercury

vec2 squareFrame(vec2 res, vec2 coord){
    vec2 uv = 2.0 * coord.xy / res.xy - 1.0;
    uv.x *= res.x / res.y;
    return uv;
}

vec2 rotate(vec2 pos, float angle){
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, s, -s, c) * pos;
}

float opSub(float a, float b){
    return max(-a, b);
}

float opUn(float a, float b){
    return min(a,b);
}

float sdBox( vec3 p, vec3 b ){
    vec3 d = abs(p) - b;
    return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float sdfSphere(vec3 pos, float r){
    return length(pos) - r;
}

//Scale
// float opScaleBox( vec3 p, float s ){
//     return (p/s)*s;
// }

float sdRoundBox( vec3 p, vec3 b, float r ){
    return length(max(abs(p)-b,0.0))-r;
}

float frame(vec3 pos, float side, float thik, float z){
    //float box1 = sdBox(pos, vec3(side, side,z));
    //float box2 = sdBox(pos ,vec3(side-thik,side-thik, z+0.2));
    float box1 = sdRoundBox(pos, vec3(side, side,z), 0.3);
    float box2 = sdRoundBox(pos ,vec3(side-thik,side-thik, z+0.4), 0.3);
    return opSub(box2, box1);
}

float map(vec3 pos){
    vec2 uv = squareFrame(iResolution.xy, gl_FragCoord.xy);
    pos.x+= (iGlobalTime*4.)*1.5;
    float grid = 18.0;
    float fr = 3.0;
    float sinTimeA = sin(iGlobalTime*fr)* 0.5;
    float sinTimeB = sin(iGlobalTime*fr+0.3)* 0.5;
    float sinTimeC = sin(iGlobalTime*fr+0.6)* 0.5;
    float sinTimeD = sin(iGlobalTime*fr+0.9)* 0.5;   
    //pMod2(pos.xy, vec2(grid));
    pMod3(pos, vec3(grid, grid, 28.));


    

    vec3 pA = pos;
    vec3 pB = pos;
    vec3 pC = pos;
    vec3 pD = pos;

    pA.xz = rotate(pos.xz, sinTimeA);
    //pA.z += 0.5;
    pB.xz = rotate(pos.xz, sinTimeB);
    pB.z += .2;
    pC.xz = rotate(pos.xz, sinTimeC);
    pC.z += .4;
    pD.xz = rotate(pos.xz, sinTimeD);
    pD.z += .9;


    float A = frame(pA, 5.9, 0.4, 0.6);
    float B = frame(pB, 4.9, 0.4, 0.6);
    float C = frame(pC, 3.9, 0.4, 0.6);
    float D = frame(pD, 2.9, 0.4, 0.6);
    return opUn(opUn(opUn(B,A),C),D);
    //return A;
}

float raymarching(vec3 eye, vec3 rayMarchinDir, vec2 uv){
    float depth = NEAR_CLIP;
    for(int i = 0; i < MAX_MARCHING_STEPS; i++){
        float dist = map(eye + depth * rayMarchinDir);

        if (dist < EPSILON) {
            return depth;
        }

        depth += dist;
        if (depth >= FAR_CLIP) {
            return FAR_CLIP;
        }
    }
    return FAR_CLIP;
}

mat3 setCamera( in vec3 ro, in vec3 ta, float cr ){
    vec3 cw = normalize(ta-ro);
    vec3 cp = vec3(sin(cr), cos(cr),0.0);
    vec3 cu = normalize( cross(cw,cp) );
    vec3 cv = normalize( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

vec3 computeNormal(vec3 pos){
    vec2 eps = vec2(0.01, 0.);
    return normalize(vec3(
                          map(pos + eps.xyy) - map(pos - eps.xyy),
                          map(pos + eps.yxy) - map(pos - eps.yxy),
                          map(pos + eps.yyx) - map(pos - eps.yyx)
                          ));
}

// noise
float hash(float n) { return fract(sin(n) * 1e4); }
float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    float u = f * f * (3.0 - 2.0 * f);
    return mix(hash(i), hash(i + 1.0), u);
}

vec3 lightDirection = normalize(vec3(1.0, 0.6, 1.));

float diffuse(vec3 normal){
    float ambient = 0.5;
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

vec3 getRefTexture(vec3 normal, vec3 dir) {
    vec3 eye = -dir;
    vec3 r = reflect( eye, normal );

    vec4 color;
    color = texture2D(iChannel1, (0.5 * (r.xy) + .5));
    //return vec3(1.0, 0.375,0.2);
    return vec3(0.9, 0.9,0.9);
}

vec3 calculateColor(vec3 pos, vec3 dir){
    vec3 normal = computeNormal(pos);
    vec3 color;

    vec3 colTex = getRefTexture(normal, dir);
    float diffLight = diffuse(normal);
    float specLight = specular(normal, dir);
    float fresnelLight = fresnel(normal, dir);
    color = (diffLight + specLight + fresnelLight) * colTex;
    return color;
}

vec3 calculateColor2(vec3 pos, vec3 dir){
    //light via https://vimeo.com/124721382
    vec3 nor = computeNormal(pos);

    //vec3 lig = normalize(vec3(1.,-1.,1.));
    vec3 lig = lightDirection;
    float NL = max(dot(nor, lig),0.);
    float NV = max(dot(nor, -dir),0.);
    NV =  pow(1.-NV, 3.);

    float bli =  max(dot(normalize(lig+-dir), nor), 0.);
    bli = pow(bli, 80.);

    float c = NL + NV * 0.5 + bli;
    return vec3(c) * getRefTexture(nor, dir);
}

void main(){
    vec2 uv = squareFrame(iResolution.xy, gl_FragCoord.xy);
    vec3 eye = vec3(0.0, 0.0,22.5);
    //pMod2(eye.xy, vec2(7.0, 7.0));

    vec3 ta = vec3( -0.0, 0.0, 0.0 );
    mat3 camera = setCamera( eye, ta, 0.0 );
    float fov = 0.6;
    vec3 dir = camera * normalize(vec3(uv, fov));
    //pMod2(dir.xy, vec2(7.0, 7.0));

    float shortestDistanceToScene = raymarching(eye, dir, uv);

    vec3 color;
    vec3 bgColor = vec3(.2, .9, 0.9);

    if (shortestDistanceToScene < FAR_CLIP - EPSILON) {
        vec3 collision = (eye += (shortestDistanceToScene*0.995) * dir );
        color = calculateColor(collision, dir);
        //color = vec3(0.9, 0.3, 0.1);
        float fogFactor = exp(collision.z * 0.01);
        color = mix(bgColor, color, fogFactor);
    } else {
        color = bgColor;
    }

    gl_FragColor = vec4(color , 1.0);

}
