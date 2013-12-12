var PublicTrending = {
  keys = {},
  IDs = {},

  //Returns keywords of a message
  getKeywords: function(message){
    res = [];
    arr = message.split(" ");
    for(word in arr){
      if(Data.stopWords.indexOf(word) !== -1){
        res.append(word);
      }
    }
    return res;
  },

  //Calculates trendVal from a given date string
  getTrendVal: function(date){

  },

  calculateReception: function(post){

  },

  //Calculates percent engagement given likes and reception <=
  getPercentEng: function(likes, reception){

  },

  //Compiles all posts from pages with a certain keyword and returns a
  //object with keys:keywords and values:trendVal,totalPercentEng,count
  //trendVal gives higher weighting to keywords used more often that
  //are more recent
  getTrending: function(key){
    data = pullByKeyword(key);
    temp = {};
    for(post in data){
      if(post["data"].indexOf("message") !== -1){
        arr = getKeywords(post["data"]["message"])
        for(word in arr){
          if(temp.hasOwnProperty(word)){
            temp["trendVal"] += getTrendVal(post["data"]["created_time"]);
            temp["count"]++;
            temp["totalPercentEng"] += getPercentEng(post["likes"], calculateReception(post["data"]))
          }
        }
      }
    }
  },

  pullByKeyword: function(key, callback){
    
    typeof callback != 'function' ? console.log('error callback is not a function.') : '';
    
    if(PublicTrending.keys.hasOwnProperty(key){
        callback(PublicTrending.keys[key]);
    }else{
      FB.api('/search?q=' + key + '&type=page', function(res){
        for(page in res.data){          
          PublicTrending.pullByID(page.id), function(data){
            PublicTrending.IDs[page.id] = data;
          }); //You need a callback function.
        }
      });
    }
  },

  pullByID: function(id, callback){
    if(Request.IDs.indexOf(id) !== -1){
      return Request.IDs[id];
    }
    else{
      var reception = 0, post;
      FB.api('/' + id, function(res){
        Request.IDs[id] = {};
        Request.IDs[id]["likes"] = res.likes;
      });
      //FQL query for getting all posts and specific fields
      FB.api('/'+ id + '/posts?fields=created_time,likes,comments,message', function(res){
        var data = [];
        for(post in res.data){
          //Create temp object
          var temp = {};
          //Parse created_time string to get day of week and time
          temp["time"] = post["created_time"];
          //Add post message
          if(post.indexOf("message") !== -1){
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
        callback(data);
      });
    }
  }//end pullbyid
};

var Request = {
  keys : [],
  IDs : [],

  /*
    Retrieves all posts from pages with a certain keyword
    Appends array of tuples of posts under key
  */
  pullByKeyword: function(key, callback){
    
    typeof callback != 'function' ? console.log('error callback is not a function.') : '';
    
    if(Request.keys.indexOf(key) !== -1){
        callback(res.data);
    }else{
      FB.api('/search?q=' + key + '&type=page', function(res){
        /*var data = []; // Can we keep the whole data object?
        for(page in res.data){
          pullReceptionData(page.id)
          
          //data.concat(Request.pullByID(page.id)); //You need a callback function.
        }
        Request.keys[key] = data;*/
        Request.keys[key] = res.data;
        callback(res.data);
      });
      return Request.keys[key]
    }
  },

  //Retrieves all posts and their reception info for a page
  //Returns array of tuples with data of every post
  pullByID: function(id, params, callback){
    if(Request.IDs.indexOf(id) !== -1) callback(Request.IDs[id]);
    else{
      params = params || '';
        var reception = 0, post;
        Request.IDs[id] = {};
        FB.api('/' + id, function(res){
          Request.IDs[id]["likes"] = res.likes;
        });
        var url = '/'+ id + '/posts?fields=created_time,likes,comments,message'+params;
        //FQL query for getting all posts and specific fields
        FB.api('/'+ id + '/posts?fields=created_time,likes,comments,message', function(res){
          var keys = Data.popularKeys(res.data);
          console.log('popular words for posts are');
          for (i in keys.posts) {
            console.log(keys.posts[i][1], keys.posts[i][0]);
          }
          console.log('popular words for comments are');
          for (i in keys.comments) {
            console.log(keys.comments[i][1], keys.comments[i][0]);
          }
          Request.IDs[id]["data"] = res.data;
          callback(Request.IDs[id]);
        });
    }
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

//event listener for getting page info by keyword
$(document).on('click', '#findPages', function(){
  var keyword = $.trim($('#keyword').val());
  if (keyword == '') return;
  Request.pullByKeyword(keyword, function(data){
    console.log('got pages back', data);
  });
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
  
  /*
    Display keywords for given array
    
  */
  topKeyWords: function(array, options){
    
  }
  
};
Data = {

  stopWords:[],
  /*
    Finds popular words for given blob of text.
    Sorts by frequency.  No duplicates.
    Ignores words in stopWords array.
  */
  sortText:function(text){  
    var mKeys = [];
    var found = false;
    console.log('text',text);
      
      var keys = text.split(' ');
      
      for (k in keys) {
        keys[k] = keys[k].toLowerCase();  //format keys.  Best move this to postBlob
        keys[k] = keys[k].replace('.', '');
        keys[k] = keys[k].replace(',', '');
        keys[k] = keys[k].replace('\'', '');
        keys[k] = keys[k].replace('\"', '');
        keys[k] = keys[k].replace('?', '');
        keys[k] = keys[k].replace('!', '');
        if (keys[k] == '') {
          continue;
        }
        if (this.stopWords.indexOf(keys[k]) != -1) continue;
        
        // Increment key if already exists.
        for (i in mKeys) {
          if (mKeys[i][0] == keys[k]) {
            mKeys[i][1]++;
            var found = true;
            break;
          }
        }
        // add key if it doesn't
        if (!found){
          var tuple = [keys[k], 1];
          mKeys.push(tuple);
        }else{
          found = false;
        }
      
    }

    mKeys.sort(function(a,b){ //sort in descending order.
      a = a[1];
      b = b[1];
      return (a > b ? 0 : 1);
    });

    return mKeys;
  },
  
  /* Takes FB data object and concatenates post bodies and comments
    into word blob.  for finding word frequncies.
    returns obj. */
  postBlob: function(data){
    console.log('blobbing data tree', data);
    var postBlob = '';
    var commentBlob ='';
    
    for (post in data) {
      
      if (data[post].comments) {
        
        for (c in data[post].comments.data){
          if (!data[post].comments.data[c].message) continue;
          commentBlob += ' ' + data[post].comments.data[c].message;
        }
        
      }
      if (!data[post].message) continue; 
      postBlob += ' ' + data[post].message;
    }
    
    return {
      postBlob:postBlob,
      commentBlob: commentBlob
    };
  },
  
  /*
    control function for returning sorted array for
    keys in fb response data object
  */
  popularKeys:  function(data){
    try{
      var blob = this.postBlob(data);
      var postKeys = this.sortText(blob.postBlob);
      var commentKeys = this.sortText(blob.commentBlob);
      return{
        posts: postKeys,
        comments: commentKeys
      };
    }catch(e){
      console.log('Error getting keys.  Make sure you gave correct data object.', e);
      return {};
    }
  }
}
