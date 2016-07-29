var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var bookshelf = require('../config/bookshelf');
bookshelf.plugin('registry');
var SshKey = require('./SshKey');
var Website = require('./Website');
var Template = require('./Template');


var User = bookshelf.Model.extend({
  tableName: 'users',
  hasTimestamps: true,

  initialize: function() {
    this.on('saving', this.hashPassword, this);
    var _this = this;
    this.on('created', function(model, attrs, options) {
        if(!_this.get('editor'))
          _this.sshKeys().create({name: 'default'})//.save(new SshKey())
            .then(function(user) {
            })
            .catch(function(err) {
              console.error(err);
                //return res.status(400).send({ msg: 'Problems occurred during generation of the keys' }); //TODO return error
            });
    });
  },

  sshKeys() {
    if(editor)
    return this.hasMany('SshKey');
  },

  websites() {
    return this.hasMany('Website');
  },

  templates() {
    return this.hasMany('Template');
  },

  hashPassword: function(model, attrs, options) {
    var password = options.patch ? attrs.password : model.get('password');
    if (!password) { return; }
    return new Promise(function(resolve, reject) {
      bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, null, function(err, hash) {
          if (options.patch) {
            attrs.password = hash;
          }
          model.set('password', hash);
          resolve();
        });
      });
    });
  },

  comparePassword: function(password, done) {
    var model = this;
    bcrypt.compare(password, model.get('password'), function(err, isMatch) {
      done(err, isMatch);
    });
  },

  hidden: ['password', 'passwordResetToken', 'passwordResetExpires'],

  virtuals: {
    gravatar: function() {
      if (!this.get('email')) {
        return 'https://gravatar.com/avatar/?s=200&d=retro';
      }
      var md5 = crypto.createHash('md5').update(this.get('email')).digest('hex');
      return 'https://gravatar.com/avatar/' + md5 + '?s=200&d=retro';
    }
  }
});

module.exports = bookshelf.model('User', User);
