# Static site creator

Creator of static sites for template managers (like pug ex-blade)

[Example site](http://static-site.thecsea.it/) we are not responsable for any issues, also issues realted to privacy and security of the storage

## Features
- [x] Export to javascript object for pug (ex balde) template
- [ ] Export to any text format
- [x] Multiple git repositories support
- [x] Multiple websites support
- [x] Multiple sections per website support
- [x] Git integration to push the site
- [x] Editor users
- [x] Simple webhook support 
- [ ] Async (for client) git operations 
- [ ] Cache git repositories
- [ ] Fast git clone (min history)
- [ ] Multiple remote server support for the same repository (multiple push) 

## How to use

### How to Install
Type `npm install`

### How to Compile
This task is done automatically by the previous one.  
Type `gulp`

### How to configure
#### How to set .env file
Copy `.env.example` as `.env`  

#### How to set secret
Type `node secret.js` and copy the secret obtained in the right field of `.env`

### How to perform migrations
This task is done automatically on server init (next step).  
Type `knex migrate:latest` (install knex via `npm install knex -g`)

### How to run
#### Production mode
Type `pm2 start server.js` (install pm2 via `npm install pm2 -g`)

#### Dev mode
Type `node server.js`


## TODO
- [ ] ES6 support
- [ ] Production model (mysql data set in `.env`)
- [ ] Data seeds
- [ ] NPM package
- [ ] Vendor dirs generated by gulp (so they can be not loaded in git)
- [ ] Set pug (ex jade). Maybe it is useless since we use angular
- [ ] Set license file
- [ ] Browserify
- [ ] Fix npm scripts and use them to run the app
- [ ] Set automatically secret into `.env`, perform this task with installation (perform also .env copy if it doesn't exist)
- [ ] Google auth key
- [ ] Privacy policy
- [ ] Password confirmation
- [ ] XSS and CSRF protections

## Configuration
- **Platform:** node
- **Framework**: express
- **Template Engine**: jade
- **CSS Framework**: bootstrap
- **CSS Preprocessor**: sass
- **JavaScript Framework**: angularjs
- **Build Tool**: gulp
- **Unit Testing**: mocha
- **Database**: sqlite
- **Authentication**: email
- **Deployment**: none

## Credits
* Generated by http://megaboilerplate.com

## License
The MIT License (MIT)

Copyright (c) 2016 Sahat Yalkabov

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
