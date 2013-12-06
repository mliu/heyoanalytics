
/*
    
*/

window.fbAsyncInit = function() {
console.log('FB sdk loaded.');
  var data = [];
  // init the FB JS SDK
  FB.init({
    appId      : Settings.appId,                        // App ID from the app dashboard
    status     : true,                                 // Check Facebook Login status
    xfbml      : true                                  // Look for social plugins on the page
  });

  FB.Event.subscribe('auth.authResponseChange', function(response) {
    if (response.status === 'connected') {
    } else if (response.status === 'not_authorized') {
      FB.login({scope:'manage_pages, publish_stream'});
    } else {
      FB.login({scope:'manage_pages, publish_stream'});
    }
  });

  FB.login(function(response){
    console.log(response);
    if(response.authResponse){
      //Get Pages, have user choose which one to analyze
      FB.api('/me/accounts?fields=name,id', function(res){
        console.log('got FB.api(/me) response , ', res);
        UI.addPages(res.data);
      });
    }
    else{
      document.getElementById('main-content').innerHTML = "Failed to load User Pages"
    }
  }, {scope: 'manage_pages, publish_stream, read_insights'});
  
}; //end window.async

// Load the SDK asynchronously
(function(d, s, id){
  console.log('async loading');
   var js, fjs = d.getElementsByTagName(s)[0];
   if (d.getElementById(id)) {return;}
   js = d.createElement(s); js.id = id;
   js.src = "//connect.facebook.net/en_US/all.js";
   fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));