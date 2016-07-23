var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');

exports.seed = function(knex, Promise) {
  return Promise.join(
      // Deletes ALL existing entries
      knex('users').del(),
      knex('ssh_keys').del(),
      knex('websites').del(),
      knex('templates').del(),
      knex('website_sections').del(),

      //user
      new Promise(function(resolve, reject) {
        bcrypt.genSalt(10, function(err, salt) {
          bcrypt.hash('test', salt, null, function(err, hash) {
            resolve(hash);
          });
        })
      }).then(function(hash){
        return knex('users').insert({id: 1, name: 'test', email:'test@test.com', password:hash});
      }),

      //ssh keys
      knex('ssh_keys').insert({id: 1, user_id:1, name: 'test_key', private:'privateKEY', public:'PUBLICKEY'}),

      //websites
      knex('websites').insert({id: 1, user_id:1, name: 'test_website', git_url:'git@git', url:'example.com'}),
      knex('websites').insert({id: 2, user_id:1, name: 'test_website2', git_url:'git@git2', url:'example2.com'}),

      //templates
      knex('templates').insert({id: 1, user_id:1, name: 'test_template', structure:JSON.stringify({test:'aa', test2:'bbb'})}),
      knex('templates').insert({id: 2, user_id:1, name: 'test_template2', structure:JSON.stringify({test:'aa2', test2:'bbb2'})}),

      //Website sections
      knex('website_sections').insert({id: 1, website_id:1, template_id:1, name: 'test_section1', path:'test/test'}),
      knex('website_sections').insert({id: 2, website_id:1, template_id:2, name: 'test_section2', path:'test/test2'}),
      knex('website_sections').insert({id: 3, website_id:2, template_id:1, name: 'test_section3', path:'test/test'}),
      knex('website_sections').insert({id: 4, website_id:2, template_id:2, name: 'test_section4', path:'test/test2'})
  );
};
