var request = require('request');
var Lazy = require('lazy');
var fs = require('fs');
var JSONStream = require('JSONStream');
var es  = require('event-stream');
var cheerio = require('cheerio');

var csvWriter = require('csv-write-stream')
var writer = csvWriter({ headers: ["Company Name", "Home Page", "Video Service"]});

// input file source
var companies_file = './tmp/organizations.json';
//var inputFile = './tmp/searched_container.txt';  // export file source
var inputFile = './tmp/searched_container.csv';

writer.pipe(fs.createWriteStream(inputFile));


// Empty file content
fs.writeFile(inputFile, '');
var searchindContent = [
  '//youtube', '//vimeo', '.mp4', '.ogg', '.webm', '//www.youtube', '//www.vimeo', '<video', 'video'
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
      var isVideoContainer = false;

      // $('body').filter(function() {
      //   var content = $(this);
      // });

      searchindContent.forEach( function(item) {
        if( searchingWord( $, item ) ) isVideoContainer = true;
      });

      if( isVideoContainer ) {
      
        
        var inputRow = [ data.name, data.homepage_url , 'Youtube Service'] ;

        writer.write(inputRow);

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
