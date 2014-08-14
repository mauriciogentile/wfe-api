jQuery.support.cors = true;

var $W = $W || (function () {
    var apiUrl = "http://localhost/wfe/api";
    var language = "EN";
    var appName = "WFE";
    var callbacks = jQuery.Callbacks();
    var validationsCallbacks = [];

    var setup = function (options) {
        apiUrl = options.url;
        language = options.language || language;
        appName = options.appName || appName;
    };

    var workflow = function (id) {
        var instance = {
            id: id || $W_helpers.getParameterOrDefault("workflowId", 0),
            isValid: evaluateValidators,
            isAborted: evaluateValidators,
            start: function () {
                var params = $.param({ workflowId: instance.id });
                var url = apiUrl + "/workflow/start";
                return sendRequest(url, params, "post");
            },
            get: function () {
                var params = $.param({ workflowId: instance.id, applicationName: appName, selectedLanguage: language });
                var url = apiUrl + "/workflow/get";
                var deferred = $.Deferred();
                var send = sendRequest(url, params, "get");
                send.done(function (workflowInstance) {
                    deferred.resolve(workflowInstance);
                });
                send.fail(function (err) {
                    deferred.reject(err);
                });
                return deferred.promise();
            },
            setUrl: function (url) {
                var params = $.param({ workflowId: instance.id, url: url });
                return sendRequest(apiUrl + "/workflow/url", params, "post");
            },
            exists: function () {
                var deferred = $.Deferred();
                var get = this.get();
                get.done(function () {
                    deferred.resolve(true);
                });
                get.fail(function (err) {
                    if (err.status && err.status == 404)
                        deferred.resolve(false);
                    else
                        deferred.reject(err);
                });
                return deferred.promise();
            },
            getCurrentState: function () {
                var deferred = $.Deferred();
                var get = this.get();
                get.done(function (data) {
                    deferred.resolve(data.currentState);
                });
                get.fail(function (err) {
                    deferred.reject(err);
                });
                return deferred.promise();
            },
            getStates: function () {
                var params = $.param({ workflowId: instance.id });
                var url = apiUrl + "/workflow/states";
                return sendRequest(url, params, 'get');
            },
            getAllActions: function () {
                var params = $.param({ workflowId: instance.id, selectedLanguage: language });
                var url = apiUrl + "/workflow/actions/all";
                return sendRequest(url, params, 'get');
            },
            isRunning: function () {
                var deferred = $.Deferred();
                var get = this.get();
                get.done(function (data) {
                    deferred.resolve(data.isRunning);
                });
                get.fail(function (err) {
                    deferred.reject(err);
                });
                return deferred.promise();
            },
            grantAccess: function (permissionSet) {
                $.each(permissionSet, function (index, item) {
                    item.type = item.type || "grant";
                });
                var grant = { workflowID: instance.id };
                grant.permissionSet = permissionSet;
                var url = apiUrl + "/workflow/grant";
                return sendRequest(url, JSON.stringify(grant), "post", "json");
            },
            revokeAccess: function (permissionSet) {
                $.each(permissionSet, function (index, item) {
                    item.type = item.type || "revoke";
                });
                var grant = { workflowID: instance.id };
                grant.permissionSet = permissionSet;
                var url = apiUrl + "/workflow/revoke";
                return sendRequest(url, JSON.stringify(grant), "post", "json");
            },
            getAvailableActions: function () {
                var params = $.param({ workflowId: instance.id, applicationName: appName, selectedLanguage: language, includeExecuted: true });
                var url = apiUrl + "/workflow/actions";
                return sendRequest(url, params, 'get');
            },
            getActionsLog: function (typeId) {
                var param = { workflowId: instance.id, selectedLanguage: language  };
                if(typeId) {
                    param.WorkflowLogTypeID = typeId;
                }
                var params = $.param(param);
                var url = apiUrl + "/workflow/log";
                return sendRequest(url, params, 'get');
            },
            executeAction: function (options) {
                options.workflowId = instance.id;
                options.workflowStateId = options.stateId;
                options.workflowActionId = options.actionId;
                options.comments = options.comments || null;
                var data = $.param(options);
                var url = apiUrl + "/workflow/execute";
                return sendRequest(url, data, 'post');
            },
            scheduleActionExecution: function (actionId, stateId, dateTime) {
                var data = {
                    workflowId: instance.id,
                    state: stateId,
                    action: actionId,
                    forceExeDate: dateTime
                };
                var url = apiUrl + "/workflow/schedule";
                return sendRequest(url, data, 'post');
            },
            storeUserData: function (data, state) {
                var params = $.param({ workflowId: instance.id, state: state });
                var url = apiUrl + "/workflow/data?" + params;
                return sendRequest(url, data, "post", "json");
            },
            retrieveUserData: function (state) {
                state = state || ":lastState";
                var params = $.param({ workflowId: instance.id, state: state, selectedLanguage: language });
                var url = apiUrl + "/workflow/data";
                return sendRequest(url, params, 'get');
            }
        };

        return instance;
    };

    var template = function (id) {
        return {
            id: id || $W_helpers.getParameterOrDefault("wtid", 0),
            createInstance: function (initParams) {
                var url = apiUrl + "/template/create?workflowTemplateId=" + id;
                var params = {};
                if(initParams && initParams.permissionSet) {
                    params = initParams.permissionSet;
                    $.each(params, function(i, item) {
                        item.type = item.type || "grant";
                    });
                }
                if(initParams && initParams.url) url = url + "&workflowUrl=" + initParams.url;
                if(initParams && initParams.start) url = url + "&start=" + (initParams.start || false);
                url = url + "&appName=" + initParams.appName;
                return sendRequest(url, JSON.stringify(params), "post", "json");
            }
        };
    };

    var validators = function () {
        return {
            add: function (fn) {
                validationsCallbacks.push(fn);
            },
            remove: function (fn) {
                var i = validationsCallbacks.indexOf(fn);
                validationsCallbacks.splice(i, 1);
            }
        };
    };

    var evaluateValidators = function () {
        var args = arguments;
        if (validationsCallbacks.length === 0) return true;
        var result = true;
        $.each(validationsCallbacks, function (index, ele) {
            if (ele && typeof ele === 'function') {
                result = ele.call(this, args);
                if (!result) {
                    return false;
                }
            }
        });
        return result;
    };

    var sendRequest = function (url, params, type, dataType) {
        if (type === "post") {
            var result = evaluateValidators.apply(this, arguments);
            if (result === true) {
                return $W_helpers.send(url, params, type, dataType);
            }
            else {
                var def = $.Deferred();
                def.reject();
                return def.promise();
            }
        }
        return $W_helpers.send(url, params, type);
    };

    return {
        setup: setup,
        workflow: workflow,
        template: template,
        validators: validators(),
        setLanguage: function(lang) {
            language = lang;
        },
        search: function (params) {
            params.top = params.top || 10;
            params.ownedOnly = params.ownedOnly || false;
            return $W_helpers.send(apiUrl + "/workflow/search?" + $.param(params));
        },
        on: callbacks.add,
        off: callbacks.remove,
        fire: callbacks.fire
    };
})();

var $W_helpers = $W_helpers || (function () {
    return {
        send: function (url, params, type, dataType) {

            var cache = false;

            if(params && params.cache) {
                cache = params.cache;
                params = undefined;
            }

            var tryParse = function (response) {
                if (response) {
                    if (response.readyState) {
                        response = $.xml2json(response);
                        response = (response === "" ? null : response);
                    }
                    var data = response.data || response;
                    data = data.item || data;
                    data = data.data === null ? null : (data.data || data);
                    return data;
                }
            };

            var get = function (url, params) {
                if (params) url = url + "?" + params;
                return $.ajax({ url: url, dataType: "json", cache: cache, xhrFields: { withCredentials: true } });
            };

            var post = function (url, data, dataType) {
                var options = {
                    url: url,
                    crossDomain: true,
                    type: "POST",
                    data: data,
                    xhrFields: { withCredentials: true }
                };

                if (dataType === "json") {
                    options.contentType = "application/json; charset=utf-8";
                }

                return $.ajax(options);
            };

            var deferred = $.Deferred();

            var req = type === "post" ? post(url, params, dataType) : get(url, params);
            req.done(function (response) {
                var data = tryParse(response);
                deferred.resolve(data);
            });
            if ($W.onError) {
                req.fail($W.onError);
            }
            req.fail(function (err) {
                deferred.reject(err);
            });

            return deferred.promise();
        },
        getParameterInScope: function (paramName, scope, andExit) {
            var newScope = scope || window;
            var searchString = newScope.location.search.substring(1),
              i, val, params = searchString.split("&");
            for (i = 0; i < params.length; i++) {
                val = params[i].split("=");
                if (val[0].toUpperCase() == paramName.toUpperCase()) {
                    return unescape(val[1]);
                }
            }
            if (andExit && andExit == true) {
                return null;
            }
            if (newScope.parent && newScope.parent !== newScope.top) {
                return this.getParameterInScope(paramName, newScope.parent, true);
            }
            return null;
        },
        getApplicationPath: function () {
            return window.location.protocol + "//" + window.location.host + window.location.pathname;
        },
        getParameter: function (paramName) {
            return this.getParameterInScope(paramName, window, false);
        },
        getParameterOrDefault: function (paramName, defaultValue) {
            var param = this.getParameter(paramName);
            return ((param === null || param === "") ? defaultValue : param);
        }
    };
})();

window.location.applicationPath = $W_helpers.getApplicationPath();