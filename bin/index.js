#! /usr/bin/env node

const yargs = require("yargs");
const Git = require("simple-git");
const path = require('path');
const fs = require('fs');
const zip = require('zip-a-folder');
const { exec } = require("child_process");

const usage = "\nUsage: fow new <app_name> for new app\n fow build for build and ready zip file";

const options = yargs
  .usage(usage)
  .command("new", "Create a new Fow App", {}, async (args) => {
    var cliFolderPath = path.resolve(__dirname, '..');
    var mainFolderPath = path.resolve(process.cwd());
    var folderName = mainFolderPath.split(path.sep).pop();
    var app_name = args._[1] || folderName;

    Git().clone("https://github.com/fowapps/fow.extension.template.git", mainFolderPath).then(function (repository) {
      // Work with the repository object here.
      fs.rmSync("./.git", { recursive: true });
      console.log('Template clone completed.');
      console.log('Running npm install.');
      exec("npm i", (error, stdout, stderr) => {
        console.log('npm install completed.');
        return;
      });
    });
  })
  .command("build", "Build Fow App", {}, async (args) => {
    const config = require(path.join(process.cwd(), 'fow-extension'));
    function build(callback) {
      var cliFolderPath = path.resolve(__dirname, '..');
      exec("npm run build", (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.log(`Build success`);
          readyZip(callback)
          return;
        }
        console.log(`Build Done`);
      });
    }
    function readyZip(callback) {
      var buildFolder = './build';
      var folderPath = './fow-packages/' + config.name;
      var srcFolder = './src';

      if (!fs.existsSync('./fow-packages')) {
        fs.mkdirSync('./fow-packages');
      }

      if (fs.existsSync(folderPath)) {
        try {
          fs.rmdirSync(folderPath, { recursive: true });
        } catch (err) {
          console.error(`Error while deleting ${folderPath}.`);
        }
      }

      fs.mkdirSync(folderPath);

      fs.mkdirSync(path.join(folderPath, 'components'));
      fs.mkdirSync(path.join(folderPath, 'functions'));
      fs.mkdirSync(path.join(folderPath, 'models'));
      fs.mkdirSync(path.join(folderPath, 'configurations'));
      fs.mkdirSync(path.join(folderPath, 'events'));

      if (config.extension && config.extension.components) {

        for (const item of config.extension.components) {
          fs.copyFileSync(path.join(buildFolder, 'components', item.fileName), path.join(folderPath, 'components', item.fileName))
        }

        fs.writeFileSync(path.join(folderPath, 'components', 'manifest.json'), JSON.stringify({ contents: config.extension.components }));
      }

      if (config.extension && config.extension.functions) {

        for (const item of config.extension.functions) {
          fs.copyFileSync(path.join(srcFolder, 'functions', item.fileName), path.join(folderPath, 'functions', item.fileName))
        }

        fs.writeFileSync(path.join(folderPath, 'functions', 'manifest.json'), JSON.stringify({ contents: config.extension.functions }));
      }

      if (config.extension && config.extension.models) {

        fs.writeFileSync(path.join(folderPath, 'models', 'manifest.json'), JSON.stringify(config.extension.models));
      }

      if (config.extension && config.extension.configuration) {

        fs.copyFileSync(path.join(buildFolder, 'components', config.extension.configuration.fileName), path.join(folderPath, 'configurations', config.extension.configuration.fileName))

        fs.writeFileSync(path.join(folderPath, 'configurations', 'manifest.json'), JSON.stringify({ content: config.extension.configuration }));
      }

      if (config.extension && config.extension.events) {

        fs.writeFileSync(path.join(folderPath, 'events', 'manifest.json'), JSON.stringify({ contents: config.extension.events }));
      }
      
      var zipFile = Math.floor(Date.now() / 1000).toString();
      var zipPath = path.join('./fow-packages', zipFile + '.zip')
      zip.zip(folderPath, zipPath).then(() => {
        fs.rmdirSync(buildFolder, { recursive: true });
        console.log("zip successfuly");
        callback(config, zipPath);
      })
    }

    build(function () {
      console.log("Build Successfull");
    })
  })
  .help(true)
  .argv;

