$W.setup({ url: "http://localhost/wfe/api", language: "en" });
var workflow = $W.workflow(6);

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