float smoothMerge(float d1, float d2, float k){
    float h = clamp(0.5 + 0.5*(d2 - d1)/k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0-h);
}

float substract(float d1, float d2){
	return max(-d1, d2);
}

float intersect(float d1, float d2){
	return max(d1, d2);
}

float mergeExclude(float d1, float d2){
	return min(max(-d1, d2), max(-d2, d1));
}

float ellipseDist(vec2 p, float radius, vec2 dim){
  vec2 pos = p;
  pos.x = p.x / dim.x;
  pos.y = p.y / dim.y;
  return length(pos) - radius;
}


float orcColumn(vec2 pos, vec2 oval, vec2 ovalSub,float radius, float offset){
  float A = ellipseDist(pos, radius, ovalSub);
  vec2 posB = pos;
  posB.y -= offset;
  float B = ellipseDist(posB, radius, oval);
  float p = substract(B,A);
  posB.y += 0.035;
  float cone = ellipseDist(posB, radius, vec2(0.055, 0.30));
  p = smoothMerge(cone,p, 0.4);
  float s = ellipseDist(posB, radius, vec2(0.2, 0.20));
  //p = smoothMerge(cone,p, 0.4);
  //p = mergeExclude(cone,p);
  //p = intersect(cone,p);
  return p;
}

void main(){
  vec2 st = gl_FragCoord.xy/iResolution.xy;
  st += vec2(-0.5, -0.5);

  // old column
  vec2 oval = vec2(0.5,0.5);
  vec2 ovalSub = vec2(0.3, 0.4);
  float radius = 0.6;
  float offset = 0.3;
  float orcColumn = orcColumn(st, oval, ovalSub, radius, offset);
  vec3 col = vec3(smoothstep(orcColumn, orcColumn+0.05, 0.1));
  gl_FragColor = vec4(col, 1.0);
}