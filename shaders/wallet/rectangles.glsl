#ifdef GL_ES
precision mediump float;
#endif

//https://thebookofshaders.com/07/

//this could be useful for a vignette background
vec3 rect(float margin, vec2 st){
    vec3 pct;  

    vec2 bottomLeft = step(vec2(margin),st);
    pct = vec3( bottomLeft.x * bottomLeft.y );

    vec2 topRight = step(vec2(margin), 1.0 - st);
    pct *= vec3(topRight.x * topRight.y);
    return pct;
}

//this could be useful for a vignette background, but smoothed
vec3 rectSmooth(float margin, float edge){
    vec3 pct;
    vec2 st = gl_FragCoord.xy / iResolution.xy;    
    // and this, are the same
    vec2 bottomLeft = smoothstep(vec2(margin),vec2(margin+edge),st);
    pct = vec3( bottomLeft.x * bottomLeft.y );

    vec2 topRight = smoothstep(vec2(margin),vec2(margin+edge), 1.0 - st);
    pct *= vec3(topRight.x * topRight.y);
    return pct;
}

//this is to draw square or rect in a certain position
float rectangle(in vec2 st, in vec2 origin, in vec2 dimensions) {
    vec2 center = step(origin, st);
    float pct = center.x * center.y;
    vec2 full = step(1.0 - origin - dimensions, 1.0 - st);
    pct *= full.x * full.y;
    return pct;
}

float rectangleGradientBottom(in vec2 st, in vec2 origin, in vec2 dimensions, float smoothness) {
    vec2 center = step(origin, st); // it is actually the bottom left cornter
    float pct = center.x * center.y;
    vec2 full = step(1.0 - origin - dimensions, 1.0 - st);
    float height = origin.y+dimensions.y;
    pct *= full.x * full.y;
    pct *= smoothstep(height, origin.y+smoothness,st.y);
    return pct;
}

float rectangleGradientTop(in vec2 st, in vec2 origin, in vec2 dimensions, float smoothness) {
    vec2 center = step(origin, st); // it is actually the bottom left cornter
    float pct = center.x * center.y;
    vec2 full = step(1.0 - origin - dimensions, 1.0 - st);
    float height = origin.y+dimensions.y;
    pct *= full.x * full.y;
    pct *= smoothstep(origin.y, height+smoothness,st.y);
    return pct;
}

float rectangleGradientRight(in vec2 st, in vec2 origin, in vec2 dimensions, float smoothness) {
    vec2 center = step(origin, st); // it is actually the bottom left cornter
    float pct = center.x * center.y;
    vec2 full = step(1.0 - origin - dimensions, 1.0 - st);
    float width = origin.x+dimensions.x;
    pct *= full.x * full.y;
    // use small values for smoothness, like 0.05
    pct *= smoothstep(origin.x+smoothness, width, st.x);
    return pct;
}

float rectangleGradientLeft(in vec2 st, in vec2 origin, in vec2 dimensions, float smoothness) {
    vec2 center = step(origin, st); // it is actually the bottom left cornter
    float pct = center.x * center.y;
    vec2 full = step(1.0 - origin - dimensions, 1.0 - st);
    float width = origin.x+dimensions.x;
    pct *= full.x * full.y;
    pct *= smoothstep(width, origin.x+smoothness,st.x);
    return pct;
}

// from patricio's cards
float rectSDF(vec2 pos, vec2 dim){
  vec2 _st = pos*2. - 1.;
  return max(abs(_st.x/dim.x),
             abs(_st.y/dim.y));
}

float fill(float sdfVal, float size){
  return step(size, sdfVal);
}



//usage example
void main() {   
    //
    //vec3 rect = rectSmooth(0.1, 0.2);
    //gl_FragColor = vec4(rect,1.0);
    vec2 st = gl_FragCoord.xy / iResolution.xy;
    vec2 orig = vec2(0.5, 0.5);
    vec3 rec = rect(0.1, st);
    //float rect = rectangle(st, orig, vec2(0.1,0.1));
    //make it rotate
    vec2 circularMovement = vec2(sin(iGlobalTime)*0.1, cos(iGlobalTime)*0.1);
    float rect = rectangle(st, orig+circularMovement, vec2(0.1,0.1));
    //float rect = fill(rectSDF(st, vec2(0.2,0.4)), 0.3);
    gl_FragColor = vec4(vec3(rect),1.0);

}