import { materials } from './materials.js';
var cosineGradient = require('cosine-gradient');
// palettes via Inigo http://www.iquilezles.org/www/articles/palettes/palettes.htm
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