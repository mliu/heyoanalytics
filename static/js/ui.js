
/*
    Functionality responsible for the UI of the app.
    
    Implemented in control.js
    
*/

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
    $('#getPosts').prop("disabled",true);
    if (params.message) {
      $('#loadMsg').html(params.message);
    }
  },
  loaded: function(){
    $('#getPosts').prop("disabled",false);
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
                    '<td><strong class="keyword trend clicker">' +  params.trends[i].keyword + '</strong></td>' +
                    '<td class="heyoPoints"> ' + Math.round(params.trends[i].trendVal*1000)/1000 + ' </td>' + //heyo points
                    '<td class="Reception"> ' + Math.round(params.trends[i].avgEng*1000)/1000 + ' </td>' +
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
    var oKey = key;
    var postArray = Data.posts;
    
    if (!postArray[oKey]) {
      console.log('key doesn\'t exist');
      return {};
    }
    var table = $($('#trendPostTemplate').html());
    for (var i in postArray[oKey]) {
      postArray[oKey][i] = postArray[oKey][i] || {};
      var message = postArray[oKey][i].message,
          message = message ? message : 'Link';
      var comments = postArray[oKey][i].comments,
          comments = comments ? comments : 0;
      var likes = postArray[oKey][i].likes,
          likes = likes ? likes : 0;
      var url = postArray[oKey][i].url,
          url = url ? url : '#';
      var html = '<tr class="trendPost">' +
                    '<td><a href="'+ url+'" target="_blank"><strong>' + message + '</strong></a></td>' +
                    '<td class="comments"> ' + comments + ' </td>' +
                    '<td class="likes"> ' + likes + ' </td>' +
                  '</tr>';
      table.append(html);
    }
    this.popup('Trending Posts for '+oKey, table, pOptions);
    return table;
  },
  
  //testing UI functions
  testTrends: function(){
    var entry;
    var trends = [];
    for (var i = 0; i <6; i++){
      trends.push({keyword: 'test'+i, avgEng:i, trendVal:Math.floor(Math.random() * 150)});
      Data.posts['test'+i] = [];
        for (var n=0; n<5; n++){
          Data.posts['test'+i].push( {
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