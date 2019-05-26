uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

float asphere(in vec3 ro, in vec3 rd, in vec3 sp, in float sr){ 
    // geometric solution
    float sr2 = sr*sr;
    vec3 e0 = sp - ro; 
    float e1 = dot(e0,rd);
    float r2 = dot(e0,e0) - e1*e1; 
    if (r2 > sr2) return 1000.0; 
    float e2 = sqrt(sr2 - r2); 
    return e1-e2; 
}


float map(in vec3 ro, in vec3 rd){ 
    return min(asphere(ro,rd,vec3(0.0,0.0,0.0), 1.5),
               min(asphere(ro,rd,vec3(-2,0.0,0.0),1.0), 
                   min(asphere(ro,rd,vec3(0.0,-2,0.0),1.0),
                       min(asphere(ro,rd,vec3(1.15,1.15,1.15),1.0),
                           min(asphere(ro,rd,vec3(0.0,0.0,-2),1.0),
                              asphere(ro,rd,vec3(3.,3.,3.),0.2))))));
}


vec3 ascene(in vec3 ro, in vec3 rd){
    float t = map(ro,rd);
    vec3 col = vec3(0);
    if (t==1000.0){col +=0.5;}
    
    else {
        vec3 loc = t*rd+ro;
        loc = loc*0.5;
        col =  vec3(clamp(loc.x,0.0,1.0),clamp(loc.y,0.0,1.0),clamp(loc.z,0.0,1.0));
    }
    return col;
}

void main(){
    //THIS v
    const int lensRes = 9; //THIS <
    const int ssaa = 1; //THIS <
    float lensDis = 0.75; //THIS <
    float lensSiz = 2.0; //THIS <
    float focalDis = 11.0; //THIS <
    //THIS ^
    //fragcoord is the center of the pixel
    
    vec2 sensorLoc = 2.0 * gl_FragCoord.xy / u_resolution.xy - 1.0;
    sensorLoc.x *= u_resolution.x / u_resolution.y;

    vec3 Z = vec3(0.0,0.0,1.0); //useful later could be hardcoded later instead
    float t = 0.5*u_time - 5.0*u_mouse.x/u_resolution.x; //tau used to determine camera position
    
    vec3 cameraPos = 10.0*vec3(1.0*sin(3.0*t),1.0*cos(2.0*t),1.0*cos(3.0*t)); //this is not normalized
    
    vec3 cameraDir = -cameraPos; //this will and should be normalized
    cameraDir = normalize(cameraDir); //normalize
    
    vec3 cameraX = cross(cameraDir,Z); //right dir for camera
    cameraX = normalize(cameraX); //normalize
    
    vec3 cameraY = cross(cameraX,cameraDir); //up dir for camera
    cameraY = normalize(cameraY); //normlize
	
    vec3 colorTotal = vec3(0.0,0.0,0.0);//for each pixel reset the accumulated color
    float colorCount = 0.0;
    float lensResF = float(lensRes); //for comparing to float later
    float focal = 1.0+lensDis/focalDis; //brings the image to focus at focalDis from the cameraPos
    float ssaaF = float(ssaa); // for using later to save a cast.
    float sscale = 1.0/(u_resolution.x); // size of a pixel
    float sstep = 1.0/ssaaF;
    float sstart = sstep/2.0-0.5;
    float lstep = 1.0/lensResF;
    float lstart = lstep/2.0-0.5;
    
    //for (float sx = sstart; sx < 0.5; sx += sstep){ //SSAA x direction
    	//for (float sy = sstart; sy < 0.5; sy += sstep){ //SSAA y direction
            float sy = sstart;
            float sx = sstart;
            vec2 ss = vec2(sx,sy)*sscale; //sub pixel offset for SSAA
            vec3 sensorRel = cameraX*(sensorLoc.x+ss.x) + cameraY*(sensorLoc.y+ss.y); //position on sensor relative to center of sensor. Used once
            vec3 sensorPos = cameraPos - lensDis*cameraDir + sensorRel; //3d position of ray1 origin on sensor
            	
            for (float lx = lstart; lx < 0.5; lx+=lstep){
        		for (float ly = lstart; ly < 0.5; ly+=lstep){
                    
            		vec2 lensCoord = vec2(lx,ly); //fragCoord analog for lens array. lens is square
        			vec2 lensLoc = (lensCoord)*lensSiz; //location on 2d lens plane
            		
                    //if (length(lensLoc)<(lensSiz/2.0)){ //trim lens to circle
                        
                		vec3 lensRel = cameraX*(lensLoc.x) + cameraY*(lensLoc.y); //position on lens relative to lens center. Used twice
            			vec3 lensPos = cameraPos + lensRel; // 3d position of ray1 end and ray2 origin on lens
            			vec3 rayDir1 = lensPos - sensorPos; //direction of ray from sensor to lens
            			vec3 rayDir2 = rayDir1 - focal*(lensRel); //direction of ray afer being focused by lens
            			rayDir2 = normalize(rayDir2); //normalize after focus 
            			vec3 color = ascene(lensPos,rayDir2); //scene returns a color
            			colorTotal = colorTotal+color; //sum colors over all  points from lens
                        colorCount += 1.0; //total number of colors added.
                    //}
                }
            }
        //}
    //}
    
    gl_FragColor = vec4(vec3(   colorCount/90.0), 1.0);
    //gl_FragColor = vec4(colorTotal/colorCount - length(sensorLoc)*0.25,1.0); //slight post-processing
}