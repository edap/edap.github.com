import PalmGenerator from './PalmGenerator.js';
import {BoxGeometry, BufferAttribute, BufferGeometry, Vector3, CatmullRomCurve3} from 'three';
import LeafGeometry from './LeafGeometry.js';

export default class Palms{
    //questo file deve generare solo 2 o tre palme e restituirle in un array
    constructor(){
        this.smallTrunk =  new BoxGeometry(2,2,2);
        this.trunkGeometry =  new BoxGeometry(5,5,5);
        let n_palms = 6;
        let palms = [];
        for (let i =0; i< n_palms; i++){
            let trunkGeometry = this._getTrunkGeometry(i);
            let leafGeometry = new LeafGeometry(this.leafOptions()[i]);
            let curve = this.getCurves()[i];
            let palm = new PalmGenerator(leafGeometry,
                                         trunkGeometry,
                                         this.palmOptions()[i],
                                         curve
                                        );
            let geometry = palm.geometry;
            let bufGeometry = new BufferGeometry().fromGeometry(geometry);
            let palmBuffers = palm.buffers;
            bufGeometry.addAttribute( 'angle', new BufferAttribute(
                palmBuffers.angle,
                1));

            palms.push(bufGeometry);
        }
        return palms;
    }

    _getTrunkGeometry(palm_type){
        //if piccoletto and punta, small cubes
        if([5,1].includes(palm_type)){
            return this.smallTrunk;
        }else{
            return this.trunkGeometry;
        }
    }

    leafOptions(){
        let leaf_one = {
            length: 90,
            length_stem: 2,
            width_stem: 0.2,
            leaf_width: 1,
            leaf_up: 6,
            density: 16,
            curvature: 0.01,
            curvature_border: 0.002,
            leaf_inclination: 0.8
        };

        let piccoletto_leaf = {
            length: 24,
            length_stem: 6,
            width_stem: 0.4,
            leaf_width: 1,
            leaf_up: 1.5,
            density: 15,
            curvature: 0.06,
            curvature_border: 0.007,
            leaf_inclination: 0.9
        };

        let leaf_cardo ={
            length: 50,
            length_stem: 4,
            width_stem: 0.5,
            leaf_width: 0.5,
            leaf_up: 1.5,
            density: 30,
            curvature: 0.03,
            curvature_border: 0.005,
            leaf_inclination: 0.70
        };
        let leaf_bella = {
            length: 50,
            length_stem: 20,
            width_stem: 0.2,
            leaf_width: 0.8,
            leaf_up: 1.5,
            density: 11,
            curvature: 0.04,
            curvature_border: 0.005,
            leaf_inclination: 0.9
        };
        let leaf_sigaro = {
            length: 55,
            length_stem: 2,
            width_stem: 0.5,
            leaf_width: 0.60,
            leaf_up: 1.5,
            density: 80,
            curvature: 0.02,
            curvature_border: 0.004,
            leaf_inclination: 0.1
        };
        let punta_leaf = {
            length: 24,
            length_stem: 2,
            width_stem: 0.3,
            leaf_width: 0.5,
            leaf_up: 1.5,
            density: 18,
            curvature: 0.01,
            curvature_border: 0.002,
            leaf_inclination: 1.0
        };

        return [leaf_one, piccoletto_leaf, leaf_cardo, leaf_bella, leaf_sigaro, punta_leaf];
    }

    palmOptions(){
        let palm_one = {
            spread: 0.2,
            angle: 137.66,
            num: 628,
            growth: 0.25,
            foliage_start_at: 65.64,
            trunk_regular: true,
            buffers: true,
            angle_open: 75.87,
            starting_angle_open: 51.65
        };
        let piccoletto = {
            spread: 0.03,
            angle: 137.14,
            num: 100,
            growth: 0.2,
            buffers: true,
            foliage_start_at: 44,
            angle_open: 0,
            starting_angle_open: 52,
            trunk_regular: true
        };
        //small
        let cardo = {
            spread: 0,
            angle: 137.5,
            num: 240,
            growth: 0.01,
            foliage_start_at: 26.12,
            trunk_regular: true,
            buffers: true,
            angle_open: 36.46,
            starting_angle_open: 50
        };
        //la piu' bella
        let bella = {
            spread: 0.1,
            angle: 137.5,
            num: 406,
            growth: 0.12,
            foliage_start_at: 86.19,
            trunk_regular: false,
            buffers: true,
            angle_open: 36.17,
            starting_angle_open: 50
        };

        let sigaro = {
            spread: 0.05,
            angle: 137.5,
            num: 431,
            growth: 0.18,
            foliage_start_at: 20.84,
            trunk_regular: false,
            buffers: true,
            angle_open: 0,
            starting_angle_open: 50
        };

        let punta = {
            spread: 0.03,
            angle: 137.14,
            num: 100,
            growth: 0.05,
            buffers: true,
            foliage_start_at: 44,
            angle_open: 30,
            starting_angle_open: 12,
            trunk_regular: false
        };



        let options = [palm_one, piccoletto, cardo, bella, sigaro, punta];
        return options;
    }

    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    getCurves(){
        let curve_first = new CatmullRomCurve3( [
            new Vector3( -15, 120, -11 ),
            new Vector3( -8, 90, -9 ),
            new Vector3( 0, 50, -5 ),
            new Vector3( 0, 0, 0 ),
        ] );

        let curve_piccoletto = new CatmullRomCurve3( [
            new Vector3( 0, 35, 0 ),
            new Vector3( 0, 0, 0 ),
        ] );

        let curve_sigaro = new CatmullRomCurve3( [
            new Vector3( -7, 45, -7 ),
            new Vector3( -7, 30, -7 ),
            new Vector3( -2, 15, 0 ),
            new Vector3( 0, 0, 0 ),
        ] );
        let curve_bella = new CatmullRomCurve3( [
            new Vector3( -20, 120, -20 ),
            new Vector3( -10, 100, -20 ),
            new Vector3( 0, 60, 0 ),
            new Vector3( 0, 0, 0 ),
        ] );
        let curve_cardo = new CatmullRomCurve3( [
            new Vector3( 3, 60, 3 ),
            new Vector3( 1, 45, 1 ),
            new Vector3( -2, 30, -1 ),
            new Vector3( -2, 15, 0 ),
            new Vector3( 0, 0, 0 ),
        ] );

        let curve_punta = curve_piccoletto;

        return [curve_first, curve_piccoletto, curve_cardo, curve_bella,curve_sigaro, curve_punta];
    }


}
