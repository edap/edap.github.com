// Light

precision mediump float;

const int MAX_MARCHING_STEPS = 64;
const float EPSILON = 0.01;

float plane(vec3 pos){
    return pos.y;
}

float sphere(vec3 pos, float radius){
    return length(pos) - radius;
}

vec2 rotate(vec2 pos, float angle){
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, s, -s, c) * pos;
} 

float roundedBox(vec3 pos, vec3 size, float radius){
    return length(max(abs(pos) - size, 0.0)) - radius;
}

float map(vec3 pos){
    float planeDist = plane(pos);
    float offset = 20.;

    pos.xy = rotate(pos.xy, pos.z * sin(iGlobalTime)*0.0045);
    
    pos.x = abs(pos.x);
    
    pos = mod(pos + offset/2., offset) - offset/2.;
    
    pos.xy = rotate(pos.xy, iGlobalTime);
    pos.xz = rotate(pos.xz, iGlobalTime * 0.5);
    
    return min(planeDist, roundedBox(pos, vec3(2.0),0.8));
    
    //return min(planeDist, roundedBox(pos, vec3(2.0),0.8));
    return min(planeDist, sphere(pos, 2.));
}

vec3 albedo(vec3 pos){
    pos *= 0.5;
    float f = smoothstep(0.27, 0.3, fract(pos.x + sin(pos.z) * 0.4));
    return f * vec3(1.0);
}

vec3 computeNormal(vec3 pos){
    vec2 eps = vec2(0.01, 0.);
    // you have to calculate the differential of the distance field
    return normalize(vec3(
        map(pos + eps.xyy) - map(pos - eps.xyy),
        map(pos + eps.yxy) - map(pos - eps.yxy),
        map(pos + eps.yyx) - map(pos - eps.yyx)
    ));
}

vec3 lightDirection = normalize(vec3(1.0, 0.6, 1.0));
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

void main(){
    vec2 uv = 2.0 * gl_FragCoord.xy / iResolution.xy - 1.0;
    vec3 pos = vec3(sin(iGlobalTime * 0.2) * 4.0, 5. +sin(iGlobalTime*0.4) * 3.0, -15.);
    vec3 dir = normalize(vec3(uv, 1.0));

    vec3 color = vec3(0.0);

    for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
        float d = map(pos);
        if (d < 0.01){
            // 1) let's add a light    
            float lightDistance = sphere(pos, 1.0);
            vec3 normal = computeNormal(pos);
            float diffLight = diffuse(normal);
            float specLight = specular(normal, dir);
            float fresnelLight = fresnel(normal, dir);
            //color = 40. / (lightDistance * lightDistance) * vec3(0.9, 0.7, 0.2) * albedo(pos);
            // this is part of point 5
            color = (diffLight + specLight+ fresnelLight) * vec3(0.9, 0.7, 0.2) * albedo(pos);
            break;
        }

        pos += d * dir;
    }

    // 2) add the normal
    //gl_FragColor = vec4(computeNormal(pos), 1.0);

    // 3) add diffuse light
    //gl_FragColor = vec4(vec3(diffuse(computeNormal(pos))), 1.0);
    // 4) try out specular light
    //gl_FragColor = vec4(vec3(specular(computeNormal(pos), dir)), 1.0);

    // 5) use the color combined with specular and diffuse light
    //gl_FragColor = vec4(vec3(color), 1.);

    // 6) Add fog
    float fogFactor = exp(-pos.z * 0.01);
    color = mix(vec3(0.8, 0.9, 1.), color, fogFactor);
    gl_FragColor = vec4(vec3(color), 1.);
}