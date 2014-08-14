$W.setup({ url: "http://localhost/wfe/api", language: "en" });
var workflow = $W.workflow(654);

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
});;
