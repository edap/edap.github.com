#define PI 3.14159265359

//glslViewer ../../8video.frag  ../../textures/ocellate-turkey-tex2.jpg  ../../textures/sol.jpg

const int MAX_MARCHING_STEPS = 164;
const float EPSILON = 0.0015;
const float NEAR_CLIP = 0.0;
const float FAR_CLIP = 80.00;
const float SPEED = 1.0;

uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D u_tex0;
uniform sampler2D u_tex1;

//BG
vec2 tile(vec2 st, float zoom){
    st *= zoom;
    return fract(st);
}

float sdCircle( vec2 p, float r ){
  return 1.- smoothstep(0.05, 0.05,length(p) - r);
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
  float n = noise(res*vec2(0.1));
  res.y -= u_time*0.05;
  res += sin(res.yx*40.) * 0.005;
  res += vec2(n);
  return res;
}

// RM

float length2( vec3 p ) { p=p*p; return sqrt( p.x+p.y+p.z); }
float length2( vec2 p ) { p=p*p; return sqrt( p.x+p.y); }
float length6( vec3 p ) { p=p*p*p; p=p*p; return pow(p.x+p.y+p.z,1.0/6.0); }
float length6( vec2 p ) { p=p*p*p; p=p*p; return pow(p.x+p.y,1.0/6.0); }
float length8( vec3 p ) { p=p*p; p=p*p; p=p*p; return pow(p.x+p.y+p.z,1.0/8.0); }
float length8( vec2 p ) { p=p*p; p=p*p; p=p*p; return pow(p.x+p.y,1.0/8.0); }

vec2 squareFrame(vec2 res, vec2 coord){
    return ( 2. * coord.xy - res.xy ) / res.y;
}

vec3 lightDirection = vec3(0.702, 1.9686, 0.6745);

float sphere(vec3 pos, float radius){
    return length(pos) - radius;
}


mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

float smin( float a, float b, float k ){    
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float sdTorus( vec3 p, vec2 t ){
//   vec2 q = vec2(length8(p.xz)-t.x,p.y);
//   return length8(q)-t.y;

  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

float elongatedTorus(in vec3 p, in vec2 dim, in vec3 h )
{
    vec3 q = p - clamp( p, -h, h );
    return sdTorus( q, dim );
}

float waveOfRings(vec3 pos, float dir, float time, float diametro){
    float anim = dir * sin(time * SPEED);
    float expansion = 1.6 * abs(anim); // elongate on y axis
    float sizeT = 0.5; // size of the torus
    float decreasePadding = 1.; // space between the tori
    float k = 1.1; // smin k value
    float yOff = 0.0 + (2.0 * anim); // offsetting on y
    float oscAmp = 0.8;


    vec3 pos1 = pos+vec3(0.,yOff*5., 0.);
    pos1.yz = pos1.yz * rotate2d(dir * sin(time*SPEED) * oscAmp);

    vec3 pos2 = pos+vec3(0.,yOff*4., 0.);
    pos2.yz = pos2.yz * rotate2d(dir * sin(time*SPEED + 0.4*SPEED)* oscAmp);

    vec3 pos3 = pos+vec3(0.,yOff*3., 0.);
    pos3.yz = pos3.yz * rotate2d(dir * sin(time*SPEED + 0.6*SPEED)* oscAmp);

    vec3 pos4 = pos+vec3(0.,yOff*2., 0.);
    pos4.yz = pos4.yz * rotate2d(dir * sin(time*SPEED + 0.9*SPEED)* oscAmp);

    vec3 pos5 = pos+vec3(0.,yOff, 0.);
    pos5.yz = pos5.yz * rotate2d(dir * sin(time*SPEED + 1.2*SPEED)* oscAmp);

    float tor1 = elongatedTorus(pos1,
                                vec2(diametro, sizeT),
                                vec3(0.1,expansion,0.1));
    float tor2 = elongatedTorus(pos2,
                                vec2(diametro-decreasePadding*1., sizeT),
                                vec3(0.1,expansion,0.1));
    float tor3 = elongatedTorus(pos3,
                                vec2(diametro-decreasePadding*2., sizeT),
                                vec3(0.1,expansion,0.1));
    float tor4 = elongatedTorus(pos4,
                                vec2(diametro-decreasePadding*3., sizeT),
                                vec3(0.1,expansion,0.1));
    float tor5 = elongatedTorus(pos5,
                                vec2(diametro-decreasePadding*4., sizeT),
                                vec3(0.1,expansion,0.1));

    float w = smin(tor1, smin(tor2, smin(tor3, smin(tor4,tor5,k), k), k), k);

    //float w = smin(tor1, smin(tor2, smin(tor3, tor4, k), k), k);
    return w;
}

float map(vec3 pos){
    float d4 = sdTorus( pos.xzy, vec2(5.3,1.2));

    vec2 st = squareFrame(u_resolution.xy, gl_FragCoord.xy);
    float offset = mod(st.x , 2.0);
    pos.yz =  pos.yz * rotate2d(-PI/2.);
    //pos.yz =  pos.yz * rotate2d(u_time * SPEED);
    pos.xy =  pos.xy * rotate2d(u_time * SPEED/4.);

    //return waveOfRings(pos, u_time);


    vec3 vertPos = pos;
    float diametro = 0.0;
    float displacement = sin(2.4 * pos.x) *
                         sin(2.4 * pos.y) *
                         sin(2.4 * pos.z) * 0.15;
 
    //vertPos.yz = vertPos.yz * rotate2d(u_time * SPEED * 0.25);
    //vertPos.yz = vertPos.yz * rotate2d(PI);
    //vertPos.xz = vertPos.xz * rotate2d(-PI);
    //vertPos.x -= diametro;

    float v = waveOfRings(vertPos, 1., u_time * SPEED,6.0);
    float o = waveOfRings(pos,-1., u_time+0.5 * SPEED, 5.5);
    float vo = smin(o,v, 0.6);
    return vo;
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

vec3 computeNormal(vec3 pos){
    vec2 eps = vec2(0.01, 0.);
    return normalize(vec3(
        map(pos + eps.xyy) - map(pos - eps.xyy),
        map(pos + eps.yxy) - map(pos - eps.yxy),
        map(pos + eps.yyx) - map(pos - eps.yyx)
    ));
}

float clampeddot(vec3 a, vec3 b){
    return max(0.,dot(a, b));
}

float rim(vec3 surfaceNormal, vec3 towardsEyeDir) {
    return 1. - max(dot(towardsEyeDir, surfaceNormal), 0.0);
}

float diffuse(vec3 normal){
    float ambient = 0.2;
    return clamp( clampeddot(normal, lightDirection) * ambient + ambient, 0.0, 1.0 );
}

float specular(vec3 normal, vec3 dir){
    vec3 h = normalize(normal - dir);
    float specularityCoef = 40.;
    return clamp( pow(clampeddot(h, normal), specularityCoef), 0.0, 1.0);
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

mat3 setCamera( in vec3 ro, in vec3 ta, float cr ){
    vec3 cw = normalize(ta-ro);
    vec3 cp = vec3(sin(cr), cos(cr),0.0);
    vec3 cu = normalize( cross(cw,cp) );
    vec3 cv = cross(cu,cw);
    return mat3( cu, cv, cw );
}

vec3 getTextureCol(sampler2D tex, vec3 normal, vec3 dir) {
    vec3 eye = -dir;
    vec3 r = reflect( eye, normal );
    vec4 c = texture2D(tex, (0.5 * (r.xy) + .5));
    return c.xyz;
}

void main(void){
    vec2 st = squareFrame(u_resolution.xy, gl_FragCoord.xy);

    vec3 red = vec3(0.8784, 0.2, 0.0784);
    vec3 blu = vec3(0.0, 0.2471, 0.7843);
    vec3 bg  = texture2D(u_tex1, st*0.5+ 0.5).xyz;

    vec2 ruv = st * 1.0;
    //ruv = fract(ruv);

    vec3 color = vec3(0.0,0.0,0.0);

    // camera setup
    float camSpeed = SPEED / 16.0;
    // vec3 eye = 5.*vec3(4., 3., 4.);
    // vec3 tangent = vec3(-22.3, -36.0, -1.0);

    vec3 eye = 5.*vec3(0., 1., 4.);
    vec3 tangent = vec3(-.3, -1.0, -1.0);  

    mat3 camera = setCamera( eye, tangent, 0.0 );
    float fov =2.4;
    vec3 dir = camera * normalize(vec3(ruv, fov));

    float shortestDistanceToScene = raymarching(eye, dir);
    if (shortestDistanceToScene < FAR_CLIP - EPSILON) {
        vec3 collision = (eye += (shortestDistanceToScene*0.995) * dir );
        float shadow  = softshadow(collision, lightDirection, 0.02, 2.5 );
        float lightDistance = sphere(collision, 1.0);
        vec3 normal = computeNormal(collision);
        float diffLight = diffuse(normal);
        float specLight = specular(normal, dir);
        vec3 texCol = getTextureCol(u_tex0, normal, dir);

        vec3 rimColor = vec3(0.0902, 0.0, 0.4902);
        float rimContribution = rim(normal, -dir);
        color = (diffLight + specLight ) * texCol;
        color += smoothstep(rimContribution * 19.2, 0.8, 19.2)* rimColor;

        color *= shadow;
    } else {
        st = vectorField(st* 2.0);
        float s = SPEED * 0.5;

        vec2 grid1 = tile(st + vec2(cos(u_time *s ),sin(u_time * s))*0.03,4.);
        color = mix(bg, red,
            sdCircle(grid1 + vec2(-0.5), 0.43) -
            sdCircle(grid1 + vec2(-0.5), 0.1)

        );

        // vec2 grid2 = tile(st + vec2(cos(u_time * s),sin(u_time * s))*0.09 ,1.5);
        // color = mix(color,blu,
        //     sdCircle(grid2 + vec2(-0.5), 0.4) -
        //     sdCircle(grid2 + vec2(-0.5), 0.2)
        // );

        color = bg;
        //color = blu;
    }

    vec3 c = sqrt(clamp(color, 0., 1.));
    gl_FragColor = vec4(c,1.0);
}