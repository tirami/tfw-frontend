# Udadisi Front End

###

Udadisi was developed by [Tirami](http://www.tirami.co.uk/), a software development company, in collaboration with [Practical Action](http://practicalaction.org/) and the [University of Edinburgh Global Development Academy](http://www.ed.ac.uk/schools-departments/global-development), as part of the Technology and the Future of Work project, funded by the [Rockefeller Foundation](https://www.rockefellerfoundation.org/).

### Other Components

The other components that build up the suite can be found at:

* https://github.com/tirami/udadisi-engine
* https://github.com/tirami/udadisi-twitter
* https://github.com/tirami/udadisi-rss
* https://github.com/tirami/udadisi-web


## Running with Docker:

Install docker, and pull the latest code then run: `docker build ./`

Building will return an id, to run a container: `docker run -d -p 80:80 <built-image-id>`

This should be all you need to run the application. Some useful commands for debugging/checking the container: 

`docker port <container-id>` to check port mapping

`docker inspect <container-id>` to see container environment

`docker exec -i -t <container-id> bash` to use bash in container

### Environment

The only environment variable is the engine url, currently hard coded in `app/js/services.js` in the first few lines.


## Running Locally

### Prerequisites

This is an [AngularJS](http://angularjs.org/) based application.

We also use a number of node.js tools to initialize and test the app. You must have node.js and
its package manager (npm) installed.  You can get them from [http://nodejs.org/](http://nodejs.org/).

### Environment

The only environment variable is the engine url, currently hard coded in `app/js/services.js` in the first few lines.

### Clone the app

Clone the repository using [git][git]:

```
git clone https://github.com/tirami/udadisi-frontend.git
cd udadisi-frontend
```

### Install Dependencies

We have two kinds of dependencies in this project: tools and angular framework code.  The tools help
us manage and test the application.

* We get the tools we depend upon via `npm`, the [node package manager][npm].
* We get the angular code via `bower`, a [client-side code package manager][bower].

We have preconfigured `npm` to automatically run `bower` so we can simply do:

```
npm install
```

Behind the scenes this will also call `bower install`.  You should find that you have two new
folders in your project.

* `node_modules` - contains the npm packages for the tools we need
* `app/bower_components` - contains the angular framework files

*Note that the `bower_components` folder would normally be installed in the root folder but
the app changes this location through the `.bowerrc` file.  Putting it in the app folder makes
it easier to serve the files by a webserver.*

### Run the Application

We have preconfigured the project with a simple development web server.  The simplest way to start
this server is:

```
npm start
```

Now browse to the app at `http://localhost:8000/app/index.html`.


## Updating Angular

You can update the tool dependencies by running:

```
npm update
```

This will find the latest versions that match the version ranges specified in the `package.json` file.

You can update the Angular dependencies by running:

```
bower update
```

This will find the latest versions that match the version ranges specified in the `bower.json` file.

### Running the App during Development

You can start the dev webserver with `npm start` but you may choose to install the tool globally:

```
sudo npm install -g http-server
```

Then you can start your own development web server to serve static files from a folder by
running:

```
http-server -a localhost -p 8000
```

Alternatively, you can choose to configure your own webserver, such as apache or nginx. Just
configure your server to serve the files under the `app/` directory.
