

var Request = {
  keys : [],
  IDs : [],
  //Retrieves all posts from pages with a certain keyword
  //Appends array of tuples of posts under key
  pullByKeyword: function(key){
    if(Request.keys.indexOf(key) !== -1){
      return Request.keys[key];
    }else{
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
      Request.IDs[id] = {};
      FB.api('/' + id, function(res){
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
    Finds popular words for given FB response data (keys).
  */
  findKeys:function(data){  
    var mKeys = [];
    var cKeys = [];
    var found = false;
    for (post in data) {                      //add keywords as keys to mKeys and cKeys
      
      if (!data[post].message) continue; 
      var keys = data[post].message.split(' ');
      
      for (k in keys) {
        keys[k] = keys[k].toLowerCase();  //format key
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
            console.log('found key '+ mKeys[i][0]);
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
      
    }

    console.log('1 ', mKeys);
    mKeys.sort(function(a,b){ //sort in descending order.
      a = a[1];
      b = b[1];
      return (a > b ? 0 : 1);
    });
    console.log('2 ', mKeys);
    //console.log('Most popular words in order are :');
    for (i in mKeys) {
      console.log('Key : \'' + mKeys[i][0] + '\', Frequencey : ' + mKeys[i][1]);
    }
  }
}