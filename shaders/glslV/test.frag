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
vec3 lightDirection = vec3(0.702, 0.1686, 0.6745);

float opSubtraction( float d1, float d2 ) { return max(-d1,d2); }

float sdBox( vec3 p, vec3 b ){
    vec3 d = abs(p) - b;
    return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float sphere(vec3 pos, float radius){
    return length(pos) - radius;
}
float onion( in float d, in float h )
{
    return abs(d)-h;
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
    float wave = sin(u_time * 2.0) * 0.2;
    //float wave = 7.2;
    float c = cos(wave*p.x);
    float s = sin(wave*p.x);
    mat2  m = mat2(c,-s,s,c);
    //vec3  q = vec3(m*p.xy,p.z);
    //vec3  q = vec3( p.x, m*p.yz);
    vec3  q = vec3( p.xy*m, p.z);
    return sdTorus(q, dim);
}

float bendBox( vec3 p, vec3 dim ){
    float wave = sin(u_time * 2.0) * 0.2;
    //float wave = 7.2;
    float c = cos(wave*p.x);
    float s = sin(wave*p.x);
    mat2  m = mat2(c,-s,s,c);
    //vec3  q = vec3(m*p.xy,p.z);
    vec3  q = vec3( p.x, m*p.yz);
    //vec3  q = vec3( p.xy*m, p.z);
    return sdBox(q, dim);
}


float sdEllipsoid( in vec3 p, in vec3 r ){
    float k0 = length(p/r);
    float k1 = length(p/(r*r));
    return k0*(k0-1.0)/k1;
}


float sdRoundBox( vec3 p, vec3 b, float r ){
  vec3 d = abs(p) - b;
  return length(max(d,0.0)) - r
         + min(max(d.x,max(d.y,d.z)),0.0);
}

float map(vec3 pos){

    // triple onion torus
    //d = min( d, onion(onion(onion(bendTorus( q.xzy, vec2(0.9,0.6) ), 0.19), 0.19), 0.03) );
    float thick = 0.08;
    float d = onion(bendTorus( pos.xzy, vec2(1.0,0.2) ), thick);
    // cut it all in half so we can see the interiors
    d = max( d, pos.y+cos(u_time+1.2));
    //d = max( d, pos.y - 0.5);

    float d1 = min(d, onion(bendTorus( pos.xzy, vec2(1.1,0.5) ), thick-0.01));
    d1 = max( d1, pos.x+sin(u_time-0.3));

    float d2 = min(d1,onion(bendTorus( pos.xzy, vec2(1.2,0.8) ), thick-0.02));
    d2 = max( d2, pos.y+cos(u_time-0.9));
    //d2 = max( d2, pos.y);

    float d3 = min(d2,onion(bendTorus( pos.xzy, vec2(1.3,1.1) ), thick-0.03));
    d3 = max( d3, pos.x+sin(u_time+0.5));
    //d3 = max( d3, pos.y);
    //return d;
    vec3 posBox = pos;
    float boxZ = 0.1;
    //posBox.x -= 8.0;
    //posBox.z -= boxZ/2.0;
    //float box = sdBox(posBox, vec3(0.5, 2.1, 4.4));
    float box = bendBox(posBox, vec3(12.5, 3.1, boxZ));
    
    //return box;
    //return d;
    float sp = min(d3,min(d2,min(d1, d)));
    return opSubtraction(box,sp);
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
    float ambient = 0.3;
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
    vec4 c = texture2D(u_tex1, (0.5 * (r.xy) + .5));
    return c.xyz;
}



void main(void){

    vec2 uv = squareFrame(u_resolution.xy, gl_FragCoord.xy);
    float camSpeed = 1.0;
    vec3 eye = vec3( 
               0.5-2.5*sin(camSpeed*u_time),
               //5.5,
                2.5,
                2.3 + 3.0*cos(camSpeed*u_time)
                //3.0
                //0.3
    );

    // vec3 eye = vec3( 8.0,
    //             3.0,
    //             11.0
    // );

    vec3 ta = vec3(0.0, 0.0, 0.0 );
    
    mat3 camera = setCamera( eye, ta, 0.0 );
    float fov = 2.0;
    vec3 dir = camera * normalize(vec3(uv, fov));
    float shortestDistanceToScene = raymarching(eye, dir);

    vec3 color;
    // BG
    vec2 tuv = (gl_FragCoord.xy/1.8)/ u_resolution.xy;
    tuv.x *= u_resolution.x / u_resolution.y;
    vec3 bgColor = texture2D(u_tex2, tuv).xyz;
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
    float fogFactor = exp(eye.z * 0.05);
    //color = mix(vec3(bgColor), color, fogFactor);
    //color = pow(color, vec3(0.4545)); // gamma corr
    
    gl_FragColor = vec4(clamp(color,0.0,1.0) , 1.0);
}