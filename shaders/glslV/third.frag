// glslViewer test.frag textures/punta-alaintera.jpg

#define PI 3.14159265359
const int MAX_MARCHING_STEPS = 164;
const float EPSILON = 0.0015;
const float NEAR_CLIP = 0.0;
const float FAR_CLIP = 80.00;


uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform sampler2D u_tex0;
uniform sampler2D u_tex1;
uniform sampler2D u_tex2;
uniform sampler2D u_tex3;


//vec3 lightDirection = normalize(vec3(sin(u_time), 0.6, 1.));
vec3 lightDirection = vec3(0.702, 1.9686, 0.6745);

float opSubtraction( float d1, float d2 ) { return max(-d1,d2); }

float sphere(vec3 pos, float radius){
    return length(pos) - radius;
}
float onion( in float d, in float h )
{
    return abs(d)-h;
}
float sdBox( vec3 p, vec3 b ){
    vec3 d = abs(p) - b;
    return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float bendBox( vec3 p, vec3 dim ){
    float wave = sin(u_time * 2.0) * 0.01;
    //float wave = 7.2;
    float c = cos(wave*p.x);
    float s = sin(wave*p.x);
    mat2  m = mat2(c,-s,s,c);
    //vec3  q = vec3(m*p.xy,p.z);
    //vec3  q = vec3( p.x, m*p.yz);
    vec3  q = vec3(p.xy*m, p.z);
    return sdBox(q, dim);
}

float sdTorus( vec3 p, vec2 t ){
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

vec3 opRep( vec3 p, vec3 c ){
    return mod(p,c)-0.5*c;
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
    return smin(a, b, 3.0);
}

float bendTorus( vec3 p, vec2 dim ){
    float wave = sin(u_time * 2.0) * 0.02;
    //float wave = 7.2;
    float c = cos(wave*p.x);
    float s = sin(wave*p.x);
    mat2  m = mat2(c,-s,s,c);
    //vec3  q = vec3(m*p.xy,p.z);
    //vec3  q = vec3( p.x, m*p.yz);
    vec3  q = vec3( p.xy*m, p.z);
    return sdTorus(q, dim);
}

float nestedRings(vec3 _pos){
    float speed = 2.;
    float thick = 0.17;
    float diametro = 4.7;
    float off = -0.6;
    float off1 = 0.8;
    float off2 = 1.2;
    float off3 = 1.6;

    float d = onion(bendTorus( _pos.xzy, vec2(diametro,0.2) ), thick);
    d = max( d, _pos.x+sin(u_time*speed)*diametro);

    float d1 =onion(bendTorus( _pos.xzy, vec2(diametro,0.6)), thick-0.01);
    d1 = max( d1, _pos.x+sin((u_time-off)*speed)*diametro);

    float d2 = onion(bendTorus( _pos.xzy, vec2(diametro,1.0)), thick-0.02);
    d2 = max( d2, _pos.x+sin((u_time-off1)*speed)*diametro);

    float d3 = onion(bendTorus( _pos.xzy, vec2(diametro,1.4)), thick-0.03);
    d3 = max( d3, _pos.x+sin((u_time-off2)*speed)*diametro);

    float d4 = onion(bendTorus( _pos.xzy, vec2(diametro,1.8)), thick-0.04);
    d4 = max( d4, _pos.x+sin((u_time-off3)*speed)*diametro);

    return min(d4, min(d3, min(d2, min(d, d1))));
}

float map(vec3 pos){
    vec3 vertPos = pos;
    float diametro = 2.3;

    vertPos.yz = vertPos.yz * rotate2d(PI/2.0);
    vertPos.xz = vertPos.xz * rotate2d(-PI);
    vertPos.x -= diametro;
    
    vec3 boxDim = vec3(7.1, 7.1, .4);
    float o = nestedRings(vertPos); 
    float box = bendBox(vertPos, boxDim);
    float boxRingO = opSubtraction(box, o);

    float v = nestedRings(pos);
    float boxV = bendBox(pos, boxDim); 
    float boxRingV = opSubtraction(boxV, v);

    float vo = smin(boxRingO,boxRingV, 2.0);

    return vo;
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

vec3 getTextureCol(vec3 normal, vec3 dir) {
    vec3 eye = -dir;
    vec3 r = reflect( eye, normal );
    vec4 c = texture2D(u_tex0, (0.5 * (r.xy) + .5));
    return c.xyz;
}

void main(void){

    vec2 uv = squareFrame(u_resolution.xy, gl_FragCoord.xy);
    float camSpeed = 1.0;

    // TODO, trova una camera che esalta i pezzi piccoli,
    // gioca con diverse frequenze fra gli anelli
    vec3 eye = vec3( 
                4.5-7.0*cos(camSpeed*u_time),
               //5.5,
                0.2-0.2*sin(camSpeed*u_time),
                5.3-1.9*cos(camSpeed*u_time)
                //9.0
                //0.3
    );
    //float u_time = 4.1;

    vec2 rotEye = vec2(10.0,10.0);
    rotEye = rotEye * rotate2d(-sin(u_time*0.2)* 2.0);
    //vec3 eye = vec3( rotEye.x,5.0, rotEye.y);
    vec3 ta = vec3(-3.0, 0.0, -1.0);
    
    mat3 camera = setCamera( eye, ta, 0.0 );
    float fov = 1.4;
    vec3 dir = camera * normalize(vec3(uv, fov));
    float shortestDistanceToScene = raymarching(eye, dir);

    vec3 color;
    // BG
    vec2 tuv = (gl_FragCoord.xy/1.8)/ u_resolution.xy;
    tuv.x *= u_resolution.x / u_resolution.y;
    vec3 bgColor = texture2D(u_tex1, tuv).xyz;
    //vec3 bgColor = vec3(0.086, 0.290, 0.800);

    if (shortestDistanceToScene < FAR_CLIP - EPSILON) {
        vec3 collision = (eye += (shortestDistanceToScene*0.995) * dir );
        float shadow  = softshadow(collision, lightDirection, 0.02, 2.5 );
        float lightDistance = sphere(collision, 1.0);
        vec3 normal = computeNormal(collision);
        float diffLight = diffuse(normal);
        float specLight = specular(normal, dir);
        float fresnelLight = fresnel(normal, dir);
        float ambientOcc = ao(collision, normal);
        //vec3 texCol = vec3(1.00, 0.352, 0.207);
        vec3 texCol =  getTextureCol(normal, dir);
        color = (diffLight + specLight + fresnelLight) * texCol;
        
        shadow = mix(shadow, 1.0, 0.7);
        color = color * ambientOcc * shadow;

    } else {
        color = bgColor;
    }
    
    
    //fragColor = vec4(color);
    float fogFactor = exp(eye.z * 0.19);
    //color = mix(vec3(bgColor), color, fogFactor);
    //color = pow(color, vec3(1.1545)); // gamma corr
    
    gl_FragColor = vec4(clamp(color,0.0,1.0) , 1.0);
}