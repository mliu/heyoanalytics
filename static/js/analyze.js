

var Request = {
  keys : [],
  IDs : [],
  /*
    Retrieves all posts from pages with a certain keyword
    Appends array of tuples of posts under key
    
    @param key - string to query search by
    @param object - type of fb object to search e.g. page, event, post
  */
  pullByKeyword: function(params, callback){
    params = params || {};
    params.object = params.object || 'page';
    callback = callback || function(e){console.log('Warning: no callback specified.')};
    console.log('pulling by parameters ', params);
    
    if(Request.keys.indexOf(params.query) !== -1){
        callback(res.data);
    }else{
      FB.api('/search?q=' + params.query + '&type='+params.object, function(res){
        /*var data = []; // Can we keep the whole data object?
        for(page in res.data){
          pullReceptionData(page.id)
          
          //data.concat(Request.pullByID(page.id)); //You need a callback function.
        }
        Request.keys[key] = data;*/
        Request.keys[params.query] = res.data;
        callback(res.data);
      });
    }
  },

  /* Retrieves all posts and their reception info for a page
     returns FB response data obj.
     
    @param id - id of page
    @param since - unix timestamp to restrict query 
  */
  pullByID: function(params, callback){
    params = params || {};
    callback = callback || function(e){console.log('Warning: no callback specified.')};
    
    if(Request.IDs.indexOf(params.id) !== -1){
      callback(Request.IDs[params.id]);
      return;
    }
    var reception = 0, post;
    Request.IDs[params.id] = {};
    /* FB.api('/' + id, function(res){
      Request.IDs[id]["likes"] = res.likes;
    }); */
    
    var url = '/'+ params.id + '/posts?fields=created_time,likes,comments,message'
    if (params.since) url += '&since=' + params.since;
    
    //FQL query for getting all posts and specific fields
    FB.api(url, function(res){
      Request.IDs[params.id] = res.data;
      callback(Request.IDs[params.id]);
    });
  },//end pullbyid
  
  /* Make multiple api calls with multiple IDs. Parses JSON and returns array of objs
  
    @param IDs - array of ids to get
  */
  batchByID: function(params, callback){
    params = params || {};
    callback = callback || function(e){console.log('Warning: no callback specified.')};
    var batch = [];
    for (var i in params.IDs) {
      batch.push({
        method:'GET',
        relative_url:params.IDs[i] + '/feed?fields=likes,comments,message,name'
      });
    }
    console.log('batch obj',batch);
    FB.api('/','POST',{batch:batch, fields:'name'}, function(res){
      var parsed = [];
      //parse json
      console.log('unparsed batch res', res);
      for (var n in res){
        var p = JSON.parse(res[n].body);
        
        parsed.push(JSON.parse(res[n].body));
      }
      callback(parsed);
    });
  }
};
  

var UI = {
  
  /*
    adds pages as rows to table
    - takes fb response data object.
    
    edit html variable to edit or add.
  */
  addPages: function(pages){
    if (!pages) {
      console.log('No pages !');
    }
    
    for (p in pages) {
      pages[p].likes = pages[p].likes || 0;
      var html = '<tr id="page'+ pages[p].id +'" class="page" >' +
                    '<td>' + pages[p].name + '</td>' + 
                    '<td>' + pages[p].likes + '</td>' +
                  '</tr>';
      $('#pageBody').append(html);
    }
    return pages;
  },
  
  /* adds keyword to container */
  addKeyWord: function(keyword){
    keyword = $.trim(keyword);
    if (keyword == '') return;
    var kw = $('#keywordTemplate').clone();
    kw.attr('id','');
    kw.find('.glyphicon-ok').remove();
    kw.find('input.keyword').val(keyword);
    kw.find('input.keyword').attr('readonly',true);
    
    $('#keywordWrap').prepend(kw);
  },
  /* clear key words enterd */
  clearKeyWords: function(){
    $('.keyword').each(function(){
      if (!($(this).parents('.inputWrap').attr('id') == 'keywordTemplate')){
        $(this).parents('.inputWrap').remove();
      }
    });
  },
  /*
    General popup for displaying info, errors.  returns popup jquery obj.
    
    @option millis - milliseconds for popup to display, default forever.
    @option error - bool to indicate if error message. red title text.
  */
  popup: function(title, message, options){
    options = options || {};
    var popup = $($('#popupTemplate').html());
    popup.find('.title').html(title);
    popup.find('.message').html(message);
    if (options.error) {
      popup.find('.title').addClass('red');
    }
    $('body').append(popup);
    
    setTimeout(function(){
      if (options.millis) {
        popup.hide('fast');
      }
    }, options.millis || 0);
    
    return popup;
  },
  
  loading: function(){
    $('#load').show();
  },
  loaded: function(){
    $('#load').hide();
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
    //console.log('text',text);
      
      var keys = text.split(' ');
      
      for (k in keys) {
        keys[k] = keys[k].toLowerCase();  //format keys.  Best move this to postBlob

        if (keys[k] == '' || keys[k].indexOf('http') != -1) {
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
    //console.log('blobbing data tree', data);
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
      postBlob:postBlob.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/g, ''),
      commentBlob: commentBlob.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/g, '')
    };
  },
  
  /*
    control function for returning sorted array for
    keys in fb response data object
  */
  popularKeys:  function(data){
    try{
      var blob = this.postBlob(data);
      console.log(blob);
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
  },
  /*
    Returns array of keywords in keyword wrap on page.
  */
  keyWordQuery: function(){
    var keywords = [];
  
    $('.keyword').each(function(){
      if (!($(this).parents('.inputWrap').attr('id') == 'keywordTemplate')){
        
        keywords.push($(this).val());
      }
    });
    
    return keywords;
  }
}