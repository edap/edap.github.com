// the first noise it is just an improvement over the pseudo random

// Plot a line on Y using a value between 0.0-1.0
float plot(vec2 st, float pct){
  return  smoothstep( pct-0.02, pct, st.y) - 
          smoothstep( pct, pct+0.02, st.y);
}

float rand(float x){
    return fract(sin(x)*20.0);
}


// this comes from https://thebookofshaders.com/11/


// TODO, Finish this chapter
// have a look at this noise func https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83

void main() {
	vec2 st = gl_FragCoord.xy/iResolution.xy;
    // let's scale the coord system
    st*= 2.1;
    
    // original random
    //float y = rand(st.x);
    float f = 0.01;
    float y =  mix(rand(st.x), rand(st.x + 1.0), f);


    vec3 color = vec3(y);
    
    //float pct = plot(st,y);
    //color = (1.0-pct)*color+pct*vec3(0.0,1.0,0.0);
    gl_FragColor = vec4(color, 1.0);

}