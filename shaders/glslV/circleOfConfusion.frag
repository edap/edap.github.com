uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

// Fuzzy Field by eiffie
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// Modifications by knighty
// just trying to find a use for the new DoF renderer
float focalDistance=4.5,aperature=0.04, fudgeFactor=1., fudgeFactor2=.25, jitter=0.0, focal=3.5;
float FieldHalfWidth=2.;


#define tim 0.5*u_time
#define size u_resolution

#define TAO 6.283
// i got these from knighty and/or darkbeam
void Rotate(inout vec2 v,float angle) {v=cos(angle)*v+sin(angle)*vec2(v.y,-v.x);}
void Kaleido(inout vec2 v,float power){Rotate(v,floor(.5+atan(v.x,-v.y)*power/TAO)*TAO/power);}
float linstep(float a, float b, float t){return clamp((t-a)/(b-a),0.,1.);}
float bell1(float a, float b, float t){
	const float power=3.;
	t=2.*clamp((t-a)/(b-a),0.,1.)-1.;
	return pow(1.-t*t,power);
}
float bell(float a, float b, float t){
	t=2.*clamp((t-a)/(b-a),0.,1.)-1.;
	return 1.-t*t;
}

float rand(vec2 co){// implementation found at: lumina.sourceforge.net/Tutorials/Noise.html
	return fract(sin(tim*dot(co*0.123,vec2(12.9898,78.233))) * 43758.5453);
	//return texture(iChannel0,co,-100.).x;
}
float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
{
	vec3 pa = p - a;
	vec3 ba = b - a;
	float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
	
	return (length( pa - ba*h ) - r);
}
float DE(vec3 z0)
{
	z0.xz=abs(mod(z0.xz+1.,2.00)-1.)-0.5;
	return min(z0.y+0.25,sdCapsule(z0,vec3(-0.,0.0,0.),vec3(0.,.3,0.),.125));
	//return sdCapsule(z0,vec3(0.,0.0,0.),vec3(0.,.3,0.),.125);
}
vec3 mcol;
float CE(vec3 z0){
	float d=DE(z0);
	if (d==z0.y+0.25) mcol+=vec3(.8);	else 
		mcol+=vec3(0.7)+vec3(sin(z0.xz*5.0)*0.5,0.25)*0.5;
	return d;
}

float FuzzyShadow(vec3 ro, vec3 rd, float lightDist, float coneGrad, float rCoC, vec2 fragCoord){
	//return 1.;
	float t=DE(ro)+rCoC;//avoide self shadowing
	float d=1.0,s=1.0;
	for(int i=0;i<20;i++){
		if(t>lightDist || s<0.05) break;
		float r=rCoC+t*coneGrad;//radius of cone
		d=DE(ro+rd*t);
		s*=linstep(-r,r,d);
		t+=abs(d+0.5*r)*mix(1.,0.2*rand(fragCoord.xy*0.02*vec2(i)*t),jitter);
		//t+=max(d-r,r)*mix(1.,0.2*rand(fragCoord.xy*0.02*vec2(i)*t),jitter);
	}
	return clamp(s,0.0,1.0);
}

float pixelSize;
float CircleOfConfusion(float t){//calculates the radius of the circle of confusion at length t
	return max(abs(focalDistance-t)-FieldHalfWidth,0.)*aperature+pixelSize*t;
}
mat3 lookat(vec3 fw,vec3 up){
	fw=normalize(fw);vec3 rt=normalize(cross(fw,normalize(up)));return mat3(rt,cross(rt,fw),fw);
}

void main() {
	pixelSize=2./size.y/focal;
	focalDistance=6.+3.*sin(u_time);
	vec3 ro=vec3(0.7,2.,0.);
	vec3 rd=vec3((2.0*gl_FragCoord.xy-size.xy)/size.y,focal);
	float cor=focal/length(rd);
	rd=lookat(vec3(1.0,1.55-ro.y*1.0,0.7),vec3(0.0,1.,0.0))*normalize(rd);
	vec3 L=normalize(vec3(5.,5.,-5.));
	vec4 col=vec4(0.0);//color accumulator
	float t=0.*(rand(tim+gl_FragCoord.xy)-0.5);//distance traveled
	vec3 ro0=ro+focalDistance/cor*rd;
	float jj=0.;
	for(int i=1;i<500;i++){//march loop
		if(col.w>0.9 || t>25.0)break;//bail if we hit a surface or go out of bounds
		float rCoC=CircleOfConfusion(t*cor);//calc the radius of CoC
		float d=DE(ro);
		if(abs(d)<rCoC){//if we are inside add its contribution
			mcol=vec3(0.0);//clear the color trap, collecting color samples with normal deltas
			vec2 v=vec2(rCoC*0.01,0.0);//use normal deltas based on CoC radius
			vec3 N=normalize(vec3(-CE(ro-v.xyy)+CE(ro+v.xyy),-CE(ro-v.yxy)+CE(ro+v.yxy),-CE(ro-v.yyx)+CE(ro+v.yyx)));
			float k = -dot(N,rd);
			if(k>0.)
			{
				jj+=1.;
				//vec3 rd0=t*cor<focalDistance ? normalize(ro0-ro-N*d) : normalize(ro-ro0-N*d);
        vec2 cooord = vec2(gl_FragCoord.x, gl_FragCoord.y);
				float sh=FuzzyShadow(ro, L, 3., 0.05, rCoC, cooord);
				vec3 scol=mcol*0.2*(0.3+sh*0.7*max(0.,dot(N,L)));
				scol+=sh*5.*k*pow(max(0.0,dot(reflect(rd,N),L)),50.0)*vec3(.5,0.5,0.5);
				float alpha=fudgeFactor2*fudgeFactor*k*(1.0-col.w)*bell(-rCoC,rCoC,d);//calculate the mix like cloud density
				col+=vec4(scol*alpha,alpha);//blend in the new color
			}
		}
		//if(d<0.001) break;
		d=max(d-0.5*rCoC,0.5*fudgeFactor2*rCoC)*fudgeFactor*mix(1.,rand(gl_FragCoord.xy*0.02*vec2(i)*t),jitter);//add in noise to reduce banding and create fuzz
		//d=max(d,0.5*fudgeFactor2*rCoC)*fudgeFactor*mix(1.,rand(fragCoord.xy*0.02*vec2(i)*t),jitter);//add in noise to reduce banding and create fuzz
		ro+=d*rd;//march
		t+=d;
	}//mix in background color
	//fragColor = vec4(jj/20.); return;
	vec3 scol=3.*mix(vec3(0.025,0.1,0.05)+rd*0.025,vec3(0.1,0.2,0.3)+rd*0.2,smoothstep(-0.1,0.1,rd.y));
	col.rgb+=scol*(1.0-clamp(col.w,0.0,1.0));

	gl_FragColor = vec4(clamp(col.rgb,0.0,1.0),1.0);
}