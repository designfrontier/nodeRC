var action = function(){
	var action = {
		eventMe: function(objectIn){
			var returnObject = objectIn
				, localEvents = {};

			returnObject.emitterId = Math.ceil(Math.random() * 10000);

			returnObject.emit = function(eventNameIn, eventDataIn, localFlag){
				//add the emitterID to this thing
				var eventStack
					, functionToCall
					, i
					, isLocal = (typeof localFlag !== 'undefined' && localFlag);

				if(isLocal){
					eventStack = this.eventStore[eventNameIn];
				} else {
					eventStack = action.eventStore[eventNameIn];
				}

				// if(typeof eventDataIn !== 'undefined'){
				// 	//we have some event data
				// 	eventData.payload = eventDataIn;
				// }

				//emit the event
				if(typeof eventStack !== 'undefined'){
					for(i = 0; i < eventStack.length; i ++){
						if(typeof eventStack[i].scope !== 'undefined'){
							eventStack[i].call.apply(eventStack[i].scope,[eventDataIn, this.emitterId]);
						}else{
							eventStack[i].call(eventDataIn, this.emitterId);
						}

						
						if(eventStack[i].once){
							if(isLocal){
								this.silenceLocal(eventNameIn, eventStack[i].call, true);
							} else {
								this.silence(eventNameIn, eventStack[i].call, true);
							}
						}
					}
				}
			};

			returnObject.emitLocal = function(eventNameIn, eventDataIn){
				this.emit(eventNameIn, eventDataIn, true);
			};

			returnObject.listen = function(eventNameIn, handlerIn, scopeIn, onceIn, localFlagIn){
				var i
					, newCheck = true

					//attribute holders and such
					, eventName = eventNameIn
					, handler = handlerIn
					, scope = scopeIn
					, local = localFlagIn
					, once = onceIn

					//variables for later
					, eventStack
					, newEvent;

				if(typeof eventNameIn === 'object'){
					//we have an object to split up dude
					eventName = eventNameIn.eventName;
					handler = eventNameIn.handler;
					scope = eventNameIn.scope;
					once = eventNameIn.once;
					local = eventNameIn.local;
				}

				eventStack = (typeof local !== 'undefined' && local) ? this.eventStore[eventNameIn] : action.eventStore[eventNameIn];
				newEvent = (typeof local !== 'undefined' && local) ? this : action;

				if(typeof eventStack !== 'undefined'){
					//already exists check to see if the function is already bound

					for(i = 0; i < eventStack.length; i ++){
						if(eventStack[i].call === handler && eventStack[i].once === false){
							newCheck = false;
							break;
						}
					}

					if(newCheck && typeof scopeIn !== 'undefined'){
							eventStack.push({once: false, call: handler, scope: scope});
					}else if(newCheck){
							eventStack.push({once: false, call:handler});
					}

				} else {
					//new event
					newEvent.eventStore[eventName] = []; //use an array to store functions
					if(typeof scopeIn !== 'undefined'){
						newEvent.eventStore[eventName].push({once: false, call: handler, scope: scope});
					}else{
						newEvent.eventStore[eventName].push({once: false, call: handler});
					}
				}
			}

			returnObject.listenLocal = function(eventNameIn, handlerIn, scopeIn, onceIn){
				//convenience function for local listens
				if(typeof eventNameIn === 'object'){
					eventNameIn.local = true;
					this.listen(eventNameIn);
				} else {
					this.listen({
						eventName: eventNameIn
						, handler: handlerIn
						, scope: scopeIn
						, once: onceIn
						, local: true
					});
				}
			}

			returnObject.listenOnce = function(eventNameIn, handlerIn, scopeIn, localFlag){
				//same thing as .listen() but is only triggered once
				var i
					, newCheck = true
					, eventStack
					, newEvent

					, eventName = eventNameIn
					, handler = handlerIn
					, scope = scopeIn
					, localFlag = localFlag;

				if(typeof eventNameIn === 'object'){
					eventName = eventNameIn.eventName;
					handler = eventNameIn.handler;
					scope = eventNameIn.scope;
					localFlag = eventNameIn.local;
				}

				if(typeof localFlag !== 'undefined' && localFlag){
					//make it local!
					eventStack = this.eventStore[eventName];
					newEvent = this;
				}else{
					eventStack = action.eventStore[eventName];
					newEvent = action;
				}

				if(typeof eventStack !== 'undefined'){
					//already exists check to see if the function is already bound

					for(i = 0; i < eventStack.length; i ++){
						if(eventStack[i].call === handler && eventStack[i].once === true){
							newCheck = false;
							break;
						}
					}

					if(newCheck){
						eventStack.push({once:true, call: handler, scope: scope});
					}

				} else{
					//new event
					newEvent.eventStore[eventNameIn] = []; //use an array to store functions
					newEvent.eventStore[eventNameIn].push({once:true, call: handler, scope: scope});
				}
			}

			returnObject.listenOnceLocal = function(eventNameIn, handlerIn, scopeIn){
				//same thing as .listen() but is only triggered once
				if(typeof eventNameIn === 'object'){
					eventNameIn.local = true;
					this.listenLocal(eventNameIn);
				}else{					
					this.listenLocal({
						eventName: eventNameIn
						, handler: handlerIn
						, scope: scopeIn
						, local: true
					});
				}
			}

			returnObject.silence = function(eventNameIn, handlerIn, onceIn, scopeIn, localFlagIn){
				//localize variables
				var i
					, truthy = false
					, eventName = eventNameIn
					, handler = handlerIn
					, once = onceIn
					, scope = scopeIn
					, localFlag = localFlagIn
					, store;

				if(typeof eventNameIn === 'object'){
					// passed in a collection of params instead of params
					eventName = eventNameIn.eventName;
					handler = eventNameIn.handler;
					once = eventNameIn.once;
					scope = eventNameIn.scope;
					localFlag = eventNameIn.local;
				}

				//local or global event store?
				store = (typeof localFlag === 'undefined' || !localFlag) ? action : this;

				if(typeof store.eventStore[eventName] === 'undefined'){
					//if there is no event with a name... return nothing
					return;
				}

				//there is an event that matches... proceed
				for(i = 0; i < store.eventStore[eventName].length; i ++){
					//reset this variable
					truthy = false;

					if(typeof handler !== 'undefined'){
						//function is passed in
						if(typeof scope !== 'undefined'){
							//scope is passed in...
							if(typeof once === 'boolean'){
								// function + scope + once provides the match
								truthy = (handler === store.eventStore[eventName][i].call && scope === store.eventStore[eventName][i].scope && once === store.eventStore[eventName][i].once);
							} else {
								//function + scope provides the match
								truthy = (handler === store.eventStore[eventName][i].call && scope === store.eventStore[eventName][i].scope);
							}
						} else {
							//function + once in for the match
							if(typeof once === 'boolean'){
								truthy = (handler === store.eventStore[eventName][i].call && store.eventStore[eventName][i].once === once);
							} else {
								truthy = (handler === store.eventStore[eventName][i].call);
							}
						}
					} else {
						//no function unbind everything by resetting
						store.eventStore[eventName] = [];

						//and exit
						break;
					}

					if(truthy){
						//remove this bad boy
						store.eventStore[eventName].splice(i,1);
					}

				}
			}

			returnObject.silenceLocal = function(eventNameIn, handlerIn, onceIn, scopeIn){
				//essentially a convenience function.
				if(typeof eventNameIn === 'object'){
					eventNameIn.local = true;
					this.silence(eventNameIn);
				}else{					
					this.silence({
						eventName: eventNameIn
						, handler: handlerIn
						, once: onceIn
						, scope: scopeIn
						, local: true
					});
				}
			}

			returnObject.listen('system:trace', function(emitterIDIn){
				if(this.emitterId === emitterIDIn){
					this.emit('system:addTraced', this);
				}
			}, returnObject);

			returnObject.eventStore = {};

			return returnObject;
		}

		, modelMe: function(objectIn){
			//this is the module for creating a data model object
			var newModel = this.eventMe({})
				, attributes = {}
				, changes = [];

			newModel.get = function(attributeName){
				return attributes[attributeName];
			}

			newModel.set = function(attributeName, attributeValue){
				var key;

				if(typeof attributeName === 'object'){
					//well... this is an object... iterate and rock on
					for(key in attributeName){
						if(attributeName.hasOwnProperty(key)){
							//this attribute does not belong to the prototype. Good.

							//TODO: maybe make this do a deep copy to prevent
							//	pass by reference or switch to clone()
							if(key !== 'destroy' && key !== 'fetch' && key !== 'save'){
								attributes[key] = attributeName[key];
								this.emitLocal('attribute:changed', key);
							} else {
								this[key] == attributeName[key];
							}
						}
					}
				} else{
					if(attributeName !== 'destroy' && attributeName !== 'fetch' && attributeName !== 'save'){
						attributes[attributeName] = attributeValue;
						this.emitLocal('attribute:changed', attributeName);
					} else {
						this[attributeName] == attributeValue;
					}
				}
			}

			newModel.flatten = function(){
				return attributes;
			}

			newModel.fetch = function(){
				var requestUrl = this.get('url');

				if(typeof requestUrl !== 'undefined'){

				} else {
					//TODO: probably should trigger some sort of error...
					throw new action.Error('http', 'No URL defined');
				}
			}

			newModel.save = function(){
				//TODO make this talk to a server with the URL
				//TODO make it only mark the saved changes clear
				var requestUrl = this.get('url');

				if(typeof requestUrl !== 'undefined'){
					
					//only do this on success...
					changes = [];
				} else {
					//TODO: probably should trigger some sort of error...
					throw new action.Error('http', 'No URL defined');
				}
			}

			newModel.getChanges = function(){
				return changes;
			}

			newModel.clear = function(){
				attributes = {};
			}

			newModel.destroy = function(){
				//TODO not really working... should get rid of this thing
				//	and all of its parameters
				var me = this;

				setTimeout(function(){
					delete me;
				},0); // not quite working...

				for(key in this){
					delete this[key];
				}

				//TODO this still doesn't kill the attributes or changes
				//	private data
			}

			newModel.set(objectIn); //set the inital attributes

			newModel.listenLocal('attribute:changed', function(nameIn){
				changes.push(nameIn);
			}, this);

			return newModel;
		}

		, eventStore: {}

		, trace: function(emitterIdIn){
			//log out the function that has the emitterId attached
			
			//create the traced object/stack
			action.traced = action.modelMe({
				stack: []
				, emitterId: emitterIdIn
			});

			action.traced.listen('system:addTraced', function(objectIn){
				this.get('stack').push(objectIn);
			}, action.traced);

			//trigger the event that will cause the trace
			action.events.emit('system:trace', emitterIdIn);
		}

		, Error: function(typeIn, messageIn){
			return {
				type: typeIn
				, message: messageIn
			}
		}
	};

	//add an events hook for global dealing with events...
	action.events = action.eventMe({});

	//global error handler y'all
	window.onerror = function(error){
		console.log('Error occured');
		console.warn(error);
	}

	//return the tweaked function
	return action;
}(this);