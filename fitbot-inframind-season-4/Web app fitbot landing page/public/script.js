//function for fitbit animation after logged in 

$(document).ready(function(){
  var currSlide = 0;
  var maxSlides = 5;
  var size = 100;
  
  $('.fitbit button').click(function() {
    
    currSlide++;
    
    $('.slide').removeClass('active');
    setTimeout(function(){
      $('.slider').css({'transform': 'translatex(-' + (size * currSlide) + 'px)'});
      $('.slide:nth-child(' + (currSlide + 1) + ')').addClass('active');  
    }, 1000);
    
    if(currSlide === maxSlides)
      currSlide = 0;
  });
  
});