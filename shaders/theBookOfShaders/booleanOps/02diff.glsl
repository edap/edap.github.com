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
  return step(0.2, dist);
	//return clamp(-dist, 0.0, 1.0);
}


void main(){
  // sposto le coordinate al centro dello schermo
  vec2 st = 2.0 * gl_FragCoord.xy / iResolution.xy - 1.0;
  
  vec2 transA =  translate(st, vec2(0.3, 0.0));
  float circA = circleDist(transA, 0.6);

  vec2 transB =  translate(st, vec2(-0.3, 0.0));
  float circB = circleDist(transB, 0.4);

  // union e' un semplice min. La funzione merge ritorna
  // la distanza piu' corta tra i due punti
  float operation = substract(circB,circA);
  //float operation = substract(circA,circB);
  gl_FragColor = vec4(vec3(fillMask(operation)), 1.);
}