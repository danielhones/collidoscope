/*
(c) 2015 Daniel Hones
MIT License
*/

var CANVAS_WIDTH = window.innerWidth;
var CANVAS_HEIGHT = window.innerHeight;
document.getElementById('game-canvas').width = CANVAS_WIDTH;
document.getElementById('game-canvas').height = CANVAS_HEIGHT;

var UP_KEY = 38;
var DOWN_KEY = 40;
var LEFT_KEY = 37;
var RIGHT_KEY = 39;


var Position = function(x, y) {
    this.x = x;
    this.y = y;
};

var Vector = function() {};
Vector.prototype._x = 1;
Vector.prototype._y = 0;
Vector.prototype._mag = 0;
Vector.prototype._dir = 0;  // in radians
    
Vector.prototype._updateMagAndDir = function() {
    this._mag = Math.sqrt(Math.pow(this._x, 2) + Math.pow(this._y, 2));
    this._dir = Math.atan(this._y/this._x);
    return this;
};

Vector.prototype._updateXandY = function() {
    this._x = this._mag * Math.cos(this._dir);
    this._y = this._mag * Math.sin(this._dir);
    return this;
};

Vector.prototype.x = function() {
    if (arguments.length === 1) {
	this._x = arguments[0];
	this._updateMagAndDir();
    }
    return this._x;
};

Vector.prototype.y = function() {
    if (arguments.length === 1) {
	this._y = arguments[0];
	this._updateMagAndDir();
    }
    return this._y;
};

Vector.prototype.unitX = function() {
    return this._x / this._mag;
};

Vector.prototype.unitY = function() {
    return this._y / this._mag;
};
    
Vector.prototype.mag = function() {
    if (arguments.length === 1) {
	//delta_mag = arguments[0];
	this._mag += arguments[0];//delta_mag;
	this._updateXandY();
    }
    return this._mag;
};
    
Vector.prototype.dir = function() {
    if (arguments.length === 1) {
	//delta_dir = arguments[0];
	this._dir += arguments[0];//delta_dir;
	this._updateXandY();
    }
    return this._dir;
};
    
var Player = function() {
    var DEFAULT_X = Math.floor(CANVAS_WIDTH / 2);
    var DEFAULT_Y = Math.floor(CANVAS_HEIGHT / 2);
    var DEFAULT_INITIAL_SPEED = 2;
    var DEFAULT_MAX_HEALTH = 100;
    var SPEED_INCREMENT = 0.2;
    var that = this;
    var canvas = document.getElementById('game-canvas');
    var ctx = canvas.getContext('2d');
    var _WIDTH = 15;
    var _LENGTH = 30;
    var _vector = new Vector();
    var DIR_INCREMENT = 0.1;
    var keysDown = {};
    
    this.color = [0, 0, 0, 1];  // rgba() values
    this.dir = function() {
	_vector.dir.apply(_vector, arguments);
    };
    //this.speed = _vector.mag;
    this.speed = function() {
	_vector.mag.apply(_vector, arguments);
    };			  

    this.keyBindings = {};
    this.keyBindings[UP_KEY] = function() {that.speed(SPEED_INCREMENT);};
    this.keyBindings[DOWN_KEY] = function() {that.speed(-SPEED_INCREMENT);};
    this.keyBindings[RIGHT_KEY] = function() {that.dir(DIR_INCREMENT);};
    this.keyBindings[LEFT_KEY] = function() {that.dir(-DIR_INCREMENT);};
    
    this.speed(DEFAULT_INITIAL_SPEED);
    this.position = new Position(DEFAULT_X, DEFAULT_Y);
    this.maxHealth = DEFAULT_MAX_HEALTH;
    if (arguments.length >= 1) {
	this.speed(arguments[0]);
    }
    if (arguments.length >= 2) {
	this.position = new Position(arguments[1][0], arguments[1][1]);
    }
    if (arguments.length >= 3) {
	this.maxHealth = arguments[2];
    }
    this.health = this.maxHealth;

    this.update = function() {
	move();
	checkBounds();
	draw();
    };

    this.reduceHealth = function(damage) {
	that.health -= damage;
	updateTransparency();
    };

    this.increaseHealth = function(increment) {
	that.health += increment;
	if (that.health > that.maxHealth) {
	    that.health = that.maxHealth;
	}
	updateTransparency();
    };

    this.addKey = function(keyCode) {
	keysDown[keyCode] = true;
    };

    this.removeKey = function(keyCode) {
	delete keysDown[keyCode];
    };
    
    function updateTransparency() {
	that.color[3] = 0.2 + 0.8 * (that.health / that.maxHealth);
    }

    function move() {
	handleKeys();
	that.position.x += _vector.x();
	that.position.y += _vector.y();
    };

    function handleKeys() {
	for (var key in keysDown) {
	    if (key in that.keyBindings) {
		that.keyBindings[key]();
	    }
	}
    }

    function draw() {
	var backLeft = {
	    x: back('x') - _WIDTH * _vector.unitY() / 2,
	    y: back('y') + _WIDTH * _vector.unitX() / 2
	};
	var backRight = {
	    x: back('x') + _WIDTH * _vector.unitY() / 2,
	    y: back('y') - _WIDTH * _vector.unitX() / 2
	};

	ctx.beginPath();
	ctx.moveTo(that.position.x, that.position.y);
	ctx.lineTo(backLeft.x, backLeft.y);
	ctx.lineTo(backRight.x, backRight.y);
	ctx.lineTo(that.position.x, that.position.y);
	ctx.fillStyle = 'rgba(' + that.color.join(',') + ')';
	ctx.fill();
    };

    function back(coord) {
	if (coord.toLowerCase() === 'x') {
	    return that.position.x - _LENGTH * _vector.unitX();
	} else if (coord.toLowerCase() === 'y') {
	    return that.position.y - _LENGTH * _vector.unitY();
	} else {
	    return undefined;
	}
    }

    function checkBounds() {
	// Might be cool to have the boundaries reflect rather than teleport
	if (that.position.x > CANVAS_WIDTH) {
	    that.position.x = 0;
	}
	if (that.position.x < 0) {
	    that.position.x = CANVAS_WIDTH;
	}
	if (that.position.y > CANVAS_HEIGHT) {
	    that.position.y = 0;
	}
	if (that.position.y < 0) {
	    that.position.y = CANVAS_HEIGHT;
	}
    }
};
