import { materials } from './materials.js';
import { map } from './helpers.js';

export default class ColorChanger {
  update(mouseX, mouseY){
    materials[1].emissive.setHSL(mouseY, 0.55, 0.15);
    materials[1].color.setHSL( mouseX, 0.7, 0.05);
  }
}