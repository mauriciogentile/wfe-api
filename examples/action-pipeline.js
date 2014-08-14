var wfe = (function () {
    var currentWorkflow = $W.workflow();

    var model = {
        beforeExecuteAction: {},
        executeAction: function (state, action) {
            var actionsForState = model.beforeExecuteAction[state];
            var pipeline = new LinkedList();
            if (actionsForState && actionsForState[action] && actionsForState[action].length) {
                pipeline.addArray(actionsForState[action]);
            }
            if (model.beforeExecuteAction["*"] && model.beforeExecuteAction["*"][state] && model.beforeExecuteAction["*"][state].length) {
                pipeline.addArray(model.beforeExecuteAction["*"][state]);
            }
            if (model.beforeExecuteAction["*"] && model.beforeExecuteAction["*"]["*"] && model.beforeExecuteAction["*"]["*"].length) {
                pipeline.addArray(model.beforeExecuteAction["*"]["*"]);
            }
            pipeline.add(function () {
                return executeActionInternal({ stateId: action.state, actionId: action, comments: comments });
            });
            runAction(pipeline.head, state, action);
        },
        addBeforeExecuteAction: function (state, action, fnc) {
            if(fnc == null) {
                return;
            }
            if(fnc instanceof Array) {
                $.each(fnc, function(index, item) {
                    model.addBeforeExecuteAction(state, action, item);
                });
                return;
            }
            state = state.toLowerCase();
            action = action.toLowerCase();
            if (!model.beforeExecuteAction[state]) {
                model.beforeExecuteAction[state] = {};
            }
            if (!model.beforeExecuteAction[state][action]) {
                model.beforeExecuteAction[state][action] = [];
            }
            model.beforeExecuteAction[state][action].push(fnc);
        }
    };

    var runAction = function (linkedList, state, action) {
        var promise = linkedList.data(state, action);
        if (linkedList.next) {
            promise.done(function () {
                runAction(linkedList.next, state, action);
            });
        }
    };

    var executeActionInternal = function (action) {
        return currentWorkflow.executeAction(action).done(function () {
            alert("Action executed!");
        }).fail(function () {
            alert("Something went wrong!");
        });
    };

    return model;
})();


//used internally by the pipeline
LinkedList = function() {
    this.length = 0;
    this.head = null;
};

LinkedList.prototype = {
    //restore constructor
    constructor: LinkedList,
    addArray: function(array) {
        if(array instanceof Array) {
            for (var i = 0;  i < array.length; i++) {
                this.add(array[i]);
            };
        }
    },
    add: function (data){
        var node = { data: data, next: null }, current;
        if (this.head === null){
            this.head = node;
        } else {
            current = this.head;
            
            while(current.next){
                current = current.next;
            }
           
            current.next = node;            
        }
        this.length++;
    },
    item: function(index){
    
        //check for out-of-bounds values
        if (index > -1 && index < this.length){
            var current = this.head,
                i = 0;
                
            while(i++ < index){
                current = current.next;            
            }
        
            return current.data;
        } else {
            return null;
        }
    },
    remove: function(index){
        //check for out-of-bounds values
        if (index > -1 && index < this.length){
        
            var current = this.head,
                previous,
                i = 0;
                
            //special case: removing first item
            if (index === 0){
                this.head = current.next;
            } else {
        
                //find the right location
                while(i++ < index){
                    previous = current;
                    current = current.next;            
                }
            
                //skip over the item to remove
                previous.next = current.next;
            }
        
            //decrement the length
            this.length--;
        
            //return the value
            return current.data;            
        
        } else {
            return null;
        }
    },
    size: function(){
        return this.length;
    },
    toArray: function(){
        var result = [],
            current = this.head;
        
        while(current){
            result.push(current.data);
            current = current.next;
        }
        
        return result;
    },
    toString: function(){
        return this.toArray().toString();
    }
};
