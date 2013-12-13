var PublicTrending = {
  keys : [],
  IDs : {},
  chain: 0,
  executed:false,
  
  //quick & crappy solution.  Checks if all getLikes responses have returns and executes callback.
  //returns keys and IDs
  /*
  Test whole thing with this command:
  
  PublicTrending.getTrending(lastbatch, function(keys, ids){
    console.log('keys: ', keys);
    console.log('ids ', ids);
  });
  */
  executeChain: function(callback){
    if (this.executed) return;
    var inter;
    clearInterval(inter); //safety check
    
    inter = setInterval(function(){
      if (PublicTrending.chain == 0) {
        callback(PublicTrending.keys, PublicTrending.IDs);
        PublicTrending.executed = false;
        clearInterval(inter);
      }
    },75);
    this.executed = true;
  },

  //Calculates trendVal from a given date string
  getTrendVal: function(date){
    var current = new Date();
    var d = new Date(date);
    var diff = (current.getTime() - d.getTime());
    return 5000000000/diff;
  },

  getLikes: function(str, callback, chainCb){ //feel free to delete the callback function I have... I was testing things out. lines 83 and 89
    var temp = str.replace("https://graph.facebook.com/",''),
        temp = temp.substr(0, temp.indexOf("/"));
        
    this.chain++;
    if(temp == str){
      console.log("error, could not retrieve ID string");
      return "-1";
    }else{
      FB.api('/' + temp, function(res){
        callback(temp, res.likes);
        PublicTrending.chain--;
      });
    }
    //should log when responses are done.
    this.executeChain(chainCb);
    return temp;
  },

  //Calculates percent engagement given likes and totalLikes
  getPercentEng: function(likes, comments, shares, totalLikes){
    return((likes + comments + shares)/totalLikes);
  },

  inArr: function(val){
    for(var i=0;i<this.keys.length;i++){
      if(PublicTrending.keys[i].keyword === val){  //forgot this.
        return i;
      }
    }
    return -1;
  },

  //Compiles all posts from pages with a certain keyword and returns a
  //object with keys:keywords and values:trendVal,totalPercentEng,count
  //trendVal gives higher weighting to keywords used more often that
  //are more recent
  getTrending: function(data, callback){
    var id = "";
        index = -1,
        likes = 0,
        shares = 0,
        comments = 0,
        word = "",
        temp = {};
        
    console.log(data);
    //each page
    for(obj in data){     //JS doesn't do loops like python
      
      var o = data[obj];    //my fix
      
      //console.log('forloop1 ', obj);
      for(post in data[obj].data){    //each post
        
        var p = data[obj].data[post];
        
        if(p.hasOwnProperty("message")){    //e
          arr = Data.popularKeys([p]).posts;
          likes = p.likes ? p.likes.summary.total_count : 0;  //conditional statement
          comments = p.comments ? p.comments.summary.total_count : 0;
          shares = p.shares || 0;
          
          if(arr !== undefined){
            arr.forEach(function(w){
              word = w[0];
              index = PublicTrending.inArr(word);   //forgot this. keyword
              if(index > 0){
                temp = PublicTrending.keys[index];

                temp.trendVal += PublicTrending.getTrendVal(p.created_time);
                temp.count += 1;
                id = PublicTrending.getLikes(o.paging.next, function(id, totalLikes){
                  PublicTrending.IDs[id] = totalLikes;
                  temp.totalReception += likes + comments + shares;
                  temp.avgEng = temp.totalReception / temp.count;
                }, callback);   //forgot a lot of quotes haha. changed to dot syntax.
              }else{
                id = PublicTrending.getLikes(o.paging.next, function(id, likes){
                  PublicTrending.IDs[id] = likes;
                }, callback);
                temp = {
                  keyword : word,
                  trendVal : PublicTrending.getTrendVal(p.created_time),
                  count : 1,
                  totalReception : likes + comments + shares,
                }
                PublicTrending.keys.push(temp);
              }
              Data.mergeKeywordData(temp, id, likes, comments, shares, post["message"]);
            });
          }
        }
      }
    }
    this.keys.sort(function(a,b){
      return a.trendVal - b.trendVal;
    });
    return this.keys;
  }
};



var Request = {
  keys : [],
  IDs : [],
  /*
    Retrieves all posts from pages with a certain keyword
    Appends array of posts objects under key
    
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
      var url = '/search?q=' + params.query + '&type='+params.object;
      if (params.object == 'page') {
        url += '&fields=best_page';
      }
      FB.api(url, function(res){
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
    @param since - unix timestamp to restrict query 
  */
  batchByID: function(params, callback){
    params = params || {};
    callback = callback || function(e){console.log('Warning: no callback specified.')};
    var batch = [];
    for (var i in params.IDs) {
      var url = params.IDs[i] + '/posts?fields=likes.summary(true),comments.summary(true),message,name,status_type,shares';
      if (params.since) url +=  '&since=' + params.since 
      batch.push({
        method:'GET',
        relative_url:url,
        summary:1
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
    kw.find('input.keywordQuery').val(keyword);
    //kw.find('input.keywordQuery').attr('readonly',true);
    
    $('#keywordWrap').prepend(kw);
  },
  
  /* clear key words enterd in query table*/
  clearKeyWords: function(){
    $('.keywordQuery').each(function(){
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
    $('#popupSpace').find('.popup').remove();
    var popup = $($('#popupTemplate').html());
    popup.find('.title').html(title);
    popup.find('.message').html(message);
    
    if (options.error) 
      popup.find('.title').addClass('red');
    
    if (options.white) {
      popup.css('background','white');
      popup.css('color','black');
    }
    $('#popupSpace').append(popup);
    popup.show('fast');
    
    setTimeout(function(){
      if (options.millis) {
        popup.hide('fast');
      }
    }, options.millis || 0);
    
    return popup;
  },
  
  loading: function(params){
    params = params || {};
    $('#load').show();
    if (params.message) {
      $('#loadMsg').html(params.message);
    }
  },
  loaded: function(){
    $('#loadMsg').html('');
    $('#load').hide();
  },

  /* Add a trend as an entry to result table
   
    *Make sure the keys match obj.
    
    @param trends - array
  */
  addTrends: function(params){
    params = params || {};
    var html;
    if ($('#noResults').length) $('#noResults').hide();
    for (var i in params.trends) {
      html = '<tr class="trendEntry">' +
                    '<td><strong class="keyword trend clicker">' + params.trends[i].keyword + '</strong></td>' +
                    '<td class="heyoPoints"> ' + params.trends[i].trendVal + ' </td>' + //heyo points
                    '<td class="engagement"> ' + params.trends[i].avgEng + '% </td>' +
              '</tr>';
      $('#trendBody').append(html);
    }
    return html;
  },
  /*
    Wipe the trends in trend table.
  */
  clearTrends: function(){
    $('.trendEntry').remove();
    $('#noResults').show('fast');
    return 1;
  },
  
  /*
    Show trending posts in popup
    
    *Set postArray equal to array containing all posts.
    
    @pOptions - same options for popup.
  */
  showPosts: function(key, pOptions){
    pOptions = pOptions || { white: true };
    //Set this to correct path.
    var postArray = Data.trendPosts;
    
    if (!postArray[key]) {
      console.log('key doesn\'t exist');
      return {};
    }
    var table = $($('#trendPostTemplate').html());
    for (var i in postArray[key]) {
      postArray[key][i] = postArray[key][i] || {};
      var message = postArray[key][i].message,
          message = message ? message : '';
      var comments = postArray[key][i].comment_count,
          comments = comments ? comments : 0;
      var likes = postArray[key][i].like_count,
          likes = likes ? likes : 0;
      var html = '<tr class="trendPost">' +
                    '<td><strong>' + message + '</strong></td>' +
                    '<td class="comments"> ' + comments + ' </td>' +
                    '<td class="likes"> ' + likes + ' </td>' +
                  '</tr>';
      table.append(html);
    }
    this.popup('Trending Posts for '+key, table, pOptions);
    return table;
  },
  
  //testing
  testTrends: function(){
    var entry;
    var trends = [];
    for (var i = 0; i <6; i++){
      trends.push({keyword: 'test'+i, avgEng:i, trendVal:Math.floor(Math.random() * 150)});
      Data.trendPosts['test'+i] = [];
        for (var n=0; n<5; n++){
          Data.trendPosts['test'+i].push( {
            message: 'a message for test'+i+' and post'+n,
            like_count:Math.floor(Math.random() * 250),
            comment_count:Math.floor(Math.random() * 50)
          });
      }
    }
    this.addTrends({trends:trends});
    return trends;
  }
  
};

Data = {
  stopWords:[],
  trendPosts : {},
  /*
    Finds popular words for given blob of text.
    Sorts by frequency.  No duplicates.
    Ignores words in stopWords array.
  */

  mergeKeywordData: function(data, id, likes, comments, shares, message){
    if(!Data.trendPosts.hasOwnProperty(data.keyword)){
      Data.trendPosts[data.keyword] = [];
    }
    Data.trendPosts[data.keyword].push({
      message: message,
      avgEng: data.avgEng, //Heyo Points
      likes: likes,
      url: "http://facebook.com/" + id,
      comments: comments,
      shares: shares
    });
    Data.trendPosts[data.keyword].sort(function(a,b){
      return a.avgEng - b.avgEng;
    });
    if(Data.trendPosts[data.keyword].length > 10){
      Data.trendPosts[data.keyword].splice(10, 1);
    }
  },
   
  sortText:function(text){  
    var mKeys = [];
    var found = false;
    //console.log('text',text);
      
      var keys = text.split(' ');
      
      for (k in keys) {
        keys[k] = keys[k].toLowerCase();  //format keys.  Best move this to postBlob
        //if (!keys[k])continue;
        var cases = keys[k] == '' ||
                    this.stopWords.indexOf(keys[k]) != -1 ||
                    keys[k].indexOf('http') != -1 ||
                    keys[k].indexOf('www') != -1;
                    
        if (cases) continue;
        
        
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
      var postKeys = this.sortText(blob.postBlob);
      console.log(postKeys);
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
    Returns array of query keywords in keyword wrap on page.
  */
  keyWordQuery: function(){
    var keywords = [];
  
    $('.keywordQuery').each(function(){
      if (!($(this).parents('.inputWrap').attr('id') == 'keywordTemplate')){
        
        keywords.push($(this).val());
      }
    });
    
    return keywords;
  }
};
