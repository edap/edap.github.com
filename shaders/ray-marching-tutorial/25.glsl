precision mediump float;

const int MAX_MARCHING_STEPS = 64;
const float EPSILON = 0.0011;
const float NEAR_CLIP = 0.0;
const float FAR_CLIP = 100.00;
#define PI 3.14159265358979323846

//vec3 lightDirection = normalize(vec3(sin(iGlobalTime), 0.6, 1.));
vec3 lightDirection = normalize(vec3(1.0, 0.6, 1.));
vec2 rotate(vec2 pos, float angle){
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, s, -s, c) * pos;
} 

float smin( float a, float b, float k ){
    float res = exp( -k*a ) + exp( -k*b );
    return -log( res )/k;
}

float smins( float a, float b ){
    return smin(a, b, 3.0);
}

float sdfSphere(vec3 pos, float radius){
    return length(pos) - radius;
}

float sdTorus( vec3 p, vec2 t ){
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

// operations

float bendTorusA( vec3 p, vec2 dim ){
    float wave = sin(iGlobalTime * 2.2) * 0.3;
    float c = cos(wave*p.y);
    float s = sin(wave*p.y);
    mat2  m = mat2(c,-s,s,c);
    vec3  q = vec3(m*p.xy,p.z);
    return sdTorus(q, dim);
}

float bendTorusB( vec3 p, vec2 dim ){
    float wave = sin(iGlobalTime * 2.2) * 0.3;
    float c = sin(wave*p.y);
    float s = cos(wave*p.y);
    mat2  m = mat2(c,-s,s,c);
    vec3  q = vec3(m*p.xy,p.z);
    return sdTorus(q, dim);
}

vec2 opU( vec2 d1, vec2 d2 ){
    return (d1.x < d2.x) ? d1 : d2;
}

vec2 sminsMat(vec2 d1, vec2 d2){
    float d = smin(d1.x, d2.x, 3.0);
    vec2 d1Mat = vec2(d, d1.y);
    vec2 d2Mat = vec2(d, d2.y);
    return (d1.x < d2.x) ? d1Mat : d2Mat;
}

// multiple materials. The x component returns the distance
// field value. The y component returns the material
vec2 map(vec3 pos){
    vec2 res = vec2(0.,0.);
    float diam = 3.;
    float thick = 0.6;
    
    //pos.xz = rotate(pos.xz, sin(iGlobalTime*freqOnXZ)*.7);
	//pos.yz = rotate(pos.yz, cos(iGlobalTime*freqOnYZ)*.7);
    pos.xy = rotate(pos.xy, PI/2.);

    vec3 s2pos = pos - vec3(0., 3.0, 0.);
    vec3 s3pos = pos + vec3(0., 3.0, 0.);

    float s1 = bendTorusA(pos, vec2(diam, thick));
    float s2 = bendTorusB(s2pos, vec2(diam, thick));
    float s3 = bendTorusB(s3pos, vec2(diam, thick));

    vec2 s1Mat = vec2(s1, 0.1); // 0.1 is an arbitrary value for the material
    vec2 s2Mat = vec2(s2, 0.2);
    vec2 s3Mat = vec2(s3, 0.3);
    //return smins(s1, smins(s2, s3));
    res = sminsMat(s1Mat,sminsMat(s2Mat, s3Mat));
    return res;
}

vec2 squareFrame(vec2 res, vec2 coord){
    vec2 uv = 2.0 * coord.xy / res.xy - 1.0;
    uv.x *= res.x / res.y;
    return uv;
}

vec2 raymarching(vec3 eye, vec3 marchingDirection){
    // the x value store the depth distance, the y the material
    vec2 res = vec2(NEAR_CLIP, 0.);
    for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
        vec2 distAndMat = map(eye + res.x * marchingDirection);
        res.y = distAndMat.y;
        if (distAndMat.x < EPSILON){
            return res;
        }
        res.x += distAndMat.x;

        if (distAndMat.x >= FAR_CLIP) {
            res.x = FAR_CLIP;
            return res;
        }
    }
    res.x = FAR_CLIP;
    return res;
}

float softshadow( in vec3 ro, in vec3 rd, in float mint, in float tmax ) {
	float res = 1.0;
    float t = mint;
    for( int i=0; i<16; i++ ) {
		float h = map( ro + rd*t ).x;
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
        float dd = map( aopos ).x;
        occ += -(dd-hr)*sca;
        sca *= 0.95;
    }
    return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );    
}

vec3 computeNormal(vec3 pos){
    vec2 eps = vec2(0.01, 0.);
    return normalize(vec3(
        map(pos + eps.xyy).x - map(pos - eps.xyy).x,
        map(pos + eps.yxy).x - map(pos - eps.yxy).x,
        map(pos + eps.yyx).x - map(pos - eps.yyx).x
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

vec3 getRefTexture(vec3 normal, vec3 dir, float mat) {
    vec3 eye = -dir;
	vec3 r = reflect( eye, normal );
    //eastern-rosella-big.jpg
    vec4 color;
    if(mat == 0.1){
        color = texture2D(iChannel1, (0.5 * (r.xy) + .5));
    }
    else if(mat == 0.2){
        color = texture2D(iChannel2, (0.5 * (r.xy) + .5));
    }
    else if(mat == 0.3){
        color = texture2D(iChannel3, (0.5 * (r.xy) + .5));
    }

    return color.xyz;
}

vec3 calculateColor(vec3 pos, vec3 dir, float mat){
  vec3 normal = computeNormal(pos);
  vec3 color;

  vec3 colTex = getRefTexture(normal, dir, mat);
  float diffLight = diffuse(normal);
  float specLight = specular(normal, dir);
  float fresnelLight = fresnel(normal, dir);
  float ambientOcc = ao(pos, normal);
  color = (diffLight + specLight + fresnelLight) * colTex;
  //return color * ambientOcc;
  return color;
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
    vec3 eye = vec3(0.5, 3.0,19.5);

    vec3 ta = vec3( -0.5, -0.9, 0.5 );
    mat3 camera = setCamera( eye, ta, 0.0 );
    float fov = 4.6;
    vec3 dir = camera * normalize(vec3(uv, fov));

    vec2 distanceAndMat = raymarching(eye, dir);
    float shortestDistanceToScene = distanceAndMat.x;
    float mat = distanceAndMat.y;

    vec3 color;
    vec3 bgColor = vec3(0.1, 0.35, 0.75);

    if (shortestDistanceToScene < FAR_CLIP - EPSILON) {
        vec3 collision = (eye += (shortestDistanceToScene*0.995) * dir );
        float shadow  = softshadow(collision, lightDirection, 0.02, 2.5 );
        color = calculateColor(collision, dir, mat);
        
        shadow = mix(shadow, 1.0, 0.7);
        color = color * shadow;
        float fogFactor = exp(collision.z * 0.04);
        color = mix(bgColor, color, fogFactor);
    } else {
        color = bgColor;
    }

    //gl_FragColor = vec4(clamp(color,0.0,1.0) , 1.0);
    gl_FragColor = vec4(color , 1.0);

}