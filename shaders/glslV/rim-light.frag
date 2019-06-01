#define PI 3.14159265359
const int MAX_MARCHING_STEPS = 164;
const float EPSILON = 0.0015;
const float NEAR_CLIP = 0.0;
const float FAR_CLIP = 80.00;
const float speed = 1.0;

uniform float u_time;
uniform vec2 u_resolution;

/**
 * Generic random
 */
float random(vec3 scale, float seed) {
  return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
}

float length8( vec2 p ) { p=p*p; p=p*p; p=p*p; return pow(p.x+p.y,1.0/8.0); }

vec2 squareFrame(vec2 res, vec2 coord){
    return ( 2. * coord.xy - res.xy ) / res.y;
}

vec3 lightDirection = vec3(0.702, 1.9686, 0.6745);

float sphere(vec3 pos, float radius){
    return length(pos) - radius;
}
float onion( in float d, in float h )
{
    return abs(d)-h;
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
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length8(q)-t.y;
}

float bendTorus( vec3 p, vec2 dim ){
    float wave = sin(u_time * 4.0) * 0.02;
    //float wave = 7.2;
    float c = cos(wave*p.x);
    float s = sin(wave*p.x);
    mat2  m = mat2(c,-s,s,c);
    //vec3  q = vec3(m*p.xy,p.z);
    //vec3  q = vec3( p.x, m*p.yz);
    vec3  q = vec3( p.xy*m, p.z);
    return sdTorus(q, dim);
}

float nestedRings(vec3 _pos, float speed){

    float thick = 0.29;
    float diametro = 5.3;
    float off = 0.2;
    float off1 = 0.6;
    float off2 = 1.0;
    float off3 = 1.2;

    float d = onion(bendTorus( _pos.xzy, vec2(diametro,0.2) ), thick);
    d = max( d, _pos.x+sin(u_time*speed)*diametro);

    float d1 =onion(bendTorus( _pos.xzy, vec2(diametro,0.6)), thick-0.01);
    d1 = max( d1, _pos.x+sin(u_time*speed-off)*diametro);

    float d2 = onion(bendTorus( _pos.xzy, vec2(diametro,1.0)), thick-0.02);
    d2 = max( d2, _pos.x+sin(u_time*speed-off1)*diametro);

    float d3 = onion(bendTorus( _pos.xzy, vec2(diametro,1.4)), thick-0.03);
    d3 = max( d3, _pos.x+sin(u_time*speed-off2)*diametro);

    float d4 = onion(bendTorus( _pos.xzy, vec2(diametro,1.8)), thick-0.04);
    d4 = max( d4, _pos.x+sin(u_time*speed-off3)*diametro);

    //return min(d4, d);
    return min(d4, min(d3, min(d2, min(d, d1))));
}

float map(vec3 pos){
    vec3 vertPos = pos;
    float diametro = 3.3;
    float displacement = sin(2.2 * pos.x) *
                         sin(2.0 * pos.y) *
                         sin(2.2 * pos.z) * 0.25;

    vertPos.yz = vertPos.yz * rotate2d(PI/2.0);
    vertPos.xz = vertPos.xz * rotate2d(-PI);
    vertPos.x -= diametro;
    
    float v = nestedRings(vertPos, speed);
    float o = nestedRings(pos, speed) + displacement;
    float vo = smin(o,v, 0.2);
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

float diffuse(vec3 normal){
    float ambient = 0.4;
    return clamp( dot(normal, lightDirection) * ambient + ambient, 0.0, 1.0 );
}

float specular(vec3 normal, vec3 dir){
    vec3 h = normalize(normal - dir);
    float specularityCoef = 40.;
    return clamp( pow(max(dot(h, normal), 0.), specularityCoef), 0.0, 1.0);
}


/**
 * RIM
 * http://roxlu.com/2014/037/opengl-rim-shader
 */
float rim(vec3 surfaceNormal, vec3 towardsEyeDir) {
    return 1. - max(dot(towardsEyeDir, surfaceNormal), 0.0);
}



/**
 * Generic fresnel
 */
// float fresnel(float costheta, float fresnelCoef) {
//   return fresnelCoef + (1. - fresnelCoef) * pow(1. - costheta, 5.);
// }

float fresnel(vec3 normal, vec3 dir){
    return pow( clamp(1.0+dot(normal,dir),0.0,1.0), 2.0 );
}

mat3 setCamera( in vec3 ro, in vec3 ta, float cr ){
    vec3 cw = normalize(ta-ro);
    vec3 cp = vec3(sin(cr), cos(cr),0.0);
    vec3 cu = normalize( cross(cw,cp) );
    vec3 cv = cross(cu,cw);
    return mat3( cu, cv, cw );
}

void main(void){
    vec3 red = vec3(0.8784, 0.2, 0.0784);
    vec3 blu = vec3(0.0, 0.2471, 0.7843);
    vec2 st = squareFrame(u_resolution.xy, gl_FragCoord.xy);

    // this is the accumulated color
    vec3 color = vec3(0.0,0.0,0.0);

    // Depth of field variables
    float lensResolution = 3.0;
    float focalLenght = 20.0;
    float lensAperture = 0.3;
    float shiftIteration = 0.0;
    float inc = 1.0/lensResolution;
    float start = inc/2.0-0.5;

    // camera setup
    float camSpeed = 0.1;
     vec3 eye = 18.0*vec3(
         sin(4.0* u_time * camSpeed),
         cos(4.0* u_time * camSpeed),
         cos(4.0* u_time * camSpeed)); 
    //vec3 eye = 5.*vec3(4., 3., 4.);
    vec3 tangent = vec3(0.3, 1.0, -1.0);  
    mat3 camera = setCamera( eye, tangent, 0.0 );
    float fov = 2.5;
    vec3 dir = camera * normalize(vec3(st, fov));


    float shortestDistanceToScene = raymarching(eye, dir);
    if (shortestDistanceToScene < FAR_CLIP - EPSILON) {
        vec3 collision = (eye += (shortestDistanceToScene*0.995) * dir );

        float lightDistance = sphere(collision, 1.0);
        vec3 normal = computeNormal(collision);
        float diffLight = diffuse(normal);
        float specLight = specular(normal, dir);
        color = red;
        //color += fresnel(normal, dir);

        vec3 rimColor = vec3(0.0902, 0.0, 0.4902);
        float rimStart = 2.;
        float rimEnd = 2.6;
        float rimContribution = rim(normal, -dir);
        //color += rimContribution * rimColor;

        // you can amplify the contrib
        //color += rimContribution * 2.2 * rimColor;

        // or amplify and smooth it
        //color += smoothstep(rimContribution * 2.2, 1.0, 2.2)* rimColor;

      color += (diffLight + specLight ) * red;
    } else {
      color += blu;
    }

    vec3 c = sqrt(clamp(color, 0., 1.));
	  //vec3 c = sqrt(clamp(color/shiftIteration, 0., 1.));
    gl_FragColor = vec4(c,1.0);
}