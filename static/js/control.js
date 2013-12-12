/*
    Implementation of the sites functionality e.g. analyze
*/

//event listener for getting keywords from user pages
$(document).on('click', '.page', function(){
    var days = parseInt($('#days').val());
    days = days || 365;
    var id = this.id.replace('page', '');
    var since = Math.floor((new Date().getTime() - 1000*60*60*24*days)/1000);
    UI.loading();
    Request.pullByID({id:id, since:since}, function(data){
        UI.loaded();
        var limit = 3;
        var keys = Data.popularKeys(data);
        UI.clearKeyWords();
        if (!keys.posts.length) {
            if (!keys.comments.length) {
                UI.popup('Out of keywords', 'We ran out of keywords to find on that page.',{millis:5000});
            }else{
                keys.posts = keys.comments;
            }
        }
        console.log('popular words for posts are');
        for (i in keys.posts) {
            console.log(keys.posts[i][1], keys.posts[i][0]);
            Data.stopWords.push(keys.posts[i][0]);
            UI.addKeyWord(keys.posts[i][0]);
            if (i >= limit) break;
        }

    });
  
});


//add a keyword for search.
$(document).on('click', '.glyphicon-ok', function(){
    var input = $(this).siblings('input.keywordQuery');
    var kw = $.trim(input.val());
    if (kw == '') return;
    input.val('');
    UI.addKeyWord(kw);
});

//remove a keyword for search.
$(document).on('click', '.glyphicon-remove', function(){
    var wrap = $(this).parents('.inputWrap');
    var input = $(this).siblings('input.keyword');
    input.val('');
    if (wrap.attr('id') == 'keywordTemplate') return;    //don't remove template.
    var animate = 300;
    wrap.hide(animate);
    setTimeout(function(){ wrap.remove() }, animate);
});

//close a popup
$(document).on('click', '.closePopup', function(){
    $(this).parents('.popup').remove();
});

//show posts for trending keyword in popup
$(document).on('click mouseover', '.trend', function(){
    var keyword = $(this).text();
    console.log('trend fire ', keyword);
    UI.showPosts(keyword);
});

//get posts on crunch button
$(document).on('click', '#getPosts', function(){
    var keywords = Data.keyWordQuery();
    if (!keywords.length) {
        UI.popup('No Keywords',
                 'We don\'t know where to look without keywords.',
                 {millis:4500, error:true});
        $('#keywordTemplate').find('input').focus();
        return;
    }
    
    var object = $('#objectType').val();
    var timeSince = parseInt($('#timeSince').val())*60*60*1000; //hr to ms
    
    var query = '';
    for (k in keywords)
        query += ' ' + keywords[0];
        
    UI.loading();
    var objLimit = 12;
    var objIds = [];
    
    Request.pullByKeyword({
        query:query,
        object:object
        },
        function(objects){
            console.log('objects returned ', objects);
            for (i in objects){
                if (!objects[i].id) continue;
                
                objIds.push(objects[i].id);
                
                if (i >= objLimit) {
                    Request
                    break;
                }
            }
            //another async call
            Request.batchByID({IDs:objIds, since:timeSince}, function(data){
                UI.loaded();
                console.log('got batch back ', data);
            });
        }
    );
    
    
});
