// keywords: signed distance function, boolean operation, union
// http://hughsk.io/fragment-foundry/chapters/09-combining-shapes.html

// distance function returns a negative number when the value is inside
// positive when the value is outside.
// to merge two shapes

// here the primer about boolean operations with sdf
// https://www.shadertoy.com/view/4dfXDn
//////////////////////////////////////
// Combine distance field functions //
//////////////////////////////////////


float smoothMerge(float d1, float d2, float k){
    float h = clamp(0.5 + 0.5*(d2 - d1)/k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0-h);
}

float merge(float d1, float d2){
	return min(d1, d2);
}

float mergeExclude(float d1, float d2){
	return min(max(-d1, d2), max(-d2, d1));
}

float substract(float d1, float d2){
	return max(-d1, d2);
}

float intersect(float d1, float d2){
	return max(d1, d2);
}

float circleDist(vec2 p, float radius){
  return length(p) - radius;
}

float ellipseDist(vec2 p, float radius, vec2 dim){
  vec2 pos = p;
  pos.x = p.x / dim.x;
  pos.y = p.y / dim.y;
  return length(pos) - radius;
}

//////////////////////////////
// Rotation and translation //
//////////////////////////////

vec2 rotateCCW(vec2 p, float a){
	mat2 m = mat2(cos(a), sin(a), -sin(a), cos(a));
	return p * m;	
}

vec2 rotateCW(vec2 p, float a){
	mat2 m = mat2(cos(a), -sin(a), sin(a), cos(a));
	return p * m;
}

vec2 translate(vec2 p, vec2 t){
	return p - t;
}

float fillMask(float dist){
  return step(0.1, dist);
	//return clamp(-dist, 0.0, 1.0);
}
float innerBorderMask(float dist, float width){
	//dist += 1.0;
	float alpha1 = clamp(dist + width, 0.0, 1.0);
	float alpha2 = clamp(dist, 0.0, 1.0);
	return alpha1 - alpha2;
}

float halfMoon(vec2 pos, vec2 u_radiusOval, float offset){
  float radius = 0.6;
  float smoothness = 0.01;
  vec2 transA =  translate(pos, vec2(0.0, 0.0));
  float A = ellipseDist(transA,radius, u_radiusOval);
  //pos.y -= offset;
  vec2 transB =  translate(pos, vec2(0.0, 0.15));
  float B = ellipseDist(transB,radius, u_radiusOval);
  //e1 = smoothstep(e1, e1+smoothness, radius);
  //e2 = smoothstep(e2, e2+smoothness, radius);
  //float p = mergeExclude(e2, e1);
  float p = substract(B, A);
  //p = smoothstep(p, p+smoothness, radius);
  return p;
}


void main(){
  // sposto le coordinate al centro dello schermo
  vec2 st = 2.0 * gl_FragCoord.xy / iResolution.xy - 1.0;
  
  vec2 transA =  translate(st, vec2(-0.1, 0.0));
  float circA = circleDist(transA, 0.6);
  //float circA = ellipseDist(transA, 0.6,vec2(0.9, 0.9));

  vec2 transB =  translate(st, vec2(0.1, 0.1));
  float circB = circleDist(transB, 0.6);
  //float circB = ellipseDist(transB, 0.6, vec2(0.9, 0.4));

  // union e' un semplice min. La funzione merge ritorna
  // la distanza piu' corta tra i due punti
  //float operation = merge(circB,circA);

  // mergeExclude
  //float operation = smoothMerge(circB,circA, 0.1);

  // mergeExclude
  //float operation = mergeExclude(circB,circA);

  // substract
  //float operation = substract(circB,circA);
  float operation = substract(circB,circA);
  float upper = halfMoon(st, vec2(0.9, 0.5), 0.2);
  // intersect
  // float operation = intersect(circA,circB);
  //vec3 col = 
  gl_FragColor = vec4(vec3(fillMask(upper)), 0.1);
  gl_FragColor = vec4(vec3(fillMask(operation)), 0.1);
}