import { materials } from './materials.js';
var cosineGradient = require('cosine-gradient');
// the colors gradients used as material for the palms are defined using this technique
// palettes via Inigo http://www.iquilezles.org/www/articles/palettes/palettes.htm

// In order to tune the color, use this tool http://dev.thi.ng/gradients/.
// the values that you see in the array 'emissiveScheme' and colorScheme
// are both obtained playing with the curves in that tools.
// After you have find some values that satisfy you,
// copy the values that appear under "Vector of coefficients for the above shown gradient:"
// to emissiveScheme or colorScheme, depending on the color that you want to change.
// Please, note that the actual combination take into account complementary colors too, try to
// balance them. for example emissive red and color green. Also take into account that when
// changing the colors in the tool, you have to pick darker color than what you think, because
// the scene is already a bit bright.
// Another easier approach to change the colors, is to change the color of the light
// application.js, light = new THREE.HemisphereLight(0xe8e8e8, 0x000000, 2);
// https://threejs.org/docs/index.html#api/lights/HemisphereLight

var emissiveScheme = [
  [0.250, 0.250, 0.250], [0.205, 0.205, 0.205], [0.710, 0.710, 0.710], [-3.002, -2.668, -2.335]
];
var emGradient = cosineGradient(emissiveScheme);

var colorScheme = [
  [0.230, 0.230, 0.198], [0.160, 0.160, 0.160], [0.460, 0.460, 0.460], [-0.412, -0.078, 0.255]
];
var colGradient = cosineGradient(colorScheme);


export default class ColorChanger {
  update(mouseX, mouseY){
    let em = emGradient(mouseX);
    let col = colGradient(mouseX);
    materials[1].emissive.setRGB(em[0], em[1], em[2]);
    materials[1].color.setRGB(col[0], col[1], col[2]);
  }
}