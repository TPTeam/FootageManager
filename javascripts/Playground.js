"use strict";
			
			var Playground = function(containerCssSel) {
				
				if (containerCssSel !== undefined) {					
					var _w = $(containerCssSel).width();
					var _h = $(containerCssSel).height();
				} else {
					_w = 200;
					_h = 200;
				}

				GraphicContainer.call(this, _w, _h);

				this.domContainer = $(containerCssSel);

				this.animations = {};
				this.speeds = {};
				
				this.grids = {};
				
				this.stops = {};
				
				this.initFrames = {};
				this.actualFrame = {};
				this.endFrame = {};
				
				this.actualPoint = {};
				this.endPoint = {};
				this.targetPoint = {};
				this.lastTargetPoint = {};
				this.actualPath = {};
				
				this.actualMovement = {};
				
				this.originalTextures = {};
				
				this.astar = new Astar();
				
				this.loops = {};

				this.active = {
					animation : undefined
				}
				
				this.flags.hasLoadedPlayground = false;
			}

			// constructor
			Playground.prototype = Object.create(GraphicContainer.prototype);
			Playground.prototype.constructor = Playground;

			Playground.prototype.run = function(containerCssSel) {

				if (!this.flags.isRunning) {
					
					if (containerCssSel !== undefined) {
						this.domContainer = $(containerCssSel);
					}

					var _w = this.domContainer.width();
					var _h = this.domContainer.height();

					this.resizeGraphicContainer(_w, _h);

					this.domContainer.append(this.renderer.view);

					this.animate();

					this.flags.isRunning = true;
				}

				return (this.renderer.view);
			}

			Playground.prototype.stop = function(id) {
				stops[id] = true;
			}

			Playground.prototype.show = function(id) {
				if (this.active.animation !== undefined) {
					this.active.animation.visible = false;
				}
				this.animations[id].visible = true;
//				this.active.animation = this.animations[id];
			}
			
			Playground.prototype.addAnimations = function(animations) {
				var that = this;
				var ids = [];

				this.on('animationLoaded', function(m) {
					ids.splice(ids.indexOf(m.content), 1);
					if (ids.length === 0) {
						that.emit({
							type : 'loaded',
							content : that.animations
						})
						that.flags.hasLoadedPlayground = true;
					}
				})
				for ( var a = 0; a < animations.length; a += 1) {
					ids.push(animations[a].id);
					this.addAnimation(
							animations[a].id, 
							animations[a].src, 
							animations[a].initFrames,
							animations[a].interactive
					);
				}
			}
			
			Playground.prototype.addAnimation = function(id, src, initframes, interactive) {

				var that = this;
				var loader = new PIXI.SpriteSheetLoader(src);
				var frames = [];
				var offsetH, offsetW;
				

				loader.on('loaded', function(e) {
					var re = new RegExp(id);
					$.map(PIXI.TextureCache, function(e, i, l) {
						if (re.test(i)) {
							frames.push(e);
						}
					})

					that.animations[id] = new PIXI.MovieClip(frames);
					
						that.animations[id].watch("currentFrame", function(__id,
								oldval, newval) {
								that.doYourPath(id,oldval,newval)
							return newval;
						});
					
					
					if (frames[1] !== undefined) {
						offsetH = (that.size.height - frames[1].height) / 2;
						that.animations[id].position.y += offsetH;
						offsetW = (that.size.width - frames[1].width) / 2;
						that.animations[id].position.x += offsetW;
					} else {
						console.warn("Playground: couldn't center movie");
					}
					that.animations[id].loop = false;
					that.animations[id].visible = false;
					that.stops[id] = false;
					
					that.initFrames[id] = initframes;
					
					that.actualFrame[id] = 0;//initframes;
					that.endFrame[id] = initframes;
					
					that.actualMovement[id] = {defined: false}
					
					
					that.stage.addChild(that.animations[id]);

					that.emit({
						type : 'animationLoaded',
						content : id
					});
				})

				loader.load();
			}
			
			Playground.prototype.doYourPath = function(id, from, to) {

				var that = this;
				that.actualFrame[id] = Math.round(from);
				
				if (from == 0)
					that.endFrame[id] = that.initFrames[id]
				
				var _target = 
					parseFloat(from)
				var _endframes = 
					parseFloat(that.endFrame[id])
								
				if (that.stops[id]) {
					that.animations[id].stop()
					//that.targetPoint[id] = that.endPoint[id]
				} else if (_target == _endframes) {
					//console.log("arrivo a un end point")
					//that.actualFrame[id] = that.initFrames[id]
					that.actualMovement[id] = {defined: false}
					that.actualPoint[id] = that.endPoint[id]
					that.animations[id].stop()
					//timeout per risolvere una gestione diversa di Firefox
					setTimeout(function() {
						that.checkPath(id, that.actualPoint[id])//from)	
					},0)
				} else if (_target > _endframes) {
					console.warn("I must not be here... _target: "+_target+" - _endframes: "+_endframes);
				} else {
					//devo ricalcolare
					if (that.checkPath(id, that.actualPoint[id])) {
						console.log("anything to do?")
					}
				}
			}
			
			Playground.prototype.setTarget = function(id, target) {

				var that = this
				if (that.actualFrame[id] >= that.initFrames[id])
				if (
					target.x!=that.targetPoint[id].x ||
					target.y!=that.targetPoint[id].y 
					//devo controllare che non sia un Wall??
				) {
					that.lastTargetPoint[id] = that.targetPoint[id] 
					that.targetPoint[id] = that.grids[id][target.x][target.y]
				
					if (that.actualMovement[id].defined == false)
						that.checkPath(id,that.actualPoint[id])
				}
			}
			
			Playground.prototype.setFramesToPlay = function(id, actual, end) {
				var that = this;
				var i;
				//poi vediamo bene la logica per i 4 movimenti disponibili...

				var bound = 0
				//devo controllare se continuo ad andare avanti o torno indietro
				
				/*
				if (that.actualMovement[id].defined == true) {
						if (that.actualMovement[id].from.x == actual.x &&
							that.actualMovement[id].from.y == actual.y &&
							that.actualMovement[id].to.x == end.x &&
							that.actualMovement[id].to.y == end.y
							) {
							bound = -that.actualFrame[id]+that.initFrames[id] 
						} else {
							bound = that.actualFrame[id]+that.initFrames[id]
						}
				}
				*/
				
				//poi aggiungo i frame prima...
				var toBeLoaded = []
				var offset = 0;
				//calcolo dei movimenti
				//x+1
				if (actual.x+1 == end.x) {
					//offset = bound+(actual.xplus.end-actual.xplus.start)
					if (actual.xplus != undefined)
						toBeLoaded = that.originalTextures[id].slice(actual.xplus.start,actual.xplus.end)
					else if (end.xminus != undefined)
						toBeLoaded = that.originalTextures[id].slice(end.xminus.start,end.xminus.end).reverse()
					
//					console.error("x+ ",actual.x,actual.y,end.x,end.y)
				}
				//y+1
				else if (actual.y+1 == end.y) {
					//offset = bound+(actual.yplus.end-actual.yplus.start)
					if (actual.yplus != undefined) 
						toBeLoaded = that.originalTextures[id].slice(actual.yplus.start,actual.yplus.end)
					else if (end.yminus != undefined)
						toBeLoaded = that.originalTextures[id].slice(end.yminus.start,end.yminus.end).reverse()
					
//					console.error("y+ ",actual.x,actual.y,end.x,end.y,actual,end)
				}
				//x-1
				else if (actual.x-1 == end.x) {
					//offset = bound+(end.xplus.end-end.xplus.start)
					if (end.xplus != undefined) 
						toBeLoaded = that.originalTextures[id].slice(end.xplus.start,end.xplus.end).reverse()
					else if (actual.xminus != undefined)
						toBeLoaded = that.originalTextures[id].slice(actual.xminus.start,actual.xminus.end)
						
//					console.error("x- ",actual.x,actual.y,end.x,end.y)
				} 
				//y-1
				else if (actual.y-1 == end.y) {
					//offset = bound+(end.yplus.end-end.yplus.start)
					if (end.yplus != undefined)
						toBeLoaded = that.originalTextures[id].slice(end.yplus.start,end.yplus.end).reverse()
					else if (actual.yminus != undefined)
						toBeLoaded = that.originalTextures[id].slice(actual.yminus.start,actual.yminus.end)
					
//					console.error("y- ",actual.x,actual.y,end.x,end.y)
				} else {
					console.warn("Playground: too fast recalc");
					that.checkPath(id,that.actualPoint[id])
					return
				}
				
				if (toBeLoaded.length <= 0) {
					that.checkPath(id,that.actualPoint[id])
					return
				}
				
				for (i=0;i<toBeLoaded.length;i++)
					that.animations[id].textures[that.initFrames[id]+i+1] = toBeLoaded[i] 
				
				//that.actualFrame[id] = that.initFrames[id]
				that.endFrame[id] = parseInt(that.initFrames[id]+(toBeLoaded.length-1))
//				console.log("init at "+that.actualFrame[id]+" end at "+that.endFrame[id]+" array length "+toBeLoaded.length )
				//console.log("init point "+that.initFrames[id]+1)
				
				that.animations[id].unwatch("currentFrame");
				that.animations[id].gotoAndPlay(that.initFrames[id]+1);
//				console.log("frame -> ",that.initFrames);
				that.animations[id].watch("currentFrame", function(__id,
						oldval, newval) {
						that.doYourPath(id,oldval,newval)
					return newval;
				});
				that.stops[id] = false
			}
			
			/*
			 * true if path has to be changed
			 */
			Playground.prototype.checkPath = function(id, actual) {
				
				var that = this
//				console.log("attuale "+actual)
				//that.actualFrame[id] = actual
				//Verificare
				that.actualPoint[id] = actual
				var tp = that.targetPoint[id]
				var ltp = that.lastTargetPoint[id]
				var ap = that.actualPoint[id]
				var ep = that.endPoint[id]
				
				//Se la destinazione è la stessa di prima non cambio niente
				if (tp.x == ltp.x &&
					tp.y == ltp.y) {
					//se actualPoint è diventato uguale a endPoint 
					//devo passare al prossimo passo del path 
					if (ap.x == ep.x &&
						ap.y == ep.y &&
						that.actualPath[id].length > 0) {
						//scodo dalla fine all'inizio
						that.endPoint[id] = that.actualPath[id].pop() 
						that.setFramesToPlay(id,that.actualPoint[id],that.endPoint[id])
//						console.log("frames to play: ",that.actualPoint[id] );
						that.actualMovement[id] = {
							defined : true,
							from: that.actualPoint[id],
							to: that.endPoint[id]
						}
					} else {
						//nothing to do				
						return false
					}
				} else {
					//ho cambiato destinazione devo ricalcolare 
					//il percorso e valutarne le modifiche
					 
					var newPath = 
						that.astar.search(
								that.grids[id], 
								that.actualPoint[id], 
								that.targetPoint[id]).reverse()
								
					if (that.actualMovement[id].defined == true ||
						newPath.length==0) {
						//forse così è già sufficiente...
//						console.warn("Playground: this should not happen ");
						/*
						that.actualPath[id] =
							that.astar.search(
									that.grids[id], 
									that.endPoint[id], 
									that.targetPoint[id]).reverse().concat(that.actualPath[id])
						
						that.lastTargetPoint[id] = that.targetPoint[id]
						that.actualPoint[id] = 
							that.grids[id][that.actualPoint[id].x][that.actualPoint[id].y]
						*/
						//that.lastTargetPoint[id] = that.targetPoint[id]
						//setTimeout(function() {that.checkPath(id, ap)},200)
					} else {
						that.actualPath[id] = newPath
						
						that.lastTargetPoint[id] = that.targetPoint[id]
						//devo usare i graphnode per forza
						that.actualPoint[id] = 
							that.grids[id][that.actualPoint[id].x][that.actualPoint[id].y]
						
						that.checkPath(id, that.actualPoint[id])// ap)
					}
					
				}
					
				return false;
			}
			
			Playground.prototype.addGrid = function(id, obj) {
				var that = this;
				var h,x,y,max,actual, toRet;
				
				function getMax(x,y) {
					if (x>y) return x
					else return y
				}
				function exists(x,y) {
					toRet = -1;
					for (h=0;h<obj.length;h++) {
						if (obj[h].x==x && obj[h].y==y) {
							toRet = h
							break
						}
					}
					return toRet
				}
				
				for (h=0;h<obj.length;h++) {
					max = getMax(max,getMax(obj[h].x,obj[h].y))
				}
				var nodes = []
				var row = []
				
				for (x=0; x<=max;x++) {
					row = []
					for (y=0;y<=max;y++){
						actual = exists(x,y)
						if (actual!=-1) {
							
							var toAddxplus = undefined
							try {
							toAddxplus = {
									start : obj[actual].xplus.start,
									end : obj[actual].xplus.end
							}
							if (toAddxplus.end < toAddxplus.start)
								toAddxplus = {
									start : obj[actual].xplus.end,
									end : obj[actual].xplus.start
								}
							} catch(err) {}
							
							var toAddyplus = undefined
							try {
							toAddyplus = {
									start : obj[actual].yplus.start,
									end : obj[actual].yplus.end
							}
							if (toAddyplus.end < toAddyplus.start)
								toAddyplus = {
									start : obj[actual].yplus.end,
									end : obj[actual].yplus.start
								}
							} catch(err){}
							
							var toAddxminus = undefined
							try {
							toAddxminus = {
									start : obj[actual].xminus.start,
									end : obj[actual].xminus.end
							}
							if (toAddxminus.end < toAddxminus.start)
								toAddxplus = {
									start : obj[actual].xminus.end,
									end : obj[actual].xminus.start
								}
							} catch(err) {}
							
							var toAddyminus = undefined
							try {
							toAddyminus = {
									start : obj[actual].yminus.start,
									end : obj[actual].yminus.end
							}
							if (toAddyminus.end < toAddyminus.start)
								toAddyminus = {
									start : obj[actual].yminus.end,
									end : obj[actual].yminus.start
								}
							} catch(err){}
							
							var nodeType = GraphNodeType.OPEN
							try {
								if (obj[actual].unsuggested == true)
									nodeType = GraphNodeType.UNSUGGESTED
							} catch(err) {}
							
							row.push(new GraphNode(x,y,nodeType,toAddxplus,toAddyplus,toAddxminus,toAddyminus))
						}
						else
							row.push(new GraphNode(x,y,GraphNodeType.WALL))
					}
					nodes.push(row)
				}
				
				
				that.grids[id] = that.astar.init(nodes)
				
				var toset = 
					that.grids[id][obj[0].x][obj[0].y]
				that.actualPoint[id] = (toset)
				that.endPoint[id] = (toset)
				that.targetPoint[id] = (toset)
				that.lastTargetPoint[id] = (toset)
				that.actualPath[id] = []
			}
			
			Playground.prototype.play = function(id, speed) {
				var that = this;
				if (speed !== undefined) {
					this.animations[id].animationSpeed = speed;
				}
				if (this.active.animation !== undefined) {
					this.active.animation.visible = false;
				}
				this.active.animation = this.animations[id];

				that.animations[id].position.x = -8;
				
				this.animations[id].visible = true;
						
				this.animations[id].onComplete = function() {
					
					if (!that.stops[id])
						that.play(id)
					else
						that.stops[id] = false
				}
				
				this.animations[id].gotoAndPlay(0);
				
				this.originalTextures[id] = this.animations[id].textures.slice(0,this.animations[id].textures.length)

				return;
			}