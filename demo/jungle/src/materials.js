import { MeshStandardMaterial, NoColors, VertexColors } from 'three';

const materialTrunk = new MeshStandardMaterial({
	color: 0xefff00,
	emissive: 0x4ca078,
	roughness: 0.55,
	metalness: 0.89,
	vertexColors: VertexColors
});

const materialFoliage = new MeshStandardMaterial({
	color: 0xefff00,
	emissive: 0x4ca078,
	roughness: 0.55,
	metalness: 0.89,
	vertexColors: NoColors
});

const materialTrunkB = new MeshStandardMaterial({
	color: 0xff0000,
	emissive: 0x2d1b01,
	roughness: 0.55,
	metalness: 0.89,
	vertexColors: VertexColors
});

const materialFoliageB = new MeshStandardMaterial({
	color: 0xf3ff39,
	emissive: 0x410000,
	roughness: 0.55,
	metalness: 0.89,
	vertexColors: NoColors
});

const materialTrunkC = new MeshStandardMaterial({
	color: 0xff00a5,
	emissive: 0x3e1743,
	roughness: 0.55,
	metalness: 0.89,
	vertexColors: NoColors
});

const materialFoliageC = new MeshStandardMaterial({
	color: 0x0077ff,
	emissive: 0xe84444,
	roughness: 0.55,
	metalness: 0.89,
	vertexColors: NoColors
});

export const materials = [materialTrunk, materialFoliage, materialTrunkB, materialFoliageB, materialTrunkC, materialFoliageC];
export function makeMaterialBrighter(material, inc){
	const color = material.color;
	const emissive = material.emissive;
	if (color.r < 1){
		color.r += inc;
	}
	if (color.g < 1){
		color.g += inc;
	}
	if (color.b < 1){
		color.b += inc;
	}

	if (emissive.r < 1){
		emissive.r += inc;
	}
	if (emissive.g < 1){
		emissive.g += inc;
	}
	if (emissive.b < 1){
		emissive.b += inc;
	}
}
