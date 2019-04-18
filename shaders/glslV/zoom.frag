uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform sampler2D u_tex0;
uniform sampler2D u_tex1;

//https://www.shadertoy.com/view/Mt2XDc
//https://www.shadertoy.com/view/MsVyWV

void main(){
  vec2 uv = gl_FragCoord.xy/ u_resolution.xy;
  uv.x *= u_resolution.x / u_resolution.y;

  float mov = sin(u_time) * 0.2;
  uv.x = smoothstep(1.0-mov, 0.2, 0.6);
  gl_FragColor = texture2D(u_tex0, uv);

  gl_FragColor = vec4(uv.x, uv.y, 1.0, 1.0);
}