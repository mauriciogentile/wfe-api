$W.setup({ url: "http://localhost/wfe", language: "en" });
var workflow = $W.workflow(654);

workflow.executeAction([{
    stateId: 5,
    actionId: 88,
    comments: "This action has been executed by me!"
}])
.then(function() {
    alert("Done!");
})
.fail(function(err) {
    alert("Error executing action: " + err.statusText);
});