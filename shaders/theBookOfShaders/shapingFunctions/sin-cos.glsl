#define PI 3.14159265359

// Plot a line on Y using a value between 0.0-1.0
float plot(vec2 st, float pct){
  return  smoothstep( pct-0.02, pct, st.y) - 
          smoothstep( pct, pct+0.02, st.y);
}

void main() {
	vec2 st = gl_FragCoord.xy/iResolution.xy;
    // Add time (u_time) to x before computing the sin
    //float y = sin(st.x + iGlobalTime);
    //Multiply x by PI before computing the sin.
    //float y = sin(st.x * PI);

    // Multiply time (u_time) by x before computing the sin. 
    // See how the frequency between phases becomes more and more 
    // compressed. Note that u_time may have already become very large, 
    //making the graph hard to read.
    //float y = sin(st.x * iGlobalTime);

   //Add 1.0 to sin(x). See how all the wave is displaced up and now 
   // all values are between 0.0 and 2.0.
   //float y = sin(st.x * iGlobalTime) + 1.0;

   //Multiply sin(x) by 2.0. See how the amplitude doubles in size.
   //float y = sin(st.x) * 2.0;
   
   //Compute the absolute value (abs()) of sin(x). It looks like the trace of 
   // a bouncing ball.
   //float y = abs(sin(st.x * iGlobalTime));
   
   //Extract just the fraction part (fract()) of the resultant of sin(x).
   //float y = fract(sin(st.x * iGlobalTime));
   
   //Add the higher integer (ceil()) and the smaller integer (floor()) of the resultant of sin(x) to get a digital wave of 1 and -1 values.
   float b = sin(st.x * iGlobalTime);
   float y = b + floor(b);

    vec3 color = vec3(y);
    // Plot a line
    float pct = plot(st,y);
    color = (1.0-pct)*color+pct*vec3(0.0,1.0,0.0);
    
	gl_FragColor = vec4(color,1.0);
}

