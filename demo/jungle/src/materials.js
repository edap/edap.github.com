import { MeshStandardMaterial, NoColors, VertexColors,MeshPhongMaterial } from 'three';

const materialTrunk = new MeshStandardMaterial({
	color: 0x7d8416,
	emissive: 0x000000,
	roughness: 0.55,
	metalness: 0.89,
	vertexColors: VertexColors
});

// const materialFoliage = new MeshStandardMaterial({
// 	color: 0x9eb338,
// 	emissive: 0x101b03,
// 	roughness: 0.55,
// 	metalness: 0.89,
// 	vertexColors: NoColors
// });

const materialFoliage  = new MeshPhongMaterial({
	color: 0x8c5b17,
	emissive: 0x4ca078,
	specular: 0x413e0f,
	shininess: 10
})

// const materialTrunkB = new MeshStandardMaterial({
// 	color: 0xff0000,
// 	emissive: 0x2d1b01,
// 	roughness: 0.55,
// 	metalness: 0.89,
// 	vertexColors: VertexColors
// });

// const materialFoliageB = new MeshStandardMaterial({
// 	color: 0xf3ff39,
// 	emissive: 0x410000,
// 	roughness: 0.55,
// 	metalness: 0.89,
// 	vertexColors: VertexColors
// });

// const materialTrunkC = new MeshStandardMaterial({
// 	color: 0xff00e0,
// 	emissive: 0x750202,
// 	roughness: 0.55,
// 	metalness: 0.89,
// 	vertexColors: NoColors
// });

// const materialFoliageC = new MeshStandardMaterial({
// 	color: 0x0077ff,
// 	emissive: 0xe84444,
// 	roughness: 0.55,
// 	metalness: 0.89,
// 	vertexColors: NoColors
// });

export const materials = [materialTrunk, materialFoliage];
