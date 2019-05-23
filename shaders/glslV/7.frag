#define PI 3.14159265359

// Esperimento modificanto il tempo ad ogni iteration nel raymarching

//glslViewer ../../pattern-vec-field.frag ../../textures/pink-necked-green-pigeon-resized.jpg ../../textures/sol.jpg
const int MAX_MARCHING_STEPS = 164;
const float EPSILON = 0.0015;
const float NEAR_CLIP = 0.0;
const float FAR_CLIP = 80.00;

uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D u_tex0;
uniform sampler2D u_tex1;
uniform sampler2D u_tex2;
uniform sampler2D u_tex3;


vec2 squareFrame(vec2 res, vec2 coord){
    vec2 uv = 2.0 * coord.xy / res.xy - 1.0;
    uv.x *= res.x / res.y;
    return uv;
}


// 2D Random
float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation
    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

vec2 vectorField(vec2 uv){
  vec2 res = uv;
  float n = noise(res*vec2(3.0));
  res.y -= u_time*0.05;
  res += sin(res.yx*40.) * 0.02;
  res += vec2(n);
  return res;
}

float plot(float val, float c, float t){
  float l = smoothstep(c,c-t,val);
  float r = smoothstep(c,c-t/5.,val);
  return r-l;
}


//RM
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
    return smin(a, b, .24);
}

float opTwist(vec3 p, vec2 dim, float t)
{
    float k = 8.0 + sin(t*0.125)*5.5; // or some other amount
    k = 12.0;
    float c = cos(k*p.y);
    float s = sin(k*p.y);
    mat2  m = mat2(c,-s,s,c);
    vec3  q = vec3(m*p.xz,p.y);
    
    return sdTorus(q,dim);
}

float map(vec3 pos, float t){
    pos.x -= 0.35;
    pos.y -= 0.97;
    vec3 rpos = pos;
    rpos.zx =  rpos.zx * rotate2d(sin(t*2.0) * 0.2);

    float s = sphere(rpos, 0.08 + abs(sin(t*0.25) * 0.35));
    float t2 = opTwist(rpos,vec2(0.55,.05), t);
    float t3 = opTwist(rpos,vec2(0.4,.03), t);

    //return smins(t2,t3);
    //return t2;
    return smins(s,smins(t2,t3));
}
    

float raymarching(vec3 eye, vec3 marchingDirection, float t){
    float depth = NEAR_CLIP;
    float a = t;
    for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
        //a *= 1.1;
        float dist = map(eye + depth * marchingDirection, a);
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

float softshadow( in vec3 ro, in vec3 rd, in float mint, in float tmax, float time) {
    float res = 1.0;
    float t = mint;
    for( int i=0; i<16; i++ ) {
        float h = map( ro + rd*t , time);
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
        float dd = map( aopos, u_time);
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
        map(pos + eps.xyy, u_time) - map(pos - eps.xyy, u_time),
        map(pos + eps.yxy, u_time) - map(pos - eps.yxy, u_time),
        map(pos + eps.yyx, u_time) - map(pos - eps.yyx, u_time)
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

vec3 getTextureCol(vec3 normal, vec3 dir) {
    vec3 eye = -dir;
    vec3 r = reflect( eye, normal );
    vec4 c = texture2D(u_tex2, (0.5 * (r.xy) + .5));
    return c.xyz;
}

void main(void){
  vec3 lime = vec3(0.733, 1.0, 0.31);
  vec3 red = vec3(1.0, 0.353, 0.208);
  vec3 blu = vec3(0.086, 0.29, 0.8);
  vec3 redHard = vec3(0.698, 0.188, 0.075);
  vec3 blueHard = vec3( 0.098, 0.0, 0.749);
  float t = 0.2;

  vec2 st = squareFrame(u_resolution.xy, gl_FragCoord.xy);
  // net coord
  vec2 uv = st;
  //ray marching coord
  vec2 ruv = st * 1.;

  //ruv = fract(ruv);
  float camSpeed = 1.0;

  // TODO, trova una camera che esalta i pezzi piccoli,
  // gioca con diverse frequenze fra gli anelli

        // vec3 eye = vec3(0.,1.0,20.0);
        // vec3 ta = vec3(-0.55, 0.0, -1.0);  
        // mat3 camera = setCamera( eye, ta, 0.0 );
        //float fov = 11.4;


    vec3 eye = vec3(0.5,1.0,20.0);
    vec3 ta = vec3(0.3, 1.0, -1.0);  
    mat3 camera = setCamera( eye, ta, 0.0 );
    float fov = 18.4;




    vec3 dir = camera * normalize(vec3(ruv, fov));
  
    const int iter = 16;

    vec3 color;
    for(int i = 0; i < iter; i++) {
        float fi = float(i)/float(iter)*2.*355.0/113.0;
        vec2 nn = vec2(cos(float(fi)), sin(float(fi)));
        vec3 offs = vec3(nn.x,nn.y, .0)*.03;

        float shortestDistanceToScene = raymarching(eye, dir, u_time);

        if (shortestDistanceToScene < FAR_CLIP - EPSILON) {
            vec3 collision = (eye += (shortestDistanceToScene*0.995) * dir );

            float shadow  = softshadow(collision, lightDirection, 0.02, 2.5 , u_time);
            float lightDistance = sphere(collision, 1.0);
            vec3 normal = computeNormal(collision);
            float diffLight = diffuse(normal);
            float specLight = specular(normal, dir);
            float fresnelLight = fresnel(normal, dir);
            float ambientOcc = ao(collision, normal);
            //vec3 texCol = vec3(1.00, 0.352, 0.207);
            vec3 texCol =  getTextureCol(normal, dir);
            //color += (diffLight + specLight + fresnelLight) * texCol;
            color += texCol;
            //shadow = mix(shadow, 1.0, 0.6);
            //color = color *  shadow;
            //color = color * ambientOcc * shadow;
            
        }
        //else {
        //     uv = vectorField(st* 2.0);

        //     float cell = 0.6;
        //     vec2 modSt = mod(uv, vec2(cell));

        //     float x = plot(modSt.x, cell, t);
        //     float y = plot(modSt.y, cell, t);

        //     vec3 texc = texture2D(u_tex3, uv).xyz;
        //     // color = blu * x;
        //     // color     += red * y;
        //     // color     += texc*vec3(smoothstep(1.3, .01,x+y));
        //     //color += vec3(1,0,0);
        // }
    }

  //color = vec4(color / float(iter), 1.0);
  gl_FragColor = vec4(color / float(iter), 1.0);
}