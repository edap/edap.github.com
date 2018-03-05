precision mediump float;

const int MAX_MARCHING_STEPS = 64;
const float EPSILON = 0.01;
const float NEAR_CLIP = 0.0;
const float FAR_CLIP = 100.00;
vec3 lightDirection = normalize(vec3(1.0, 0.6, 0.));


float sdfSphere(vec3 p, float r){
    return length(p) - r;
}

float perturbedSphere(vec3 p, float r, float dir){
    //return length(p) - r + sin(p.x*3.14*10. + iGlobalTime*5.*dir) * 0.01
    //                    + sin(p.z*3.14*30. + iGlobalTime*5.) * 0.01;
    return length(p) - r + sin(p.x*3.14*10. + iGlobalTime*5.*dir) * 0.01;
}

float smin( float a, float b, float k ){
    float res = exp( -k*a ) + exp( -k*b );
    return -log( res )/k;
}


vec3 opRep( vec3 p, vec3 c ){
    return mod(p,c)-0.5*c;
}


float map(vec3 pos){
    float offset = 3.;
    pos = opRep(pos, vec3(offset, offset, offset));

    //float s = sdfSphere(pos, 0.5);
    float s = sdfSphere(pos, 0.7);
    float pert = perturbedSphere(pos+vec3(-.48,0,0), 0.5, 1.);
    float pert2 = perturbedSphere(pos+vec3(+.48,0,0), 0.5, -1.);

    return max(smin(pert, pert2, 9.1), s);
    //return smin(pert, pert2, 9.1);
}

//light
vec3 computeNormal(vec3 pos){
    vec2 eps = vec2(0.01, 0.);
    return normalize(vec3(
        map(pos + eps.xyy) - map(pos - eps.xyy),
        map(pos + eps.yxy) - map(pos - eps.yxy),
        map(pos + eps.yyx) - map(pos - eps.yyx)
    ));
}


vec3 calculateColor2(vec3 pos, vec3 dir){
  //light via https://vimeo.com/124721382
  vec3 nor = computeNormal(pos);

  //vec3 lig = normalize(vec3(1.,1.,1.));
  vec3 lig = normalize(vec3(1.,sin(iGlobalTime*5.)*3.+.5, 1.));
  float NL = max(dot(nor, lig),0.);
  float NV = max(dot(nor, -dir),0.);
  NV =  pow(1.-NV, 3.);
  
  float bli =  max(dot(normalize(lig+-dir), nor), 0.);
  bli = pow(bli, 80.);

  float c = NL + NV * 0.5 + bli;
  return vec3(c);
}

vec2 squareFrame(vec2 res, vec2 coord){
    vec2 uv = 2.0 * coord.xy / res.xy - 1.0;
    uv.x *= res.x / res.y;
    return uv;
}

mat3 setCamera( in vec3 ro, in vec3 ta, float cr ){
    vec3 cw = normalize(ta-ro);
    vec3 cp = vec3(sin(cr), cos(cr),0.0);
    vec3 cu = normalize( cross(cw,cp) );
    vec3 cv = normalize( cross(cu,cw) );
    return mat3( cu, cv, cw );
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

void main(){
    vec2 uv = squareFrame(iResolution.xy, gl_FragCoord.xy);
    vec3 eye = vec3(0.0, 0.0, 3.);
    float fov = -3.;
    vec3 dir = normalize(vec3(uv, fov));

    float shortestDistanceToScene = raymarching(eye, dir);

    vec3 color;
    vec3 bgColor = vec3(0.1, 0.35, 0.75);

    if (shortestDistanceToScene < FAR_CLIP - EPSILON) {
        vec3 collision = (eye += (shortestDistanceToScene*0.995) * dir );
        color = calculateColor2(collision, dir);
        //color *= vec3(1.);
        //color += collision.y * vec3(0.2, 0.7, 0.1);
    } else {
        color = bgColor;
    }


    gl_FragColor = vec4(color, 1.0);
}