var bookshelf = require('../config/bookshelf');
bookshelf.plugin('registry');
var User = require('./User');
var WebsiteSection = require('./WebsiteSection');


var Template = bookshelf.Model.extend({
  tableName: 'templates',
  hasTimestamps: true,

  hidden: ['structure'],

  user() {
    return this.belongsTo('User', 'user_id');
  },

  sections() {
    return this.hasMany('WebsiteSection');
  },

  virtuals: {
    parsedStructure: {
      get () {
        console.log(this.get('structure'));
        return JSON.parse(this.get('structure'));
      },
      set: function(value) {
        console.log(value);
        this.set('structure', JSON.stringify(value));
      }
    }
  },
});

module.exports = bookshelf.model('Template',Template);;
