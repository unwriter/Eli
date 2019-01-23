require('dotenv').config()
var inquirer = require("inquirer");
const fs = require('fs');
if (!process.env.PRIVATE_KEY) {
  inquirer.prompt([{
    type: "input",
    name: "key",
    message: "Please Enter Private Key (It will be stored under .env file)"
  }]).then(function(answers) {
    fs.appendFileSync(process.cwd() + '/.env', "\nPRIVATE_KEY=" + answers.key);
    console.log("Stored to .env")
  })
}
