
/*
    Settings file for working in different environments.
    Client & backend.
*/

var Settings = {
    host:'localhost',
    port:8080,
    appId:242671659190590
};

try{
    module.exports = Settings;
}catch(e){}