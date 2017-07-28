Changes from the `webpack-dev-middleware`

* To make it simple, add express as a dependency. As a result, no complicated async code and the issue of missing `res.send()` or 200 status code in other enviornment. 