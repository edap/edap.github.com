import { materials } from './materials.js';
var cosineGradient = require('cosine-gradient');
// palettes via Inigo http://www.iquilezles.org/www/articles/palettes/palettes.htm
var emissiveScheme = [
  [0.500,0.500,0.500],
  [0.500,0.500,0.500],
  [1.000,1.000,1.000],
  [0.000,0.333,0.667]
];
var emGradient = cosineGradient(emissiveScheme);

var colorScheme = [
  [0.5, 0.5, 0.5],
  [0.5, 0.5, 0.5],
  [1.0, 1.0, 0.5],
  [0.80, 0.90, 0.30]
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