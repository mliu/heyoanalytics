
/*
    Settings file for working in different environments.
    Client & backend. For deployment.
*/

var Settings = {
    host:'karxim.com/heyo',
    port:17456,
    appId:242671659190590

};

try{
    module.exports = Settings;
}catch(e){}