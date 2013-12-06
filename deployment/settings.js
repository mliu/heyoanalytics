
/*
    Settings file for working in different environments.
    Client & backend. For deployment.
*/

var Settings = {
    host:'localhost',
    port:17456
};

try{
    module.exports = Settings;
}catch(e){}