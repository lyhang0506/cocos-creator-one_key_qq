'use strict';
var path = require('path');
var fs = require('fs');

module.exports = {
    buildKind: "",
    load() {
        // 当 package 被正确加载的时候执行
        Editor.Builder.on('build-finished', this.onBuildFinish.bind(this));
    },

    unload() {
        // 当 package 被正确卸载的时候执行
        Editor.Builder.removeListener('build-finished', this.onBuildFinish);
    },


    onBuildFinish(options, callback) {
        if(options.platform!="wechatgame") {
            callback();
            return;
        }
        Editor.log('Building ' + options.platform + ' to ' + options.dest); // 你可以在控制台输出点什么
        Editor.log('定制化构建流程开始---');
        //Editor.log(path.join(options.dest.substring(options.dest.indexOf(options.platform),options.dest.length),"qqgame"));
        //Editor.log(options.dest.substring(0,options.dest.indexOf(options.platform)));
        var mainJsPath = path.join(options.dest, 'main.js');  // 获取发布目录下的 main.js 所在路径
        var script = fs.readFileSync(mainJsPath, 'utf8');     // 读取构建好的 main.js
        var str = "";
        var customDest = "";
        switch (this.buildKind) {
            case "wx":
                customDest = options.dest;
                Editor.log('定制化构建微信');
                break;
            case "qq":
                Editor.log('定制化构建QQ');
                Editor.log('覆写wx-downloader.js');
                Editor.log(fs);
                this.copyFile(options.dest.substring(0,options.dest.indexOf('build\\'+options.platform))+'templates\\wx-downloader.js',path.join(options.dest,'\\libs\\wx-downloader.js'))
                customDest = options.dest.substring(0,options.dest.indexOf(options.platform))+"qqgame";
                //在这引入第三方库
                str = `if (window) {
    window.BigNumber = require('src/assets/Script/Global/bignumber.min');
    window.CryptoJS = require('src/assets/Script/Encryption/crypto-js');
} else {
    var BigNumber = require('src/assets/Script/Global/bignumber.min');
    var CryptoJS = require('src/assets/Script/Encryption/crypto-js');
}
`;
                break;
            case "qqDebug":
                Editor.log('定制化构建QQ Debug');
                Editor.log('覆写wx-downloader.js');
                this.copyFile(options.dest.substring(0,options.dest.indexOf('build\\'+options.platform))+'templates\\wx-downloader.js',path.join(options.dest,'\\libs\\wx-downloader.js'))
                customDest = options.dest.substring(0,options.dest.indexOf(options.platform))+"qqgame";
                //在这引入第三方库
                str = `if (window) {
    window.BigNumber = require('src/assets/Script/Global/bignumber.min');
    window.CryptoJS = require('src/assets/Script/Encryption/crypto-js');
} else {
    var BigNumber = require('src/assets/Script/Global/bignumber.min');
    var CryptoJS = require('src/assets/Script/Encryption/crypto-js');
}
qq.setEnableDebug({
    enableDebug: true
})`;
                break
        }
        script = str + '\n' + script;         // 添加一点脚本到

        fs.writeFileSync(mainJsPath, script);                 // 保存 main.js
        Editor.log("删除旧的定制文件夹");
        if(this.buildKind!="wx") {
            this.deleteFolderRecursive(customDest);
            fs.renameSync(options.dest,customDest);
        }
        callback();
    },

    copyFile:function(oldPath,newPath) {
        var str = fs.readFileSync(oldPath, 'utf8');
        fs.writeFileSync(newPath, str);
    },

    deleteFolderRecursive:function(path) {
        var self = this;
    if( fs.existsSync(path) ) {
        fs.readdirSync(path).forEach(function(file) {
            var curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()) { // recurse
                self.deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
},

    messages: {
        'buildWX'(e) {
            this.buildKind = "wx";
            Editor.log("buildWX");
        },
        'buildQQ'(e) {
            this.buildKind = "qq";
            Editor.log("buildQQ");
        },
        'buildQQDebug'(e) {
            this.buildKind = "qqDebug";
            Editor.log("buildQQDebug");
        }
    },
};