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

float merge(float d1, float d2){
	return min(d1, d2);
}

float circleDist(vec2 p, float radius){
  return length(p) - radius;
}

// translation //

vec2 translate(vec2 p, vec2 t){
	return p - t;
}

void main(){
  // sposto le coordinate al centro dello schermo
  vec2 st = 2.0 * gl_FragCoord.xy / iResolution.xy - 1.0;
  
  vec2 transA =  translate(st, vec2(0.3, 0.0));
  float circA = circleDist(transA, 0.2);

  vec2 transB =  translate(st, vec2(-0.3, 0.0));
  float circB = circleDist(transB, 0.2);

  // union e' un semplice min. La funzione merge ritorna
  // la distanza piu' corta tra i due punti
  float merged = merge(circA, circB);
  gl_FragColor = vec4(vec3(merged), 1.);
}