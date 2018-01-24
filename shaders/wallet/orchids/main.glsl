// bool ops
float merge(float d1, float d2){
	return min(d1, d2);
}

float intersect(float d1, float d2){
	return max(d1, d2);
}

float mergeExclude(float d1, float d2){
	return min(max(-d1, d2), max(-d2, d1));
}

float substract(float d1, float d2){
	return max(-d1, d2);
}

float circleSDF(vec2 st, float diameter){
  return length(st - 0.5) * diameter;
}

float vesicaSDF(vec2 st, float w){
  vec2 offset = vec2(w * .5, 0.);
  return max (circleSDF(st-offset, 0.3),
              circleSDF(st+offset, 0.3));
}

float fill(float sdfVal, float w){
  return step(w, sdfVal);
}

vec2 translate(vec2 p, vec2 t){
	return p - t;
}

float orcPetals(vec2 st, vec2 orig, float resize, float smoothness, float nPale){
    vec2 toCenter = orig-st;
    float angle = atan(toCenter.y,toCenter.x) - 0.5;

    float grow = pow(length(toCenter), 3.);
    
    float def = 30.;
    float scale = resize - (abs(toCenter.x * 1.3) * def); //def = 30.
    float radius =  grow * scale + toCenter.y * 1.53;

    float f = cos(angle*nPale);
    return 1.-smoothstep(f,f+smoothness,radius);
}

float orcLabels(vec2 st, vec2 orig, float resize, float smoothness, float nPale){
    vec2 toCenter = st-orig;
    float angle = atan(toCenter.y,toCenter.x) - 0.5;
    float grow = exp(length(toCenter)) * 0.019;
    
    float scale = resize + sin(toCenter.y); 
    float radius =  grow * scale;
    
    float f = cos(angle*nPale);
    return 1.-smoothstep(f,f+smoothness,radius);    
}

float ellipse(vec2 st, vec2 u_centerOval, vec2 u_radiusOval){
  float e1 =  ( st.x - u_centerOval.x ) / ( u_radiusOval.x );
  float e2 =  ( st.y - u_centerOval.y ) / ( u_radiusOval.y );
  float d  = (e1 * e1) + (e2 * e2);
  return d;
}

float upperPetals(vec2 st, vec2 pos, vec2 u_radiusOval, float offset){
  float e1 = ellipse(st, vec2(0.5, 0.4), u_radiusOval);
  pos.y -= offset;
  float e2 = ellipse(st, vec2(0.5), u_radiusOval);

  //float p = mergeExclude(e2, e1);
  float p = substract(e1, e2);

  return e2;
}

void main(){
  vec2 st = gl_FragCoord.xy / iResolution.xy;
  st.x *= iResolution.x /iResolution.y;
  float resize = 36.9;
  vec2 pos = vec2(0.5, 0.50);

  float pet = orcPetals(st, pos, resize*0.65, 0.06, 3.);
  float lab = orcLabels(st, pos, resize, 0.06, 3.);
  float sdf = fill(vesicaSDF(vec2(0.5,0.5), 0.6), 0.1);
  float upper = upperPetals(st, vec2(0.5, 0.5), vec2(0.8,0.2), 0.2);

  float bottom = lab+sdf;
  //gl_FragColor = vec4(vec3(lab),1.);
  //gl_FragColor = vec4(vec3(pet),1.);
  //gl_FragColor = vec4(vec3(bottom),1.);
  float orchids = intersect(lab, pet);
  gl_FragColor = vec4(vec3(fill(upper, 0.2)), .5);
  //orchids+=sdf;
  //gl_FragColor = vec4(vec3(orchids),1.);

  //gl_FragColor = vec4(vec3(intersect(pet,lab)),1.);
}