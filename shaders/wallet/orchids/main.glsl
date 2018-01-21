float merge(float d1, float d2){
	return min(d1, d2);
}

float intersect(float d1, float d2){
	return max(d1, d2);
}

float intersectSmooth(float d1, float d2, float k){
    float h = clamp(0.5 + 0.5*(d2 - d1)/k, 0.0, 1.0);
    return mix(d2, d1, h) + k * h * (1.0-h);
}

float smoothMerge(float d1, float d2, float k){
    float h = clamp(0.5 + 0.5*(d2 - d1)/k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0-h);
}

float circleDist(vec2 p, float radius){
  return length(p) - radius;
}

vec2 translate(vec2 p, vec2 t){
	return p - t;
}

float orcPetals(vec2 st, vec2 orig, float resize, float smoothness, float nPale){
    // https://thebookofshaders.com/07/
    // Use polar coordinates instead of cartesian
    // This technique is a little restrictive but very simple.
    // It consists of changing the radius of a circle depending 
    // on the angle to achieve different shapes.
    vec2 toCenter = vec2(orig)-st;
    float angle = atan(toCenter.y,toCenter.x) - 0.5;


    // the value of grow affect the curve
    float grow = pow(length(toCenter), 3.);
    //float grow = exp(length(toCenter)) * 0.029;
    //float grow = exp2(length(toCenter)) * 0.029;
    //float grow = sqrt(length(toCenter)) * 0.09;
    //float grow = sin(length(toCenter)) * 0.12;
    //float grow = asin(length(toCenter)) * 0.12;
    //float grow = tan(length(toCenter)) * 0.12;
    //float grow = atan(length(toCenter)) * 0.12;


    // this value affect how much the petals scale depending
    // on y, x or the combination of both
    float def = 30.;

    // Y
    //float scale = resize + toCenter.y * def; // def = 30.
    //float scale = resize - toCenter.y * def; // def = 30.
    float scale = (resize + asin(toCenter.y) * def); //def - 30.

    // X
    //float scale = resize - abs(toCenter.x) * def; //def = 30.
    //float scale = resize + abs(toCenter.x) * def; //def = 80.
    
    // or combined
    //float scale = resize + abs(abs(toCenter.x)- toCenter.y) * def; //def = 80.

    // or mixed, depending if y is pos or neg
    //float scale = (resize + abs(abs(toCenter.x)- toCenter.y) * def) * step(0., toCenter.y);

    // sin
    //float scale = resize + asin(toCenter.y) * def;

    float radius =  grow * scale;
    

    float f = cos(angle*nPale);
    return 1.-smoothstep(f,f+smoothness,radius);
}

float twoCircles(vec2 _st, float offset, float dim, float smoothness){
  vec2 transA =  translate(_st, vec2(offset, 0.0));
  float circA = circleDist(transA, dim);

  vec2 transB =  translate(_st, vec2(-offset, 0.0));
  float circB = circleDist(transB, dim);

  return smoothMerge(circA, circB, smoothness);
}


float orcLabels(vec2 st, vec2 orig, float resize, float smoothness, float nPale){
    // https://thebookofshaders.com/07/
    // Use polar coordinates instead of cartesian
    // This technique is a little restrictive but very simple.
    // It consists of changing the radius of a circle depending 
    // on the angle to achieve different shapes.
    vec2 toCenter = st - orig;
    float angle = atan(toCenter.y,toCenter.x) - 0.5;


    // the value of grow affect the curve
    float grow = pow(length(toCenter), 3.);
    //float grow = exp(length(toCenter)) * 0.029;
    //float grow = exp2(length(toCenter)) * 0.029;
    //float grow = sqrt(length(toCenter)) * 0.09;
    //float grow = sin(length(toCenter)) * 0.12;
    //float grow = asin(length(toCenter)) * 0.12;
    //float grow = tan(length(toCenter)) * 0.12;
    //float grow = atan(length(toCenter)) * 0.12;


    // this value affect how much the petals scale depending
    // on y, x or the combination of both
    float def = 35.;

    // Y
    //float scale = resize + toCenter.y * def;
    //float scale = resize - toCenter.y * def; // def = 30.
    //float scale = resize + asin(toCenter.y) * def; //def - 30.

    // X
    float scale = resize - abs(toCenter.x) * def; //def = 30.
    //float scale = resize + abs(toCenter.x) * def; //def = 80.
    
    // or combined
    //float scale = resize + abs(abs(toCenter.x)- toCenter.y) * def; //def = 80.

    // sin
    //float scale = resize + asin(toCenter.y) * def;

    float radius =  grow * scale;
    

    float f = cos(angle*nPale);
    return 1.-smoothstep(f,f+smoothness,radius);    
}

float bocca(vec2 _st, vec2 orig){
    vec2 posCirc = _st - orig;
    posCirc.y += 0.3;
    float twoCircles = twoCircles(posCirc, 0.1, 0.02, 0.01);
    twoCircles = step(twoCircles, 0.1); 
    return twoCircles;   
}

void main(){
  vec2 st = gl_FragCoord.xy / iResolution.xy;
  st.x *= iResolution.x /iResolution.y;
  float pet = orcPetals(st, vec2(0.4, 0.4), 23.9, 0.06, 3.);
  float lab = orcLabels(st, vec2(0.4, 0.5), 23.9, 0.06, 3.);
  float mund = bocca(st, vec2(0.4, 0.5));

  float bottom = intersect(lab, mund);

  //gl_FragColor = vec4(vec3(lab),1.);
  //gl_FragColor = vec4(vec3(pet),1.);
  gl_FragColor = vec4(vec3(bottom),1.);
  //gl_FragColor = vec4(vec3(intersect(pet,lab)),1.);
}