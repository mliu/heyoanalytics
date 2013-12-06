
/*
    Settings file for working in different environments.
    Client & backend.
*/

var Settings = {
    host:'',
    port:8080
};

try{
    module.exports = Settings;
}catch(e){}