//Example to make textures of the channels using the texture.

void main( )
{
    //iTime renamed to another name
    //You don't need to put this but I like better to write with 'time' instead of 'iTime'.
    
    //Get screen position
	vec2 uv = gl_FragCoord.xy / iResolution.xy;
    

    
    //iChannel1 texture
    vec4 pic = texture2D(iChannel2,uv);
    
    //Output colors
    //Mix two textures, mix(tex1,tex2,opacity)
	gl_FragColor = pic;
}