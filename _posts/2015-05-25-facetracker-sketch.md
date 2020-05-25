---
layout: post
title: "FaceTracker sketch"
category:
tags: [openFrameworks, FaceTracker, Box2D, OpenCV, interactive installation]
description: "OpenFrameworks sketch mixing ofxFaceTracker, ofxBox2D and the audio input."
---

I've played a bit with the [ofxFaceTracker](https://github.com/kylemcdonald/ofxFaceTracker) addon recently and I've done this small application that use this addons, the microphone and ofxBox2D to literally blow bubbles out of your eyes. 

<div class="sixteen-nine">
<iframe src="https://player.vimeo.com/video/128782688" width="700" height="438" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
</div>

I write here the steps followed to reach the final results, the code is available on [Github](https://github.com/edap/bubbles)

### Put the mouth over the eyes
For each frame composing the video, I have identified the profile of the mouth with `tracker.getImageFeature(ofxFaceTracker::OUTER_MOUTH)`, then I have created a transparent image and I have copied to it only with the pixels inside the profile of the mouth.

```cpp
ofImage ofApp::grabMouth(){
    ofPolyline mouthProfile = tracker.getImageFeature(ofxFaceTracker::OUTER_MOUTH);
    mouthProfile.getSmoothed(100);
    ofPixels pixels;
    cam.getTextureReference().readToPixels(pixels);
    ofRectangle mouthBox = mouthProfile.getBoundingBox();
    pixels.crop(mouthBox.x,mouthBox.y,mouthBox.width,mouthBox.height);
    
    ofPixels alphaPixels;
    alphaPixels.allocate(pixels.getWidth(), pixels.getHeight(), OF_IMAGE_COLOR_ALPHA);
    int totalPixels = pixels.getWidth()*pixels.getHeight();
    // allocate two colors
    ofColor c = pixels.getColor(x,y);
    ofColor transparent = ofColor(0,0,0,0);
    for (int x = 0; x < pixels.getWidth(); x++) {
        for (int y = 0; y < pixels.getHeight(); y++) {
            ofPoint checkpoint = ofPoint(x+mouthBox.x,y+mouthBox.y);
            if (mouthProfile.inside(checkpoint)) {
                alphaPixels.setColor(x,y,c);
            } else {
                alphaPixels.setColor(x,y,transparent);
            }
        }
    }
    ofImage videoImage;
    videoImage.setFromPixels(alphaPixels);
    return videoImage;
}
```

Then, for every new frame, I have copied this image over the eyes.

```cpp
void ofApp::update() {
    cam.update();
    if(cam.isFrameNew()) {
        tracker.update(toCv(cam));
    }
    leftEye = tracker.getImageFeature(ofxFaceTracker::LEFT_EYE).getCentroid2D();
    rightEye = tracker.getImageFeature(ofxFaceTracker::RIGHT_EYE).getCentroid2D();
}

void ofApp::draw() {
    mouthImage = grabMouth();
    cam.draw(0, 0);
    drawMouth(leftEye, mouthImage);
    drawMouth(rightEye, mouthImage);
}

void ofApp::drawMouth(ofVec2f eye, ofImage mouth){
    mouth.draw(eye.x -mouth.width/2, eye.y - mouth.height/2);
}
```

### Create the bubbles

I've used ofxBox2D to create the bubbles that fill the screen while blowing. The `BallsGenerator` class contains an emissive particle system that has 2 origins over the eyes. The origins need to be constantly updated because the face is supposed to turn or move.

```cpp
void ofApp::update() {
    //...
    microphone.update();
    generator.update(leftEye, rightEye);
    generator.blow(microphone.scaledVol);
}
```

### Map the audio input to the bubbles

The `microphone.update()` call updates the current input volume, and save it in the `scaledVol` variable. This variable is used shortly after by the bubbles generator and affects the particle emitters.

```cpp
void BallsGenerator::blow(float blowPower){
    float freq = 3.0;
    float time = ofGetElapsedTimef() * 0.02;
    float noiseValue = ofSignedNoise(time*freq*blowPower);
    float mapped = ofMap(noiseValue, 0, 1, 0, 15);
    int n_balls = int(mapped + 0.5);
    
    for (int i =1; i <= n_balls; i ++) {
        float r = ofRandom(4, 20);
        vector<ofVec2f>::iterator origin;
        for (origin = origins.begin(); origin != origins.end(); origin++) {
            circles.push_back(shared_ptr<ofxBox2dCircle>(new ofxBox2dCircle));
            circles.back().get()->setPhysics(3.0, 0.53, 0.1);
            circles.back().get()->setup(box2d.getWorld(), origin->x, origin->y, ofRandom(5, 25));
            circles.back().get()->setVelocity(ofRandom(-30, 30), -40);
        }
    }
}
```





