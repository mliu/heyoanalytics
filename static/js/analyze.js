var Trending = {
  keys : [],
  finalKeys : [],
  IDs : {},
  chain: 0,
  executed:false,
  
  //quick & crappy solution.  Checks if all getLikes responses have returns and executes callback.
  //returns keys and IDs
  /*
  Test whole thing with this command:
  
  Trending.getTrending(lastbatch, function(keys, ids){
    console.log('keys: ', keys);
    console.log('ids ', ids);
  });
  */
  executeChain: function(callback){
    if (this.executed) return;
    var inter;
    clearInterval(inter); //safety check
    
    inter = setInterval(function(){
      if (Trending.chain == 0) {
        callback(Trending.keys, Trending.IDs);
        Trending.executed = false;
        clearInterval(inter);
      }
    },75);
    this.executed = true;
  },

  //Calculates trendVal from a given date string
  trendVal: function(date){
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
        Trending.chain--;
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

  keyExists: function(val){
    for (var i in this.keys) {
      if(this.keys[i].keyword === val){  //forgot this.
        return i;
      }
    }
    return -1;
  },

  merge: function(data){
    console.log("merging");
    /*for(obj in data){
      var o = data[obj];
      if(obj > 0){
        if(o.trendVal == this.finalKeys[this.finalKeys.length-1].trendVal){
                                                                      //why are you doing this?
          this.finalKeys[this.finalKeys.length-1].keyword += " " + o.keyword;
        }else{
          this.finalKeys.push(o);
          this.finalKeys[this.finalKeys.length-1].oKey = o.keyword;   //why save this value twice?
        }
      }else if(obj == 0){
        this.finalKeys.push(o);                                       //repeating code
        this.finalKeys[this.finalKeys.length-1].oKey = o.keyword;
      }
    }*/
  },

  //Compiles all posts from pages with a certain keyword and returns a
  //object with keys:keywords and values:trendVal,totalPercentEng,count
  //trendVal gives higher weighting to keywords used more often that
  //are more recent
  get: function(data, callback){
    var temp = {};
        
    //console.log(data);
    //each page
    for(obj in data){     
      
      var o = data[obj];
      
      if (o.paging) {
        var id = Trending.getLikes(o.paging.next, function(id, totalLikes){
          Trending.IDs[id] = totalLikes;
        }, callback);
      }
      
      //each post
      for(post in data[obj].data){    
        
        var p = data[obj].data[post];
        
        if(p.hasOwnProperty("message")){    
          words = Data.popularKeys([p]).posts;
          
          var likes = p.likes ? p.likes.summary.total_count : 0,
              comments = p.comments ? p.comments.summary.total_count : 0,
              shares = p.shares ? p.shares.count : 0;
          
          if(!words) continue;
          //each word
          words.forEach(function(w){
            var word = w[0];
            var index = Trending.keyExists(word);   
            if(index >= 0){
              temp = Trending.keys[index];

              temp.trendVal += Trending.trendVal(p.created_time);
              temp.count += 1;
              
              temp.totalReception += likes + comments + shares;
              temp.avgEng = temp.totalReception / temp.count;
              Trending.keys[index] = temp;
            }else{

              temp = {
                keyword : word,
                trendVal : Trending.trendVal(p.created_time),
                count : 0, 
                avgEng : 0,
                totalReception : likes + comments + shares,
              }
              Trending.keys.push(temp);
            }
            
            var data = {
                      message: p.message,
                      avgEng: temp.avgEng, //Heyo Points
                      likes: likes,
                      url: "http://facebook.com/" + id,
                      comments: comments,
                      shares: shares
                    };
            // save post for keyword.
            Data.save({type:'posts', data:data, keyword:word, sort:'avgEng'});
          });
          
          
        }
      }
    }
    return this.sort({by:'trendVal', reverse:false});
  },
  
  /*
    Sorts the existing keys.
    
    @param by - string indicating what attribute to sort by.
                Must be a number.
    @param reverse - bool to switch sort order.
  */
  sort: function(params){
    params = params || {};
    if (params.reverse) {
      this.keys.sort(function(b,a){
        return b[params.by] - a[params.by];
      });
    }else{
      this.keys.sort(function(a,b){
        return b[params.by] - a[params.by];
      });
    }
    //this.merge(this.keys);
    //return this.finalKeys;
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
      if (params.object == 'page') url += '&fields=best_page';
      
      FB.api(url, function(res){

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
        parsed.push((p));
      }
      callback(parsed);
    });
  }
};
  



Data = {
  stopWords:[],
  posts : {},
  
  /*
    Responsible for saving any data dynamically
    
    @param type: the name of data being stored -string
    @param data:  the data to be saved or added to type if exists. - obj
    @param keyword:  the key for new data to be added - string
    @param sort: indicate a value in data to sort by - value
    
  */
  testwords:[],
  testfreq:{},
  save: function(params){
    params = params || {};
    if (params.keyword && this.testwords.indexOf(params.keyword) != -1) {
        this.testfreq[params.keyword].freq++;
    }else{
      this.testwords.indexOf(params.keyword);
      this.testfreq[params.keyword] = {freq:0};
    }
    if (!this[params.type]) {
      if (!params.type) {
        console.log('Error: no data type given for data.save().'); return;
      }
      this[params.type] = {};
    }
    if(!this[params.type].keyword){
      this[params.type][params.keyword] = [];
    }
    this[params.type][params.keyword].push(params.data);
    if (params.sort) {
      Data[params.type][params.keyword].sort(function(a,b){
        return a[params.sort] - b[params.sort];
      });
    }
    /*if(this[params.type][data.keyword].length > 10){
      Data.trendPosts[data.keyword].splice(10, 1);
    }*/
  },
   
  /*
    Finds popular words for given blob of text.
    Sorts by frequency by disabling duplicate variable.
    Ignores words in stopWords array.
  */
  sortText:function(text){  
    var mKeys = [];
    var found = false;
    var duplicates = true;
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
        if (!duplicates) {
    
          for (i in mKeys) {
            if (mKeys[i][0] == keys[k]) {
              mKeys[i][1]++;
              var found = true;
              break;
            }
          }
        }
        // add key if it doesn't
        if (!found && duplicates){
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
