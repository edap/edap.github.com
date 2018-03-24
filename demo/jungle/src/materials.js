import { MeshStandardMaterial, NoColors, VertexColors,MeshPhongMaterial } from 'three';

const materialTrunk = new MeshStandardMaterial({
	color: 0x7d8416,
	emissive: 0x000000,
	roughness: 0.55,
	metalness: 0.89,
	vertexColors: VertexColors
});

const materialFoliage  = new MeshPhongMaterial({
	color: 0x8c5b17,
	emissive: 0x4ca078,
	specular: 0x413e0f,
	shininess: 10
})

export const materials = [materialTrunk, materialFoliage];
