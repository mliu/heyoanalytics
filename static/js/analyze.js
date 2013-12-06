console.log('JS loaded.');
window.fbAsyncInit = function() {
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

var Request = {
  keys : [],
  IDs : [],
  //Retrieves all posts from pages with a certain keyword
  //Appends array of tuples of posts under key
  pullByKeyword: function(key){
    if(Request.keys.indexOf(key) !== -1){
      return Request.keys[key];
    }
    else{
      FB.api('/search?q=' + key + '&type=page', function(res){
        var data = [];
        for(page in res.data){
          pullReceptionData(page.id)
          data.concat(Request.pullByID(page.id));
        }
        Request.keys[key] = data;
      });
    }
  },

  //Retrieves all posts and their reception info for a page
  //Returns array of tuples with data of every post
  pullByID: function(id, params){
    if(Request.IDs.indexOf(id) !== -1) return Request.IDs[id];
    params = params || '';
      var reception = 0, post;
      FB.api('/' + id, function(res){
        Request.IDs[id] = {};
        Request.IDs[id]["likes"] = res.likes;
      });
      var url = '/'+ id + '/posts?fields=created_time,likes,comments,message'+params;
      //FQL query for getting all posts and specific fields
      FB.api('/'+ id + '/posts?fields=created_time,likes,comments,message', function(res){
        Data.findKeys(res.data);
        Request.IDs[id]["data"] = res.data;
      });
    return Request.IDs[id];
  }//end pullbyid
};
  
//event listener for pages
$(document).on('click', '.page', function(){
  var days = parseInt($('#days').val());
  days = days || 365;
  var id = this.id.replace('page', '');
  var since = Math.floor((new Date().getTime() - 1000*60*60*24*days)/1000);
  Request.pullByID(id, '&since='+since);
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
  
  topKeyWords: function(){
    
  }
  
};
Data = {
  stopWords:[],
  /*
    Finds popular words for given FB response data.
  */
  findKeys:function(data){  
    var mKeys = [];
    var cKeys = [];

    for (post in data) {                      //add keywords as keys to mKeys and cKeys
      if (!data[post].message) continue; 
      var keys = data[post].message.split(' '); 
      for (k in keys) {
        if (mKeys[keys[k]]){
          mKeys[keys[k]]++
        }else{
          mKeys[keys[k]] = 1;
        }
      }
    }
    
    mKeys.sort();
    
    for (s in this.stopWords) {         //remove junk words
      if (mKey[this.stopWords[s]]) {
        mKey.splice(this.stopWords[s], 1);
      }
    }
    
    console.log('Most popular words in order are :');
    for (i in mKeys) {
      console.log(i);
    }
  }
}