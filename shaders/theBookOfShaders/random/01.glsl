// Plot a line on Y using a value between 0.0-1.0
float plot(vec2 st, float pct){
  return  smoothstep( pct-0.02, pct, st.y) - 
          smoothstep( pct, pct+0.02, st.y);
}


// this comes from https://thebookofshaders.com/10/
void main() {
	vec2 st = gl_FragCoord.xy/iResolution.xy;
    // let's scale the coord system
    st*= 10.;
    // as you see, the second wave is different form the previous one.
    // try to increment 2.0 to 10.00
    float y = fract(sin(st.x)*2.0);

    vec3 color = vec3(y);
    
    float pct = plot(st,y);
    color = (1.0-pct)*color+pct*vec3(0.0,1.0,0.0);
    gl_FragColor = vec4(color, 1.0);

}