var request = require('request');
var Lazy = require('lazy');
var fs = require('fs');
var JSONStream = require('JSONStream');
var es  = require('event-stream');
var cheerio = require('cheerio');

var csvWriter = require('csv-write-stream')
var writer = csvWriter({ headers: ["Company Name", "Home Page", "Video Service"]});

// input file source
//var companies_file = './tmp/organizations.json';
var companies_file = './tmp/test_org.json';
//var inputFile = './tmp/searched_container.txt';  // export file source
var inputFile = './tmp/searched_container.csv';

const YOUTUBE = 'youtube';
const VIMEO   = 'vimeo';
const WISTIA  = 'wistia';
const KULTURA = 'kultura';
const JWPLAYER = 'jwplayer';
const VIDEOJS = 'videojs';

writer.pipe(fs.createWriteStream(inputFile));


// Empty file content
fs.writeFile(inputFile, '');
var searchindContent = [
  '//youtube', '//vimeo', '.mp4', '.ogg', '.webm', '//www.youtube', '//www.vimeo', '<video'
];


// Open file stream
var fileStream = fs.createReadStream( companies_file, {encoding: 'utf8'});

// Go throught file objects
fileStream.pipe(JSONStream.parse('root.*')).pipe(es.through( function(data) {
  //console.log('printing one company'); console.log(data);
  this.pause();
  // Call functions which is responsible for checking content
  processCrawlingCustomer( data, this );
  return data;
}, function end() {
  writer.end();
  console.log('Stream reading ended');
  console.log('File successfully written! - Check your project directory for the "'+ inputFile  +'" file');
  this.emit('end');
}));

function processCrawlingCustomer(data, es ) {

  request(data.homepage_url, function(error, response, html) {

    if( !error && response.statusCode === 200 ) {
      
      var $ = cheerio.load(html);
      var isVideoContainer = true;
      var serviceProvider = '';

      // $('body').filter(function() {
      //   var content = $(this);
      // });

      switch ( searchingVideoContetn($) ) {
        case YOUTUBE:
          serviceProvider = 'YOUTUBE'; 
          break;
        case VIMEO:
          serviceProvider = 'VIMEO';
          break;
        case WISTIA:
          serviceProvider = "WISTIA";
          break;
        case KULTURA:
          serviceProvider = 'KULTURA';
          break;
        case JWPLAYER:
          serviceProvider = 'JWPLAYER';
          break;
        case VIDEOJS:
          serviceProvider = 'VIDEOJS';
          break;
        default:
          serviceProvider = 'Unknow';
          isVideoContainer = false;
          break;
      }

      searchindContent.forEach( function(item) {
        if( searchingWord( $, item ) ) isVideoContainer = true;
      });

      if( isVideoContainer ) {
        
        var inputRow = [ data.name, data.homepage_url , serviceProvider ] ;
        
        writer.write(inputRow);

        console.log('File successfully updated! - Content "' + inputRow + '"');

        // If plan use raw txt uncomment below code
        // var inputText = data.name + '(' + data.homepage_url + ')' ;
        // fs.appendFile( inputFile, inputText + '\r\n' , function(err) {
        //   if(!err)
        //     console.log('File successfully updated! - Content "' + inputText + '"');
        //   else
        //     console.log('Error during writing!'+ err.toString());
        // });
      
      } else {
        console.log('No video content in ' + data.homepage_url );
      }
      es.resume();
    }
    else
      es.resume();
  });
}

function searchingWord( $, word ) {
  var bodyText = $('html > body').text().toLowerCase();

  if(bodyText.indexOf(word.toLowerCase()) !== -1) {
      return true;
    }
  return false;
}

function searchingVideoContetn( $ ) {
  
  var body = $('html > body');
  
  if( body.text().toLowerCase().indexOf('//www.youtube'.toLocaleLowerCase()) !== -1
      || body.text().toLowerCase().indexOf('//youtube'.toLocaleLowerCase()) !== -1 
      || $(body).find('[src*="//www.youtube"]').length > 0 || $(body).find('[src*="//.youtube."]').length > 0 
      || $(body).find('[src*="//youtu.be"]').length > 0 || $(body).find('[src*="//www.youtu.be"]').length > 0 ) {
    return YOUTUBE;
  } else if( $(body).find('[src*="//player.vimeo.com"]').length > 0 || $(body).find('[src*="vimeocdn.com/video"]').length > 0 ) {
    return VIMEO;
  } else if( $(body).find('[src*="fast.wistia.com"]').length > 0 ) {
    return WISTIA;
  } else if( $(body).find('[src*="cdnapi.kaltura.com"]').length > 0 ) {
    return KULTURA;
  } else if( $(body).find('[src*="//content.jwplatform.com"]').length > 0  
      || ( body.text().toLowerCase().indexOf('jwplayer.js'.toLocaleLowerCase()) !== -1 
            && body.text().toLowerCase().indexOf('jwplayer('.toLocaleLowerCase()) !== -1) 
      || $(body).find('[src*="//jwpsrv.com"]').length > 0) {
    return JWPLAYER;
  } else if( $(body).find('video > source[src*=".mp4"]').length > 0 || $(body).find('video > source[src*=".webm"]').length > 0 
        || $(body).find('video > source[src*=".ogv"]').length > 0 ) {
    return VIDEOJS;
  }

  return false;

}
