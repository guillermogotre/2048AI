"use strict"

function IA(gameManager){
    this.gameManager = gameManager;
    this.active = false;
    this.cache = {};
    this.cacheKeys = [];
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

IA.prototype.start = async function(cb){
    this.active = true;
    while(this.active && !this.gameManager.isGameTerminated()){
        var n = Math.floor(this.gameManager.grid.availableCells().length/4);
        var mov = this.alphaBeta(this.gameManager.grid, 7-n, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, true, true);
        this.gameManager.move(mov);
        await sleep(50);
    }
    cb();
    this.cache = {};
    this.cacheKeys = [];
    this.active = false;
};

IA.prototype.stop = function(){
    this.active = false;
};

IA.prototype.alphaBeta = function(node, depth, alpha, beta, maxPlayer, parent){
    var v;
    var i;
    var children = [];
    var childPos;
    var child;
    if(depth === 0 || this.terminal(node)){
        return this.heuristic(node);
    }
    if(depth === 0) {
        return this.heuristic(node);
    }
    else if (maxPlayer){
        v = Number.MIN_SAFE_INTEGER;
        for(i=0; i<4; i++){
            child = this.createMovementNode(node,i);
            if(!this.isEqual(node,child)){
                children.push({
                    pos: i,
                    node: child
                });
            }
        }
        children.sort(this.compare);
        for(i=children.length-1; i>=0; i--){
            v = Math.max(v,this.alphaBeta(children[i].node,depth-1,alpha,beta,false,false));
            if(v > alpha){
                alpha = v;
                childPos = i;
            }
            if(beta <= alpha){
                break;
            }
        }
        if(parent){
            console.log("Heuristic:",v);
            return children[childPos].pos;
        }else{
            return v;
        }
    }
    else{
        v = Number.MAX_SAFE_INTEGER;
        var emptyTiles = node.availableCells();
        for(i=0; i<emptyTiles.length; i++){
        //for(i=emptyTiles.length-1; i>=0; i--){
            child = this.createAddNode(node,emptyTiles[i],2);
            children.push({
                pos: i,
                node: child
            });
            child = this.createAddNode(node,emptyTiles[i],4);
            children.push({
                pos: i,
                node: child
            });
        }
        children.sort(this.compare);
        for(i=0; i<children.length; i++){
            v = Math.min(v,this.alphaBeta(children[i].node,depth-1,alpha,beta,true,false));
            beta = Math.min(beta,v);
            if(beta <= alpha){
                break;
            }
        }
        return v;
    }
};

IA.prototype.compare = function(nodeA, nodeB){
    var hA=0;
    var hB=0;
    var cell;
    for(var x=0; x < 4; x++){
        for(var y=0; y < 4; y++){
            cell = nodeA.node.cells[x][y];
            if(cell) {
                hA += (cell.value * cell.value);
            }
            cell = nodeB.node.cells[x][y];
            if(cell) {
                hB += (cell.value * cell.value);
            }
        }
    }
    if(hA < hB) {
        return -1;
    }else if(hB > hA){
        return 1;
    }else {
        return 0;
    }
};

IA.prototype.createCompare = function(self){
    return(
        function(nodeA, nodeB){
            var hA = self.heuristic(nodeA.node);
            var hB = self.heuristic(nodeB.node);
            if(hA < hB) {
                return -1;
            }else if(hB > hA){
                return 1;
            }else {
                return 0;
            }
        }
    );
};

IA.prototype.terminal = function(node){
    var cell;
    for (var i=0; i< this.gameManager.size; i++){
        for(var j=0; j< this.gameManager.size; j++){
            cell = node.cells[i][j];
            if(!cell){
                return false;
            }else{
                if(node.withinBounds({x:i-1,y:j}) && node.cells[i-1][j] && (node.cells[i-1][j].value === cell.value)){
                    return false;                }
                if(node.withinBounds({x:i+1,y:j}) && node.cells[i+1][j] && (node.cells[i+1][j].value === cell.value)) {
                    return false;                }
                if(node.withinBounds({x:i,y:j-1}) && node.cells[i][j-1] && (node.cells[i][j-1].value === cell.value)) {
                    return false;                }
                if(node.withinBounds({x:i,y:j+1}) && node.cells[i][j+1] && (node.cells[i][j+1].value === cell.value)) {
                    return false;                }
            }
        }
    }
    return true;
};

/*
IA.prototype.heuristic = function(node){
    var sum = 0;
    node.eachCell(function(x,y,cell){
        if(cell) {
            sum += (cell.value * cell.value);
        }
    });
    //return node.availableCells().length * sum;
    return node.availableCells().length;
    //return sum;
};
*/

/*
IA.prototype.heuristic = function(node){
    var sum = 0;
    var tsum;
    if(this.terminal(node)){
        return Number.MIN_SAFE_INTEGER + 1;
    }
    node.eachCell(function(x,y,cell){
        if(cell) {
            tsum = 0;
            if(node.withinBounds({x:x-1,y:y}) && node.cells[x-1][y]) {
                tsum += Math.abs(cell.value - node.cells[x-1][y].value);
            }
            if(node.withinBounds({x:x+1,y:y}) && node.cells[x+1][y]) {
                tsum += Math.abs(cell.value - node.cells[x+1][y].value);
            }
            if(node.withinBounds({x:x,y:y-1}) && node.cells[x][y-1]) {
                tsum += Math.abs(cell.value - node.cells[x][y-1].value);
            }
            if(node.withinBounds({x:x,y:y+1}) && node.cells[x][y+1]) {
                tsum += Math.abs(cell.value - node.cells[x][y+1].value);
            }
            sum += (cell.value * cell.value) - tsum;
        }
    });
    return sum;
};
*/
/*
IA.prototype.heuristic = function(node){
    var heu = this.getFromCache(node);
    if(heu){
        return heu;
    }else{
        heu = 0;
        var tsum;
        var tmin;
        if(this.terminal(node)){
            return Number.MIN_SAFE_INTEGER + 1;
        }
        node.eachCell(function(x,y,cell){
            if(cell) {
                tsum = 0;
                tmin = 0;
                if(node.withinBounds({x:x-1,y:y}) && node.cells[x-1][y]) {
                    tmin += Math.abs(cell.value - node.cells[x-1][y].value);
                    tsum = Math.min(tsum,Math.abs(cell.value - node.cells[x-1][y].value));
                }
                if(node.withinBounds({x:x+1,y:y}) && node.cells[x+1][y]) {
                    tmin += Math.abs(cell.value - node.cells[x+1][y].value);
                    tsum = Math.min(tsum,Math.abs(cell.value - node.cells[x+1][y].value));
                }
                if(node.withinBounds({x:x,y:y-1}) && node.cells[x][y-1]) {
                    tmin += Math.abs(cell.value - node.cells[x][y-1].value);
                    tsum = Math.min(tsum,Math.abs(cell.value - node.cells[x][y-1].value));
                }
                if(node.withinBounds({x:x,y:y+1}) && node.cells[x][y+1]) {
                    tmin += Math.abs(cell.value - node.cells[x][y+1].value);
                    tsum = Math.min(tsum,Math.abs(cell.value - node.cells[x][y+1].value));
                }
                heu += (cell.value * cell.value) - (tsum * tsum) - tmin;
            }
        });
        this.setInCache(node,heu);
        return heu;
    }
};
*/

/*
IA.prototype.heuristic = function(node){
    var heu = 0;
    var tsum;
    var tmin;
    var cell;
    var nextCell = {x:0, y:0};
    var nextCellValue = 0;
    var emptyCells = 16;
    var colCells;
    if(this.terminal(node)){
        return Number.MIN_SAFE_INTEGER + 1;
    }
    for(var x=0; x<this.gameManager.size; x++){
        for(var y=0; y<this.gameManager.size; y++){
            cell = node.cells[x][y];
            colCells = 0;
            if(cell) {
                emptyCells -= 1;
                tsum = 0;
                tmin = 0;
                if (node.withinBounds({x: x - 1, y: y}) && node.cells[x - 1][y]) {
                    colCells += 1;
                    if(node.cells[x-1][y].value>nextCellValue){
                        nextCell.x = x-1;
                        nextCell.y = y;
                        nextCellValue = node.cells[x-1][y].value;
                    }
                    tmin += Math.abs(cell.value - node.cells[x - 1][y].value);
                    tsum = Math.min(tsum, Math.abs(cell.value - node.cells[x - 1][y].value));
                }
                if (node.withinBounds({x: x + 1, y: y}) && node.cells[x + 1][y]) {
                    colCells += 1;
                    if(node.cells[x+1][y].value>nextCellValue){
                        nextCell.x = x+1;
                        nextCell.y = y;
                        nextCellValue = node.cells[x+1][y].value;
                    }
                    tmin += Math.abs(cell.value - node.cells[x + 1][y].value);
                    tsum = Math.min(tsum, Math.abs(cell.value - node.cells[x + 1][y].value));
                }
                if (node.withinBounds({x: x, y: y - 1}) && node.cells[x][y - 1]) {
                    colCells += 1;
                    if(node.cells[x][y-1].value>nextCellValue){
                        nextCell.x = x;
                        nextCell.y = y-1;
                        nextCellValue = node.cells[x][y-1].value;
                    }
                    tmin += Math.abs(cell.value - node.cells[x][y - 1].value);
                    tsum = Math.min(tsum, Math.abs(cell.value - node.cells[x][y - 1].value));
                }
                if (node.withinBounds({x: x, y: y + 1}) && node.cells[x][y + 1]) {
                    colCells += 1;
                    if(node.cells[x][y+1].value>nextCellValue){
                        nextCell.x = x;
                        nextCell.y = y+1;
                        nextCellValue = node.cells[x][y+1].value;
                    }
                    tmin += Math.abs(cell.value - node.cells[x][y + 1].value);
                    tsum = Math.min(tsum, Math.abs(cell.value - node.cells[x][y + 1].value));
                }
                //heu += (cell.value * cell.value) - (tsum * tsum) - tmin;
                if(colCells > 0) {
                    //heu += ((cell.value * Math.max(nextCellValue, 1)) * emptyCells - ((tmin / colCells) * (tmin / colCells)));
                    heu += ((cell.value * Math.max(nextCellValue, 1)) * emptyCells);
                }
                else {
                    heu += (cell.value * Math.max(nextCellValue, 1)) * emptyCells;
                }
            }
        }
    }
    return heu;
};
*/
IA.prototype.heuristic = function(node){
    var heu = 0;
    var tsum;
    var tmin;
    var cell;
    var nextCell = {x:0, y:0};
    var nextCellValue = 0;
    var emptyCells = 16;
    var colCells;
    if(this.terminal(node)){
        return Number.MIN_SAFE_INTEGER + 1;
    }
    for(var x=0; x<this.gameManager.size; x++){
        for(var y=0; y<this.gameManager.size; y++){
            cell = node.cells[x][y];
            colCells = 0;
            if(cell) {
                emptyCells -= 1;
                tsum = 0;
                tmin = 0;
                if (node.withinBounds({x: x - 1, y: y}) && node.cells[x - 1][y]) {
                    colCells += 1;
                    if(node.cells[x-1][y].value>nextCellValue){
                        nextCell.x = x-1;
                        nextCell.y = y;
                        nextCellValue = node.cells[x-1][y].value;
                    }
                    tmin += Math.abs(cell.value - node.cells[x - 1][y].value);
                    tsum = Math.min(tsum, Math.abs(cell.value - node.cells[x - 1][y].value));
                }
                if (node.withinBounds({x: x + 1, y: y}) && node.cells[x + 1][y]) {
                    colCells += 1;
                    if(node.cells[x+1][y].value>nextCellValue){
                        nextCell.x = x+1;
                        nextCell.y = y;
                        nextCellValue = node.cells[x+1][y].value;
                    }
                    tmin += Math.abs(cell.value - node.cells[x + 1][y].value);
                    tsum = Math.min(tsum, Math.abs(cell.value - node.cells[x + 1][y].value));
                }
                if (node.withinBounds({x: x, y: y - 1}) && node.cells[x][y - 1]) {
                    colCells += 1;
                    if(node.cells[x][y-1].value>nextCellValue){
                        nextCell.x = x;
                        nextCell.y = y-1;
                        nextCellValue = node.cells[x][y-1].value;
                    }
                    tmin += Math.abs(cell.value - node.cells[x][y - 1].value);
                    tsum = Math.min(tsum, Math.abs(cell.value - node.cells[x][y - 1].value));
                }
                if (node.withinBounds({x: x, y: y + 1}) && node.cells[x][y + 1]) {
                    colCells += 1;
                    if(node.cells[x][y+1].value>nextCellValue){
                        nextCell.x = x;
                        nextCell.y = y+1;
                        nextCellValue = node.cells[x][y+1].value;
                    }
                    tmin += Math.abs(cell.value - node.cells[x][y + 1].value);
                    tsum = Math.min(tsum, Math.abs(cell.value - node.cells[x][y + 1].value));
                }
                //heu += (cell.value * cell.value) - (tsum * tsum) - tmin;
                heu += ((cell.value * Math.max(nextCellValue,1))*emptyCells - ((tmin/4)*(tmin/4)));
            }
        }
    }
    return heu;
};

/*
IA.prototype.heuristic = function(node){
    var heu = 0;
    var tsum;
    var tmin;
    var cell;
    var usedCells = 0;
    var maxVal = -1;
    var maxValPos = {x:0,y:0};

    if(this.terminal(node)){
        return Number.MIN_SAFE_INTEGER + 1;
    }
    for(var x=0; x<this.gameManager.size; x++){
        for(var y=0; y<this.gameManager.size; y++){
            cell = node.cells[x][y];
            if(cell) {
                usedCells++;
                tsum = 0;
                tmin = 0;
                if (node.withinBounds({x: x - 1, y: y}) && node.cells[x - 1][y]) {
                    tmin += Math.abs(cell.value - node.cells[x - 1][y].value);
                    tsum = Math.min(tsum, Math.abs(cell.value - node.cells[x - 1][y].value));
                }
                if (node.withinBounds({x: x + 1, y: y}) && node.cells[x + 1][y]) {
                    tmin += Math.abs(cell.value - node.cells[x + 1][y].value);
                    tsum = Math.min(tsum, Math.abs(cell.value - node.cells[x + 1][y].value));
                }
                if (node.withinBounds({x: x, y: y - 1}) && node.cells[x][y - 1]) {
                    tmin += Math.abs(cell.value - node.cells[x][y - 1].value);
                    tsum = Math.min(tsum, Math.abs(cell.value - node.cells[x][y - 1].value));
                }
                if (node.withinBounds({x: x, y: y + 1}) && node.cells[x][y + 1]) {
                    tmin += Math.abs(cell.value - node.cells[x][y + 1].value);
                    tsum = Math.min(tsum, Math.abs(cell.value - node.cells[x][y + 1].value));
                }

                heu += (cell.value * cell.value) - (tsum * tsum) - tmin;
                if(cell.value > maxVal){
                    maxVal = cell.value;
                    maxValPos.x = x;
                    maxValPos.y = y;
                }
            }
        }
    }
    var pos = maxValPos.x+maxValPos.y;
    if(pos === 0 || pos === 6 || pos === 3){
        var contador = 1;
        var contigua = true;
        for
    }
    return heu;
};
*/

IA.prototype.move = function(grid, direction){
    var cell, tile;

    //var vector     = this.getVector(direction);
    var vector = (function (direction) {
        // Vectors representing tile movement
        var map = {
            0: { x: 0,  y: -1 }, // Up
            1: { x: 1,  y: 0 },  // Right
            2: { x: 0,  y: 1 },  // Down
            3: { x: -1, y: 0 }   // Left
        };

        return map[direction];
    })(direction);

    //var traversals = this.buildTraversals(vector);
    var self = this;
    var trav = (function (vector) {
        var traversals = { x: [], y: [] };

        for (var pos = 0; pos < self.gameManager.size; pos++) {
            traversals.x.push(pos);
            traversals.y.push(pos);
        }

        // Always traverse from the farthest cell in the chosen direction
        if (vector.x === 1) {traversals.x = traversals.x.reverse();}
        if (vector.y === 1) {traversals.y = traversals.y.reverse();}

        return traversals;
    })(vector);

    // Save the current tile positions and remove merger information
    //this.prepareTiles();
    grid.eachCell(function (x, y, tile) {
        if (tile) {
            tile.mergedFrom = null;
            tile.savePosition();
        }
    });

    // Traverse the grid in the right direction and move tiles
    trav.x.forEach(function (x) {
        trav.y.forEach(function (y) {
            cell = { x: x, y: y };
            tile = grid.cellContent(cell);

            if (tile) {
                //var positions = self.findFarthestPosition(cell, vector);
                var positions = (function (cell, vector) {
                    var previous;

                    // Progress towards the vector direction until an obstacle is found
                    do {
                        previous = cell;
                        cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
                    } while (grid.withinBounds(cell) &&
                    grid.cellAvailable(cell));

                    return {
                        farthest: previous,
                        next: cell // Used to check if a merge is required
                    };
                })(cell, vector);

                var next      = grid.cellContent(positions.next);

                // Only one merger per row traversal?
                if (next && next.value === tile.value && !next.mergedFrom) {
                    var merged = new Tile(positions.next, tile.value * 2);
                    merged.mergedFrom = [tile, next];

                    grid.insertTile(merged);
                    grid.removeTile(tile);

                    // Converge the two tiles' positions
                    tile.updatePosition(positions.next);

                } else {
                    grid.cells[tile.x][tile.y] = null;
                    grid.cells[positions.farthest.x][positions.farthest.y] = tile;
                    tile.updatePosition(positions.farthest);
                }
            }
        });
    });

    return grid;
};

IA.prototype.createMovementNode = function(parent, movement){
    var node = new Grid(parent.size,parent.serialize().cells);
    this.move(node,movement);
    return node;
};

IA.prototype.createAddNode = function(parent, pos, val){
    var tile = new Tile(pos,val);
    var node = new Grid(parent.size,parent.serialize().cells);
    node.insertTile(tile);
    return node;
};

IA.prototype.isEqual = function(nodeA, nodeB){
    return JSON.stringify(nodeA.serialize()) === JSON.stringify(nodeB.serialize());
};

IA.prototype.getFromCache = function(node){
    var key = this.makeKey(node);
    return this.cache[key];
};

IA.prototype.setInCache = function(node,val){
    var key = this.makeKey(node);
    if(this.cacheKeys.length > 100){
        delete this.cache[this.cacheKeys.shift()];
    }
    this.cacheKeys.push(key);
    this.cache[key] = val;
};

IA.prototype.makeKey = function(node){
    var key = "";
    node.eachCell(function(x,y,tile){
        if(tile){
            key += tile.value;
        }
        else{
            key += "0";
        }
        key += "_";
    });
    return key;
}