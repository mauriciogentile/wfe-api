# wfe-api
### Setup
``` js
$W.setup({ url: "http://localhost/wfe/api", language: "en" });
var workflow = $W.workflow(654);
```
### Creation
``` js
var createParams = {
    url: window.location.applicationPath,
    permissionSet: [
	    { state: "created", actions: ["submit", "cancel"], users: ["john", "matt" },
	    { state: "submitted", actions: ["clear", "reject"], group: "approvers" },
	    { state: "cleared", actions: ["close", "cancel"], users: ["john", "matt" }
	],
    start: true,
    appName: "myApp"
};

return $W.template(5).createInstance(createParams)
.then(function() {
    alert("Done!");
})
.fail(function(err) {
    alert("Error creating workflow: " + err.statusText);
});
```
### Grant Access
``` js
workflow.grantAccess([{
    users: ["domain\\johnm","domain\\marcos", "domain\\florr"],
    state: "cleared",
    actions: ["clear", "reject"]
}])
.then(function() {
    alert("Done!");
})
.fail(function(err) {
    alert("Error granting permissions: " + err.statusText);
});
```
### Revoke Access
``` js
workflow.revokeAccess([{
    users: ["domain\\johnm","domain\\marcos", "domain\\florr"],
    state: "submitted_for_clearance",
    actions: ["clear", "reject"]
}])
.then(function() {
    alert("Done!");
})
.fail(function(err) {
    alert("Error granting permissions: " + err.statusText);
});
```
### Pipeline Actions
``` js
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
```
