var w = window.innerWidth;
var h = window.innerHeight;

var maze;
var player;

var lastFrame = Date.now();

var audioContext = new window.AudioContext();
var oscillators = [];
var gains = [];
for (var i = 0; i < 4; i++) {
	oscillators.push( audioContext.createOscillator() );
	gains.push( audioContext.createGain() );
	oscillators[i].connect(gains[i]);
	oscillators[i].start();
}
oscillators[0].type = 'sine';
oscillators[1].type = 'square';
oscillators[2].type = 'triangle';
oscillators[3].type = 'sawtooth';

function playWave( no) {
	var now = audioContext.currentTime;
	gains[no].gain.setValueAtTime(1, now);
	gains[no].gain.exponentialRampToValueAtTime(0.001, now + 0.5);
	gains[no].connect(audioContext.destination);
	window.setTimeout(function() {
		gains[no].disconnect();
	},200);
}

function animate() {
	var curFrame = Date.now();
	if (curFrame - lastFrame > 16) {
		paintMaze();
		lastFrame = curFrame;
	}
	window.requestAnimationFrame(animate);
}

function generateMaze( size, difficulty) {
	maze = [];
	for (var i = 0; i < size.x; i++) {
		maze.push([]);
		for (var j = 0; j < size.y; j++) {
			maze[i].push( {x:-1, y:-1} );
		}
	}
	
	var goal = {x: Math.floor(Math.random()*size.x), y: Math.floor(Math.random()*size.y)};
	maze[goal.x][goal.y].control = "goal";
	var prev = goal;
	var cur;
	for (var i = 0; i < difficulty; i++) {
		cur = { x: Math.floor(Math.random()*size.x), y: Math.floor(Math.random()*size.y) };
		if (!maze[cur.x][cur.y].control) {
			var next_arr = [];
			if (maze[cur.x-1] && maze[cur.x-1][cur.y] && !maze[cur.x-1][cur.y].control) {
				next_arr.push({x: cur.x-1, y: cur.y});
			}
			if (maze[cur.x] && maze[cur.x][cur.y-1] && !maze[cur.x][cur.y-1].control) {
				next_arr.push({x: cur.x, y: cur.y-1});
			}
			if (maze[cur.x+1] && maze[cur.x+1][cur.y] && !maze[cur.x+1][cur.y].control) {
				next_arr.push({x: cur.x+1, y: cur.y});
			}
			if (maze[cur.x] && maze[cur.x][cur.y+1] && !maze[cur.x][cur.y+1].control) {
				next_arr.push({x: cur.x, y: cur.y+1});
			}
			
			if (next_arr.length > 0) {
				var index = Math.floor(Math.random()*next_arr.length);
				maze[cur.x][cur.y].control = "path";
				maze[cur.x][cur.y].x = prev.x;
				maze[cur.x][cur.y].y = prev.y;
				
				maze[next_arr[index].x][next_arr[index].y].control = "path";
				maze[next_arr[index].x][next_arr[index].y].x = Math.floor(Math.random()*size.x);
				maze[next_arr[index].x][next_arr[index].y].y = Math.floor(Math.random()*size.y);
				prev = next_arr[index];
			} else {
				i--;
				continue;
			}
		} else {
			i--;
			continue;
		}
	}
	player = prev;
	
	for (var i = 0; i < maze.length; i++) {
		for (var j = 0; j < maze[0].length; j++) {
			if (!maze[i][j].control) {
				maze[i][j].x = Math.floor(Math.random()*size.x);
				maze[i][j].y = Math.floor(Math.random()*size.y);
				if (Math.random() < 0.3) {
					maze[i][j].control = "404";
				}
			}
		}
	}
}

function paintSquare(g, x, y, w, h, b) {	
	g.beginPath();
	g.moveTo(x+b,y+h/2);
	g.lineTo(x+w/2,y+b);
	g.lineTo(x+w-b,y+h/2);
	g.lineTo(x+w/2,y+h-b);
	g.lineTo(x+b,y+h/2);
	g.stroke();
}

function paintGoal(g, x, y, w, h, b) {
	g.fillStyle = "rgba(255,255,0,0.7)";
	
	var count = 80 + Math.floor(Math.random()*20);
	var cur_r;
	var cur_x;
	var cur_y;
	for (var i = 0; i < count; i++) {
		cur_r = 0.1*step + Math.random()*step*0.2;
		cur_x = Math.floor(Math.random()*w);
		if (cur_x > w/2) {
			cur_y = (cur_x-w/2)/(w/h) + Math.floor(Math.random()*((w-cur_x)/(w/h))*2);
		} else {
			cur_y = (w/2-cur_x)/(w/h) + Math.floor(Math.random()*(cur_x/(w/h))*2);
		}
		g.beginPath();
		g.arc(x+cur_x, y+cur_y, cur_r, 0, 2*Math.PI);
		g.fill();
	}
}

function paintPlayer(g, x, y, w, h, b) {
	var curFrame = Date.now() % 511;
	if (curFrame >= 256) {
		curFrame = 511 - 256;
	}
	g.fillStyle = "rgba("+curFrame+","+curFrame+",0,0.5)";
	g.beginPath();
	g.moveTo(x+b,y+h*0.75);
	g.lineTo(x+w/2,y+h/2+b);
	g.lineTo(x+w-b,y+h*0.75);
	g.lineTo(x+w/2,y+h-b);
	g.fill();
	
	g.fillStyle = "rgba("+curFrame+",0,0,0.5)";
	g.moveTo(x+b,y+h*0.75);
	g.lineTo(x+w/2,y+b);
	g.lineTo(x+w/2,y+h-b);
	g.fill();
	
	g.fillStyle = "rgba("+curFrame+",0,"+curFrame+",0.5)";
	g.moveTo(x+w-b,y+h*0.75);
	g.lineTo(x+w/2,y+b);
	g.lineTo(x+w/2,y+h-b);
	g.fill();
	
	g.fillStyle = lg;
}

function paintPrep(canvas) {
	if (w/((maze.length+maze[0].length+2)*2) > h/(maze.length+maze[0].length+2)) {
		step = h/(maze.length+maze[0].length+2);
		x_pad = (w - ((maze.length+maze[0].length+2)*2)*step)/2;
		y_pad = 0;
	} else {
		step = w/((maze.length+maze[0].length+2)*2); 
		x_pad = 0;
		y_pad = (h - (maze.length+maze[0].length+2)*step)/2;
	}
	border = step/10;
	
	g = canvas.getContext("2d");
	g.font = (step*1.5) + "px sans-serif";
	g.textAlign = "center";
	g.textBaseline = "middle";
	
	g.lineWidth = border;
	lg = g.createLinearGradient(x_pad,y_pad,w-x_pad,h-y_pad);
	lg.addColorStop(0, '#FFFFFF');
	lg.addColorStop(0.05, '#FFFF00');
	lg.addColorStop(0.11, '#00FF00');
	lg.addColorStop(0.16, '#00FFFF');
	lg.addColorStop(0.22, '#0000FF');
	lg.addColorStop(0.27, '#606060');
	lg.addColorStop(0.33, '#FFFFFF');
	lg.addColorStop(0.38, '#FFFF00');
	lg.addColorStop(0.44, '#00FF00');
	lg.addColorStop(0.49, '#00FFFF');
	lg.addColorStop(0.55, '#0000FF');
	lg.addColorStop(0.60, '#606060');
	lg.addColorStop(0.66, '#FFFFFF');
	lg.addColorStop(0.71, '#FFFF00');
	lg.addColorStop(0.77, '#00FF00');
	lg.addColorStop(0.82, '#00FFFF');
	lg.addColorStop(0.88, '#0000FF');
	lg.addColorStop(0.93, '#606060');
	lg.addColorStop(0.99, '#FFFFFF');
	g.strokeStyle = lg;
	g.fillStyle = lg;
}

function paintMaze() {
	g.clearRect(0,0,w,h);
	var x;
	var y;
	for (var i = 0; i < maze.length; i++) {
		x = (2.3 + i*2) * step + x_pad;
		y = (3.4 + i + (maze[0].length)) * step + y_pad;
		g.fillText(i, x, y);
	}
	x = x_pad + step*0.25;
	for (var j = 0; j < maze[0].length; j++) {
		x = (2.1 + 2*j) * step + x_pad;
		y = (1.1 + (maze[0].length - j)) * step + y_pad;
		g.fillText(j, x, y);
	}
	
	for (var i = 0; i < maze.length; i++) {
		for (var j = 0; j < maze[0].length; j++) {
			x = (2.1 + i*2 + 2*j) * step + x_pad;
			y = (1.1 + i + (maze[0].length - j)) * step + y_pad;
			
			if (maze[i][j].control === "goal") {
				g.lineWidth = border*2;
				g.strokeStyle = "#FFFF00";
				g.fillStyle = "#FFFF00";
				paintSquare(g, x, y, 4*step, 2*step, border);
				g.lineWidth = border;
				paintGoal(g, x, y, 4*step, 2*step, border);
				g.fillStyle = lg;
				g.strokeStyle = lg;
			} else if (maze[i][j].control === "BL") {
				g.strokeStyle = "#2F2F2F";
				g.fillStyle = "#2F2F2F";
				paintSquare(g, x, y, 4*step, 2*step, border);
				g.fillText(404, x+step*2, y+step*1.1);
				g.fillStyle = lg;
				g.strokeStyle = lg;
			} else {
				paintSquare(g, x, y, 4*step, 2*step, border);
				g.fillText(maze[i][j].x + "" + maze[i][j].y, x+step*2, y+step*1.1);
			}
		}
	}
	x = (2.1 + player.x*2 + 2*player.y) * step + x_pad;
	y = (1.1 + player.x + (maze[0].length - player.y)) * step + y_pad;
	paintPlayer(g, x, y-2*step, 4*step, 4*step, border);
};

function keypress(event) {
	audioContext.resume();
	var flag = false;
	if (event.key === "a") {
		if (maze[player.x][player.y-1]) {
			if (maze[player.x][player.y-1].control === "404" || maze[player.x][player.y-1].control === "BL") {
				maze[player.x][player.y-1].control = "BL";
				playWave(3);
				paintMaze();
			} else {
				player.y -= 1;
				flag = true;
			}
		}
	} else if (event.key === "d") {
		if (maze[player.x][player.y+1]) {
			if (maze[player.x][player.y+1].control === "404" || maze[player.x][player.y+1].control === "BL") {
				maze[player.x][player.y+1].control = "BL";
				playWave(3);
				paintMaze();
			} else {
				player.y += 1;
				flag = true;
			}
		}
	} else if (event.key === "w") {
		if (maze[player.x-1]) {
			if (maze[player.x-1][player.y].control === "404" || maze[player.x-1][player.y].control === "BL") {
				maze[player.x-1][player.y].control = "BL";
				playWave(3);
				paintMaze();
			} else {
				player.x -= 1;
				flag = true;
			}
		}
	} else if (event.key === "s") {
		if (maze[player.x+1]) {
			if (maze[player.x+1][player.y].control === "404" || maze[player.x+1][player.y].control === "BL") {
				maze[player.x+1][player.y].control = "BL";
				playWave(3);
				paintMaze();
			} else {
				player.x += 1;
				flag = true;
			}
		}
	}
	if (flag) {
		paintMaze();
		var pos = maze[player.x][player.y];
		if (pos.control === "goal") {
			playWave(1);
			window.setTimeout(function(){
				window.location.reload();
			}, 500);
			return;
		}
		player.x = pos.x;
		player.y = pos.y;
		var pos = maze[player.x][player.y];
		if (pos.control === "goal") {
			playWave(1);
			window.setTimeout(function(){
				window.location.reload();
			}, 500);
			return;
		}
		playWave(2);
		paintMaze();
	}
}

window.onload = function() {
	canvas = document.getElementById("MVLM_canvas");
	canvas.width = w;
	canvas.height = h;
	generateMaze({x:9, y:8}, 8);
	paintPrep(canvas);
	paintMaze();
	
	document.onkeypress = keypress;
	
	window.requestAnimationFrame(animate);
}
