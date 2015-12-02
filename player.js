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

var Vector = function() {
    var _x = 1;
    var _y = 0;
    var _mag = 0;
    var _dir = 0;  // in radians

    function updateMagAndDir() {
	_mag = Math.sqrt(Math.pow(_x, 2) + Math.pow(_y, 2));
	_dir = Math.atan(y/x);
    }

    function updateXandY() {
	_x = _mag * Math.cos(_dir);
	_y = _mag * Math.sin(_dir);
    }
    
    this.x = function() {
	if (arguments.length === 1) {
	    _x = arguments[0];
	    updateMagAndDir();
	}
	return _x;
    };

    this.y = function() {
	if (arguments.length === 1) {
	    _y = arguments[0];
	    updateMagAndDir();
	}
	return _y;
    };

    this.unitX = function() {
	return _x / _mag;
    };

    this.unitY = function() {
	return _y / _mag;
    };
    
    this.mag = function() {
	if (arguments.length === 1) {
	    delta_mag = arguments[0];
	    _mag += delta_mag;
	    updateXandY();
	}
	return _mag;
    };
    
    this.dir = function() {
	if (arguments.length === 1) {
	    delta_dir = arguments[0];
	    _dir += delta_dir;
	    updateXandY();
	}
	return _dir;
    };
}
    
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
    this.dir = _vector.dir;
    this.speed = _vector.mag;

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
