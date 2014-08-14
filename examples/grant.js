$W.setup({ url: "http://localhost/wfe", language: "en" });
var workflow = $W.workflow(6);

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