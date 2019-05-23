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


vec2 rotate2D (vec2 _st, float _angle) {
    _st -= 0.5;
    _st =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}
    
vec2 squareFrame(vec2 res, vec2 coord){
    vec2 uv = 2.0 * coord.xy / res.xy - 1.0;
    uv.x *= res.x / res.y;
    return uv;
}



float plot(vec2 st, float pct, float th){
  return  smoothstep( pct-th, pct, st.y) -
          smoothstep( pct, pct+th, st.y);
}

vec2 rotateTilePattern(vec2 _st){

    //  Scale the coordinate system by 2x2
    _st *= 2.0;

    //  Give each cell an index number
    //  according to its position
    float index = 0.0;
    index += step(1., mod(_st.x,2.0));
    index += step(1., mod(_st.y,2.0))*2.0;

    //      |
    //  2   |   3
    //      |
    //--------------
    //      |
    //  0   |   1
    //      |

    // Make each cell between 0.0 - 1.0
    _st = fract(_st);

    // Rotate each cell according to the index
    if(index == 1.0){
        //  Rotate cell 1 by 90 degrees
        _st = rotate2D(_st,PI*0.5);
    } else if(index == 2.0){
        //  Rotate cell 2 by -90 degrees
        _st = rotate2D(_st,PI*-0.5);
    } else if(index == 3.0){
        //  Rotate cell 3 by 180 degrees
        _st = rotate2D(_st,PI);
        //_st.y+= 0.2;
    }

    return _st;
}

// inigo gain function
float gain(float x, float k) 
{
    float a = 0.5*pow(2.0*((x<0.5)?x:1.0-x), k);
    return (x<0.5)?a:1.0-a;
}

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
    float k = sin(u_time*0.25)*10.5; // or some other amount
    float c = cos(k*p.y);
    float s = sin(k*p.y);
    mat2  m = mat2(c,-s,s,c);
    vec3  q = vec3(m*p.xz,p.y);
    
    return sdTorus(q,dim);
}

float map(vec3 pos){
    pos.x -= 0.35;
    pos.y -= 0.97;
    vec3 rpos = pos;
    rpos.zx =  rpos.zx * rotate2d(sin(u_time*2.0) * 0.2);

    float s = sphere(rpos, 0.3);
    float t2 = opTwist(rpos,vec2(0.4,.1));
    float t3 = opTwist(rpos,vec2(0.55,.03));

    return smins(s,smins(t2,t3));
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
  vec3 lime = vec3(0.733, 1.0, 0.31);
  vec3 red = vec3(1.0, 0.353, 0.208);
  vec3 blu = vec3(0.086, 0.29, 0.8);
    vec3 blueHard = vec3( 0.098, 0.0, 0.749);

    vec2 st = squareFrame(u_resolution.xy, gl_FragCoord.xy);



    vec2 ruv = st;
    //ruv *= 2.0;
    ruv = fract(ruv);
    float camSpeed = 1.0;

    // TODO, trova una camera che esalta i pezzi piccoli,
    // gioca con diverse frequenze fra gli anelli
    vec3 eye = vec3( 
        9.5,
        3.0,
        20
    );

    vec2 rotEye = vec2(10.0,10.0);
    rotEye = rotEye * rotate2d(-sin(u_time*0.2)* 2.0);
    //vec3 eye = vec3( rotEye.x,5.0, rotEye.y);
    vec3 ta = vec3(-1.0, 0.0, -1.0);
    
    mat3 camera = setCamera( eye, ta, 0.0 );
    float fov = 14.4;
    vec3 dir = camera * normalize(vec3(ruv, fov));
    // TODO
    //eye.y += pow(uv.x,2.0);
    float shortestDistanceToScene = raymarching(eye, dir);

    vec3 color;


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
        float t = (u_time-30.0) * 0.25;

        //net
        vec2 uv = st;
        uv *= 4.0;
        uv = fract(uv);
        uv = rotateTilePattern(uv);
        float y = gain(uv.x, 0.49 + tan(t)* 0.1);
        float net = plot(uv, y, 0.07);

        //segments
        vec2 uv2 = rotateTilePattern(st) *2.0;
        uv2 = fract(uv2);
        uv2 += vec2(sin(t), cos(t)) * 0.05;
        float segments = plot(uv2, y, 0.09);

        //texture
        vec3 texc = texture2D(u_tex2, st).xyz;

        //compose
        float l = net + segments;
        vec3 bgColor = blu * (1.0 - l);
        bgColor += red * net;
        bgColor += texc * segments;
        //color  = segments * red;
        color = bgColor;
    }
    
    
    //fragColor = vec4(color);
    //float fogFactor = exp(eye.z * 0.19);
    //color = mix(vec3(bgColor), color, fogFactor);
    color = pow(color, vec3(1.1545)); // gamma corr
    
    gl_FragColor = vec4(clamp(color,0.0,1.0) , 1.0);
}