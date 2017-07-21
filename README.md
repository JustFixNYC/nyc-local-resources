This is the codebase for the JustFix.nyc Tenant Assistance Directory! The data itself is accessed through a [CartoDB endpoint](https://carto.com/docs/carto-engine/sql-api), so this is just the front-end. For more information about our organization, please visit [www.justfix.nyc](https://www.justfix.nyc).

Note: this project was scaffolded using yeoman using [yo angular generator](https://github.com/yeoman/generator-angular)
version 0.15.1.

## Getting Started

This guide assumes that you are using a [UNIX](http://i.imgur.com/uE6fkx7.gif) system (most likely macOS), but everything is available on Windows if you follow the appropriate guides thru the links below.

#### Build tools and languages

0. Open terminal. Some of these steps may require `sudo` in order to install.

1. Install [Node.js](https://nodejs.org/en/) (v4.4.x is ideal) and make sure everything works:

  ```
  node -v
  ```

3. Update [npm](https://www.npmjs.com/) and make sure everything works:

  ```
  npm install -g npm@latest
  npm -v
  ```

4. Use npm to install [bower](http://bower.io/) and [grunt](http://gruntjs.com/). You'll probably need sudo for this (using `-g` affects your machine globally).

  ```
  sudo npm install -g bower grunt-cli
  ```   

5. Set up [git](https://help.github.com/articles/set-up-git/) if you don't already have it. Make sure that its available in terminal and that you Github account is linked to it.

6. This project uses [SASS](http://sass-lang.com/) for fun CSS things. In order to get things up-and-running, we need to download [Compass](http://compass-style.org/), which can be a little tricky....

  a. Test that you have Ruby installed on your computer. If you're using a Mac, it should already be there. If not, check [here](https://www.ruby-lang.org/en/downloads/). To test:

  ```
  which ruby
  ==> /Users/dan/.rvm/rubies/ruby-2.2.6/bin/ruby
  ```

  b. Install Compass:

  ```
  gem install compass
  ```   

#### Download and install libraries

1. Get a copy of the code!

  ```
  git clone https://github.com/JustFixNYC/nyc-local-resources
  ```  

2. Use npm to install the various task managment libraries associated with grunt. Make sure you're in the root directory for the project - i.e. the same level as the `package.json` file.

  ```
  npm install
  ```  

3. Next, you need to download the actual JS libraries and other dependencies for the app. From the same directory, download the [bower]()
 packages.

 ```
 bower install
 ```  

4. You should be good to go!

#### Regular use


1. It should be quite simple to start the app in your development environment (again, make sure this is from the root directory):
  ```
  grunt serve
  ```

2. Go to `http://localhost:9000` to see your development version! Grunt will watch for any changes you make to the code and automatically restart the server for live development.

#### Building assets and deploying

To do!


## License

JustFix.nyc uses the GNU General Public License v3.0 Open-Source License. See `LICENSE.md` file for the full text.
