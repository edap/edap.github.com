const int MAX_MARCHING_STEPS = 164;
const float EPSILON = 0.0015;
const float NEAR_CLIP = 0.0;
const float FAR_CLIP = 80.00;

uniform float u_time;
uniform vec2 u_resolution;

vec2 squareFrame(vec2 res, vec2 coord){
    return ( 2. * coord.xy - res.xy ) / res.y;
}

vec3 lightDirection = vec3(0.702, 1.9686, 0.6745);

float sphere(vec3 pos, float radius){
    return length(pos) - radius;
}

float smin( float a, float b, float k ){    
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float map(vec3 pos){
    vec3 pos0 = pos + vec3(1.9,-1.1,-3.8);
    vec3 pos1 = pos + vec3(-1.9, 0.0, 3.8);

    float s = sphere(pos0, 2.15);
    float s1 = sphere(pos, 1.35);
    float s2 = sphere(pos1, 1.95);
    
    return smin(s,smin(s1,s2, .24), .24);
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
    float camSpeed = 0.3;
    vec3 eye = 10.0*vec3(
        sin(4.0*u_time * camSpeed),
        cos(3.0*u_time * camSpeed),
        cos(4.0*u_time * camSpeed)); 
    vec3 tangent = vec3(0.3, 1.0, -1.0);  
    mat3 camera = setCamera( eye, tangent, 0.0 );
    float fov = 2.4;
    vec3 dir = camera * normalize(vec3(st, fov));

    // calculate the focal point
    vec3 focalPoint = eye + (dir * focalLenght);

    // loop that:
    // 1) shifts the ray origin 
    // 2) uses that origin to get a secondary ray
    // that points toward the focal point
    // 3) raymarch using these 2 variables
    // 4) accumulate the result in the vec3 color
    for (float stepX = start; stepX < 0.5; stepX+=inc){
        for (float stepY = start; stepY < 0.5; stepY+=inc){
            vec2 shiftedOrigin = vec2(stepX, stepY) * lensAperture;
            // create a secondary ray that has as origin the shifted origin
            // and as direction focalPoint - shifted origin
            if (length(shiftedOrigin)<(lensAperture/2.0)){
                vec3 shiftedRayOrigin = eye;
                shiftedRayOrigin.x += shiftedOrigin.x;
                shiftedRayOrigin.y += shiftedOrigin.y;
                vec3 shiftedRay = normalize(focalPoint - shiftedRayOrigin);

                float shortestDistanceToScene = raymarching(shiftedRayOrigin, shiftedRay);

                if (shortestDistanceToScene < FAR_CLIP - EPSILON) {
                    vec3 collision = (shiftedRayOrigin += (shortestDistanceToScene*0.995) * shiftedRay );

                    vec3 normal = computeNormal(collision);
                    float diffLight = diffuse(normal);
                    float specLight = specular(normal, shiftedRay);
                    color += (diffLight + specLight ) * red;
                } else {
                    color += blu;
                }
                shiftIteration += 1.0;
            }
        }
    }

	vec3 c = sqrt(clamp(color/shiftIteration, 0., 1.));
    gl_FragColor = vec4(c,1.0);
}