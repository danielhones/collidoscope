/*
(c) 2015 Daniel Hones
MIT License
*/

var FRAME_RATE = 30;
var UPDATE_INTERVAL = Math.floor(1000 / FRAME_RATE);
var OBSTACLE_MIN_SIZE = 20;
var OBSTACLE_MAX_SIZE = 60;
if (CANVAS_WIDTH < 800 || CANVAS_HEIGHT < 600) {
    OBSTACLE_MIN_SIZE = 15;
    OBSTACLE_MAX_SIZE = 40;
}

// Sound effect from https://www.freesound.org/people/leviclaassen/sounds/107789/
var hitSound = new Audio('audio/hit.ogg');
var goalSound = new Audio('audio/goal.ogg');
hitSound.volume = 0.6;
goalSound.volume = 0.6;

Audio.prototype.playFromStart = function() {
    this.pause();
    this.currentTime = 0;
    this.play();
};

var canvas = document.getElementById('game-canvas');
var ctx = canvas.getContext('2d');


// TODO: figure out how to make this inherit from Player since there's some duplicate functionality
// or have Obstacle, Goal, and Player inherit from a common ancestor
var Obstacle = function() {
    this.MIN_SPEED = 0.5;
    this.MAX_SPEED = 3;
    this.vector = new Vector();
    this.vector.dir(2 * Math.PI * Math.random());
    this.vector.mag(this.MIN_SPEED + (this.MAX_SPEED - this.MIN_SPEED) * Math.random());
    this.randomNum = Math.random();
    this.x = Math.floor(CANVAS_WIDTH * this.randomNum);
    this.y = Math.floor(CANVAS_HEIGHT * this.randomNum);
    this.size = OBSTACLE_MIN_SIZE + Math.floor((OBSTACLE_MAX_SIZE-OBSTACLE_MIN_SIZE) * this.randomNum);
    // The opacity of the obstacle is proportional to the damage it deals:
    this.transparency = 0.3 + Math.floor(7*this.randomNum) / 10;
    this.color = [255, 0, 0, this.transparency];
    this.damage = 1 + Math.floor(9*this.randomNum);
};

Obstacle.prototype.update = function() {
    this.move();
    this.checkBounds();
    this.draw();
};
    
Obstacle.prototype.draw = function() {
    ctx.fillStyle = 'rgba(' + this.color.join(',') + ')';
    ctx.fillRect(this.x, this.y, this.size, this.size);
};

Obstacle.prototype.pointInside = function(point) {
    if ((point.x > this.x && point.x < this.x + this.size) &&
	(point.y > this.y && point.y < this.y + this.size)) {
	return true;
    } else {
	return false;
    }
};

Obstacle.prototype.move = function() {
    this.x += this.vector.x();
    this.y += this.vector.y();
};

Obstacle.prototype.checkBounds = function() {
    if (this.x > CANVAS_WIDTH) {
	this.x = 0;
    }
    if (this.x < 0) {
	this.x = CANVAS_WIDTH;
    }
    if (this.y > CANVAS_HEIGHT) {
	this.y = 0;
    }
    if (this.y < 0) {
	this.y = CANVAS_HEIGHT;
    }
};



var Goal = function() {
    var DEFAULT_SIZE = 8;
    var COURTESY_MARGIN = 4;
    //var ctx = canvas.getContext('2d');
    var that = this;

    this.size = DEFAULT_SIZE;
    if (arguments.length === 1) {
	this.size = arguments[0];
    }

    this.color = 'rgba(0,0,255,0.7)';
    this.x = Math.floor(DEFAULT_SIZE + (CANVAS_WIDTH - 2*DEFAULT_SIZE) * Math.random());
    this.y = Math.floor(DEFAULT_SIZE + (CANVAS_HEIGHT - 2*DEFAULT_SIZE) * Math.random());
    // We make the goal a little easier to hit:
    this.hittableRect = {
	x: this.x - this.size - COURTESY_MARGIN,
	y: this.y - this.size - COURTESY_MARGIN,
	width: 2 * (this.size + COURTESY_MARGIN),
	height: 2 * (this.size + COURTESY_MARGIN)
    };

    this.draw = function() {
	ctx.fillStyle = that.color;
	ctx.beginPath();
	ctx.arc(that.x, that.y, that.size, 0, 2*Math.PI);
	ctx.fill();
    };
};


// TODO: Consider making the player regenerate health slowly when he's not hitting anything
var Game = function() {
    var INITIAL_SPEED = 4;
    var MIN_SPEED = INITIAL_SPEED + 2;  // Can only slow down so much
    var MAX_SPEED = 32;
    var SPEED_INCREMENT = 0.3;
    var SPEED_DECREMENT = -SPEED_INCREMENT / 2;
    var SCORE_INCREMENT = 100;
    var FONT = '24px sans';
    var FONT_COLOR = '#404040';
    var HEALTH_INCREMENT = 10;
    //var canvas = document.getElementById('game-canvas');
    //var ctx = canvas.getContext('2d');
    var goal = new Goal();
    var playerCurrentlyHit = false;
    var keysDown = {};
    var count = 0;
    var that = this;

    this.player = new Player(INITIAL_SPEED);
    // So they can't control the speed:
    delete this.player.keyBindings[UP_KEY];
    delete this.player.keyBindings[DOWN_KEY];
    
    this.score = 0;
    var obstacles = [new Obstacle(), new Obstacle()];

    this.update = function() {
	count++;
	
	that.clearCanvas();
	
	obstacles.forEach(function(i) {
	    i.update();
	});
	goal.draw();
	that.player.update();

	if (playerHitGoal()) {
	    goalSound.playFromStart();
	    
	    that.player.increaseHealth(HEALTH_INCREMENT);
	    obstacles.push(new Obstacle());

	    goal = new Goal();
	    if (that.player.speed() < MAX_SPEED) {
		that.player.speed(SPEED_INCREMENT);
	    }
	    that.score += SCORE_INCREMENT;
	}

	var damage = playerHitObstacle();
	if (damage === 0) {
	    playerCurrentlyHit = false;
	}
	if (!playerCurrentlyHit && damage > 0) {
	    hitSound.playFromStart();
	    playerCurrentlyHit = true;
	    that.player.reduceHealth(damage);
	    if (that.player.speed() > MIN_SPEED) {
		that.player.speed(SPEED_DECREMENT);
	    }
	}

	displayScoreAndHealth();
	
	if (that.player.health <= 0) {
	    die();
	}
    };

    this.clearCanvas = function() {
	ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    };

    this.addKey = function(keyCode) {
	keysDown[keyCode] = true;
	that.player.addKey(keyCode);
    };

    this.removeKey = function(keyCode) {
	delete keysDown[keyCode];
	that.player.removeKey(keyCode);
    };


    this.addTouch = function(e) {
	touches = e.touches;
	for (var i = 0; i < touches.length; i++) {
	    if (touches[i].clientX < CANVAS_WIDTH / 2) {
		that.addKey(LEFT_KEY);
	    } else {
		that.addKey(RIGHT_KEY);
	    }
	}
    };

    this.removeTouch = function(e) {
	touches = e.changedTouches;
	for (var i = 0; i < touches.length; i++) {
	    if (touches[i].clientX < CANVAS_WIDTH / 2) {
		that.removeKey(LEFT_KEY);
	    } else {
		that.removeKey(RIGHT_KEY);
	    }
	}
    };

    function playerHitGoal() {
	var check = goal.hittableRect;
	var p = that.player;
	if ((p.position.x > check.x && p.position.x < check.x + check.width) &&
	    (p.position.y > check.y && p.position.y < check.y + check.height)) {
	    return true;
	} else {
	    return false;
	}
    }

    function playerHitObstacle() {
	for (var i = 0; i < obstacles.length; i++) {
	    if (obstacles[i].pointInside(that.player.position)) {
		return obstacles[i].damage;
	    }
	}
	return 0;
    }

    function die() {
	clearInterval(document.gameLoop);
	deathScene();
    }

    function deathScene() {
	for (var i = 0; i < 2500; i++) {
	    new Obstacle().draw();
	}
	document.onclick = function(){startGame();};
    }

    function displayScoreAndHealth() {
	ctx.font = FONT;
	ctx.fillStyle = FONT_COLOR;
	ctx.fillText('Score:', 10, CANVAS_HEIGHT - 10);
	ctx.fillText(that.score, 100, CANVAS_HEIGHT - 10);
	ctx.fillText('Health:', 10, CANVAS_HEIGHT - 34);
	ctx.fillText(that.player.health, 100, CANVAS_HEIGHT - 34);
    }
}

function startGame() {
    document.onclick = false;
    var game = new Game();

    addEventListener("keydown", function (e) {
	game.addKey(e.keyCode);
    });
    addEventListener("keyup", function (e) {
	game.removeKey(e.keyCode);
    });
    /*
    addEventListener("touchstart", game.addTouch);
    addEventListener("touchend", game.removeTouch);
    */
    document.gameLoop = setInterval(game.update, UPDATE_INTERVAL);
}

startGame();
