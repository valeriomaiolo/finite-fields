export function tuningGen(SpheresPerEdge, intonation) { 

    /* Semitoni
    let xAxisInterval = 7; //Fifths default
    let yAxisInterval = 4; //Maj.Thirds default
    let zAxisInterval = 10; // min.Seventh default
    */

    let xAxisInterval = 3; //Fifths default
    let yAxisInterval = 7; //Maj.Thirds default
    let zAxisInterval = 11; // min.Seventh default


    let Oct = 1;

    let f0 = 200;

    let ratio = new Array(SpheresPerEdge);

    for (var i = 0; i < SpheresPerEdge; i++){
        ratio[i]= new Array(SpheresPerEdge);
    }
    
    for (var i = 0; i < SpheresPerEdge; i++){
        for (var j = 0; j < SpheresPerEdge; j++){
            ratio[i][j]= new Array(SpheresPerEdge);
        }
    }

    for(var i = 0; i<SpheresPerEdge; i++){
		for(var j = 0; j<SpheresPerEdge; j++){
			for(var k = 0; k<SpheresPerEdge; k++){

                ratio[i][j][k] = Math.pow(xAxisInterval, i)*Math.pow(yAxisInterval, j)*Math.pow(zAxisInterval, k);
                console.log("i = " + i + " j = " + j + " k= " + k + " ratio = " + ratio[i][j][k]);

                while (ratio[i][j][k] > 2) {
                    ratio[i][j][k] *= Math.pow(2, -1);
                }

                console.log("E ancora, i = " + i + " j = " + j + " k= " + k + " ratio = " + ratio[i][j][k]);
                
                intonation[i][j][k] = (f0 *ratio[i][j][k]);
            }
        }
    }

    return intonation;
}