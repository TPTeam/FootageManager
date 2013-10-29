/** @module GraphicContainer */
/** @exports GraphicContainer */

/**
 * the GraphicContainer object is a generic container managing events (mouse
 * and touch), texture loading and renderer creation.
 *
 * @class GraphicContainer
 * @constructor
 * @extends EventTarget
 * @param width
 *            {number} The width of the canvas
 * @param height
 *            {number} The height of the canvas
 */
var GraphicContainer = function(width, height) {

	if (( typeof width !== 'number') || ( typeof height !== 'number')) {
		throw "Width and height as numbers are mandatory for GraphicContainer creation";
	}

	// events management
	EventTarget.call(this);

	this.mobEvt = {
		'click' : ['tap'],
		'mousedown' : ['touchstart'],
		'mouseup' : ['touchend'],
		'mousemove' : ['touchmove'],
		'mouseupoutside' : ['touchendoutside'],
		'mouseout' : []
	}

	this.size = {
		width : width,
		height : height
	}

	this.conditions = {
		drag : []
	}

	this.flags = {
		isMouseIn : true
	};
	this.textures = {};

	// interactive objects divided by labels
	this.objects = {};

	// downshifting to CanvasRender
	// https://github.com/GoodBoyDigital/pixi.js/issues/53
	this.renderer = new PIXI.CanvasRenderer(this.size.width, this.size.height, null, true);

	this.stage = new PIXI.Stage(0xFFFFFF, true);
	this.stage.setInteractive(true);
	this.stage.hitArea = new PIXI.Rectangle(0, 0, this.size.width, this.size.height);

	that = this;

	// we need this because pixi seems to be unable to manage mouseleave and
	// mouseenter
	$(this.renderer.view).on("mouseleave", function(e) {
		that.emit({
			type : 'mouseleave',
			content : e
		});
		that.flags.isMouseIn = false;
	}).on("mouseenter", function(e) {
		that.emit({
			type : 'mouseenter',
			content : e
		});
		that.flags.isMouseIn = true;
	})
}
// constructor
GraphicContainer.prototype = Object.create(EventTarget.prototype);
GraphicContainer.prototype.constructor = GraphicContainer;

GraphicContainer.prototype.removeAllChildren = function(obj) {
	var b = obj.children.length;
	var removed = [];
	while (b > 0) {
		b -= 1;
		removed.push(obj.children[b]);
		obj.removeChild(obj.children[b]);
	}
	return removed;
}
/**
 * Add event listener to specified object's type
 *
 * @method bindEventToObjType
 * @param evt
 *            {String} Event's name
 * @param objType
 *            {String} Object's label (from GraphicContainer.objects)
 * @param func
 *            {Function} Callback
 */
GraphicContainer.prototype.bindEventToObjType = function(evt, objType, func) {

	// multiple events
	if (this.mobEvt[evt] !== undefined && this.mobEvt[evt].length > 0) {
		that = this;
		this.mobEvt[evt].map(function(elm, index, list) {
			that.bindEventToObjType(elm, objType, func);
		})
	}

	if ($.isArray(this.objects[objType])) {
		this.objects[objType].map(function(elm, index, list) {
			elm.pixiElement[evt] = func;
		})
	} else {
		this.objects[objType].pixiElement[evt] = func;
	}

}
/**
 * Add event listener to specified object
 *
 * @method bindEventToObj
 * @param evt
 *            {String} Mouse event's name (touch events automatically
 *            binded)
 * @param obj
 *            {PIXI.Sprite} Object
 * @param func
 *            {Function} Callback
 */
GraphicContainer.prototype.bindEventToObj = function(evt, obj, func) {

	if (this.mobEvt[evt] !== undefined && this.mobEvt[evt].length > 0) {

		this.mobEvt[evt].map(function(elm, index, list) {
			that.bindEventToObj(elm, obj, func);
		})
	}
	obj[evt] = func;
}
/**
 * Remove event listener from specified object
 *
 * @method loadTextures
 * @param obj
 *            {PIXI.Sprite} Object
 * @param evt
 *            {String} Event's name
 */
GraphicContainer.prototype.unbindEventFromObj = function(obj, evt) {
	this.bindEventToObj(evt, obj, undefined);
}
/**
 * Load provided images asyncronously, and save internally with provided
 * labels. When done, run callback.
 *
 * @method loadTextures
 * @param texturesStructure
 *            {Object} { "label" : "fileName" }
 * @param callback
 *            {Function} Callback for loading's end
 */
GraphicContainer.prototype.loadTextures = function(texturesStructure, callback) {

	var assetUrls = $.map(texturesStructure, function(k, v) {
		return [k];
	});
	this.textures = texturesStructure;
	loader = new PIXI.AssetLoader(assetUrls);
	var that = this;
	loader.on('onComplete', function(e) {
		callback(that);
	})
	loader.load();
	return (this);
}
/**
 * Returns a new PIXI.Texture with the provided image's label as source.
 *
 * @method getTexture
 * @param name
 *            {String} The name of texture's label
 */
GraphicContainer.prototype.getTexture = function(name) {
	return (new PIXI.Texture.fromImage(this.textures[name]));
}
/**
 * Looks for [application].onAnimate method and add its rendering callback.
 * If not found, throws an error.
 *
 * @method animate
 */
GraphicContainer.prototype.animate = function() {

	if (app !== undefined) {
		if ( typeof app.onAnimate !== 'function') {
			console.error("GraphicContainer: couldn't find onAnimate method in ", app);
		} else {

			app.onAnimate(function() {
				that.renderer.render(that.stage);
			})
		}
	} else {
		console.error("GraphicContainer: couldn't find application");
	}
}
/**
 * Resizes the stage, renderer and redefines hitArea
 *
 * @method resizeGraphicContainer
 * @param width
 *            {number} The width of the canvas
 * @param height
 *            {number} The height of the canvas
 */
GraphicContainer.prototype.resizeGraphicContainer = function(width, height) {

	if (( typeof width !== 'number') || ( typeof height !== 'number')) {
		throw "Width and height as numbers are mandatory for GraphicContainer creation";
	}

	this.size = {
		width : width,
		height : height
	}

	this.renderer.resize(width, height);
	this.stage.hitArea = new PIXI.Rectangle(0, 0, this.size.width, this.size.height);

}
