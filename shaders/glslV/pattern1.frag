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

float opTwist(vec3 p, vec2 dim  )
{
    float k = sin(u_time*0.3)*8.5; // or some other amount
    float c = cos(k*p.y);
    float s = sin(k*p.y);
    mat2  m = mat2(c,-s,s,c);
    vec3  q = vec3(m*p.xz,p.y);
    return sdTorus(q,dim);
}

float map(vec3 pos){
    //pos = opRep(pos, vec3(18.));
    vec3 vertPos = pos;
    float diametro = 2.3;

    vertPos.yz = vertPos.yz * rotate2d(PI/2.0);
    vertPos.xz = vertPos.xz * rotate2d(-PI);
    //vertPos.x -= diametro;
    vec3 rpos = pos;
    rpos.x -= 0.35;
    rpos.y -= 0.97;
    // TODO
    //rpos.xz =  rpos.xz * rotate2d(sin(u_time*0.15) * 0.9);

    float t1 = opTwist(rpos,vec2(0.2,.04));  
    float t2 = opTwist(rpos,vec2(0.4,.06));
    float t3 = opTwist(rpos,vec2(0.65,.08));
    return smins(t1,smins(t2,t3));

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
    vec4 c = texture2D(u_tex1, (0.5 * (r.xy) + .5));
    return c.xyz;
}

void main(void){

    vec2 uv = squareFrame(u_resolution.xy, gl_FragCoord.xy);
    uv *= 1.0;
    uv = fract(uv);
    float camSpeed = 1.0;

    // TODO, trova una camera che esalta i pezzi piccoli,
    // gioca con diverse frequenze fra gli anelli
    vec3 eye;
    if(true){
        eye = vec3( 
                    9.5,
                    3.0,
                    20
    );
    }
    else{
        eye = vec3( 
                    4.5-7.0*cos(camSpeed*u_time),
                    0.2-0.2*sin(camSpeed*u_time),
                    5.3-1.9*cos(camSpeed*u_time)
        );
    }

    vec2 rotEye = vec2(10.0,10.0);
    rotEye = rotEye * rotate2d(-sin(u_time*0.2)* 2.0);
    //vec3 eye = vec3( rotEye.x,5.0, rotEye.y);
    vec3 ta = vec3(-1.0, 0.0, -1.0);
    
    mat3 camera = setCamera( eye, ta, 0.0 );
    float fov = 14.4;
    vec3 dir = camera * normalize(vec3(uv, fov));
    // TODO
    //eye.y += pow(uv.x,2.0);
    float shortestDistanceToScene = raymarching(eye, dir);

    vec3 color;
    // BG
    vec2 tuv = (gl_FragCoord.xy/1.8)/ u_resolution.xy;
    tuv.x *= u_resolution.x / u_resolution.y;
    float grid = step(0.003, mod(uv.x, 0.2)) * 
                 step(0.003, mod(uv.y, 0.2));

    // TODO
    //float grid = smoothstep(0.1, 0.2, mod(uv.x, 0.2));
    vec3 bgColor = texture2D(u_tex2, tuv).xyz * grid;
    //vec3 bgColor = vec3(0.086, 0.290, 0.800);
    bgColor +=  vec3(0.086, 0.290, 0.800) * (1.0-grid);

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