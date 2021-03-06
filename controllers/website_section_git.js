var Website = require('../models/Website');
var WebsiteSection = require('../models/WebsiteSection');
var Template = require('../models/Template');
var GitStatus = require('../models/GitStatus');
var fs = require('fs');
var Git = require('nodegit');
var tmp = require('tmp');
var rp = require('request-promise');
var sanitizeFilename = require("sanitize-filename");

exports.ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    new WebsiteSection({id: req.params.id}).fetch({withRelated: ['website', 'website.user','website.editors']}).then((section)=>{
      if(req.user.get('editor')){
        if (pluck(section.related('website').related('editors'),'id').indexOf(req.user.id) != -1) {
            req.currentWebsiteSection = section;
           next();
        } else
           res.status(403).send({msg: 'Forbidden'});
      }else {
        if (section.related('website').get('user_id') == req.user.id) {
            req.currentWebsiteSection = section;
           next();
        } else
           res.status(403).send({msg: 'Forbidden'});
      }
    }).catch(()=>{
      res.status(404).send({ msg: 'Wrong website section id' });
    });
  } else {
    res.status(401).send({ msg: 'Unauthorized' });
  }
};

exports.ensureMyStatus = function(req, res, next) {
    if (req.isAuthenticated()) {
        var columns = '*';
        if(req.params.noData== "no-data")
            columns = ['id', 'section_id', 'type', 'error', 'status', 'total_status', 'status_description', 'completed', 'created_at' , 'updated_at'];
        new GitStatus({id: req.params.id}).fetch({columns: columns,withRelated: ['section', 'section.website', 'section.website.user','section.website.editors']}).then((status)=>{
            if(req.user.get('editor')){
                if (pluck(status.related('section').related('website').related('editors'),'id').indexOf(req.user.id) != -1) {
                    req.currentStatus = status;
                    next();
                } else
                    res.status(403).send({msg: 'Forbidden'});
            }else {
                if (status.related('section').related('website').get('user_id') == req.user.id) {
                    req.currentStatus = status;
                    next();
                } else
                    res.status(403).send({msg: 'Forbidden'});
            }
        }).catch(()=>{
            res.status(404).send({ msg: 'Wrong status id' });
        });
    } else {
        res.status(401).send({ msg: 'Unauthorized' });
    }
};

/**
 * GET /websites/:id/sections/:id/git/status/:id/get
 */
exports.websiteSectionGitStatusGet = function(req, res) {
    var currentStatus = req.currentStatus.toJSON();
    if(req.user.get('editor')) {
        delete currentStatus.section.website.editors;
    }
    res.send({status: currentStatus});
    req.currentStatus = ""; //fee up req
};

/**
 * GET /websites/:id/sections/:id/git/clone
 */
exports.websiteSectionGitGet = function(req, res) {
    var parentData =  {};
    parentData.cleanupCallback = function(){};
    parentData.cleanupCallback();
    createStatus(req.currentWebsiteSection, 'clone', 0, 2, 'Cloning data')
        .then((status)=>{
            res.send({status: status});
            //async execution
            clone(req.currentWebsiteSection, parentData)
            .then((data)=> {
                return status.save({status:1, status_description:'Reading data'}).then(()=>data);
            }).then((data)=> {
                return fileGetContents(data.clonePath + '/data/' + sanitizeFilename(req.currentWebsiteSection.get('path').replace(/\//gi, '_')) + '.json');
            }).then((text)=>{
                parentData.cleanupCallback();
                return status.save({status:2, data:text, completed:true, status_description:'Done'});
            }).catch((err)=>{
                console.log(err);
                parentData.cleanupCallback();
                //fileGetContents error
                if(err.code == 'ENOENT') {
                    //TODO this can caused even by other problems not only no content
                    return status.save({status:2, data:'{}', completed:true, status_description:'Done'});
                }else{
                    return status.save({error:true, status_description:'Error during cloning, please check if all data are corrects (clone url, path and so on)', completed:true});
                }
            });
        }).catch((err)=>{
            console.log(err);
            return res.status(500).send({ msg: 'Error during cloning of the website section' }); //print real error is unsafe
        });
};


/**
 * PUT /websites/:id/sections/:id/git
 */
exports.websiteSectionGitPut = function(req, res) {
    req.assert('data', 'Data cannot be blank').notEmpty(); //TODO not exists better

    var errors = req.validationErrors();

    if (errors) {
        return res.status(422).send(errors);
    }
    var dataGlobal = null;
    var fileName = sanitizeFilename(req.currentWebsiteSection.get('path').replace(/\//gi, '_')) + '.json';
    var parentData =  {};
    parentData.cleanupCallback = function(){};
    parentData.cleanupCallback();

    createStatus(req.currentWebsiteSection, 'push', 0, 4, 'Cloning data', req.body.data)
        .then((status)=> {
            var tmpStatus = status.toJSON();
            tmpStatus.data = "";
            res.send({status: tmpStatus}).end();
            //async execution
            clone(req.currentWebsiteSection, parentData)
            .then((data)=> {
                dataGlobal = data;
                return status.save({status:1, status_description:'Writing content in tmp file'});
            }).then((data)=> {
                return filePutContents(dataGlobal.clonePath + '/data/' + fileName, status.get('data'))
            }).then(()=>status.save({status:2, status_description:'Pushing data'}))
            .then(()=>CommitAndPush(dataGlobal.path, dataGlobal.clonePath, 'data/'+fileName, req.currentWebsiteSection.get('name') + ' updated', req.currentWebsiteSection.related('website').get('branch') || 'master'))
            .then(()=>status.save({status:3, status_description:'Calling webhook'}))
            .then((ret)=>{
                var webhook = req.currentWebsiteSection.related('website').get('webhook');
                if(webhook!=null && webhook != undefined && webhook!='') {
                    console.log("Calling webhook: " + webhook);
                    return rp(webhook).then((data)=>{Promise.resolve(ret)});
                }
                return ret;
            })
            .then(()=>{
                parentData.cleanupCallback();
                return status.save({status:4, completed:true, status_description:'Done'});
            })
            .catch((err)=>{
                console.log(err);
                parentData.cleanupCallback();
                //TODO if for webhook errors saying that data are pushed but the webhook was nto called
                return status.save({error:true, status_description:'Error during cloning, please check if all data are corrects (clone url, path and so on)', completed:true});
            });
        }).catch((err)=>{
            console.log(err);
            return res.status(500).send({ msg: 'Error during cloning of the website section' }); //print real error is unsafe
        });
};

//TODO create a class to manage everything
function clone(section, parentData){
    var sshKeys = section.related('website').related('user').related('sshKeys').fetch();
    var dir = createDirectory();
    return Promise.all([sshKeys, dir]).then((values)=>{
        var ssh = values[0];
        var path = values[1].path;
        parentData.cleanupCallback = values[1].cleanupCallback;

        var url = section.related('website').get('git_url');
        var branch = section.related('website').get('branch') || 'master';
        ssh = ssh.pop();//TODO improve this, multiple ssh kesy case
        var clonePath = path + '/git';

        var opts = {
            fetchOpts: {
                callbacks: {
                    certificateCheck: function () {
                        return 1; //TODO improve this. why do we need it?
                    },
                    credentials: function (url, userName) {
                        return Git.Cred.sshKeyNew(
                            userName,
                            path + '/public.pem',
                            path + '/private.pem',
                            "");
                    }
                }
            }
        };

        return Promise.all([
            filePutContents(path + '/public.pem', ssh.get('public')),
            filePutContents(path + '/private.pem', ssh.get('private'))
            ])
            .then(()=>{return Git.Clone(url, clonePath, opts)})
            .then(repo=>{
                return repo.getBranch('refs/remotes/origin/' + branch)
                    .then(function(reference) {
                      //checkout branch
                      return repo.checkoutRef(reference);
                    }).then(()=>repo);
            })
            .then((repo)=>{
                return {repo: repo, clonePath: clonePath, path:path};
            });
    });
}

function CommitAndPush(path, clonePath, file, message, branch){
    var repo = null;
    var index = null;
    var oid = null;
    var remote = null;
    return Git.Repository.open(clonePath)
        .then(function(repoResult) {
            repo = repoResult;
            //return fse.ensureDir(path.join(repo.workdir(), directoryName));
            return '';
        })
        .then(()=>repo.getBranch('refs/remotes/origin/' + branch))
        .then((reference) => repo.checkoutRef(reference))
        .then(function() {
            return repo.refreshIndex();
        })
        .then(function(indexResult) {
            index = indexResult;
        })
        .then(function() {
            return index.addByPath(file);
        })
        .then(function() {
            // this will write file to the index
            return index.write();
        })
        .then(function() {
            return index.writeTree();
        })
        .then(function(oidResult) {
            oid = oidResult;
            return Git.Reference.nameToId(repo, "HEAD");
        })
        .then(function(head) {
            return repo.getCommit(head);
        })
        .then(function(parent) {
            var author = Git.Signature.now("static website creator", "static-site@thecsea.it");

            return repo.createCommit("refs/heads/"+branch, author, author, message, oid, [parent]);
        })
        .then(function(commitId) {
            //console.log("New Commit: ", commitId);
        })
        //push
        .then(function() {
            return repo.getRemote("origin");
        }).then(function(remoteResult) {

            //console.log('remote Loaded');
            remote = remoteResult;

            return remote.push(
                ["refs/heads/"+branch+":refs/heads/"+branch],
                {
                    callbacks: {
                        credentials: function(url, userName) {
                            return Git.Cred.sshKeyNew(
                                userName,
                                path + '/public.pem',
                                path + '/private.pem',
                                "");
                        }
                    }
                }
            );
        });
}

function createDirectory(){
    return new Promise((resolve, reject)=>{
        tmp.dir({unsafeCleanup: true}, function _tempDirCreated(err, path, cleanupCallback) {
            if (err) reject(err);
            resolve({path: path, cleanupCallback: cleanupCallback});
        })
    });
}

function filePutContents(file, data){
    return new Promise((resolve, reject)=>{
        fs.writeFile(file, data, function (err) {
            if (err) reject(err);
            resolve();
        })
    });
}

function fileGetContents(file){
    return new Promise((resolve, reject)=>{
        fs.readFile(file, 'utf8', function (err, data) {
            if (err) reject(err);
            resolve(data);
        })
    });
}

function pluck(data, key){
    return data.map((value)=>{return value[key];});
}

function createStatus(currentWebsiteSection, type, status, total_status, status_description, data){
    if(data === undefined || data === null)
        data = '';
    return currentWebsiteSection.gitStatus().create({type: type, status: status, total_status: total_status, completed:false, error:false, status_description: status_description,data:data});
}