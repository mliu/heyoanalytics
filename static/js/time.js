console.log('JS loaded.');
window.fbAsyncInit = function() {
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
  
};

// Load the SDK asynchronously
(function(d, s, id){
  console.log('async loading');
   var js, fjs = d.getElementsByTagName(s)[0];
   if (d.getElementById(id)) {return;}
   js = d.createElement(s); js.id = id;
   js.src = "//connect.facebook.net/en_US/all.js";
   fjs.parentNode.insertBefore(js, fjs);
 }(document, 'script', 'facebook-jssdk'));


function checkLoggedIn(response){
  if(response.status == 'connected'){
    return true;
  }
  else{
    return false;
  }
}

//Retrieves all posts and their reception info for a page
function pullData(id){
  //variables
  days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ]
  var reception = 0, post;
  //FQL query for getting all posts and specific fields
  FB.api('/'+ id + '/posts?fields=created_time,likes,comments,message', function(res){
    for(post in arr){
      // if(obj.hasOwnProperty(post)){
      //Create temp object
      var temp = {};
      //Parse created_time string to get day of week and time
      var s = post["created_time"];
      var d = days[new Date(s).getDay()];
      temp["time"] = s.slice(11,18);
      temp["day"] = d;
      //Add post message
      if(post.inedexOf("message") !== -1){
        temp["message"] = post["message"];
      }
      //If comments exist, count and add
      if(post.indexOf("comments") !== -1){
        temp["comments_count"] = post["comments"]["data"].length;
      }
      //If likes exist, count and add
      if(post.indexOf("likes") !== -1){
        temp["likes_count"] = post["likes"]["data"].length;
      }
      //If shares exist, add total
      if(post.indexOf("shares") !== -1){
        temp["shares_count"] = post["shares"]["count"];
      }
      //Push completed object for that specific post onto data array
      data.push(temp);
    }
  });
  
  //event listener for pages
  $(document).on('click', '.page', function(){
    var id = this.id.replace('page', '');
    UI.getPageData(id, {});
  });
  
var UI = {
  
  //adds pages to page from FB api 
  addPages: function(pages){
    if (!pages) {
      console.log('No pages !');
    }
    for (p in pages) {
      var html = '<tr id="page'+ pages[p].id +'" class="page" >' +
                    '<td>' + pages[p].name + '</td>' + 
                    '<td>' + pages[p].id + '</td>' +
                    '<td>No more data</td>' +
                  '</tr>';
      $('#pageBody').append(html);
    }
    return pages;
  },
  
  getPageData: function(id, options){
    options = options || {};
  }
  
};
