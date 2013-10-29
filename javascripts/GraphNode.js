"use strict";

var GraphNode = function(x, y, type, xplus, yplus, xminus, yminus) {
	this.data = {};
	this.x = x;
	this.y = y;
	this.pos = {
		x : x,
		y : y
	};
	this.xplus = xplus
	this.yplus = yplus
	this.xminus = xminus
	this.yminus = yminus
	this.type = type;
}

GraphNode.prototype = {

	isWall : function() {
		return this.type == GraphNodeType.WALL;
	},

	addNeighbor : function(pn, fromTo) {

	},

	toString : function() {
		var _type = "OPEN"
		if (this.type == 0)
			_type = "WALL"
		if (this.type == 2)
			_type = "UNSUGGESTED"
		return "{ x: " + this.x + ", y: " + this.y + ", type: " + _type + ", xplus: " + JSON.stringify(this.xplus) + ", yplus: "
				+ JSON.stringify(this.yplus) + "}";
	}

}